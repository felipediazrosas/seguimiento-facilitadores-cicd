/* ============================================================
   store.js — CAPA DE DATOS Y ACCESO (ADAPTADORES CONDICIONALES)
   ============================================================
   Cada adaptador entrega dos cosas:

   1) store  → la interfaz de datos que usa toda la aplicación
        sub(coleccion, callback)      escucha la colección; callback([{id, ...datos}])
        set(coleccion, id, datos)     crea o reemplaza
        upd(coleccion, id, parcial)   actualiza campos
        del(coleccion, id)            elimina
        add(coleccion, datos)         crea con id automático

   2) auth   → quién es la persona y qué rol tiene
        user: { usuario, nombre, rol: 'coord' | 'fac', fa }
        secure: true si el rol lo hace cumplir un servidor (no solo la interfaz)
        logout(), changePassword?(actual, nueva), users? (gestión, solo REST),

   Si la persona aún no ha iniciado sesión, el adaptador devuelve
   { needLogin: true, login(...) } y la app muestra la pantalla de acceso.

   Para conectar OTRA base de datos (SQL Server, PostgreSQL, Firebase,
   SharePoint…) se escribe un adaptador con esta forma y se registra en
   ADAPTERS. No hay que tocar app.js ni excel.js.
   ============================================================ */

function deepMerge(a, b) {
  const o = { ...a };
  for (const k in b) {
    o[k] =
      b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object'
        ? deepMerge(a[k], b[k])
        : b[k];
  }
  return o;
}
const newId = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const ROLE = r => (r === 'coordinador' || r === 'coord' ? 'coord' : 'fac');

/* ------------------------------------------------------------
   ADAPTADOR 1 — API REST propia (servidor institucional)
   Contrato en db/contrato-api.md. Servidor de referencia en server/.
   Los permisos por rol los aplica el SERVIDOR (seguro).
   ------------------------------------------------------------ */
async function restAdapter() {
  const R = CONFIG.REST,
    base = R.BASE_URL.replace(/\/$/, '');
  const H = () => ({
    'Content-Type': 'application/json',
    'X-Requested-With': 'guia',
    ...(R.TOKEN ? { Authorization: 'Bearer ' + R.TOKEN } : {})
  });
  const req = async (m, p, b) => {
    const r = await fetch(base + p, {
      method: m,
      headers: H(),
      credentials: 'same-origin',
      body: b ? JSON.stringify(b) : undefined
    });
    if (r.status === 401 && p !== '/login') {
      location.reload();
      throw Object.assign(new Error('sesión vencida'), { code: 'unauthenticated' });
    }
    let j = null;
    try {
      j = r.status === 204 ? null : await r.json();
    } catch (e) {}
    if (!r.ok) {
      const e = new Error((j && j.mensaje) || 'HTTP ' + r.status);
      e.code = r.status === 403 ? 'invalid_argument' : 'http_' + r.status;
      e.status = r.status;
      throw e;
    }
    return j;
  };
  let health = null;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), R.TIMEOUT_MS);
    const r = await fetch(base + '/health', { headers: H(), signal: ctl.signal });
    clearTimeout(t);
    if (r.ok) health = await r.json();
  } catch (e) {}
  if (!health || !health.ok) return null;
  // ¿Hay sesión?
  const meR = await fetch(base + '/me', { headers: H(), credentials: 'same-origin' });
  if (meR.status === 401)
    return {
      needLogin: true,
      label: 'Servidor',
      async login(usuario, clave) {
        await req('POST', '/login', { usuario, clave });
        location.reload();
      }
    };
  const me = await meR.json();
  const subs = {},
    ver = {};
  const pull = async c => {
    try {
      const docs = await req('GET', '/' + c);
      (subs[c] || []).forEach(cb => cb(docs));
    } catch (e) {
      console.warn('REST', c, e.message);
    }
  };
  const poll = async () => {
    try {
      const v = await req('GET', '/versions');
      for (const c of Object.keys(subs)) {
        if (v[c] !== ver[c]) {
          ver[c] = v[c];
          await pull(c);
        }
      }
    } catch (e) {}
    setTimeout(poll, R.POLL_MS);
  };
  setTimeout(poll, R.POLL_MS);
  const after = async (c, p) => {
    const r = await p;
    await pull(c);
    return r;
  };
  const store = {
    sub(c, cb) {
      (subs[c] = subs[c] || []).push(cb);
      pull(c);
    },
    set: (c, id, d) => after(c, req('PUT', `/${c}/${encodeURIComponent(id)}`, d)),
    upd: (c, id, p) => after(c, req('PATCH', `/${c}/${encodeURIComponent(id)}`, p)),
    del: (c, id) => after(c, req('DELETE', `/${c}/${encodeURIComponent(id)}`)),
    add: (c, d) => after(c, req('POST', `/${c}`, d))
  };
  const auth = {
    mode: 'rest',
    secure: true,
    user: { usuario: me.usuario, nombre: me.nombre, rol: ROLE(me.rol), fa: me.fa || '' },
    async logout() {
      try {
        await req('POST', '/logout');
      } catch (e) {}
      location.reload();
    },
    changePassword: (actual, nueva) => req('POST', '/password', { actual, nueva }),
    users: {
      list: () => req('GET', '/usuarios'),
      create: u => req('POST', '/usuarios', u),
      update: (id, p) => req('PATCH', '/usuarios/' + encodeURIComponent(id), p),
      remove: id => req('DELETE', '/usuarios/' + encodeURIComponent(id))
    }
  };
  return { store, auth, live: true, canImport: !!me.canImport, label: 'En vivo (servidor)' };
}

