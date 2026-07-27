
const STORAGE_KEY = "pb-personal-best-data-v2";
const OLD_KEY = "pb-personal-best-data-v1";
let saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
if (!saved) {
  const old = JSON.parse(localStorage.getItem(OLD_KEY));
  saved = old ? {...old, rods:[], reels:[], rigs:[]} : null;
}
const state = saved || { tackle:[], boxes:[], catches:[], shopping:[], rods:[], reels:[], rigs:[] };
["tackle","boxes","catches","shopping","rods","reels","rigs"].forEach(k => state[k] ||= []);

let activeForm = null;
let editingId = null;

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
};

function go(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === screen));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.go === screen));
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

const formDialog = document.getElementById("formDialog");
const dynamicForm = document.getElementById("dynamicForm");
const formFields = document.getElementById("formFields");

const field = (label,name,type="text",value="",extra="") => `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeAttr(value)}" ${extra}></div>`;
const textarea = (label,name,value="") => `<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
const selectField = (label,name,options,value="") => `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map(o => {
  const v = typeof o === "string" ? o : o.value;
  const t = typeof o === "string" ? o : o.text;
  return `<option value="${escapeAttr(v)}" ${String(v)===String(value)?"selected":""}>${escapeHtml(t)}</option>`;
}).join("")}</select></div>`;

function findItem(type,id) {
  const map = {rod:"rods",reel:"reels",rig:"rigs",catch:"catches",box:"boxes",shopping:"shopping",tackle:"tackle"};
  return state[map[type]].find(x => x.id === id);
}

function openForm(type,id=null) {
  activeForm = type;
  editingId = id;
  const item = id ? findItem(type,id) : {};
  document.getElementById("formEyebrow").textContent = id ? "EDIT" : "ADD NEW";
  const titles = {tackle:"Tackle Item",box:"Tackle Box",catch:"Catch",shopping:"Shopping Item",rod:"Rod",reel:"Reel",rig:"Current Rig"};
  document.getElementById("formTitle").textContent = titles[type];

  if (type === "tackle") {
    const boxes = ["Unassigned", ...state.boxes.map(b => b.name)];
    formFields.innerHTML = `
      ${field("Item name","name","text",item.name||"","required")}
      <div class="two-col">${selectField("Category","category",["Lure","Hook","Line","Weight","Terminal Tackle","Tool","Other"],item.category||"Lure")}${field("Quantity","quantity","number",item.quantity ?? 1,"min='0'")}</div>
      <div class="two-col">${field("Brand","brand","text",item.brand||"")}${field("Color / Size","details","text",item.details||"")}</div>
      ${selectField("Stored in","box",boxes,item.box||"Unassigned")}
      ${textarea("Notes","notes",item.notes||"")}
      <p class="muted">Set quantity to 0 if the lure or hook was lost, or delete it completely.</p>`;
  }
  if (type === "rod") {
    formFields.innerHTML = `
      ${field("Rod name","name","text",item.name||"","required placeholder='Example: Dobyns Fury 734C'")}
      <div class="two-col">${field("Brand","brand","text",item.brand||"")}${field("Model","model","text",item.model||"")}</div>
      <div class="two-col">${field("Length","length","text",item.length||"","placeholder=\"7'3&quot;\"")}${selectField("Power","power",["Ultra Light","Light","Medium Light","Medium","Medium Heavy","Heavy","Extra Heavy"],item.power||"Medium Heavy")}</div>
      ${selectField("Action","action",["Slow","Moderate","Moderate Fast","Fast","Extra Fast"],item.action||"Fast")}
      ${field("Best techniques","techniques","text",item.techniques||"","placeholder='Jigs, spinnerbaits, Texas rigs'")}
      ${textarea("Notes","notes",item.notes||"")}`;
  }
  if (type === "reel") {
    formFields.innerHTML = `
      ${field("Reel name","name","text",item.name||"","required placeholder='Example: Shimano Curado DC'")}
      <div class="two-col">${field("Brand","brand","text",item.brand||"")}${field("Model","model","text",item.model||"")}</div>
      <div class="two-col">${selectField("Type","reelType",["Baitcaster","Spinning","Spincast","Fly"],item.reelType||"Baitcaster")}${field("Gear ratio","gearRatio","text",item.gearRatio||"","placeholder='7.4:1'")}</div>
      ${field("Retrieve","retrieve","text",item.retrieve||"","placeholder='Right or Left'")}
      ${textarea("Notes","notes",item.notes||"")}`;
  }
  if (type === "rig") {
    const rods = [{value:"",text:"Choose rod"},...state.rods.map(r=>({value:r.id,text:r.name}))];
    const reels = [{value:"",text:"Choose reel"},...state.reels.map(r=>({value:r.id,text:r.name}))];
    const tackle = [{value:"",text:"No lure tied on"},...state.tackle.map(t=>({value:t.id,text:`${t.name} (${t.quantity})`}))];
    formFields.innerHTML = `
      ${field("Rig name","name","text",item.name||"","required placeholder='Example: Spinnerbait Setup'")}
      ${selectField("Rod","rodId",rods,item.rodId||"")}
      ${selectField("Reel","reelId",reels,item.reelId||"")}
      <div class="two-col">${field("Line brand / type","line","text",item.line||"","placeholder='Seaguar fluorocarbon'")}${field("Line strength","lineStrength","text",item.lineStrength||"","placeholder='15 lb'")}</div>
      ${selectField("Tied-on lure","tackleId",tackle,item.tackleId||"")}
      ${field("Technique","technique","text",item.technique||"","placeholder='Spinnerbait, jig, finesse...'")}
      ${textarea("Notes","notes",item.notes||"")}`;
  }
  if (type === "box") {
    formFields.innerHTML = `${field("Box name","name","text",item.name||"","required")}${field("Location","location","text",item.location||"")}${textarea("Notes","notes",item.notes||"")}`;
  }
  if (type === "catch") {
    const rigs = [{value:"",text:"No rig selected"},...state.rigs.map(r=>({value:r.id,text:r.name}))];
    formFields.innerHTML = `
      ${field("Species","species","text",item.species||"","required")}
      <div class="two-col">${field("Weight (lb)","weight","number",item.weight??"","step='0.01' min='0'")}${field("Length (in)","length","number",item.length??"","step='0.1' min='0'")}</div>
      ${field("Date","date","date",item.date||new Date().toISOString().slice(0,10),"required")}
      ${field("Location","location","text",item.location||"")}
      ${selectField("Rig used","rigId",rigs,item.rigId||"")}
      ${field("Lure used","lure","text",item.lure||"")}
      ${textarea("Notes","notes",item.notes||"")}`;
  }
  if (type === "shopping") {
    formFields.innerHTML = `${field("Item","name","text",item.name||"","required")}<div class="two-col">${field("Quantity","quantity","number",item.quantity??1,"min='1'")}${field("Estimated price","price","number",item.price??"","step='0.01' min='0'")}</div>${textarea("Store / Notes","notes",item.notes||"")}`;
  }
  formDialog.showModal();
}

document.querySelectorAll("[data-open-form]").forEach(b => b.addEventListener("click",()=>openForm(b.dataset.openForm)));
document.getElementById("closeDialog").addEventListener("click",()=>formDialog.close());

dynamicForm.addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(dynamicForm).entries());
  const map = {tackle:"tackle",box:"boxes",catch:"catches",shopping:"shopping",rod:"rods",reel:"reels",rig:"rigs"};
  const key = map[activeForm];

  if (["tackle","shopping"].includes(activeForm)) data.quantity = Number(data.quantity||0);
  if (activeForm==="shopping") {
    data.price = data.price ? Number(data.price) : null;
    data.done = editingId ? (findItem("shopping",editingId)?.done || false) : false;
  }
  if (activeForm==="catch") {
    data.weight = data.weight ? Number(data.weight) : null;
    data.length = data.length ? Number(data.length) : null;
  }

  if (editingId) {
    const idx = state[key].findIndex(x=>x.id===editingId);
    state[key][idx] = {...state[key][idx],...data,id:editingId,updatedAt:Date.now()};
  } else {
    state[key].unshift({...data,id:crypto.randomUUID(),createdAt:Date.now()});
  }
  formDialog.close();
  save();
});

function editItem(type,id){ openForm(type,id); }
function deleteItem(collection,id){
  if (!confirm("Delete this item?")) return;
  state[collection] = state[collection].filter(x=>x.id!==id);
  if (collection==="rods") state.rigs.forEach(r=>{if(r.rodId===id) r.rodId="";});
  if (collection==="reels") state.rigs.forEach(r=>{if(r.reelId===id) r.reelId="";});
  if (collection==="tackle") state.rigs.forEach(r=>{if(r.tackleId===id) r.tackleId="";});
  save();
}
function toggleShopping(id){ const x=state.shopping.find(i=>i.id===id); if(x)x.done=!x.done; save(); }
function empty(el,text){ el.innerHTML=`<div class="empty-state"><p>${text}</p></div>`; }
function actions(type,collection,id){ return `<div class="item-actions"><button class="mini-btn" onclick="editItem('${type}','${id}')">Edit</button><button class="mini-btn danger" onclick="deleteItem('${collection}','${id}')">Delete</button></div>`; }

function renderTackle(){
  const q=document.getElementById("tackleSearch").value.toLowerCase();
  const items=state.tackle.filter(i=>Object.values(i).join(" ").toLowerCase().includes(q));
  const el=document.getElementById("tackleList");
  if(!items.length)return empty(el,q?"No matches.":"No tackle saved yet.");
  el.innerHTML=items.map(i=>`<div class="item-card"><div class="item-icon">🎣</div><div class="item-content"><p class="item-title">${escapeHtml(i.name)} <span class="item-meta">×${i.quantity}</span></p><div class="item-meta">${escapeHtml([i.category,i.brand,i.details].filter(Boolean).join(" • "))}</div><div class="item-meta">${i.box&&i.box!=="Unassigned"?"Stored in "+escapeHtml(i.box):"No box assigned"}</div>${i.quantity===0?`<span class="rig-badge warning">Out / Lost</span>`:""}</div>${actions("tackle","tackle",i.id)}</div>`).join("");
}

function renderRods(){
  const el=document.getElementById("rodList");
  if(!state.rods.length)return empty(el,"No rods saved yet.");
  el.innerHTML=state.rods.map(r=>`<div class="item-card"><div class="item-icon">📏</div><div class="item-content"><p class="item-title">${escapeHtml(r.name)}</p><div class="item-meta">${escapeHtml([r.length,r.power,r.action].filter(Boolean).join(" • "))}</div><div class="item-meta">${escapeHtml(r.techniques||"")}</div></div>${actions("rod","rods",r.id)}</div>`).join("");
}
function renderReels(){
  const el=document.getElementById("reelList");
  if(!state.reels.length)return empty(el,"No reels saved yet.");
  el.innerHTML=state.reels.map(r=>`<div class="item-card"><div class="item-icon">⚙️</div><div class="item-content"><p class="item-title">${escapeHtml(r.name)}</p><div class="item-meta">${escapeHtml([r.reelType,r.gearRatio,r.retrieve].filter(Boolean).join(" • "))}</div></div>${actions("reel","reels",r.id)}</div>`).join("");
}
function nameBy(list,id){ return list.find(x=>x.id===id)?.name || ""; }
function rigCard(r){
  const rod=nameBy(state.rods,r.rodId), reel=nameBy(state.reels,r.reelId), lure=nameBy(state.tackle,r.tackleId);
  return `<div class="item-card"><div class="item-icon">🪝</div><div class="item-content"><p class="item-title">${escapeHtml(r.name)}</p><div class="item-meta">${escapeHtml([rod,reel].filter(Boolean).join(" + ")||"Rod/reel not assigned")}</div><div class="item-meta">${escapeHtml([r.lineStrength,r.line,r.technique].filter(Boolean).join(" • "))}</div>${lure?`<span class="rig-badge">Tied on: ${escapeHtml(lure)}</span>`:`<span class="rig-badge warning">No lure tied on</span>`}</div>${actions("rig","rigs",r.id)}</div>`;
}
function renderRigs(){
  const el=document.getElementById("rigList");
  if(!state.rigs.length)empty(el,"No current rigs built yet."); else el.innerHTML=state.rigs.map(rigCard).join("");
  const recent=document.getElementById("recentRigs");
  if(!state.rigs.length)empty(recent,"Build your first rod-and-reel setup."); else recent.innerHTML=state.rigs.slice(0,2).map(rigCard).join("");
}
function renderBoxes(){
  const el=document.getElementById("boxList");
  if(!state.boxes.length)return empty(el,"No tackle boxes saved yet.");
  el.innerHTML=state.boxes.map(b=>`<div class="item-card"><div class="item-icon">🧰</div><div class="item-content"><p class="item-title">${escapeHtml(b.name)}</p><div class="item-meta">${state.tackle.filter(t=>t.box===b.name).length} tackle items${b.location?" • "+escapeHtml(b.location):""}</div></div>${actions("box","boxes",b.id)}</div>`).join("");
}
function renderCatches(){
  const el=document.getElementById("catchList");
  if(!state.catches.length)return empty(el,"No catches logged yet.");
  el.innerHTML=state.catches.map(c=>`<div class="item-card"><div class="item-icon">🏆</div><div class="item-content"><p class="item-title">${escapeHtml(c.species)}</p><div class="item-meta">${escapeHtml([[c.weight?c.weight+" lb":"",c.length?c.length+" in":""].filter(Boolean).join(" • "),c.location,c.date].filter(Boolean).join(" • "))}</div>${c.rigId?`<div class="item-meta">Rig: ${escapeHtml(nameBy(state.rigs,c.rigId)||"Deleted rig")}</div>`:""}</div>${actions("catch","catches",c.id)}</div>`).join("");
}
function renderShopping(){
  const el=document.getElementById("shoppingList");
  if(!state.shopping.length)return empty(el,"Your shopping list is empty.");
  el.innerHTML=state.shopping.map(i=>`<div class="item-card ${i.done?"completed":""}"><input type="checkbox" ${i.done?"checked":""} onchange="toggleShopping('${i.id}')"><div class="item-content"><p class="item-title">${escapeHtml(i.name)} ×${i.quantity}</p><div class="item-meta">${i.price?"$"+i.price.toFixed(2):""}${i.notes?(i.price?" • ":"")+escapeHtml(i.notes):""}</div></div>${actions("shopping","shopping",i.id)}</div>`).join("");
}
function renderStats(){
  document.getElementById("tackleCount").textContent=state.tackle.length;
  document.getElementById("rodCount").textContent=state.rods.length;
  document.getElementById("rigCount").textContent=state.rigs.length;
  document.getElementById("catchCount").textContent=state.catches.length;
}
function renderAll(){renderStats();renderTackle();renderRods();renderReels();renderRigs();renderBoxes();renderCatches();renderShopping();}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function escapeAttr(v=""){return escapeHtml(v);}

document.getElementById("tackleSearch").addEventListener("input",renderTackle);
document.querySelectorAll("[data-equipment-tab]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("[data-equipment-tab]").forEach(x=>x.classList.toggle("active",x===b));
  document.getElementById("rodList").classList.toggle("hidden",b.dataset.equipmentTab!=="rods");
  document.getElementById("reelList").classList.toggle("hidden",b.dataset.equipmentTab!=="reels");
}));
document.getElementById("installHelpBtn").addEventListener("click",()=>document.getElementById("helpDialog").showModal());
document.getElementById("closeHelp").addEventListener("click",()=>document.getElementById("helpDialog").close());

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
renderAll();
