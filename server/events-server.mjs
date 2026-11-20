import { load } from 'cheerio';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const folder = dirname(fileURLToPath(import.meta.url));
const cacheFile = join(folder, 'data', 'events.json');
const source = 'https://ticketea.com.py/';
const userAgent = 'QueSurgeAgenda/1.0';
let useCurl = false;
let running = null;
let state = { events: [], updatedAt: null, lastAttempt: null, error: '', warnings: [] };

async function html(url) {
  const target = new URL(url);
  if (target.hostname !== 'ticketea.com.py' || (target.pathname !== '/' && !/^\/events\/[a-z0-9-]+$/i.test(target.pathname))) {
    throw new Error('URL fuera del conector de agenda pública.');
  }
  if (!useCurl) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.text();
    } catch { useCurl = true; }
  }
  const options = ['-fLsS', '--compressed', '--max-time', '25', '--retry', '1', '-A', userAgent, url];
  if (process.platform === 'win32') options.unshift('--ssl-revoke-best-effort');
  return (await execute('curl', options, { maxBuffer: 8 * 1024 * 1024, timeout: 60000 })).stdout;
}

export function listing(markup) {
  const $ = load(markup);
  const links = new Set();
  $('a[href]').each((index, element) => {
    try {
      const url = new URL($(element).attr('href'), source);
      if (url.hostname === 'ticketea.com.py' && /^\/events\/[a-z0-9-]+$/i.test(url.pathname)) links.add(source.slice(0, -1) + url.pathname);
    } catch {}
  });
  return [...links];
}

function category(title, type) {
  const text = (title + ' ' + type).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  if (/stand.up|comedia|japuka|jenny|teatro|musical|ballet|opera/.test(text)) return 'Teatro';
  if (/chopp|gastronom|comilona|cocina|restaurante/.test(text)) return 'Gastronomía';
  if (/corrida|sports|deporte|olimpia|games|bienestar/.test(text)) return 'Bienestar';
  if (/cine|exposicion|muestra|arte en|artesania/.test(text)) return 'Arte';
  if (/liderazgo|agro|congreso|mentes expertas|solidari/.test(text)) return 'Comunidad';
  return 'Música';
}

function findEvent(value) {
  if (Array.isArray(value)) return value.map(findEvent).find(Boolean);
  if (!value || typeof value !== 'object') return null;
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  if (types.some(type => typeof type === 'string' && /Event$|^Festival$/.test(type))) return value;
  return findEvent(value['@graph']);
}

export function parseEvent(markup, url, now = new Date()) {
  const $ = load(markup);
  let event;
  $('script[type="application/ld+json"]').each((index, element) => {
    if (event) return;
    try { event = findEvent(JSON.parse($(element).text())); } catch {}
  });
  if (!event) throw new Error('La página no contiene datos estructurados de evento.');
  if (/Cancelled|Postponed/.test(event.eventStatus ?? '')) return null;
  const startsAt = new Date(event.startDate);
  if (!Number.isFinite(startsAt.getTime())) throw new Error('El evento no tiene una fecha válida.');
  const endsAt = new Date(event.endDate ?? event.startDate);
  const parts = new Intl.DateTimeFormat('en', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Asuncion'
  }).formatToParts(now);
  const localDay = ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
  const today = new Date(localDay + 'T00:00:00-03:00');
  if (endsAt < today) return null;
  const location = event.location ?? {};
  const address = typeof location.address === 'object' ? location.address : {};
  const country = typeof address.addressCountry === 'object' ? address.addressCountry.name : address.addressCountry;
  if (country && !/^(py|paraguay)$/i.test(country.trim())) return null;
  const title = String(event.name ?? '').trim();
  const city = String(address.addressLocality ?? address.addressRegion ?? '').trim();
  const venue = String(location.name ?? '').trim();
  if (!title || !city || !venue) throw new Error('Faltan nombre, ciudad o recinto.');
  const offers = Array.isArray(event.offers) ? event.offers[0] : event.offers;
  const priceValue = offers?.lowPrice ?? offers?.price;
  const parsedPrice = priceValue === undefined || priceValue === null || priceValue === '' ? null : Number(priceValue);
  const price = parsedPrice !== null && Number.isSafeInteger(parsedPrice) && parsedPrice >= 0 && offers?.priceCurrency === 'PYG' ? parsedPrice : null;
  const image = Array.isArray(event.image) ? event.image[0] : event.image;
  const photo = typeof image === 'object' ? image?.url : image;
  return {
    id: 'ticketea-' + createHash('sha256').update(url).digest('hex').slice(0, 20),
    title, category: category(title, event['@type']), startsAt: startsAt.toISOString(), city, venue, price,
    photo: typeof photo === 'string' && photo.startsWith('https://') ? photo : 'eventos/pulso.jpg',
    description: load(String(event.description ?? '')).text().trim().slice(0, 2000),
    sourceUrl: url, sourceName: 'Ticketea', updatedAt: now.toISOString()
  };
}

