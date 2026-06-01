import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { CONFIG } from '../config.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://dungoonanddragoon.github.io/Homebrew-Sheets/' },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

// ── Characters ───────────────────────────────────────────────────────────────

export async function getMyCharacters(userId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCharacter(characterId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();
  if (error) throw error;
  return data;
}

export async function saveCharacter(character, userId) {
  const payload = {
    ...character,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  if (character.id) {
    const { data, error } = await supabase
      .from('characters')
      .update(payload)
      .eq('id', character.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('characters')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteCharacter(characterId) {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);
  if (error) throw error;
}

// ── DM: view all characters in campaign ──────────────────────────────────────

export async function getAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Homebrew content (DM only) ───────────────────────────────────────────────

export async function getHomebrew(type) {
  const { data, error } = await supabase
    .from('homebrew')
    .select('*')
    .eq('type', type)
    .order('name');
  if (error) throw error;
  return data;
}

export async function getAllHomebrew() {
  const { data, error } = await supabase
    .from('homebrew')
    .select('*')
    .order('type', { ascending: true });
  if (error) throw error;
  return data;
}

export async function saveHomebrew(item) {
  if (item.id) {
    const { data, error } = await supabase
      .from('homebrew')
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('homebrew')
      .insert({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteHomebrew(id) {
  const { error } = await supabase.from('homebrew').delete().eq('id', id);
  if (error) throw error;
}

// ── DM role check ─────────────────────────────────────────────────────────────

export async function isDM(userId) {
  const { data, error } = await supabase
    .from('dm_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
