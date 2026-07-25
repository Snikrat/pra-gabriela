import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPzzX1IEgjL3emfhTtvNakJBQW5BAIJHY",
  authDomain: "pra-gabriela.firebaseapp.com",
  projectId: "pra-gabriela",
  storageBucket: "pra-gabriela.firebasestorage.app",
  messagingSenderId: "730709975788",
  appId: "1:730709975788:web:14f292a89768573a9cbbc9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// força o Google a sempre perguntar qual conta usar (evita logar na conta errada no celular)
try {
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch {}
