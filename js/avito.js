// ÁVITO BISTRÓ CAFÉ · demo
import { initKit } from '../kit/kit.js?v=3';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__avitoOk = true;

const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const DIAS_L = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' };
let HORARIOS = { lun: [['08:00', '21:00']], mar: [['08:00', '21:00']], mie: [['08:00', '21:00']], jue: [['08:00', '21:00']], vie: [['08:00', '21:00']], sab: [['08:00', '21:00']], dom: [['09:00', '21:00']] };
const HH = [17 * 60, 20 * 60];

function ahoraAR() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dia: DIAS[wd], idx: wd, min: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}
const aMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hora = (s) => { const [h, m] = s.split(':').map(Number); return m ? `${h}:${String(m).padStart(2, '0')}` : `${h}`; };
const dur = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };

function estado() {
  const n = ahoraAR();
  const hoy = HORARIOS[n.dia] || [];
  const abierta = hoy.find(([a, c]) => n.min >= aMin(a) && n.min < aMin(c));
  if (abierta) return { abierto: true, txt: `Abierto ahora · hasta las ${hora(abierta[1])}` };
  const luego = hoy.find(([a]) => n.min < aMin(a));
  if (luego) return { abierto: false, txt: `Abrimos hoy a las ${hora(luego[0])}` };
  for (let k = 1; k <= 7; k++) {
    const d = DIAS[(n.idx + k) % 7]; const f = HORARIOS[d]?.[0];
    if (f) return { abierto: false, txt: `Cerrado · abrimos ${k === 1 ? 'mañana' : DIAS_L[d].toLowerCase()} a las ${hora(f[0])}` };
  }
  return { abierto: false, txt: 'Cerrado' };
}
function happyHour() {
  const { min } = ahoraAR();
  if (min >= HH[0] && min < HH[1]) return { ahora: true, txt: `¡Ahora! Termina en ${dur(HH[1] - min)}` };
  if (min < HH[0]) return { ahora: false, txt: `Empieza en ${dur(HH[0] - min)}` };
  return { ahora: false, txt: 'Mañana de 17 a 20' };
}

function pintarEstado() {
  const e = estado(); const hh = happyHour(); const n = ahoraAR();
  $('#estado').textContent = e.txt;
  $('#dotEstado').classList.toggle('cerrado', !e.abierto);
  const hoy = HORARIOS[n.dia] || [];
  $('#hoyHorario').textContent = hoy.length ? `Abierto de ${hoy.map(([a, c]) => `${hora(a)} a ${hora(c)}`).join(' y ')}` : 'Hoy cerrado';
  $('#hoyHH').textContent = hh.txt;
  if (cartaEstado.cat === 'happy-hour') $('#secNota').textContent = notaDe('happy-hour');
}

/* ───────── MOMENTO (el reloj) ───────── */
const META = $('meta[name="theme-color"]');
function setMomento(m, desdeUsuario) {
  html.setAttribute('data-momento', m);
  $$('.reloj__op').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.momento === m)));
  META.setAttribute('content', m === 'pm' ? '#201712' : '#F5ECDD');
  if (desdeUsuario && !cartaEstado.tocada) irPagina(PAGINA_DE[m], false);
}
$$('.reloj__op').forEach(b => b.addEventListener('click', () => setMomento(b.dataset.momento, true)));
setMomento(html.getAttribute('data-momento'));

