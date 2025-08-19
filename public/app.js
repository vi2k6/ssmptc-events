const $ = (q)=> document.querySelector(q);
const $$ = (q)=> Array.from(document.querySelectorAll(q));
let token = null;
let role = null;
let selectedEventId = null;
let regProgramId = null;

function fmt(dt){
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

async function loadHome(){
  $("#home-sections").innerHTML = "";
  const res = await fetch('/api/events');
  const data = await res.json();
  renderSection('Present Events', data.present);
  renderSection('Upcoming Events', data.upcoming);
  renderSection('Past Events', data.past);
}

function renderSection(title, events){
  const cont = document.createElement('div');
  cont.innerHTML = `<h2 class="text-2xl font-bold mb-3">${title}</h2>`;
  const grid = document.createElement('div');
  grid.className = 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4';
  events.forEach(ev=> grid.appendChild(eventCard(ev)));
  cont.appendChild(grid);
  $("#home-sections").appendChild(cont);
}

function eventCard(ev){
  const el = document.createElement('div');
  el.className = 'glass rounded-2xl overflow-hidden glow';
  el.innerHTML = `
    <img src="${ev.image || 'assets/innovation.jpg'}" class="w-full h-40 object-cover" alt="event">
    <div class="p-4">
      <h3 class="font-bold text-lg">${ev.title}</h3>
      <p class="text-sm text-slate-300 line-clamp-3">${ev.description || ''}</p>
      <p class="text-xs mt-2">From <b>${fmt(ev.startTime)}</b> to <b>${fmt(ev.endTime)}</b></p>
      <button class="mt-3 px-3 py-2 rounded-xl glass btn">View Details</button>
    </div>
  `;
  el.querySelector('button').addEventListener('click', ()=> openEvent(ev.id));
  return el;
}

async function openEvent(id){
  const res = await fetch(`/api/events/${id}`);
  if(!res.ok){ alert('Event not found'); return; }
  const { event, programs } = await res.json();
  window.scrollTo({top:0, behavior:'smooth'});
  $("#home-sections").innerHTML = `
    <div class="glass rounded-2xl p-4 glow">
      <button id="back-home" class="px-3 py-2 rounded-xl glass mb-3">← Back</button>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="md:col-span-1">
          <img src="${event.image || 'assets/innovation.jpg'}" class="w-full rounded-xl object-cover">
        </div>
        <div class="md:col-span-2">
          <h2 class="text-2xl font-bold mb-1">${event.title}</h2>
          <p class="text-slate-300 mb-2">${event.description || ''}</p>
          <p class="text-sm">From <b>${fmt(event.startTime)}</b> to <b>${fmt(event.endTime)}</b></p>
        </div>
      </div>
    </div>
    <div class="mt-6 space-y-3" id="programs-list"></div>
  `;
  $("#back-home").addEventListener('click', loadHome);
  const list = $("#programs-list");
  programs.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'glass rounded-2xl p-4 glow';
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-semibold">${p.title} <span class="text-xs px-2 py-1 rounded-lg glass ml-2">${p.type}</span></h3>
          <p class="text-sm text-slate-300">${p.description || ''}</p>
          <p class="text-xs mt-1">Time: <b>${fmt(p.time)}</b></p>
          <p class="text-xs mt-1">Registration: <b>${fmt(p.regStart)}</b> to <b>${fmt(p.regEnd)}</b></p>
          <p class="text-xs mt-1">Departments: ${p.departments.join(', ')}</p>
        </div>
        <button class="px-3 py-2 rounded-xl glass btn">Register</button>
      </div>
    `;
    card.querySelector('button').addEventListener('click', ()=> openRegister(p.id));
    list.appendChild(card);
  });
}

function show(section){
  // sections: home (filters+home-sections), myregs-section, login-section
  $("#filters").classList.toggle('hidden', section!=='home');
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
  const res = await fetch(url);
  const data = await res.json();
  // Render filtered results
  $("#home-sections").innerHTML = '';
  if(!data.length){
    $("#home-sections").innerHTML = '<p class="text-slate-300">No results.</p>';
    return;
  }
  data.forEach(ev=>{
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 class="text-xl font-bold mb-2">${ev.title}</h2>`;
    const grid = document.createElement('div');
    grid.className = 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4';
    grid.appendChild(eventCard(ev));
    wrap.appendChild(grid);
    $("#home-sections").appendChild(wrap);
  });
}

function openRegister(programId){
  regProgramId = programId;
  $("#reg-msg").textContent = '';
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
    $("#reg-msg").textContent = 'Please fill all fields.'; return;
  }
  const res = await fetch('/api/register', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if(!res.ok){ $("#reg-msg").textContent = data.error || 'Failed'; return; }
  alert('Successfully Registered');
  closeRegister();
}

