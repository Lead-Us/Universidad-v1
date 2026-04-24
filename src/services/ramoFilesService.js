/**
 * ramoFilesService.js
 * Supabase-backed file storage for ramo files.
 * Bucket: ramo-files  (private)
 * Table:  ramo_files
 */
import { supabase, getUid } from '../lib/supabase.js';

const BUCKET = 'ramo-files';
const MAX_SIZE_MB = 50;

export const MAX_SIZE_B = MAX_SIZE_MB * 1024 * 1024;

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function getFiles(ramoId) {
  const { data, error } = await supabase
    .from('ramo_files')
    .select('*')
    .eq('ramo_id', ramoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFileRecord({ ramoId, folder, name, size, storagePath, publicUrl, isPrograma = false }) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('ramo_files')
    .insert({
      user_id:      uid,
      ramo_id:      ramoId,
      folder:       folder ?? 'todos',
      name,
      size:         size ?? 0,
      storage_path: storagePath,
      public_url:   publicUrl,
      is_programa:  isPrograma,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setProgramaFile(ramoId, fileId) {
  // Unset existing programa, then set new one
  await supabase.from('ramo_files').update({ is_programa: false }).eq('ramo_id', ramoId).eq('is_programa', true);
  if (fileId) {
    const { error } = await supabase.from('ramo_files').update({ is_programa: true }).eq('id', fileId);
    if (error) throw error;
  }
}

export async function moveFile(id, newFolder) {
  const { error } = await supabase
    .from('ramo_files')
    .update({ folder: newFolder })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteFileRecord(id, storagePath) {
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }
  const { error } = await supabase.from('ramo_files').delete().eq('id', id);
  if (error) throw error;
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function uploadRamoFile(ramoId, file) {
  const uid = await getUid();
  const ext  = file.name.split('.').pop();
  const path = `${uid}/${ramoId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });
  if (uploadErr) throw uploadErr;

  return { path, publicUrl: null };
}

export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60); // 1 hour
  if (error) throw error;
  return data.signedUrl;
}

// ── Folder management (stored as a separate table or derived from files) ──────
// Folders are stored in ramo_file_folders table. If a folder has no files, it's still kept.

export async function getFolders(ramoId) {
  const { data, error } = await supabase
    .from('ramo_file_folders')
    .select('*')
    .eq('ramo_id', ramoId)
    .order('created_at', { ascending: true });
  if (error) {
    // Fallback: if table doesn't exist yet, return default folders
    return getDefaultFolders();
  }
  return data?.length ? data : getDefaultFolders();
}

export function getDefaultFolders() {
  return [
    { key: 'todos',                label: '📁 Todos los archivos',   locked: true  },
    { key: 'evaluaciones_pasadas', label: '📄 Evaluaciones Pasadas', locked: false },
    { key: 'ejercicios',           label: '✏️ Ejercicios',           locked: false },
    { key: 'ppt',                  label: '📊 PPT',                  locked: false },
  ];
}

export async function addFolder(ramoId, label) {
  const uid = await getUid();
  const key = `folder_${Date.now()}`;
  const { data, error } = await supabase
    .from('ramo_file_folders')
    .insert({ user_id: uid, ramo_id: ramoId, key, label: `📁 ${label}`, locked: false })
    .select()
    .single();
  if (error) {
    // Table may not exist — return local object
    return { key, label: `📁 ${label}`, locked: false };
  }
  return data;
}

export async function renameFolder(ramoId, key, newLabel) {
  const { error } = await supabase
    .from('ramo_file_folders')
    .update({ label: newLabel })
    .eq('ramo_id', ramoId)
    .eq('key', key);
  if (error) throw error;
}

export async function deleteFolderRecord(ramoId, key) {
  await supabase.from('ramo_file_folders').delete().eq('ramo_id', ramoId).eq('key', key);
}
