/* ============================================================
   Carga los scripts clásicos del navegador (js/*.js) en un contexto aislado
   de Node (vm) para probar sus datos y funciones puras SIN modificar el
   código fuente. Los scripts comparten ámbito global igual que en index.html.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

/**
 * @param {string[]} files   rutas relativas a la raíz de la app, en orden de carga
 * @param {string[]} exports nombres de las declaraciones globales a devolver
 * @param {object}   stubs   globales mínimos que los scripts esperan (window, pad…)
 */
function loadBrowserScripts(files, exports, stubs = {}) {
  const ctx = vm.createContext({ console, ...stubs });
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(code, ctx, { filename: f });
  }
  // Las declaraciones const/let de nivel superior viven en el ámbito léxico global del contexto
  return vm.runInContext(`({ ${exports.join(', ')} })`, ctx);
}

/**
 * Extrae del archivo fuente REAL el texto de una declaración de nivel superior
 * (const / let / function) hasta la siguiente declaración de nivel superior.
 * Permite probar reglas de negocio de app.js sin ejecutar su arranque (DOM).
 */
function extractTopLevel(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const lines = src.split(/\r?\n/);
  const head = new RegExp(`^(const|let|function)\\s+${name.replace(/\$/g, '\\$')}\\b`);
  const next = /^(const|let|var|function|async function|\/\*|\(async)/;
  const i = lines.findIndex(l => head.test(l));
  if (i < 0) throw new Error(`No se encontró la declaración «${name}» en ${file}`);
  let j = i + 1;
  while (j < lines.length && !next.test(lines[j])) j++;
  return lines.slice(i, j).join('\n');
}

module.exports = { loadBrowserScripts, extractTopLevel, ROOT };