async function fetchMyRegs(){
  const roll = $("#myregs-roll").value.trim();
  if(!roll){ alert('Enter Roll No'); return; }
  const res = await fetch('/api/my-registrations?rollNo='+encodeURIComponent(roll));
  const items = await res.json();
  const list = $("#myregs-list");
  list.innerHTML = '';
  if(!items.length){
    list.innerHTML = `<p class="text-slate-300">No programs registered yet</p>`; return;
  }
  items.forEach(r=>{
    const card = document.createElement('div');
    card.className = 'glass rounded-2xl p-4 glow';
    card.innerHTML = `
      <h4 class="font-semibold">${r.program?.title || 'Program'}</h4>
      <p class="text-sm">Event: ${r.event?.title || '-'}</p>
      <p class="text-sm">Time: ${r.program?.time ? new Date(r.program.time).toLocaleString() : '-'}</p>
      <p class="text-xs mt-1">Registered on: ${new Date(r.createdAt).toLocaleString()}</p>
    `;
    list.appendChild(card);
  });
}

function printMyRegs(){
  window.print();
}

// Login/Dashboard logic
async function login(){
  const roleSel = $("#login-role").value;
  const id = $("#login-id").value.trim();
  const password = $("#login-pw").value.trim();
  const res = await fetch('/api/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({role: roleSel, id, password})
  });
  const data = await res.json();
  if(!res.ok){ $("#login-msg").textContent = data.error || 'Login failed'; return; }
  token = data.token; role = data.role;
  $("#user-badge").textContent = `${role.toUpperCase()}: ${id}`;
  $("#owner-panel").classList.toggle('hidden', role!=='owner');
  await refreshEvents();
  await refreshRegs();
  if(role==='owner'){ await ownerLoadAdmins(); }
}

function logout(){
  token = null; role = null; selectedEventId = null;
  $("#user-badge").textContent = '';
  $("#owner-panel").classList.add('hidden');
  $("#ev-list").innerHTML = '';
  $("#prg-list").innerHTML = '';
  $("#reg-list").innerHTML = '';
}

async function refreshEvents(){
  const res = await fetch('/api/admin/events', { headers:{Authorization: 'Bearer '+token} });
  const events = await res.json();
  const list = $("#ev-list"); list.innerHTML = '';
  events.forEach(ev=>{
    const item = document.createElement('div');
    item.className = 'glass rounded-xl p-3 flex items-center justify-between';
    item.innerHTML = `
      <div>
        <div class="font-semibold">${ev.title}</div>
        <div class="text-xs">${new Date(ev.startTime).toLocaleString()} → ${new Date(ev.endTime).toLocaleString()}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-2 py-1 glass" data-act="select">Select</button>
        <button class="px-2 py-1 glass" data-act="edit">Edit</button>
        <button class="px-2 py-1 glass" data-act="del">Delete</button>
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
      if(!res2.ok) alert('Update failed'); else refreshEvents();
    });
    item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
      if(!confirm('Delete event?')) return;
      const res2 = await fetch('/api/admin/events/'+ev.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
      if(!res2.ok) alert('Delete failed'); else refreshEvents();
    });
    list.appendChild(item);
  });
}

async function refreshPrograms(){
  if(!selectedEventId){ $("#prg-list").innerHTML = '<p class="text-sm">Select an event first</p>'; return; }
  const res = await fetch(`/api/admin/events/${selectedEventId}/programs`, { headers:{Authorization:'Bearer '+token} });
  const prgs = await res.json();
  const list = $("#prg-list"); list.innerHTML = '';
  prgs.forEach(p=>{
    const item = document.createElement('div');
    item.className = 'glass rounded-xl p-3 flex items-center justify-between';
    item.innerHTML = `
      <div>
        <div class="font-semibold">${p.title} <span class="text-xs ml-2 px-2 py-1 rounded-lg glass">${p.type}</span></div>
        <div class="text-xs">Reg: ${fmt(p.regStart)} → ${fmt(p.regEnd)} | Time: ${fmt(p.time)}</div>
        <div class="text-xs">Departments: ${p.departments.join(', ')}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-2 py-1 glass" data-act="edit">Edit</button>
        <button class="px-2 py-1 glass" data-act="del">Delete</button>
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
      if(!res2.ok) alert('Update failed'); else refreshPrograms();
    });
    item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
      if(!confirm('Delete program?')) return;
      const res2 = await fetch('/api/admin/programs/'+p.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
      if(!res2.ok) alert('Delete failed'); else refreshPrograms();
    });
    list.appendChild(item);
  });
}

