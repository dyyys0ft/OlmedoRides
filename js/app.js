// OlmedoRides - Legacy shared utilities (las páginas usan js/olmedorides.js)
// Supabase Configuration
const SUPABASE_URL = (window.OLMEDORIDES_CONFIG && window.OLMEDORIDES_CONFIG.supabaseUrl) || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = (window.OLMEDORIDES_CONFIG && window.OLMEDORIDES_CONFIG.supabaseAnonKey) || 'your-anon-key';

// Initialize Supabase client
let supabase = null;

function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof supabase !== 'undefined') {
        supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

// Auth Helpers
async function getCurrentUser() {
    if (!supabase) initSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getProfile(userId = null) {
    if (!supabase) initSupabase();
    const user = userId || (await getCurrentUser());
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

async function signUp(email, password, fullName, role = 'traveler') {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, role }
        }
    });
    
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    if (!supabase) initSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Travels Helpers
async function getTravels(filters = {}) {
    if (!supabase) initSupabase();
    
    let query = supabase
        .from('travels')
        .select(`
            *,
            driver:drivers(id, profiles(full_name)),
            car:cars(id, brand, model, license_plate, total_seats),
            seats:seats(count)
        `)
        .order('departure_time', { ascending: true });
    
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.driver_id) query = query.eq('driver_id', filters.driver_id);
    if (filters.from_date) query = query.gte('departure_time', filters.from_date);
    if (filters.to_date) query = query.lte('departure_time', filters.to_date);
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,source_city.ilike.%${filters.search}%,destination_city.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getTravelById(id) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('travels')
        .select(`
            *,
            driver:drivers(id, license_number, profiles(full_name, phone)),
            car:cars(*),
            seats(*)
        `)
        .eq('id', id)
        .single();
    
    if (error) throw error;
    return data;
}

async function createTravel(travelData) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('travels')
        .insert(travelData)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateTravel(id, updates) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('travels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteTravel(id) {
    if (!supabase) initSupabase();
    
    const { error } = await supabase
        .from('travels')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
}

// Cars Helpers
async function getCars() {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_active', true)
        .order('brand', { ascending: true });
    
    if (error) throw error;
    return data;
}

async function createCar(carData) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('cars')
        .insert(carData)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateCar(id, updates) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// Drivers Helpers
async function getDrivers() {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('drivers')
        .select(`
            *,
            profiles(full_name, email, phone, avatar_url),
            car:cars(id, brand, model, license_plate)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

// Seats Helpers
async function getSeatsByTravel(travelId) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('seats')
        .select(`
            *,
            traveler:profiles(full_name, email, phone)
        `)
        .eq('travel_id', travelId)
        .order('seat_number', { ascending: true });
    
    if (error) throw error;
    return data;
}

async function reserveSeat(seatId, travelerId) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('seats')
        .update({
            status: 'reserved',
            traveler_id: travelerId,
            reserved_at: new Date().toISOString()
        })
        .eq('id', seatId)
        .eq('status', 'available')
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function releaseSeat(seatId) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('seats')
        .update({
            status: 'available',
            traveler_id: null,
            reserved_at: null
        })
        .eq('id', seatId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// Bookings Helpers
async function createBooking(bookingData) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function getBookingsByTraveler(travelerId) {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            travel:travels(
                *,
                source_city,
                destination_city,
                departure_time,
                arrival_time,
                driver:drivers(profiles(full_name, phone)),
                car:cars(brand, model, license_plate)
            ),
            seat:seats(seat_number)
        `)
        .eq('traveler_id', travelerId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function getAllBookings() {
    if (!supabase) initSupabase();
    
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            traveler:profiles(full_name, email, phone),
            travel:travels(
                *,
                source_city,
                destination_city,
                departure_time
            ),
            seat:seats(seat_number)
        `)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

// Utility Functions
function formatDate(dateString, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', { ...defaultOptions, ...options });
}

function formatDateOnly(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function showAlert(message, type = 'info', container = null) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : 
              type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' :
              type === 'warning' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>' :
              '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
        </svg>
        <span>${message}</span>
    `;
    
    const target = container || document.querySelector('.page-content') || document.body;
    target.insertBefore(alert, target.firstChild);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
    
    return alert;
}

function showLoading(element, show = true) {
    if (show) {
        element.disabled = true;
        element.dataset.originalText = element.innerHTML;
        element.innerHTML = '<span class="loading"></span> Cargando...';
    } else {
        element.disabled = false;
        element.innerHTML = element.dataset.originalText || element.innerHTML;
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Sidebar Toggle
function initSidebar() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99; display: none;';
    document.body.appendChild(overlay);
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.style.display = 'none';
        });
    }
}

// User Dropdown
function initUserDropdown() {
    const userBtn = document.querySelector('.user-btn');
    const dropdown = document.querySelector('.dropdown');
    
    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }
}

// Modal Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

function initModals() {
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) modal.classList.remove('show');
        });
    });
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        }
    });
}

// Form Helpers
function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            if (!Array.isArray(data[key])) data[key] = [data[key]];
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    return data;
}

function populateForm(form, data) {
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key];
            } else {
                input.value = data[key] || '';
            }
        }
    });
}

function clearForm(form) {
    form.reset();
    form.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
}

function showFieldError(form, fieldName, message) {
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
    if (input) input.style.borderColor = 'var(--danger)';
}

function clearFieldErrors(form) {
    form.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
    form.querySelectorAll('.input, .select, .textarea').forEach(el => el.style.borderColor = '');
}

// Role-based access
function hasRole(allowedRoles) {
    const userRole = localStorage.getItem('userRole');
    return allowedRoles.includes(userRole);
}

function requireAuth(allowedRoles = null) {
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    
    if (!user) {
        window.location.href = '/pages/login.html';
        return false;
    }
    
    if (allowedRoles && !allowedRoles.includes(role)) {
        window.location.href = '/pages/unauthorized.html';
        return false;
    }
    
    return true;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initUserDropdown();
    initModals();
    initSupabase();
});

// Export for use in other scripts
window.OlmedoRides = {
    supabase: () => supabase,
    getCurrentUser,
    getProfile,
    signUp,
    signIn,
    signOut,
    getTravels,
    getTravelById,
    createTravel,
    updateTravel,
    deleteTravel,
    getCars,
    createCar,
    updateCar,
    getDrivers,
    getSeatsByTravel,
    reserveSeat,
    releaseSeat,
    createBooking,
    getBookingsByTraveler,
    getAllBookings,
    formatDate,
    formatDateOnly,
    formatTime,
    formatCurrency,
    showAlert,
    showLoading,
    validateEmail,
    validatePhone,
    openModal,
    closeModal,
    serializeForm,
    populateForm,
    clearForm,
    showFieldError,
    clearFieldErrors,
    hasRole,
    requireAuth
};