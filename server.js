import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from './store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Utility
const isOngoing = (start, end) => {
  const now = new Date();
  return new Date(start) <= now && now <= new Date(end);
};
const isPast = (end) => new Date(end) < new Date();
const isFuture = (start) => new Date(start) > new Date();

// Auth middleware
function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function ownerRequired(req, res, next) {
  if (req.user?.role !== 'owner') return res.status(403).json({ error: 'Owner only' });
  next();
}

// ----------------- ROUTES -----------------

// Login
app.post('/api/login', async (req, res) => {
  const { id, password, role } = req.body || {};
  if (role === 'owner') {
    if (id === 'COSMIC' && password === 'VVVS2025') {
      const token = jwt.sign({ id, role: 'owner' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, role: 'owner', id });
    } else {
      return res.status(401).json({ error: 'Invalid owner credentials' });
    }
  } else if (role === 'admin') {
    const admins = await db.readAdmins();
    const ok = admins.find(a => a.id === id && a.password === password);
    if (ok) {
      const token = jwt.sign({ id, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, role: 'admin', id });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  } else {
    return res.status(400).json({ error: 'Specify role: owner|admin' });
  }
});

// Public: list events categorized
app.get('/api/events', async (req, res) => {
  const events = await db.readEvents();
  const categorized = { upcoming: [], present: [], past: [] };
  for (const ev of events) {
    if (isFuture(ev.startTime)) categorized.upcoming.push(ev);
    else if (isOngoing(ev.startTime, ev.endTime)) categorized.present.push(ev);
    else categorized.past.push(ev);
  }
  res.json(categorized);
});

// Public: event details and programs
app.get('/api/events/:eventId', async (req, res) => {
  const events = await db.readEvents();
  const programs = await db.readPrograms();
  const ev = events.find(e => e.id === req.params.eventId);
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  const prgs = programs.filter(p => p.eventId === ev.id);
  res.json({ event: ev, programs: prgs });
});

// Public: search/filter
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const dept = (req.query.department || '').toLowerCase();
  const sem = (req.query.semester || '').trim();
  const type = (req.query.type || '').toLowerCase();

  const events = await db.readEvents();
  const programs = await db.readPrograms();

  function inType(ev) {
    if (!type) return true;
    if (type === 'upcoming') return new Date(ev.startTime) > new Date();
    if (type === 'present') return new Date(ev.startTime) <= new Date() && new Date() <= new Date(ev.endTime);
    if (type === 'past') return new Date(ev.endTime) < new Date();
    return true;
  }

  const result = events
    .filter(inType)
    .map(ev => {
      const evPrograms = programs.filter(p => p.eventId === ev.id);
      return {
        ...ev,
        programs: evPrograms.filter(p => {
          const matchQ = !q || p.title.toLowerCase().includes(q) || ev.title.toLowerCase().includes(q);
          const matchDept = !dept || p.departments.map(d => String(d).toLowerCase()).includes(dept) || p.departments.includes('ALL');
          const matchSem = !sem || ['1','2','3','4','5','6'].includes(sem);
          return matchQ && matchDept && matchSem;
        })
      }
    }).filter(e => e.programs && e.programs.length > 0);
  res.json(result);
});

// Public: register
app.post('/api/register', async (req,res)=>{
  const { programId, name, rollNo, semester, department } = req.body || {};
  if(!programId || !name || !rollNo || !semester || !department){
    return res.status(400).json({error:'Missing fields'});
  }
  const programs = await db.readPrograms();
  const p = programs.find(x=> x.id===programId);
  if(!p) return res.status(404).json({error:'Program not found'});

  const now = new Date();
  if(now < new Date(p.regStart) || now > new Date(p.regEnd)){
    return res.status(400).json({error:'Registration window closed'});
  }

  if(!(p.departments.includes('ALL') || p.departments.includes(department))){
    return res.status(400).json({error:'Department not eligible'});
  }

  const regs = await db.readRegistrations();
  const exists = regs.find(r=> r.programId===programId && r.rollNo.toLowerCase()===String(rollNo).toLowerCase());
  if(exists){
    return res.status(400).json({error:'Roll No already registered for this program'});
  }

  const reg = { id: uuidv4(), programId, name, rollNo, semester: String(semester), department, createdAt: now.toISOString() };
  regs.push(reg);
  await db.writeRegistrations(regs);
  res.json({success:true, registration: reg});
});

// Public: my registrations
app.get('/api/my-registrations', async (req, res)=>{
  const rollNo = (req.query.rollNo || '').trim();
  if(!rollNo) return res.status(400).json({error:'rollNo is required'});
  const regs = (await db.readRegistrations()).filter(r=> r.rollNo.toLowerCase()===rollNo.toLowerCase());
  const programs = await db.readPrograms();
  const events = await db.readEvents();
  const detailed = regs.map(r=>{
    const p = programs.find(x=> x.id===r.programId);
    const ev = p ? events.find(e=> e.id===p.eventId) : null;
    return {
      ...r,
      program: p ? { id:p.id, title:p.title, time:p.time } : null,
      event: ev ? { id:ev.id, title:ev.title } : null
    };
  });
  res.json(detailed);
});

