// OlmedoRides - Cliente Supabase simulado para el modo demo local.
// Datos en localStorage, sin backend y sin internet.
// No pretende ser una implementación completa de Supabase, solo cubre
// las consultas y RPC que usan las páginas de este proyecto.

const DB_KEY = 'olmedorides_demo_db_v3';

export const DEMO_ACCOUNTS = [
    {
        role: 'admin',
        label: 'Administrador',
        email: 'admin@olmedorides.app',
        password: '12345',
        description: 'Acceso total y gestión de roles'
    },
    {
        role: 'secretary',
        label: 'Secretaria',
        email: 'secretaria@olmedorides.app',
        password: '12345',
        description: 'Ver y crear viajes, vehículos y conductores'
    },
    {
        role: 'driver',
        label: 'Conductor',
        email: 'conductor@olmedorides.app',
        password: '12345',
        description: 'Tomar viajes disponibles y ver pasajeros'
    },
    {
        role: 'traveler',
        label: 'Usuario (user/1234)',
        email: 'user@olmedorides.app',
        password: '1234',
        description: 'Usuario de prueba para reservar viajes y asientos'
    }
];

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const SECRETARY_ID = '22222222-2222-4222-8222-222222222222';
const DRIVER_ID = '33333333-3333-4333-8333-333333333333';
const TRAVELER_ID = '44444444-4444-4444-8444-444444444444';
const CAR1_ID = '55555555-5555-4555-8555-555555555555';
const CAR2_ID = '66666666-6666-4666-8666-666666666666';
const TRAVEL1_ID = '77777777-7777-4777-8777-777777777777';
const TRAVEL2_ID = '88888888-8888-4888-8888-888888888888';
const TRAVEL3_ID = '99999999-9999-4999-8999-999999999999';
const TRAVEL4_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const SEAT_POSITIONS = ['front_right', 'back_left', 'back_middle', 'back_right'];

function uuid() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'demo-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function nowIso() {
    return new Date().toISOString();
}

