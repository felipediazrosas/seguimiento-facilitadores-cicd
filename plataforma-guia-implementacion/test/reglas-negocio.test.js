/* ============================================================
   Pruebas de reglas de negocio del navegador sin modificar el código fuente:
   · fase() de js/app.js (misma lógica que la columna «Fase» del Excel)
   · utilidades de js/excel.js usadas en la importación/exportación
   Las funciones se extraen del archivo real y se evalúan en un contexto aislado.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadBrowserScripts, extractTopLevel } = require('./helpers/browser-sandbox.js');

/* ---------- fase() de app.js ---------- */
const TODAY = '2026-06-15'; // fecha fija: pruebas deterministas
const ctx = vm.createContext({});
vm.runInContext(
  [
    extractTopLevel('js/app.js', 'pad'),
    extractTopLevel('js/app.js', 'dnum'),
    extractTopLevel('js/app.js', 'diff'),
    extractTopLevel('js/app.js', 'addDays'),
    extractTopLevel('js/app.js', 'safeId'),
    `const TODAY = '${TODAY}'; let CIE = {};`,
    extractTopLevel('js/app.js', 'ek'),
    extractTopLevel('js/app.js', 'fase'),
    extractTopLevel('js/app.js', 'W'),
    'globalThis.api = { fase, addDays, W, setCierre: (id, k) => { CIE = { [id]: { k } }; } };'
  ].join('\n'),
  ctx
);
const { fase, addDays, W, setCierre } = ctx.api;
const curso = (inicioEn, cierreEn, extra = {}) => ({
  s: 'CUR-1',
  i: addDays(TODAY, inicioEn),
  f: addDays(TODAY, cierreEn),
  ...extra
});

describe('fase() — documentación, sección 7 «Reglas de negocio»', () => {
  test('sin fechas → «Sin fecha»', () => {
    assert.equal(fase({ s: 'X' }), 'Sin fecha');
  });
  test('faltan 8 días o más para iniciar → «Prox. Inicio»', () => {
    assert.equal(fase(curso(8, 60)), 'Prox. Inicio');
    assert.equal(fase(curso(30, 90)), 'Prox. Inicio');
  });
  test('entre 7 días antes y 5 días después del inicio → «Alistamiento»', () => {
    assert.equal(fase(curso(7, 60)), 'Alistamiento');
    assert.equal(fase(curso(0, 60)), 'Alistamiento');
    assert.equal(fase(curso(-5, 60)), 'Alistamiento');
  });
  test('curso en marcha lejos del cierre → «Desarrollo»', () => {
    assert.equal(fase(curso(-6, 30)), 'Desarrollo');
  });
  test('a 7 días o menos del cierre → «Cierre»', () => {
    assert.equal(fase(curso(-40, 7)), 'Cierre');
    assert.equal(fase(curso(-40, 0)), 'Cierre');
  });
  test('cierre vencido sin reporte → «Pend. Reporte Cierre»', () => {
    assert.equal(fase(curso(-60, -1)), 'Pend. Reporte Cierre');
  });
  test('con reporte de cierre en el Excel → «Cerrado»', () => {
    assert.equal(fase(curso(-60, -1, { k: { rep: '2026-06-01' } })), 'Cerrado');
  });
  test('con reporte de cierre registrado en la plataforma → «Cerrado»', () => {
    setCierre('CUR-1', { rep: '2026-06-02' });
    assert.equal(fase(curso(-60, -1)), 'Cerrado');
    setCierre('NADA', {});
  });
  test('el alistamiento tiene prioridad sobre el reporte de cierre (orden de la regla)', () => {
    assert.equal(fase(curso(0, 60, { k: { rep: '2026-06-01' } })), 'Alistamiento');
  });
});

describe('Pesos del índice de carga — documentación, sección 7', () => {
  test('Alistamiento 0,17 · Desarrollo 0,73 · Cierre y pendiente 0,10 · resto 0', () => {
    assert.equal(W.Alistamiento, 0.17);
    assert.equal(W.Desarrollo, 0.73);
    assert.equal(W.Cierre, 0.1);
    assert.equal(W['Pend. Reporte Cierre'], 0.1);
    assert.equal(W['Prox. Inicio'], 0);
    assert.equal(W.Cerrado, 0);
  });
});

/* ---------- utilidades de excel.js ---------- */
const X = loadBrowserScripts(['js/excel.js'], ['nz', 'colL', 'colN', 'chunks', 'xesc'], {
  window: {},
  CONFIG: { LIBS: {} }
});

describe('Utilidades de Excel (js/excel.js)', () => {
  test('nz() normaliza encabezados sin importar tildes, mayúsculas ni espacios', () => {
    assert.equal(X.nz('  Fecha  de   Inicio '), 'fecha de inicio');
    assert.equal(X.nz('Módulo/Unidad/Lección'), 'modulo/unidad/leccion');
    assert.equal(X.nz(null), '');
  });
  test('colL() y colN() convierten columnas en ambos sentidos (A, Z, AA, AZ, XFD)', () => {
    const casos = { 0: 'A', 25: 'Z', 26: 'AA', 51: 'AZ', 16383: 'XFD' };
    for (const [n, l] of Object.entries(casos)) {
      assert.equal(X.colL(+n), l);
      assert.equal(X.colN(l), +n);
    }
  });
  test('chunks() parte los datos en bloques menores al límite sin perder elementos', () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ s: 'CUR-' + i, a: 'x'.repeat(100) }));
    const parts = X.chunks(items, 5000);
    assert.ok(parts.length > 1);
    for (const p of parts) assert.ok(JSON.stringify(p).length <= 5000);
    assert.equal(parts.flat().length, items.length);
  });
  test('xesc() escapa XML y elimina caracteres de control no válidos', () => {
    assert.equal(X.xesc('a<b>&"c"'), 'a&lt;b&gt;&amp;&quot;c&quot;');
    assert.equal(X.xesc('ok\u0001\u0008'), 'ok');
  });
});
