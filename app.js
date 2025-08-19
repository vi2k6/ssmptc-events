const $ = (q)=> document.querySelector(q);
const $$ = (q)=> Array.from(document.querySelectorAll(q));
let token = null;
let role = null;
let selectedEventId = null;
let regProgramId = null;
let filtersOpen = false;

function fmt(dt){
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

function showError(containerId, message) {
  const container = $(containerId);
  container.innerHTML = `<p class="error-text text-sm">${message}</p>`;
  setTimeout(() => {
    if (containerId === '#home-sections') loadHome();
    else if (containerId === '#myregs-list') fetchMyRegs();
    else if (containerId === '#ev-list') refreshEvents();
    else if (containerId === '#prg-list') refreshPrograms();
    else if (containerId === '#reg-list') refreshRegs();
  }, 2000);
}

// Filter toggle functionality
function toggleFilters() {
  filtersOpen = !filtersOpen;
  const content = $('#filter-content');
  const arrow = $('#filter-arrow');
  
  if (filtersOpen) {
    content.classList.add('open');
    arrow.style.transform = 'rotate(180deg)';
  } else {
    content.classList.remove('open');
    arrow.style.transform = 'rotate(0deg)';
  }
}

async function loadHome(){
  $("#home-sections").innerHTML = "";
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    renderSection('Present Events', data.present);
    renderSection('Upcoming Events', data.upcoming);
    renderSection('Past Events', data.past);
  } catch (error) {
    showError('#home-sections', 'Failed to load events');
  }
}

function renderSection(title, events){
  const cont = document.createElement('div');
  cont.innerHTML = `<h2 class="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">${title}</h2>`;
  const grid = document.createElement('div');
  grid.className = 'grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3';
  events.forEach(ev=> grid.appendChild(eventCard(ev)));
  cont.appendChild(grid);
  $("#home-sections").appendChild(cont);
}

function eventCard(ev){
  const el = document.createElement('div');
  el.className = 'glass rounded-xl overflow-hidden hover:border-green-500 transition-all duration-300';
  el.innerHTML = `
    <img src="${ev.image || 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg'}" class="w-full h-40 lg:h-48 object-cover" alt="event">
    <div class="p-4 lg:p-6">
      <h3 class="font-bold text-lg lg:text-xl mb-2">${ev.title}</h3>
      <p class="text-sm text-gray-300 mb-3 line-clamp-3">${ev.description || ''}</p>
      <p class="text-xs text-gray-400 mb-4">From <span style="color: var(--primary-green)" class="font-medium">${fmt(ev.startTime)}</span> to <span style="color: var(--primary-green)" class="font-medium">${fmt(ev.endTime)}</span></p>
      <button class="btn-green w-full py-2 rounded-lg font-medium">View Details</button>
    </div>
  `;
  el.querySelector('button').addEventListener('click', ()=> openEvent(ev.id));
  return el;
}

