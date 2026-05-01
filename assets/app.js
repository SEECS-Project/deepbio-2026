const CONFIG = {
  csvUrl: window.DEEPBIO_CMS_CSV_URL || 'content/schedule.csv',
  editUrl: window.DEEPBIO_EDIT_URL || '',
  sourceUrl: window.DEEPBIO_SOURCE_URL || 'https://grupogea.unex.es/deepbio2026/index.php',
  siteUrl: 'content/site.json'
};

const TYPE_COLORS = {
  'Charla': '#0f7c86',
  'Descanso': '#d49300',
  'Presentación': '#5b4bde',
  'Taller': '#24a77e',
  'Mesa redonda': '#c14686',
  'Keynote': '#e05d26'
};

const state = {
  events: [],
  filtered: [],
  compact: false,
  site: {}
};

const $ = (id) => document.getElementById(id);
const els = {
  search: $('searchInput'),
  type: $('typeFilter'),
  theme: $('themeFilter'),
  room: $('roomFilter'),
  compact: $('compactToggle'),
  reset: $('resetFilters'),
  activeFilters: $('activeFilters'),
  root: $('scheduleRoot'),
  resultCount: $('resultCount')
};

function stripDiacritics(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quote && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === ',' && !quote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quote) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const headers = rows.shift().map(h => h.trim());
  return rows.map((cells) => Object.fromEntries(headers.map((h, index) => [h, cells[index] || ''])));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function addOptions(select, values) {
  const first = select.querySelector('option');
  select.innerHTML = '';
  select.appendChild(first);
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function formatDate(isoDate) {
  if (!isoDate) return 'Fecha por determinar';
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
}

function shortDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate || '—';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(date);
}

function normaliseEvent(raw, index) {
  const event = {
    id: raw.id || `event-${index + 1}`,
    date: raw.date || raw.fecha || '',
    start: raw.start || raw.inicio || raw.hora || 'Por determinar',
    end: raw.end || raw.fin || '',
    title: raw.title || raw.titulo || raw.ponencia || 'Título por determinar',
    speaker: raw.speaker || raw.ponente || '',
    affiliation: raw.affiliation || raw.afiliacion || raw.centro || '',
    type: raw.type || raw.tipo || 'Actividad',
    room: raw.room || raw.sala || 'Por determinar',
    theme: raw.theme || raw.tema || 'General',
    abstract: raw.abstract || raw.resumen || raw.descripcion || '',
    url: raw.url || raw.enlace || '',
    status: raw.status || raw.estado || 'Pendiente'
  };
  return event;
}

async function loadJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.json();
}

async function loadText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return response.text();
}

function applySiteContent(site) {
  state.site = site || {};
  const setText = (id, value) => { if (value) $(id).textContent = value; };
  setText('siteTitle', site.title);
  setText('siteDescription', site.description);
  setText('eventKicker', site.kicker);
  setText('venueName', site.venueName);
  setText('venueDetail', site.venueDetail);
  setText('eventDateShort', site.eventDateShort);
  setText('eventRoomShort', site.eventRoomShort);
  setText('generatedText', site.generatedText);
  document.title = site.browserTitle || document.title;
  if (CONFIG.sourceUrl) $('sourceLink').href = CONFIG.sourceUrl;
  if (CONFIG.editUrl) {
    $('editDataLink').href = CONFIG.editUrl;
    $('editDataLink').classList.remove('hidden');
  }
}

function computeStats() {
  const all = state.events;
  $('daysCount').textContent = unique(all.map(e => e.date)).length;
  $('eventsCount').textContent = all.length;
  $('speakersCount').textContent = unique(all.map(e => e.speaker).filter(s => !/coffee|descanso|break/i.test(s))).length;
  $('roomsCount').textContent = unique(all.map(e => e.room)).length;
}

function eventMatches(event) {
  const q = stripDiacritics(els.search.value);
  const type = els.type.value;
  const theme = els.theme.value;
  const room = els.room.value;
  const haystack = stripDiacritics([
    event.title, event.speaker, event.affiliation, event.theme, event.type, event.room, event.abstract
  ].join(' '));

  return (!q || haystack.includes(q))
    && (!type || event.type === type)
    && (!theme || event.theme === theme)
    && (!room || event.room === room);
}

function sortedEvents(events) {
  return [...events].sort((a, b) => {
    const dateCompare = String(a.date).localeCompare(String(b.date));
    if (dateCompare !== 0) return dateCompare;
    const aTime = /^\d{1,2}:\d{2}/.test(a.start) ? a.start.padStart(5, '0') : '99:99';
    const bTime = /^\d{1,2}:\d{2}/.test(b.start) ? b.start.padStart(5, '0') : '99:99';
    return aTime.localeCompare(bTime);
  });
}

