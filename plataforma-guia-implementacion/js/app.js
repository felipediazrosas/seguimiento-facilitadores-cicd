/* ============================================================
   app.js — Interfaz y lógica de negocio de la plataforma
   Secciones: utilidades · fases e índice de carga · estado · datos del Excel ·
   vista Equipo · panel del Facilitador (Mi día, Programación, Cursos,
   Indicaciones) · Novedades · Guía (proceso, plantillas, criterios) ·
   rol y ruteo · arranque.
   Todo acceso a datos pasa por el objeto S, que entrega store.js.
   ============================================================ */
/* =================== UTILIDADES =================== */
const $ = s => document.querySelector(s);
const esc = s =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pad = n => String(n).padStart(2, '0');
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TODAY = isoOf(new Date());
const dnum = s => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
};
const diff = (a, b) => dnum(b) - dnum(a);
const addDays = (s, n) => {
  const d = new Date(dnum(s) * 864e5 + n * 864e5);
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
};
const fmt = s => {
  if (!s || !/^\d{4}-\d\d-\d\d$/.test(s)) return s || '—';
  const [y, m, d] = s.split('-');
  return `${+d} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+m - 1]} ${y}`;
};
const idx = x => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
const safeId = s =>
  String(s)
    .replace(/[^A-Za-z0-9_\-~:@+]/g, '_')
    .slice(0, 180) || 'x';
function toast(t) {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('on');
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove('on'), 1800);
}
const lsGet = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch (e) {
    return d;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};

/* =================== FASES (igual que la hoja Seguimiento Cierre Cursos) =================== */
const FASES = ['Alistamiento', 'Desarrollo', 'Cierre', 'Pend. Reporte Cierre', 'Prox. Inicio', 'Cerrado'];
const W = {
  'Prox. Inicio': 0,
  Alistamiento: 0.17,
  Desarrollo: 0.73,
  Cierre: 0.1,
  'Pend. Reporte Cierre': 0.1,
  Cerrado: 0,
  'Sin fecha': 0
};
const ACT = ['Alistamiento', 'Desarrollo', 'Cierre', 'Pend. Reporte Cierre'];
function fase(c) {
  if (!c.i || !c.f) return 'Sin fecha';
  const aj = diff(c.i, TODAY),
    ak = diff(c.f, TODAY);
  if (aj <= -8) return 'Prox. Inicio';
  if (aj >= -7 && aj <= 5) return 'Alistamiento';
  if (ek(c).rep) return 'Cerrado';
  if (ak >= 1) return 'Pend. Reporte Cierre';
  if (ak >= -7 && ak <= 0) return 'Cierre';
  return 'Desarrollo';
}
const faseTag = f =>
  ({
    Alistamiento: 'wa',
    Desarrollo: 'ok',
    Cierre: 'wa',
    'Pend. Reporte Cierre': 'bad',
    'Prox. Inicio': '',
    Cerrado: '',
    'Sin fecha': ''
  })[f];
const ETAPAS_POR_FASE = {
  'Prox. Inicio': [1, 2, 3],
  Alistamiento: [2, 3, 4, 5],
  Desarrollo: [6, 7],
  Cierre: [6, 7, 9],
  'Pend. Reporte Cierre': [9],
  Cerrado: [9],
  'Sin fecha': [1, 2]
};
const CIERRE = [
  ['car', 'Encuestas de caracterización'],
  ['rep', 'Envío de reporte de cierre (Excel)'],
  ['siga', 'Subida de notas a SIGA'],
  ['bi', 'BI de encuestas de percepción'],
  ['exi', 'Notas en archivo de éxito académico'],
  ['con', 'Cierre en consolidado de programación']
];

/* =================== ESTADO =================== */
let CUR = [],
  MODS = [],
  ROS = [],
  META = null,
  ASIG = [],
  NOV = [],
  SEG = {},
  CIE = {},
  RUTD = {};
let FT = lsGet('guia3:ft', 'dia'),
  WOFF = 0;
const rutKey = (fa, d) => safeId(fa) + '__' + d;
const RUT_ITEMS = RUT.flatMap(([g, it], gi) => it.map(([t, m], i) => ({ id: gi + '-' + i, g, t, m })));
function rutPct(fa, d) {
  const r = RUTD[rutKey(fa, d || TODAY)];
  if (!r || !r.ck) return 0;
  return RUT_ITEMS.filter(x => r.ck[x.id]).length / RUT_ITEMS.length;
}
const ek = c => ({ ...(c.k || {}), ...((CIE[safeId(c.s)] || {}).k || {}) });
let ME = { rol: 'coord', fa: '', nombre: '' },
  AUTH = null;
const isCoord = () => ME.rol === 'coord';
let SELFA = lsGet('guia3:selfa', '');
let FFASE = 'activos',
  SEARCH = '',
  OPEN = new Set();
const facs = () => {
  const s = new Map();
  CUR.forEach(c => {
    if (c.fa) s.set(c.fa, (s.get(c.fa) || 0) + 1);
  });
  return [...s.keys()].sort((a, b) => a.localeCompare(b, 'es'));
};
const curOf = fa => CUR.filter(c => c.fa === fa);
const cid = c => safeId(c.s);
const modsOf = s => MODS.filter(m => m.s === s);
const email = fa => {
  const r = ROS.find(x => x.n.toLowerCase() === fa.toLowerCase());
  return r ? r.em : '';
};
function teamAvg() {
  const L = facs();
  return L.length ? L.reduce((a, f) => a + loadOf(f), 0) / L.length : 0;
}
function loadOf(fa) {
  return curOf(fa).reduce((a, c) => a + (c.pc || 0) * W[c._f], 0);
}

/* =================== DATOS DEL EXCEL EN EL ALMACÉN =================== */
function onExcel(docs) {
  const m = docs.find(d => d.id === 'meta');
  META = m || null;
  if (!m) {
    CUR = [];
    MODS = [];
    ROS = [];
    renderAll();
    return;
  }
  const get = p =>
    docs
      .filter(d => d.id.startsWith(p) && /^\D\d+$/.test(d.id))
      .sort((a, b) => +a.id.slice(1) - +b.id.slice(1));
  const cs = get('c').filter(d => +d.id.slice(1) < m.nc),
    ms = get('m').filter(d => +d.id.slice(1) < m.nm);
  if (cs.length < m.nc || ms.length < m.nm) return; // esperando todos los bloques
  CUR = cs.flatMap(d => (d.items || []).map(x => ({ ...x })));
  MODS = ms.flatMap(d => d.items || []);
  ROS = m.ros || [];
  CUR.forEach(c => {
    c._f = fase(c);
  });
  renderAll();
}

/* =================== EQUIPO =================== */
let TSEARCH = '',
  TSORT = 'carga';
