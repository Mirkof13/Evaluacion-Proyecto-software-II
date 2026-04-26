/**
 * BANCOSOL - Utilidades de Ciberseguridad Avanzada
 * Cumple: ASFI RNSF Libro 3°, Título VII (Seguridad de la Información)
 */
const crypto = require('crypto');

const securityUtils = {
  /**
   * TOKENIZACIÓN: Reemplaza datos sensibles con tokens no reversibles
   * Para visualización en reportes públicos
   */
  tokenizarDato(dato) {
    if (!dato) return '';
    const hash = crypto.createHash('sha256').update(dato).digest('hex');
    return `TK-${hash.substring(0, 8).toUpperCase()}`;
  },

  /**
   * MASCARAMIENTO: Oculta parte del dato (ej: CI 10902***)
   */
  enmascararDato(dato, visibles = 4) {
    if (!dato) return '';
    const str = dato.toString();
    if (str.length <= visibles) return str;
    return str.substring(0, visibles) + '*'.repeat(str.length - visibles);
  },

  /**
   * FIRMA DIGITAL (Simulación PKI):
   * Genera una firma para un objeto de datos (ej: un Reporte ASFI)
   */
  firmarDocumento(datos) {
    const secreto = process.env.JWT_SECRET || 'bancosol_pki_root_key';
    const hmac = crypto.createHmac('sha256', secreto);
    hmac.update(JSON.stringify(datos));
    return hmac.digest('hex');
  },

  /**
   * VERIFICACIÓN DE FIRMA:
   * Valida si el documento fue alterado
   */
  verificarFirma(datos, firma) {
    const firmaCalculada = this.firmarDocumento(datos);
    return firmaCalculada === firma;
  }
};

module.exports = securityUtils;
