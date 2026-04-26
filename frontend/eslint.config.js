import pluginSecurity from 'eslint-plugin-security';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';
import pluginReact from 'eslint-plugin-react';

export default [
  pluginSecurity.configs.recommended,
  pluginNoUnsanitized.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: pluginReact
    },
    rules: {
      'no-console': 'warn',
      'react/react-in-jsx-scope': 'off',
    }
  }
];
