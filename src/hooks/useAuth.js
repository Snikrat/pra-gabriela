import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase.js";
import { isAllowedEmail, shouldUseAuthRedirect } from "../lib/rules.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch {}
      }
    })();

    getRedirectResult(auth).catch((e) => {
      console.warn("redirect result error:", e);
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setReady(true);
        return;
      }

      if (!isAllowedEmail(u.email)) {
        alert("esse espaço é só pra gente 🤍");
        await signOut(auth);
        setUser(null);
        setReady(true);
        return;
      }

      setUser(u);
      setReady(true);
    });

    return () => unsub();
  }, []);

  async function login() {
    setLoggingIn(true);
    try {
      if (shouldUseAuthRedirect()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert("não consegui abrir o login. se estiver em app (whatsapp/instagram), tenta 'abrir no chrome'.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, ready, loggingIn, login, logout };
}