/* ───────── INTRO ───────── */
const SALUDO = () => {
  const m = html.getAttribute('data-momento'); const e = estado(); const hh = happyHour();
  if (!e.abierto && !new URLSearchParams(location.search).get('momento')) return e.txt.replace('Cerrado · a', 'A').replace(/^Abrimos/, 'Abrimos') + '.';
  if (m === 'am') return 'Buen día. Hay brunch.';
  if (m === 'mediodia') return 'Buenas tardes. Hay menú ejecutivo.';
  return hh.ahora ? 'Es happy hour.' : 'Buenas noches.';
};
function arco(p, W, H) {
  const w = p * Math.max(W, H) * 2.4, r = w / 2, cx = W / 2, top = H - p * H * 2.2;
  const pts = [[0, 0], [W, 0], [W, H], [0, H], [0, 0], [cx - r, H + 2], [cx - r, top + r]];
  for (let i = 0; i <= 18; i++) { const a = Math.PI + (Math.PI * i) / 18; pts.push([cx + r * Math.cos(a), top + r + r * Math.sin(a)]); }
  pts.push([cx + r, H + 2], [cx - r, H + 2]);
  return `polygon(evenodd, ${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
}
function terminarIntro() {
  html.classList.remove('con-intro'); html.classList.add('listo');
  const i = $('#intro'); if (i) i.remove();
}
async function intro() {
  const el = $('#intro');
  if (!html.classList.contains('con-intro') || !el) { terminarIntro(); return; }
  $('#introHola').textContent = SALUDO();
  const t0 = performance.now();
  const hf = $('.hf--' + html.getAttribute('data-momento'));
  const listo = Promise.all([document.fonts?.ready, hf?.decode?.().catch(() => {})]);
  await Promise.race([listo.then(() => new Promise(r => setTimeout(r, Math.max(0, 2050 - (performance.now() - t0))))), new Promise(r => setTimeout(r, 2600))]);
  el.classList.add('sale');
  await new Promise(r => setTimeout(r, 250));
  html.classList.add('listo');
  const W = innerWidth, H = innerHeight, T = 760, s = performance.now();
  await new Promise(res => {
    const paso = (t) => {
      const k = Math.min(1, (t - s) / T); const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      el.style.clipPath = arco(Math.max(.001, e), W, H);
      if (k < 1) requestAnimationFrame(paso); else res();
    };
    requestAnimationFrame(paso);
  });
  terminarIntro();
}
$$('.hero__estado, .hero__baj, .hero__cta').forEach((el, i) => el.style.setProperty('--d', [0, 4, 5][i]));
$$('.hero__t .ln').forEach((el) => { const k = $$('.ln', el.parentElement).indexOf(el); el.firstElementChild.style.setProperty('--d', k + 1); });
$('.reloj').style.setProperty('--d', 6); $('.hero__nota').style.setProperty('--d', 8);
intro();

/* ───────── REVEAL ───────── */
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));
} else html.classList.add('no-rv');

/* ───────── MENÚ ───────── */
const burger = $('#burger'), nav = $('#nav');
burger.addEventListener('click', () => { const ab = !nav.classList.contains('abierto'); nav.classList.toggle('abierto', ab); burger.setAttribute('aria-expanded', String(ab)); burger.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); });
nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('abierto'); burger.setAttribute('aria-expanded', 'false'); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('abierto')) { nav.classList.remove('abierto'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); } });

/* ───────── CARTA ───────── */
const PAGINAS = [
  { id: 'manana', nombre: 'Mañana y brunch', cats: ['brunch-de-temporada', 'nuevos-combos', 'tostas-avito', 'huevos-y-algo-mas', 'frutas', 'entre-panes'], foto: 'img/carta/brunch-para-2.webp' },
  { id: 'mediodia', nombre: 'Mediodía y noche', cats: ['menu-ejecutivo', 'entraditas', 'sugerencias-de-estacion', 'pastas', 'postres'], foto: 'img/carta/tagliatelle.webp' },
  { id: 'llevar', nombre: 'Para llevar', cats: ['laminados', 'pasteleria-avito'], foto: 'img/carta/croissant-pastelera.webp' },
  { id: 'barra', nombre: 'Barra', cats: ['cafeteria', 'happy-hour', 'bebidas-sin-alcohol', 'cervezas-y-tragos', 'vinos'], foto: 'img/carta/capuccino.webp' },
];
const PAGINA_DE = { am: 'manana', mediodia: 'mediodia', pm: 'barra' };
const LLEVAR = new Set(['laminados', 'pasteleria-avito', 'gift-cards']);
const OCULTAS = new Set(['gift-cards']);
const CORTAS = new Set(['cafeteria', 'happy-hour', 'bebidas-sin-alcohol', 'cervezas-y-tragos', 'vinos']);
const NOTAS = {
  'brunch-de-temporada': 'Para compartir de a dos.',
  'nuevos-combos': 'Todos vienen con una infusión.',
  'menu-ejecutivo': 'Mediodías de lunes a sábado: principal + bebida + postre o café.',
  'pastas': 'Salsas: amatriciana, azafranada, putanesca, marinara, 4 quesos, panna o pesto.',
  'laminados': 'Se puede pedir para retirar en Pareja 3670.',
  'pasteleria-avito': 'Se puede pedir para retirar en Pareja 3670.',
  'vinos': 'Cepas del día: preguntá en la barra.',
};
const notaDe = (cat) => cat === 'happy-hour' ? `2x1 todos los días de 17 a 20 · ${happyHour().txt.replace('¡Ahora! ', 'Ahora: ')}` : (NOTAS[cat] || 'Se pide en el salón.');
const cartaEstado = { pagina: PAGINA_DE[html.getAttribute('data-momento')], cat: null, tocada: false, cats: [], prods: [], paginas: [] };
let KIT = null;

function cartaTemplate(p, ctx) {
  const llevable = LLEVAR.has(p.categoria) && p.precio != null && p.disponible !== false;
  const precio = ctx.money(p.precio) ?? `<span class="kit-price--na">Consultar</span>`;
  return `
    <div class="it__body">
      <h4 class="it__n">${esc(p.nombre)}${p.foto ? '<span class="dotf" title="Tiene foto"></span>' : ''}${(p.etiquetas || []).map(ctx.etiquetaHTML).join('')}</h4>
      ${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}
      ${p.foto ? '<button type="button" class="it__ver">Ver foto</button>' : ''}
    </div>
    <div class="it__side">
      <span class="it__p">${precio}</span>
      ${llevable ? `<div data-kit-qty="${esc(p.id)}"></div>` : ''}
      ${p.disponible === false ? '<span class="kit-badge kit-badge--off">Sin stock hoy</span>' : ''}
    </div>
    ${p.foto ? `<img class="it__img" alt="${esc(p.nombre)}" loading="lazy" width="640" height="640">` : ''}`;
}

function armarPaginas() {
  const conItems = new Set(cartaEstado.prods.map(p => p.categoria));
  const existe = new Set(cartaEstado.cats.map(c => c.id));
  const pags = PAGINAS.map(pg => ({ ...pg, cats: pg.cats.filter(c => existe.has(c) && conItems.has(c)) })).filter(pg => pg.cats.length);
  const asignadas = new Set(PAGINAS.flatMap(p => p.cats));
  const sueltas = cartaEstado.cats.map(c => c.id).filter(id => !asignadas.has(id) && !OCULTAS.has(id) && conItems.has(id));
  if (sueltas.length) pags.push({ id: 'mas', nombre: 'Más', cats: sueltas, foto: 'img/carta/brunch-para-2.webp' });
  cartaEstado.paginas = pags;
  const box = $('#paginas');
  box.innerHTML = pags.map(pg => `<button type="button" role="tab" data-p="${pg.id}" aria-selected="false">${esc(pg.nombre)}</button>`).join('');
}
const nombreCat = (id) => cartaEstado.cats.find(c => c.id === id)?.nombre || id;
const cantCat = (id) => cartaEstado.prods.filter(p => p.categoria === id).length;

function irPagina(id, tocada = true, catElegida) {
  const pg = cartaEstado.paginas.find(p => p.id === id) || cartaEstado.paginas[0]; if (!pg) return;
  cartaEstado.pagina = pg.id; if (tocada) cartaEstado.tocada = true;
  $$('#paginas button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.p === pg.id)));
  $('#indice').innerHTML = pg.cats.map(c => `<button type="button" data-cat="${c}">${esc(nombreCat(c))}<small>${cantCat(c)}</small></button>`).join('');
  cambiarFoto(pg.foto);
  irCat(catElegida && pg.cats.includes(catElegida) ? catElegida : pg.cats[0]);
}
function irCat(cat) {
  cartaEstado.cat = cat;
  const tab = $(`#cartaLista .kit-tab[data-cat="${CSS.escape(cat)}"]`); if (tab && !tab.classList.contains('is-on')) tab.click();
  $$('#indice button').forEach(b => b.setAttribute('aria-current', String(b.dataset.cat === cat)));
  const on = $('#indice button[aria-current="true"]'); const ind = $('#indice');
  if (on && ind.scrollWidth > ind.clientWidth) ind.scrollTo({ left: on.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
  const n = cantCat(cat);
  $('#secNombre').textContent = nombreCat(cat);
  $('#secCant').textContent = `${n} ${n === 1 ? 'opción' : 'opciones'}`;
  $('#secNota').textContent = notaDe(cat);
  $('#carta').setAttribute('data-cols', CORTAS.has(cat) ? '2' : '1');
  const orden = cartaEstado.paginas.flatMap(p => p.cats.map(c => ({ p: p.id, c })));
  const i = orden.findIndex(o => o.c === cat);
  const ant = orden[i - 1], sig = orden[i + 1];
  const bA = $('#secAnt'), bS = $('#secSig');
  bA.hidden = !ant; bS.hidden = !sig;
  if (ant) { $('span', bA).textContent = nombreCat(ant.c); bA.onclick = () => saltar(ant); }
  if (sig) { $('span', bS).textContent = nombreCat(sig.c); bS.onclick = () => saltar(sig); }
}
function saltar(o) {
  if (o.p !== cartaEstado.pagina) irPagina(o.p, true, o.c); else irCat(o.c);
  cartaEstado.tocada = true;
  const head = $('#cartaHead'); if (head.getBoundingClientRect().top < 0) head.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
let fotoActual = '';
function cambiarFoto(src) {
  if (!src || src === fotoActual) return; fotoActual = src;
  const img = $('#cartaFoto'); img.classList.add('cambia');
  const pre = new Image(); pre.src = src;
  pre.decode().catch(() => {}).then(() => { img.src = src; requestAnimationFrame(() => img.classList.remove('cambia')); });
}
$('#paginas').addEventListener('click', (e) => { const b = e.target.closest('button[data-p]'); if (b) irPagina(b.dataset.p); });
$('#indice').addEventListener('click', (e) => { const b = e.target.closest('button[data-cat]'); if (b) { cartaEstado.tocada = true; irCat(b.dataset.cat); } });
let rafFoto = 0;
$('#cartaLista').addEventListener('pointerover', (e) => {
  const it = e.target.closest('.kit-item[data-photo]'); if (!it || rafFoto) return;
  rafFoto = requestAnimationFrame(() => { rafFoto = 0; cambiarFoto(it.dataset.photo); });
});
$('#cartaLista').addEventListener('click', (e) => {
  const b = e.target.closest('.it__ver'); if (!b) return;
  const it = b.closest('.kit-item'); const img = $('.it__img', it);
  if (img && !img.src) img.src = it.dataset.photo;
  const on = it.classList.toggle('ver-foto'); b.textContent = on ? 'Ocultar foto' : 'Ver foto';
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-pagina]'); if (!a) return;
  irPagina(a.dataset.pagina);
});

document.addEventListener('kit:carta', (e) => {
  const { productos, categorias } = e.detail;
  cartaEstado.prods = productos; cartaEstado.cats = categorias;
  armarPaginas();
  irPagina(cartaEstado.pagina, false, cartaEstado.cat);
  pintarPrecios(); armarStickers(); armarGift(); POOL = null;
});

function pintarPrecios() {
  if (!KIT) return;
  $$('[data-precio]').forEach(el => { const p = cartaEstado.prods.find(x => x.id === el.dataset.precio); const m = p && KIT.money(p.precio); if (m) el.textContent = m.replace(/\s/g, ''); });
}

/* ───────── PARA LLEVAR (stickers) ───────── */
const STICKERS = ['croissant-pastelera', 'danesa-frutos-rojos', 'cookie-chips-de-chocolate', 'torta-rogel'];
function armarStickers() {
  const el = $('#stickers'); if (!KIT) return;
  const ps = STICKERS.map(id => cartaEstado.prods.find(p => p.id === id)).filter(p => p && p.foto && p.precio != null);
  el.innerHTML = ps.map(p => `<div class="sticker"><img src="${esc(KIT.asset(p.foto))}" alt="${esc(p.nombre)}" width="640" height="640" loading="lazy"><b>${esc(p.nombre)}</b><span>${esc(KIT.money(p.precio))}</span>${p.disponible === false ? '<span>Sin stock hoy</span>' : `<div data-kit-qty="${esc(p.id)}"></div>`}</div>`).join('');
  KIT.carrito?.sync(el);
}

/* ───────── DESTINO ───────── */
let POOL = null, ultimo = null, jugando = false;
const destino = $('#destino');
$$('.cam--on', destino).forEach(p => p.setAttribute('pathLength', '1'));
const FIN_DE = [1, 2, 0]; // camino 0 termina en el centro, 1 a la derecha, 2 a la izquierda
function pool() {
  if (!POOL) POOL = cartaEstado.prods.filter(p => p.foto && p.precio != null && p.disponible !== false && !OCULTAS.has(p.categoria) && !p.categoria?.startsWith('nuevos-combos'));
  return POOL;
}
$$('.destino__ini', destino).forEach(b => b.addEventListener('click', () => {
  if (jugando || !KIT) return; jugando = true;
  const c = Number(b.dataset.c);
  $$('.destino__ini', destino).forEach(x => x.classList.toggle('on', x === b));
  $$('.cam--on', destino).forEach(p => p.classList.remove('traza'));
  const path = $(`.cam--on[data-c="${c}"]`, destino); void path.getBoundingClientRect(); path.classList.add('traza');
  $$('.destino__fines span', destino).forEach(s => { s.textContent = '?'; s.style.background = ''; s.style.color = ''; });
  $('#destinoRes').hidden = true;
  setTimeout(() => {
    const ps = pool().filter(p => p.id !== ultimo); const p = ps[Math.floor(Math.random() * ps.length)]; if (!p) { jugando = false; return; }
    ultimo = p.id;
    const fin = $$('.destino__fines span', destino)[FIN_DE[c]]; fin.textContent = '✓'; fin.style.background = 'var(--acc-2)'; fin.style.color = 'var(--bg)';
    const res = $('#destinoRes'); const img = $('img', res);
    img.src = KIT.asset(p.foto); img.alt = p.nombre;
    $('.destino__n', res).textContent = p.nombre;
    $('.destino__p', res).textContent = `${KIT.money(p.precio)} · ${nombreCat(p.categoria)}`;
    const llevable = LLEVAR.has(p.categoria);
    $('.destino__acc', res).innerHTML = (llevable ? `<button type="button" class="btn" data-sumar="${esc(p.id)}">Sumalo a tu bolsa</button>` : `<button type="button" class="btn" data-kit-open="reservas">Reservá para probarlo</button>`) + `<button type="button" class="linkbtn" data-otra>Otra vez</button>`;
    res.hidden = false; jugando = false;
  }, reduce ? 50 : 1000);
}));
destino.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sumar]');
  if (s && KIT) { KIT.carrito.agregar(s.dataset.sumar); s.textContent = '¡En tu bolsa!'; s.disabled = true; }
  if (e.target.closest('[data-otra]')) {
    $('#destinoRes').hidden = true; $$('.destino__ini', destino).forEach(x => x.classList.remove('on'));
    $$('.cam--on', destino).forEach(p => p.classList.remove('traza'));
    $$('.destino__fines span', destino).forEach(s2 => { s2.textContent = '?'; s2.style.background = ''; s2.style.color = ''; });
  }
});

