/**
 * BANCOSOL - Controller: Documentos
 * Gestión de archivos adjuntos a créditos y clientes
 */

const { Credito, Cliente, AuditoriaLog } = require('../models');
const { success, error, notFound } = require('../utils/responseHelper');

exports.subirDocumentoCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body; // 'contrato', 'garantia', 'ci'

    if (!req.file) {
      return error(res, 'No se ha subido ningún archivo', 400);
    }

    const credito = await Credito.findByPk(id);
    if (!credito) {
      return notFound(res, 'Crédito');
    }

    const { Documento } = require('../models');
    
    // Guardar ruta del archivo
    const path = `/uploads/${req.file.filename}`;
    const extension = req.file.originalname.split('.').pop();
    
    // Crear registro en DB
    const doc = await Documento.create({
      nombre: req.file.originalname,
      tipo: tipo || 'otros',
      path: path,
      extension: extension,
      credito_id: id
    });
    
    return success(res, doc, 'Archivo subido y registrado correctamente');
  } catch (err) {
    console.error('[DocumentosController.subir]', err);
    return error(res, 'Error al subir documento: ' + err.message, 500);
  }
};

module.exports = {
  subirDocumentoCredito: exports.subirDocumentoCredito
};
