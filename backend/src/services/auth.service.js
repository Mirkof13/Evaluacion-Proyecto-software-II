/**
 * BANCOSOL - Service de Autenticación
 * Capa de Negocio para gestión de sesiones
 */

const bcrypt = require('bcrypt');
const { sequelize, Usuario, Rol } = require('../models');
const { generateToken, generateRefreshToken } = require('../config/jwt');

const PHONE_PATTERN = /^\+591[6-7]\d{7}$/;

const authService = {
  /**
   * Autenticar usuario
   * Verifica credentials y genera JWT
   */
  async login(email, password) {
    // 1. Buscar usuario con rol incluido
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, as: 'rol' }]
    });

    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // 2. Verificar bloqueo
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      throw new Error('Cuenta temporalmente bloqueada');
    }

    // 3. Verificar password
    const esValida = await bcrypt.compare(password, usuario.password_hash);
    if (!esValida) {
      // Incrementar intentos fallidos
      await usuario.increment('intentos_fallidos');

      const intentos = usuario.intentos_fallidos + 1;
      if (intentos >= 5) {
        // Bloquear por 15 minutos
        const bloqueadoHasta = new Date();
        bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 15);
        await usuario.update({ bloqueado_hasta: bloqueadoHasta });
        throw new Error('Cuenta bloqueada por múltiples intentos fallidos');
      }

      throw new Error('Credenciales inválidas');
    }

    // 4. Actualizar último login y resetear intentos
    await usuario.update({
      ultimo_login: new Date(),
      intentos_fallidos: 0
    });

    // 5. Generar tokens
    const token = generateToken(
      { id: usuario.id, email: usuario.email },
      usuario.rol.nombre
    );

    const refreshToken = generateRefreshToken({
      id: usuario.id,
      email: usuario.email
    });

    // 6. Retornar datos (excluir password)
    return {
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol.nombre,
        permisos: usuario.rol.permisos || {}
      }
    };
  },

  /**
   * Logout (invalidar token del lado del cliente)
   * En JWT stateless, solo se elimina del frontend
   */
  logout() {
    // En versión avanzada con blacklist de tokens, agregar a Redis
    return { message: 'Sesión cerrada' };
  },

  /**
   * Obtener perfil del usuario actual
   */
  async perfil(userId) {
    const usuario = await Usuario.findByPk(userId, {
      include: [{ model: Rol, as: 'rol' }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
      permisos: usuario.rol.permisos || {},
      ultimo_login: usuario.ultimo_login
    };
  },

  /**
   * Crear usuario (solo admin)
   */
  async crearUsuario(datos) {
    const transaction = await sequelize.transaction();

    try {
      // Verificar email único
      const existe = await Usuario.findOne({ where: { email: datos.email } });
      if (existe) {
        throw new Error('Email ya registrado');
      }

      // Hashear password
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(datos.password, bcryptRounds);

      // Crear usuario
      const usuario = await Usuario.create({
        nombre: datos.nombre,
        email: datos.email,
        password_hash: passwordHash,
        rol_id: datos.rol_id,
        activo: datos.activo !== false  // default true
      }, { transaction });

      await transaction.commit();

      // Retornar sin password
      const usuarioCreado = await Usuario.findByPk(usuario.id, {
        include: [{ model: Rol, as: 'rol' }],
        attributes: { exclude: ['password_hash'] }
      });

      return usuarioCreado;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * Actualizar usuario (admin)
   */
  async actualizarUsuario(userId, datos) {
    const usuario = await Usuario.findByPk(userId);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Campos permitidos
    const camposPermitidos = ['nombre', 'email', 'rol_id', 'activo'];

    for (const campo of camposPermitidos) {
      if (datos[campo] !== undefined) {
        usuario[campo] = datos[campo];
      }
    }

    // Si se actualiza password
    if (datos.password) {
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      usuario.password_hash = await bcrypt.hash(datos.password, bcryptRounds);
    }

    await usuario.save();

    return await Usuario.findByPk(userId, {
      include: [{ model: Rol, as: 'rol' }],
      attributes: { exclude: ['password_hash'] }
    });
  }
};

module.exports = authService;
