import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ── camelCase transformer ──────────────────────────────────────
// PostgREST returns snake_case column names. This recursively converts
// them to camelCase so page components work without changes.
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function deepCamelCase(obj) {
  if (Array.isArray(obj)) return obj.map(deepCamelCase);
  if (obj !== null && typeof obj === 'object') {
    const result = Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), deepCamelCase(v)])
    );
    // Alias id → _id so legacy page code using ._id keeps working
    if (result.id !== undefined && result._id === undefined) result._id = result.id;
    return result;
  }
  return obj;
}

// ── Storage helpers ────────────────────────────────────────────
const BUCKET = 'rivers-uploads';

export async function uploadFile(file, folder = 'general') {
  const ext  = file.name.split('.').pop();
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(name, file);
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return { url: data.publicUrl };
}
