/* ============================================================
   server.js — Servidor de referencia (Node.js 18+, SIN dependencias)
   ------------------------------------------------------------
   · Sirve la plataforma (carpeta raíz del proyecto) como sitio estático.
   · API REST que usa el adaptador «rest» de js/store.js.
   · AUTENTICACIÓN: usuarios con contraseña (scrypt + sal), sesiones con
     cookie HttpOnly / SameSite=Strict, bloqueo por intentos fallidos.
   · AUTORIZACIÓN POR ROL, aplicada AQUÍ (no en el navegador):
       coordinador → todo: equipo completo, Excel, indicaciones, usuarios.
       facilitador → solo sus cursos, sus indicaciones, sus novedades y su
                     checklist diario; campos limitados al actualizar.
   · Datos en disco CIFRADOS con AES-256-GCM cuando se define DATA_KEY.

   Uso:   node server/server.js
   Variables de entorno:
     PORT=8080              puerto HTTP
     DATA_DIR=./data        carpeta de datos (fuera del control de versiones)
     DATA_KEY=frase         clave para cifrar datos y usuarios en disco (recomendado)
     ADMIN_USER / ADMIN_PASS  primer coordinador (si no existe ningún usuario)
     COOKIE_SECURE=1        marca la cookie como Secure (obligatorio con HTTPS)
     SESSION_HOURS=12       duración de la sesión
   Si no hay usuarios y no se definen ADMIN_USER/ADMIN_PASS, se crea el
   usuario «coordinador» con una contraseña aleatoria que se muestra UNA vez.
   ============================================================ */
const http = require('http'),
  fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const PORT = +process.env.PORT || 8080;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const KEY = process.env.DATA_KEY ? crypto.scryptSync(process.env.DATA_KEY, 'guia-implementacion', 32) : null;
const SESSION_MS = (+process.env.SESSION_HOURS || 12) * 3600e3;
const COLLECTIONS = new Set(['excel', 'asig', 'nov', 'seg', 'cierre', 'rutina']);
const MAX_BODY = 8 * 1024 * 1024;
fs.mkdirSync(DATA_DIR, { recursive: true });

/* ================= Persistencia (cifrado opcional) ================= */
const cache = {},
  versions = {};
const fileOf = c => path.join(DATA_DIR, c + (KEY ? '.json.enc' : '.json'));
function load(c) {
  if (cache[c]) return cache[c];
  let o = {};
  const f = fileOf(c);
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f);
    if (KEY) {
      const iv = raw.subarray(0, 12),
        tag = raw.subarray(12, 28),
        d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
      d.setAuthTag(tag);
      o = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8'));
    } else o = JSON.parse(raw.toString('utf8'));
  }
  versions[c] = versions[c] || Date.now();
  return (cache[c] = o);
}
function save(c) {
  const json = Buffer.from(JSON.stringify(cache[c]), 'utf8');
  let out = json;
  if (KEY) {
    const iv = crypto.randomBytes(12),
      ci = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const enc = Buffer.concat([ci.update(json), ci.final()]);
    out = Buffer.concat([iv, ci.getAuthTag(), enc]);
  }
  const tmp = fileOf(c) + '.tmp';
  fs.writeFileSync(tmp, out);
  fs.renameSync(tmp, fileOf(c));
  versions[c] = Date.now() + Math.random();
  if (c === 'excel') courseOwner = null;
}
const deepMerge = (a, b) => {
  const o = { ...a };
  for (const k in b) {
    o[k] =
      b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object'
        ? deepMerge(a[k], b[k])
        : b[k];
  }
  return o;
};
const safeId = s =>
  String(s)
    .replace(/[^A-Za-z0-9_\-~:@+]/g, '_')
    .slice(0, 180) || 'x';

/* Dueño de cada curso (sigla → facilitador), sacado del Excel cargado */
let courseOwner = null;
function owners() {
  if (courseOwner) return courseOwner;
  const ex = load('excel'),
    m = ex.meta || {},
    map = {};
  for (let i = 0; i < (m.nc || 0); i++)
    ((ex['c' + i] || {}).items || []).forEach(c => {
      if (c.s) map[c.s] = (c.fa || '').trim();
    });
  return (courseOwner = map);
}

