// ============================================================
// FANBASE-CONTENIDO.JS - ATEEZ ARGENTINA
// Herramienta de uso ÚNICO para el admin.
//
// Los eventos / noticias / contenido que se cargaron ANTES de agregar
// el campo "fanbaseId" no lo tienen, y por eso los demás colaboradores de
// una fanbase no los ven en su panel. Esta función recorre esas tres
// colecciones y, a cada item al que le falte, le copia la fanbase y el
// nombre de quien lo cargó (tomados del perfil de ese usuario).
//
// Solo un admin puede ejecutarla (las reglas de Firestore lo exigen).
// Es seguro correrla más de una vez: solo toca items que no tengan el campo.
// ============================================================

import { db } from "./firebase-init.js";
import {
  collection, getDocs, writeBatch, doc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const COLECCIONES = ["posts", "noticias", "contenido"];

/**
 * @param {Object} mapaUsuarios  uid -> perfil (lo arma admin.js con listarUsuarios())
 * @returns {Promise<{revisados:number, actualizados:number}>}
 */
export async function completarFanbaseEnContenido(mapaUsuarios) {
  let revisados = 0;
  let actualizados = 0;

  for (const nombreCol of COLECCIONES) {
    const snap = await getDocs(collection(db, nombreCol));
    const pendientes = [];

    snap.docs.forEach(d => {
      revisados += 1;
      const data = d.data();
      if (data.fanbaseId !== undefined) return; // ya tiene el campo (aunque sea null)
      const autor = mapaUsuarios[data.creadoPor];
      pendientes.push({
        id: d.id,
        cambios: {
          fanbaseId: autor?.fanbase || null,
          creadoPorNombre: data.creadoPorNombre || autor?.nombreCompleto || autor?.email || ""
        }
      });
    });

    // Firestore permite hasta 500 escrituras por lote.
    for (let i = 0; i < pendientes.length; i += 400) {
      const lote = writeBatch(db);
      pendientes.slice(i, i + 400).forEach(p => lote.update(doc(db, nombreCol, p.id), p.cambios));
      await lote.commit();
      actualizados += Math.min(400, pendientes.length - i);
    }
  }
  return { revisados, actualizados };
}