/* ───────── DIAGRAMA ───────── */
const diag = $('#diag'); const nodos0 = $$('.diag__nodo', diag);
diag.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir]'); if (!b) return;
  const actual = b.closest('.diag__nodo'); const dest = $(`.diag__nodo[data-n="${b.dataset.ir}"]`, diag);
  actual.classList.remove('is-on'); actual.classList.add('hecho');
  const elegido = document.createElement('span'); elegido.className = 'diag__resp nota-mano'; elegido.textContent = ' → ' + b.textContent; elegido.style.fontSize = '20px';
  $('b', actual).appendChild(elegido);
  actual.after(dest); dest.classList.add('is-on');
  $('button', dest)?.focus({ preventScroll: true });
});
$('#diagOtra').addEventListener('click', () => {
  nodos0.forEach(n => { n.classList.remove('is-on', 'hecho'); $$('.diag__resp', n).forEach(s => s.remove()); diag.appendChild(n); });
  nodos0[0].classList.add('is-on');
});

/* ───────── MUSEO ───────── */
const pista = $('#museoPista');
const paso = () => ($('.obra', pista)?.getBoundingClientRect().width || 300) + 32;
$('#museoAnt').addEventListener('click', () => pista.scrollBy({ left: -paso(), behavior: reduce ? 'auto' : 'smooth' }));
$('#museoSig').addEventListener('click', () => pista.scrollBy({ left: paso(), behavior: reduce ? 'auto' : 'smooth' }));