function stackBar(cs) {
  const t = cs.filter(c => c._f !== 'Cerrado' && c._f !== 'Sin fecha').length || 1;
  const seg = [
    ['Alistamiento', 'f-al'],
    ['Desarrollo', 'f-de'],
    ['Cierre', 'f-ci'],
    ['Pend. Reporte Cierre', 'f-pe'],
    ['Prox. Inicio', 'f-pr']
  ];
  return `<div class="stack" title="${seg.map(([f]) => f + ': ' + cs.filter(c => c._f === f).length).join(' · ')}">${seg
    .map(([f, cl]) => {
      const n = cs.filter(c => c._f === f).length;
      return n ? `<i class="${cl}" style="width:${(n / t) * 100}%"></i>` : '';
    })
    .join('')}</div>`;
}
function renderTeam() {
  const act = CUR.filter(c => ACT.includes(c._f));
  const L = facs();
  const totLoad = L.reduce((a, f) => a + loadOf(f), 0),
    avg = L.length ? totLoad / L.length : 0,
    mx = Math.max(0.0001, ...L.map(loadOf));
  const abA = ASIG.filter(a => a.est !== 'Hecha').length,
    abN = NOV.filter(n => n.est !== 'Cerrada y verificada').length;
  $('#kTeam').innerHTML = [
    [act.length, 'cursos activos'],
    [
      act
        .filter(c => c._f !== 'Pend. Reporte Cierre')
        .reduce((a, c) => a + (c.ss || 0), 0)
        .toLocaleString('es-CO'),
      'estudiantes en cursos activos'
    ],
    [CUR.filter(c => c._f === 'Pend. Reporte Cierre').length, 'pendientes de reporte de cierre'],
    [L.length ? idx(avg) : '—', 'índice de carga promedio'],
    [abA, 'indicaciones abiertas'],
    [abN, 'novedades abiertas']
  ]
    .map(
      ([v, l]) => `<div class="card flat"><div class="k">${v}</div><div class="small muted">${l}</div></div>`
    )
    .join('');
  let rows = L.map(f => {
    const cs = curOf(f),
      ld = loadOf(f),
      pend = cs.filter(c => c._f === 'Pend. Reporte Cierre').length,
      acts = cs.filter(c => ACT.includes(c._f)).length,
      ss = cs
        .filter(c => ['Alistamiento', 'Desarrollo', 'Cierre'].includes(c._f))
        .reduce((a, c) => a + (c.ss || 0), 0);
    const ta = ASIG.filter(a => a.fa === f && a.est !== 'Hecha').length,
      tv = ASIG.filter(a => a.fa === f && a.est !== 'Hecha' && a.lim && a.lim < TODAY).length,
      tn = NOV.filter(n => n.fa === f && n.est !== 'Cerrada y verificada').length,
      cl = ld >= avg * 1.25 ? 'bad' : ld >= avg * 1.1 ? 'wa' : '';
    return {
      f,
      ld,
      pend,
      ta,
      html: `<tr class="click fade" data-fa="${esc(f)}" tabindex="0"><td><b>${esc(f)}</b><div class="small muted">${cs.length} cursos en el año</div></td><td><div class="load"><span class="tr"><i class="${cl}" style="width:${(ld / mx) * 100}%"></i></span><b>${idx(ld)}</b></div></td><td class="hm">${stackBar(cs)}</td><td class="n">${acts}</td><td class="n">${pend ? `<span class="tag ${pend > 10 ? 'bad' : pend > 3 ? 'wa' : ''}">${pend}</span>` : '—'}</td><td class="n hm">${ss}</td><td class="n">${(() => {
        const rp = rutPct(f);
        return rp
          ? `<span class="tag ${rp >= 1 ? 'ok' : rp >= 0.5 ? '' : 'wa'}">${Math.round(rp * 100)} %</span>`
          : '<span class="muted">0 %</span>';
      })()}</td><td class="n">${ta ? `<span class="tag ${tv ? 'bad' : 'wa'}">${ta}${tv ? ' · ' + tv + ' venc.' : ''}</span>` : '—'}</td><td class="n">${tn ? `<span class="tag bad">${tn}</span>` : '—'}</td></tr>`
    };
  });
  if (TSEARCH) rows = rows.filter(r => nz(r.f).includes(nz(TSEARCH)));
  rows.sort(
    TSORT === 'nom'
      ? (a, b) => a.f.localeCompare(b.f, 'es')
      : TSORT === 'pend'
        ? (a, b) => b.pend - a.pend
        : TSORT === 'ind'
          ? (a, b) => b.ta - a.ta
          : (a, b) => b.ld - a.ld
  );
  $('#teamRows').innerHTML = rows.length
    ? rows.map(r => r.html).join('')
    : `<tr><td colspan="9"><div class="empty">${META ? 'Ningún facilitador coincide.' : 'Aún no hay datos. Usa «Actualizar desde Excel» para cargar Programacion_2026.xlsx.'}</div></td></tr>`;
  document.querySelectorAll('#teamRows tr[data-fa]').forEach(tr => {
    const go = () => {
      SELFA = tr.dataset.fa;
      lsSet('guia3:selfa', SELFA);
      location.hash = '#facilitador';
    };
    tr.onclick = go;
    tr.onkeydown = e => {
      if (e.key === 'Enter') go();
    };
  });
  const prox = CUR.filter(c => c.i && diff(TODAY, c.i) >= 0 && diff(TODAY, c.i) <= 14).sort((a, b) =>
    a.i.localeCompare(b.i)
  );
  $('#proxTeam').innerHTML = prox.length
    ? `<div style="max-height:420px;overflow:auto">${prox.map(c => `<button class="crow" data-open="${esc(c.s)}"><div><b>${esc(c.a)}</b><div class="small muted">${fmt(c.i)} · ${esc(c.c)} · ${esc(c.fa || 'Sin facilitador')}</div></div><span class="tag ${faseTag(c._f)}">${c._f}</span></button>`).join('')}</div>`
    : '<div class="empty">Sin inicios en los próximos 14 días.</div>';
  const ev = [
    ...ASIG.map(a => ({
      t: a.f,
      h: `<b>Indicación</b> para ${esc(a.fa)}: ${esc(a.txt).slice(0, 90)} <span class="tag ${a.est === 'Hecha' ? 'ok' : 'wa'}">${a.est}</span>`
    })),
    ...NOV.map(n => ({
      t: n.f,
      h: `<b>Novedad</b> de ${esc(n.fa)} (${esc(n.sev)}): ${esc(n.desc).slice(0, 90)} <span class="tag">${esc(n.est)}</span>`
    })),
    ...Object.values(CIE)
      .filter(x => x.u)
      .map(x => ({ t: x.u, h: `<b>Cierre</b> actualizado: ${esc(x.a || x.s)}` }))
  ]
    .sort((a, b) => String(b.t).localeCompare(String(a.t)))
    .slice(0, 12);
  $('#actTeam').innerHTML = ev.length
    ? ev
        .map(
          e =>
            `<div class="item small fade"><span class="muted mono">${fmt(String(e.t).slice(0, 10))}</span> · ${e.h}</div>`
        )
        .join('')
    : '<div class="empty">Sin actividad todavía.</div>';
  bindOpen();
}
$('#tSearch').oninput = e => {
  TSEARCH = e.target.value;
  renderTeam();
};
$('#tSort').onchange = e => {
  TSORT = e.target.value;
  renderTeam();
};
function bindOpen() {
  document.querySelectorAll('[data-open]').forEach(b => (b.onclick = () => openDrawer(b.dataset.open)));
}

