/**
 * aprendizajeService.js
 * Cuadernos  → learning_models (existing table)
 * Bloques    → aprender_blocks
 * Fuentes    → aprender_block_sources
 * Chat       → aprender_block_chats
 */
import { supabase, getUid } from '../lib/supabase.js';

// ── Cuadernos ─────────────────────────────────────────────────────────────────

export async function getCuadernos() {
  const { data, error } = await supabase
    .from('learning_models')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCuaderno({ name, description = '', color = '#4f8ef7', ramoId = null }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('learning_models')
    .insert({ user_id: uid, name, description, color, ramo_id: ramoId || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCuaderno(id, changes) {
  const { data, error } = await supabase
    .from('learning_models')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCuaderno(id) {
  const { error } = await supabase.from('learning_models').delete().eq('id', id);
  if (error) throw error;
}

// ── Bloques ───────────────────────────────────────────────────────────────────

export async function getBloques(notebookId) {
  const { data, error } = await supabase
    .from('aprender_blocks')
    .select('*')
    .eq('project_id', notebookId)
    .order('order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBloque({ notebookId, title, order }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_blocks')
    .insert({ user_id: uid, project_id: notebookId, title, order })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBloque(id, changes) {
  const { data, error } = await supabase
    .from('aprender_blocks')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBloque(id) {
  const { error } = await supabase.from('aprender_blocks').delete().eq('id', id);
  if (error) throw error;
}

// ── Fuentes ───────────────────────────────────────────────────────────────────

export async function getFuentes(blockId) {
  const { data, error } = await supabase
    .from('aprender_block_sources')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFuente({ blockId, type, name, content = null, url = null, filePath = null, instructions = '' }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_block_sources')
    .insert({ user_id: uid, block_id: blockId, type, name, content, url, file_path: filePath, instructions })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFuente(id, changes) {
  const { data, error } = await supabase
    .from('aprender_block_sources')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFuente(id) {
  const { error } = await supabase.from('aprender_block_sources').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadFuente(blockId, file) {
  const uid = await getUid();
  const ext  = file.name.split('.').pop();
  const path = `${uid}/${blockId}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('aprender-files')
    .upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;
  const { data: { publicUrl } } = supabase.storage.from('aprender-files').getPublicUrl(path);
  return { path, publicUrl };
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function getMensajes(blockId) {
  const { data, error } = await supabase
    .from('aprender_block_chats')
    .select('*')
    .eq('block_id', blockId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMensaje({ blockId, role, content }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('aprender_block_chats')
    .insert({ user_id: uid, block_id: blockId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearMensajes(blockId) {
  const { error } = await supabase
    .from('aprender_block_chats')
    .delete()
    .eq('block_id', blockId);
  if (error) throw error;
}

// ── Block count helper (for cuaderno cards) ───────────────────────────────────

export async function getBloquesCount(notebookId) {
  const { count, error } = await supabase
    .from('aprender_blocks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', notebookId);
  if (error) return 0;
  return count ?? 0;
}

// ── Demo content for new users ────────────────────────────────────────────────

export async function createDemoContent() {
  // Only create if the user has no notebooks yet
  const existing = await getCuadernos();
  if (existing.length > 0) return null;

  const cuaderno = await createCuaderno({
    name: 'Guía de la App',
    description: 'Tu punto de partida — aprende cómo funciona Aprender con este bloque de prueba.',
    color: '#7c3aed',
  });

  const bloque = await createBloque({
    notebookId: cuaderno.id,
    title: 'Cómo usar Aprender',
    order: 0,
  });

  await addFuente({
    blockId: bloque.id,
    type: 'text',
    name: 'Tutorial rápido',
    content: `# Bienvenido a Aprender

Aprender es tu asistente de estudio con IA. Aquí te explicamos cómo funciona:

## 1. Crea un Cuaderno
Un cuaderno es un espacio para un ramo o tema. Puedes tener tantos como quieras y asociarlos a un ramo específico.

## 2. Agrega Bloques
Dentro de cada cuaderno, crea bloques por tema o unidad. Este bloque ("Cómo usar Aprender") es tu primer ejemplo.

## 3. Sube tus fuentes
En cada bloque puedes agregar apuntes, PDFs, URLs o texto como fuentes de estudio.

## 4. Conversa con la IA
Usa el chat del bloque para hacerle preguntas a la IA sobre el material que subiste. La IA responde basándose en tus fuentes.

---
Puedes eliminar este cuaderno cuando ya no lo necesites y crear los tuyos propios.`,
    instructions: '',
  });

  return cuaderno;
}

// ── AI Memory ─────────────────────────────────────────────────────────────────

export async function getBlockMemory(blockId) {
  const { data } = await supabase
    .from('aprender_block_memory')
    .select('content')
    .eq('block_id', blockId)
    .maybeSingle();
  return data?.content ?? '';
}

export async function upsertBlockMemory(blockId, content) {
  const uid = await getUid();
  const { error } = await supabase
    .from('aprender_block_memory')
    .upsert(
      { user_id: uid, block_id: blockId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,block_id' }
    );
  if (error) throw error;
}

export async function getProjectMemory(projectId) {
  const { data } = await supabase
    .from('aprender_project_memory')
    .select('content')
    .eq('project_id', projectId)
    .maybeSingle();
  return data?.content ?? '';
}

export async function upsertProjectMemory(projectId, content) {
  const uid = await getUid();
  const { error } = await supabase
    .from('aprender_project_memory')
    .upsert(
      { user_id: uid, project_id: projectId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,project_id' }
    );
  if (error) throw error;
}

// ── Compatibility aliases (for Notebook.jsx / NotebookWorkspace) ──────────────
export const getLearningModels = getCuadernos;

export async function getSubmodules(modelId) {
  const { data, error } = await supabase
    .from('learning_submodules')
    .select('*')
    .eq('model_id', modelId)
    .order('order');
  if (error) throw error;
  return data ?? [];
}