/* ───────── GIFT CARD ───────── */
const sobre = $('#sobre'); let giftSel = null;
$('#lacre').addEventListener('click', () => {
  sobre.classList.add('abierto');
  setTimeout(() => { $('#giftForm').hidden = false; }, reduce ? 0 : 1500);
});
function armarGift() {
  if (!KIT) return;
  const gs = cartaEstado.prods.filter(p => p.categoria === 'gift-cards' && p.precio != null && p.disponible !== false);
  if (!gs.length) return;
  if (!gs.find(g => g.id === giftSel)) giftSel = gs[0].id;
  $('#giftOps').innerHTML = gs.map(g => `<button type="button" class="gift__op" role="radio" aria-checked="${g.id === giftSel}" data-g="${esc(g.id)}"><b>${esc(g.nombre.replace(/^Gift card · /, ''))}</b><span>${esc(KIT.money(g.precio))}</span></button>`).join('');
  pintarGift();
}
function pintarGift() {
  const g = cartaEstado.prods.find(p => p.id === giftSel); if (!g) return;
  $('#tjNombre').textContent = g.nombre.replace(/^Gift card · /, '');
  $('#giftBtn').textContent = `Regalar · ${KIT.money(g.precio)}`;
  $$('.gift__op').forEach(b => b.setAttribute('aria-checked', String(b.dataset.g === giftSel)));
}
$('#giftOps').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { giftSel = b.dataset.g; pintarGift(); } });
$('#gfPara').addEventListener('input', (e) => { $('#tjPara').textContent = 'Para: ' + (e.target.value.trim() || 'alguien especial'); });
$('#gfMsj').addEventListener('input', (e) => { $('#tjMsj').textContent = e.target.value.trim() || 'para que te vuelvas habitué'; });
$('#giftForm').addEventListener('submit', (e) => { e.preventDefault(); if (!KIT || !giftSel) return; KIT.carrito.agregar(giftSel); KIT.carrito.abrir(); });

