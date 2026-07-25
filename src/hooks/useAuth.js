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
  const [debugLog, setDebugLog] = useState([]);

  function log(msg) {
    console.log("[auth]", msg);
    setDebugLog((cur) => [...cur, `${new Date().toLocaleTimeString("pt-BR")} — ${msg}`]);
  }

  useEffect(() => {
    log("boot, aguardando persistência...");
    persistenceReady.then(() => {
      log("persistência pronta, checando resultado de redirect...");
      getRedirectResult(auth)
        .then((result) => {
          log(result ? `getRedirectResult -> usuário ${result.user?.email}` : "getRedirectResult -> null (sem redirect pendente)");
        })
        .catch((e) => {
          log(`getRedirectResult ERRO -> ${e?.code || ""} ${e?.message || e}`);
        });
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      log(`onAuthStateChanged -> ${u ? u.email : "null"}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login() {
    setLoggingIn(true);
    try {
      await persistenceReady;
      if (shouldUseAuthRedirect()) {
        log("iniciando signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      log("iniciando signInWithPopup...");
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      log(`login ERRO -> ${e?.code || ""} ${e?.message || e}`);
      alert(`não consegui abrir o login (${e?.code || "erro"}). se estiver em app (whatsapp/instagram), tenta 'abrir no chrome'.`);
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, ready, loggingIn, login, logout, debugLog };
}
