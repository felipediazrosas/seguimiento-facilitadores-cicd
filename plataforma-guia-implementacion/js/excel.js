/* ============================================================
   excel.js — Integración con el Excel de programación (ida y vuelta)
   · importFile(): lee Programacion_2026.xlsx en el navegador (SheetJS) y
     guarda cursos, módulos y facilitadores en la base de datos en bloques.
   · exportExcel(): edita una COPIA del .xlsx por dentro (JSZip + XML) para
     agregar las hojas «Guía …» y completar tareas de cierre en celdas vacías,
     sin tocar tablas dinámicas, segmentaciones, formatos ni fórmulas.
   El archivo nunca sale del equipo: se procesa en el navegador.
   ============================================================ */
/* =================== IMPORTAR EXCEL =================== */
function loadLib(globalName, srcs, errMsg) {
  return new Promise((ok, ko) => {
    if (window[globalName]) return ok();
    const tryNext = i => {
      if (i >= srcs.length) return ko(new Error(errMsg));
      const s = document.createElement('script');
      s.src = srcs[i];
      s.onload = () => (window[globalName] ? ok() : tryNext(i + 1));
      s.onerror = () => {
        s.remove();
        tryNext(i + 1);
      };
      document.head.appendChild(s);
    };
    tryNext(0);
  });
}
const loadXLSX = () => loadLib('XLSX', CONFIG.LIBS.XLSX, 'No se pudo cargar el lector de Excel');
const nz = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
function cellV(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  if (!cell || cell.v == null) return '';
  if (cell.t === 'n') {
    const fmtz = cell.z || '';
    if (XLSX.SSF.is_date(fmtz)) {
      const p = XLSX.SSF.parse_date_code(cell.v);
      if (cell.v < 1) return { time: pad(p.H) + ':' + pad(p.M) };
      return { date: p.y + '-' + pad(p.m) + '-' + pad(p.d) };
    }
    return cell.v;
  }
  if (cell.t === 'd') {
    const d = cell.v;
    return { date: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) };
  }
  if (cell.t === 'b') return cell.v ? 'TRUE' : 'FALSE';
  return String(cell.v).trim();
}
const asD = x => (x && x.date ? x.date : '');
const asT = x => (x && x.time ? x.time : '');
const asS = x =>
  x === '' || x == null
    ? ''
    : x.date
      ? x.date
      : x.time
        ? x.time
        : typeof x === 'number'
          ? Number.isInteger(x)
            ? String(x)
            : String(x)
          : String(x).trim();
