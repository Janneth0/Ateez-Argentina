// ============================================================
// AUTH.JS - ATEEZ ARGENTINA
// Registro, login (email y Google), logout, y manejo del perfil
// del usuario en Firestore (colección "usuarios"), incluyendo su rol.
// ============================================================

import { auth, db, googleProvider } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const USUARIOS_COL = "usuarios";

/**
 * Crea (si no existe) el documento de perfil del usuario en Firestore.
 * Todo usuario nuevo arranca SIN rol (rol: null) hasta que un admin se lo asigne.
 */
async function crearPerfilSiNoExiste(user, datosExtra = {}) {
  const ref = doc(db, USUARIOS_COL, user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || datosExtra.email || "",
      nombreCompleto: datosExtra.nombreCompleto || user.displayName || "",
      fechaNacimiento: datosExtra.fechaNacimiento || null,
      celular: datosExtra.celular || null,
      pais: datosExtra.pais || null,
      metodo: datosExtra.metodo || "google",
      rol: null, // null = pendiente de asignación por un admin
      creadoEn: serverTimestamp()
    });
  }
  return ref;
}

/** Registro con email, contraseña y datos adicionales del formulario. */
export async function registrarConEmail({ email, password, nombreCompleto, fechaNacimiento, celular, pais }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (nombreCompleto) {
    await updateProfile(cred.user, { displayName: nombreCompleto });
  }
  await crearPerfilSiNoExiste(cred.user, {
    email,
    nombreCompleto,
    fechaNacimiento,
    celular,
    pais,
    metodo: "password"
  });
  return cred.user;
}

/** Login con email y contraseña. */
export async function loginConEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Login (o registro automático) con Google. */
export async function loginConGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await crearPerfilSiNoExiste(cred.user, { metodo: "google" });
  return cred.user;
}

/** Cierra la sesión actual. */
export function logout() {
  return signOut(auth);
}

/** Envía el email de "recuperar contraseña" de Firebase. */
export function recuperarContrasena(email) {
  return sendPasswordResetEmail(auth, email);
}

/** Devuelve el documento de perfil (incluye "rol") del usuario logueado. */
export async function obtenerPerfil(uid) {
  const ref = doc(db, USUARIOS_COL, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Suscripción al estado de auth. Devuelve la función para desuscribirse. */
export function escucharAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Lista todos los perfiles de usuario (solo debería llamarse si el que pide es admin). */
export async function listarUsuarios() {
  const q = query(collection(db, USUARIOS_COL), orderBy("creadoEn", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Asigna/actualiza el rol de un usuario. Solo un admin debería poder ejecutar esto (ver firestore.rules). */
export async function asignarRol(uid, nuevoRol) {
  const ref = doc(db, USUARIOS_COL, uid);
  return updateDoc(ref, { rol: nuevoRol });
}

/** Traduce errores comunes de Firebase Auth a mensajes en español. */
export function traducirErrorAuth(error) {
  const code = error?.code || "";
  const mapa = {
    "auth/email-already-in-use": "Ese email ya está registrado. Probá iniciar sesión.",
    "auth/invalid-email": "El email ingresado no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/user-not-found": "No encontramos una cuenta con ese email.",
    "auth/invalid-credential": "Email o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en unos minutos.",
    "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar."
  };
  return mapa[code] || "Ocurrió un error. Intentá de nuevo.";
}