/* ================= Usuarios y contraseñas ================= */
const USERS = 'usuarios';
const hashPw = (pw, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  hash: crypto.scryptSync(pw, salt, 64, { N: 16384 }).toString('hex')
});
const checkPw = (pw, u) => {
  const h = crypto.scryptSync(pw, u.salt, 64, { N: 16384 });
  return crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'));
};
const pwOk = pw => typeof pw === 'string' && pw.length >= 8;
const pub = (id, u) => ({
  usuario: id,
  nombre: u.nombre,
  rol: u.rol,
  fa: u.fa || '',
  activo: u.activo !== false,
  creado: u.creado || ''
});
function bootstrap() {
  const U = load(USERS);
  if (Object.keys(U).length) return;
  const user = process.env.ADMIN_USER || 'coordinador',
    pass = process.env.ADMIN_PASS || crypto.randomBytes(9).toString('base64url');
  U[user] = {
    nombre: 'Coordinación',
    rol: 'coordinador',
    fa: '',
    activo: true,
    creado: new Date().toISOString(),
    ...hashPw(pass)
  };
  save(USERS);
  console.log(
    '\n  Primer usuario creado →  usuario: ' +
      user +
      '   contraseña: ' +
      (process.env.ADMIN_PASS ? '(la de ADMIN_PASS)' : pass) +
      '\n  Cámbiela después de entrar (menú de usuario → Cambiar contraseña).\n'
  );
}

/* ================= Sesiones ================= */
const sessions = new Map(),
  fails = new Map();
const cookieOf = req => {
  const m = /(?:^|;\s*)sid=([A-Za-z0-9_-]+)/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
};
function session(req) {
  const sid = cookieOf(req);
  const s = sid && sessions.get(sid);
  if (!s) return null;
  if (Date.now() > s.exp) {
    sessions.delete(sid);
    return null;
  }
  const u = load(USERS)[s.user];
  if (!u || u.activo === false) {
    sessions.delete(sid);
    return null;
  }
  return { sid, user: s.user, rol: u.rol, fa: u.fa || '', nombre: u.nombre };
}
const setCookie = (res, v, maxAge) =>
  res.setHeader(
    'Set-Cookie',
    `sid=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.COOKIE_SECURE ? '; Secure' : ''}`
  );

/* ================= Autorización por rol ================= */
const isCoord = s => s.rol === 'coordinador';
const pick = (o, keys) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => keys.includes(k)));
const ownCourse = (s, sigla) => !!sigla && owners()[sigla] === s.fa;
/* ¿Puede LEER este documento? */
function canRead(s, col, doc) {
  if (isCoord(s) || col === 'excel') return true;
  if (col === 'asig' || col === 'nov' || col === 'rutina') return doc.fa === s.fa;
  if (col === 'seg' || col === 'cierre') return ownCourse(s, doc.s);
  return false;
}
/* ¿Puede ESCRIBIR? Devuelve el documento permitido o lanza 403 */
function guardWrite(s, col, method, id, body, existing) {
  const deny = () => {
    const e = new Error('forbidden');
    e.code = 403;
    throw e;
  };
  if (isCoord(s)) {
    if (col === 'rutina' && method !== 'DELETE') deny();
    return body;
  } // Coordinación consulta el checklist diario, no lo llena
  if (col === 'excel' || method === 'DELETE') deny();
  if (col === 'asig') {
    if (method !== 'PATCH' || !existing || existing.fa !== s.fa) deny();
    return pick(body, ['est', 'fh', 'resp']);
  }
  if (col === 'nov') {
    if (method === 'POST' || method === 'PUT') {
      if (body.s && !ownCourse(s, body.s)) deny();
      return { ...body, fa: s.fa };
    }
    if (method === 'PATCH') {
      if (!existing || existing.fa !== s.fa) deny();
      return pick(body, ['est', 'fe', 'acc']);
    }
    deny();
  }
  if (col === 'seg' || col === 'cierre') {
    const sig = (existing && existing.s) || body.s;
    if (!ownCourse(s, sig) || safeId(sig) !== id) deny();
    return { ...body, s: sig };
  }
  if (col === 'rutina') {
    if (id !== safeId(s.fa) + '__' + (body.d || '') || (existing && existing.fa !== s.fa)) deny();
    return { ...body, fa: s.fa };
  }
  deny();
}

/* ================= HTTP ================= */
const send = (res, code, obj) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(obj === undefined ? '' : JSON.stringify(obj));
};
const body = req =>
  new Promise((ok, ko) => {
    let n = 0,
      ch = [];
    req.on('data', d => {
      n += d.length;
      if (n > MAX_BODY) {
        ko(Object.assign(new Error('too_large'), { code: 413 }));
        req.destroy();
      } else ch.push(d);
    });
    req.on('end', () => {
      try {
        ok(ch.length ? JSON.parse(Buffer.concat(ch).toString('utf8')) : {});
      } catch (e) {
        ko(Object.assign(e, { code: 400 }));
      }
    });
    req.on('error', ko);
  });
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};
const validId = id => /^[A-Za-z0-9_\-~:@+.]{1,200}$/.test(id);
const ip = req => req.socket.remoteAddress || '';

