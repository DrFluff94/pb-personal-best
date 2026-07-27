
const STORAGE_KEY = "pb-personal-best-data-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  tackle: [],
  boxes: [],
  catches: [],
  shopping: []
};

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
};

const screens = document.querySelectorAll(".screen");
const navItems = document.querySelectorAll(".nav-item");

function go(screen) {
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === screen));
  navItems.forEach(n => n.classList.toggle("active", n.dataset.go === screen));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => go(btn.dataset.go)));

const formDialog = document.getElementById("formDialog");
const dynamicForm = document.getElementById("dynamicForm");
const formFields = document.getElementById("formFields");
let activeForm = null;

const field = (label, name, type="text", value="", extra="") => `
  <div class="field">
    <label for="${name}">${label}</label>
    <input id="${name}" name="${name}" type="${type}" value="${value}" ${extra}>
  </div>`;

const selectField = (label, name, options) => `
  <div class="field">
    <label for="${name}">${label}</label>
    <select id="${name}" name="${name}">
      ${options.map(o => `<option value="${o}">${o}</option>`).join("")}
    </select>
  </div>`;

function openForm(type) {
  activeForm = type;
  const title = document.getElementById("formTitle");
  const eyebrow = document.getElementById("formEyebrow");
  eyebrow.textContent = "ADD NEW";

  if (type === "tackle") {
    title.textContent = "Tackle Item";
    const boxOptions = ["Unassigned", ...state.boxes.map(b => b.name)];
    formFields.innerHTML = `
      ${field("Item name", "name", "text", "", "required placeholder='Example: Strike King Spinnerbait'")}
      <div class="two-col">
        ${selectField("Category", "category", ["Lure","Hook","Line","Weight","Rod","Reel","Tool","Other"])}
        ${field("Quantity", "quantity", "number", "1", "min='1'")}
      </div>
      <div class="two-col">
        ${field("Brand", "brand", "text", "", "placeholder='Optional'")}
        ${field("Color / Size", "details", "text", "", "placeholder='Optional'")}
      </div>
      ${selectField("Stored in", "box", boxOptions)}
      ${field("Notes", "notes", "text", "", "placeholder='Optional'")}
    `;
  }

  if (type === "box") {
    title.textContent = "Tackle Box";
    formFields.innerHTML = `
      ${field("Box name", "name", "text", "", "required placeholder='Example: Crankbait Box'")}
      ${field("Location", "location", "text", "", "placeholder='Boat, garage, truck...'")}
      ${field("Notes", "notes", "text", "", "placeholder='Optional'")}
    `;
  }

  if (type === "catch") {
    title.textContent = "Catch";
    formFields.innerHTML = `
      ${field("Species", "species", "text", "", "required placeholder='Example: Largemouth Bass'")}
      <div class="two-col">
        ${field("Weight (lb)", "weight", "number", "", "step='0.01' min='0'")}
        ${field("Length (in)", "length", "number", "", "step='0.1' min='0'")}
      </div>
      ${field("Date", "date", "date", new Date().toISOString().slice(0,10), "required")}
      ${field("Location", "location", "text", "", "placeholder='Lake, river, pond...'")}
      ${field("Lure used", "lure", "text", "", "placeholder='Optional'")}
      ${field("Notes", "notes", "text", "", "placeholder='Weather, depth, pattern...'")}
    `;
  }

  if (type === "shopping") {
    title.textContent = "Shopping Item";
    formFields.innerHTML = `
      ${field("Item", "name", "text", "", "required placeholder='Example: Green pumpkin worms'")}
      <div class="two-col">
        ${field("Quantity", "quantity", "number", "1", "min='1'")}
        ${field("Estimated price", "price", "number", "", "step='0.01' min='0'")}
      </div>
      ${field("Store / Notes", "notes", "text", "", "placeholder='Optional'")}
    `;
  }

  formDialog.showModal();
}

document.querySelectorAll("[data-open-form]").forEach(btn => btn.addEventListener("click", () => openForm(btn.dataset.openForm)));
document.getElementById("closeDialog").addEventListener("click", () => formDialog.close());

dynamicForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(dynamicForm).entries());
  data.id = crypto.randomUUID();
  data.createdAt = Date.now();

  if (activeForm === "tackle") {
    data.quantity = Number(data.quantity || 1);
    state.tackle.unshift(data);
  }
  if (activeForm === "box") state.boxes.unshift(data);
  if (activeForm === "catch") {
    data.weight = data.weight ? Number(data.weight) : null;
    data.length = data.length ? Number(data.length) : null;
    state.catches.unshift(data);
  }
  if (activeForm === "shopping") {
    data.quantity = Number(data.quantity || 1);
    data.price = data.price ? Number(data.price) : null;
    data.done = false;
    state.shopping.unshift(data);
  }
  dynamicForm.reset();
  formDialog.close();
  save();
});

function deleteItem(collection, id) {
  state[collection] = state[collection].filter(item => item.id !== id);
  save();
}