/* ───────── CRUCIGRAMA (jugable) ───────── */
const PALABRAS = [
  { n: 1, w: 'BRUNCH', r: 0, c: 2, d: 'v', q: 'Lo servimos todo el día, todos los días.' },
  { n: 2, w: 'PASTAS', r: 1, c: 0, d: 'v', q: 'Caseras, con siete salsas para elegir.' },
  { n: 3, w: 'ALMUERZOS', r: 1, c: 5, d: 'v', q: 'Al mediodía, con menú ejecutivo.' },
  { n: 4, w: 'NOCHES', r: 8, c: 4, d: 'h', q: 'Velas, vino y platos de estación.' },
];
const DIR = { w: 'PAREJA3670', r: 1, c: 0, d: 'h' };
const cruci = $('#cruci');
const celdasDe = (p) => [...p.w].map((ch, i) => [p.d === 'h' ? p.r : p.r + i, p.d === 'h' ? p.c + i : p.c, ch]);
const CEL = {};
PALABRAS.forEach((p, i) => celdasDe(p).forEach(([r, c, ch]) => { (CEL[`${r},${c}`] ||= { ch, words: [], dir: false }).words.push(i); }));
celdasDe(DIR).forEach(([r, c, ch]) => { (CEL[`${r},${c}`] ||= { ch, words: [], dir: false }).dir = true; });
const NUMS = { '0,2': 1, '1,0': 2, '1,5': 3, '8,4': 4 };
let cruciHTML = '';
for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
  const k = `${r},${c}`, x = CEL[k];
  if (!x) { cruciHTML += '<span class="cel"></span>'; continue; }
  const num = NUMS[k] ? ` num" data-n="${NUMS[k]}` : '';
  cruciHTML += x.words.length
    ? `<span class="cel l${x.dir ? ' dir' : ''}${num}" data-k="${k}"><input class="cel__in" maxlength="2" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="next" aria-label="Fila ${r + 1}, columna ${c + 1}"></span>`
    : `<span class="cel l fija" data-k="${k}"><span>${x.ch}</span></span>`;
}
cruci.innerHTML = cruciHTML;
cruci.setAttribute('role', 'group'); cruci.setAttribute('aria-label', 'Crucigrama de la ubicación');
$('#pistas').innerHTML = PALABRAS.map((p, i) => `<li><button type="button" data-i="${i}"><span class="n">${p.n}${p.d === 'h' ? '→' : '↓'}</span><span class="q">${esc(p.q)} <span class="len">(${p.w.length})</span></span><span class="r">${p.w}</span></button></li>`).join('');