// ----------------- ADMIN ROUTES -----------------
app.get('/api/admin/events', authRequired, async (req,res)=>{
  const events = await db.readEvents();
  res.json(events);
});
app.post('/api/admin/events', authRequired, async (req,res)=>{
  const { title, description, image, startTime, endTime } = req.body || {};
  if(!title || !startTime || !endTime) return res.status(400).json({error:'Missing fields'});
  const ev = { id: uuidv4(), title, description: description||'', image: image||'', startTime, endTime };
  const events = await db.readEvents(); events.push(ev); await db.writeEvents(events);
  res.json(ev);
});
app.put('/api/admin/events/:id', authRequired, async (req,res)=>{
  const events = await db.readEvents();
  const idx = events.findIndex(e=> e.id===req.params.id);
  if(idx<0) return res.status(404).json({error:'Not found'});
  events[idx] = { ...events[idx], ...req.body, id: events[idx].id };
  await db.writeEvents(events);
  res.json(events[idx]);
});
app.delete('/api/admin/events/:id', authRequired, async (req,res)=>{
  const events = (await db.readEvents()).filter(e=> e.id!==req.params.id);
  await db.writeEvents(events);
  res.json({success:true});
});

// Programs
app.get('/api/admin/events/:eventId/programs', authRequired, async (req,res)=>{
  const programs = (await db.readPrograms()).filter(p=> p.eventId===req.params.eventId);
  res.json(programs);
});
app.post('/api/admin/events/:eventId/programs', authRequired, async (req,res)=>{
  const { title, description, type, regStart, regEnd, departments, time } = req.body || {};
  if(!title || !type || !regStart || !regEnd || !time) return res.status(400).json({error:'Missing fields'});
  const p = { id: uuidv4(), eventId: req.params.eventId, title, description: description||'', type, regStart, regEnd, departments: departments||['ALL'], time };
  const programs = await db.readPrograms(); programs.push(p); await db.writePrograms(programs);
  res.json(p);
});
app.put('/api/admin/programs/:id', authRequired, async (req,res)=>{
  const programs = await db.readPrograms();
  const idx = programs.findIndex(p=> p.id===req.params.id);
  if(idx<0) return res.status(404).json({error:'Not found'});
  programs[idx] = { ...programs[idx], ...req.body, id: programs[idx].id };
  await db.writePrograms(programs);
  res.json(programs[idx]);
});
app.delete('/api/admin/programs/:id', authRequired, async (req,res)=>{
  const programs = (await db.readPrograms()).filter(p=> p.id!==req.params.id);
  await db.writePrograms(programs);
  res.json({success:true});
});

// Registrations
app.get('/api/admin/registrations', authRequired, async (req,res)=>{
  res.json(await db.readRegistrations());
});
app.put('/api/admin/registrations/:id', authRequired, async (req,res)=>{
  const regs = await db.readRegistrations();
  const idx = regs.findIndex(r=> r.id===req.params.id);
  if(idx<0) return res.status(404).json({error:'Not found'});
  regs[idx] = { ...regs[idx], ...req.body, id: regs[idx].id };
  await db.writeRegistrations(regs);
  res.json(regs[idx]);
});
app.delete('/api/admin/registrations/:id', authRequired, async (req,res)=>{
  const regs = (await db.readRegistrations()).filter(r=> r.id!==req.params.id);
  await db.writeRegistrations(regs);
  res.json({success:true});
});

// ----------------- OWNER ROUTES -----------------
app.get('/api/owner/admins', authRequired, ownerRequired, async (req,res)=>{
  res.json(await db.readAdmins());
});
app.post('/api/owner/admins', authRequired, ownerRequired, async (req,res)=>{
  const { id, password } = req.body || {};
  if(!id || !password) return res.status(400).json({error:'Missing fields'});
  const admins = await db.readAdmins();
  if(admins.find(a=> a.id===id)) return res.status(400).json({error:'Admin ID exists'});
  admins.push({ id, password });
  await db.writeAdmins(admins);
  res.json({success:true});
});
app.put('/api/owner/admins/:id', authRequired, ownerRequired, async (req,res)=>{
  const admins = await db.readAdmins();
  const idx = admins.findIndex(a=> a.id===req.params.id);
  if(idx<0) return res.status(404).json({error:'Not found'});
  admins[idx] = { ...admins[idx], ...req.body, id: admins[idx].id };
  await db.writeAdmins(admins);
  res.json(admins[idx]);
});
app.delete('/api/owner/admins/:id', authRequired, ownerRequired, async (req,res)=>{
  const admins = (await db.readAdmins()).filter(a=> a.id!==req.params.id);
  await db.writeAdmins(admins);
  res.json({success:true});
});

// -------------- FRONTEND FALLBACK --------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ----------------- START -----------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
