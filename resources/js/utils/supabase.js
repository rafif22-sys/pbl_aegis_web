// resources/js/utils/supabase.js

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL    ?? "https://dwyfjwwgrtdspgdaifyv.supabase.co";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? "aegis";

export const SUPABASE_LOGO =
    `${SUPABASE_URL}/storage/v1/object/public/logo/new_logo.png`;

/**
 * Converts a relative Supabase storage path to a full public URL.
 * Returns null when path is falsy.
 */
export function getFotoUrl(path) {
    if (!path) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}