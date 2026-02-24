/* =========================================================
   IMPORTS
========================================================= */
import { db, auth, googleProvider } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
  limit,
  startAfter,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

/* =========================================================
   CONFIG (SHARED + ALLOWLIST)
========================================================= */
const SHARED_ID = "pra-gabriela-shared";
const TZ = "America/Sao_Paulo";

const ALLOWED_EMAILS = [
  "felippe.santosffx@gmail.com",
  "gabrielagoncalves133@gmail.com",
].map((e) => e.toLowerCase());

function isAllowedEmail(email) {
  return ALLOWED_EMAILS.includes(String(email || "").toLowerCase());
}

/* =========================================================
   DELETE RULES
========================================================= */
const DELETE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function noteKeyForMatch(note) {
  // fallback pra notas antigas sem id
  const em = normEmail(note?.createdByEmail);
  const t = Number(note?.createdAtMs || 0);
  return em && t ? `${em}|${t}` : "";
}

function canDeleteNote(note, user) {
  if (!user) return false;

  const uEmail = normEmail(user.email);
  const nEmail = normEmail(note?.createdByEmail);

  if (!uEmail || !nEmail) return false;
  if (uEmail !== nEmail) return false;

  const created = Number(note?.createdAtMs || 0);
  if (!created) return false;

  return Date.now() - created <= DELETE_WINDOW_MS;
}

/* =========================================================
   TIMEZONE HELPERS (America/Sao_Paulo)
========================================================= */
const _dtfPartsSP = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const _dtfOffsetSP = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  timeZoneName: "shortOffset",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getZonedPartsSP(date = new Date()) {
  const parts = _dtfPartsSP.formatToParts(date);
  const out = {};
  for (const p of parts) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
  };
}

function getOffsetMsSP(date = new Date()) {
  const parts = _dtfOffsetSP.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+00:00";

  const m = tzName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 0;

  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2] || 0);
  const mm = Number(m[3] || 0);

  return sign * (hh * 60 + mm) * 60 * 1000;
}

