import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false;

// ── Mock data (only used when USE_MOCK = true) ─────────────────────────────────

let _mock = null;
function mock() {
  if (!_mock) {
    const { MOCK_RAMOS, MOCK_UNITS, MOCK_SCHEDULE } = require('./mockData.js');
    const { load } = require('./localStore.js');
    _mock = {
      ramos:    load('uni_ramos',    () => JSON.parse(JSON.stringify(MOCK_RAMOS))),
      units:    load('uni_units',    () => JSON.parse(JSON.stringify(MOCK_UNITS))),
      schedule: load('uni_schedule', () => JSON.parse(JSON.stringify(MOCK_SCHEDULE))),
    };
  }
  return _mock;
}

// ── Ramos ──────────────────────────────────────────────────────────────────────

export async function getRamos() {
  if (USE_MOCK) {
    const { load } = await import('./localStore.js');
    const { MOCK_RAMOS } = await import('./mockData.js');
    const db = load('uni_ramos', () => JSON.parse(JSON.stringify(MOCK_RAMOS)));
    return [...db];
  }
  const { data, error } = await supabase.from('ramos').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(normalizeRamo);
}

/** Normalize Supabase snake_case fields to camelCase expected by UI hooks. */
function normalizeRamo(r) {
  if (!r) return null;
  return {
    ...r,
    evaluationModules:  r.evaluation_modules  ?? r.evaluationModules  ?? [],
    attendanceSessions: r.attendance_sessions ?? r.attendanceSessions ?? [],
    hasAttendance:      r.has_attendance      ?? r.hasAttendance      ?? false,
  };
}

export async function getRamo(id) {
  if (USE_MOCK) {
    const { load } = await import('./localStore.js');
    const { MOCK_RAMOS, MOCK_SCHEDULE } = await import('./mockData.js');
    const dbRamos    = load('uni_ramos',    () => JSON.parse(JSON.stringify(MOCK_RAMOS)));
    const dbSchedule = load('uni_schedule', () => JSON.parse(JSON.stringify(MOCK_SCHEDULE)));
    const ramo = dbRamos.find(r => r.id === id);
    if (!ramo) return null;
    const blocks = dbSchedule.filter(s => s.ramo_id === id);
    return normalizeRamo({ ...ramo, blocks });
  }
  const { data: ramo, error } = await supabase.from('ramos').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: blocks } = await supabase.from('schedule').select('*').eq('ramo_id', id).order('day_of_week').order('start_time');
  return normalizeRamo({ ...ramo, blocks: blocks ?? [] });
}

export async function createRamo(ramo) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_RAMOS, MOCK_SCHEDULE } = await import('./mockData.js');
    const dbRamos    = load('uni_ramos',    () => JSON.parse(JSON.stringify(MOCK_RAMOS)));
    const dbSchedule = load('uni_schedule', () => JSON.parse(JSON.stringify(MOCK_SCHEDULE)));
    const { blocks, ...ramoData } = ramo;
    const nuevo = { ...ramoData, id: uuidv4(), evaluationModules: [], attendanceSessions: [] };
    dbRamos.push(nuevo);
    if (blocks?.length) {
      blocks.forEach(b => dbSchedule.push({ ...b, ramo_id: nuevo.id, id: uuidv4() }));
      save('uni_schedule', dbSchedule);
    }
    save('uni_ramos', dbRamos);
    return nuevo;
  }
  const uid = await getUid();
  const { blocks, ...ramoData } = ramo;
  const { data: nuevo, error } = await supabase.from('ramos').insert({
    user_id:             uid,
    name:                ramoData.name,
    code:                ramoData.code || null,
    professor:           ramoData.professor || null,
    section:             ramoData.section || null,
    credits:             ramoData.credits ?? 0,
    color:               ramoData.color ?? '#4f8ef7',
    classroom:           ramoData.classroom || null,
    has_attendance:      ramoData.hasAttendance ?? false,
    evaluation_modules:  [],
    attendance_sessions: [],
  }).select().single();
  if (error) throw error;

  if (blocks?.length) {
    const scheduleRows = blocks.map(b => ({
      user_id:    uid,
      ramo_id:    nuevo.id,
      day_of_week: b.day_of_week ?? b.dayOfWeek ?? 0,
      start_time:  b.start_time ?? b.startTime,
      end_time:    b.end_time   ?? b.endTime,
      sala:        b.sala || null,
    }));
    await supabase.from('schedule').insert(scheduleRows);
  }
  return nuevo;
}