function toggleShopping(id) {
  const item = state.shopping.find(i => i.id === id);
  if (item) item.done = !item.done;
  save();
}

function empty(container, text) {
  container.innerHTML = `<div class="empty-state"><p>${text}</p></div>`;
}

function renderTackle() {
  const q = document.getElementById("tackleSearch").value.toLowerCase();
  const items = state.tackle.filter(i => [i.name,i.category,i.brand,i.details,i.box].join(" ").toLowerCase().includes(q));
  const el = document.getElementById("tackleList");
  if (!items.length) return empty(el, q ? "No tackle matches your search." : "No tackle saved yet.");
  el.innerHTML = items.map(i => `
    <div class="item-card">
      <div class="item-icon">🎣</div>
      <div class="item-content">
        <p class="item-title">${escapeHtml(i.name)} <span class="item-meta">×${i.quantity}</span></p>
        <div class="item-meta">${escapeHtml([i.category, i.brand, i.details].filter(Boolean).join(" • "))}</div>
        <div class="item-meta">${i.box && i.box !== "Unassigned" ? `Stored in ${escapeHtml(i.box)}` : "No box assigned"}</div>
      </div>
      <div class="item-actions">
        <button class="mini-btn danger" onclick="deleteItem('tackle','${i.id}')">Delete</button>
      </div>
    </div>`).join("");
}

function renderBoxes() {
  const el = document.getElementById("boxList");
  if (!state.boxes.length) return empty(el, "No tackle boxes saved yet.");
  el.innerHTML = state.boxes.map(b => {
    const count = state.tackle.filter(t => t.box === b.name).length;
    return `
      <div class="item-card">
        <div class="item-icon">🧰</div>
        <div class="item-content">
          <p class="item-title">${escapeHtml(b.name)}</p>
          <div class="item-meta">${count} tackle item${count === 1 ? "" : "s"}${b.location ? ` • ${escapeHtml(b.location)}` : ""}</div>
          ${b.notes ? `<div class="item-meta">${escapeHtml(b.notes)}</div>` : ""}
        </div>
        <button class="mini-btn danger" onclick="deleteItem('boxes','${b.id}')">Delete</button>
      </div>`;
  }).join("");
}

function catchCard(c) {
  const measurements = [
    c.weight ? `${c.weight} lb` : "",
    c.length ? `${c.length} in` : ""
  ].filter(Boolean).join(" • ");
  return `
    <div class="item-card">
      <div class="item-icon">🏆</div>
      <div class="item-content">
        <p class="item-title">${escapeHtml(c.species)}</p>
        <div class="item-meta">${escapeHtml([measurements, c.location, c.date].filter(Boolean).join(" • "))}</div>
        ${c.lure ? `<div class="item-meta">Caught on ${escapeHtml(c.lure)}</div>` : ""}
      </div>
      <button class="mini-btn danger" onclick="deleteItem('catches','${c.id}')">Delete</button>
    </div>`;
}

function renderCatches() {
  const el = document.getElementById("catchList");
  if (!state.catches.length) return empty(el, "No catches logged yet.");
  el.innerHTML = state.catches.map(catchCard).join("");

  const recent = document.getElementById("recentCatches");
  if (!state.catches.length) {
    recent.className = "card-list empty-state";
    recent.innerHTML = "<p>No catches yet. Your next personal best starts here.</p>";
  } else {
    recent.className = "card-list";
    recent.innerHTML = state.catches.slice(0,2).map(catchCard).join("");
  }
}

function renderShopping() {
  const el = document.getElementById("shoppingList");
  if (!state.shopping.length) return empty(el, "Your shopping list is empty.");
  el.innerHTML = state.shopping.map(i => `
    <div class="item-card ${i.done ? "completed" : ""}">
      <input type="checkbox" ${i.done ? "checked" : ""} onchange="toggleShopping('${i.id}')">
      <div class="item-content">
        <p class="item-title">${escapeHtml(i.name)} <span class="item-meta">×${i.quantity}</span></p>
        <div class="item-meta">${i.price ? `$${i.price.toFixed(2)}` : ""}${i.notes ? `${i.price ? " • " : ""}${escapeHtml(i.notes)}` : ""}</div>
      </div>
      <button class="mini-btn danger" onclick="deleteItem('shopping','${i.id}')">Delete</button>
    </div>`).join("");
}

function renderStats() {
  document.getElementById("tackleCount").textContent = state.tackle.length;
  document.getElementById("catchCount").textContent = state.catches.length;
  document.getElementById("boxCount").textContent = state.boxes.length;
  document.getElementById("shoppingCount").textContent = state.shopping.filter(i => !i.done).length;
}

function renderAll() {
  renderStats();
  renderTackle();
  renderBoxes();
  renderCatches();
  renderShopping();
}

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

document.getElementById("tackleSearch").addEventListener("input", renderTackle);
document.getElementById("installHelpBtn").addEventListener("click", () => document.getElementById("helpDialog").showModal());
document.getElementById("closeHelp").addEventListener("click", () => document.getElementById("helpDialog").close());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
renderAll();