async function openEvent(id){
  try {
    const res = await fetch(`/api/events/${id}`);
    if(!res.ok) {
      showError('#home-sections', 'Event not found');
      return;
    }
    const { event, programs } = await res.json();
    window.scrollTo({top:0, behavior:'smooth'});
    $("#home-sections").innerHTML = `
      <div class="glass rounded-xl p-4 lg:p-6">
        <button id="back-home" class="btn px-4 py-2 rounded-lg mb-4 lg:mb-6">← Back</button>
        <div class="grid lg:grid-cols-3 gap-4 lg:gap-6">
          <div class="lg:col-span-1">
            <img src="${event.image || 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg'}" class="w-full rounded-xl object-cover h-48 lg:h-64">
          </div>
          <div class="lg:col-span-2">
            <h2 class="text-2xl lg:text-3xl font-bold mb-3">${event.title}</h2>
            <p class="text-gray-300 mb-4">${event.description || ''}</p>
            <p class="text-sm">From <span style="color: var(--primary-green)" class="font-medium">${fmt(event.startTime)}</span> to <span style="color: var(--primary-green)" class="font-medium">${fmt(event.endTime)}</span></p>
          </div>
        </div>
      </div>
      <div class="mt-6 lg:mt-8 space-y-4 lg:space-y-6" id="programs-list"></div>
    `;
    $("#back-home").addEventListener('click', loadHome);
    const list = $("#programs-list");
    programs.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'glass rounded-xl p-4 lg:p-6';
      card.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <h3 class="font-semibold text-lg">${p.title}</h3>
              <span class="badge px-3 py-1 rounded-lg text-xs font-medium">${p.type}</span>
            </div>
            <p class="text-sm text-gray-300 mb-3">${p.description || ''}</p>
            <div class="space-y-1 text-xs text-gray-400">
              <p>Time: <span style="color: var(--primary-green)">${fmt(p.time)}</span></p>
              <p>Registration: <span style="color: var(--primary-green)">${fmt(p.regStart)}</span> to <span style="color: var(--primary-green)">${fmt(p.regEnd)}</span></p>
              <p>Departments: <span style="color: var(--primary-green)">${p.departments.join(', ')}</span></p>
            </div>
          </div>
          <button class="btn-green px-6 py-3 rounded-lg font-medium w-full lg:w-auto">Register</button>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-700">
          <p class="text-xs text-gray-400 italic">For canceling the registration contact the admin</p>
        </div>
      `;
      card.querySelector('button').addEventListener('click', ()=> openRegister(p.id));
      list.appendChild(card);
    });
  } catch (error) {
    showError('#home-sections', 'Failed to load event details');
  }
}

function show(section){
  // sections: home (filter-section+home-sections), myregs-section, login-section
  $("#filter-section").classList.toggle('hidden', section!=='home');
  $("#home-sections").classList.toggle('hidden', section!=='home');
  $("#myregs-section").classList.toggle('hidden', section!=='myregs');
  $("#login-section").classList.toggle('hidden', section!=='login');
}

async function applyFilters(){
  const q = $("#search-input").value.trim();
  const department = $("#filter-dept").value;
  const semester = $("#filter-sem").value;
  const type = $("#filter-type").value;
  const url = new URL('/api/search', window.location.origin);
  if(q) url.searchParams.set('q', q);
  if(department) url.searchParams.set('department', department);
  if(semester) url.searchParams.set('semester', semester);
  if(type) url.searchParams.set('type', type);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    // Render filtered results
    $("#home-sections").innerHTML = '';
    if(!data.length){
      $("#home-sections").innerHTML = '<p class="text-gray-300 text-center py-8">No results found.</p>';
      return;
    }
    data.forEach(ev=>{
      const wrap = document.createElement('div');
      wrap.innerHTML = `<h2 class="text-xl lg:text-2xl font-bold mb-4">${ev.title}</h2>`;
      const grid = document.createElement('div');
      grid.className = 'grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3';
      grid.appendChild(eventCard(ev));
      wrap.appendChild(grid);
      $("#home-sections").appendChild(wrap);
    });
  } catch (error) {
    showError('#home-sections', 'Failed to search events');
  }
}

function openRegister(programId){
  regProgramId = programId;
  $("#reg-msg").textContent = '';
  $("#reg-msg").className = 'text-sm';
  $("#reg-name").value=''; $("#reg-roll").value=''; $("#reg-sem").value=''; $("#reg-dept").value='';
  $("#reg-modal").classList.remove('hidden');
  $("#reg-modal").classList.add('flex');
}

function closeRegister(){
  $("#reg-modal").classList.add('hidden');
  $("#reg-modal").classList.remove('flex');
}

async function submitRegister(){
  const payload = {
    programId: regProgramId,
    name: $("#reg-name").value.trim(),
    rollNo: $("#reg-roll").value.trim(),
    semester: $("#reg-sem").value,
    department: $("#reg-dept").value.trim().toUpperCase()
  };
  if(!payload.name || !payload.rollNo || !payload.semester || !payload.department){
    $("#reg-msg").textContent = 'Please fill all fields.';
    $("#reg-msg").className = 'text-sm error-text';
    return;
  }
  
  try {
    const res = await fetch('/api/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok){ 
      $("#reg-msg").textContent = data.error || 'Registration failed';
      $("#reg-msg").className = 'text-sm error-text';
      return;
    }
    $("#reg-msg").textContent = 'Registration Successful!';
    $("#reg-msg").className = 'text-sm success-text';
    setTimeout(() => {
      closeRegister();
    }, 2000);
  } catch (error) {
    $("#reg-msg").textContent = 'Registration failed';
    $("#reg-msg").className = 'text-sm error-text';
  }
}

async function fetchMyRegs(){
  const roll = $("#myregs-roll").value.trim();
  if(!roll){ 
    showError('#myregs-list', 'Enter Roll No');
    return;
  }
  
  try {
    const res = await fetch('/api/my-registrations?rollNo='+encodeURIComponent(roll));
    const items = await res.json();
    const list = $("#myregs-list");
    list.innerHTML = '';
    if(!items.length){
      list.innerHTML = `<p class="text-gray-300 text-center py-8">No programs registered yet</p>`; 
      return;
    }
    items.forEach(r=>{
      const card = document.createElement('div');
      card.className = 'glass rounded-xl p-4 lg:p-6';
      card.innerHTML = `
        <h4 class="font-semibold text-lg mb-2">${r.program?.title || 'Program'}</h4>
        <p class="text-sm text-gray-300 mb-1">Event: <span style="color: var(--primary-green)">${r.event?.title || '-'}</span></p>
        <p class="text-sm text-gray-300 mb-1">Time: <span style="color: var(--primary-green)">${r.program?.time ? new Date(r.program.time).toLocaleString() : '-'}</span></p>
        <p class="text-xs text-gray-400">Registered on: ${new Date(r.createdAt).toLocaleString()}</p>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    showError('#myregs-list', 'Failed to fetch registrations');
  }
}