const celEl = (k) => $(`.cel[data-k="${k}"]`, cruci);
const inEl = (k) => $(`.cel[data-k="${k}"] .cel__in`, cruci);
const keysDe = (i) => celdasDe(PALABRAS[i]).map(([r, c]) => `${r},${c}`);
const resueltas = new Set(); let act = 0, terminado = false;
function marcar(i) {
  act = i;
  $$('.cel.act', cruci).forEach(x => x.classList.remove('act'));
  keysDe(i).forEach(k => celEl(k).classList.add('act'));
  $$('#pistas button').forEach(b => b.classList.toggle('on', Number(b.dataset.i) === i));
}
function enfocar(k) { const el = inEl(k); if (el) el.focus({ preventScroll: matchMedia('(min-width: 861px)').matches }); }
function primeraLibre(i) { return keysDe(i).find(k => inEl(k).value !== CEL[k].ch) || keysDe(i)[0]; }
function mover(k, paso) {
  const ks = keysDe(act); const j = ks.indexOf(k) + paso;
  if (j >= 0 && j < ks.length) enfocar(ks[j]);
  else if (paso > 0 && resueltas.has(act)) { const sig = PALABRAS.findIndex((_, i) => !resueltas.has(i) && i !== act); if (sig >= 0) { marcar(sig); enfocar(primeraLibre(sig)); } }
}
function revisarCruci(ultimaK) {
  PALABRAS.forEach((p, i) => {
    const ks = keysDe(i); const vals = ks.map(k => inEl(k).value);
    if (resueltas.has(i)) return;
    if (vals.every((v, j) => v === CEL[ks[j]].ch)) {
      resueltas.add(i);
      ks.forEach((k, j) => { const ce = celEl(k); ce.classList.add('ok'); setTimeout(() => { ce.classList.remove('salta'); void ce.offsetWidth; ce.classList.add('salta'); }, reduce ? 0 : j * 60); });
      $(`#pistas button[data-i="${i}"]`).classList.add('ok');
      $('#cruciMsg').textContent = resueltas.size < PALABRAS.length ? ['¡Eso!', '¡Bien ahí!', '¡Vas muy bien!'][resueltas.size - 1] || '' : '';
    } else if (ultimaK && ks.includes(ultimaK) && vals.every(Boolean)) {
      ks.forEach(k => { const ce = celEl(k); ce.classList.remove('mal'); void ce.offsetWidth; ce.classList.add('mal'); });
      $('#cruciMsg').textContent = 'Mmm, esa no. Probá de nuevo.';
    }
  });
  if (resueltas.size === PALABRAS.length && !terminado) {
    terminado = true; cruci.classList.add('fin');
    $$('.cel.fija', cruci).forEach((ce, j) => setTimeout(() => ce.classList.add('on'), reduce ? 0 : 300 + j * 110));
    $$('.cel__in', cruci).forEach(x => { x.readOnly = true; x.blur(); });
    setTimeout(() => { $('#cruciMsg').textContent = '¡Llegaste! Pareja 3670, te esperamos.'; $('#visitaCard').classList.add('on'); }, reduce ? 0 : 1100);
    cruci.setAttribute('aria-label', 'Crucigrama completo: Pareja 3670');
  }
}
cruci.addEventListener('focusin', (e) => {
  const ce = e.target.closest('.cel'); if (!ce) return; const k = ce.dataset.k;
  if (!keysDe(act).includes(k)) marcar(CEL[k].words.find(i => !resueltas.has(i)) ?? CEL[k].words[0]);
});
cruci.addEventListener('pointerdown', (e) => {
  const ce = e.target.closest('.cel.l'); if (!ce || !ce.querySelector('.cel__in')) return; const k = ce.dataset.k;
  if (document.activeElement === inEl(k) && CEL[k].words.length > 1) { const otra = CEL[k].words.find(i => i !== act); if (otra != null) { marcar(otra); } }
});
cruci.addEventListener('input', (e) => {
  const inp = e.target; if (!inp.classList.contains('cel__in')) return;
  const k = inp.closest('.cel').dataset.k;
  const v = (inp.value || '').toUpperCase().replace(/[^A-ZÑ0-9]/g, '').slice(-1);
  inp.value = v; celEl(k).classList.remove('ayuda');
  if ($('#cruciMsg').textContent.startsWith('Mmm')) $('#cruciMsg').textContent = '';
  revisarCruci(k);
  if (v) mover(k, 1);
});
cruci.addEventListener('keydown', (e) => {
  const inp = e.target; if (!inp.classList.contains('cel__in')) return;
  const k = inp.closest('.cel').dataset.k; const [r, c] = k.split(',').map(Number);
  if (e.key === 'Backspace' && !inp.value && !inp.readOnly) { e.preventDefault(); const ks = keysDe(act); const j = ks.indexOf(k); if (j > 0) { const p = inEl(ks[j - 1]); if (!celEl(ks[j - 1]).classList.contains('ok')) p.value = ''; p.focus(); } return; }
  const dirs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (dirs[e.key]) {
    e.preventDefault(); const [dr, dc] = dirs[e.key];
    for (let s = 1; s < 10; s++) { const nk = `${r + dr * s},${c + dc * s}`; if (inEl(nk)) { const w = CEL[nk].words.find(i => PALABRAS[i].d === (dr ? 'v' : 'h')); if (w != null) marcar(w); enfocar(nk); break; } }
  }
  if (e.key === 'Enter') { e.preventDefault(); mover(keysDe(act).at(-1), 1); }
});
$('#pistas').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]'); if (!b) return;
  const i = Number(b.dataset.i); marcar(i); enfocar(primeraLibre(i));
});
function darLetra(i) {
  const k = keysDe(i).find(x => inEl(x).value !== CEL[x].ch); if (!k) return false;
  inEl(k).value = CEL[k].ch; celEl(k).classList.add('ayuda'); revisarCruci(k); return true;
}
$('#crucLetra').addEventListener('click', () => {
  if (terminado) return;
  const i = resueltas.has(act) ? PALABRAS.findIndex((_, j) => !resueltas.has(j)) : act;
  marcar(i); darLetra(i); if (!resueltas.has(i)) enfocar(primeraLibre(i));
});
$('#crucTodo').addEventListener('click', () => {
  if (terminado) return;
  PALABRAS.forEach((_, i) => keysDe(i).forEach((k, j) => setTimeout(() => { if (inEl(k).value !== CEL[k].ch) { inEl(k).value = CEL[k].ch; celEl(k).classList.add('ayuda'); } if (j === keysDe(i).length - 1) revisarCruci(); }, reduce ? 0 : i * 260 + j * 45)));
});
marcar(0);