/* =================== FACILITADOR =================== */
function renderFac() {
  const L = facs();
  if (!isCoord()) SELFA = ME.fa;
  else if (!SELFA || !L.includes(SELFA)) SELFA = L[0] || '';
  $('#fSel').parentElement.classList.toggle('hide', !isCoord());
  $('#fSel').innerHTML = L.map(f => `<option ${f === SELFA ? 'selected' : ''}>${esc(f)}</option>`).join('');
  const coord = isCoord();
  if (!SELFA) {
    $('#fName').textContent = 'Facilitador';
    $('#fSub').textContent = 'Sin datos todavía.';
    ['#kFac', '#asigList', '#cList', '#fChips', '#todo', '#rutina2', '#week7'].forEach(s => {
      if ($(s)) $(s).innerHTML = '';
    });
    return;
  }
  const cs = curOf(SELFA),
    ld = loadOf(SELFA);
  $('#fName').textContent = SELFA;
  $('#fSub').textContent = [email(SELFA), cs.length + ' cursos en el archivo'].filter(Boolean).join(' · ');
  const cnt = x => cs.filter(c => c._f === x).length;
  const vencA = ASIG.filter(a => a.fa === SELFA && a.est !== 'Hecha' && a.lim && a.lim < TODAY).length;
  $('#kFac').innerHTML = [
    [
      idx(ld),
      'índice de carga' + (isCoord() && teamAvg() ? ` (equipo: ${idx(teamAvg())})` : ''),
      isCoord() && ld >= teamAvg() * 1.25 ? 'bad' : isCoord() && ld >= teamAvg() * 1.1 ? 'wa' : ''
    ],
    [cnt('Alistamiento'), 'en alistamiento'],
    [cnt('Desarrollo'), 'en desarrollo'],
    [cnt('Cierre') + cnt('Pend. Reporte Cierre'), 'en cierre o pendientes de reporte'],
    [
      ASIG.filter(a => a.fa === SELFA && a.est !== 'Hecha').length,
      vencA ? `indicaciones abiertas (${vencA} vencidas)` : 'indicaciones abiertas'
    ],
    [NOV.filter(n => n.fa === SELFA && n.est !== 'Cerrada y verificada').length, 'novedades abiertas']
  ]
    .map(
      ([v, l, c]) =>
        `<div class="card flat"><div class="k" ${c ? `style="color:var(--${c})"` : ''}>${v}</div><div class="small muted">${l}</div></div>`
    )
    .join('');
  renderTodo();
  // indicaciones
  $('#asigForm').classList.toggle('hide', !coord);
  $('#aCurso').innerHTML =
    '<option value="">General</option>' +
    cs
      .filter(c => c._f !== 'Cerrado')
      .sort((a, b) => a.a.localeCompare(b.a, 'es'))
      .map(c => `<option value="${esc(c.s)}">${esc(c.a)} · ${esc(c.c)}</option>`)
      .join('');
  const my = ASIG.filter(a => a.fa === SELFA).sort(
    (a, b) =>
      (a.est === 'Hecha') - (b.est === 'Hecha') || String(a.lim || '9').localeCompare(String(b.lim || '9'))
  );
  $('#asigCount').textContent = my.filter(a => a.est !== 'Hecha').length + ' abiertas';
  $('#asigList').innerHTML = my.length
    ? my
        .map(a => {
          const ven = a.est !== 'Hecha' && a.lim && a.lim < TODAY;
          const c = a.s ? CUR.find(x => x.s === a.s) : null;
          return `<div class="item ${a.est === 'Hecha' ? 'done' : ''}"><div class="row sp"><div class="row"><span class="tag ${a.tipo === 'Prioridad' ? 'bad' : a.tipo === 'Nota' ? '' : 'wa'}">${esc(a.tipo)}</span>${a.lim ? `<span class="small ${ven ? '' : 'muted'}" ${ven ? 'style="color:var(--bad);font-weight:600"' : ''}>${ven ? 'Vencida · ' : 'Para el '}${fmt(a.lim)}</span>` : ''}${c ? `<span class="small muted">· ${esc(c.a)}</span>` : ''}</div><span class="small muted">${fmt(String(a.f).slice(0, 10))}</span></div>
  <div class="tx">${esc(a.txt)}</div>${a.resp ? `<div class="small" style="background:var(--sf2);padding:6px 10px;border-radius:6px"><b>Respuesta:</b> ${esc(a.resp)}</div>` : ''}
  <div class="row" style="margin-top:8px"><button class="btn sm" data-ad="${a.id}">${a.est === 'Hecha' ? 'Reabrir' : 'Marcar hecha'}</button><button class="btn sm" data-ar="${a.id}">Responder</button>${coord ? `<button class="btn sm" data-ax="${a.id}">Eliminar</button>` : ''}</div></div>`;
        })
        .join('')
    : `<div class="empty">${coord ? 'Sin indicaciones. Escribe la primera arriba.' : 'Coordinación no ha dejado indicaciones.'}</div>`;
  document.querySelectorAll('[data-ad]').forEach(
    b =>
      (b.onclick = async () => {
        const a = ASIG.find(x => x.id === b.dataset.ad);
        await wr(() =>
          S.upd('asig', a.id, {
            est: a.est === 'Hecha' ? 'Pendiente' : 'Hecha',
            fh: a.est === 'Hecha' ? '' : new Date().toISOString()
          })
        );
      })
  );
  document.querySelectorAll('[data-ar]').forEach(
    b =>
      (b.onclick = async () => {
        const a = ASIG.find(x => x.id === b.dataset.ar);
        const t = prompt('Respuesta para Coordinación:', a.resp || '');
        if (t !== null) await wr(() => S.upd('asig', a.id, { resp: t.trim() }));
      })
  );
  document.querySelectorAll('[data-ax]').forEach(
    b =>
      (b.onclick = async () => {
        if (confirm('¿Eliminar esta indicación?')) await wr(() => S.del('asig', b.dataset.ax));
      })
  );
  bindTodo();
  renderFT();
  renderDia();
  renderProg();
  renderInd();
  renderCursos();
}
/* ---------- sub-pestañas del facilitador ---------- */
function renderFT() {
  document.querySelectorAll('#fTabs [data-ft]').forEach(b => {
    b.classList.toggle('on', b.dataset.ft === FT);
    b.setAttribute('aria-selected', b.dataset.ft === FT);
  });
  ['dia', 'prog', 'cursos', 'ind'].forEach(k => $('#fp-' + k).classList.toggle('hide', k !== FT));
}
document.querySelectorAll('#fTabs [data-ft]').forEach(
  b =>
    (b.onclick = () => {
      FT = b.dataset.ft;
      lsSet('guia3:ft', FT);
      renderFT();
    })
);
/* ---------- Mi día ---------- */
function renderDia() {
  const key = rutKey(SELFA, TODAY),
    r = RUTD[key] || { ck: {}, w: {} },
    p = rutPct(SELFA);
  $('#rutProg').textContent = `${RUT_ITEMS.filter(x => r.ck && r.ck[x.id]).length} de ${RUT_ITEMS.length}`;
  $('#rutBar').style.width = p * 100 + '%';
  $('#rutNote').innerHTML = `${fmt(TODAY)} · se reinicia cada día y Coordinación ve el avance en vivo.`;
  let html = '';
  RUT.forEach(([g, it], gi) => {
    html += `<h4 style="margin-top:${gi ? 12 : 4}px">${g}</h4><ul class="check">`;
    it.forEach(([t, m], i) => {
      const id = gi + '-' + i;
      html += `<li><label><input type="checkbox" data-r="${id}" ${r.ck && r.ck[id] ? 'checked' : ''}><span>${t}</span>${m ? `<span class="small muted mono" style="margin-left:auto;padding-left:8px">${m} min</span>` : ''}</label></li>`;
    });
    html += '</ul>';
  });
  $('#rutina2').innerHTML = html;
  if (isCoord()) {
    document.querySelectorAll('#rutina2 input').forEach(i => (i.disabled = true));
    $('#rutNote').innerHTML = `${fmt(TODAY)} · vista de consulta: el checklist lo diligencia el facilitador.`;
  }
  const wd = new Date().getDay(),
    t = SEM[wd - 1];
  $('#tocaTitle').textContent = t ? `Hoy toca (${t[0].toLowerCase()})` : 'Fin de semana';
  $('#toca').innerHTML = t
    ? t[1]
        .map(
          (x, i) =>
            `<li><label><input type="checkbox" data-w="${i}" ${r.w && r.w[i] ? 'checked' : ''}><span>${x}</span></label></li>`
        )
        .join('')
    : '<li class="small muted" style="padding:6px 0">Sin actividades estándar; revisa solo novedades de severidad alta.</li>';
  const save = async (field, k, v) => {
    const cur = RUTD[key] || { fa: SELFA, d: TODAY, ck: {}, w: {} };
    const nx = {
      fa: SELFA,
      d: TODAY,
      ck: { ...(cur.ck || {}) },
      w: { ...(cur.w || {}) },
      u: new Date().toISOString()
    };
    nx[field][k] = v;
    RUTD[key] = nx;
    await wr(() => S.set('rutina', key, nx));
    renderDiaSoft();
  };
  document
    .querySelectorAll('#rutina2 [data-r]')
    .forEach(i => (i.onchange = () => save('ck', i.dataset.r, i.checked)));
  document.querySelectorAll('#toca [data-w]').forEach(i => {
    i.disabled = isCoord();
    i.onchange = () => save('w', i.dataset.w, i.checked);
  });
  const ev = dayEvents(SELFA, TODAY);
  $('#hoyAgenda').innerHTML = ev.length
    ? ev
        .map(
          e =>
            `<button class="ev ${e.k}" ${e.s ? `data-open="${esc(e.s)}"` : ''}><b>${e.h ? e.h + ' · ' : ''}${esc(e.t)}</b>${esc(e.d)}</button>`
        )
        .join('') + '<div style="height:6px"></div>'
    : '<div class="empty">Sin encuentros, inicios ni cierres hoy.</div>';
  bindOpen();
}
let rds;
function renderDiaSoft() {
  clearTimeout(rds);
  rds = setTimeout(() => {
    const p = rutPct(SELFA);
    $('#rutBar').style.width = p * 100 + '%';
    const r = RUTD[rutKey(SELFA, TODAY)] || {};
    $('#rutProg').textContent = `${RUT_ITEMS.filter(x => r.ck && r.ck[x.id]).length} de ${RUT_ITEMS.length}`;
  }, 50);
}
/* ---------- Programación ---------- */
function dayEvents(fa, d) {
  const cs = curOf(fa),
    sigs = new Set(cs.map(c => c.s)),
    cn = s => {
      const c = CUR.find(x => x.s === s);
      return c ? c.a : s;
    },
    E = [];
  MODS.forEach(m => {
    if (!sigs.has(m.s)) return;
    const ign = /^(induccion|cierre)/.test(nz(m.m));
    if (m.es === d)
      E.push({
        k: 'en',
        h: m.hi || '',
        o: '1' + (m.hi || '99'),
        t: m.m || 'Encuentro',
        d: ` ${cn(m.s)}${m.pr ? ' · ' + m.pr : ''}`,
        s: m.s
      });
    if (!ign && m.i === d)
      E.push({ k: 'ini', h: '', o: '2', t: 'Inicia: ' + (m.m || ''), d: ' ' + cn(m.s), s: m.s });
    if (!ign && m.f === d)
      E.push({ k: 'fin', h: '', o: '3', t: 'Cierra: ' + (m.m || ''), d: ' ' + cn(m.s), s: m.s });
  });
  cs.forEach(c => {
    if (c.i === d) E.push({ k: 'ini', h: '', o: '0', t: 'Inicio del curso', d: ' ' + c.a, s: c.s });
    if (c.f === d) E.push({ k: 'fin', h: '', o: '0', t: 'Fin del curso', d: ' ' + c.a, s: c.s });
  });
  ASIG.filter(a => a.fa === fa && a.est !== 'Hecha' && a.lim === d).forEach(a =>
    E.push({ k: 'fin', h: '', o: '0', t: 'Vence indicación', d: ' ' + a.txt.slice(0, 60), s: a.s || '' })
  );
  return E.sort((a, b) => a.o.localeCompare(b.o));
}
function monday(iso) {
  const dn = dnum(iso),
    wd = (new Date(dn * 864e5).getUTCDay() + 6) % 7;
  return addDays(iso, -wd);
}
function renderProg() {
  const m0 = addDays(monday(TODAY), WOFF * 7),
    days = [...Array(7)].map((_, i) => addDays(m0, i));
  $('#wLabel').textContent = `${fmt(days[0])} – ${fmt(days[6])}`;
  const DN = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  $('#week7').innerHTML = days
    .map((d, i) => {
      const E = dayEvents(SELFA, d);
      return `<div class="day ${d === TODAY ? 'today' : ''} ${i > 4 ? 'we' : ''} ${E.length ? '' : 'empty-d'}"><h5>${DN[i]} <b>${+d.slice(8)}</b></h5>${E.slice(
        0,
        7
      )
        .map(
          e =>
            `<button class="ev ${e.k}" ${e.s ? `data-open="${esc(e.s)}"` : ''}><b>${e.h ? e.h + ' · ' : ''}${esc(e.t)}</b>${esc(e.d)}</button>`
        )
        .join(
          ''
        )}${E.length > 7 ? `<div class="more">y ${E.length - 7} más</div>` : ''}${E.length ? '' : '<div class="more">—</div>'}</div>`;
    })
    .join('');
  const end = addDays(TODAY, 28),
    cs = curOf(SELFA),
    sigs = new Set(cs.map(c => c.s));
  const enc = MODS.filter(m => sigs.has(m.s) && m.es && m.es >= TODAY && m.es <= end).sort((a, b) =>
    (a.es + (a.hi || '')).localeCompare(b.es + (b.hi || ''))
  );
  const ini = cs.filter(c => c.i >= TODAY && c.i <= end),
    fin = cs.filter(c => c.f >= TODAY && c.f <= end);
  $('#prox4').innerHTML = `<div class="grid g3"><div><h4>Encuentros sincrónicos (${enc.length})</h4>${
    enc
      .slice(0, 12)
      .map(m => {
        const c = CUR.find(x => x.s === m.s);
        return `<div class="small" style="padding:5px 0;border-bottom:1px solid var(--ln)"><b class="mono">${fmt(m.es).slice(0, 6)} ${m.hi || ''}</b> · ${esc(m.m || '')}<div class="muted">${esc(c ? c.a : '')}</div></div>`;
      })
      .join('') || '<p class="small muted">Ninguno.</p>'
  }</div>
 <div><h4>Cursos que inician (${ini.length})</h4>${ini.map(c => `<button class="crow" data-open="${esc(c.s)}"><div><b>${esc(c.a)}</b><div class="small muted">${fmt(c.i)} · ${esc(c.c)}</div></div><span class="small">${Math.round(chkPct(c) * 100)} %</span></button>`).join('') || '<p class="small muted">Ninguno.</p>'}</div>
 <div><h4>Cursos que terminan (${fin.length})</h4>${fin.map(c => `<button class="crow" data-open="${esc(c.s)}"><div><b>${esc(c.a)}</b><div class="small muted">${fmt(c.f)} · ${esc(c.c)}</div></div></button>`).join('') || '<p class="small muted">Ninguno.</p>'}</div></div>`;
  bindOpen();
}
$('#wPrev').onclick = () => {
  WOFF--;
  renderProg();
};
$('#wNext').onclick = () => {
  WOFF++;
  renderProg();
};
$('#wHoy').onclick = () => {
  WOFF = 0;
  renderProg();
};
/* ---------- Novedades del facilitador ---------- */
function renderInd() {
  const L = NOV.filter(n => n.fa === SELFA).sort(
    (a, b) =>
      (a.est === 'Cerrada y verificada') - (b.est === 'Cerrada y verificada') ||
      String(b.f).localeCompare(String(a.f))
  );
  $('#fNovList').innerHTML = L.length
    ? L.slice(0, 15)
        .map(n => {
          const c = CUR.find(x => x.s === n.s);
          return `<div class="item small ${n.est === 'Cerrada y verificada' ? 'done' : ''}"><div class="row sp"><div class="row"><span class="tag ${n.sev === 'Alta' ? 'bad' : n.sev === 'Media' ? 'wa' : ''}">${esc(n.sev)}</span><b>${esc(n.tipo)}</b></div><span class="muted">${fmt(String(n.f).slice(0, 10))}</span></div><div class="tx">${esc(n.desc)}</div><div class="muted">${esc(c ? c.a : 'General')} · ${esc(n.est)}</div></div>`;
        })
        .join('')
    : '<div class="empty">Sin novedades registradas.</div>';
}