export async function updateRamo(id, changes) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_RAMOS, MOCK_SCHEDULE } = await import('./mockData.js');
    const dbRamos    = load('uni_ramos',    () => JSON.parse(JSON.stringify(MOCK_RAMOS)));
    const dbSchedule = load('uni_schedule', () => JSON.parse(JSON.stringify(MOCK_SCHEDULE)));
    const { blocks, ...ramoChanges } = changes;
    const idx = dbRamos.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Ramo no encontrado');
    dbRamos[idx] = { ...dbRamos[idx], ...ramoChanges };
    if (blocks !== undefined) {
      for (let i = dbSchedule.length - 1; i >= 0; i--) {
        if (dbSchedule[i].ramo_id === id) dbSchedule.splice(i, 1);
      }
      blocks.forEach(b => dbSchedule.push({ ...b, ramo_id: id, id: uuidv4() }));
      save('uni_schedule', dbSchedule);
    }
    save('uni_ramos', dbRamos);
    return dbRamos[idx];
  }
  const uid = await getUid();
  const { blocks, evaluationModules, attendanceSessions, ...rest } = changes;

  // Build update payload with snake_case
  const payload = {};
  if (rest.name       !== undefined) payload.name        = rest.name;
  if (rest.code       !== undefined) payload.code        = rest.code;
  if (rest.professor  !== undefined) payload.professor   = rest.professor;
  if (rest.section    !== undefined) payload.section     = rest.section;
  if (rest.credits    !== undefined) payload.credits     = rest.credits;
  if (rest.color      !== undefined) payload.color       = rest.color;
  if (rest.classroom  !== undefined) payload.classroom   = rest.classroom;
  if (rest.hasAttendance !== undefined) payload.has_attendance = rest.hasAttendance;
  if (evaluationModules  !== undefined) payload.evaluation_modules  = evaluationModules;
  if (attendanceSessions !== undefined) payload.attendance_sessions = attendanceSessions;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from('ramos').update(payload).eq('id', id);
    if (error) throw error;
  }

  if (blocks !== undefined) {
    await supabase.from('schedule').delete().eq('ramo_id', id);
    if (blocks.length) {
      const scheduleRows = blocks.map(b => ({
        user_id:     uid,
        ramo_id:     id,
        day_of_week: b.day_of_week ?? b.dayOfWeek ?? 0,
        start_time:  b.start_time ?? b.startTime,
        end_time:    b.end_time   ?? b.endTime,
        sala:        b.sala || null,
      }));
      await supabase.from('schedule').insert(scheduleRows);
    }
  }

  return getRamo(id);
}

export async function deleteRamo(id) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_RAMOS } = await import('./mockData.js');
    const dbRamos = load('uni_ramos', () => JSON.parse(JSON.stringify(MOCK_RAMOS)));
    const idx = dbRamos.findIndex(r => r.id === id);
    if (idx !== -1) dbRamos.splice(idx, 1);
    save('uni_ramos', dbRamos);
    return;
  }
  const { error } = await supabase.from('ramos').delete().eq('id', id);
  if (error) throw error;
}

// ── Units ──────────────────────────────────────────────────────────────────────

export async function getUnits(ramoId) {
  if (USE_MOCK) {
    const { load } = await import('./localStore.js');
    const { MOCK_UNITS } = await import('./mockData.js');
    const db = load('uni_units', () => JSON.parse(JSON.stringify(MOCK_UNITS)));
    return db[ramoId] ? [...db[ramoId]] : [];
  }
  const { data, error } = await supabase.from('units').select('*').eq('ramo_id', ramoId).order('order');
  if (error) throw error;
  return data;
}

export async function createUnit(unit) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_UNITS } = await import('./mockData.js');
    const db = load('uni_units', () => JSON.parse(JSON.stringify(MOCK_UNITS)));
    const nuevo = { ...unit, id: uuidv4() };
    if (!db[unit.ramo_id]) db[unit.ramo_id] = [];
    db[unit.ramo_id].push(nuevo);
    save('uni_units', db);
    return nuevo;
  }
  const uid = await getUid();
  const { data, error } = await supabase.from('units').insert({
    user_id:  uid,
    ramo_id:  unit.ramo_id,
    name:     unit.name,
    order:    unit.order ?? 0,
    materias: unit.materias ?? [],
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateUnit(id, ramoId, changes) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_UNITS } = await import('./mockData.js');
    const db = load('uni_units', () => JSON.parse(JSON.stringify(MOCK_UNITS)));
    const list = db[ramoId] ?? [];
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Unidad no encontrada');
    list[idx] = { ...list[idx], ...changes };
    save('uni_units', db);
    return list[idx];
  }
  const { data, error } = await supabase.from('units').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteUnit(id, ramoId) {
  if (USE_MOCK) {
    const { load, save } = await import('./localStore.js');
    const { MOCK_UNITS } = await import('./mockData.js');
    const db = load('uni_units', () => JSON.parse(JSON.stringify(MOCK_UNITS)));
    const list = db[ramoId] ?? [];
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) list.splice(idx, 1);
    save('uni_units', db);
    return;
  }
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw error;
}