function dateInDays(days, hour = 8, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

function svgImage(label, color = '#236b55', width = 480, height = 280) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="${color}"/>
        <circle cx="${width / 2}" cy="${height / 2 - 12}" r="${Math.min(width, height) * 0.18}" fill="rgba(255,255,255,.18)"/>
        <text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(20, Math.round(width / 14))}" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function seedDb() {
    const created = nowIso();
    const driverPhoto = svgImage('Carlos', '#1a5240', 240, 240);
    const car1Photo = svgImage('Mercedes Sprinter', '#236b55');
    const car2Photo = svgImage('Toyota Hiace', '#2d8a6b');

    const profiles = [
        {
            id: ADMIN_ID,
            email: 'admin@olmedorides.app',
            full_name: 'Administrador Demo',
            role: 'admin',
            phone: '+593 99 000 0001',
            avatar_url: null,
            created_at: created,
            updated_at: created
        },
        {
            id: SECRETARY_ID,
            email: 'secretaria@olmedorides.app',
            full_name: 'Marta Secretaria',
            role: 'secretary',
            phone: '+593 99 000 0002',
            avatar_url: null,
            created_at: created,
            updated_at: created
        },
        {
            id: DRIVER_ID,
            email: 'conductor@olmedorides.app',
            full_name: 'Carlos Conductor',
            role: 'driver',
            phone: '+593 99 000 0003',
            avatar_url: driverPhoto,
            created_at: created,
            updated_at: created
        },
        {
            id: TRAVELER_ID,
            email: 'user@olmedorides.app',
            full_name: 'Usuario de Prueba',
            role: 'traveler',
            phone: '+593 99 000 0004',
            avatar_url: null,
            created_at: created,
            updated_at: created
        }
    ];

    const cars = [
        {
            id: CAR1_ID,
            license_plate: 'PBA-1234',
            brand: 'Mercedes',
            model: 'Sprinter',
            year: 2024,
            total_seats: 4,
            image_url: car1Photo,
            notes: 'Vehículo demo con asientos A1 + A2/A3/A4.',
            is_active: true,
            created_at: created,
            updated_at: created
        },
        {
            id: CAR2_ID,
            license_plate: 'PBC-5678',
            brand: 'Toyota',
            model: 'Hiace',
            year: 2023,
            total_seats: 4,
            image_url: car2Photo,
            notes: 'Vehículo demo asignado al conductor.',
            is_active: true,
            created_at: created,
            updated_at: created
        }
    ];

    const drivers = [
        {
            id: DRIVER_ID,
            license_number: 'LIC-12345',
            license_expiry: dateInDays(365, 0, 0).slice(0, 10),
            car_id: CAR1_ID,
            photo_url: driverPhoto,
            rating: 4.9,
            total_trips: 12,
            is_available: true,
            created_at: created,
            updated_at: created
        }
    ];

    const travels = [
        {
            id: TRAVEL1_ID,
            travel_code: 'OLM-DEMO01',
            title: 'Quito → Guayaquil',
            source_city: 'Quito',
            destination_city: 'Guayaquil',
            route: 'Quito → Santo Domingo → Quevedo → Guayaquil por E35',
            departure_time: dateInDays(1, 7, 0),
            arrival_time: dateInDays(1, 15, 0),
            expected_duration: null,
            average_duration_minutes: 480,
            price_per_seat: 18,
            driver_id: null,
            car_id: CAR1_ID,
            status: 'scheduled',
            notes: 'Salida desde el Terminal Quitumbe. Llega 20 minutos antes.',
            max_seats: 4,
            created_by: SECRETARY_ID,
            created_at: created,
            updated_at: created
        },
        {
            id: TRAVEL2_ID,
            travel_code: 'OLM-DEMO02',
            title: 'Cuenca → Loja',
            source_city: 'Cuenca',
            destination_city: 'Loja',
            route: 'Cuenca → Saraguro → Loja por E35',
            departure_time: dateInDays(1, 8, 30),
            arrival_time: dateInDays(1, 12, 30),
            expected_duration: null,
            average_duration_minutes: 240,
            price_per_seat: 12,
            driver_id: DRIVER_ID,
            car_id: CAR2_ID,
            status: 'scheduled',
            notes: 'Viaje asignado al conductor Carlos. Salida desde el Terminal Terrestre de Cuenca.',
            max_seats: 4,
            created_by: SECRETARY_ID,
            created_at: created,
            updated_at: created
        },
        {
            id: TRAVEL3_ID,
            travel_code: 'OLM-DEMO03',
            title: 'Ambato → Baños de Agua Santa',
            source_city: 'Ambato',
            destination_city: 'Baños de Agua Santa',
            route: 'Ambato → Pelileo → Baños de Agua Santa por E35',
            departure_time: dateInDays(3, 9, 0),
            arrival_time: dateInDays(3, 10, 0),
            expected_duration: null,
            average_duration_minutes: 60,
            price_per_seat: 5,
            driver_id: null,
            car_id: CAR1_ID,
            status: 'scheduled',
            notes: 'Viaje corto disponible para que lo tome un conductor.',
            max_seats: 4,
            created_by: SECRETARY_ID,
            created_at: created,
            updated_at: created
        },
        {
            id: TRAVEL4_ID,
            travel_code: 'OLM-DEMO04',
            title: 'Quito → Ambato',
            source_city: 'Quito',
            destination_city: 'Ambato',
            route: 'Quito → Latacunga → Ambato por Panamericana E35',
            departure_time: dateInDays(-2, 7, 0),
            arrival_time: dateInDays(-2, 9, 30),
            expected_duration: null,
            average_duration_minutes: 150,
            price_per_seat: 8,
            driver_id: DRIVER_ID,
            car_id: CAR1_ID,
            status: 'completed',
            started_at: dateInDays(-2, 7, 5),
            finished_at: dateInDays(-2, 9, 40),
            start_lat: -0.1807,
            start_lng: -78.4678,
            finish_lat: -1.2540,
            finish_lng: -78.6220,
            notes: 'Viaje completado de ejemplo para el historial del conductor.',
            max_seats: 4,
            created_by: SECRETARY_ID,
            created_at: created,
            updated_at: created
        }
    ];

    const seats = [];
    const bookings = [];

    function addSeats(travel, reserved = {}, bookingStatus = 'confirmed', paymentStatus = 'pending') {
        for (let i = 1; i <= 4; i++) {
            const extra = reserved[i] || {};
            const seat = {
                id: uuid(),
                travel_id: travel.id,
                seat_number: i,
                seat_position: SEAT_POSITIONS[i - 1],
                status: extra.status || (extra.traveler_id ? 'reserved' : 'available'),
                price: travel.price_per_seat,
                traveler_id: extra.traveler_id || null,
                luggage_confirmed: extra.luggage_confirmed || false,
                estimated_weight_kg: extra.estimated_weight_kg ?? null,
                reserved_at: extra.traveler_id ? created : null,
                created_at: created,
                updated_at: created
            };
            seats.push(seat);
            if (extra.traveler_id) {
                bookings.push({
                    id: uuid(),
                    travel_id: travel.id,
                    traveler_id: extra.traveler_id,
                    seat_id: seat.id,
                    total_price: travel.price_per_seat,
                    status: bookingStatus,
                    payment_status: paymentStatus,
                    luggage_confirmed: extra.luggage_confirmed || false,
                    estimated_weight_kg: extra.estimated_weight_kg ?? null,
                    pickup_option: extra.pickup_option || 'current',
                    pickup_lat: extra.pickup_lat ?? -0.1807,
                    pickup_lng: extra.pickup_lng ?? -78.4678,
                    pickup_address: extra.pickup_address || null,
                    booking_reference: 'OLM-DEMO' + String(bookings.length + 1).padStart(4, '0'),
                    created_at: created,
                    updated_at: created
                });
            }
        }
    }

    addSeats(travels[0]);
    addSeats(travels[1], {
        1: {
            traveler_id: TRAVELER_ID,
            luggage_confirmed: true,
            estimated_weight_kg: 12,
            pickup_option: 'current',
            pickup_lat: -0.1807,
            pickup_lng: -78.4678,
            pickup_address: 'Terminal Terrestre de Cuenca'
        }
    });
    addSeats(travels[2]);
    addSeats(travels[3], {
        1: {
            traveler_id: TRAVELER_ID,
            status: 'occupied',
            luggage_confirmed: true,
            estimated_weight_kg: 10,
            pickup_option: 'other',
            pickup_lat: -0.2200,
            pickup_lng: -78.5120,
            pickup_address: 'Parque La Carolina, Quito'
        }
    }, 'completed', 'paid');

    return {
        profiles,
        cars,
        drivers,
        travels,
        seats,
        bookings,
        credentials: Object.fromEntries(DEMO_ACCOUNTS.map(account => [account.email, account.password])),
        sessionUserId: null,
        created_at: created
    };
}

