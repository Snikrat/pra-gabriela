import {
  doc,
  collection,
  getDoc,
  setDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { dayKeySP, dayKeyAddDays } from "./time.js";
import {
  makeId,
  normEmail,
  noteKeyForMatch,
  NOTE_ACTIVE_WINDOW_MS,
  DELETE_WINDOW_MS,
  firstNameFromUser,
  onlyExpiredNotes,
} from "./rules.js";

const SHARED_ID = "pra-gabriela-shared";
export const JAR_PAGE_SIZE = 24;

export function sharedDaysCol() {
  return collection(db, "shared", SHARED_ID, "days");
}

export function sharedDayDoc(key) {
  return doc(db, "shared", SHARED_ID, "days", key);
}

export function normalizeDayData(data, key) {
  const safe = data && typeof data === "object" ? { ...data } : {};
  safe.key = safe.key || key;
  safe.notes = Array.isArray(safe.notes) ? safe.notes : [];
  if (!safe.revealedBy || typeof safe.revealedBy !== "object") safe.revealedBy = {};
  return safe;
}

export async function fetchDayFromDB(key) {
  const snap = await getDoc(sharedDayDoc(key));
  return snap.exists() ? snap.data() : null;
}

async function fetchDayNormalized(key) {
  const snap = await getDoc(sharedDayDoc(key));
  if (!snap.exists()) return normalizeDayData(null, key);
  const data = snap.data() || {};
  return normalizeDayData({ ...data, key: data.key || snap.id }, key);
}

export async function upsertDayToDB({ key, notes, revealedBy }) {
  await setDoc(
    sharedDayDoc(key),
    {
      key,
      notes: Array.isArray(notes) ? notes : [],
      revealedBy: revealedBy && typeof revealedBy === "object" ? revealedBy : {},
      savedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function listDaysFromDB() {
  const snap = await getDocs(sharedDaysCol());
  return snap.docs.map((d) => {
    const data = d.data() || {};
    return { ...data, key: data.key || d.id, _id: d.id };
  });
}

/* paginação (potinho) — busca por páginas ordenadas por key */
export async function listDaysPage({ pageSize = JAR_PAGE_SIZE, cursorKey = null, sortOrder = "desc" } = {}) {
  const col = sharedDaysCol();
  const q = cursorKey
    ? query(col, orderBy("key", sortOrder), startAfter(String(cursorKey)), limit(pageSize))
    : query(col, orderBy("key", sortOrder), limit(pageSize));

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => {
    const data = d.data() || {};
    return { ...data, key: data.key || d.id, _id: d.id };
  });

  const last = items.length ? items[items.length - 1] : null;
  const nextCursor = last?.key || null;

  return { items, nextCursor, hasMore: items.length === pageSize };
}

/**
 * Igual a listDaysPage, mas só devolve dias que realmente têm post-its
 * "expirados" (os que aparecem no potinho). Como esse filtro é por
 * conteúdo do array (não dá pra fazer isso numa query do Firestore),
 * ele varre páginas cru e vai avançando o cursor até juntar `pageSize`
 * dias válidos ou acabarem os documentos — com um teto de buscas pra
 * não sair varrendo o banco inteiro se houver uma sequência longa de
 * dias vazios.
 */
export async function listQualifyingDaysPage({ pageSize = JAR_PAGE_SIZE, cursorKey = null, sortOrder = "desc" } = {}) {
  // busca um lote bem maior que o pageSize por vez — reduz o número de
  // idas e vindas sequenciais ao banco quando há muitos dias vazios
  // (ex: dias em que o app foi aberto mas ninguém escreveu nada) entre
  // os dias que realmente têm post-its
  const RAW_BATCH = Math.max(pageSize * 4, 80);
  const MAX_FETCHES = 6;
  const qualifying = [];
  let cursor = cursorKey;
  let hasMore = true;

  for (let i = 0; i < MAX_FETCHES && qualifying.length < pageSize && hasMore; i++) {
    const page = await listDaysPage({ pageSize: RAW_BATCH, cursorKey: cursor, sortOrder });
    hasMore = page.hasMore;
    cursor = page.nextCursor;

    for (const item of page.items) {
      const notes = onlyExpiredNotes(item?.notes);
      if (notes.length) qualifying.push({ ...item, notes });
    }
  }

  return { items: qualifying, nextCursor: cursor, hasMore };
}

export async function ensureSavedTodayDB() {
  const key = dayKeySP();
  const existing = await fetchDayFromDB(key);
  if (existing) return normalizeDayData(existing, key);

  await upsertDayToDB({ key, notes: [], revealedBy: {} });
  const fresh = await fetchDayFromDB(key);
  return normalizeDayData(fresh, key);
}

export async function refreshTodayFromDB() {
  const key = dayKeySP();
  const fresh = await fetchDayFromDB(key);
  return normalizeDayData(fresh, key);
}

/**
 * Assina o documento do dia em tempo real: qualquer post-it novo, revelação
 * ou resposta (da própria pessoa ou de quem divide o app) chega direto pro
 * callback, sem precisar recarregar a tela. Retorna a função de unsubscribe.
 */
export function subscribeToDay(key, onData) {
  return onSnapshot(
    sharedDayDoc(key),
    (snap) => {
      const data = snap.exists() ? snap.data() : null;
      onData(normalizeDayData(data, key));
    },
    (err) => {
      console.error("subscribeToDay error:", err);
    }
  );
}

/**
 * Notas "ativas" (últimas 24h) considerando hoje + ontem no fuso de SP,
 * já que uma nota criada perto da meia-noite pode continuar ativa no dia seguinte.
 */
export async function fetchActiveNotes() {
  const now = Date.now();
  const todayKey = dayKeySP();
  const yesterdayKey = dayKeyAddDays(todayKey, -1);

  const [todayData, yData] = await Promise.all([
    fetchDayNormalized(todayKey),
    yesterdayKey === todayKey
      ? Promise.resolve(normalizeDayData(null, yesterdayKey))
      : fetchDayNormalized(yesterdayKey),
  ]);

  const days = [todayData, yData].filter(Boolean);
  const out = [];
  const byDay = {};

  for (const d of days) {
    const dk = String(d?.key || d?._id || d?.id || "");
    if (!dk) continue;
    byDay[dk] = d;
    const notes = Array.isArray(d?.notes) ? d.notes : [];
    for (const n of notes) {
      const created = Number(n?.createdAtMs || 0);
      if (!created) continue;
      if (now - created < NOTE_ACTIVE_WINDOW_MS) {
        out.push({ ...n, _dayKey: dk });
      }
    }
  }

  out.sort((a, b) => Number(a?.createdAtMs || 0) - Number(b?.createdAtMs || 0));
  return { activeNotes: out, activeNotesByDay: byDay };
}

export function getRevealedSetForUser(dayData, user) {
  const email = normEmail(user?.email);
  if (!email) return new Set();

  const rb = dayData?.revealedBy;
  const list = rb && typeof rb === "object" ? rb[email] : null;
  return new Set(Array.isArray(list) ? list.map(String) : []);
}

/* salva "revelado" por usuário (por id) */
export async function markRevealedForUser(dayKey, noteId) {
  const u = auth.currentUser;
  if (!u) return;

  const email = normEmail(u.email);
  if (!email) return;

  const key = String(dayKey || dayKeySP());
  const ref = sharedDayDoc(key);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const data = normalizeDayData(snap.data(), key);
    const rb = { ...(data.revealedBy || {}) };
    const cur = new Set(Array.isArray(rb[email]) ? rb[email].map(String) : []);

    cur.add(String(noteId));
    rb[email] = Array.from(cur);
    tx.set(ref, { revealedBy: rb, savedAt: serverTimestamp() }, { merge: true });
  });

  return noteId;
}

/* delete (transação) + limpa revealedBy de todos */
export async function deletePostItFromDay(dayKey, note) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = String(dayKey || dayKeySP());
  const ref = sharedDayDoc(key);

  const targetId = String(note?.id || "").trim();
  const targetFallback = noteKeyForMatch(note);
  if (!targetId && !targetFallback) throw new Error("nota sem id");

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("dia não existe");

    const data = normalizeDayData(snap.data(), key);
    const notes = [...data.notes];

    const idx = notes.findIndex((n) => {
      if (targetId && String(n?.id || "") === targetId) return true;
      if (!targetId && targetFallback && noteKeyForMatch(n) === targetFallback) return true;
      return false;
    });

    if (idx < 0) throw new Error("nota não encontrada");

    const found = notes[idx];
    if (normEmail(found?.createdByEmail) !== normEmail(u.email)) {
      throw new Error("não é o autor");
    }

    const created = Number(found?.createdAtMs || 0);
    if (!created || Date.now() - created > DELETE_WINDOW_MS) {
      throw new Error("tempo expirou");
    }

    const removedId = String(found?.id || targetId || "").trim();
    notes.splice(idx, 1);

    const rb = { ...(data.revealedBy || {}) };
    for (const k of Object.keys(rb)) {
      if (!Array.isArray(rb[k])) continue;
      rb[k] = rb[k].map(String).filter((x) => x !== removedId);
    }

    tx.set(ref, { key, notes, revealedBy: rb, savedAt: serverTimestamp() }, { merge: true });
  });

  return note?.id || targetId || null;
}