function header(ws, r, range) {
  const m = {};
  for (let c = range.s.c; c <= range.e.c; c++) {
    const k = nz(asS(cellV(ws, r, c)));
    if (k) (m[k] = m[k] || []).push(c);
  }
  return m;
}
async function parseExcel(buf) {
  await loadXLSX();
  const wb = XLSX.read(buf, { type: 'array', cellNF: true, cellFormula: false });
  const need = ['2026', 'Seguimiento Cierre Cursos'];
  const find = n => wb.SheetNames.find(x => nz(x) === nz(n));
  for (const n of need) if (!find(n)) throw new Error('No encuentro la hoja «' + n + '» en el archivo');
  // 2026
  let ws = wb.Sheets[find('2026')],
    rg = XLSX.utils.decode_range(ws['!ref']),
    H = header(ws, rg.s.r, rg);
  const g = (r, k, last) => (H[k] ? cellV(ws, r, H[k][last ? H[k].length - 1 : 0]) : '');
  const facBy = {},
    aulaBy = {},
    mods = [];
  for (let r = rg.s.r + 1; r <= rg.e.r; r++) {
    const s = asS(g(r, 'sigla programa'));
    if (!s) continue;
    const fa = asS(g(r, 'facilitador de aprendizaje virtual'));
    if (fa && !(s in facBy)) facBy[s] = fa;
    const au = asS(g(r, 'aula virtual'));
    if (au.startsWith('http') && !(s in aulaBy)) aulaBy[s] = au;
    const m = {
      s,
      m: asS(g(r, 'modulo/unidad/leccion')),
      pr: asS(g(r, 'profesor')),
      em: asS(g(r, 'correo profesor institucional')),
      i: asD(g(r, 'fecha de inicio')),
      f: asD(g(r, 'fecha de cierre')),
      es: asD(g(r, 'fecha encuentros sincronicos')),
      hi: asT(g(r, 'hora inicio')),
      hf: asT(g(r, 'hora fin'))
    };
    for (const k in m) if (m[k] === '') delete m[k];
    mods.push(m);
  }
  // Seguimiento
  ws = wb.Sheets[find('Seguimiento Cierre Cursos')];
  rg = XLSX.utils.decode_range(ws['!ref']);
  H = header(ws, rg.s.r, rg);
  const cur = [];
  for (let r = rg.s.r + 1; r <= rg.e.r; r++) {
    const a = asS(g(r, 'asignatura')),
      s = asS(g(r, 'sigla programa'));
    if (!a || !s) continue;
    let fa = asS(g(r, 'facilitador de aprendizaje virtual'));
    if (!fa || fa === '0') fa = facBy[s] || '';
    let ss = g(r, '#ss', true);
    if (typeof ss !== 'number') {
      ss = g(r, '#ss');
      if (typeof ss !== 'number') ss = 0;
    }
    let pc = g(r, '% carga programa');
    if (typeof pc !== 'number') pc = 0;
    const k = {
      car: asS(g(r, 'encuestas de caracterizacion')),
      rep: asS(g(r, 'envio de reporte de cierre (excel)')),
      siga: asS(g(r, 'subida de notas a siga')),
      bi: asS(g(r, 'generacion de bi de encuestas de percep.')),
      exi: asS(g(r, 'ingreso de notas al archivo de exito academico')),
      con: asS(g(r, 'cierre del curso en consolidado de programacion'))
    };
    cur.push({
      s,
      a,
      p: asS(g(r, 'nombre del programa formal')),
      c: asS(g(r, 'cohorte')),
      t: asS(g(r, 'tipo')),
      u: asS(g(r, 'unidad academica')),
      i: asD(g(r, 'fecha de inicio')),
      f: asD(g(r, 'fecha de cierre')),
      ss: Math.round(ss),
      pc: Math.round(pc * 1e4) / 1e4,
      au: asS(g(r, 'tipo de aula')),
      fa: fa.trim(),
      k,
      url: aulaBy[s] || ''
    });
  }
  const sig = new Set(cur.map(c => c.s));
  // Carga (roster)
  const ros = [];
  const cn = find('Carga');
  if (cn) {
    ws = wb.Sheets[cn];
    rg = XLSX.utils.decode_range(ws['!ref']);
    for (let r = rg.s.r; r <= rg.e.r; r++) {
      const h = header(ws, r, rg);
      if (h['nombres'] && h['cargo']) {
        const ni = h['nombres'][0],
          ci = h['cargo'][0],
          ei = h['correo'] ? h['correo'][0] : null;
        for (let rr = r + 1; rr <= rg.e.r; rr++) {
          const n = asS(cellV(ws, rr, ni));
          if (n) ros.push({ n, cargo: asS(cellV(ws, rr, ci)), em: ei != null ? asS(cellV(ws, rr, ei)) : '' });
        }
        break;
      }
    }
  }
  return { cur, mods: mods.filter(m => sig.has(m.s)), ros };
}
function chunks(arr, max = 190000) {
  const out = [];
  let cur = [],
    size = 2;
  for (const it of arr) {
    const l = JSON.stringify(it).length + 1;
    if (size + l > max && cur.length) {
      out.push(cur);
      cur = [];
      size = 2;
    }
    cur.push(it);
    size += l;
  }
  if (cur.length) out.push(cur);
  return out;
}
async function importFile(file) {
  const ov = $('#ov');
  $('#ovT').textContent = 'Actualizando desde Excel';
  ov.classList.add('on');
  const msg = t => ($('#ovM').textContent = t),
    bar = p => ($('#ovB').style.width = p + '%');
  try {
    msg('Leyendo ' + file.name + '…');
    bar(5);
    const D = await parseExcel(await file.arrayBuffer());
    if (!D.cur.length) throw new Error('La hoja Seguimiento Cierre Cursos no tiene cursos');
    const cc = chunks(D.cur),
      mc = chunks(D.mods),
      tot = cc.length + mc.length + 1;
    let n = 0;
    msg(`${D.cur.length} cursos y ${D.mods.length} módulos. Guardando…`);
    for (let i = 0; i < cc.length; i++) {
      await S.set('excel', 'c' + i, { items: cc[i] });
      bar(10 + (++n / tot) * 85);
    }
    for (let i = 0; i < mc.length; i++) {
      await S.set('excel', 'm' + i, { items: mc[i] });
      bar(10 + (++n / tot) * 85);
    }
    if (META) {
      for (let i = cc.length; i < (META.nc || 0); i++) await S.del('excel', 'c' + i);
      for (let i = mc.length; i < (META.nm || 0); i++) await S.del('excel', 'm' + i);
    }

    await S.set('excel', 'meta', {
      nc: cc.length,
      nm: mc.length,
      archivo: file.name,
      fecha: new Date().toISOString(),
      ncur: D.cur.length,
      nmod: D.mods.length,
      ros: D.ros
    });
    bar(100);
    msg('Listo. Todos los paneles se actualizaron.');
    setTimeout(() => ov.classList.remove('on'), 900);
    toast('Datos actualizados desde ' + file.name);
  } catch (e) {
    msg('No se pudo actualizar: ' + (e.message || e.code || e));
    setTimeout(() => ov.classList.remove('on'), 3500);
  }
}