function loadDb() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.profiles)) return parsed;
        }
    } catch (error) {
        console.warn('Demo DB corrupta, se regenera:', error);
    }
    const db = seedDb();
    saveDb(db);
    return db;
}

function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function currentSession(db) {
    if (!db.sessionUserId) return null;
    const profile = db.profiles.find(p => p.id === db.sessionUserId);
    if (!profile) {
        db.sessionUserId = null;
        saveDb(db);
        return null;
    }
    return buildSession(profile, profile.email?.includes('@gmail') ? 'google' : 'email');
}

function buildSession(profile, provider = 'email') {
    return {
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
            id: profile.id,
            email: profile.email,
            user_metadata: {
                full_name: profile.full_name,
                role: profile.role,
                phone: profile.phone,
                avatar_url: profile.avatar_url
            },
            app_metadata: {
                provider,
                providers: [provider]
            }
        }
    };
}

function getField(row, path) {
    if (!row) return undefined;
    if (Object.prototype.hasOwnProperty.call(row, path)) return row[path];
    return String(path).split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), row);
}

function compareValues(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' });
    }
    return a > b ? 1 : a < b ? -1 : 0;
}

function looseEqual(a, b) {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (typeof a === 'boolean' || typeof b === 'boolean') return Boolean(a) === Boolean(b);
    return String(a) === String(b);
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function likeTest(value, pattern) {
    if (value == null) return false;
    const regex = new RegExp(
        '^' + escapeRegex(pattern).replace(/%/g, '.*').replace(/_/g, '.') + '$',
        'i'
    );
    return regex.test(String(value));
}

function resolveColumnValue(row, col, db, table) {
    if (!col) return undefined;
    if (!String(col).includes('.')) return row[col];

    const [first, ...rest] = String(col).split('.');
    const path = rest.join('.');

    if (table === 'bookings' && first === 'traveler') {
        const profile = db.profiles.find(p => p.id === row.traveler_id);
        return getField(profile, path);
    }
    if (table === 'bookings' && first === 'travel') {
        const travel = db.travels.find(t => t.id === row.travel_id);
        return getField(travel, path);
    }
    if (table === 'drivers' && first === 'profiles') {
        const profile = db.profiles.find(p => p.id === row.id);
        return getField(profile, path);
    }
    return getField(row, col);
}

function matchFilter(row, filter, db, table) {
    const value = resolveColumnValue(row, filter.col, db, table);

    switch (filter.op) {
        case 'eq':
            return looseEqual(value, filter.val);
        case 'neq':
            return !looseEqual(value, filter.val);
        case 'is':
            if (filter.val === null || filter.val === 'null') return value == null;
            if (filter.val === true || filter.val === 'true') return value === true;
            if (filter.val === false || filter.val === 'false') return value === false;
            return looseEqual(value, filter.val);
        case 'gt':
            return compareValues(value, filter.val) > 0;
        case 'gte':
            return compareValues(value, filter.val) >= 0;
        case 'lt':
            return compareValues(value, filter.val) < 0;
        case 'lte':
            return compareValues(value, filter.val) <= 0;
        case 'in':
            return (filter.val || []).some(v => looseEqual(value, v));
        case 'or':
            return matchOr(row, filter.val, db, table);
        default:
            return true;
    }
}

function matchOr(row, expression, db, table) {
    if (!expression) return false;
    const regex = /([a-zA-Z0-9_.]+)\.(eq|neq|ilike|like|gt|gte|lt|lte|is)\.([^,]*)/g;
    let match;
    while ((match = regex.exec(expression)) !== null) {
        const [, col, op, rawValue] = match;
        const value = resolveColumnValue(row, col, db, table);

        if (op === 'ilike' || op === 'like') {
            if (likeTest(value, rawValue)) return true;
        } else if (op === 'eq') {
            if (looseEqual(value, rawValue)) return true;
        } else if (op === 'neq') {
            if (!looseEqual(value, rawValue)) return true;
        } else if (op === 'gt') {
            if (compareValues(value, rawValue) > 0) return true;
        } else if (op === 'gte') {
            if (compareValues(value, rawValue) >= 0) return true;
        } else if (op === 'lt') {
            if (compareValues(value, rawValue) < 0) return true;
        } else if (op === 'lte') {
            if (compareValues(value, rawValue) <= 0) return true;
        } else if (op === 'is') {
            const expected = rawValue === 'null' ? null : rawValue;
            if (looseEqual(value, expected)) return true;
        }
    }
    return false;
}

function sortRows(rows, orders) {
    if (!orders.length) return rows;
    return [...rows].sort((a, b) => {
        for (const order of orders) {
            const av = getField(a, order.col);
            const bv = getField(b, order.col);
            const cmp = compareValues(av, bv);
            if (cmp !== 0) return order.ascending ? cmp : -cmp;
        }
        return 0;
    });
}

// ---------------------------------------------------------------------------
// Relaciones usadas por los select anidados de las páginas
// ---------------------------------------------------------------------------
const RELATIONS = {
    drivers: {
        profiles: { type: 'one', fk: 'id', refTable: 'profiles', refKey: 'id' },
        cars: { type: 'one', fk: 'car_id', refTable: 'cars', refKey: 'id' }
    },
    travels: {
        drivers: { type: 'one', fk: 'driver_id', refTable: 'drivers', refKey: 'id' },
        cars: { type: 'one', fk: 'car_id', refTable: 'cars', refKey: 'id' },
        seats: { type: 'many', fk: 'id', refTable: 'seats', refKey: 'travel_id' }
    },
    seats: {
        profiles: { type: 'one', fk: 'traveler_id', refTable: 'profiles', refKey: 'id' }
    },
    bookings: {
        profiles: { type: 'one', fk: 'traveler_id', refTable: 'profiles', refKey: 'id' },
        travels: { type: 'one', fk: 'travel_id', refTable: 'travels', refKey: 'id' },
        seats: { type: 'one', fk: 'seat_id', refTable: 'seats', refKey: 'id' }
    }
};

function splitTopLevel(str, delimiter) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of str) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === delimiter && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) parts.push(current);
    return parts;
}