function zonedToUtcEpochSP({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const offset = getOffsetMsSP(new Date(utcGuess));
  return utcGuess - offset;
}

function dayKeySP(date = new Date()) {
  const p = getZonedPartsSP(date);
  const y = p.year;
  const m = String(p.month).padStart(2, "0");
  const d = String(p.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function msUntilNextMidnightSP() {
  const now = new Date();
  const p = getZonedPartsSP(now);

  const today00 = zonedToUtcEpochSP({
    year: p.year,
    month: p.month,
    day: p.day,
    hour: 0,
    minute: 0,
    second: 0,
  });

  const nextMidnightEpoch = today00 + 24 * 60 * 60 * 1000;
  return Math.max(250, nextMidnightEpoch - Date.now());
}

/* =========================================================
   DOM REFS
========================================================= */
const stage = document.getElementById("stage");
const envWrap = document.getElementById("envWrap");
const app = document.getElementById("app");
const board = document.getElementById("board");
const backBtn = document.getElementById("backBtn");
const sparkleLayer = document.getElementById("sparkleLayer");

/* Potinho */
const jarBtn = document.getElementById("jarBtn");
const jarModal = document.getElementById("jarModal");
const closeJar = document.getElementById("closeJar");
const jarList = document.getElementById("jarList");
const jarSearch = document.getElementById("jarSearch");

/* Dia completo */
const dayModal = document.getElementById("dayModal");
const closeDay = document.getElementById("closeDay");
const dayTitle = document.getElementById("dayTitle");
const dayMeta = document.getElementById("dayMeta");
const dayBoard = document.getElementById("dayBoard");
const backToJar = document.getElementById("backToJar");

/* Dropdowns potinho */
const monthSelectEl = document.getElementById("monthSelect");
const sortSelectEl = document.getElementById("sortSelect");
let authorSelectEl = document.getElementById("authorSelect");

/* Auth */
const authGate = document.getElementById("authGate");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userBar = document.getElementById("userBar");
const userEmailEl = document.getElementById("userEmail");

/* Criar post-it */
const createBtn = document.getElementById("createBtn");
const createModal = document.getElementById("createModal");
const createClose = document.getElementById("createClose");
const createCancel = document.getElementById("createCancel");
const createSave = document.getElementById("createSave");
const createTitle = document.getElementById("createTitle");
const createText = document.getElementById("createText");

const musicToggle = document.getElementById("musicToggle");
const musicUrl = document.getElementById("musicUrl");

/* Confirm delete */
const confirmModal = document.getElementById("confirmModal");
const confirmClose = document.getElementById("confirmClose");
const confirmCancel = document.getElementById("confirmCancel");
const confirmOk = document.getElementById("confirmOk");
const confirmText = document.getElementById("confirmText");

/* Arquivo (pill abaixo da data) */
const datePill = document.getElementById("date");
let archivePill = document.getElementById("archivePill");

function ensureArchivePill() {
  if (archivePill) return archivePill;
  // tenta anexar logo depois da pill de data
  const host = datePill?.parentElement || document.querySelector("header");
  if (!host) return null;

  const el = document.createElement("div");
  el.className = "pill";
  el.id = "archivePill";
  el.style.marginTop = "10px";
  host.appendChild(el);
  archivePill = el;
  return archivePill;
}


/* =========================================================
   STATE
========================================================= */
let openedOnce = false;

let monthFilterValue = "";
let authorFilterValue = "";
let sortValue = "desc";

let todayCache = null; // { key, notes, revealedBy }
let lastAddedNoteId = null; // animação ao salvar
const colors = ["var(--noteA)", "var(--noteB)", "var(--noteC)", "var(--noteD)"];

// cor escolhida ao criar (fica salva no post-it)
let createColorValue = colors[0];
const COLOR_PRESETS = colors.slice();

let midnightTimer = null;

/* Potinho: paginação / lazy load */
const JAR_PAGE_SIZE = 24;
let jarPagedItems = [];
let jarCursorKey = null;
let jarHasMore = true;
let jarLoading = false;
/* =========================================================
   ARCHIVE VIEW (post-its de outro dia)
========================================================= */
let archiveModeKey = null;
let _backTodayBtn = null;

let _backTodayHandler = null;
let _backTodayKeyHandler = null;

function showBackToTodayBtn() {
  if (!datePill) return;

  // garante que não duplica listeners
  hideBackToTodayBtn();

  datePill.textContent = "↩ hoje";
  datePill.classList.add("backTodayPill");
  datePill.style.cursor = "pointer";
  datePill.setAttribute("role", "button");
  datePill.setAttribute("tabindex", "0");

  _backTodayHandler = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    exitArchiveMode();
  };

  _backTodayKeyHandler = (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      _backTodayHandler(ev);
    }
  };

  datePill.addEventListener("click", _backTodayHandler);
  datePill.addEventListener("keydown", _backTodayKeyHandler);
}

function hideBackToTodayBtn() {
  if (!datePill) return;

  if (_backTodayHandler) datePill.removeEventListener("click", _backTodayHandler);
  if (_backTodayKeyHandler) datePill.removeEventListener("keydown", _backTodayKeyHandler);

  _backTodayHandler = null;
  _backTodayKeyHandler = null;

  datePill.classList.remove("backTodayPill");
  datePill.style.cursor = "";
  datePill.removeAttribute("role");
  datePill.removeAttribute("tabindex");
}


function enterArchiveMode(dayKey) {
  archiveModeKey = dayKey;

  const headlineEl = document.getElementById("headline");
  const dateEl = document.getElementById("date");

  // título grande = a data do arquivo
  if (headlineEl) headlineEl.textContent = formatDayPretty(dayKey);
  // pílula menor = contexto
  if (dateEl) dateEl.textContent = "";

  showBackToTodayBtn();
}

function exitArchiveMode() {
  archiveModeKey = null;
  hideBackToTodayBtn();

  // volta pro hoje
  setDateAndGreeting();
  renderToday();
}



/* =========================================================
   CONFIRM MODAL (animação)
========================================================= */
let _confirmResolver = null;

function openConfirmModal(message) {
  if (confirmText) confirmText.textContent = message || "tem certeza?";
  confirmModal?.classList.add("show");
  confirmModal?.setAttribute("aria-hidden", "false");

  const card = confirmModal?.querySelector(".confirmCard");
  if (card) {
    card.classList.remove("shake");
    card.classList.add("bounce");
  }
  confirmOk?.focus();
}

function closeConfirmModal() {
  confirmModal?.classList.remove("show");
  confirmModal?.setAttribute("aria-hidden", "true");

  // destaque do post-it
  _focusOverlay?.classList.remove("show", "closing", "flip");
  _focusOverlay?.setAttribute("aria-hidden", "true");
}

function shakeAndCloseConfirm(result) {
  const card = confirmModal?.querySelector(".confirmCard");
  if (card) {
    card.classList.remove("bounce");
    card.classList.add("shake");
  }
  setTimeout(() => {
    closeConfirmModal();
    _confirmResolver?.(result);
    _confirmResolver = null;
  }, 280);
}

function confirmDialog(message) {
  return new Promise((resolve) => {
    _confirmResolver = resolve;
    openConfirmModal(message);
  });
}

confirmClose?.addEventListener("click", () => shakeAndCloseConfirm(false));
confirmCancel?.addEventListener("click", () => shakeAndCloseConfirm(false));
confirmOk?.addEventListener("click", () => shakeAndCloseConfirm(true));

confirmModal?.addEventListener("click", (e) => {
  if (e.target === confirmModal) shakeAndCloseConfirm(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && confirmModal?.classList.contains("show")) {
    shakeAndCloseConfirm(false);
  }
});

/* =========================================================
   MUSIC TOGGLE
========================================================= */
musicToggle?.addEventListener("change", () => {
  const on = musicToggle.checked;
  if (!musicUrl) return;

  musicUrl.disabled = !on;
  if (on) musicUrl.focus();
  if (!on) musicUrl.value = "";
});

/* =========================================================
   DATE / HEADLINE (SP)
========================================================= */
function setDateAndGreeting() {
  const now = new Date();
  const p = getZonedPartsSP(now);

  const dateEl = document.getElementById("date");
  const headlineEl = document.getElementById("headline");

  if (dateEl) {
    const dt = new Date(zonedToUtcEpochSP({ ...p, hour: 12, minute: 0, second: 0 }));
    dateEl.textContent = dt.toLocaleDateString("pt-BR", {
      timeZone: TZ,
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  const h = p.hour;
  const saudacao = h < 12 ? "bom dia, " : h < 18 ? "boa tarde, " : "boa noite, ";
  if (headlineEl) headlineEl.textContent = saudacao + "gabriela 🤍";
}

setDateAndGreeting();

/* =========================================================
   NAV (ENVELOPE <-> POSTS)
========================================================= */

/* fecha qualquer modal/overlay antes de trocar de tela */
function closeAllModals() {
  // potinho / dia
  try { closeDayModal?.(); } catch {}
  try { closeJarModal?.(); } catch {}

  // criar post-it
  try { closeCreateModal?.(); } catch {}

  // confirm
  try { closeConfirmModal?.(); } catch {}

  // garante remoção de classes caso algum close ainda não exista
  jarModal?.classList.remove("show");
  jarModal?.setAttribute("aria-hidden", "true");

  dayModal?.classList.remove("show");
  dayModal?.setAttribute("aria-hidden", "true");

  createModal?.classList.remove("show");
  createModal?.setAttribute("aria-hidden", "true");

  confirmModal?.classList.remove("show");
  confirmModal?.setAttribute("aria-hidden", "true");
}

function goToPosts() {
  stage?.classList.add("hidden");
  app?.classList.add("show");

  // ✅ sempre re-renderiza quando entra (pra refletir “revelado por usuário”)
  renderToday();
}

function goToEnvelope() {
  closeAllModals();
  hideBackToTodayBtn();
  archiveModeKey = null;
  app?.classList.remove("show");
  stage?.classList.remove("hidden");
  envWrap?.classList.remove("open");
  openedOnce = false;

  // ❌ não força mais “tapar” no DOM
  // (porque a revelação agora é por usuário e vem do banco)
  if (sparkleLayer) sparkleLayer.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "instant" });
}

function handleOpen() {
  if (!openedOnce) {
    envWrap?.classList.add("open");
    openedOnce = true;
    return;
  }
  goToPosts();
}

/* =========================================================
   SPARKLES
========================================================= */
function spawnSparkles(x, y) {
  if (!sparkleLayer) return;

  const count = 7 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "spark" + (Math.random() < 0.35 ? " star" : "");
    s.style.left = x + "px";
    s.style.top = y + "px";

    const dx = (Math.random() * 40 - 20).toFixed(1) + "px";
    const dy = (Math.random() * 52 - 34).toFixed(1) + "px";
    s.style.setProperty("--dx", dx);
    s.style.setProperty("--dy", dy);

    const size = 8 + Math.random() * 8;
    s.style.width = size + "px";
    s.style.height = size + "px";

    sparkleLayer.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }
}


/* =========================================================
   NOTE FOCUS (destacar post-it revelado)
========================================================= */
let _focusOverlay = null;

function ensureFocusOverlay() {
  if (_focusOverlay) return _focusOverlay;

  const wrap = document.createElement("div");
  wrap.id = "noteFocus";
  wrap.className = "noteFocusOverlay";
  wrap.setAttribute("aria-hidden", "true");

  wrap.innerHTML = `
    <div class="noteFocusCard" role="dialog" aria-modal="true" aria-label="post-it">
      <button class="noteFocusClose" type="button" aria-label="fechar">fechar</button>
      <div class="noteFocusHead">
        <div class="noteFocusPin" aria-hidden="true">📌</div>
        <div class="noteFocusMeta">
          <div class="noteFocusBy" id="noteFocusBy"></div>
          <div class="noteFocusWhen" id="noteFocusWhen"></div>
        </div>
      </div>
      <h2 class="noteFocusTitle" id="noteFocusTitle"></h2>
      <div class="noteFocusText" id="noteFocusText"></div>
      <div class="noteFocusReplies">
        <div class="noteFocusRepliesTitle">respostas</div>
        <div class="noteFocusRepliesList" id="noteFocusReplies"></div>
        <div class="noteFocusReplyComposer">
          <textarea id="noteFocusReplyInput" rows="2" placeholder="responder..."></textarea>
          <button id="noteFocusReplySend" type="button">enviar</button>
        </div>
      </div>

      <div class="noteFocusActions" id="noteFocusActions"></div>
    </div>
  `;

  document.body.appendChild(wrap);


  // styles do mini-thread (injeção leve pra não depender do style.css)
  if (!document.getElementById("noteFocusThreadStyles")) {
    const st = document.createElement("style");
    st.id = "noteFocusThreadStyles";
    st.textContent = `
      .noteFocusReplies{margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08)}
      .noteFocusRepliesTitle{font-weight:800;font-size:13px;opacity:.75;margin-bottom:10px}
      .noteFocusRepliesList{display:flex;flex-direction:column;gap:10px;max-height:220px;overflow:auto;padding-right:4px}
      .noteReply{background:rgba(255,255,255,.55);border:1px solid rgba(0,0,0,.06);border-radius:14px;padding:10px 12px}
      .noteReplyMeta{font-size:11px;opacity:.72;margin-bottom:6px;display:flex;gap:8px;flex-wrap:wrap}
      .noteReplyText{font-size:14px;line-height:1.35;white-space:pre-wrap}
      .noteFocusReplyComposer{display:flex;gap:10px;margin-top:10px;align-items:flex-end}
      #noteFocusReplyInput{flex:1;resize:none;border-radius:16px;border:1px solid rgba(0,0,0,.10);padding:10px 12px;background:rgba(255,255,255,.7);outline:none}
      #noteFocusReplySend{border:0;border-radius:16px;padding:10px 14px;font-weight:800;cursor:pointer;background:rgba(255,255,255,.75)}
      #noteFocusReplySend:disabled{opacity:.55;cursor:not-allowed}
    `;
    document.head.appendChild(st);
  }


  const closeBtn = wrap.querySelector(".noteFocusClose");

  function close() {
    const card = wrap.querySelector(".noteFocusCard");
    const from = wrap._fromRect;

    // animação de volta (flip) se tiver origem
    if (card && from && wrap.classList.contains("show")) {
      wrap.classList.add("closing");

      const to = card.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const sx = from.width / Math.max(1, to.width);
      const sy = from.height / Math.max(1, to.height);

      card.style.transformOrigin = "top left";
      card.style.transition =
        "transform 320ms cubic-bezier(.2,.9,.2,1), opacity 200ms ease";
      card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      card.style.opacity = "0.2";

      window.setTimeout(() => {
        wrap.classList.remove("show", "closing", "flip");
        wrap.setAttribute("aria-hidden", "true");

        // limpa styles inline
        card.style.transition = "";
        card.style.transform = "";
        card.style.opacity = "";
        card.style.transformOrigin = "";

        wrap._fromRect = null;
      }, 340);

      return;
    }

    wrap.classList.remove("show", "closing", "flip");
    wrap.setAttribute("aria-hidden", "true");
    wrap._fromRect = null;
  }

  closeBtn?.addEventListener("click", close);
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wrap.classList.contains("show")) close();
  });

  // expose close helper
  wrap._close = close;

  _focusOverlay = wrap;
  return wrap;
}