/* ───────── ARRASTRAR CARRUSELES (mouse; en touch es nativo) ───────── */
const ARRASTRABLE = '[data-arrastre], .carta__indice, .kit-chips--scroll';
let drag = null;
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  const el = e.target.closest(ARRASTRABLE); if (!el || el.scrollWidth <= el.clientWidth + 2) return;
  cancelAnimationFrame(el.__raf);
  drag = { el, x0: e.clientX, s0: el.scrollLeft, lx: e.clientX, lt: performance.now(), v: 0, movio: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return; const d = drag; const dx = e.clientX - d.x0;
  if (!d.movio && Math.abs(dx) > 5) { d.movio = true; d.el.classList.add('arrastrando'); }
  if (!d.movio) return;
  e.preventDefault(); d.el.scrollLeft = d.s0 - dx;
  const t = performance.now(); d.v = (e.clientX - d.lx) / Math.max(1, t - d.lt); d.lx = e.clientX; d.lt = t;
}, { passive: false });
window.addEventListener('pointerup', () => {
  if (!drag) return; const d = drag; drag = null;
  if (!d.movio) return;
  const el = d.el; let v = -d.v * 16;
  const suelta = () => { el.classList.remove('arrastrando'); const bloq = (ev) => { ev.preventDefault(); ev.stopPropagation(); }; el.addEventListener('click', bloq, { capture: true, once: true }); setTimeout(() => el.removeEventListener('click', bloq, { capture: true }), 60); };
  const paso = () => {
    if (Math.abs(v) < .6 || reduce) { suelta(); return; }
    el.scrollLeft += v; v *= .93; el.__raf = requestAnimationFrame(paso);
  };
  paso();
});
document.addEventListener('dragstart', (e) => { if (e.target.closest?.(ARRASTRABLE)) e.preventDefault(); });