function printMyRegs(){
  window.print();
}

// Login/Dashboard logic
async function login(){
  const roleSel = $("#login-role").value;
  const id = $("#login-id").value.trim();
  const password = $("#login-pw").value.trim();
  
  try {
    const res = await fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({role: roleSel, id, password})
    });
    const data = await res.json();
    if(!res.ok){ 
      $("#login-msg").textContent = data.error || 'Login failed';
      return;
    }
    token = data.token; role = data.role;
    $("#user-badge").textContent = `${role.toUpperCase()}: ${id}`;
    $("#owner-panel").classList.toggle('hidden', role!=='owner');
    $("#login-msg").textContent = '';
    await refreshEvents();
    await refreshRegs();
    if(role==='owner'){ await ownerLoadAdmins(); }
  } catch (error) {
    $("#login-msg").textContent = 'Login failed';
  }
}

function logout(){
  token = null; role = null; selectedEventId = null;
  $("#user-badge").textContent = '';
  $("#owner-panel").classList.add('hidden');
  $("#ev-list").innerHTML = '';
  $("#prg-list").innerHTML = '';
  $("#reg-list").innerHTML = '';
  $("#login-msg").textContent = '';
}

async function refreshEvents(){
  try {
    const res = await fetch('/api/admin/events', { headers:{Authorization: 'Bearer '+token} });
    const events = await res.json();
    const list = $("#ev-list"); list.innerHTML = '';
    events.forEach(ev=>{
      const item = document.createElement('div');
      item.className = 'glass rounded-lg p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2';
      item.innerHTML = `
        <div class="flex-1">
          <div class="font-semibold">${ev.title}</div>
          <div class="text-xs text-gray-400">${new Date(ev.startTime).toLocaleString()} → ${new Date(ev.endTime).toLocaleString()}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn-green px-3 py-1 rounded text-xs" data-act="select">Select</button>
          <button class="btn px-3 py-1 rounded text-xs" data-act="edit">Edit</button>
          <button class="btn px-3 py-1 rounded text-xs" data-act="del">Delete</button>
        </div>
      `;
      item.querySelector('[data-act="select"]').addEventListener('click', async ()=>{
        selectedEventId = ev.id; await refreshPrograms();
      });
      item.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
        const title = prompt('Title', ev.title) || ev.title;
        const description = prompt('Description', ev.description||'') ?? ev.description;
        const image = prompt('Image URL (optional)', ev.image||'') ?? ev.image;
        const startTime = prompt('Start ISO', ev.startTime) || ev.startTime;
        const endTime = prompt('End ISO', ev.endTime) || ev.endTime;
        const res2 = await fetch('/api/admin/events/'+ev.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({title, description, image, startTime, endTime}) });
        if(!res2.ok) showError('#ev-list', 'Update failed'); else refreshEvents();
      });
      item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
        if(!confirm('Delete event?')) return;
        const res2 = await fetch('/api/admin/events/'+ev.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
        if(!res2.ok) showError('#ev-list', 'Delete failed'); else refreshEvents();
      });
      list.appendChild(item);
    });
  } catch (error) {
    showError('#ev-list', 'Failed to load events');
  }
}

