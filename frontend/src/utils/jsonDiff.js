/**
 * BANCOSOL - Utilidad: Formateo de JSON para auditoría
 * utilizado en página Auditoría
 */

export const formatJSON = (obj) => {
  if (!obj) return 'null';

  try {
    // Si es string JSON, parsear primero
    const parsed = typeof obj === 'string' ? JSON.parse(obj) : obj;
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    return String(obj);
  }
};
