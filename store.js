import { MongoClient } from 'mongodb';

let client;
let db;

async function connectDB() {
  if (!client) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssmptc-events';
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  }
  return db;
}

export const dbMongo = {
  async readAdmins() {
    const database = await connectDB();
    const admins = await database.collection('admins').find({}).toArray();
    return admins.map(a => ({ id: a.id, password: a.password }));
  },

  async writeAdmins(admins) {
    const database = await connectDB();
    await database.collection('admins').deleteMany({});
    if (admins.length > 0) {
      await database.collection('admins').insertMany(admins);
    }
  },

  async readEvents() {
    const database = await connectDB();
    return await database.collection('events').find({}).toArray();
  },

  async writeEvents(events) {
    const database = await connectDB();
    await database.collection('events').deleteMany({});
    if (events.length > 0) {
      await database.collection('events').insertMany(events);
    }
  },

  async readPrograms() {
    const database = await connectDB();
    return await database.collection('programs').find({}).toArray();
  },

  async writePrograms(programs) {
    const database = await connectDB();
    await database.collection('programs').deleteMany({});
    if (programs.length > 0) {
      await database.collection('programs').insertMany(programs);
    }
  },

  async readRegistrations() {
    const database = await connectDB();
    return await database.collection('registrations').find({}).toArray();
  },

  async writeRegistrations(registrations) {
    const database = await connectDB();
    await database.collection('registrations').deleteMany({});
    if (registrations.length > 0) {
      await database.collection('registrations').insertMany(registrations);
    }
  }
};

// Keep file-based storage as fallback
import fs from 'fs';
import path from 'path';
const DATA_DIR = path.resolve('data');

function readJSON(file){
  const p = path.join(DATA_DIR, file);
  if(!fs.existsSync(p)) return null;
  const txt = fs.readFileSync(p, 'utf8') || 'null';
  try { return JSON.parse(txt || 'null'); } catch(e){ return null; }
}
function writeJSON(file, obj){
  const p = path.join(DATA_DIR, file);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p);
}

export const dbFile = {
  readAdmins: ()=> readJSON('admins.json') || [],
  writeAdmins: (v)=> writeJSON('admins.json', v),
  readEvents: ()=> readJSON('events.json') || [],
  writeEvents: (v)=> writeJSON('events.json', v),
  readPrograms: ()=> readJSON('programs.json') || [],
  writePrograms: (v)=> writeJSON('programs.json', v),
  readRegistrations: ()=> readJSON('registrations.json') || [],
  writeRegistrations: (v)=> writeJSON('registrations.json', v),
};

// Use MongoDB if available, fallback to file storage
export const db = process.env.MONGODB_URI ? dbMongo : dbFile;