function findMatchingParen(str, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < str.length; i++) {
        if (str[i] === '(') depth++;
        else if (str[i] === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return str.length - 1;
}

const selectCache = new Map();

function parseSelect(input) {
    const key = String(input || '*').trim();
    if (selectCache.has(key)) return selectCache.get(key);

    const parsed = [];
    for (const rawPart of splitTopLevel(key, ',')) {
        const part = rawPart.trim();
        if (!part) continue;

        if (part === '*') {
            parsed.push({ type: 'all' });
            continue;
        }

        const parenIndex = part.indexOf('(');
        if (parenIndex === -1) {
            parsed.push({ type: 'column', name: part });
            continue;
        }

        const closeIndex = findMatchingParen(part, parenIndex);
        const head = part.slice(0, parenIndex).trim();
        const inner = part.slice(parenIndex + 1, closeIndex);
        const pieces = head.split(':');
        const alias = (pieces.length > 1 ? pieces[0] : head).trim();
        const table = (pieces.length > 1 ? pieces[1] : head).trim();

        parsed.push({
            type: 'relation',
            alias,
            table,
            select: parseSelect(inner)
        });
    }

    selectCache.set(key, parsed);
    return parsed;
}

function resolveRelation(db, parentTable, targetTable, row) {
    const relation = RELATIONS[parentTable]?.[targetTable];
    if (!relation) return { many: false, rows: [] };

    if (relation.type === 'many') {
        const rows = (db[relation.refTable] || []).filter(t => looseEqual(t[relation.refKey], row[relation.fk]));
        return { many: true, rows };
    }

    const fkValue = row[relation.fk];
    if (fkValue == null) return { many: false, rows: [] };
    const target = (db[relation.refTable] || []).find(t => looseEqual(t[relation.refKey], fkValue));
    return { many: false, rows: target ? [target] : [] };
}

function buildProjected(row, table, selectTree, db) {
    const result = {};
    for (const item of selectTree) {
        if (item.type === 'all') {
            Object.assign(result, row);
        } else if (item.type === 'column') {
            result[item.name] = row[item.name];
        } else if (item.type === 'relation') {
            const relation = resolveRelation(db, table, item.table, row);
            if (relation.many) {
                result[item.alias] = relation.rows.map(target =>
                    buildProjected(target, item.table, item.select, db)
                );
            } else {
                result[item.alias] = relation.rows[0]
                    ? buildProjected(relation.rows[0], item.table, item.select, db)
                    : null;
            }
        }
    }
    return result;
}

function projectRow(row, table, selectStr, db) {
    return buildProjected(row, table, parseSelect(selectStr), db);
}

function toSingle(data, singleMode, maybeSingleMode) {
    if (!singleMode && !maybeSingleMode) return { data, error: null };
    if (data.length === 1) return { data: data[0], error: null };
    if (data.length === 0 && maybeSingleMode) return { data: null, error: null };
    return {
        data: null,
        error: {
            message: 'La consulta no devolvió un único registro',
            code: 'PGRST116'
        }
    };
}

// ---------------------------------------------------------------------------
// Inserts / updates / deletes + triggers simulados
// ---------------------------------------------------------------------------
function generateTravelCode(db) {
    let code;
    do {
        code = 'OLM-' + Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, '0');
    } while ((db.travels || []).some(t => t.travel_code === code));
    return code;
}

function generateBookingReference(db) {
    let ref;
    do {
        ref = 'OLM-' + Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, '0');
    } while ((db.bookings || []).some(b => b.booking_reference === ref));
    return ref;
}

function ensureDriverRow(db, profileId, profile = null) {
    if (!Array.isArray(db.drivers)) db.drivers = [];
    if (db.drivers.some(d => d.id === profileId)) return;
    const created = nowIso();
    db.drivers.push({
        id: profileId,
        license_number: 'PENDIENTE-' + String(profileId).slice(0, 8),
        license_expiry: null,
        car_id: null,
        photo_url: profile?.avatar_url || null,
        rating: 5,
        total_trips: 0,
        is_available: true,
        created_at: created,
        updated_at: created
    });
}