function pintarHorarios() {
  const hoy = ahoraAR().dia;
  const orden = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
  $('#horarios').innerHTML = orden.map(d => { const f = HORARIOS[d] || []; return `<li class="${d === hoy ? 'hoy-d' : ''}"><span>${DIAS_L[d]}</span><span>${f.length ? f.map(([a, c]) => `${hora(a)} a ${hora(c)}`).join(' · ') : 'Cerrado'}</span></li>`; }).join('');
}

/* ───────── KIT ───────── */
pintarHorarios(); pintarEstado();
setInterval(pintarEstado, 30000);
try {
  KIT = await initKit({
    config: 'cliente.json',
    carta: { template: cartaTemplate, itemClass: 'it' },
    carrito: { label: 'Mi bolsa' },
  });
  if (KIT.config.horarios) { HORARIOS = KIT.config.horarios; pintarHorarios(); pintarEstado(); }
  pintarPrecios(); armarStickers(); armarGift();
  const wa = KIT.config.whatsapp;
  $$('[data-wa]').forEach(a => { a.href = `https://wa.me/${wa}`; a.target = '_blank'; a.rel = 'noopener'; });
} catch (err) {
  console.error('[avito] kit', err);
  $('#secNombre').textContent = 'No pudimos cargar la carta. Probá recargar la página.';
}