function renderTodo() {
  const cs = curOf(SELFA),
    T = [],
    sigs = new Set(cs.map(c => c.s));
  $('#todoDate').textContent = fmt(TODAY);
  ASIG.filter(a => a.fa === SELFA && a.est !== 'Hecha')
    .sort((a, b) => String(a.lim || '9').localeCompare(String(b.lim || '9')))
    .forEach(a => {
      const v = a.lim && a.lim < TODAY;
      T.push({
        c: v || a.tipo === 'Prioridad' ? 'bad' : 'wa',
        ic: '!',
        t: `<b>${esc(a.tipo)} de Coordinación:</b> ${esc(a.txt)}`,
        d: a.lim ? (v ? 'Vencida desde ' + fmt(a.lim) : 'Para el ' + fmt(a.lim)) : 'Sin fecha límite',
        btn: `<button class="btn sm" data-ad="${a.id}">Marcar hecha</button>`,
        o: v ? 0 : 1
      });
    });
  MODS.filter(m => sigs.has(m.s) && m.es === TODAY).forEach(m => {
    const c = CUR.find(x => x.s === m.s);
    T.push({
      c: 'ok',
      ic: '◷',
      t: `<b>Encuentro hoy${m.hi ? ' ' + m.hi : ''}:</b> ${esc(m.m || '')}`,
      d: `${esc(c ? c.a : m.s)} · revisar el aula 15 minutos antes`,
      btn: `<button class="btn sm" data-open="${esc(m.s)}">Abrir curso</button>`,
      o: 2
    });
  });
  NOV.filter(n => n.fa === SELFA && n.est !== 'Cerrada y verificada').forEach(n => {
    const lim = { Alta: 1, Media: 2, Baja: 5 }[n.sev] || 2,
      v = diff(String(n.f).slice(0, 10), TODAY) > lim;
    if (v || n.est === 'Resuelta, por verificar')
      T.push({
        c: v ? 'bad' : 'wa',
        ic: 'N',
        t: `<b>Novedad ${v ? 'vencida' : 'por verificar'}:</b> ${esc(n.desc).slice(0, 100)}`,
        d: `Severidad ${esc(n.sev).toLowerCase()} · ${esc(n.est)}`,
        btn: `<a class="btn sm" href="#novedades" style="text-decoration:none">Ver</a>`,
        o: v ? 0 : 3
      });
  });
  cs.filter(c => c._f === 'Alistamiento' || (c._f === 'Prox. Inicio' && diff(TODAY, c.i) <= 10)).forEach(
    c => {
      const p = chkPct(c);
      if (p < 1)
        T.push({
          c: diff(TODAY, c.i) <= 2 ? 'bad' : 'wa',
          ic: 'A',
          t: `<b>Alistamiento:</b> ${esc(c.a)} ${diff(TODAY, c.i) < 0 ? 'inició hace ' + -diff(TODAY, c.i) + ' días' : diff(TODAY, c.i) === 0 ? 'inicia hoy' : 'inicia en ' + diff(TODAY, c.i) + ' días'}`,
          d: `Checklist al ${Math.round(p * 100)} % · ${esc(c.c)}`,
          btn: `<button class="btn sm" data-open="${esc(c.s)}">Abrir checklist</button>`,
          o: diff(TODAY, c.i) <= 2 ? 0 : 4
        });
    }
  );
  const pend = cs
    .filter(c => c._f === 'Pend. Reporte Cierre')
    .sort((a, b) => (a.f || '').localeCompare(b.f || ''));
  pend.slice(0, 5).forEach(c =>
    T.push({
      c: diff(c.f, TODAY) > 10 ? 'bad' : 'wa',
      ic: 'C',
      t: `<b>Reporte de cierre pendiente:</b> ${esc(c.a)}`,
      d: `Cerró hace ${diff(c.f, TODAY)} días · ${esc(c.c)}`,
      btn: `<button class="btn sm" data-open="${esc(c.s)}">Registrar cierre</button>`,
      o: diff(c.f, TODAY) > 10 ? 1 : 5
    })
  );
  if (pend.length > 5)
    T.push({
      c: '',
      ic: '+',
      t: `<b>${pend.length - 5} cursos más</b> pendientes de reporte de cierre`,
      d: 'Filtra por «Pend. Reporte Cierre» en tus cursos',
      btn: `<button class="btn sm" data-fz2="Pend. Reporte Cierre">Ver todos</button>`,
      o: 6
    });
  T.sort((a, b) => a.o - b.o);
  $('#todo').innerHTML = T.length
    ? T.slice(0, 14)
        .map(
          x =>
            `<div class="it ${x.c} fade"><span class="ic">${x.ic}</span><div><div>${x.t}</div><div class="small muted">${x.d}</div></div>${x.btn}</div>`
        )
        .join('')
    : '<div class="empty">Todo al día. No hay pendientes urgentes.</div>';
  document.querySelectorAll('#todo [data-fz2]').forEach(
    b =>
      (b.onclick = () => {
        FFASE = b.dataset.fz2;
        FT = 'cursos';
        renderFT();
        renderCursos();
      })
  );
}
function chkPct(c) {
  const sg = SEG[cid(c)] || {},
    et = ETAPAS_POR_FASE[c._f] || [];
  const tot = et.reduce((a, n) => a + ST[n - 1].check.length, 0);
  if (!tot) return 1;
  return (
    et.reduce((a, n) => a + ST[n - 1].check.filter((_, j) => sg.ck && sg.ck[n + '-' + j]).length, 0) / tot
  );
}
function renderCursos() {
  const cs = curOf(SELFA);
  const opts = [
    ['activos', 'Activos', cs.filter(c => ACT.includes(c._f)).length],
    ...FASES.map(f => [f, f, cs.filter(c => c._f === f).length]),
    ['todos', 'Todos', cs.length]
  ];
  $('#fChips').innerHTML = opts
    .map(
      ([k, l, n]) =>
        `<button class="chip ${FFASE === k ? 'on' : ''}" data-fz="${esc(k)}">${l} · ${n}</button>`
    )
    .join('');
  document.querySelectorAll('[data-fz]').forEach(
    b =>
      (b.onclick = () => {
        FFASE = b.dataset.fz;
        renderCursos();
      })
  );
  const q = nz(SEARCH);
  let L = cs.filter(c => FFASE === 'todos' || (FFASE === 'activos' ? ACT.includes(c._f) : c._f === FFASE));
  if (q)
    L = L.filter(c =>
      nz(
        c.a +
          ' ' +
          c.s +
          ' ' +
          c.c +
          ' ' +
          c.p +
          ' ' +
          modsOf(c.s)
            .map(m => m.pr)
            .join(' ')
      ).includes(q)
    );
  const ord = {
    'Pend. Reporte Cierre': 0,
    Cierre: 1,
    Alistamiento: 2,
    Desarrollo: 3,
    'Prox. Inicio': 4,
    Cerrado: 5,
    'Sin fecha': 6
  };
  L.sort((a, b) => ord[a._f] - ord[b._f] || (a.f || '').localeCompare(b.f || ''));
  $('#cList').innerHTML = L.length
    ? L.slice(0, 100)
        .map(c => {
          const p = chkPct(c),
            aj = c.i ? diff(TODAY, c.i) : null,
            ak = c.f ? diff(TODAY, c.f) : null,
            nv = NOV.filter(n => n.s === c.s && n.est !== 'Cerrada y verificada').length;
          const when =
            c._f === 'Prox. Inicio' || (c._f === 'Alistamiento' && aj > 0)
              ? `Inicia en ${aj} días`
              : c._f === 'Pend. Reporte Cierre'
                ? `Cerró hace ${-ak} días`
                : ak != null && ak >= 0
                  ? `Cierra en ${ak} días`
                  : '';
          return `<button class="crow fade" data-open="${esc(c.s)}"><div><b>${esc(c.a)}</b><div class="small muted">${esc(c.c)} · ${esc(c.t)} · ${fmt(c.i)} → ${fmt(c.f)}${when ? ' · ' + when : ''}</div></div><div style="text-align:right"><div class="row" style="justify-content:flex-end"><span class="tag ${faseTag(c._f)}">${c._f}</span>${nv ? `<span class="tag bad">${nv} nov.</span>` : ''}</div><div class="mini" title="Checklist ${Math.round(p * 100)} %"><i style="width:${p * 100}%"></i></div></div></button>`;
        })
        .join('') +
      (L.length > 100 ? `<p class="small muted">Mostrando 100 de ${L.length}. Usa la búsqueda.</p>` : '')
    : '<div class="empty">No hay cursos en este filtro.</div>';
  bindOpen();
}
/* ---------- panel lateral del curso ---------- */
let DRAWER = null;
function openDrawer(s) {
  DRAWER = s;
  renderDrawer();
  $('#drawer').classList.add('on');
  $('#dBg').classList.add('on');
  $('#drawer').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#dClose').focus(), 50);
}
function closeDrawer() {
  DRAWER = null;
  $('#drawer').classList.remove('on');
  $('#dBg').classList.remove('on');
  $('#drawer').setAttribute('aria-hidden', 'true');
}
$('#dClose').onclick = closeDrawer;
$('#dBg').onclick = closeDrawer;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && DRAWER) closeDrawer();
});
function renderDrawer() {
  const c = CUR.find(x => x.s === DRAWER);
  if (!c || (!isCoord() && c.fa !== ME.fa)) {
    closeDrawer();
    return;
  }
  if (
    document.activeElement &&
    document.activeElement.closest &&
    document.activeElement.closest('#dBody') &&
    ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName)
  )
    return;
  const id = cid(c),
    sg = SEG[id] || {},
    et = ETAPAS_POR_FASE[c._f] || [],
    ms = modsOf(c.s),
    k = ek(c),
    ov = (CIE[id] || {}).k || {};
  $('#dHead').innerHTML =
    `<div class="row"><span class="tag ${faseTag(c._f)}">${c._f}</span><span class="small muted">${esc(c.fa || 'Sin facilitador')}</span></div><h3 style="font-size:19px;margin:6px 0 2px">${esc(c.a)}</h3><div class="small muted">${esc(c.c)} · ${fmt(c.i)} → ${fmt(c.f)}</div>`;
  const nvs = NOV.filter(n => n.s === c.s).sort((a, b) => String(b.f).localeCompare(String(a.f))),
    ins = ASIG.filter(a => a.s === c.s);
  $('#dBody').innerHTML =
    `<div class="meta"><div><b>Sigla</b>${esc(c.s)}</div><div><b>Programa</b>${esc(c.p || '—')}</div><div><b>Estudiantes</b>${c.ss || '—'}</div><div><b>Tipo de aula</b>${esc(c.au || '—')}</div><div><b>Carga</b>${idx(c.pc || 0)} · aporta hoy ${idx((c.pc || 0) * W[c._f])}</div><div><b>Unidad</b>${esc(c.u || '—')}</div></div>
 ${c.url ? `<p style="margin-top:0"><a class="btn sm" href="${esc(c.url)}" target="_blank" rel="noopener" style="text-decoration:none">Abrir aula virtual ↗</a> <button class="btn sm" data-tp="${esc(c.s)}">Usar en plantillas</button></p>` : `<p style="margin-top:0"><button class="btn sm" data-tp="${esc(c.s)}">Usar en plantillas</button></p>`}
 ${ins.length ? `<div class="card" style="margin-bottom:12px"><h4>Indicaciones de Coordinación para este curso</h4>${ins.map(a => `<div class="small" style="padding:4px 0"><span class="tag ${a.est === 'Hecha' ? 'ok' : 'wa'}">${a.est}</span> ${esc(a.txt)}</div>`).join('')}</div>` : ''}
 <div class="card" style="margin-bottom:12px"><div class="row sp"><h4 style="margin:0">Checklist estándar de esta fase</h4><span class="small muted">${Math.round(chkPct(c) * 100)} %</span></div><div class="pbar" style="margin:8px 0 12px"><i style="width:${chkPct(c) * 100}%"></i></div>
 ${et.map(n => `<div style="margin-bottom:10px"><b class="small">Etapa ${n}. ${ST[n - 1].t}</b><ul class="check">${ST[n - 1].check.map((t, j) => `<li><label><input type="checkbox" data-ck="${id}" data-k="${n}-${j}" ${sg.ck && sg.ck[n + '-' + j] ? 'checked' : ''}><span>${esc(t)}</span></label></li>`).join('')}</ul></div>`).join('')}</div>
 <div class="card" style="margin-bottom:12px"><h4>Tareas de cierre</h4><p class="small muted" style="margin-top:0">Lo que dice el Excel. Si haces una tarea, regístrala aquí con su fecha y luego usa «Llevar al Excel».</p>
 <table class="tasks small"><tbody>${CIERRE.map(([kk, l]) => {
   const v = k[kk] || '',
     isD = /^\d{4}-\d\d-\d\d$/.test(v),
     na = /^n\/?a$/i.test(v),
     fromG = !!ov[kk];
   return `<tr><td>${l}${fromG ? ' <span class="tag dk">Guía</span>' : ''}</td><td style="text-align:right">${isD && !fromG ? `<span class="tag ok">${fmt(v)}</span>` : na ? '<span class="tag">N/A</span>' : `${v && !isD ? `<span class="tag wa">${esc(v)}</span> ` : ''}<input type="date" data-cie="${kk}" value="${fromG ? esc(ov[kk]) : ''}" aria-label="${l}">`}</td></tr>`;
 }).join('')}</tbody></table></div>
 <div class="card" style="margin-bottom:12px"><h4>Nota del curso</h4><textarea data-nota="${id}" placeholder="Acuerdos, pendientes, observaciones (la ve todo el equipo)">${esc(sg.nota || '')}</textarea></div>
 <div class="card" style="margin-bottom:12px"><h4>Novedades del curso (${nvs.length})</h4>${nvs.map(n => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--ln)"><span class="tag ${n.sev === 'Alta' ? 'bad' : n.sev === 'Media' ? 'wa' : ''}">${esc(n.sev)}</span> <b>${esc(n.tipo)}</b> · ${esc(n.desc)} <span class="muted">· ${esc(n.est)}</span></div>`).join('')}
 <div class="grid g2" style="margin-top:10px"><label class="f">Tipo<select id="dnTipo"><option>Información</option><option>Aula y configuración</option><option>Docente</option><option>Estudiante</option><option>Plataforma o soporte</option><option>Cronograma y fechas</option><option>Calificaciones</option></select></label><label class="f">Severidad<select id="dnSev"><option>Alta</option><option selected>Media</option><option>Baja</option></select></label></div>
 <label class="f" style="margin-top:8px">Descripción<textarea id="dnDesc" placeholder="Qué pasó y a quién afecta"></textarea></label>
 <div class="row" style="margin-top:8px"><select id="dnResp" style="width:auto"><option>Implementación</option><option>Escalada a Coordinación</option><option>Soporte (ticket)</option></select><button class="btn pri sm" id="dnAdd">Registrar novedad</button></div></div>
 <div class="card"><h4>Módulos (${ms.length})</h4>${ms.length ? `<div class="tw"><table class="small"><thead><tr><th>Módulo</th><th>Docente</th><th>Fechas</th><th>Encuentro</th></tr></thead><tbody>${ms.map(m => `<tr ${m.i <= TODAY && m.f >= TODAY ? 'style="background:var(--okb)"' : ''}><td>${esc(m.m || '')}</td><td>${esc(m.pr || '')}</td><td style="white-space:nowrap">${fmt(m.i).slice(0, 6)} – ${fmt(m.f).slice(0, 6)}</td><td style="white-space:nowrap">${m.es ? fmt(m.es).slice(0, 6) + (m.hi ? ' ' + m.hi : '') : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small muted">Sin módulos.</p>'}</div>`;
  const B = $('#dBody');
  B.querySelectorAll('[data-ck]').forEach(
    i =>
      (i.onchange = async () => {
        const k2 = i.dataset.k;
        const cur = SEG[id] || {};
        const ck = { ...(cur.ck || {}), [k2]: i.checked };
        SEG[id] = { ...cur, ck };
        await wr(() => S.set('seg', id, { ...cur, ck, s: c.s, u: new Date().toISOString() }));
        renderCursosSoft();
      })
  );
  B.querySelectorAll('[data-nota]').forEach(t => {
    let tm;
    t.oninput = () => {
      clearTimeout(tm);
      tm = setTimeout(async () => {
        const cur = SEG[id] || {};
        SEG[id] = { ...cur, nota: t.value };
        await wr(() => S.set('seg', id, { ...cur, nota: t.value, s: c.s, u: new Date().toISOString() }));
      }, 700);
    };
  });
  B.querySelectorAll('[data-cie]').forEach(
    inp =>
      (inp.onchange = async () => {
        const cur = CIE[id] || {};
        const kk = { ...(cur.k || {}) };
        if (inp.value) kk[inp.dataset.cie] = inp.value;
        else delete kk[inp.dataset.cie];
        CIE[id] = { ...cur, k: kk };
        await wr(() => S.set('cierre', id, { s: c.s, a: c.a, fa: c.fa, k: kk, u: new Date().toISOString() }));
        toast('Tarea de cierre registrada');
        renderAll();
      })
  );
  B.querySelectorAll('[data-tp]').forEach(
    b =>
      (b.onclick = () => {
        closeDrawer();
        location.hash = '#plantillas';
        setTimeout(() => {
          fillTplCursos();
          $('#tCurso').value = b.dataset.tp;
          useCourse(b.dataset.tp);
        }, 60);
      })
  );
  $('#dnAdd').onclick = async () => {
    const desc = $('#dnDesc').value.trim();
    if (!desc) {
      $('#dnDesc').focus();
      return;
    }
    const r = $('#dnResp').value;
    await wr(() =>
      S.add('nov', {
        fa: c.fa,
        s: c.s,
        tipo: $('#dnTipo').value,
        sev: $('#dnSev').value,
        resp: r,
        desc,
        acc: '',
        est: r === 'Implementación' ? 'Abierta' : 'Escalada',
        f: new Date().toISOString()
      })
    );
    toast('Novedad registrada');
  };
}
let rcs;
function renderCursosSoft() {
  clearTimeout(rcs);
  rcs = setTimeout(() => {
    if (cur() === 'facilitador') {
      renderCursos();
      renderTodo();
      bindTodo();
    }
  }, 200);
}
function bindTodo() {
  document.querySelectorAll('#todo [data-ad]').forEach(
    b =>
      (b.onclick = async () => {
        const a = ASIG.find(x => x.id === b.dataset.ad);
        await wr(() => S.upd('asig', a.id, { est: 'Hecha', fh: new Date().toISOString() }));
        toast('Indicación marcada como hecha');
      })
  );
  bindOpen();
}
$('#fSel').onchange = e => {
  SELFA = e.target.value;
  lsSet('guia3:selfa', SELFA);
  OPEN.clear();
  FFASE = 'activos';
  renderFac();
};
$('#cSearch').oninput = e => {
  SEARCH = e.target.value;
  renderCursos();
};
$('#aAdd').onclick = async () => {
  const txt = $('#aTxt').value.trim();
  if (!txt) {
    $('#aTxt').focus();
    return;
  }
  await wr(() =>
    S.add('asig', {
      fa: SELFA,
      tipo: $('#aTipo').value,
      txt,
      lim: $('#aLim').value,
      s: $('#aCurso').value,
      est: 'Pendiente',
      f: new Date().toISOString(),
      resp: ''
    })
  );
  $('#aTxt').value = '';
  $('#aLim').value = '';
  toast('Indicación enviada a ' + SELFA);
};
async function wr(fn) {
  try {
    await fn();
  } catch (e) {
    toast(
      e && e.code === 'invalid_argument'
        ? 'No tienes permiso para guardar cambios'
        : e && e.code === 'quota_exceeded'
          ? 'Se llenó el espacio de almacenamiento'
          : 'No se pudo guardar; intenta de nuevo'
    );
  }
}

/* =================== NOVEDADES =================== */
const NE = ['Abierta', 'Escalada', 'Resuelta, por verificar', 'Cerrada y verificada'];
function fillNovCursos() {
  const fa = $('#nFa').value;
  $('#nCurso').innerHTML =
    '<option value="">General</option>' +
    curOf(fa)
      .filter(c => c._f !== 'Cerrado')
      .sort((a, b) => a.a.localeCompare(b.a, 'es'))
      .map(c => `<option value="${esc(c.s)}">${esc(c.a)} · ${esc(c.c)}</option>`)
      .join('');
}
function renderNov() {
  const L = isCoord() ? facs() : [ME.fa].filter(Boolean);
  const keepFa = isCoord() ? $('#nFa').value || SELFA : ME.fa;
  $('#nFa').innerHTML = L.map(f => `<option ${f === keepFa ? 'selected' : ''}>${esc(f)}</option>`).join('');
  if (!$('#nCurso').options.length || $('#nCurso').dataset.fa !== $('#nFa').value) {
    fillNovCursos();
    $('#nCurso').dataset.fa = $('#nFa').value;
  }
  $('#nFa').disabled = !isCoord();
  $('#nFiltroFa').classList.toggle('hide', !isCoord());
  const ff = isCoord() ? $('#nFiltroFa').value : ME.fa;
  $('#nFiltroFa').innerHTML =
    '<option value="">Todos los facilitadores</option>' +
    L.map(f => `<option ${f === ff ? 'selected' : ''}>${esc(f)}</option>`).join('');
  const fl = $('#nFiltro').value;
  let X = NOV.filter(
    n =>
      (fl === 'todas' ||
        (fl === 'cerradas' ? n.est === 'Cerrada y verificada' : n.est !== 'Cerrada y verificada')) &&
      (!ff || n.fa === ff)
  ).sort((a, b) => String(b.f).localeCompare(String(a.f)));
  const ab = NOV.filter(n => n.est !== 'Cerrada y verificada');
  $('#cNov').textContent = ab.length;
  $('#nRes').textContent = `${ab.length} abiertas · ${NOV.length - ab.length} cerradas`;
  $('#nList').innerHTML = X.length
    ? X.map(n => {
        const lim = { Alta: 1, Media: 2, Baja: 5 }[n.sev] || 2,
          d = diff(String(n.f).slice(0, 10), TODAY),
          venc = n.est !== 'Cerrada y verificada' && d > lim;
        const c = CUR.find(x => x.s === n.s);
        return `<tr><td style="white-space:nowrap">${fmt(String(n.f).slice(0, 10))}${venc ? '<br><span class="tag bad">Vencida</span>' : ''}</td><td>${esc(n.fa)}</td><td>${esc(c ? c.a : n.s || 'General')}</td><td>${esc(n.tipo)}<div class="small muted">${esc(n.resp)}</div></td><td><span class="tag ${n.sev === 'Alta' ? 'bad' : n.sev === 'Media' ? 'wa' : ''}">${esc(n.sev)}</span></td><td>${esc(n.desc)}${n.acc ? `<div class="small muted">Acción: ${esc(n.acc)}</div>` : ''}</td><td><select data-ns="${n.id}" style="min-width:150px">${NE.map(e => `<option ${e === n.est ? 'selected' : ''}>${e}</option>`).join('')}</select></td></tr>`;
      }).join('')
    : '<tr><td colspan="7"><div class="empty">Sin novedades en este filtro.</div></td></tr>';
  document.querySelectorAll('[data-ns]').forEach(
    s =>
      (s.onchange = async () => {
        const n = NOV.find(x => x.id === s.dataset.ns);
        if (
          s.value === 'Cerrada y verificada' &&
          !confirm('¿Verificaste que la solución funcionó? Solo así se cierra.')
        ) {
          s.value = n.est;
          return;
        }
        await wr(() => S.upd('nov', n.id, { est: s.value, fe: new Date().toISOString() }));
      })
  );
}
$('#nFa').onchange = () => {
  fillNovCursos();
  $('#nCurso').dataset.fa = $('#nFa').value;
};
$('#nFiltro').onchange = renderNov;
$('#nFiltroFa').onchange = renderNov;
$('#nAdd').onclick = async () => {
  const desc = $('#nDesc').value.trim();
  if (!desc) {
    $('#nDesc').focus();
    toast('Describe la novedad');
    return;
  }
  const r = $('#nResp').value;
  await wr(() =>
    S.add('nov', {
      fa: $('#nFa').value,
      s: $('#nCurso').value,
      tipo: $('#nTipo').value,
      sev: $('#nSev').value,
      resp: r,
      desc,
      acc: $('#nAcc').value.trim(),
      est: r === 'Implementación' ? 'Abierta' : 'Escalada',
      f: new Date().toISOString()
    })
  );
  $('#nDesc').value = '';
  $('#nAcc').value = '';
  toast('Novedad registrada');
};

/* =================== GUÍA (proceso, plantillas, criterios) =================== */
$('#timeline').innerHTML = TL.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('');
$('#stages').innerHTML = ST.map(s => {
  const tmin = s.steps.reduce((a, x) => a + (parseFloat(x[1]) || 0), 0);
  return `<details class="stage"><summary><span class="num">${s.n}</span><span><b>${s.t}</b><br><span class="small muted">${s.fase}${s.loop ? ' · ciclo semanal' : ''} · ${s.cuando}</span></span><span class="small muted">≈ ${tmin} min</span></summary>
<div class="sbody"><div class="meta"><div><b>Quién</b>${s.quien}</div><div><b>Entradas</b>${s.entra}</div><div><b>Salida</b>${s.sale}</div></div>
<div class="cols"><div><h4>Pasos estándar</h4><ol class="steps">${s.steps.map(([a, m, x]) => `<li>${a}${m && m !== '—' ? `<span class="min">${m} min</span>` : ''}${x ? `<span class="sx">${x}</span>` : ''}</li>`).join('')}</ol></div>
<div><h4>Checklist</h4><ul class="check">${s.check.map(c => `<li><label><input type="checkbox" disabled><span>${c}</span></label></li>`).join('')}</ul><p class="small muted">El checklist de cada curso se marca en el panel del facilitador.</p></div></div>
<div class="box done"><b>Listo cuando</b>${s.listo}</div><div class="box no"><b>No hacer</b>${s.no.join(' ')}</div><div class="box up"><b>Escalar si</b>${s.escala}</div></div></details>`;
}).join('');
let VARS = lsGet('guia3:vars', {});
const MOM = [...new Set(TPL.map(t => t.m))];
$('#tFiltro').innerHTML += MOM.map(m => `<option>${m}</option>`).join('');
function syncVarInputs() {
  document.querySelectorAll('[data-v]').forEach(i => {
    i.value = VARS[i.dataset.v] || '';
  });
}
document.querySelectorAll('[data-v]').forEach(
  i =>
    (i.oninput = () => {
      VARS[i.dataset.v] = i.value;
      lsSet('guia3:vars', VARS);
      renderTpl();
    })
);
syncVarInputs();
function fillTplCursos() {
  const fa = SELFA;
  $('#tCurso').innerHTML =
    '<option value="">— Elegir curso de ' +
    esc(fa || '') +
    ' —</option>' +
    curOf(fa)
      .filter(c => c._f !== 'Cerrado')
      .sort((a, b) => a.a.localeCompare(b.a, 'es'))
      .map(c => `<option value="${esc(c.s)}">${esc(c.a)} · ${esc(c.c)}</option>`)
      .join('');
}
function useCourse(s) {
  const c = CUR.find(x => x.s === s);
  if (!c) return;
  const ms = modsOf(s);
  const next = ms.filter(m => m.es && m.es >= TODAY).sort((a, b) => a.es.localeCompare(b.es))[0];
  const doc = (ms.find(m => m.pr && !/e-learning/i.test(m.pr)) || {}).pr || '';
  Object.assign(VARS, {
    programa: c.p && c.p !== 'N/A' ? c.p : c.a,
    asignatura: c.a,
    docente: doc,
    facilitador: c.fa,
    fecha: next ? fmt(next.es) : fmt(c.i),
    hora: next && next.hi ? next.hi : VARS.hora || '',
    enlace: c.url || VARS.enlace || ''
  });
  lsSet('guia3:vars', VARS);
  syncVarInputs();
  renderTpl();
  toast('Plantillas llenas con ' + c.a);
}
$('#tCurso').onchange = e => useCourse(e.target.value);
function fill(x, html) {
  return x.replace(/\{(\w+)\}/g, (m, k) => {
    const v = VARS[k];
    return v ? (html ? esc(v) : v) : html ? `<mark>[${k}]</mark>` : `[${k}]`;
  });
}
function renderTpl() {
  const f = $('#tFiltro').value;
  $('#tplList').innerHTML = TPL.filter(t => !f || t.m === f)
    .map(
      t =>
        `<div class="tpl"><div class="row sp"><h3 style="margin:0">${t.n}</h3><button class="btn sm" data-cp="${t.id}">Copiar</button></div><div class="row small muted" style="margin-top:4px"><span class="tag">${t.m}</span>Para: ${t.para} · ${t.canal}</div><pre>${fill(esc(t.x), true)}</pre></div>`
    )
    .join('');
  document
    .querySelectorAll('[data-cp]')
    .forEach(b => (b.onclick = () => copy(fill(TPL.find(t => t.id === b.dataset.cp).x, false))));
}
function copy(t) {
  const done = () => toast('Copiado');
  const fb = () => {
    const a = document.createElement('textarea');
    a.value = t;
    document.body.appendChild(a);
    a.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      toast('Selecciona y copia el texto');
    }
    a.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fb);
  else fb();
}
$('#tFiltro').onchange = renderTpl;
renderTpl();
$('#defs').innerHTML = DEFS.map(
  ([a, b]) => `<div class="card"><h3>${a}</h3><p class="muted" style="margin:0">${b}</p></div>`
).join('');
$('#raci').innerHTML = RACI.map(
  r =>
    `<tr><td><b>${r[0]}</b></td>${r
      .slice(1)
      .map(c => `<td class="mono small">${c}</td>`)
      .join('')}</tr>`
).join('');
$('#canales').innerHTML = CAN.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join('');
$('#carpetas').innerHTML = CARP.map(c => `<li>${c}</li>`).join('');
$('#kpis').innerHTML = KP.map(
  r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="muted">${r[2]}</td><td>${r[3]}</td></tr>`
).join('');
$('#riesgos').innerHTML = RSK.map(r => `<li>${r}</li>`).join('');
$('#rutina').innerHTML = RUT.map(
  ([g, it]) =>
    `<h4 style="margin-top:8px">${g}</h4><ul class="small">${it.map(([t, m]) => `<li>${t}${m ? ` <span class="muted mono">${m} min</span>` : ''}</li>`).join('')}</ul>`
).join('');
$('#semana').innerHTML = SEM.map(
  ([d, l]) => `<p class="small" style="margin:0 0 8px"><b>${d}:</b> ${l.join(' · ')}</p>`
).join('');

/* =================== USUARIOS Y PERMISOS =================== */
let USERS_CACHE = [];
async function renderUsers() {
  if (!isCoord()) return;
  const F = facs();
  $('#uFa').innerHTML = F.map(f => `<option>${esc(f)}</option>`).join('');
  try {
    USERS_CACHE = await AUTH.users.list();
  } catch (e) {
    $('#uList').innerHTML = `<tr><td colspan="6"><div class="empty">${esc(e.message)}</div></td></tr>`;
    return;
  }
  $('#uList').innerHTML = USERS_CACHE.sort(
    (a, b) => (a.rol > b.rol ? 1 : -1) || a.usuario.localeCompare(b.usuario)
  )
    .map(
      u => `<tr><td class="mono small">${esc(u.usuario)}</td><td>${esc(u.nombre)}</td><td><span class="tag ${u.rol === 'coordinador' ? 'dk' : ''}">${u.rol === 'coordinador' ? 'Coordinador' : 'Facilitador'}</span></td><td>${esc(u.fa || '—')}${u.rol === 'facilitador' && u.fa && !F.includes(u.fa) ? ' <span class="tag bad">no está en el Excel</span>' : ''}</td><td>${u.activo ? '<span class="tag ok">Activo</span>' : '<span class="tag">Inactivo</span>'}</td>
 <td><div class="row" style="justify-content:flex-end">${u.usuario === AUTH.user.usuario ? '<span class="small muted">Usted</span>' : `<button class="btn sm" data-ureset="${esc(u.usuario)}">Nueva contraseña</button><button class="btn sm" data-utog="${esc(u.usuario)}">${u.activo ? 'Desactivar' : 'Activar'}</button><button class="btn sm" data-udel="${esc(u.usuario)}">Eliminar</button>`}</div></td></tr>`
    )
    .join('');
  const act = async (fn, ok) => {
    try {
      await fn();
      toast(ok);
      renderUsers();
    } catch (e) {
      toast(e.message);
    }
  };
  document.querySelectorAll('[data-ureset]').forEach(
    b =>
      (b.onclick = () => {
        const p = prompt(
          'Nueva contraseña temporal para ' + b.dataset.ureset + ' (mínimo 8 caracteres):',
          genPass()
        );
        if (p) act(() => AUTH.users.update(b.dataset.ureset, { clave: p }), 'Contraseña actualizada');
      })
  );
  document.querySelectorAll('[data-utog]').forEach(
    b =>
      (b.onclick = () => {
        const u = USERS_CACHE.find(x => x.usuario === b.dataset.utog);
        act(
          () => AUTH.users.update(u.usuario, { activo: !u.activo }),
          u.activo ? 'Usuario desactivado' : 'Usuario activado'
        );
      })
  );
  document.querySelectorAll('[data-udel]').forEach(
    b =>
      (b.onclick = () => {
        if (confirm('¿Eliminar el usuario ' + b.dataset.udel + '? Sus registros se conservan.'))
          act(() => AUTH.users.remove(b.dataset.udel), 'Usuario eliminado');
      })
  );
}
const genPass = () => {
  const a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p = '';
  const r = new Uint32Array(12);
  crypto.getRandomValues(r);
  r.forEach(x => (p += a[x % a.length]));
  return p;
};
$('#uRol').onchange = () => $('#uFaWrap').classList.toggle('hide', $('#uRol').value !== 'facilitador');
$('#uGen').onclick = () => {
  $('#uPass').value = genPass();
};
$('#uFa').onchange = () => {
  if (!$('#uNom').value) $('#uNom').value = $('#uFa').value;
};
$('#uAdd').onclick = async () => {
  const u = {
    usuario: $('#uUser').value.trim().toLowerCase(),
    nombre: $('#uNom').value.trim() || ($('#uRol').value === 'facilitador' ? $('#uFa').value : ''),
    rol: $('#uRol').value,
    fa: $('#uRol').value === 'facilitador' ? $('#uFa').value : '',
    clave: $('#uPass').value
  };
  try {
    await AUTH.users.create(u);
    $('#uMsg').textContent =
      `Usuario creado. Entregue a la persona su usuario «${u.usuario}» y la contraseña temporal, y pídale cambiarla al entrar.`;
    ['#uUser', '#uNom', '#uPass'].forEach(x => ($(x).value = ''));
    renderUsers();
  } catch (e) {
    $('#uMsg').textContent = e.message;
  }
};
$('#pwNo').onclick = () => $('#pwd').classList.remove('on');
$('#pwOk').onclick = async () => {
  try {
    await AUTH.changePassword($('#pwA').value, $('#pwN').value);
    $('#pwd').classList.remove('on');
    toast('Contraseña actualizada');
  } catch (e) {
    $('#pwErr').textContent = e.message;
  }
};
/* Pantalla de acceso */
function showLogin(conn) {
  document.body.classList.add('locked');
  $('#login').classList.remove('hide');
  if (conn.local) {
    $('#lgForm').classList.add('hide');
    $('#lgLocal').classList.remove('hide');
    $('#lgSub').textContent = 'Modo local: elija con qué rol entrar en este equipo.';
    const F = conn.facs();
    $('#lgFa').innerHTML = F.length
      ? F.map(f => `<option>${esc(f)}</option>`).join('')
      : '<option value="">Primero cargue el Excel como Coordinación</option>';
    $('#lgFacBtn').disabled = !F.length;
    $('#lgNote').textContent =
      'En este modo no hay control de acceso real. Para permisos seguros use el servidor (sección Instalación de la documentación).';
    $('#lgCoord').onclick = () => conn.login('coord', '');
    $('#lgFacBtn').onclick = () => conn.login('fac', $('#lgFa').value);
    $('#lgCoord').focus();
    return;
  }
  $('#lgUser').focus();
  $('#lgForm').onsubmit = async e => {
    e.preventDefault();
    $('#lgErr').textContent = '';
    $('#lgBtn').disabled = true;
    try {
      await conn.login($('#lgUser').value.trim(), $('#lgPass').value);
    } catch (err) {
      $('#lgErr').textContent = err.message || 'No se pudo entrar.';
      $('#lgBtn').disabled = false;
    }
  };
}
/* =================== ROL Y RUTEO =================== */
function renderUserBox() {
  if (!AUTH) return;
  const u = AUTH.user,
    ini = (u.nombre || u.fa || '?')
      .split(/\s+/)
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  $('#userBox').innerHTML =
    `<div class="ubox"><div class="who"><b>${esc(u.nombre || u.fa || 'Usuario')}</b><span class="muted">${isCoord() ? 'Coordinador' : 'Facilitador'}${AUTH.mode === 'local' ? ' · modo local' : ''}</span></div><span class="avatar" aria-hidden="true">${esc(ini)}</span>${AUTH.changePassword ? '<button class="btn sm" id="btnPwd">Contraseña</button>' : ''}<button class="btn sm" id="btnOut">Salir</button></div>`;
  if ($('#btnOut')) $('#btnOut').onclick = () => AUTH.logout();
  if ($('#btnPwd'))
    $('#btnPwd').onclick = () => {
      $('#pwA').value = '';
      $('#pwN').value = '';
      $('#pwErr').textContent = '';
      $('#pwd').classList.add('on');
      $('#pwA').focus();
    };
}
function applyRoleUI() {
  const c = isCoord();
  $('#tEquipo').classList.toggle('hide', !c);
  $('#tUsuarios').classList.toggle('hide', !c || AUTH.mode === 'local');
  $('#tFac').textContent = c ? 'Facilitador' : 'Mi panel';
  $('#btnImport').classList.toggle('hide', !CAN_IMPORT);
  $('#btnExport').classList.toggle('hide', !c);
}
const V = ['equipo', 'facilitador', 'novedades', 'proceso', 'plantillas', 'criterios', 'usuarios'];
function cur() {
  const h = location.hash.slice(1);
  if (!isCoord() && (h === 'equipo' || h === 'usuarios')) return 'facilitador';
  if (h === 'usuarios' && AUTH && AUTH.mode === 'local') return 'equipo';
  return V.includes(h) ? h : isCoord() ? 'equipo' : 'facilitador';
}
function show() {
  const v = cur();
  document.querySelectorAll('section.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v));
  document
    .querySelectorAll('nav.tabs a')
    .forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + v));
  if (v === 'equipo') renderTeam();
  if (v === 'facilitador') renderFac();
  if (v === 'novedades') renderNov();
  if (v === 'plantillas') fillTplCursos();
  if (v === 'usuarios') renderUsers();
}
window.addEventListener('hashchange', () => {
  show();
  window.scrollTo(0, 0);
});
let rt;
function renderAll() {
  clearTimeout(rt);
  rt = setTimeout(() => {
    CUR.forEach(c => {
      c._f = fase(c);
    });
    renderUserBox();
    if (DRAWER) renderDrawer();
    show();
    $('#cNov').textContent = NOV.filter(n => n.est !== 'Cerrada y verificada').length;
    const src = META
      ? `${META.archivo || 'Excel'} · ${META.ncur || CUR.length} cursos · actualizado ${fmt(String(META.fecha).slice(0, 10))} ${String(META.fecha).slice(11, 16)}`
      : 'Sin datos del Excel todavía';
    setStatus(`${Store.label} · ${src}`, LIVE);
  }, 30);
}

/* =================== ARRANQUE =================== */
let S = null,
  LIVE = false,
  CAN_IMPORT = false;
function setStatus(t, live) {
  $('#status').innerHTML = `<span class="dot ${live ? 'live' : ''}"></span>${esc(t)}`;
}
(async function () {
  initExcelUI();
  // ── Conexión CONDICIONAL a la base de datos y al sistema de acceso:
  //    la decide js/config.js (CONFIG.DATA_SOURCE) y la implementa js/store.js.
  const conn = await Store.connect();
  if (conn.needLogin) {
    showLogin(conn);
    return;
  }
  AUTH = conn.auth;
  ME = { ...conn.auth.user };
  S = conn.store;
  LIVE = conn.live;
  CAN_IMPORT = conn.canImport && ME.rol === 'coord';
  if (!isCoord()) SELFA = ME.fa;
  applyRoleUI();
  renderUserBox();
  show();
  setStatus(`${conn.label} · ${LIVE ? 'cargando datos…' : 'carga el Excel para empezar'}`, LIVE);
  S.sub('excel', onExcel);
  S.sub('asig', d => {
    ASIG = d;
    renderAll();
  });
  S.sub('rutina', d => {
    const o = {};
    d.forEach(x => (o[x.id] = x));
    RUTD = o;
    if (
      document.activeElement &&
      document.activeElement.dataset &&
      (document.activeElement.dataset.r || document.activeElement.dataset.w)
    ) {
      renderDiaSoft();
      if (cur() === 'equipo') renderTeam();
      return;
    }
    renderAll();
  });
  S.sub('cierre', d => {
    const o = {};
    d.forEach(x => (o[x.id] = x));
    CIE = o;
    renderAll();
  });
  S.sub('nov', d => {
    NOV = d;
    renderAll();
  });
  S.sub('seg', d => {
    const o = {};
    d.forEach(x => (o[x.id] = x));
    SEG = o;
    if (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.nota)
      return;
    renderAll();
  });
})();
