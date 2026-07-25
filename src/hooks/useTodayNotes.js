import { useEffect, useMemo, useRef, useState } from "react";
import { dayKeySP, dayKeyAddDays, msUntilNextMidnightSP } from "../lib/time.js";
import { NOTE_ACTIVE_WINDOW_MS } from "../lib/rules.js";
import {
  ensureSavedTodayDB,
  subscribeToDay,
  markRevealedForUser,
  deletePostItFromDay,
  addReplyToDay,
  addPostItToToday,
  editPostItInDay,
} from "../lib/firestoreApi.js";

/**
 * Estado dos post-its "de hoje", em tempo real: assina (onSnapshot) o
 * documento de hoje + o de ontem (uma nota criada perto da meia-noite pode
 * continuar ativa no dia seguinte), então qualquer post-it novo, revelação
 * ou resposta — sua ou da outra pessoa — chega direto, sem precisar dar
 * refresh. Reage também à virada de meia-noite e ao voltar o app pro
 * primeiro plano (visibilitychange).
 */
export function useTodayNotes(user) {
  const [todayKey, setTodayKey] = useState(() => dayKeySP());
  const [dayDocs, setDayDocs] = useState({});
  const [loading, setLoading] = useState(true);

  const unsubsRef = useRef([]);
  const midnightTimer = useRef(null);
  const todayKeyRef = useRef(todayKey);
  todayKeyRef.current = todayKey;

  useEffect(() => {
    if (!user) {
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      setDayDocs({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    function subscribeToKeys(keys) {
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];

      let pending = keys.length;
      setLoading(true);

      keys.forEach((key) => {
        const unsub = subscribeToDay(key, (data) => {
          if (cancelled) return;
          setDayDocs((cur) => ({ ...cur, [key]: data }));
          if (pending > 0) {
            pending -= 1;
            if (pending === 0) setLoading(false);
          }
        });
        unsubsRef.current.push(unsub);
      });
    }

    async function startNewDay() {
      const key = dayKeySP();
      setTodayKey(key);
      await ensureSavedTodayDB();
      if (cancelled) return;
      const yKey = dayKeyAddDays(key, -1);
      subscribeToKeys(yKey === key ? [key] : [key, yKey]);
    }

    function scheduleMidnightReset() {
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      midnightTimer.current = setTimeout(async () => {
        try {
          await startNewDay();
        } catch (e) {
          console.error("midnight reset error:", e);
        } finally {
          scheduleMidnightReset();
        }
      }, msUntilNextMidnightSP());
    }

    async function onVisibility() {
      if (document.visibilityState !== "visible") return;
      if (dayKeySP() === todayKeyRef.current) return;
      try {
        await startNewDay();
      } catch (e) {
        console.error(e);
      } finally {
        scheduleMidnightReset();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);

    (async () => {
      try {
        await startNewDay();
      } finally {
        if (!cancelled) scheduleMidnightReset();
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];
    };
  }, [user]);

  const { activeNotes, activeNotesByDay } = useMemo(() => {
    const now = Date.now();
    const out = [];
    const byDay = {};

    for (const key of Object.keys(dayDocs)) {
      const d = dayDocs[key];
      if (!d) continue;
      byDay[key] = d;

      const notes = Array.isArray(d.notes) ? d.notes : [];
      for (const n of notes) {
        const created = Number(n?.createdAtMs || 0);
        if (!created) continue;
        if (now - created < NOTE_ACTIVE_WINDOW_MS) {
          out.push({ ...n, _dayKey: key });
        }
      }
    }

    out.sort((a, b) => Number(a?.createdAtMs || 0) - Number(b?.createdAtMs || 0));
    return { activeNotes: out, activeNotesByDay: byDay };
  }, [dayDocs]);

  const todayCache = dayDocs[todayKey] || null;

  async function reveal(note) {
    await markRevealedForUser(note?._dayKey || todayKey, note.id);
  }

  async function remove(note) {
    await deletePostItFromDay(note?._dayKey || todayKey, note);
  }

  async function reply(dayKey, noteId, text) {
    return addReplyToDay(dayKey, noteId, text);
  }

  async function create({ title, finalText, color }) {
    return addPostItToToday({ title, finalText, color, todayKey });
  }

  async function edit(dayKey, noteId, patch) {
    return editPostItInDay(dayKey || todayKey, noteId, patch);
  }

  return {
    todayCache,
    activeNotes,
    activeNotesByDay,
    loading,
    reveal,
    remove,
    reply,
    create,
    edit,
  };
}