function openNoteFocus(note, { bg = null, fromEl = null } = {}) {
  const user = auth.currentUser;
  const overlay = ensureFocusOverlay();

  const card = overlay.querySelector(".noteFocusCard");
  const titleEl = overlay.querySelector("#noteFocusTitle");
  const textEl = overlay.querySelector("#noteFocusText");
  const byEl = overlay.querySelector("#noteFocusBy");
  const whenEl = overlay.querySelector("#noteFocusWhen");
  const actionsEl = overlay.querySelector("#noteFocusActions");
  const repliesListEl = overlay.querySelector("#noteFocusReplies");
  let replyInputEl = overlay.querySelector("#noteFocusReplyInput");
  let replySendEl = overlay.querySelector("#noteFocusReplySend");

  // evita acumular listeners a cada abertura (clona os elementos)
  if (replyInputEl) {
    const c = replyInputEl.cloneNode(true);
    replyInputEl.replaceWith(c);
    replyInputEl = c;
  }
  if (replySendEl) {
    const c = replySendEl.cloneNode(true);
    replySendEl.replaceWith(c);
    replySendEl = c;
  }

  // fundo do card (usa a mesma cor do post-it)
  if (card && bg) card.style.background = bg;

  if (titleEl) titleEl.textContent = String(note?.title || "");
  if (textEl) textEl.innerHTML = String(note?.text || "");

  const by = creatorLabel(note);
  if (byEl) byEl.textContent = by ? by : "";

  const ms = Number(note?.createdAtMs || 0);
  if (whenEl) {
    whenEl.textContent = ms
      ? new Date(ms).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" })
      : "";
  }

  // ações (amassar quando permitido)
  if (actionsEl) {
    actionsEl.innerHTML = "";
    if (canDeleteNote(note, user)) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "noteFocusDel";
      del.textContent = "amassar";
      del.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const ok = await confirmDialog("quer amassar esse post-it?");
        if (!ok) return;

        try {
          await deletePostItFromToday(note);
          overlay._close?.();
          renderToday();
        } catch (e) {
          console.error(e);
          await refreshTodayFromDB();
          renderToday();
        }
      });
      actionsEl.appendChild(del);
    }
  }

  // replies (mini thread)
  const dayKey = (archiveModeKey || todayCache?.key || dayKeySP());
  const noteId = String(note?.id || "").trim();

  function renderReplies() {
    if (!repliesListEl) return;
    const list = Array.isArray(note?.replies) ? note.replies : [];
    repliesListEl.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "noteReplyMeta";
      empty.textContent = "ainda sem respostas 🤍";
      repliesListEl.appendChild(empty);
      return;
    }

    list
      .slice()
      .sort((a, b) => Number(a?.createdAtMs || 0) - Number(b?.createdAtMs || 0))
      .forEach((r) => {
        const item = document.createElement("div");
        item.className = "noteReply";

        const by = (r?.createdByName || "").trim();
        const when = Number(r?.createdAtMs || 0);
        const whenText = when
          ? new Date(when).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" })
          : "";

        item.innerHTML = `
          <div class="noteReplyMeta">
            <span>${by ? `respondido por ${escapeHtml(by)}` : ""}</span>
            ${whenText ? `<span>•</span><span>${escapeHtml(whenText)}</span>` : ""}
          </div>
          <div class="noteReplyText">${escapeHtml(r?.text || "")}</div>
        `;

        repliesListEl.appendChild(item);
      });
  }

  renderReplies();

  async function handleSendReply() {
    const txt = String(replyInputEl?.value || "").trim();
    if (!txt) return;

    if (!noteId) {
      alert("esse post-it é antigo e não tem id pra responder 🤍");
      return;
    }

    try {
      if (replySendEl) {
        replySendEl.disabled = true;
        replySendEl.textContent = "enviando...";
      }

      const reply = await addReplyToDay(dayKey, noteId, txt);

      // atualiza o objeto em memória pra refletir no modal sem reabrir
      if (!Array.isArray(note.replies)) note.replies = [];
      note.replies.push(reply);

      if (replyInputEl) replyInputEl.value = "";
      renderReplies();

      // sincroniza cache se for hoje, pra aparecer na lista também
      if (todayCache?.key === dayKey) {
        await refreshTodayFromDB();
        renderToday();
      }
    } catch (e) {
      console.error(e);
      alert("deu ruim ao responder. tenta de novo.");
    } finally {
      if (replySendEl) {
        replySendEl.disabled = false;
        replySendEl.textContent = "enviar";
      }
    }
  }

  replySendEl?.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    handleSendReply();
  });

  replyInputEl?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      handleSendReply();
    }
  });


