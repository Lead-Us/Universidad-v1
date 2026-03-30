import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false;

async function mockDb() {
  const { load } = await import('./localStore.js');
  const { MOCK_SCHEDULE } = await import('./mockData.js');
  return load('uni_schedule', () => JSON.parse(JSON.stringify(MOCK_SCHEDULE)));
}

export async function getSchedule() {
  if (USE_MOCK) {
    const db = await mockDb();
    return [...db];
  }
  const { data, error } = await supabase
    .from('schedule').select('*').order('day_of_week').order('start_time');
  if (error) throw error;
  return data;
}

export async function getScheduleByDay(dayOfWeek) {
  if (USE_MOCK) {
    const db = await mockDb();
    return db.filter(s => s.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  const { data, error } = await supabase
    .from('schedule').select('*').eq('day_of_week', dayOfWeek).order('start_time');
  if (error) throw error;
  return data;
}

export async function createScheduleEntry(entry) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const nueva = { ...entry, id: uuidv4() };
    db.push(nueva);
    save('uni_schedule', db);
    return nueva;
  }
  const uid = await getUid();
  const { data, error } = await supabase.from('schedule').insert({
    user_id:     uid,
    ramo_id:     entry.ramo_id,
    day_of_week: entry.day_of_week,
    start_time:  entry.start_time,
    end_time:    entry.end_time,
    sala:        entry.sala || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateScheduleEntry(id, changes) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const idx = db.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Bloque no encontrado');
    db[idx] = { ...db[idx], ...changes };
    save('uni_schedule', db);
    return db[idx];
  }
  const { data, error } = await supabase.from('schedule').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteScheduleEntry(id) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const idx = db.findIndex(s => s.id === id);
    if (idx !== -1) db.splice(idx, 1);
    save('uni_schedule', db);
    return;
  }
  const { error } = await supabase.from('schedule').delete().eq('id', id);
  if (error) throw error;
}
