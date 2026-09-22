const trips = [
  {
    id: 1, origin: "Riobamba", destination: "Quito", date: "2026-09-22",
    time: "18:30", driver: "Carlos M.", vehicle: "Chevrolet D-Max · ABC-1234",
    description: "Ruta Riobamba → Latacunga → Quito. Recogida y entrega puerta a puerta.",
    observations: "Máximo 3 pasajeros. Equipaje pequeño incluido.",
    expense: 31.50,
    seats: [
      {id:"A1", price:8.50, status:"available"}, {id:"A2", price:8.50, status:"available"},
      {id:"B1", price:9.00, status:"occupied"}, {id:"B2", price:9.50, status:"available"},
      {id:"C1", price:10.00, status:"available"}, {id:"C2", price:11.00, status:"occupied"}
    ]
  },
  {
    id: 2, origin: "Riobamba", destination: "Ambato", date: "2026-09-23",
    time: "07:15", driver: "María P.", vehicle: "Kia Sportage · PBC-4567",
    description: "Salida desde el domicilio del pasajero y llegada al punto solicitado.",
    observations: "Se acepta una maleta por pasajero.",
    expense: 22.00,
    seats: [
      {id:"A1", price:6.00, status:"available"}, {id:"A2", price:6.00, status:"available"},
      {id:"B1", price:6.50, status:"available"}, {id:"B2", price:7.00, status:"available"},
      {id:"C1", price:7.50, status:"occupied"}, {id:"C2", price:8.00, status:"available"}
    ]
  },
  {
    id: 3, origin: "Quito", destination: "Riobamba", date: "2026-09-24",
    time: "16:00", driver: "Luis G.", vehicle: "Toyota Innova · GHI-8901",
    description: "Regreso directo con paradas previamente acordadas.",
    observations: "No fumar dentro del vehículo.",
    expense: 34.00,
    seats: [
      {id:"A1", price:9.50, status:"available"}, {id:"A2", price:9.50, status:"occupied"},
      {id:"B1", price:10.00, status:"available"}, {id:"B2", price:10.50, status:"available"},
      {id:"C1", price:11.00, status:"available"}, {id:"C2", price:12.00, status:"occupied"}
    ]
  }
];

const $ = s => document.querySelector(s);
const tripList = $("#tripList");
const modal = $("#tripModal");
const modalContent = $("#modalContent");
let selectedSeat = null;
let activeTrip = null;

function renderTrips(data = trips) {
  if (!data.length) {
    tripList.innerHTML = `<div class="empty">No encontramos viajes con esos criterios.</div>`;
    return;
  }
  tripList.innerHTML = data.map(trip => {
    const available = trip.seats.filter(s => s.status === "available").length;
    const lowest = Math.min(...trip.seats.map(s => s.price));
    return `
      <article class="trip-card">
        <div class="trip-top">
          <div><h3>${trip.origin} → ${trip.destination}</h3><div class="trip-meta">${trip.date} · ${trip.time}</div></div>
          <span class="badge">${available} asientos</span>
        </div>
        <div class="trip-route">
          <div class="route-dots"><i></i><b></b><i></i></div>
          <div class="route-text">
            <div><small>ORIGEN</small><strong>${trip.origin}</strong></div>
            <div><small>DESTINO</small><strong>${trip.destination}</strong></div>
          </div>
        </div>
        <div class="trip-info">
          <div class="info-box"><small>CONDUCTOR</small><strong>${trip.driver}</strong></div>
          <div class="info-box"><small>VEHÍCULO</small><strong>${trip.vehicle}</strong></div>
          <div class="info-box"><small>GASTO ESTIMADO</small><strong>$${trip.expense.toFixed(2)}</strong></div>
          <div class="info-box"><small>DESDE</small><strong>$${lowest.toFixed(2)} / asiento</strong></div>
        </div>
        <div class="trip-bottom">
          <div class="seats-left">${trip.description}</div>
          <button class="btn btn-primary" onclick="openTrip(${trip.id})">Ver viaje</button>
        </div>
      </article>`;
  }).join("");
}