async function api(req, res, parts) {
  const [col, id] = parts;
  // Toda escritura exige este encabezado (defensa adicional contra CSRF)
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'guia')
    return send(res, 403, { error: 'forbidden' });
  if (col === 'health') return send(res, 200, { ok: true, auth: true, encrypted: !!KEY });
  if (col === 'login' && req.method === 'POST') {
    const b = await body(req),
      k = ip(req) + '|' + String(b.usuario || '').toLowerCase(),
      f = fails.get(k) || { n: 0, t: 0 };
    if (f.n >= 5 && Date.now() - f.t < 15 * 60e3)
      return send(res, 429, { error: 'locked', mensaje: 'Demasiados intentos. Espere 15 minutos.' });
    const U = load(USERS),
      u =
        U[
          String(b.usuario || '')
            .trim()
            .toLowerCase()
        ];
    if (!u || u.activo === false || !checkPw(String(b.clave || ''), u)) {
      fails.set(k, { n: f.n + 1, t: Date.now() });
      return send(res, 401, { error: 'bad_credentials', mensaje: 'Usuario o contraseña incorrectos.' });
    }
    fails.delete(k);
    const sid = crypto.randomBytes(32).toString('base64url');
    sessions.set(sid, { user: String(b.usuario).trim().toLowerCase(), exp: Date.now() + SESSION_MS });
    setCookie(res, sid, SESSION_MS / 1000);
    return send(res, 200, pub(String(b.usuario).trim().toLowerCase(), u));
  }
  const s = session(req);
  if (!s) return send(res, 401, { error: 'unauthorized' });
  if (col === 'logout') {
    sessions.delete(s.sid);
    setCookie(res, '', 0);
    return send(res, 204);
  }
  if (col === 'me')
    return send(res, 200, { usuario: s.user, nombre: s.nombre, rol: s.rol, fa: s.fa, canImport: isCoord(s) });
  if (col === 'password' && req.method === 'POST') {
    const b = await body(req),
      U = load(USERS),
      u = U[s.user];
    if (!checkPw(String(b.actual || ''), u))
      return send(res, 400, { error: 'bad_password', mensaje: 'La contraseña actual no es correcta.' });
    if (!pwOk(b.nueva))
      return send(res, 400, {
        error: 'weak',
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.'
      });
    Object.assign(u, hashPw(b.nueva));
    save(USERS);
    return send(res, 200, { ok: true });
  }
  if (col === 'versions') {
    const v = {};
    COLLECTIONS.forEach(c => {
      load(c);
      v[c] = versions[c];
    });
    return send(res, 200, v);
  }
  /* ---- gestión de usuarios: solo coordinación ---- */
  if (col === 'usuarios') {
    if (!isCoord(s)) return send(res, 403, { error: 'forbidden' });
    const U = load(USERS);
    if (req.method === 'GET' && !id)
      return send(
        res,
        200,
        Object.entries(U).map(([k, u]) => pub(k, u))
      );
    if (req.method === 'POST' && !id) {
      const b = await body(req),
        k = String(b.usuario || '')
          .trim()
          .toLowerCase();
      if (!/^[a-z0-9._-]{3,40}$/.test(k))
        return send(res, 400, {
          mensaje: 'Usuario: 3 a 40 letras minúsculas, números, punto, guion o guion bajo.'
        });
      if (U[k]) return send(res, 409, { mensaje: 'Ese usuario ya existe.' });
      if (!['coordinador', 'facilitador'].includes(b.rol))
        return send(res, 400, { mensaje: 'Rol no válido.' });
      if (b.rol === 'facilitador' && !b.fa)
        return send(res, 400, { mensaje: 'Elija el facilitador del Excel al que corresponde.' });
      if (!pwOk(b.clave))
        return send(res, 400, { mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
      U[k] = {
        nombre: String(b.nombre || k),
        rol: b.rol,
        fa: b.rol === 'facilitador' ? String(b.fa) : '',
        activo: true,
        creado: new Date().toISOString(),
        ...hashPw(b.clave)
      };
      save(USERS);
      return send(res, 201, pub(k, U[k]));
    }
    if (id && U[id]) {
      if (req.method === 'PATCH') {
        const b = await body(req);
        if (id === s.user && (b.activo === false || (b.rol && b.rol !== 'coordinador')))
          return send(res, 400, {
            mensaje: 'No puede quitarse a sí mismo el rol de coordinación ni desactivarse.'
          });
        if (b.clave !== undefined) {
          if (!pwOk(b.clave))
            return send(res, 400, { mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
          Object.assign(U[id], hashPw(b.clave));
        }
        if (b.nombre) U[id].nombre = String(b.nombre);
        if (b.rol && ['coordinador', 'facilitador'].includes(b.rol)) U[id].rol = b.rol;
        if (b.fa !== undefined) U[id].fa = String(b.fa);
        if (b.activo !== undefined) U[id].activo = !!b.activo;
        save(USERS);
        if (U[id].activo === false) for (const [k, v] of sessions) if (v.user === id) sessions.delete(k);
        return send(res, 200, pub(id, U[id]));
      }
      if (req.method === 'DELETE') {
        if (id === s.user) return send(res, 400, { mensaje: 'No puede eliminar su propio usuario.' });
        delete U[id];
        save(USERS);
        for (const [k, v] of sessions) if (v.user === id) sessions.delete(k);
        return send(res, 204);
      }
    }
    return send(res, 404, { error: 'not_found' });
  }
  /* ---- colecciones de datos ---- */
  if (!COLLECTIONS.has(col)) return send(res, 404, { error: 'unknown_collection' });
  const o = load(col);
  if (!id) {
    if (req.method === 'GET') {
      let docs = Object.entries(o)
        .filter(([, v]) => canRead(s, col, v))
        .map(([k, v]) => ({ id: k, ...v }));
      if (col === 'excel' && !isCoord(s)) {
        // el facilitador solo recibe sus cursos y módulos
        const own = new Set(
          Object.entries(owners())
            .filter(([, f]) => f === s.fa)
            .map(([k]) => k)
        );
        docs = docs.map(d =>
          d.id === 'meta'
            ? { ...d, ros: (d.ros || []).filter(r => r.n === s.fa) }
            : /^c\d+$/.test(d.id)
              ? { ...d, items: (d.items || []).filter(c => c.fa === s.fa) }
              : /^m\d+$/.test(d.id)
                ? { ...d, items: (d.items || []).filter(m => own.has(m.s)) }
                : d
        );
      }
      return send(res, 200, docs);
    }
    if (req.method === 'POST') {
      const d = guardWrite(s, col, 'POST', null, await body(req), null);
      const nid = 'x' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
      o[nid] = d;
      save(col);
      return send(res, 201, { id: nid });
    }
    return send(res, 405, { error: 'method' });
  }
  if (!validId(id)) return send(res, 400, { error: 'bad_id' });
  if (req.method === 'GET')
    return o[id] && canRead(s, col, o[id])
      ? send(res, 200, { id, ...o[id] })
      : send(res, 404, { error: 'not_found' });
  if (req.method === 'PUT') {
    o[id] = guardWrite(s, col, 'PUT', id, await body(req), o[id]);
    save(col);
    return send(res, 200, { id });
  }
  if (req.method === 'PATCH') {
    if (!o[id]) return send(res, 404, { error: 'not_found' });
    o[id] = deepMerge(o[id], guardWrite(s, col, 'PATCH', id, await body(req), o[id]));
    save(col);
    return send(res, 200, { id });
  }
  if (req.method === 'DELETE') {
    guardWrite(s, col, 'DELETE', id, {}, o[id]);
    delete o[id];
    save(col);
    return send(res, 204);
  }
  return send(res, 405, { error: 'method' });
}

/* Testeabilidad (Actividad 3 · DevOps): el servidor se construye aquí y solo
   escucha cuando el archivo se ejecuta directamente (node server/server.js).
   Las pruebas automatizadas lo importan con require() y lo levantan en un
   puerto efímero. El comportamiento en ejecución es idéntico al original. */
const server = http
  .createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    let p;
    try {
      p = decodeURIComponent(u.pathname);
    } catch (e) {
      return send(res, 400, { error: 'bad_path' });
    }
    try {
      if (p.startsWith('/api/')) return await api(req, res, p.slice(5).split('/').filter(Boolean));
      // archivos estáticos (nunca la carpeta de datos ni el servidor)
      let f = path.normalize(path.join(ROOT, p === '/' ? 'index.html' : p));
      if (
        (!f.startsWith(ROOT + path.sep) && f !== ROOT) ||
        f.startsWith(DATA_DIR) ||
        f.startsWith(path.join(ROOT, 'server')) ||
        path.basename(f).startsWith('.')
      )
        return send(res, 403, { error: 'forbidden' });
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, { error: 'not_found' });
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff'
      });
      fs.createReadStream(f).pipe(res);
    } catch (e) {
      // Nunca se exponen detalles internos al navegador; el detalle queda en la consola del servidor
      const code = [400, 403, 413].includes(e.code) ? e.code : 500;
      if (code === 500) console.error(new Date().toISOString(), req.method, req.url, e);
      send(res, code, {
        error: { 400: 'bad_request', 403: 'forbidden', 413: 'too_large', 500: 'internal_error' }[code]
      });
    }
  });

if (require.main === module) {
  bootstrap();
  server.listen(PORT, () =>
    console.log(
      `Plataforma en http://localhost:${PORT}  ·  datos en ${DATA_DIR}${KEY ? ' (cifrados AES-256-GCM)' : ' (SIN cifrar: defina DATA_KEY)'}`
    )
  );
}

module.exports = { server, bootstrap };
