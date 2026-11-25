// OlmedoRides - Shared client + helpers
// Edita CONFIG con tus credenciales reales de Supabase.
// Si no hay credenciales, la app arranca en MODO DEMO LOCAL.
import { createDemoClient, DEMO_ACCOUNTS, resetDemoData } from './demo-client.js';

export const CONFIG = {
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseAnonKey: 'your-anon-key',

    // El administrador entra con el alias "adm!n" y contraseña "12345".
    // El alias se traduce a esta cuenta real de Supabase Auth (ver sql/schema.sql).
    adminAlias: 'adm!n',
    adminEmail: 'admin@olmedorides.app',

    // Usuario de prueba: alias "user" / contraseña "1234".
    userAlias: 'user',
    userEmail: 'user@olmedorides.app'
};

// Ciudades de Ecuador para los selectores de origen/destino.
export const ECUADOR_CITIES = [
    'Quito',
    'Guayaquil',
    'Cuenca',
    'Ambato',
    'Manta',
    'Portoviejo',
    'Loja',
    'Riobamba',
    'Machala',
    'Santo Domingo',
    'Ibarra',
    'Esmeraldas',
    'Quevedo',
    'Babahoyo',
    'Latacunga',
    'Tulcán',
    'Salinas',
    'Playas',
    'Bahía de Caráquez',
    'Otavalo',
    'Cayambe',
    'Puerto Francisco de Orellana (El Coca)',
    'Nueva Loja (Lago Agrio)',
    'Puyo',
    'Tena',
    'Macas',
    'Zamora',
    'Azogues',
    'La Libertad',
    'Milagro',
    'Durán',
    'Daule',
    'Jipijapa',
    'Chone',
    'El Carmen',
    'Pedernales',
    'Quinindé',
    'San Lorenzo',
    'Guano',
    'Alausí',
    'Baños de Agua Santa',
    'Pelileo',
    'Saquisilí',
    'Pujilí',
    'Guaranda',
    'Cañar',
    'Gualaceo',
    'Paute',
    'Sigsig',
    'Yantzaza',
    'Gualaquiza',
    'Puerto Ayora (Galápagos)',
    'Puerto Baquerizo Moreno (Galápagos)'
];

const params = new URLSearchParams(window.location.search);
if (params.get('demo') === '1') localStorage.setItem('olmedorides_demo_mode', '1');
if (params.get('demo') === '0') localStorage.removeItem('olmedorides_demo_mode');

const hasRealConfig = Boolean(
    CONFIG.supabaseUrl &&
    !CONFIG.supabaseUrl.includes('your-project') &&
    CONFIG.supabaseAnonKey &&
    !CONFIG.supabaseAnonKey.includes('your-anon-key')
);

// Modo demo si:
// - las credenciales son de ejemplo,
// - se abrió con ?demo=1,
// - o se guardó la preferencia en localStorage.
export const DEMO_MODE = !hasRealConfig
    || params.get('demo') === '1'
    || localStorage.getItem('olmedorides_demo_mode') === '1';

let client;
if (DEMO_MODE) {
    client = createDemoClient();
} else {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
}

export const supabase = client;
export const isConfigured = DEMO_MODE || hasRealConfig;
export { DEMO_ACCOUNTS, resetDemoData };