/* =================== LLEVAR AL EXCEL (edita el .xlsx por dentro, sin dañar el resto) =================== */
const NSM = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  NSR = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  NSP = 'http://schemas.openxmlformats.org/package/2006/relationships',
  NSC = 'http://schemas.openxmlformats.org/package/2006/content-types';
const XDECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';
const loadJSZip = () => loadLib('JSZip', CONFIG.LIBS.JSZIP, 'No se pudo cargar el editor de archivos');
const xesc = s =>
  String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const colL = n => {
  let s = '';
  n++;
  while (n) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const colN = l => l.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
function sheetXml(rows, widths) {
  const body = rows
    .map(
      (r, ri) =>
        `<row r="${ri + 1}">${r
          .map((v, ci) => {
            const ref = colL(ci) + (ri + 1);
            if (v === '' || v == null) return '';
            if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(v)}</t></is></c>`;
          })
          .join('')}</row>`
    )
    .join('');
  return (
    XDECL +
    `<worksheet xmlns="${NSM}" xmlns:r="${NSR}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${body}</sheetData></worksheet>`
  );
}
async function exportExcel(file) {
  const ov = $('#ov');
  $('#ovT').textContent = 'Llevando la información al Excel';
  ov.classList.add('on');
  const msg = t => ($('#ovM').textContent = t),
    bar = p => ($('#ovB').style.width = p + '%');
  try {
    msg('Abriendo ' + file.name + '…');
    bar(5);
    await loadJSZip();
    const zip = await JSZip.loadAsync(await file.arrayBuffer(), { createFolders: false });
    const P = new DOMParser(),
      SR = new XMLSerializer();
    const rd = async p => {
      const f = zip.file(p);
      if (!f) throw new Error('El archivo no parece un Excel válido (' + p + ')');
      return P.parseFromString(await f.async('string'), 'application/xml');
    };
    const wb = await rd('xl/workbook.xml'),
      rels = await rd('xl/_rels/workbook.xml.rels'),
      ct = await rd('[Content_Types].xml');
    const relEls = [...rels.getElementsByTagNameNS(NSP, 'Relationship')];
    const pathOf = sh => {
      const rid = sh.getAttributeNS(NSR, 'id');
      const r = relEls.find(x => x.getAttribute('Id') === rid);
      if (!r) return null;
      const t = r.getAttribute('Target');
      return t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
    };
    const sheetEls = () => [...wb.getElementsByTagNameNS(NSM, 'sheet')];
    const findSheet = n => sheetEls().find(s => nz(s.getAttribute('name')) === nz(n));
    function upsert(name, xml) {
      const ex = findSheet(name);
      if (ex) {
        zip.file(pathOf(ex), xml, { createFolders: false });
        return;
      }
      const used = new Set(Object.keys(zip.files));
      let n = 1;
      while (used.has(`xl/worksheets/sheet${n}.xml`)) n++;
      const p = `xl/worksheets/sheet${n}.xml`;
      zip.file(p, xml, { createFolders: false });
      let rid = 'rIdGuia' + n;
      while (relEls.some(x => x.getAttribute('Id') === rid)) rid += 'x';
      const rel = rels.createElementNS(NSP, 'Relationship');
      rel.setAttribute('Id', rid);
      rel.setAttribute(
        'Type',
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet'
      );
      rel.setAttribute('Target', `worksheets/sheet${n}.xml`);
      rels.documentElement.appendChild(rel);
      relEls.push(rel);
      const sid = Math.max(0, ...sheetEls().map(s => +s.getAttribute('sheetId') || 0)) + 1;
      const se = wb.createElementNS(NSM, 'sheet');
      se.setAttribute('name', name);
      se.setAttribute('sheetId', sid);
      se.setAttributeNS(NSR, 'r:id', rid);
      wb.getElementsByTagNameNS(NSM, 'sheets')[0].appendChild(se);
      const o = ct.createElementNS(NSC, 'Override');
      o.setAttribute('PartName', '/' + p);
      o.setAttribute(
        'ContentType',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml'
      );
      ct.documentElement.appendChild(o);
    }
    const cname = s => {
        const c = CUR.find(x => x.s === s);
        return c ? c.a : '';
      },
      ccoh = s => {
        const c = CUR.find(x => x.s === s);
        return c ? c.c : '';
      };
    msg('Escribiendo hojas de la guía…');
    bar(25);
    const nov = [
      [
        'Fecha',
        'Facilitador',
        'Sigla',
        'Curso',
        'Cohorte',
        'Tipo',
        'Severidad',
        'Responsable',
        'Descripción',
        'Acción correctiva',
        'Estado',
        'Última actualización'
      ],
      ...NOV.slice()
        .sort((a, b) => String(a.f).localeCompare(String(b.f)))
        .map(n => [
          String(n.f).slice(0, 10),
          n.fa,
          n.s || '',
          cname(n.s),
          ccoh(n.s),
          n.tipo,
          n.sev,
          n.resp,
          n.desc,
          n.acc || '',
          n.est,
          String(n.fe || n.f).slice(0, 10)
        ])
    ];
    upsert('Guía Novedades', sheetXml(nov, [12, 24, 22, 36, 10, 20, 10, 22, 60, 40, 22, 14]));
    const ind = [
      [
        'Fecha',
        'Facilitador',
        'Tipo',
        'Indicación',
        'Sigla',
        'Curso',
        'Fecha límite',
        'Estado',
        'Respuesta del facilitador',
        'Fecha hecha'
      ],
      ...ASIG.slice()
        .sort((a, b) => String(a.f).localeCompare(String(b.f)))
        .map(a => [
          String(a.f).slice(0, 10),
          a.fa,
          a.tipo,
          a.txt,
          a.s || '',
          cname(a.s),
          a.lim || '',
          a.est,
          a.resp || '',
          String(a.fh || '').slice(0, 10)
        ])
    ];
    upsert('Guía Indicaciones', sheetXml(ind, [12, 24, 12, 60, 22, 36, 12, 12, 40, 12]));
    const ids = new Set([...Object.keys(SEG), ...Object.keys(CIE)]);
    const segRows = [];
    ids.forEach(id => {
      const c = CUR.find(x => cid(x) === id);
      if (!c) return;
      const sg = SEG[id] || {},
        ck = Object.values(sg.ck || {}).filter(Boolean).length,
        k = (CIE[id] || {}).k || {};
      segRows.push([
        c.s,
        c.a,
        c.c,
        c.fa,
        c._f,
        Math.round(chkPct(c) * 100),
        ck,
        sg.nota || '',
        k.car || '',
        k.rep || '',
        k.siga || '',
        k.bi || '',
        k.exi || '',
        k.con || '',
        String((CIE[id] || {}).u || sg.u || '').slice(0, 10)
      ]);
    });
    upsert(
      'Guía Seguimiento',
      sheetXml(
        [
          [
            'Sigla',
            'Curso',
            'Cohorte',
            'Facilitador',
            'Fase hoy',
            'Avance checklist (%)',
            'Controles marcados',
            'Nota del curso',
            'Encuestas caracterización',
            'Envío reporte de cierre',
            'Notas SIGA',
            'BI percepción',
            'Éxito académico',
            'Consolidado de programación',
            'Última actualización'
          ],
          ...segRows.sort((a, b) => String(a[3]).localeCompare(String(b[3])))
        ],
        [22, 36, 10, 24, 18, 12, 12, 50, 14, 14, 14, 14, 14, 14, 14]
      )
    );
    // ---- tareas de cierre en Seguimiento Cierre Cursos (solo celdas vacías)
    msg('Completando tareas de cierre en «Seguimiento Cierre Cursos»…');
    bar(50);
    let wrote = 0,
      skipped = 0;
    const segSh = findSheet('Seguimiento Cierre Cursos');
    const marks = Object.values(CIE).filter(x => x.k && Object.keys(x.k).length);
    if (segSh && marks.length) {
      const sp = pathOf(segSh),
        sx = await rd(sp);
      let SS = [];
      const ssf = zip.file('xl/sharedStrings.xml');
      if (ssf) {
        const sd = P.parseFromString(await ssf.async('string'), 'application/xml');
        SS = [...sd.getElementsByTagNameNS(NSM, 'si')].map(si =>
          [...si.getElementsByTagNameNS(NSM, 't')].map(t => t.textContent).join('')
        );
      }
      const cv = c => {
        if (!c) return '';
        const t = c.getAttribute('t');
        if (t === 'inlineStr') {
          return [...c.getElementsByTagNameNS(NSM, 't')].map(x => x.textContent).join('');
        }
        const v = c.getElementsByTagNameNS(NSM, 'v')[0];
        if (!v) return '';
        return t === 's' ? SS[+v.textContent] || '' : v.textContent;
      };
      const rows = [...sx.getElementsByTagNameNS(NSM, 'row')];
      const hdrRow = rows.find(r => r.getAttribute('r') === '1') || rows[0];
      const H = {};
      [...hdrRow.getElementsByTagNameNS(NSM, 'c')].forEach(c => {
        const k = nz(cv(c));
        const col = c.getAttribute('r').replace(/\d+/g, '');
        if (k && !(k in H)) H[k] = col;
      });
      const sigCol = H['sigla programa'];
      if (!sigCol) throw new Error('No encuentro la columna «Sigla Programa» en Seguimiento Cierre Cursos');
      const MAPK = {
        car: 'encuestas de caracterizacion',
        rep: 'envio de reporte de cierre (excel)',
        siga: 'subida de notas a siga',
        bi: 'generacion de bi de encuestas de percep.',
        exi: 'ingreso de notas al archivo de exito academico',
        con: 'cierre del curso en consolidado de programacion'
      };
      const rowBy = {};
      rows.forEach(r => {
        if (r === hdrRow) return;
        const n = r.getAttribute('r');
        const c = [...r.getElementsByTagNameNS(NSM, 'c')].find(c => c.getAttribute('r') === sigCol + n);
        const s = cv(c).trim();
        if (s && !(s in rowBy)) rowBy[s] = r;
      });
      const styleFor = {};
      const getStyle = col => {
        if (col in styleFor) return styleFor[col];
        const cnt = {};
        rows.forEach(r => {
          const c = [...r.getElementsByTagNameNS(NSM, 'c')].find(
            c => c.getAttribute('r') === col + r.getAttribute('r')
          );
          if (c && !c.getAttribute('t') && c.getAttribute('s') && c.getElementsByTagNameNS(NSM, 'v')[0]) {
            const v = +c.getElementsByTagNameNS(NSM, 'v')[0].textContent;
            if (v > 40000 && v < 60000) cnt[c.getAttribute('s')] = (cnt[c.getAttribute('s')] || 0) + 1;
          }
        });
        const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
        return (styleFor[col] = best ? best[0] : null);
      };
      const serial = iso => dnum(iso) - dnum('1899-12-30');
      marks.forEach(m => {
        const r = rowBy[m.s];
        if (!r) return;
        const n = r.getAttribute('r');
        Object.entries(m.k).forEach(([kk, iso]) => {
          const col = H[MAPK[kk]];
          if (!col || !/^\d{4}-\d\d-\d\d$/.test(iso)) return;
          const ref = col + n;
          let c = [...r.getElementsByTagNameNS(NSM, 'c')].find(x => x.getAttribute('r') === ref);
          if (c && cv(c).trim() !== '') {
            skipped++;
            return;
          }
          const st = getStyle(col);
          if (!c) {
            c = sx.createElementNS(NSM, 'c');
            c.setAttribute('r', ref);
            const after = [...r.getElementsByTagNameNS(NSM, 'c')].find(
              x => colN(x.getAttribute('r').replace(/\d+/g, '')) > colN(col)
            );
            r.insertBefore(c, after || null);
          }
          [...c.childNodes].forEach(ch => c.removeChild(ch));
          c.removeAttribute('t');
          if (st) {
            c.setAttribute('s', st);
            const v = sx.createElementNS(NSM, 'v');
            v.textContent = serial(iso);
            c.appendChild(v);
          } else {
            c.setAttribute('t', 'inlineStr');
            const is = sx.createElementNS(NSM, 'is'),
              t = sx.createElementNS(NSM, 't');
            t.textContent = iso;
            is.appendChild(t);
            c.appendChild(is);
          }
          wrote++;
        });
      });
      zip.file(sp, XDECL + SR.serializeToString(sx.documentElement));
    }
    // recalcular al abrir (la columna Fase depende de estas fechas)
    let calc = wb.getElementsByTagNameNS(NSM, 'calcPr')[0];
    if (!calc) {
      calc = wb.createElementNS(NSM, 'calcPr');
      const before = [
        'oleSize',
        'customWorkbookViews',
        'pivotCaches',
        'smartTagPr',
        'smartTagTypes',
        'webPublishing',
        'fileRecoveryPr',
        'webPublishObjects',
        'extLst'
      ]
        .map(t => wb.getElementsByTagNameNS(NSM, t)[0])
        .find(Boolean);
      wb.documentElement.insertBefore(calc, before || null);
    }
    calc.setAttribute('fullCalcOnLoad', '1');
    zip.file('xl/workbook.xml', XDECL + SR.serializeToString(wb.documentElement));
    zip.file('xl/_rels/workbook.xml.rels', XDECL + SR.serializeToString(rels.documentElement));
    zip.file('[Content_Types].xml', XDECL + SR.serializeToString(ct.documentElement));
    msg('Generando el archivo…');
    bar(80);
    Object.keys(zip.files).forEach(k => {
      if (zip.files[k].dir) delete zip.files[k];
    });
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const name = file.name.replace(/\.xls[xm]?$/i, '') + '_actualizado_' + TODAY + '.xlsx';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 2000);
    bar(100);
    msg(
      `Listo: ${NOV.length} novedades, ${ASIG.length} indicaciones y ${segRows.length} cursos con seguimiento. ${wrote} tareas de cierre escritas en Seguimiento Cierre Cursos${skipped ? ` (${skipped} ya tenían dato y no se tocaron)` : ''}.`
    );
    setTimeout(() => ov.classList.remove('on'), 4500);
  } catch (e) {
    msg('No se pudo generar el archivo: ' + (e.message || e.code || e));
    setTimeout(() => ov.classList.remove('on'), 4500);
  }
}

/* Enlaza los botones de Excel (se llama desde el arranque en app.js). */
function initExcelUI() {
  $('#btnImport').onclick = () => $('#fileX').click();
  $('#fileX').onchange = e => {
    const f = e.target.files[0];
    if (f) importFile(f);
    e.target.value = '';
  };
  $('#btnExport').onclick = () => $('#exp').classList.add('on');
  $('#expNo').onclick = () => $('#exp').classList.remove('on');
  $('#expGo').onclick = () => {
    $('#exp').classList.remove('on');
    $('#fileE').click();
  };
  $('#fileE').onchange = e => {
    const f = e.target.files[0];
    if (f) exportExcel(f);
    e.target.value = '';
  };
}
