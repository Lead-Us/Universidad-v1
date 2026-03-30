import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false;

async function mockDb() {
  const { load } = await import('./localStore.js');
  const { MOCK_TASKS } = await import('./mockData.js');
  return load('uni_tasks', () => JSON.parse(JSON.stringify(MOCK_TASKS)));
}

export async function getTasks() {
  if (USE_MOCK) {
    const db = await mockDb();
    return [...db];
  }
  const { data, error } = await supabase.from('tasks').select('*').order('due_date');
  if (error) throw error;
  return data;
}

export async function getTasksByMonth(year, month) {
  if (USE_MOCK) {
    const db = await mockDb();
    return db.filter(t => {
      const d = new Date(t.due_date + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const to   = `${year}-${String(month).padStart(2, '0')}-31`;
  const { data, error } = await supabase
    .from('tasks').select('*').gte('due_date', from).lte('due_date', to).order('due_date');
  if (error) throw error;
  return data;
}

export async function getUpcomingTasks(days = 14) {
  if (USE_MOCK) {
    const db = await mockDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return db
      .filter(t => !t.completed && new Date(t.due_date + 'T12:00:00') <= cutoff)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }
  const today  = new Date().toISOString().split('T')[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const { data, error } = await supabase
    .from('tasks').select('*').eq('completed', false)
    .gte('due_date', today).lte('due_date', cutoff.toISOString().split('T')[0]).order('due_date');
  if (error) throw error;
  return data;
}

export async function createTask(task) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const nueva = { ...task, id: uuidv4(), completed: false };
    db.push(nueva);
    save('uni_tasks', db);
    return nueva;
  }
  const uid = await getUid();
  const { data, error } = await supabase.from('tasks').insert({
    user_id:     uid,
    title:       task.title,
    description: task.description ?? '',
    type:        task.type ?? 'tarea',
    ramo_id:     task.ramo_id ?? null,
    unit_id:     task.unit_id ?? null,
    materia:     task.materia ?? '',
    due_date:    task.due_date ?? null,
    completed:   false,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, changes) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const idx = db.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');
    db[idx] = { ...db[idx], ...changes };
    save('uni_tasks', db);
    return db[idx];
  }
  const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function toggleTask(id) {
  if (USE_MOCK) {
    const db = await mockDb();
    const task = db.find(t => t.id === id);
    if (!task) throw new Error('Tarea no encontrada');
    return updateTask(id, { completed: !task.completed });
  }
  const { data: current, error: e1 } = await supabase.from('tasks').select('completed').eq('id', id).single();
  if (e1) throw e1;
  const { data, error } = await supabase.from('tasks').update({ completed: !current.completed }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockDb();
    const idx = db.findIndex(t => t.id === id);
    if (idx !== -1) db.splice(idx, 1);
    save('uni_tasks', db);
    return;
  }
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