// ── Evaluation Modules (stored as jsonb in ramos row) ─────────────────────────

export async function addEvaluationModule(ramoId, mod) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const nuevo = { ...mod, id: uuidv4(), items: mod.items ?? [] };
  const mods = [...(ramo.evaluation_modules ?? ramo.evaluationModules ?? []), nuevo];
  await updateRamo(ramoId, { evaluationModules: mods });
  return nuevo;
}

export async function updateEvaluationModule(ramoId, moduleId, changes) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const mods = [...(ramo.evaluation_modules ?? ramo.evaluationModules ?? [])];
  const idx = mods.findIndex(m => m.id === moduleId);
  if (idx === -1) throw new Error('Módulo no encontrado');
  mods[idx] = { ...mods[idx], ...changes };
  await updateRamo(ramoId, { evaluationModules: mods });
  return mods[idx];
}

export async function removeEvaluationModule(ramoId, moduleId) {
  const ramo = await getRamo(ramoId);
  if (!ramo) return;
  const mods = (ramo.evaluation_modules ?? ramo.evaluationModules ?? []).filter(m => m.id !== moduleId);
  await updateRamo(ramoId, { evaluationModules: mods });
}

export async function addEvalItem(ramoId, moduleId, item) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const mods = [...(ramo.evaluation_modules ?? ramo.evaluationModules ?? [])];
  const mod = mods.find(m => m.id === moduleId);
  if (!mod) throw new Error('Módulo no encontrado');
  const nuevo = { ...item, id: uuidv4() };
  mod.items = [...(mod.items ?? []), nuevo];
  await updateRamo(ramoId, { evaluationModules: mods });
  return nuevo;
}

export async function updateEvalItem(ramoId, moduleId, itemId, changes) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const mods = [...(ramo.evaluation_modules ?? ramo.evaluationModules ?? [])];
  const mod = mods.find(m => m.id === moduleId);
  if (!mod) throw new Error('Módulo no encontrado');
  const iIdx = (mod.items ?? []).findIndex(i => i.id === itemId);
  if (iIdx === -1) throw new Error('Ítem no encontrado');
  mod.items[iIdx] = { ...mod.items[iIdx], ...changes };
  await updateRamo(ramoId, { evaluationModules: mods });
  return mod.items[iIdx];
}

export async function removeEvalItem(ramoId, moduleId, itemId) {
  const ramo = await getRamo(ramoId);
  if (!ramo) return;
  const mods = [...(ramo.evaluation_modules ?? ramo.evaluationModules ?? [])];
  const mod = mods.find(m => m.id === moduleId);
  if (!mod) return;
  mod.items = (mod.items ?? []).filter(i => i.id !== itemId);
  await updateRamo(ramoId, { evaluationModules: mods });
}

// ── Attendance Sessions (stored as jsonb in ramos row) ────────────────────────

export async function addAttendanceSession(ramoId, session) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const nueva = { ...session, id: uuidv4() };
  const sessions = [...(ramo.attendance_sessions ?? ramo.attendanceSessions ?? []), nueva];
  await updateRamo(ramoId, { attendanceSessions: sessions });
  return nueva;
}

export async function updateAttendanceSession(ramoId, sessionId, changes) {
  const ramo = await getRamo(ramoId);
  if (!ramo) throw new Error('Ramo no encontrado');
  const sessions = [...(ramo.attendance_sessions ?? ramo.attendanceSessions ?? [])];
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) throw new Error('Sesión no encontrada');
  sessions[idx] = { ...sessions[idx], ...changes };
  await updateRamo(ramoId, { attendanceSessions: sessions });
  return sessions[idx];
}

export async function removeAttendanceSession(ramoId, sessionId) {
  const ramo = await getRamo(ramoId);
  if (!ramo) return;
  const sessions = (ramo.attendance_sessions ?? ramo.attendanceSessions ?? []).filter(s => s.id !== sessionId);
  await updateRamo(ramoId, { attendanceSessions: sessions });
}
