const { Notificacion } = require('../models');
const { success, error } = require('../utils/responseHelper');

exports.listar = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { usuario_id: req.user.id },
          { usuario_id: null }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    return success(res, notificaciones);
  } catch (err) {
    return error(res, 'Error al obtener notificaciones: ' + err.message, 500);
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    await Notificacion.update({ leida: true }, { where: { id } });
    return success(res, null, 'Notificación marcada como leída');
  } catch (err) {
    return error(res, 'Error al actualizar notificación: ' + err.message, 500);
  }
};

exports.marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update({ leida: true }, { 
      where: { 
        usuario_id: req.user.id 
      } 
    });
    return success(res, null, 'Todas las notificaciones marcadas como leídas');
  } catch (err) {
    return error(res, 'Error: ' + err.message, 500);
  }
};

module.exports = {
  listar: exports.listar,
  marcarLeida: exports.marcarLeida,
  marcarTodasLeidas: exports.marcarTodasLeidas
};

module.exports = {
  listar: exports.listar,
  marcarLeida: exports.marcarLeida,
  marcarTodasLeidas: exports.marcarTodasLeidas
};
