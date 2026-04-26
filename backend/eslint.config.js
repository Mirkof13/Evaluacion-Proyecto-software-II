import pluginSecurity from 'eslint-plugin-security';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';

export default [
  pluginSecurity.configs.recommended,
  pluginNoUnsanitized.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      'security/detect-object-injection': 'off', // A veces demasiado estricto para modelos Sequelize
    }
  }
];
