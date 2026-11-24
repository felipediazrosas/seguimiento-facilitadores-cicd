/* ============================================================
   Pruebas de integración HTTP del servidor (node:test, sin dependencias)
   Levantan server/server.js en un puerto efímero con una carpeta de datos
   temporal y verifican el contrato de db/contrato-api.md:
   autenticación, autorización por rol, cifrado en disco y archivos estáticos.
   Las credenciales son valores de prueba que solo existen durante la ejecución.
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'guia-test-'));
const COORD = { usuario: 'coord.test', clave: 'clave-prueba-coord-01' };
const FAC = { usuario: 'ana.test', clave: 'clave-prueba-fac-0001', fa: 'Ana Prueba' };

// La configuración del servidor se lee al cargar el módulo: definirla antes del require
process.env.DATA_DIR = DATA_DIR;
process.env.DATA_KEY = 'clave-de-cifrado-solo-para-pruebas';
process.env.ADMIN_USER = COORD.usuario;
process.env.ADMIN_PASS = COORD.clave;
delete process.env.COOKIE_SECURE;

const { server, bootstrap } = require('../server/server.js');
let base;

/* ---------- utilidades ---------- */
async function call(method, url, { body, cookie, csrf = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf && method !== 'GET') headers['X-Requested-With'] = 'guia';
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(base + url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null; // respuesta que no es JSON (por ejemplo, index.html)
  }
  return { status: res.status, json, text, headers: res.headers };
}
async function login({ usuario, clave }) {
  const r = await call('POST', '/api/login', { body: { usuario, clave } });
  assert.equal(r.status, 200, 'login debe responder 200');
  return r.headers.get('set-cookie').split(';')[0];
}

let coordCookie, facCookie;

before(async () => {
  bootstrap(); // crea el primer coordinador a partir de ADMIN_USER / ADMIN_PASS
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(ok => server.close(ok));
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

/* ---------- salud y protección básica ---------- */
describe('Salud y protecciones', () => {
  test('GET /api/health responde 200 sin sesión e informa cifrado', async () => {
    const r = await call('GET', '/api/health');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true, auth: true, encrypted: true });
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });

  test('una escritura sin el encabezado X-Requested-With es rechazada (anti-CSRF)', async () => {
    const r = await call('POST', '/api/login', { body: COORD, csrf: false });
    assert.equal(r.status, 403);
  });

  test('las rutas protegidas exigen sesión (401)', async () => {
    assert.equal((await call('GET', '/api/me')).status, 401);
    assert.equal((await call('GET', '/api/excel')).status, 401);
  });
});