/* ------------------------------------------------------------
   ADAPTADOR 2 — Almacenamiento local del navegador
   Sin servidor ni internet, en un solo equipo. Se elige el rol al
   entrar: no hay control de acceso real (para eso, el modo servidor).
   ------------------------------------------------------------ */
async function localAdapter() {
  const P = CONFIG.LOCAL.PREFIX,
    L = {};
  const read = c => {
    try {
      return JSON.parse(localStorage.getItem(P + c) || '{}');
    } catch (e) {
      return {};
    }
  };
  const write = (c, o) => {
    try {
      localStorage.setItem(P + c, JSON.stringify(o));
    } catch (e) {
      throw { code: 'quota_exceeded' };
    }
  };
  const emit = c => (L[c] || []).forEach(f => f(Object.entries(read(c)).map(([id, d]) => ({ id, ...d }))));
  window.addEventListener('storage', e => {
    if (e.key && e.key.startsWith(P)) emit(e.key.slice(P.length));
  });
  const store = {
    sub(c, cb) {
      (L[c] = L[c] || []).push(cb);
      setTimeout(() => emit(c), 0);
    },
    async set(c, id, d) {
      const o = read(c);
      o[id] = d;
      write(c, o);
      emit(c);
    },
    async upd(c, id, p) {
      const o = read(c);
      o[id] = deepMerge(o[id] || {}, p);
      write(c, o);
      emit(c);
    },
    async del(c, id) {
      const o = read(c);
      delete o[id];
      write(c, o);
      emit(c);
    },
    async add(c, d) {
      const id = newId();
      await this.set(c, id, d);
      return { id };
    }
  };
  let ses = null;
  try {
    ses = JSON.parse(sessionStorage.getItem(P + 'sesion') || 'null');
  } catch (e) {}
  const facs = () => {
    const ex = read('excel'),
      m = ex.meta || {},
      s = new Set();
    for (let i = 0; i < (m.nc || 0); i++)
      ((ex['c' + i] || {}).items || []).forEach(c => c.fa && s.add(c.fa.trim()));
    return [...s].sort((a, b) => a.localeCompare(b, 'es'));
  };
  if (!ses)
    return {
      needLogin: true,
      local: true,
      label: 'Modo local',
      facs,
      login(rol, fa) {
        sessionStorage.setItem(
          P + 'sesion',
          JSON.stringify({ rol, fa: fa || '', nombre: rol === 'coord' ? 'Coordinación' : fa })
        );
        location.reload();
      }
    };
  const auth = {
    mode: 'local',
    secure: false,
    user: { usuario: 'local', nombre: ses.nombre, rol: ses.rol, fa: ses.fa },
    logout() {
      sessionStorage.removeItem(P + 'sesion');
      location.reload();
    }
  };
  return { store, auth, live: false, canImport: ses.rol === 'coord', label: 'Modo local' };
}

/* ------------------------------------------------------------
   >>> SELECCIÓN CONDICIONAL DE LA BASE DE DATOS <<<
   Para agregar una fuente nueva: escribir miAdapter() que devuelva
   {store, auth, live, canImport, label}, {needLogin, login} o null si
   no está disponible; registrarlo aquí y nombrarlo en CONFIG.DATA_SOURCE.
   ------------------------------------------------------------ */
const ADAPTERS = { rest: restAdapter, local: localAdapter };
const AUTO_ORDER = ['rest', 'local'];

const Store = {
  label: '',
  source: '',
  async connect() {
    const want = CONFIG.DATA_SOURCE || 'auto';
    const order = want === 'auto' ? AUTO_ORDER : [want];
    for (const name of order) {
      const fn = ADAPTERS[name];
      if (!fn) continue;
      try {
        const c = await fn();
        if (c) {
          this.label = c.label;
          this.source = name;
          return c;
        }
      } catch (e) {
        console.warn('Fuente', name, 'no disponible', e);
      }
    }
    if (CONFIG.FALLBACK_TO_LOCAL && want !== 'local') {
      const c = await localAdapter();
      c.label = (c.label || 'Modo local') + ' · sin conexión a «' + want + '»';
      this.label = c.label;
      this.source = 'local';
      return c;
    }
    throw new Error('No hay fuente de datos disponible');
  }
};