async function refreshPrograms(){
  if(!selectedEventId){ 
    $("#prg-list").innerHTML = '<p class="text-sm text-gray-400">Select an event first</p>'; 
    return; 
  }
  
  try {
    const res = await fetch(`/api/admin/events/${selectedEventId}/programs`, { headers:{Authorization:'Bearer '+token} });
    const prgs = await res.json();
    const list = $("#prg-list"); list.innerHTML = '';
    prgs.forEach(p=>{
      const item = document.createElement('div');
      item.className = 'glass rounded-lg p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2';
      item.innerHTML = `
        <div class="flex-1">
          <div class="font-semibold">${p.title} <span class="badge px-2 py-1 rounded text-xs ml-2">${p.type}</span></div>
          <div class="text-xs text-gray-400">Reg: ${fmt(p.regStart)} → ${fmt(p.regEnd)} | Time: ${fmt(p.time)}</div>
          <div class="text-xs text-gray-400">Departments: ${p.departments.join(', ')}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn px-3 py-1 rounded text-xs" data-act="edit">Edit</button>
          <button class="btn px-3 py-1 rounded text-xs" data-act="del">Delete</button>
        </div>
      `;
      item.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
        const title = prompt('Title', p.title) || p.title;
        const description = prompt('Description', p.description||'') ?? p.description;
        const type = prompt('Type (individual|group)', p.type) || p.type;
        const regStart = prompt('Reg Start ISO', p.regStart) || p.regStart;
        const regEnd = prompt('Reg End ISO', p.regEnd) || p.regEnd;
        const departments = (prompt('Departments (comma separated)', p.departments.join(',')) || p.departments.join(',')).split(',').map(s=> s.trim());
        const time = prompt('Program Time ISO', p.time) || p.time;
        const res2 = await fetch('/api/admin/programs/'+p.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({title, description, type, regStart, regEnd, departments, time}) });
        if(!res2.ok) showError('#prg-list', 'Update failed'); else refreshPrograms();
      });
      item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
        if(!confirm('Delete program?')) return;
        const res2 = await fetch('/api/admin/programs/'+p.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
        if(!res2.ok) showError('#prg-list', 'Delete failed'); else refreshPrograms();
      });
      list.appendChild(item);
    });
  } catch (error) {
    showError('#prg-list', 'Failed to load programs');
  }
}

async function refreshRegs(){
  try {
    const res = await fetch('/api/admin/registrations', { headers:{Authorization:'Bearer '+token} });
    const regs = await res.json();
    const list = $("#reg-list"); list.innerHTML='';
    regs.forEach(r=>{
      const item = document.createElement('div');
      item.className = 'glass rounded-lg p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2';
      item.innerHTML = `
        <div class="text-sm flex-1">
          <div><span class="font-medium">${r.name}</span> (${r.rollNo}) — Sem ${r.semester}, Dept ${r.department}</div>
          <div class="text-xs text-gray-400">Program ${r.programId} | ${new Date(r.createdAt).toLocaleString()}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn px-3 py-1 rounded text-xs" data-act="edit">Edit</button>
          <button class="btn px-3 py-1 rounded text-xs" data-act="del">Delete</button>
        </div>
      `;
      item.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
        const name = prompt('Name', r.name) || r.name;
        const department = prompt('Department', r.department) || r.department;
        const semester = prompt('Semester (1-6)', r.semester) || r.semester;
        const res2 = await fetch('/api/admin/registrations/'+r.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({name, department, semester}) });
        if(!res2.ok) showError('#reg-list', 'Update failed'); else refreshRegs();
      });
      item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
        if(!confirm('Delete registration?')) return;
        const res2 = await fetch('/api/admin/registrations/'+r.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
        if(!res2.ok) showError('#reg-list', 'Delete failed'); else refreshRegs();
      });
      list.appendChild(item);
    });
  } catch (error) {
    showError('#reg-list', 'Failed to load registrations');
  }
}

