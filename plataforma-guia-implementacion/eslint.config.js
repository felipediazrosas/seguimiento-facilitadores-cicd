/* ============================================================
   eslint.config.js — Análisis estático (etapa «Lint» del CI y de Jenkins)
   · server/ y test/: Node.js (CommonJS).
   · js/: scripts clásicos del navegador que comparten ámbito global
     (se cargan en orden en index.html: config → estandar → store → excel → app).
     Por eso las variables globales de un archivo se declaran como «readonly»
     en los demás y no se marcan como «no usadas» (vars: 'local').
   · vendor/: librerías de terceros minificadas: excluidas.
   ============================================================ */
const js = require('@eslint/js');
const globals = require('globals');

// Símbolos que un script del navegador define y otro consume
const SHARED = Object.fromEntries(
  [
    // config.js
    'CONFIG',
    // estandar.js
    'ST', 'TL', 'RUT', 'SEM', 'TPL', 'DEFS', 'RACI', 'CAN', 'CARP', 'KP', 'RSK',
    // store.js
    'Store', 'deepMerge', 'newId', 'ROLE',
    // excel.js
    'initExcelUI', 'importFile', 'exportExcel', 'loadLib', 'nz',
    // app.js
    '$', 'esc', 'pad', 'toast', 'safeId', 'TODAY', 'isoOf', 'AUTH', 'ME', 'S', 'CUR', 'MODS', 'ROS',
    'META', 'cid', 'chkPct', 'dnum',
    'ASIG', 'NOV', 'SEG', 'CIE', 'RUTD', 'CAN_IMPORT', 'renderAll', 'setStatus', 'showLogin', 'wr',
    'XLSX', 'JSZip'
  ].map(k => [k, 'writable'])
);

module.exports = [
  { ignores: ['vendor/**', 'node_modules/**', 'coverage/**', 'data/**'] },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }] }
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...globals.browser, ...SHARED }
    },
    rules: {
      'no-unused-vars': ['error', { vars: 'local', args: 'after-used', caughtErrors: 'none' }],
      'no-redeclare': ['error', { builtinGlobals: false }],
      // Los catch vacíos son intencionales: localStorage puede no estar disponible (modo privado)
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    // xesc() elimina a propósito los caracteres de control no válidos en XML antes de escribir el Excel
    files: ['js/excel.js'],
    rules: { 'no-control-regex': 'off' }
  }
];