function createSeatsForTravel(db, travel) {
    if (!Array.isArray(db.seats)) db.seats = [];
    const created = nowIso();
    for (let i = 1; i <= 4; i++) {
        if (db.seats.some(s => s.travel_id === travel.id && s.seat_number === i)) continue;
        db.seats.push({
            id: uuid(),
            travel_id: travel.id,
            seat_number: i,
            seat_position: SEAT_POSITIONS[i - 1],
            status: 'available',
            price: Number(travel.price_per_seat) || 0,
            traveler_id: null,
            luggage_confirmed: false,
            estimated_weight_kg: null,
            reserved_at: null,
            created_at: created,
            updated_at: created
        });
    }
}

function insertRows(db, table, payload) {
    if (!Array.isArray(db[table])) db[table] = [];
    const input = Array.isArray(payload) ? payload : [payload];
    const created = nowIso();
    const inserted = [];

    for (const raw of input) {
        const row = { ...(raw || {}) };
        if (!row.id) row.id = uuid();
        if (!row.created_at) row.created_at = created;
        if (!row.updated_at) row.updated_at = created;

        if (table === 'profiles') {
            if (!row.role) row.role = 'traveler';
            if (row.email) row.email = String(row.email).trim().toLowerCase();
        } else if (table === 'cars') {
            if (row.total_seats == null) row.total_seats = 4;
            if (row.is_active == null) row.is_active = true;
        } else if (table === 'drivers') {
            if (row.rating == null) row.rating = 5;
            if (row.total_trips == null) row.total_trips = 0;
            if (row.is_available == null) row.is_available = true;
            if (!row.license_number) row.license_number = 'PENDIENTE-' + String(row.id).slice(0, 8);
        } else if (table === 'travels') {
            if (!row.travel_code) row.travel_code = generateTravelCode(db);
            if (!row.title || !String(row.title).trim()) {
                row.title = `${row.source_city || ''} → ${row.destination_city || ''}`;
            }
            if (!row.status) row.status = 'scheduled';
            if (row.max_seats == null) row.max_seats = 4;
            if (row.average_duration_minutes == null) row.average_duration_minutes = 0;
            row.price_per_seat = Number(row.price_per_seat) || 0;
        } else if (table === 'seats') {
            if (!row.status) row.status = 'available';
            row.price = Number(row.price) || 0;
            if (row.luggage_confirmed == null) row.luggage_confirmed = false;
        } else if (table === 'bookings') {
            if (!row.booking_reference) row.booking_reference = generateBookingReference(db);
            if (!row.status) row.status = 'confirmed';
            if (!row.payment_status) row.payment_status = 'pending';
            if (row.luggage_confirmed == null) row.luggage_confirmed = false;
            row.total_price = Number(row.total_price) || 0;
        }

        db[table].push(row);
        inserted.push(row);

        if (table === 'travels') createSeatsForTravel(db, row);
    }

    return inserted;
}

function updateRows(db, table, filters, payload) {
    const rows = (db[table] || []).filter(row =>
        filters.every(filter => matchFilter(row, filter, db, table))
    );

    for (const row of rows) {
        Object.assign(row, payload || {});
        if (table === 'travels') {
            if (!row.title || !String(row.title).trim()) {
                row.title = `${row.source_city || ''} → ${row.destination_city || ''}`;
            }
            row.price_per_seat = Number(row.price_per_seat) || 0;
        }
        if (table === 'seats') {
            row.price = Number(row.price) || 0;
        }
        if (table === 'bookings') {
            row.total_price = Number(row.total_price) || 0;
        }
        row.updated_at = nowIso();
    }

    return rows;
}

function deleteRows(db, table, filters) {
    const rows = (db[table] || []).filter(row =>
        filters.every(filter => matchFilter(row, filter, db, table))
    );
    const ids = new Set(rows.map(r => r.id));
    db[table] = (db[table] || []).filter(r => !ids.has(r.id));

    if (table === 'travels') {
        db.seats = (db.seats || []).filter(s => !ids.has(s.travel_id));
        db.bookings = (db.bookings || []).filter(b => !ids.has(b.travel_id));
    } else if (table === 'drivers') {
        (db.travels || []).forEach(t => {
            if (ids.has(t.driver_id)) t.driver_id = null;
        });
    } else if (table === 'cars') {
        (db.travels || []).forEach(t => {
            if (ids.has(t.car_id)) t.car_id = null;
        });
    } else if (table === 'profiles') {
        db.drivers = (db.drivers || []).filter(d => !ids.has(d.id));
        db.bookings = (db.bookings || []).filter(b => !ids.has(b.traveler_id));
        (db.seats || []).forEach(s => {
            if (ids.has(s.traveler_id)) {
                s.traveler_id = null;
                s.status = 'available';
                s.luggage_confirmed = false;
                s.estimated_weight_kg = null;
                s.reserved_at = null;
                s.updated_at = nowIso();
            }
        });
        (db.travels || []).forEach(t => {
            if (ids.has(t.driver_id)) t.driver_id = null;
        });
        if (ids.has(db.sessionUserId)) db.sessionUserId = null;
    } else if (table === 'seats') {
        db.bookings = (db.bookings || []).filter(b => !ids.has(b.seat_id));
    }

    return rows;
}