// Owner admin management
async function ownerLoadAdmins(){
  try {
    const res = await fetch('/api/owner/admins', { headers:{Authorization:'Bearer '+token} });
    const admins = await res.json();
    const list = $("#admins-list"); list.innerHTML='';
    admins.forEach(a=>{
      const row = document.createElement('div');
      row.className = 'glass rounded-lg p-3 flex items-center justify-between';
      row.innerHTML = `
        <div class="text-sm font-medium">${a.id}</div>
        <div class="flex gap-2">
          <button class="btn px-3 py-1 rounded text-xs" data-act="edit">Edit</button>
          <button class="btn px-3 py-1 rounded text-xs" data-act="del">Delete</button>
        </div>
      `;
      row.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
        const password = prompt('New password for '+a.id, a.password) || a.password;
        const res2 = await fetch('/api/owner/admins/'+a.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({password}) });
        if(!res2.ok) showError('#admins-list', 'Update failed'); else ownerLoadAdmins();
      });
      row.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
        if(!confirm('Delete admin '+a.id+'?')) return;
        const res2 = await fetch('/api/owner/admins/'+a.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
        if(!res2.ok) showError('#admins-list', 'Delete failed'); else ownerLoadAdmins();
      });
      list.appendChild(row);
    });
  } catch (error) {
    showError('#admins-list', 'Failed to load admins');
  }
}

async function ownerCreateAdmin(){
  const id = $("#new-admin-id").value.trim();
  const password = $("#new-admin-pw").value.trim();
  if(!id || !password) {
    showError('#admins-list', 'Enter ID and password');
    return;
  }
  
  try {
    const res = await fetch('/api/owner/admins', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({id, password}) });
    if(!res.ok){ 
      const d = await res.json(); 
      showError('#admins-list', d.error||'Failed');
      return; 
    }
    $("#new-admin-id").value = ''; $("#new-admin-pw").value = '';
    ownerLoadAdmins();
  } catch (error) {
    showError('#admins-list', 'Failed to create admin');
  }
}

// Event Listeners
$("#filter-toggle").addEventListener('click', toggleFilters);
$("#nav-home").addEventListener('click', ()=>{ show('home'); loadHome(); });
$("#nav-myregs").addEventListener('click', ()=>{ show('myregs'); });
$("#nav-login").addEventListener('click', ()=>{ show('login'); });
$("#filter-btn").addEventListener('click', applyFilters);
$("#myregs-btn").addEventListener('click', fetchMyRegs);
$("#myregs-print").addEventListener('click', printMyRegs);
$("#reg-submit").addEventListener('click', submitRegister);
$("#reg-cancel").addEventListener('click', closeRegister);
$("#login-btn").addEventListener('click', login);
$("#logout-btn").addEventListener('click', logout);
$("#ev-refresh").addEventListener('click', refreshEvents);
$("#ev-new").addEventListener('click', async ()=>{
  const title = prompt('Title'); if(!title) return;
  const description = prompt('Description') || '';
  const image = prompt('Image URL (optional)') || '';
  const startTime = prompt('Start ISO (e.g. 2025-09-10T09:00:00.000Z)');
  const endTime = prompt('End ISO');
  const res = await fetch('/api/admin/events', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({title, description, image, startTime, endTime}) });
  if(!res.ok){ showError('#ev-list', 'Create failed'); return; }
  refreshEvents();
});
$("#prg-refresh").addEventListener('click', refreshPrograms);
$("#prg-new").addEventListener('click', async ()=>{
  if(!selectedEventId) {
    showError('#prg-list', 'Select an event first');
    return;
  }
  const title = prompt('Program Title'); if(!title) return;
  const description = prompt('Description') || '';
  const type = prompt('Type (individual|group)', 'individual') || 'individual';
  const regStart = prompt('Reg Start ISO');
  const regEnd = prompt('Reg End ISO');
  const departments = (prompt('Departments (comma, or ALL)', 'ALL')||'ALL').split(',').map(s=> s.trim());
  const time = prompt('Program Time ISO');
  const res = await fetch(`/api/admin/events/${selectedEventId}/programs`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({title, description, type, regStart, regEnd, departments, time}) });
  if(!res.ok){ showError('#prg-list', 'Create failed'); return; }
  refreshPrograms();
});
$("#reg-refresh").addEventListener('click', refreshRegs);
$("#admin-create").addEventListener('click', ownerCreateAdmin);

// Initialize
show('home');
loadHome();