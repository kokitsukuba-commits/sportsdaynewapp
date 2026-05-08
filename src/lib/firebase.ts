import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebaseコンソールに表示されたあなた専用の設定値
const firebaseConfig = {
  apiKey: "AIzaSyAOV0-9ETzqR9a9XFRMG7ccN9AxSAWaSaE",
  authDomain: "sportsdaynewapp.firebaseapp.com",
  projectId: "sportsdaynewapp",
  storageBucket: "sportsdaynewapp.firebasestorage.app",
  messagingSenderId: "11371833468",
  appId: "1:11371833468:web:a6acd12e7481b6ebd741f9"
};

// サーバーサイドでの二重初期化を防ぐ
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };