/* ============================================================
   Pruebas del contenido del proceso estándar (js/estandar.js)
   Verifican la integridad de los datos que consume la interfaz y lo que
   declara la documentación de la plataforma (Documentacion_..., secciones 2 y 7).
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadBrowserScripts } = require('./helpers/browser-sandbox.js');

const E = loadBrowserScripts(['js/estandar.js'], ['ST', 'TL', 'RUT', 'SEM', 'TPL', 'DEFS', 'RACI', 'KP', 'RSK']);

test('el proceso estándar tiene nueve etapas numeradas del 1 al 9', () => {
  // Array.from: los arreglos creados en el contexto vm pertenecen a otro «realm»
  assert.deepEqual(
    Array.from(E.ST, s => s.n),
    [1, 2, 3, 4, 5, 6, 7, 8, 9]
  );
});

test('cada etapa tiene título, entradas, salidas, pasos, checklist y criterio de terminado', () => {
  for (const s of E.ST) {
    for (const k of ['t', 'quien', 'entra', 'sale', 'listo']) assert.ok(s[k], `etapa ${s.n}: falta «${k}»`);
    assert.ok(Array.isArray(s.steps) && s.steps.length > 0, `etapa ${s.n}: sin pasos`);
    assert.ok(Array.isArray(s.check) && s.check.length > 0, `etapa ${s.n}: sin checklist`);
  }
});

test('los controles del checklist no se repiten dentro de una etapa', () => {
  for (const s of E.ST) assert.equal(new Set(s.check).size, s.check.length, `etapa ${s.n} con controles duplicados`);
});

test('hay dieciséis plantillas de mensaje con identificador único', () => {
  assert.equal(E.TPL.length, 16);
  assert.equal(new Set(E.TPL.map(t => t.id)).size, 16);
});

test('toda plantilla referenciada por una etapa existe', () => {
  const ids = new Set(E.TPL.map(t => t.id));
  const missing = Array.from(E.ST.flatMap(s => s.tpl || []).filter(t => !ids.has(t)));
  assert.deepEqual(missing, []);
});

test('el checklist diario tiene once controles en tres momentos del día', () => {
  assert.equal(E.RUT.length, 3);
  assert.equal(
    E.RUT.reduce((a, [, items]) => a + items.length, 0),
    11
  );
});

test('el ritmo semanal fija el miércoles como día de monitoreo', () => {
  const mie = E.SEM.find(([d]) => d === 'Miércoles');
  assert.ok(mie, 'falta el miércoles');
  assert.ok(mie[1].some(a => /Monitoreo/.test(a)));
});