function openTrip(id) {
  activeTrip = trips.find(t => t.id === id);
  selectedSeat = null;
  modalContent.innerHTML = `
    <span class="eyebrow">DETALLE DEL VIAJE</span>
    <h2>${activeTrip.origin} → ${activeTrip.destination}</h2>
    <p class="trip-meta">${activeTrip.date} · ${activeTrip.time} · ${activeTrip.driver}</p>
    <div class="trip-info">
      <div class="info-box"><small>VEHÍCULO</small><strong>${activeTrip.vehicle}</strong></div>
      <div class="info-box"><small>GASTO ESTIMADO</small><strong>$${activeTrip.expense.toFixed(2)}</strong></div>
      <div class="info-box"><small>RUTA</small><strong>${activeTrip.description}</strong></div>
      <div class="info-box"><small>OBSERVACIONES</small><strong>${activeTrip.observations}</strong></div>
    </div>
    <h3>Selecciona tu asiento</h3>
    <div class="seat-map">
      ${activeTrip.seats.map(seat => `
        <button class="seat ${seat.status}" ${seat.status === "occupied" ? "disabled" : ""}
          onclick="${seat.status === "available" ? `selectSeat('${seat.id}')` : ""}">
          <strong>${seat.id}</strong><small>${seat.status === "occupied" ? "Ocupado" : "$" + seat.price.toFixed(2)}</small>
        </button>`).join("")}
    </div>
    <div id="bookingArea"></div>`;
  modal.classList.remove("hidden");
}
window.openTrip = openTrip;

function selectSeat(id) {
  selectedSeat = activeTrip.seats.find(s => s.id === id);
  document.querySelectorAll(".seat.available").forEach(el => el.classList.remove("selected"));
  [...document.querySelectorAll(".seat.available")].find(el => el.querySelector("strong").textContent === id)?.classList.add("selected");
  $("#bookingArea").innerHTML = `
    <div class="booking-summary"><strong>Asiento ${selectedSeat.id}</strong> · Precio: <strong>$${selectedSeat.price.toFixed(2)}</strong></div>
    <div class="booking-form">
      <label>Nombre completo<input id="passengerName" placeholder="Ej. Juan Pérez"></label>
      <label>Teléfono<input id="passengerPhone" placeholder="Ej. 0999999999"></label>
    </div>
    <button class="btn btn-primary full" style="margin-top:14px" onclick="reserveSeat()">Confirmar reserva</button>`;
}
window.selectSeat = selectSeat;

function reserveSeat() {
  const name = $("#passengerName")?.value.trim();
  const phone = $("#passengerPhone")?.value.trim();
  if (!name || !phone || !selectedSeat) {
    showToast("Completa tus datos y selecciona un asiento.");
    return;
  }
  selectedSeat.status = "occupied";
  showToast(`Reserva confirmada: ${activeTrip.origin} → ${activeTrip.destination}, asiento ${selectedSeat.id}.`);
  modal.classList.add("hidden");
  renderTrips();
}
window.reserveSeat = reserveSeat;

function closeModal() { modal.classList.add("hidden"); }
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeModal));
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

function searchTrips() {
  const origin = $("#filterOrigin").value.trim().toLowerCase();
  const destination = $("#filterDestination").value.trim().toLowerCase();
  const date = $("#filterDate").value;
  const result = trips.filter(t =>
    (!origin || t.origin.toLowerCase().includes(origin)) &&
    (!destination || t.destination.toLowerCase().includes(destination)) &&
    (!date || t.date === date)
  );
  renderTrips(result);
}
$("#searchTrips").addEventListener("click", searchTrips);
["filterOrigin","filterDestination","filterDate"].forEach(id => {
  $("#" + id).addEventListener("keydown", e => { if (e.key === "Enter") searchTrips(); });
});

function scrollToTrips() { document.querySelector("#viajes").scrollIntoView({behavior:"smooth"}); }
window.scrollToTrips = scrollToTrips;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function openCreateTrip() {
  modalContent.innerHTML = `
    <span class="eyebrow">PUBLICAR</span>
    <h2>Crear un viaje</h2>
    <p class="trip-meta">Demo del flujo para conductores/administradores.</p>
    <div class="booking-form">
      <label>Origen<input placeholder="Ej. Riobamba"></label>
      <label>Destino<input placeholder="Ej. Quito"></label>
      <label>Fecha<input type="date"></label>
      <label>Hora<input type="time"></label>
      <label>Conductor<input placeholder="Nombre del conductor"></label>
      <label>Vehículo<input placeholder="Marca · modelo · placa"></label>
      <label>Descripción de ruta<input placeholder="Ruta, paradas, recogida..."></label>
      <label>Gasto estimado<input type="number" placeholder="0.00"></label>
    </div>
    <h3>Asientos y precios</h3>
    <p class="trip-meta">En una versión conectada, aquí se configuraría la cantidad de asientos y el precio individual de cada uno.</p>
    <button class="btn btn-primary full" onclick="showToast('Viaje creado en modo demo'); closeModal()">Guardar viaje</button>`;
  modal.classList.remove("hidden");
}
$("#openCreateTrip").addEventListener("click", openCreateTrip);
$("#openCreateTrip2").addEventListener("click", openCreateTrip);

renderTrips();