function renderActiveFilters() {
  const chips = [];
  if (els.search.value) chips.push(`Búsqueda: ${els.search.value}`);
  if (els.type.value) chips.push(`Tipo: ${els.type.value}`);
  if (els.theme.value) chips.push(`Tema: ${els.theme.value}`);
  if (els.room.value) chips.push(`Sala: ${els.room.value}`);
  els.activeFilters.innerHTML = chips.map(chip => `<span class="filter-chip">${escapeHtml(chip)}</span>`).join('');
}

function renderSchedule() {
  const filtered = sortedEvents(state.events.filter(eventMatches));
  state.filtered = filtered;
  renderActiveFilters();
  els.resultCount.textContent = `${filtered.length} de ${state.events.length} actividades`;

  if (!filtered.length) {
    els.root.innerHTML = $('emptyTemplate').innerHTML;
    return;
  }

  const dates = unique(filtered.map(e => e.date));
  els.root.innerHTML = dates.map((date) => {
    const dayEvents = filtered.filter(e => e.date === date);
    return `
      <section class="day" data-date="${escapeHtml(date)}">
        <div class="day-title">
          <h3>${escapeHtml(formatDate(date))}</h3>
          <span>${dayEvents.length} actividades</span>
        </div>
        <div class="timeline">
          ${dayEvents.map(renderEvent).join('')}
        </div>
      </section>`;
  }).join('');
}

function renderEvent(event) {
  const typeColor = TYPE_COLORS[event.type] || '#0f7c86';
  const statusClass = /confirmad/i.test(event.status) ? 'confirmed' : '';
  const time = event.end ? `${event.start}<small>${event.end}</small>` : event.start;
  return `
    <article class="event" id="${escapeHtml(event.id)}">
      <div class="time">${escapeHtml(time)}</div>
      <div class="card" style="--type-color:${typeColor}">
        <div class="meta">
          <span class="tag type">${escapeHtml(event.type)}</span>
          <span class="tag">${escapeHtml(event.theme)}</span>
          <span class="tag">${escapeHtml(event.room)}</span>
          <span class="tag status ${statusClass}">${escapeHtml(event.status || 'Pendiente')}</span>
        </div>
        <h4 class="talk-title">${escapeHtml(event.title)}</h4>
        ${event.speaker ? `<p class="speaker">${escapeHtml(event.speaker)}${event.affiliation ? ` · <span class="speaker-affiliation">${escapeHtml(event.affiliation)}</span>` : ''}</p>` : ''}
        ${event.abstract ? `<p class="abstract">${escapeHtml(event.abstract)}</p>` : ''}
        ${event.url ? `<div class="card-actions"><a href="${escapeHtml(event.url)}">Más información</a></div>` : ''}
      </div>
    </article>`;
}

function populateControls() {
  addOptions(els.type, unique(state.events.map(e => e.type)));
  addOptions(els.theme, unique(state.events.map(e => e.theme)));
  addOptions(els.room, unique(state.events.map(e => e.room)));
}

function setupEvents() {
  [els.search, els.type, els.theme, els.room].forEach((el) => el.addEventListener('input', renderSchedule));
  els.compact.addEventListener('click', () => {
    state.compact = !state.compact;
    document.body.classList.toggle('compact', state.compact);
    els.compact.setAttribute('aria-pressed', String(state.compact));
    els.compact.textContent = state.compact ? 'Modo detallado' : 'Modo compacto';
  });
  els.reset.addEventListener('click', () => {
    els.search.value = '';
    els.type.value = '';
    els.theme.value = '';
    els.room.value = '';
    renderSchedule();
    els.search.focus();
  });
}

async function boot() {
  setupEvents();
  try {
    const [site, csv] = await Promise.all([
      loadJson(CONFIG.siteUrl).catch(() => ({})),
      loadText(CONFIG.csvUrl)
    ]);
    applySiteContent(site);
    state.events = parseCSV(csv).map(normaliseEvent);
    populateControls();
    computeStats();
    renderSchedule();
    $('lastUpdated').textContent = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (error) {
    console.error(error);
    els.resultCount.textContent = 'Error al cargar datos';
    els.root.innerHTML = `<div class="load-error"><strong>No se pudo cargar el programa.</strong><p>Revisa la URL CSV en <code>assets/config.js</code> o publica la web en un servidor/GitHub Pages. Error: ${escapeHtml(error.message)}</p></div>`;
  }
}

boot();