// ---------------------------------------------------------------------------
// Query builder compatible con el subconjunto usado por la app
// ---------------------------------------------------------------------------
class DemoQuery {
    constructor(table) {
        this.table = table;
        this.action = 'select';
        this.columns = '*';
        this.filters = [];
        this.orders = [];
        this.limitCount = null;
        this.singleMode = false;
        this.maybeSingleMode = false;
        this.returning = false;
        this.count = null;
        this.head = false;
        this.payload = null;
    }

    select(columns = '*', options = {}) {
        this.columns = columns || '*';
        if (options.count) this.count = options.count;
        if (options.head) this.head = true;
        if (this.action !== 'select') this.returning = true;
        return this;
    }

    insert(data) {
        this.action = 'insert';
        this.payload = data;
        return this;
    }

    update(data) {
        this.action = 'update';
        this.payload = data;
        return this;
    }

    delete() {
        this.action = 'delete';
        return this;
    }

    eq(col, val) { this.filters.push({ op: 'eq', col, val }); return this; }
    neq(col, val) { this.filters.push({ op: 'neq', col, val }); return this; }
    is(col, val) { this.filters.push({ op: 'is', col, val }); return this; }
    gt(col, val) { this.filters.push({ op: 'gt', col, val }); return this; }
    gte(col, val) { this.filters.push({ op: 'gte', col, val }); return this; }
    lt(col, val) { this.filters.push({ op: 'lt', col, val }); return this; }
    lte(col, val) { this.filters.push({ op: 'lte', col, val }); return this; }
    in(col, val) { this.filters.push({ op: 'in', col, val }); return this; }
    or(expression) { this.filters.push({ op: 'or', val: expression }); return this; }

    order(col, options = {}) {
        this.orders.push({ col, ascending: options.ascending !== false });
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.singleMode = true;
        return this;
    }

    maybeSingle() {
        this.maybeSingleMode = true;
        return this;
    }

    then(resolve, reject) {
        return this.execute().then(resolve, reject);
    }

    async execute() {
        const db = loadDb();
        const tableData = Array.isArray(db[this.table]) ? db[this.table] : [];

        if (this.action === 'select') {
            let rows = tableData.filter(row =>
                this.filters.every(filter => matchFilter(row, filter, db, this.table))
            );
            rows = sortRows(rows, this.orders);
            if (this.limitCount != null) rows = rows.slice(0, this.limitCount);

            if (this.head) {
                return { data: null, count: rows.length, error: null };
            }

            const data = rows.map(row => projectRow(row, this.table, this.columns, db));
            const singleResult = toSingle(data, this.singleMode, this.maybeSingleMode);
            return {
                data: singleResult.data,
                count: this.count ? rows.length : null,
                error: singleResult.error
            };
        }

        if (this.action === 'insert') {
            const inserted = insertRows(db, this.table, this.payload);
            saveDb(db);
            if (!this.returning) return { data: null, error: null };
            const data = inserted.map(row => projectRow(row, this.table, this.columns, db));
            const singleResult = toSingle(data, this.singleMode, this.maybeSingleMode);
            return { data: singleResult.data, error: singleResult.error };
        }

        if (this.action === 'update') {
            const updated = updateRows(db, this.table, this.filters, this.payload);
            saveDb(db);
            if (!this.returning) return { data: null, error: null };
            const data = updated.map(row => projectRow(row, this.table, this.columns, db));
            const singleResult = toSingle(data, this.singleMode, this.maybeSingleMode);
            return { data: singleResult.data, error: singleResult.error };
        }

        if (this.action === 'delete') {
            const deleted = deleteRows(db, this.table, this.filters);
            saveDb(db);
            if (!this.returning) return { data: null, error: null };
            const data = deleted.map(row => projectRow(row, this.table, this.columns, db));
            const singleResult = toSingle(data, this.singleMode, this.maybeSingleMode);
            return { data: singleResult.data, error: singleResult.error };
        }

        return { data: null, error: { message: 'Acción no soportada en modo demo' } };
    }
}