async function refreshRegs(){
  const res = await fetch('/api/admin/registrations', { headers:{Authorization:'Bearer '+token} });
  const regs = await res.json();
  const list = $("#reg-list"); list.innerHTML='';
  regs.forEach(r=>{
    const item = document.createElement('div');
    item.className = 'glass rounded-xl p-3 flex items-center justify-between';
    item.innerHTML = `
      <div class="text-sm">
        <div><b>${r.name}</b> (${r.rollNo}) — Sem ${r.semester}, Dept ${r.department}</div>
        <div class="text-xs">Program ${r.programId} | ${new Date(r.createdAt).toLocaleString()}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-2 py-1 glass" data-act="edit">Edit</button>
        <button class="px-2 py-1 glass" data-act="del">Delete</button>
      </div>
    `;
    item.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
      const name = prompt('Name', r.name) || r.name;
      const department = prompt('Department', r.department) || r.department;
      const semester = prompt('Semester (1-6)', r.semester) || r.semester;
      const res2 = await fetch('/api/admin/registrations/'+r.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({name, department, semester}) });
      if(!res2.ok) alert('Update failed'); else refreshRegs();
    });
    item.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
      if(!confirm('Delete registration?')) return;
      const res2 = await fetch('/api/admin/registrations/'+r.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
      if(!res2.ok) alert('Delete failed'); else refreshRegs();
    });
    list.appendChild(item);
  });
}

// Owner admin management
async function ownerLoadAdmins(){
  const res = await fetch('/api/owner/admins', { headers:{Authorization:'Bearer '+token} });
  const admins = await res.json();
  const list = $("#admins-list"); list.innerHTML='';
  admins.forEach(a=>{
    const row = document.createElement('div');
    row.className = 'glass rounded-xl p-3 flex items-center justify-between';
    row.innerHTML = `
      <div class="text-sm">${a.id}</div>
      <div class="flex gap-2">
        <button class="px-2 py-1 glass" data-act="edit">Edit</button>
        <button class="px-2 py-1 glass" data-act="del">Delete</button>
      </div>
    `;
    row.querySelector('[data-act="edit"]').addEventListener('click', async ()=>{
      const password = prompt('New password for '+a.id, a.password) || a.password;
      const res2 = await fetch('/api/owner/admins/'+a.id, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({password}) });
      if(!res2.ok) alert('Update failed'); else ownerLoadAdmins();
    });
    row.querySelector('[data-act="del"]').addEventListener('click', async ()=>{
      if(!confirm('Delete admin '+a.id+'?')) return;
      const res2 = await fetch('/api/owner/admins/'+a.id, { method:'DELETE', headers:{Authorization:'Bearer '+token} });
      if(!res2.ok) alert('Delete failed'); else ownerLoadAdmins();
    });
    list.appendChild(row);
  });
}

async function ownerCreateAdmin(){
  const id = $("#new-admin-id").value.trim();
  const password = $("#new-admin-pw").value.trim();
  if(!id || !password) return alert('Enter ID and password');
  const res = await fetch('/api/owner/admins', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({id, password}) });
  if(!res.ok){ const d = await res.json(); alert(d.error||'Failed'); return; }
  $("#new-admin-id").value = ''; $("#new-admin-pw").value = '';
  ownerLoadAdmins();
}

// Nav handlers
$("#nav-home").addEventListener('click', ()=>{ show('home'); loadHome(); });
$("#nav-myregs").addEventListener('click', ()=>{ show('myregs'); });
$("#nav-login").addEventListener('click', ()=>{ show('login'); });

// Filters
$("#filter-btn").addEventListener('click', applyFilters);

// My regs
$("#myregs-btn").addEventListener('click', fetchMyRegs);
$("#myregs-print").addEventListener('click', printMyRegs);

// Register modal
$("#reg-submit").addEventListener('click', submitRegister);
$("#reg-cancel").addEventListener('click', closeRegister);

// Dashboard buttons
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
  if(!res.ok){ alert('Create failed'); return; }
  refreshEvents();
});
$("#prg-refresh").addEventListener('click', refreshPrograms);
$("#prg-new").addEventListener('click', async ()=>{
  if(!selectedEventId) return alert('Select an event first');
  const title = prompt('Program Title'); if(!title) return;
  const description = prompt('Description') || '';
  const type = prompt('Type (individual|group)', 'individual') || 'individual';
  const regStart = prompt('Reg Start ISO');
  const regEnd = prompt('Reg End ISO');
  const departments = (prompt('Departments (comma, or ALL)', 'ALL')||'ALL').split(',').map(s=> s.trim());
  const time = prompt('Program Time ISO');
  const res = await fetch(`/api/admin/events/${selectedEventId}/programs`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body: JSON.stringify({title, description, type, regStart, regEnd, departments, time}) });
  if(!res.ok){ alert('Create failed'); return; }
  refreshPrograms();
});
$("#admin-create").addEventListener('click', ownerCreateAdmin);

// Auto-init
show('home');
loadHome();
