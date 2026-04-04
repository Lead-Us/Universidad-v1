import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const USE_MOCK = false;

async function mockModels() {
  const { load } = await import('./localStore.js');
  const { MOCK_LEARNING_MODELS } = await import('./mockData.js');
  return load('uni_aprendizaje_models', () => JSON.parse(JSON.stringify(MOCK_LEARNING_MODELS)));
}
async function mockSubs() {
  const { load } = await import('./localStore.js');
  const { MOCK_SUBMODULES } = await import('./mockData.js');
  return load('uni_aprendizaje_submodules', () => JSON.parse(JSON.stringify(MOCK_SUBMODULES)));
}

// ── Learning Models ────────────────────────────────────────────────────────────

// seedAll=true: seed every mock model; seedAll=false: only seed models missing by name
export async function seedDefaultModels(seedAll = true) {
  const { MOCK_LEARNING_MODELS, MOCK_SUBMODULES } = await import('./mockData.js');
  const uid = await getUid();

  // Determine which models to seed
  let toSeed = MOCK_LEARNING_MODELS;
  if (!seedAll) {
    const { data: existing } = await supabase
      .from('learning_models').select('name').eq('user_id', uid);
    const existingNames = new Set((existing ?? []).map(m => m.name.toLowerCase()));
    toSeed = MOCK_LEARNING_MODELS.filter(m => !existingNames.has(m.name.toLowerCase()));
  }

  for (const mock of toSeed) {
    const { data: model, error: mErr } = await supabase.from('learning_models').insert({
      user_id:     uid,
      name:        mock.name,
      description: mock.description ?? '',
      color:       mock.color ?? '#3B82F6',
    }).select().single();
    if (mErr) throw mErr;
    const subs = MOCK_SUBMODULES[mock.id] ?? [];
    for (const sub of subs) {
      const { error: sErr } = await supabase.from('learning_submodules').insert({
        user_id:        uid,
        model_id:       model.id,
        name:           sub.name,
        order:          sub.order ?? 0,
        prompt_content: sub.prompt_content ?? '',
      });
      if (sErr) throw sErr;
    }
  }
}

export async function getLearningModels() {
  if (USE_MOCK) {
    const db = await mockModels();
    return [...db];
  }
  const { data, error } = await supabase.from('learning_models').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function createLearningModel(model) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const dbM = await mockModels();
    const dbS = await mockSubs();
    const nuevo = { ...model, id: uuidv4() };
    dbM.push(nuevo);
    dbS[nuevo.id] = [];
    save('uni_aprendizaje_models', dbM);
    save('uni_aprendizaje_submodules', dbS);
    return nuevo;
  }
  const uid = await getUid();
  const { data, error } = await supabase.from('learning_models').insert({
    user_id:     uid,
    name:        model.name,
    description: model.description ?? '',
    color:       model.color ?? '#3B82F6',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateLearningModel(id, changes) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockModels();
    const idx = db.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Modelo no encontrado');
    db[idx] = { ...db[idx], ...changes };
    save('uni_aprendizaje_models', db);
    return db[idx];
  }
  const { data, error } = await supabase
    .from('learning_models').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLearningModel(id) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const dbM = await mockModels();
    const dbS = await mockSubs();
    const idx = dbM.findIndex(m => m.id === id);
    if (idx !== -1) dbM.splice(idx, 1);
    delete dbS[id];
    save('uni_aprendizaje_models', dbM);
    save('uni_aprendizaje_submodules', dbS);
    return;
  }
  const { error } = await supabase.from('learning_models').delete().eq('id', id);
  if (error) throw error;
}

// ── Submodules ─────────────────────────────────────────────────────────────────

export async function getSubmodules(modelId) {
  if (USE_MOCK) {
    const db = await mockSubs();
    return db[modelId] ? [...db[modelId]].sort((a, b) => a.order - b.order) : [];
  }
  const { data, error } = await supabase
    .from('learning_submodules').select('*').eq('model_id', modelId).order('order');
  if (error) throw error;
  return data;
}

export async function createSubmodule(submodule) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockSubs();
    const nuevo = { ...submodule, id: uuidv4() };
    if (!db[submodule.model_id]) db[submodule.model_id] = [];
    db[submodule.model_id].push(nuevo);
    save('uni_aprendizaje_submodules', db);
    return nuevo;
  }
  const uid = await getUid();
  const { data, error } = await supabase.from('learning_submodules').insert({
    user_id:        uid,
    model_id:       submodule.model_id,
    name:           submodule.name,
    order:          submodule.order ?? 0,
    prompt_content: submodule.prompt_content ?? '',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateSubmodule(id, modelId, changes) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockSubs();
    const list = db[modelId] ?? [];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Sub-módulo no encontrado');
    list[idx] = { ...list[idx], ...changes };
    save('uni_aprendizaje_submodules', db);
    return list[idx];
  }
  const { data, error } = await supabase
    .from('learning_submodules').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSubmodule(id, modelId) {
  if (USE_MOCK) {
    const { save } = await import('./localStore.js');
    const db = await mockSubs();
    const list = db[modelId] ?? [];
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) list.splice(idx, 1);
    save('uni_aprendizaje_submodules', db);
    return;
  }
  const { error } = await supabase.from('learning_submodules').delete().eq('id', id);
  if (error) throw error;
}

// ── Aprender Blocks ───────────────────────────────────────────────────────────

export async function getBlocks(projectId) {
  const { data, error } = await supabase
    .from('aprender_blocks')
    .select('*')
    .eq('project_id', projectId)
    .order('order');
  if (error) throw error;
  return data ?? [];
}

export async function createBlock({ projectId, title, order }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_blocks')
    .insert({ user_id: uid, project_id: projectId, title, order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBlock(id, changes) {
  const { data, error } = await supabase
    .from('aprender_blocks')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBlock(id) {
  const { error } = await supabase.from('aprender_blocks').delete().eq('id', id);
  if (error) throw error;
}

// ── Block Sources ─────────────────────────────────────────────────────────────

export async function getSources(blockId) {
  const { data, error } = await supabase
    .from('aprender_block_sources')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function addSource({ blockId, type, title, content, fileUrl, fileName }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_block_sources')
    .insert({
      user_id:   uid,
      block_id:  blockId,
      type,
      title:     title ?? '',
      content:   content ?? '',
      file_url:  fileUrl ?? null,
      file_name: fileName ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSource(id) {
  const { error } = await supabase.from('aprender_block_sources').delete().eq('id', id);
  if (error) throw error;
}

// ── Block Chats ───────────────────────────────────────────────────────────────

export async function getChatMessages(blockId) {
  const { data, error } = await supabase
    .from('aprender_block_chats')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function saveChatMessage({ blockId, role, content }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_block_chats')
    .insert({ user_id: uid, block_id: blockId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearChatHistory(blockId) {
  const { error } = await supabase
    .from('aprender_block_chats')
    .delete()
    .eq('block_id', blockId);
  if (error) throw error;
}

// ── File Upload to Supabase Storage ──────────────────────────────────────────

export async function uploadSourceFile(blockId, file) {
  const uid = await getUid();
  const ext  = file.name.split('.').pop();
  const path = `${uid}/${blockId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('aprender-files')
    .upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage
    .from('aprender-files')
    .getPublicUrl(path);

  return { path, publicUrl };
}