// ---------------------------------------------------------------------------
// Cliente demo
// ---------------------------------------------------------------------------
export function createDemoClient() {
    return {
        auth: {
            async getSession() {
                const db = loadDb();
                return { data: { session: currentSession(db) }, error: null };
            },

            async signInWithPassword({ email, password }) {
                const db = loadDb();
                let normalized = String(email || '').trim().toLowerCase();
                if (normalized === 'user') normalized = 'user@olmedorides.app';
                if (normalized === 'adm!n') normalized = 'admin@olmedorides.app';
                const profile = db.profiles.find(p => String(p.email).toLowerCase() === normalized);
                const expected = db.credentials[normalized];

                if (!profile || !expected || String(password) !== String(expected)) {
                    return {
                        data: { user: null, session: null },
                        error: { message: 'Correo o contraseña incorrectos' }
                    };
                }

                db.sessionUserId = profile.id;
                saveDb(db);
                const session = buildSession(profile, 'email');
                return { data: { user: session.user, session }, error: null };
            },

            async signUp({ email, password, options = {} }) {
                const db = loadDb();
                const normalized = String(email || '').trim().toLowerCase();
                if (!normalized) {
                    return { data: { user: null, session: null }, error: { message: 'El correo es obligatorio' } };
                }
                if (db.profiles.some(p => String(p.email).toLowerCase() === normalized)) {
                    return { data: { user: null, session: null }, error: { message: 'Ya existe una cuenta con ese correo' } };
                }

                const meta = options.data || {};
                const profile = {
                    id: uuid(),
                    email: normalized,
                    full_name: meta.full_name || normalized.split('@')[0],
                    role: meta.role === 'driver' ? 'driver' : 'traveler',
                    phone: meta.phone || null,
                    avatar_url: meta.avatar_url || null,
                    created_at: nowIso(),
                    updated_at: nowIso()
                };

                db.profiles.push(profile);
                db.credentials[normalized] = String(password);
                if (profile.role === 'driver') ensureDriverRow(db, profile.id, profile);
                db.sessionUserId = profile.id;
                saveDb(db);

                const session = buildSession(profile, 'email');
                return { data: { user: session.user, session }, error: null };
            },

            async signInWithOAuth({ provider, options = {} }) {
                const db = loadDb();
                let role = localStorage.getItem('pendingRole') || 'traveler';

                if (options.redirectTo) {
                    try {
                        const redirect = new URL(options.redirectTo);
                        role = redirect.searchParams.get('role') || role;
                    } catch (_) { /* ignore */ }
                }

                const account = role === 'driver'
                    ? DEMO_ACCOUNTS.find(a => a.role === 'driver')
                    : DEMO_ACCOUNTS.find(a => a.role === 'traveler');

                const profile = db.profiles.find(p => p.email === account.email)
                    || db.profiles.find(p => p.role === (role === 'driver' ? 'driver' : 'traveler'));

                if (!profile) {
                    return { data: null, error: { message: 'No hay cuenta demo disponible' } };
                }

                db.sessionUserId = profile.id;
                saveDb(db);

                const target = new URL('login.html?oauth=1&role=' + role, window.location.href).toString();
                window.location.href = target;
                return { data: { provider, url: target }, error: null };
            },

            async signOut() {
                const db = loadDb();
                db.sessionUserId = null;
                saveDb(db);
                return { error: null };
            },

            async updateUser({ password }) {
                const db = loadDb();
                const session = currentSession(db);
                if (!session) return { data: { user: null }, error: { message: 'Debes iniciar sesión' } };
                if (password) db.credentials[session.user.email.toLowerCase()] = String(password);
                saveDb(db);
                return { data: { user: session.user }, error: null };
            },

            async resetPasswordForEmail() {
                return { data: {}, error: null };
            }
        },

        from(table) {
            return new DemoQuery(table);
        },

        async rpc(name, params = {}) {
            const db = loadDb();
            const session = currentSession(db);
            if (!session) {
                return { data: null, error: { message: 'Debes iniciar sesión' } };
            }
            const user = db.profiles.find(p => p.id === session.user.id);
            if (!user) {
                return { data: null, error: { message: 'Perfil no encontrado' } };
            }
            const created = nowIso();

            if (name === 'complete_registration') {
                if (!['driver', 'traveler'].includes(params.p_role)) {
                    return { data: null, error: { message: 'Rol inválido' } };
                }
                if (user.role === 'traveler') user.role = params.p_role;
                user.updated_at = created;
                if (params.p_role === 'driver') ensureDriverRow(db, user.id, user);
                saveDb(db);
                return { data: null, error: null };
            }

            if (name === 'claim_travel') {
                if (user.role !== 'driver') {
                    return { data: null, error: { message: 'Solo los conductores pueden tomar viajes' } };
                }
                const travel = db.travels.find(t => t.id === params.p_travel_id);
                if (!travel) return { data: null, error: { message: 'Viaje no encontrado' } };
                if (travel.driver_id || travel.status !== 'scheduled') {
                    return { data: null, error: { message: 'El viaje ya tiene conductor o no está disponible' } };
                }
                ensureDriverRow(db, user.id, user);
                travel.driver_id = user.id;
                travel.updated_at = created;
                saveDb(db);
                return { data: travel, error: null };
            }

            if (name === 'book_seat') {
                const travel = db.travels.find(t => t.id === params.p_travel_id);
                if (!travel) return { data: null, error: { message: 'Viaje no encontrado' } };
                if (travel.status !== 'scheduled' || new Date(travel.departure_time) <= new Date()) {
                    return { data: null, error: { message: 'El viaje no está disponible' } };
                }
                const seat = db.seats.find(s => s.id === params.p_seat_id && s.travel_id === travel.id);
                if (!seat) return { data: null, error: { message: 'Asiento no encontrado' } };
                if (seat.status !== 'available') {
                    return { data: null, error: { message: 'El asiento ya no está disponible' } };
                }
                if (db.bookings.some(b => b.traveler_id === user.id && b.travel_id === travel.id && b.status !== 'cancelled')) {
                    return { data: null, error: { message: 'Ya tienes una reserva en este viaje' } };
                }

                const luggage = Boolean(params.p_luggage);
                const weight = params.p_weight == null ? null : Number(params.p_weight);
                if (luggage && (!weight || weight <= 0)) {
                    return { data: null, error: { message: 'Indica el peso estimado del equipaje' } };
                }

                const pickupOption = params.p_pickup_option || 'current';
                const pickupLat = params.p_pickup_lat == null ? null : Number(params.p_pickup_lat);
                const pickupLng = params.p_pickup_lng == null ? null : Number(params.p_pickup_lng);
                const pickupAddress = params.p_pickup_address || null;

                if (!['current', 'other'].includes(pickupOption)) {
                    return { data: null, error: { message: 'Opción de recogida inválida' } };
                }
                if (pickupLat == null || pickupLng == null) {
                    return { data: null, error: { message: 'Indica la ubicación de recogida' } };
                }

                seat.status = 'reserved';
                seat.traveler_id = user.id;
                seat.reserved_at = created;
                seat.luggage_confirmed = luggage;
                seat.estimated_weight_kg = luggage ? weight : null;
                seat.updated_at = created;

                const booking = {
                    id: uuid(),
                    travel_id: travel.id,
                    traveler_id: user.id,
                    seat_id: seat.id,
                    total_price: Number(seat.price) || 0,
                    status: 'confirmed',
                    payment_status: 'pending',
                    luggage_confirmed: luggage,
                    estimated_weight_kg: luggage ? weight : null,
                    pickup_option: pickupOption,
                    pickup_lat: pickupLat,
                    pickup_lng: pickupLng,
                    pickup_address: pickupAddress,
                    booking_reference: generateBookingReference(db),
                    created_at: created,
                    updated_at: created
                };
                db.bookings.push(booking);
                saveDb(db);
                return { data: booking, error: null };
            }

            if (name === 'start_travel') {
                if (user.role !== 'driver') {
                    return { data: null, error: { message: 'Solo los conductores pueden iniciar viajes' } };
                }
                const travel = db.travels.find(t => t.id === params.p_travel_id);
                if (!travel) return { data: null, error: { message: 'Viaje no encontrado' } };
                if (travel.driver_id !== user.id) {
                    return { data: null, error: { message: 'No eres el conductor de este viaje' } };
                }
                if (travel.status !== 'scheduled') {
                    return { data: null, error: { message: 'El viaje no está programado' } };
                }
                if (params.p_lat == null || params.p_lng == null) {
                    return { data: null, error: { message: 'La ubicación es obligatoria' } };
                }

                travel.status = 'in_progress';
                travel.started_at = created;
                travel.start_lat = Number(params.p_lat);
                travel.start_lng = Number(params.p_lng);
                travel.updated_at = created;
                saveDb(db);
                return { data: travel, error: null };
            }

            if (name === 'finish_travel') {
                if (user.role !== 'driver') {
                    return { data: null, error: { message: 'Solo los conductores pueden terminar viajes' } };
                }
                const travel = db.travels.find(t => t.id === params.p_travel_id);
                if (!travel) return { data: null, error: { message: 'Viaje no encontrado' } };
                if (travel.driver_id !== user.id) {
                    return { data: null, error: { message: 'No eres el conductor de este viaje' } };
                }
                if (travel.status !== 'in_progress') {
                    return { data: null, error: { message: 'El viaje no está en curso' } };
                }
                if (params.p_lat == null || params.p_lng == null) {
                    return { data: null, error: { message: 'La ubicación es obligatoria' } };
                }

                travel.status = 'completed';
                travel.finished_at = created;
                travel.finish_lat = Number(params.p_lat);
                travel.finish_lng = Number(params.p_lng);
                travel.updated_at = created;

                const driver = db.drivers.find(d => d.id === user.id);
                if (driver) {
                    driver.total_trips = (Number(driver.total_trips) || 0) + 1;
                    driver.updated_at = created;
                }

                saveDb(db);
                return { data: travel, error: null };
            }

            if (name === 'cancel_booking') {
                const booking = db.bookings.find(b => b.id === params.p_booking_id);
                if (!booking) return { data: null, error: { message: 'Reserva no encontrada' } };
                if (booking.traveler_id !== user.id && !['admin', 'secretary'].includes(user.role)) {
                    return { data: null, error: { message: 'No puedes cancelar esta reserva' } };
                }
                booking.status = 'cancelled';
                booking.updated_at = created;
                const seat = db.seats.find(s => s.id === booking.seat_id);
                if (seat) {
                    seat.status = 'available';
                    seat.traveler_id = null;
                    seat.reserved_at = null;
                    seat.luggage_confirmed = false;
                    seat.estimated_weight_kg = null;
                    seat.updated_at = created;
                }
                saveDb(db);
                return { data: null, error: null };
            }

            if (name === 'admin_set_role') {
                if (user.role !== 'admin') {
                    return { data: null, error: { message: 'Solo un administrador puede cambiar roles' } };
                }
                if (!['admin', 'secretary', 'driver', 'traveler'].includes(params.p_role)) {
                    return { data: null, error: { message: 'Rol inválido' } };
                }
                if (params.p_user_id === user.id && params.p_role !== 'admin') {
                    return { data: null, error: { message: 'No puedes quitarte tu propio rol de administrador' } };
                }
                const target = db.profiles.find(p => p.id === params.p_user_id);
                if (!target) return { data: null, error: { message: 'Usuario no encontrado' } };
                target.role = params.p_role;
                target.updated_at = created;
                if (params.p_role === 'driver') ensureDriverRow(db, target.id, target);
                saveDb(db);
                return { data: null, error: null };
            }

            return { data: null, error: { message: 'Función demo no soportada: ' + name } };
        }
    };
}

export function resetDemoData() {
    localStorage.removeItem(DB_KEY);
    ['user', 'session', 'userRole', 'pendingRole'].forEach(key => localStorage.removeItem(key));
    window.location.href = 'login.html?switch=1';
}