/* ---------- autenticación ---------- */
describe('Autenticación', () => {
  test('credenciales incorrectas → 401 sin revelar detalles', async () => {
    const r = await call('POST', '/api/login', { body: { usuario: COORD.usuario, clave: 'incorrecta' } });
    assert.equal(r.status, 401);
    assert.equal(r.json.error, 'bad_credentials');
  });

  test('login correcto entrega cookie HttpOnly y SameSite=Strict', async () => {
    const r = await call('POST', '/api/login', { body: COORD });
    assert.equal(r.status, 200);
    assert.equal(r.json.rol, 'coordinador');
    const sc = r.headers.get('set-cookie');
    assert.match(sc, /sid=[A-Za-z0-9_-]+/);
    assert.match(sc, /HttpOnly/);
    assert.match(sc, /SameSite=Strict/);
    coordCookie = sc.split(';')[0];
  });

  test('GET /api/me devuelve el usuario de la sesión', async () => {
    const r = await call('GET', '/api/me', { cookie: coordCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.usuario, COORD.usuario);
    assert.equal(r.json.canImport, true);
  });

  test('bloqueo de 15 minutos tras 5 intentos fallidos (429)', async () => {
    const victim = { usuario: 'no.existe', clave: 'x' };
    for (let i = 0; i < 5; i++) assert.equal((await call('POST', '/api/login', { body: victim })).status, 401);
    const r = await call('POST', '/api/login', { body: victim });
    assert.equal(r.status, 429);
    assert.equal(r.json.error, 'locked');
  });
});

/* ---------- gestión de usuarios (solo coordinación) ---------- */
describe('Usuarios', () => {
  test('coordinación crea un facilitador vinculado al Excel', async () => {
    const r = await call('POST', '/api/usuarios', {
      cookie: coordCookie,
      body: { usuario: FAC.usuario, nombre: 'Ana', rol: 'facilitador', fa: FAC.fa, clave: FAC.clave }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.rol, 'facilitador');
    assert.equal(r.json.hash, undefined, 'nunca se expone el hash');
  });

  test('contraseña corta (< 8) → 400; usuario duplicado → 409; rol inválido → 400', async () => {
    const weak = await call('POST', '/api/usuarios', {
      cookie: coordCookie,
      body: { usuario: 'otro.test', rol: 'facilitador', fa: 'X', clave: '123' }
    });
    assert.equal(weak.status, 400);
    const dup = await call('POST', '/api/usuarios', {
      cookie: coordCookie,
      body: { usuario: FAC.usuario, rol: 'facilitador', fa: FAC.fa, clave: FAC.clave }
    });
    assert.equal(dup.status, 409);
    const rol = await call('POST', '/api/usuarios', {
      cookie: coordCookie,
      body: { usuario: 'rol.test', rol: 'admin', clave: 'clave-larga-123' }
    });
    assert.equal(rol.status, 400);
  });

  test('coordinación no puede quitarse su propio rol', async () => {
    const r = await call('PATCH', `/api/usuarios/${COORD.usuario}`, {
      cookie: coordCookie,
      body: { rol: 'facilitador' }
    });
    assert.equal(r.status, 400);
  });

  test('el facilitador inicia sesión y no puede gestionar usuarios (403)', async () => {
    facCookie = await login(FAC);
    const r = await call('GET', '/api/usuarios', { cookie: facCookie });
    assert.equal(r.status, 403);
  });
});

/* ---------- autorización por rol sobre las colecciones ---------- */
describe('Autorización por rol (aplicada por el servidor)', () => {
  const cursos = [
    { s: 'CUR-ANA', a: 'Curso de Ana', fa: FAC.fa, i: '2026-01-10', f: '2026-03-10' },
    { s: 'CUR-LUIS', a: 'Curso de Luis', fa: 'Luis Prueba', i: '2026-01-10', f: '2026-03-10' }
  ];

  test('coordinación carga los datos del Excel', async () => {
    const meta = {
      nc: 1,
      nm: 1,
      ros: [
        { n: FAC.fa, cargo: 'Facilitador' },
        { n: 'Luis Prueba', cargo: 'Facilitador' }
      ]
    };
    assert.equal((await call('PUT', '/api/excel/meta', { cookie: coordCookie, body: meta })).status, 200);
    assert.equal((await call('PUT', '/api/excel/c0', { cookie: coordCookie, body: { items: cursos } })).status, 200);
    const mods = { items: [{ s: 'CUR-ANA', m: 'Módulo 1' }, { s: 'CUR-LUIS', m: 'Módulo 1' }] };
    assert.equal((await call('PUT', '/api/excel/m0', { cookie: coordCookie, body: mods })).status, 200);
  });

  test('el facilitador solo recibe sus cursos, sus módulos y su ficha', async () => {
    const r = await call('GET', '/api/excel', { cookie: facCookie });
    assert.equal(r.status, 200);
    const byId = Object.fromEntries(r.json.map(d => [d.id, d]));
    assert.deepEqual(byId.c0.items.map(c => c.s), ['CUR-ANA']);
    assert.deepEqual(byId.m0.items.map(m => m.s), ['CUR-ANA']);
    assert.deepEqual(byId.meta.ros.map(x => x.n), [FAC.fa]);
  });

  test('el facilitador no puede escribir en los datos del Excel (403)', async () => {
    const r = await call('PUT', '/api/excel/c0', { cookie: facCookie, body: { items: [] } });
    assert.equal(r.status, 403);
  });

  test('novedad en un curso ajeno → 403; en el propio → 201 con fa fijado por el servidor', async () => {
    const ajena = await call('POST', '/api/nov', {
      cookie: facCookie,
      body: { s: 'CUR-LUIS', tipo: 'Técnica', sev: 'Alta', desc: 'x' }
    });
    assert.equal(ajena.status, 403);
    const propia = await call('POST', '/api/nov', {
      cookie: facCookie,
      body: { s: 'CUR-ANA', tipo: 'Técnica', sev: 'Media', desc: 'Aula sin acceso', fa: 'Otro Nombre' }
    });
    assert.equal(propia.status, 201);
    const doc = await call('GET', `/api/nov/${propia.json.id}`, { cookie: coordCookie });
    assert.equal(doc.json.fa, FAC.fa, 'el servidor ignora el fa enviado por el navegador');
  });

  test('indicaciones: el facilitador solo modifica est, fh y resp', async () => {
    const c = await call('POST', '/api/asig', {
      cookie: coordCookie,
      body: { fa: FAC.fa, tipo: 'Tarea', txt: 'Revisar aula', est: 'Pendiente' }
    });
    assert.equal(c.status, 201);
    const p = await call('PATCH', `/api/asig/${c.json.id}`, {
      cookie: facCookie,
      body: { est: 'Hecha', resp: 'Listo', txt: 'texto alterado' }
    });
    assert.equal(p.status, 200);
    const doc = await call('GET', `/api/asig/${c.json.id}`, { cookie: facCookie });
    assert.equal(doc.json.est, 'Hecha');
    assert.equal(doc.json.resp, 'Listo');
    assert.equal(doc.json.txt, 'Revisar aula', 'campos no permitidos se descartan');
    const crear = await call('POST', '/api/asig', { cookie: facCookie, body: { fa: FAC.fa, txt: 'x' } });
    assert.equal(crear.status, 403, 'el facilitador no crea indicaciones');
  });

  test('checklist diario: coordinación consulta pero no diligencia (403)', async () => {
    const id = 'Ana_Prueba__2026-11-24';
    const fac = await call('PUT', `/api/rutina/${id}`, { cookie: facCookie, body: { d: '2026-11-24', ck: { '0-0': true } } });
    assert.equal(fac.status, 200);
    const coord = await call('PUT', `/api/rutina/${id}`, { cookie: coordCookie, body: { d: '2026-11-24' } });
    assert.equal(coord.status, 403);
  });

  test('ids inválidos → 400 y colecciones desconocidas → 404', async () => {
    assert.equal((await call('GET', '/api/nov/id%20con%20espacios', { cookie: coordCookie })).status, 400);
    assert.equal((await call('GET', '/api/inexistente', { cookie: coordCookie })).status, 404);
  });

  test('/api/versions cambia después de una escritura', async () => {
    const v1 = (await call('GET', '/api/versions', { cookie: coordCookie })).json.seg;
    const sig = 'CUR-ANA';
    const w = await call('PUT', `/api/seg/${sig}`, { cookie: facCookie, body: { s: sig, ck: { '6-1': true } } });
    assert.equal(w.status, 200);
    const v2 = (await call('GET', '/api/versions', { cookie: coordCookie })).json.seg;
    assert.notEqual(v1, v2);
  });
});

/* ---------- persistencia cifrada ---------- */
describe('Datos en disco', () => {
  test('los archivos de datos y usuarios quedan cifrados (no contienen texto plano)', () => {
    const files = fs.readdirSync(DATA_DIR);
    assert.ok(files.includes('usuarios.json.enc'));
    assert.ok(files.includes('excel.json.enc'));
    for (const f of files) {
      const raw = fs.readFileSync(path.join(DATA_DIR, f)).toString('latin1');
      assert.ok(!raw.includes('Curso de Ana') && !raw.includes('coordinador'), `${f} no debe estar en claro`);
    }
  });
});

/* ---------- sitio estático ---------- */
describe('Archivos estáticos', () => {
  test('sirve index.html en /', async () => {
    const r = await call('GET', '/');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(r.text, /Guía de estandarización/);
  });

  test('nunca expone el código del servidor, archivos ocultos ni rutas fuera de la raíz', async () => {
    assert.equal((await call('GET', '/server/server.js')).status, 403);
    assert.equal((await call('GET', '/.gitignore')).status, 403);
    // %2f no lo normaliza el cliente: el servidor recibe «..%2f..» y debe impedir salir de la raíz
    assert.equal((await call('GET', '/..%2f..%2fserver%2fserver.js')).status, 403);
    assert.equal((await call('GET', '/no-existe.html')).status, 404);
  });
});