// mostra overlay
overlay.classList.add("show", "flip");
overlay.setAttribute("aria-hidden", "false");

// animação FLIP: vem do post-it original
const fromRect = fromEl?.getBoundingClientRect?.() || null;
overlay._fromRect = fromRect;

if (card && fromRect) {
  // desliga animação padrão enquanto faz o flip
  card.style.animation = "none";
  card.style.transition = "none";
  card.style.transformOrigin = "top left";

  const toRect = card.getBoundingClientRect();
  const dx = fromRect.left - toRect.left;
  const dy = fromRect.top - toRect.top;
  const sx = fromRect.width / Math.max(1, toRect.width);
  const sy = fromRect.height / Math.max(1, toRect.height);

  card.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  card.style.opacity = "0.6";

  requestAnimationFrame(() => {
    card.style.transition =
      "transform 420ms cubic-bezier(.2,.9,.2,1), opacity 220ms ease";
    card.style.transform = "translate(0px, 0px) scale(1, 1)";
    card.style.opacity = "1";
  });

  // depois limpa a propriedade animation (pra não acumular)
  window.setTimeout(() => {
    card.style.animation = "";
  }, 450);
}

// foco no botão fechar
overlay.querySelector(".noteFocusClose")?.focus();
}

/* =========================================================
   FIRESTORE (SHARED)
========================================================= */
function sharedDaysCol() {
  return collection(db, "shared", SHARED_ID, "days");
}

function sharedDayDoc(key) {
  return doc(db, "shared", SHARED_ID, "days", key);
}