/* editar (transação) — mesma regra de posse/prazo do delete */
export async function editPostItInDay(dayKey, noteId, { title, finalText, color }) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = String(dayKey || dayKeySP());
  const ref = sharedDayDoc(key);

  const targetId = String(noteId || "").trim();
  if (!targetId) throw new Error("nota sem id");

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("dia não existe");

    const data = normalizeDayData(snap.data(), key);
    const notes = [...data.notes];

    const idx = notes.findIndex((n) => String(n?.id || "") === targetId);
    if (idx < 0) throw new Error("nota não encontrada");

    const found = notes[idx];
    if (normEmail(found?.createdByEmail) !== normEmail(u.email)) {
      throw new Error("não é o autor");
    }

    const created = Number(found?.createdAtMs || 0);
    if (!created || Date.now() - created > DELETE_WINDOW_MS) {
      throw new Error("tempo expirou");
    }

    notes[idx] = {
      ...found,
      title: String(title || "").trim(),
      text: String(finalText || "").trim(),
      color,
    };

    tx.set(ref, { key, notes, savedAt: serverTimestamp() }, { merge: true });
  });

  return targetId;
}

export async function addReplyToDay(dayKey, noteId, replyText) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = String(dayKey || "").trim();
  if (!key) throw new Error("dia inválido");

  const ref = sharedDayDoc(key);
  const cleanText = String(replyText || "").trim();
  if (!cleanText) throw new Error("resposta vazia");

  const reply = {
    id: makeId(),
    text: cleanText,
    createdByEmail: u.email || "",
    createdByName: firstNameFromUser(u),
    createdAtMs: Date.now(),
  };

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("dia não existe");

    const data = normalizeDayData(snap.data(), key);
    const notes = Array.isArray(data.notes) ? [...data.notes] : [];

    const targetId = String(noteId || "").trim();
    const idx = notes.findIndex((n) => String(n?.id || "") === targetId);
    if (idx < 0) throw new Error("post-it não encontrado");

    const n = { ...notes[idx] };
    const replies = Array.isArray(n.replies) ? [...n.replies] : [];
    replies.push(reply);
    n.replies = replies;
    notes[idx] = n;

    tx.set(ref, { key, notes, savedAt: serverTimestamp() }, { merge: true });
  });

  return reply;
}

export async function addPostItToToday({ title, finalText, color, todayKey }) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = String(todayKey || dayKeySP());
  const ref = sharedDayDoc(key);

  const note = {
    id: makeId(),
    emo: "📌",
    title: String(title || "").trim(),
    text: String(finalText || "").trim(),
    createdByEmail: u.email || "",
    createdByName: firstNameFromUser(u),
    createdAtMs: Date.now(),
    color,
  };

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? normalizeDayData(snap.data(), key) : normalizeDayData({}, key);
    const notes = [...data.notes, note];

    tx.set(
      ref,
      { key, notes, revealedBy: data.revealedBy || {}, savedAt: serverTimestamp() },
      { merge: true }
    );
  });

  return note.id;
}
