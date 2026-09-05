// ============================================================
// INICIALIZACIÓN DE FIREBASE - ATEEZ ARGENTINA
// Punto único de inicialización, reutilizado por auth.js, posts.js y admin.js
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