function formatDayPretty(key) {
  const [y, m, d] = key.split("-").map(Number);
  const epoch = zonedToUtcEpochSP({ year: y, month: m, day: d, hour: 12, minute: 0, second: 0 });
  const dt = new Date(epoch);

  return dt.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function fetchDayFromDB(key) {
  const snap = await getDoc(sharedDayDoc(key));
  return snap.exists() ? snap.data() : null;
}

async function upsertDayToDB({ key, notes, revealedBy }) {
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

async function listDaysFromDB() {
  const snap = await getDocs(sharedDaysCol());
  return snap.docs.map((d) => d.data());
}

/* paginação (potinho) — busca por páginas ordenadas por key */
async function listDaysPage({ pageSize = JAR_PAGE_SIZE, cursorKey = null, sortOrder = "desc" } = {}) {
  const col = sharedDaysCol();
  const q = cursorKey
    ? query(col, orderBy("key", sortOrder), startAfter(String(cursorKey)), limit(pageSize))
    : query(col, orderBy("key", sortOrder), limit(pageSize));

  const snap = await getDocs(q);
  const items = snap.docs.map((d) => d.data());

  const last = items.length ? items[items.length - 1] : null;
  const nextCursor = last?.key || null;

  return {
    items,
    nextCursor,
    hasMore: items.length === pageSize,
  };
}


function normalizeDayData(data, key) {
  const safe = data && typeof data === "object" ? { ...data } : {};
  safe.key = safe.key || key;
  safe.notes = Array.isArray(safe.notes) ? safe.notes : [];

  // ✅ novo formato
  if (!safe.revealedBy || typeof safe.revealedBy !== "object") safe.revealedBy = {};

  // (compat) se existir “revealed” antigo, ignora (não usa mais)
  return safe;
}

async function ensureSavedTodayDB() {
  const key = dayKeySP();
  const existing = await fetchDayFromDB(key);

  if (existing) {
    todayCache = normalizeDayData(existing, key);
    return;
  }

  await upsertDayToDB({
    key,
    notes: [],
    revealedBy: {},
  });

  const fresh = await fetchDayFromDB(key);
  todayCache = normalizeDayData(fresh, key);
}

async function refreshTodayFromDB() {
  const key = dayKeySP();
  const fresh = await fetchDayFromDB(key);
  todayCache = normalizeDayData(fresh, key);
  return todayCache;
}

function getRevealedSetForUser(dayData, user) {
  const email = normEmail(user?.email);
  if (!email) return new Set();

  const rb = dayData?.revealedBy;
  const list = rb && typeof rb === "object" ? rb[email] : null;
  return new Set(Array.isArray(list) ? list.map(String) : []);
}

/* salva “revelado” por usuário (por id) */
async function markRevealedForUser(noteId) {
  const u = auth.currentUser;
  if (!u) return;

  const email = normEmail(u.email);
  if (!email) return;

  const key = dayKeySP();
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

  await refreshTodayFromDB();
  return noteId;
}

/* =========================================================
   DELETE (TRANSACTION) + limpa revealedBy de todos
========================================================= */
async function deletePostItFromToday(note) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = dayKeySP();
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

    // limpa esse id de TODO MUNDO no revealedBy
    const rb = { ...(data.revealedBy || {}) };
    for (const k of Object.keys(rb)) {
      if (!Array.isArray(rb[k])) continue;
      rb[k] = rb[k].map(String).filter((x) => x !== removedId);
    }

    tx.set(
      ref,
      {
        key,
        notes,
        revealedBy: rb,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await refreshTodayFromDB();
  return note?.id || targetId || null;
}


/* =========================================================
   REPLIES (MINI THREAD)
========================================================= */
async function addReplyToDay(dayKey, noteId, replyText) {
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

    tx.set(
      ref,
      { key, notes, savedAt: serverTimestamp() },
      { merge: true }
    );
  });

  return reply;
}

/* =========================================================
   HELPERS
========================================================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstNameFromUser(user) {
  if (!user) return "";

  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName.trim().split(/\s+/)[0];
  }

  if (user.email) {
    const beforeAt = user.email.split("@")[0];
    const clean = beforeAt.split(".")[0];
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return "";
}

function creatorLabel(note) {
  const n = (note?.createdByName || "").trim();
  if (!n) return "";
  return `escrito por ${n}`.toLowerCase();
}

/* =========================================================
   RENDER (HOJE) - REVELADO POR USUÁRIO
========================================================= */
function renderToday() {
  if (!board) return;

  const user = auth.currentUser;
  const notes = Array.isArray(todayCache?.notes) ? todayCache.notes : [];
  const revealedSet = getRevealedSetForUser(todayCache, user);

  board.innerHTML = "";

  if (!notes.length) {
    renderEmptyState();
    return;
  }

  // se tiver notas, garante que não ficou a classe do layout vazio
  board.classList.remove("boardEmpty");

  notes.forEach((n, i) => {
    const el = document.createElement("div");

    const nid = String(n?.id || "");
    const isRevealed = nid && revealedSet.has(nid);

    el.className = "note " + (isRevealed ? "revealed" : "locked") + (nid && nid === lastAddedNoteId ? " justAdded" : "");
    el.style.setProperty("--rot", (Math.random() * 4 - 2) + "deg");
    el.style.background = (n && n.color) ? n.color : colors[i % colors.length];

    const by = creatorLabel(n);

    const repliesCount = Array.isArray(n?.replies) ? n.replies.length : 0;
    const repliesBadge = repliesCount ? `<span class="noteRepliesBadge" style="margin-left:auto;font-size:12px;opacity:.75;">💬 ${repliesCount}</span>` : ``;

    const showDelete = canDeleteNote(n, user);
    const delBtn = showDelete
      ? `<button class="noteDel" type="button" aria-label="apagar post-it">amassar</button>`
      : ``;

    const foot = by || delBtn
      ? `<div class="noteFoot">
          <div class="noteBy">
            ${by ? `<span class="dotBy"></span><span>${escapeHtml(by)}</span>` : ``}
          </div>
          ${delBtn}
        </div>`
      : ``;

    el.innerHTML = `
      <div class="noteHead"><span>${n.emo || "📌"}</span>${repliesBadge}</div>
      <h2>${escapeHtml(n.title || "")}</h2>
      <p>${n.text || ""}</p>
      ${foot}
    `;

    // delete
    const btn = el.querySelector(".noteDel");
    if (btn) {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const ok = await confirmDialog("quer amassar esse post-it?");
        if (!ok) return;

        try {
          await deletePostItFromToday(n);
          renderToday();
        } catch (e) {
          console.error(e);
          await refreshTodayFromDB();
          renderToday();
        }
      });
    }

    // clicar: se já estiver revelado, destaca; senão, revela (por usuário)
    el.addEventListener("click", async () => {
      if (el.classList.contains("revealed")) {
        // destaca na tela (modal)
        openNoteFocus(n, { bg: (n && n.color) ? n.color : colors[i % colors.length], fromEl: el });
        return;
      }

      if (!n?.id) return; // precisa do id pra salvar

      const r = el.getBoundingClientRect();
      spawnSparkles(r.left + r.width / 2, r.top + r.height / 2);

      el.classList.remove("locked");
      el.classList.add("revealed");

      try {
        await markRevealedForUser(n.id);
      } catch (e) {
        console.error(e);
        // se falhar, volta pro estado real do banco
        await refreshTodayFromDB();
        renderToday();
      }
    });

    board.appendChild(el);
  });
}

function renderEmptyState() {
  if (!board) return;

  board.classList.add("boardEmpty");
  board.innerHTML = `
  <div class="emptyCard">
    <div class="emptyTitle">ainda não tem post-its hoje</div>
    <p class="emptyText">
      mas talvez seja um bom dia
      pra deixar algo aqui…
    </p>

    <div class="emptyActions">
      <button class="emptyPrimaryBtn" id="emptyWriteBtn" type="button">
        ➕ escrever
      </button>
      <div class="emptyHint">fica guardado no potinho 🫙</div>
    </div>
  </div>
`;

  const btn = document.getElementById("emptyWriteBtn");
  btn?.addEventListener("click", () => {
    // reaproveita o fluxo que você já tem no botão "escrever"
    createBtn?.click();
  });
}

/* =========================================================
   CUSTOM SELECT (POTINHO)
========================================================= */
function setupCustomSelect(rootEl, { options, getLabel, getValue, onChange }) {
  const trigger = rootEl.querySelector(".cSelectTrigger");
  const valueEl = rootEl.querySelector(".cSelectValue");
  const panel = rootEl.querySelector(".cSelectPanel");

  let currentValue = null;
  let optionsProvider = () => options;

  function close() {
    rootEl.classList.remove("open");
    panel.classList.remove("up");
    trigger.setAttribute("aria-expanded", "false");
  }

  function placePanel() {
    const rect = trigger.getBoundingClientRect();
    const panelMax = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < panelMax && spaceAbove > spaceBelow) {
      panel.classList.add("up");
    } else {
      panel.classList.remove("up");
    }
  }

  function open() {
    placePanel();
    rootEl.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function toggle() {
    rootEl.classList.contains("open") ? close() : open();
  }

  function renderOptions(list) {
    panel.innerHTML = "";
    list.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cOption";
      btn.setAttribute("role", "option");

      const label = getLabel(opt);
      const val = getValue(opt);

      btn.textContent = label;
      if (val === currentValue) btn.classList.add("selected");

      btn.addEventListener("click", () => {
        setValue(val, label);
        close();
        onChange?.(val);
      });

      panel.appendChild(btn);
    });
  }

  function setValue(val, labelText) {
    currentValue = val;
    valueEl.textContent = labelText ?? rootEl.dataset.placeholder ?? "selecionar";
    renderOptions(optionsProvider());
  }

  function setOptions(newOptions) {
    optionsProvider = () => newOptions;
    renderOptions(optionsProvider());
  }

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    toggle();
  });

  document.addEventListener("click", (e) => {
    if (!rootEl.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (rootEl.classList.contains("open")) placePanel();
  });

  setOptions(optionsProvider());
  valueEl.textContent = rootEl.dataset.placeholder ?? "selecionar";
  trigger.setAttribute("aria-expanded", "false");

  return { setOptions, setValue, close };
}

// cria o select "pessoa" dentro do potinho (entre mês e ordenação) se não existir no HTML
(function ensureAuthorSelect() {
  if (authorSelectEl) return;
  const filtersWrap = monthSelectEl?.parentElement;
  if (!filtersWrap || !sortSelectEl) return;

  const div = document.createElement("div");
  div.className = "cSelect";
  div.id = "authorSelect";
  div.dataset.placeholder = "todas as pessoas";
  div.innerHTML = `
    <button class="cSelectTrigger" type="button" aria-haspopup="listbox" aria-expanded="false">
      <span class="cSelectValue">todas as pessoas</span>
      <span class="cSelectChevron">⌄</span>
    </button>
    <div class="cSelectPanel" role="listbox"></div>
  `;
  filtersWrap.insertBefore(div, sortSelectEl);
  authorSelectEl = div;
})();

const sortSelect = setupCustomSelect(sortSelectEl, {
  options: [
    { label: "mais recente", value: "desc" },
    { label: "mais antigo", value: "asc" },
  ],
  getLabel: (o) => o.label,
  getValue: (o) => o.value,
  onChange: (val) => {
    sortValue = val;
    renderJarList();
  },
});
sortSelect.setValue("desc", "mais recente");

const monthSelect = setupCustomSelect(monthSelectEl, {
  options: [{ label: "todos os meses", value: "" }],
  getLabel: (o) => o.label,
  getValue: (o) => o.value,
  onChange: (val) => {
    monthFilterValue = val;
    renderJarList();
  },
});
monthSelect.setValue("", "todos os meses");

const authorSelect = setupCustomSelect(authorSelectEl, {
  options: [
    { label: "todas as pessoas", value: "" },
    { label: "só felippe", value: ALLOWED_EMAILS[0] || "" },
    { label: "só gabriela", value: ALLOWED_EMAILS[1] || "" },
  ],
  getLabel: (o) => o.label,
  getValue: (o) => o.value,
  onChange: (val) => {
    authorFilterValue = val;
    renderJarList({ reset: true });
  },
});
authorSelect.setValue("", "todas as pessoas");


async function populateMonthFilterCustom() {
  const arc = await listDaysFromDB();
  const months = new Set();

  arc.forEach((item) => {
    if (!item?.key) return;
    const [y, m] = item.key.split("-");
    months.add(`${y}-${m}`);
  });

  const list = Array.from(months)
    .sort()
    .reverse()
    .map((val) => {
      const [y, m] = val.split("-");
      const epoch = zonedToUtcEpochSP({
        year: Number(y),
        month: Number(m),
        day: 1,
        hour: 12,
        minute: 0,
        second: 0,
      });
      const dt = new Date(epoch);
      const label = dt.toLocaleDateString("pt-BR", { timeZone: TZ, month: "long", year: "numeric" });
      return { label, value: val };
    });

  monthSelect.setOptions([{ label: "todos os meses", value: "" }, ...list]);

  const stillExists = ["", ...list.map((x) => x.value)].includes(monthFilterValue);
  if (!stillExists) {
    monthFilterValue = "";
    monthSelect.setValue("", "todos os meses");
  }
}

/* =========================================================
   MODALS (POTINHO / DIA)
========================================================= */
function openJar() {
  jarModal?.classList.add("show");
  jarModal?.setAttribute("aria-hidden", "false");

  // loading state imediato
  if (jarList) jarList.innerHTML = `<div class="jarLoading">carregando memórias…</div>`;

  // sempre reseta paginação ao abrir
  jarPagedItems = [];
  jarCursorKey = null;
  jarHasMore = true;

  populateMonthFilterCustom()
    .catch(() => {})
    .finally(() => renderJarList({ reset: true }));
}

function closeJarModal() {
  jarModal?.classList.remove("show");
  jarModal?.setAttribute("aria-hidden", "true");
}

function openDayModal() {
  dayModal?.classList.add("show");
  dayModal?.setAttribute("aria-hidden", "false");
}

function closeDayModal() {
  dayModal?.classList.remove("show");
  dayModal?.setAttribute("aria-hidden", "true");
  if (dayBoard) dayBoard.innerHTML = "";
}

