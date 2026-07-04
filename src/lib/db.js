import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { CONFIG } from '../config.js';

// `cache: 'no-store'` guarantees every request goes to Supabase itself rather
// than being served from the browser's HTTP cache — otherwise a GET made
// right after a write (e.g. re-opening the Homebrew Editor) could return a
// stale, cached response and make a successful save look like it "reverted".
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});

// Wraps a Supabase/Postgrest error with its full detail (message, details,
// hint, code) so failures — especially RLS permission denials — are visible
// instead of surfacing as a vague generic message.
function describeError(error) {
  if (!error) return null;
  const parts = [error.message];
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(`Hint: ${error.hint}`);
  if (error.code) parts.push(`(code ${error.code})`);
  const err = new Error(parts.filter(Boolean).join(' — '));
  err.original = error;
  return err;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://dungoonanddragoon.github.io/Homebrew-Sheets/' },
  });
  if (error) throw describeError(error);
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
  if (error) throw describeError(error);
  return data;
}

export async function getCharacter(characterId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();
  if (error) throw describeError(error);
  return data;
}

export async function saveCharacter(character, userId) {
  if (character.id) {
    // UPDATE — never overwrite user_id; the row belongs to the player.
    // DMs editing a character must not claim ownership via their own userId.
    const { id, user_id, created_at, ...updateFields } = character;
    const payload = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('characters')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw describeError(error);
    return data;
  } else {
    // INSERT — new character, assign to the creating user
    const payload = {
      ...character,
      user_id: userId,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('characters')
      .insert(payload)
      .select()
      .single();
    if (error) throw describeError(error);
    return data;
  }
}

export async function deleteCharacter(characterId) {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);
  if (error) throw describeError(error);
}

// ── DM: view all characters in campaign ──────────────────────────────────────

export async function getAllCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw describeError(error);
  return data;
}

// ── Homebrew content (DM only) ───────────────────────────────────────────────

export async function getHomebrew(type) {
  const { data, error } = await supabase
    .from('homebrew')
    .select('*')
    .eq('type', type)
    .order('name');
  if (error) throw describeError(error);
  return data;
}

export async function getAllHomebrew() {
  const { data, error } = await supabase
    .from('homebrew')
    .select('*')
    .order('type', { ascending: true });
  if (error) throw describeError(error);
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
    if (error) throw describeError(error);
    if (!data) throw new Error('Save appeared to succeed but no row was returned — the change may not have been saved. Please check your Supabase RLS policies.');
    return data;
  } else {
    const { data, error } = await supabase
      .from('homebrew')
      .insert({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw describeError(error);
    if (!data) throw new Error('Save appeared to succeed but no row was returned — the change may not have been saved. Please check your Supabase RLS policies.');
    return data;
  }
}

export async function deleteHomebrew(id) {
  const { error } = await supabase.from('homebrew').delete().eq('id', id);
  if (error) throw describeError(error);
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
