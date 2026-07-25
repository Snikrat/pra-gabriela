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
import { isAllowedEmail } from "../lib/rules.js";

// garante a persistência ANTES de qualquer signIn — se o redirect (mobile)
// sair da página antes disso terminar, o Firebase perde o resultado do
// login ao voltar do Google e a pessoa cai de volta na tela de entrar
const persistenceReady = (async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {}
  }
})();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    persistenceReady.then(() => {
      getRedirectResult(auth).catch((e) => {
        console.warn("redirect result error:", e);
      });
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
      await persistenceReady;
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);

      // fallback: ambientes que bloqueiam popup (webview de app tipo
      // whatsapp/instagram) — aí sim precisa do redirect
      if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (e2) {
          console.error(e2);
        }
      }

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