async function persist(next) {
  await mkdir(dirname(cacheFile), { recursive: true });
  const temporary = cacheFile + '.' + randomUUID() + '.tmp';
  await writeFile(temporary, JSON.stringify(next, null, 2));
  await rename(temporary, cacheFile);
}

export function sync() {
  if (running) return running;
  running = (async () => {
    const attemptedAt = new Date().toISOString();
    try {
      const urls = listing(await html(source));
      if (!urls.length) throw new Error('No se encontraron enlaces de eventos. Se conserva la agenda anterior.');
      const queue = [...urls];
      const collected = [];
      const warnings = [];
      const failed = new Set();
      await Promise.all(Array.from({ length: 2 }, async () => {
        while (queue.length) {
          const url = queue.shift();
          try {
            const event = parseEvent(await html(url), url);
            if (event) collected.push(event);
          } catch (error) { failed.add(url); warnings.push({ url, message: error.message }); }
        }
      }));
      if (failed.size === urls.length) throw new Error('No se pudieron leer las fichas. Se conserva la agenda anterior.');
      const retained = state.events.filter(event => failed.has(event.sourceUrl) && Date.parse(event.startsAt) >= Date.now());
      const events = [...new Map([...retained, ...collected].map(event => [event.id, event])).values()]
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      const next = { events, updatedAt: attemptedAt, lastAttempt: attemptedAt, error: '', warnings };
      await persist(next);
      state = next;
      console.log('Agenda actualizada. Eventos: ' + events.length + '. Fichas pendientes: ' + warnings.length);
    } catch (error) {
      state = { ...state, lastAttempt: attemptedAt, error: error.message };
      await persist(state).catch(() => {});
      console.error('No se actualizó la agenda: ' + error.message);
    }
    return state;
  })().finally(() => { running = null; });
  return running;
}

async function start() {
  try {
    const saved = JSON.parse(await readFile(cacheFile, 'utf8'));
    if (Array.isArray(saved.events)) state = saved;
  } catch {
    try {
      const saved = JSON.parse(await readFile(join(folder, '..', 'public', 'agenda-inicial.json'), 'utf8'));
      if (Array.isArray(saved.events)) state = { ...state, ...saved };
    } catch {}
  }
  if (process.argv.includes('--once')) {
    await sync();
    if (state.error) process.exitCode = 1;
    return;
  }
  const port = Number(process.env.EVENTS_PORT ?? 4300);
  const hours = Number(process.env.EVENTS_REFRESH_HOURS ?? 6);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !Number.isFinite(hours) || hours < 1) throw new Error('Revisá EVENTS_PORT y EVENTS_REFRESH_HOURS.');
  createServer((request, response) => {
    if (request.method !== 'GET' || new URL(request.url, 'http://localhost').pathname !== '/api/events') {
      response.writeHead(404); response.end(); return;
    }
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify({ ...state, refreshing: !!running, source }));
  }).listen(port, '127.0.0.1', () => console.log('Agenda externa en http://localhost:' + port + '/api/events'));
  if (!state.updatedAt || Date.now() - Date.parse(state.updatedAt) > hours * 3600000) void sync();
  setInterval(() => { void sync(); }, hours * 3600000);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch(error => { console.error(error.message); process.exitCode = 1; });
}