/* =========================================================
   POTINHO (LIST / FILTERS)
========================================================= */
async function renderJarList({ reset = false } = {}) {
  if (!jarList) return;

  const searchTerm = (jarSearch?.value || "").toLowerCase();
  const monthFilter = monthFilterValue;
  const sortOrder = sortValue;

  // se tem filtro/busca: cai no modo "completo" (precisa varrer notas)
  const needsFullScan = !!searchTerm || !!monthFilter || !!authorFilterValue;

  if (reset) {
    jarPagedItems = [];
    jarCursorKey = null;
    jarHasMore = true;
  }

  // evita requisições em paralelo
  if (jarLoading) return;
  jarLoading = true;

  jarList.innerHTML = `<div class="jarLoading">carregando memórias…</div>`;

  try {
    let arc = [];

    if (needsFullScan) {
      arc = await listDaysFromDB();

      if (searchTerm) {
        arc = arc.filter((item) =>
          (item.notes || []).some(
            (n) =>
              (n.title || "").toLowerCase().includes(searchTerm) ||
              (n.text || "").toLowerCase().includes(searchTerm)
          )
        );
      }

      if (monthFilter) {
        arc = arc.filter((item) => String(item.key || "").startsWith(monthFilter));
      }

      if (authorFilterValue) {
        const target = normEmail(authorFilterValue);
        arc = arc.filter((item) =>
          (item.notes || []).some((n) => normEmail(n?.createdByEmail) === target)
        );
      }


      arc.sort((a, b) => {
        if (sortOrder === "asc") return String(a.key).localeCompare(String(b.key));
        return String(b.key).localeCompare(String(a.key));
      });

    } else {
      // modo paginado (mais leve)
      if (!jarPagedItems.length || reset) {
        const first = await listDaysPage({ pageSize: JAR_PAGE_SIZE, cursorKey: null, sortOrder });
        jarPagedItems = first.items;
        jarCursorKey = first.nextCursor;
        jarHasMore = first.hasMore;
      }

      arc = jarPagedItems.slice();
    }

    jarList.innerHTML = "";

    if (!arc.length) {
      jarList.innerHTML = `<div class="emptyJar">nenhum post-it encontrado 🤍</div>`;
      return;
    }

    arc.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jarDay";
      btn.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px; width:100%;">
          <div style="text-align:left;">
            <div style="font-weight:800;">${formatDayPretty(item.key)}</div>
            <div style="font-size:12px; opacity:.7; margin-top:2px;">
              ${(item.notes || []).length} memórias
            </div>
          </div>
          <div style="opacity:.65; align-self:center;">abrir</div>
        </div>
      `;

      btn.addEventListener("click", () => {
        closeJarModal();
        renderDay(item);
        openDayModal();
      });

      jarList.appendChild(btn);
    });

    if (!needsFullScan && jarHasMore) {
      const wrap = document.createElement("div");
      wrap.className = "jarMoreWrap";
      wrap.innerHTML = `<button type="button" class="jarMoreBtn">carregar mais</button>`;

      const moreBtn = wrap.querySelector(".jarMoreBtn");
      moreBtn?.addEventListener("click", async () => {
        if (jarLoading) return;

        jarLoading = true;
        moreBtn.disabled = true;
        moreBtn.textContent = "carregando…";

        try {
          const next = await listDaysPage({ pageSize: JAR_PAGE_SIZE, cursorKey: jarCursorKey, sortOrder });
          jarPagedItems = jarPagedItems.concat(next.items);
          jarCursorKey = next.nextCursor;
          jarHasMore = next.hasMore;

          jarLoading = false;
          await renderJarList({ reset: false });
          return;
        } catch (e) {
          console.error(e);
        }

        moreBtn.disabled = false;
        moreBtn.textContent = "carregar mais";
        jarLoading = false;
      });

      jarList.appendChild(wrap);
    }

  } catch (e) {
    console.error(e);
    jarList.innerHTML = `<div class="emptyJar">deu ruim ao carregar 🤍</div>`;
  } finally {
    jarLoading = false;
  }
}

/* =========================================================
   DIA (RENDER)
========================================================= */
function renderDay(item) {
  if (!dayBoard || !dayTitle || !dayMeta) return;

  dayTitle.textContent = "post-its do dia 🤍";
  dayMeta.textContent = formatDayPretty(item.key);
  dayBoard.innerHTML = "";

  (item.notes || []).forEach((n) => {
    const card = document.createElement("div");
    card.className = "jarMiniNote";

    const by = creatorLabel(n);
    const byLine = by ? `<div style="margin-top:6px; font-size:11px; opacity:.7;">${escapeHtml(by)}</div>` : "";

    const repliesCount = Array.isArray(n?.replies) ? n.replies.length : 0;
    const repliesLine = repliesCount ? `<div style="margin-top:6px; font-size:11px; opacity:.75;">💬 ${repliesCount} resposta${repliesCount === 1 ? "" : "s"}</div>` : "";

    card.innerHTML = `
      <h4>${escapeHtml(n.title || "")}</h4>
      <div>${n.text || ""}</div>${repliesLine}
      ${byLine}`;
    dayBoard.appendChild(card);
  });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "jarOpenFull";
  btn.textContent = "ver como post-it 🤍";

  btn.addEventListener("click", () => {
    if (!board) return;

    board.innerHTML = "";
    enterArchiveMode(item.key);

    (item.notes || []).forEach((n, i) => {
      const el = document.createElement("div");
      el.className = "note revealed";
      el.style.setProperty("--rot", (Math.random() * 4 - 2) + "deg");
      el.style.background = (n && n.color) ? n.color : colors[i % colors.length];

      const by = creatorLabel(n);
      const repliesCount = Array.isArray(n?.replies) ? n.replies.length : 0;
      const repliesBadge = repliesCount ? `<span class="noteRepliesBadge" style="margin-left:auto;font-size:12px;opacity:.75;">💬 ${repliesCount}</span>` : ``;
      const foot = by
        ? `<div class="noteFoot">
            <div class="noteBy"><span class="dotBy"></span><span>${escapeHtml(by)}</span></div>
          </div>`
        : ``;

      el.innerHTML = `
        <div class="noteHead"><span>${n.emo || "📌"}</span>${repliesBadge}</div>
        <h2>${escapeHtml(n.title || "")}</h2>
        <p>${n.text || ""}</p>
        ${foot}
      `;


      // abrir em destaque (mesmo comportamento do “dia atual”)
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openNoteFocus(n, { bg: (n && n.color) ? n.color : colors[i % colors.length], fromEl: el });
      });

      board.appendChild(el);
    });

    closeDayModal();
  });

  dayBoard.appendChild(btn);
}

/* =========================================================
   CRIAR POST-IT (SAVE)
========================================================= */

function ensureColorPickerUI() {
  if (!createModal) return;

  // já existe
  if (createModal.querySelector(".colorPickRow")) return;

  const body = createModal.querySelector(".createBody");
  if (!body) return;

  const row = document.createElement("div");
  row.className = "colorPickRow";
  row.innerHTML = `
    <div class="colorPickLabel">cor do post-it</div>
    <div class="colorPickSwatches" role="radiogroup" aria-label="Escolher cor do post-it">
      ${COLOR_PRESETS.map((c, i) => `
        <button type="button" class="colorSwatch" data-color="${c}" role="radio" aria-checked="false" aria-label="cor ${i+1}" style="background:${c}"></button>
      `).join("")}
      <label class="colorCustomWrap" aria-label="Escolher cor personalizada">
        <span class="colorCustomIcon">🎨</span>
        <input class="colorCustom" type="color" value="#ffd6ea" />
      </label>
    </div>
  `;

  // coloca depois da textarea (segunda .createRow)
  const rows = body.querySelectorAll(".createRow");
  if (rows && rows.length >= 2) {
    rows[1].insertAdjacentElement("afterend", row);
  } else {
    body.insertAdjacentElement("afterbegin", row);
  }

  const swatches = Array.from(row.querySelectorAll(".colorSwatch"));
  const custom = row.querySelector(".colorCustom");

  function applySelection(colorStr) {
    createColorValue = colorStr;
    swatches.forEach((b) => {
      const isSel = b.dataset.color === colorStr;
      b.classList.toggle("selected", isSel);
      b.setAttribute("aria-checked", isSel ? "true" : "false");
    });
  }

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      applySelection(btn.dataset.color);
    });
  });

  custom?.addEventListener("input", () => {
    // se escolher custom, usa cor hex
    createColorValue = custom.value;
    swatches.forEach((b) => {
      b.classList.remove("selected");
      b.setAttribute("aria-checked", "false");
    });
  });

  // default
  applySelection(createColorValue);
}

function openCreateModal() {
  createModal?.classList.add("show");
  createModal?.setAttribute("aria-hidden", "false");

  ensureColorPickerUI();
  // reset cor default ao abrir
  createColorValue = colors[0];
  const swatches = createModal?.querySelectorAll(".colorSwatch");
  swatches?.forEach((b) => {
    const isSel = b.dataset.color === createColorValue;
    b.classList.toggle("selected", isSel);
    b.setAttribute("aria-checked", isSel ? "true" : "false");
  });
  const custom = createModal?.querySelector(".colorCustom");
  if (custom) custom.value = "#ffd6ea";
  if (createTitle) createTitle.value = "";
  if (createText) createText.value = "";
  if (musicToggle) musicToggle.checked = false;
  if (musicUrl) {
    musicUrl.value = "";
    musicUrl.disabled = true;
  }
  createTitle?.focus();
}

function closeCreateModal() {
  createModal?.classList.remove("show");
  createModal?.setAttribute("aria-hidden", "true");
}

async function addPostItToToday({ title, finalText }) {
  const u = auth.currentUser;
  if (!u) throw new Error("não logado");

  const key = dayKeySP();
  const ref = sharedDayDoc(key);

  const note = {
    id: makeId(),
    emo: "📌",
    title: String(title || "").trim(),
    text: String(finalText || "").trim(),
    createdByEmail: u.email || "",
    createdByName: firstNameFromUser(u),
    createdAtMs: Date.now(),
    color: createColorValue,
  };

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    let data = snap.exists() ? normalizeDayData(snap.data(), key) : normalizeDayData({}, key);

    const notes = [...data.notes];
    notes.push(note);

    tx.set(
      ref,
      {
        key,
        notes,
        revealedBy: data.revealedBy || {},
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await refreshTodayFromDB();
  return note.id;
}

/* =========================================================
   MIDNIGHT RESET (SP)
========================================================= */
async function startNewDay() {
  setDateAndGreeting();
  todayCache = null;
  await ensureSavedTodayDB();
  await refreshTodayFromDB();
  renderToday();
}

function scheduleMidnightReset() {
  if (midnightTimer) clearTimeout(midnightTimer);
  midnightTimer = setTimeout(async () => {
    try {
      await startNewDay();
    } catch (e) {
      console.error("midnight reset error:", e);
    } finally {
      scheduleMidnightReset();
    }
  }, msUntilNextMidnightSP());
}

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;

  const keyNow = dayKeySP();
  if (!todayCache || todayCache.key !== keyNow) {
    try {
      await startNewDay();
    } catch (e) {
      console.error(e);
    } finally {
      scheduleMidnightReset();
    }
  }
});

/* =========================================================
   EVENTS
========================================================= */
envWrap?.addEventListener("click", handleOpen);
envWrap?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    handleOpen();
  }
});

backBtn?.addEventListener("click", goToEnvelope);

jarBtn?.addEventListener("click", openJar);
closeJar?.addEventListener("click", closeJarModal);
jarModal?.addEventListener("click", (e) => {
  if (e.target === jarModal) closeJarModal();
});

closeDay?.addEventListener("click", closeDayModal);
dayModal?.addEventListener("click", (e) => {
  if (e.target === dayModal) closeDayModal();
});

jarSearch?.addEventListener("input", () => renderJarList());

backToJar?.addEventListener("click", () => {
  closeDayModal();
  openJar();
});

/* criar */
createBtn?.addEventListener("click", openCreateModal);
createClose?.addEventListener("click", closeCreateModal);
createCancel?.addEventListener("click", closeCreateModal);
createModal?.addEventListener("click", (e) => {
  if (e.target === createModal) closeCreateModal();
});

createSave?.addEventListener("click", async () => {
  if (!createTitle || !createText) return;

  const title = createTitle.value.trim();
  const text = createText.value.trim();

  if (!title || !text) {
    alert("preenche o título e a mensagem 🤍");
    return;
  }

  const wantMusic = musicToggle?.checked;
  const url = (musicUrl?.value || "").trim();

  let finalText = text;

  if (wantMusic && url) {
    if (!url.includes("open.spotify.com")) {
      alert("cola um link válido do spotify 🤍");
      return;
    }

    finalText += `
      <br><br>
      <a href="${url}" target="_blank" rel="noopener" class="spotifyBtn">
        🎵 ouvir no spotify
      </a>
    `;
  }

  createSave.disabled = true;
  createSave.textContent = "salvando...";

  try {
    lastAddedNoteId = await addPostItToToday({ title, finalText });
    closeCreateModal();
    renderToday();
  } catch (e) {
    console.error(e);
    alert("deu ruim ao salvar. tenta de novo.");
  }

  createSave.disabled = false;
  createSave.textContent = "salvar";
});

/* =========================================================
   AUTH BUTTONS
========================================================= */
if (loginBtn) {
  
loginBtn.addEventListener("click", async () => {
  loginBtn.disabled = true;
  loginBtn.textContent = "entrando...";

  try {
    // Android costuma falhar com popup/estado em alguns navegadores e webviews.
    if (isMobileAndroid()) {
      await signInWithRedirect(auth, googleProvider);
      return; // o redirect vai sair da página
    }

    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    console.error(e);
    alert("não consegui abrir o login. se estiver em app (whatsapp/instagram), tenta 'abrir no chrome'.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "entrar com google";
  }
});
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);

    // ✅ sempre volta pro envelope ao sair
    goToEnvelope();
  });
}

/* =========================================================
   AUTH-GATED START (SEM PISCAR)
========================================================= */
(function bootHidden() {
  if (authGate) authGate.classList.remove("show");
  if (stage) stage.style.display = "none";
  if (app) app.style.display = "none";
  if (userBar) userBar.classList.remove("show");
})();



/* =========================================================
   MOBILE LOGIN FIX (ANDROID / WEBVIEW)
========================================================= */
function isMobileAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

// garante persistência (ajuda bastante no Android)
setPersistence(auth, browserLocalPersistence).catch(() => {});

// se teve login via redirect, processa o retorno
getRedirectResult(auth).catch(() => {});

onAuthStateChanged(auth, async (user) => {
  console.log(user ? `logado: ${user.email}` : "deslogado");

  if (!user) {
    authGate?.classList.add("show");
    document.body.classList.remove("hasUserBar");

    // garante que nenhum modal fique “por cima” depois do logout
    closeAllModals();
    goToEnvelope();

    if (stage) stage.style.display = "none";
    if (app) app.style.display = "none";
    userBar?.classList.remove("show");
    return;
  }

  if (!isAllowedEmail(user.email)) {
    alert("esse espaço é só pra gente 🤍");
    await signOut(auth);
    return;
  }

  authGate?.classList.remove("show");

  document.body.classList.add("hasUserBar");
  userBar?.classList.add("show");

  if (userEmailEl) {
    const nm = firstNameFromUser(user);
    userEmailEl.textContent = `oi, ${nm} 🤍`.toLowerCase();
  }

  if (stage) stage.style.display = "";
  if (app) app.style.display = "";

  // ✅ sempre inicia no envelope ao logar
  goToEnvelope();

  await ensureSavedTodayDB();
  await refreshTodayFromDB();

  setDateAndGreeting();
  renderToday();
  scheduleMidnightReset();
});