function initDemoBadge() {
    if (!DEMO_MODE) return;
    if (document.querySelector('.demo-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'demo-badge';
    badge.textContent = 'MODO DEMO LOCAL';
    badge.title = 'Datos falsos guardados en este navegador. No usa Supabase.';
    document.body.appendChild(badge);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoBadge);
} else {
    initDemoBadge();
}

function initSidebarToggle() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar) return;

    const close = () => {
        sidebar.classList.remove('open');
        overlay?.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        overlay?.classList.toggle('show', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    overlay?.addEventListener('click', close);
    sidebar.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', close));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) close();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarToggle);
} else {
    initSidebarToggle();
}

export const ROLE_LABELS = {
    admin: 'Administrador',
    secretary: 'Secretaria',
    driver: 'Conductor',
    traveler: 'Usuario'
};

// Distribución fija del vehículo: 1 delantero a la derecha + 3 atrás (forma de L).
export const SEAT_POSITIONS = [
    { number: 1, key: 'front_right', label: 'Delantero derecho' },
    { number: 2, key: 'back_left', label: 'Atrás izquierda' },
    { number: 3, key: 'back_middle', label: 'Atrás centro' },
    { number: 4, key: 'back_right', label: 'Atrás derecha' }
];

export const SEAT_BY_NUMBER = Object.fromEntries(SEAT_POSITIONS.map(p => [p.number, p]));
export const SEAT_BY_KEY = Object.fromEntries(SEAT_POSITIONS.map(p => [p.key, p]));

export function roleLabel(role) {
    return ROLE_LABELS[role] || role || 'Usuario';
}

export function isStaff(role) {
    return role === 'admin' || role === 'secretary';
}

export function formatDate(iso, withTime = true) {
    if (!iso) return '-';
    const options = withTime
        ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(iso).toLocaleDateString('es-ES', options);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(Number(amount) || 0);
}

export function formatDuration(minutes) {
    const total = Number(minutes) || 0;
    if (total <= 0) return '-';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
}

export function travelStatusBadge(status) {
    return ({
        scheduled: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger'
    })[status] || 'gray';
}

export function travelStatusLabel(status) {
    return ({
        scheduled: 'Programado',
        in_progress: 'En curso',
        completed: 'Completado',
        cancelled: 'Cancelado'
    })[status] || status;
}

export function seatPositionLabel(seat) {
    if (!seat) return 'Asiento';
    if (seat.seat_position && SEAT_BY_KEY[seat.seat_position]) {
        return SEAT_BY_KEY[seat.seat_position].label;
    }
    const byNumber = SEAT_BY_NUMBER[seat.seat_number];
    return byNumber ? byNumber.label : `Asiento ${seat.seat_number}`;
}

export function seatCode(seat) {
    const number = seat?.seat_number;
    return number ? `A${number}` : 'A?';
}

export function seatPriceRange(seats = []) {
    const prices = (seats || [])
        .map(seat => Number(seat.price))
        .filter(price => Number.isFinite(price));

    if (!prices.length) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return {
        min,
        max,
        label: min === max
            ? formatCurrency(min)
            : `${formatCurrency(min)} - ${formatCurrency(max)}`
    };
}

export function seatIconHtml(seat, { showPrice = false } = {}) {
    if (!seat) return '<span class="seat-chip seat-chip-empty">—</span>';

    const code = seatCode(seat);
    const description = seatPositionLabel(seat);
    const shortDescription = description
        .replace('Delantero derecho', 'Delantero')
        .replace('Atrás izquierda', 'Atrás izq.')
        .replace('Atrás centro', 'Atrás centro')
        .replace('Atrás derecha', 'Atrás der.');
    const price = showPrice && seat.price != null ? formatCurrency(seat.price) : '';

    return `
        <span class="seat-chip" title="${escapeHtml(description)}${price ? ' · ' + price : ''}">
            <span class="seat-chip-icon" aria-hidden="true">
                <span class="seat-chip-back"></span>
                <span class="seat-chip-cushion">${seat.seat_number || '?'}</span>
            </span>
            <span class="seat-chip-text">
                <strong>${code}</strong>
                <small>${escapeHtml(shortDescription)}</small>
                ${price ? `<small class="seat-chip-price">${price}</small>` : ''}
            </span>
        </span>`;
}

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function showToast(message, type = 'info', timeout = 4500) {
    document.querySelectorAll('.toast-alert').forEach(el => el.remove());
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} toast-alert`;
    alert.innerHTML = message;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, timeout);
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session || null;
}

/**
 * Devuelve el perfil del usuario autenticado. Si el trigger de la base de datos
 * no lo creó todavía, lo crea como usuario/pasajero.
 */
export async function getMyProfile() {
    const session = await getSession();
    if (!session) return null;

    const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

    if (error) throw error;
    if (existing) return existing;

    const meta = session.user.user_metadata || {};
    const fallback = {
        id: session.user.id,
        email: session.user.email,
        full_name: meta.full_name || meta.name || (session.user.email || '').split('@')[0],
        role: 'traveler',
        avatar_url: meta.avatar_url || meta.picture || null
    };

    const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert(fallback)
        .select()
        .single();

    if (insertError) throw insertError;
    return created;
}

/**
 * Completa el registro de un usuario que entró con Google.
 * Solo permite elegir "driver" o "traveler" (nunca admin/secretaria).
 */
export async function completeRegistration(role) {
    if (!['driver', 'traveler'].includes(role)) return;
    const { error } = await supabase.rpc('complete_registration', { p_role: role });
    if (error) throw error;
}

export function redirectByRole(role) {
    if (isStaff(role)) {
        window.location.href = 'dashboard.html';
    } else {
        window.location.href = 'my-travels.html';
    }
}

export async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    localStorage.removeItem('userRole');
    localStorage.removeItem('pendingRole');
    window.location.href = DEMO_MODE ? 'login.html?switch=1' : 'login.html';
}

export function googleRedirectUrl(role = '') {
    const url = new URL('login.html', window.location.href);
    if (role) url.searchParams.set('role', role);
    url.searchParams.set('oauth', '1');
    return url.toString();
}

export async function signInWithGoogle(role = '') {
    if (role && !['driver', 'traveler'].includes(role)) role = 'traveler';
    if (role) localStorage.setItem('pendingRole', role);

    const redirectTo = googleRedirectUrl(role);
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
    });
    if (error) throw error;
}

/**
 * HTML del habitáculo con la distribución en L: 1 asiento delantero derecho
 * y 3 asientos en la fila trasera.
 */
export function seatCabinHtml(seats = [], { currentProfileId = null } = {}) {
    const list = Array.isArray(seats) ? seats : [];
    const byKey = {};

    list.forEach((seat, index) => {
        let key = seat.seat_position;
        if (!key || !SEAT_BY_KEY[key]) {
            const fallback = SEAT_BY_NUMBER[seat.seat_number] || SEAT_POSITIONS[index];
            key = fallback?.key;
        }
        if (key && !byKey[key]) byKey[key] = seat;
    });

    const renderSeat = (key) => {
        const seat = byKey[key];
        if (!seat) {
            return `<div class="seat empty" aria-hidden="true">
                <span class="seat-back"></span>
                <span class="seat-cushion"><span class="seat-code">—</span></span>
            </div>`;
        }

        const status = seat.status || 'available';
        const mine = currentProfileId && seat.traveler_id === currentProfileId;
        const classes = ['seat', 'seat-shape', status];
        if (mine) classes.push('mine');
        if (status === 'available') classes.push('selectable');

        const price = Number(seat.price) || 0;
        const label = SEAT_BY_KEY[key]?.label || `Asiento ${seat.seat_number}`;
        const shortDescription = label
            .replace('Delantero derecho', 'Delantero')
            .replace('Atrás izquierda', 'Atrás izq.')
            .replace('Atrás centro', 'Atrás centro')
            .replace('Atrás derecha', 'Atrás der.');
        const statusText = status === 'available' ? 'Libre' : status === 'reserved' ? 'Reservado' : 'Ocupado';

        return `
            <button type="button"
                class="${classes.join(' ')}"
                data-seat-id="${seat.id}"
                data-seat-number="${seat.seat_number}"
                data-seat-position="${key}"
                data-seat-price="${price}"
                ${status !== 'available' ? 'disabled' : ''}
                aria-label="${escapeHtml(label)} · A${seat.seat_number} · ${statusText} · ${formatCurrency(price)}"
                title="${escapeHtml(label)} · ${statusText} · ${formatCurrency(price)}${mine ? ' (tu asiento)' : ''}">
                <span class="seat-back"></span>
                <span class="seat-cushion">
                    <span class="seat-code">${seatCode(seat)}</span>
                    <span class="seat-desc">${escapeHtml(shortDescription)}</span>
                    <span class="seat-price">${formatCurrency(price)}</span>
                </span>
            </button>`;
    };

    return `
        <div class="car-top-view">
            <div class="car-top-label">Vista aérea del vehículo</div>
            <div class="car-stage" role="group" aria-label="Mapa de asientos del vehículo">
                <svg class="car-silhouette" viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <defs>
                        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#e8f1ec"/>
                            <stop offset="0.45" stop-color="#fbfdfc"/>
                            <stop offset="1" stop-color="#dbe8e1"/>
                        </linearGradient>
                        <linearGradient id="carGlass" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#c7e7f5"/>
                            <stop offset="1" stop-color="#eef9fd"/>
                        </linearGradient>
                        <filter id="carShadow" x="-30%" y="-20%" width="160%" height="150%">
                            <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#1a5240" flood-opacity="0.18"/>
                        </filter>
                    </defs>
                    <rect x="4" y="118" width="28" height="72" rx="13" fill="#2f3b38"/>
                    <rect x="328" y="118" width="28" height="72" rx="13" fill="#2f3b38"/>
                    <rect x="4" y="388" width="28" height="72" rx="13" fill="#2f3b38"/>
                    <rect x="328" y="388" width="28" height="72" rx="13" fill="#2f3b38"/>
                    <path d="M120 20 C86 20 62 36 56 76 L40 392 C38 466 76 526 130 540 L230 540 C284 526 322 466 320 392 L304 76 C298 36 274 20 240 20 Z"
                        fill="url(#carBody)" stroke="#236b55" stroke-width="3" filter="url(#carShadow)"/>
                    <path d="M88 52 C124 40 236 40 272 52" fill="none" stroke="#b8cfc4" stroke-width="3" stroke-linecap="round"/>
                    <rect x="68" y="30" width="46" height="14" rx="7" fill="#fbbf24"/>
                    <rect x="246" y="30" width="46" height="14" rx="7" fill="#fbbf24"/>
                    <path d="M82 92 C120 76 240 76 278 92 L262 140 C220 128 140 128 98 140 Z" fill="url(#carGlass)" stroke="#9ec9dd" stroke-width="2"/>
                    <rect x="56" y="148" width="248" height="264" rx="30" fill="#ffffff" opacity=".45" stroke="#b8cfc4" stroke-width="2"/>
                    <path d="M86 166 C140 154 220 154 274 166" fill="none" stroke="#236b55" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>
                    <path d="M98 422 C140 434 220 434 262 422 L278 470 C240 486 120 486 82 470 Z" fill="url(#carGlass)" stroke="#9ec9dd" stroke-width="2"/>
                    <rect x="68" y="516" width="46" height="14" rx="7" fill="#ef4444" opacity=".9"/>
                    <rect x="246" y="516" width="46" height="14" rx="7" fill="#ef4444" opacity=".9"/>
                    <path d="M32 168 C16 168 10 182 12 196 L30 200 Z" fill="#236b55" opacity=".55"/>
                    <path d="M328 168 C344 168 350 182 348 196 L330 200 Z" fill="#236b55" opacity=".55"/>
                    <rect x="148" y="532" width="64" height="12" rx="4" fill="#236b55" opacity=".25"/>
                </svg>

                <div class="car-seats" aria-label="Asientos">
                    <div class="seat-front-row">
                        <div class="driver-zone">
                            <span class="steering-wheel" title="Conductor">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="9"></circle>
                                    <circle cx="12" cy="12" r="2.5"></circle>
                                    <path d="M3 12h7M14 12h7M12 14.5V21"></path>
                                </svg>
                            </span>
                            <span class="driver-label">Conductor</span>
                        </div>
                        ${renderSeat('front_right')}
                    </div>
                    <div class="seat-back-row">
                        ${renderSeat('back_left')}
                        ${renderSeat('back_middle')}
                        ${renderSeat('back_right')}
                    </div>
                </div>
            </div>
            <div class="car-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>
                Toca un asiento libre para seleccionarlo
            </div>
        </div>`;
}

export function seatLegendHtml() {
    return `
        <div class="seat-legend">
            <div class="legend-item"><div class="legend-box" style="background: var(--white); border-color: var(--border);"></div> Libre</div>
            <div class="legend-item"><div class="legend-box" style="background: var(--primary); border-color: var(--primary);"></div> Seleccionado</div>
            <div class="legend-item"><div class="legend-box" style="background: rgba(245,158,11,.12); border-color: var(--warning);"></div> Reservado</div>
            <div class="legend-item"><div class="legend-box" style="background: var(--light); border-color: var(--border);"></div> Ocupado</div>
        </div>`;
}
