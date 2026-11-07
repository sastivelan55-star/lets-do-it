// Environment configuration and validation
// Keep this clean and never bundle secrets.

export interface AppEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  openAiApiKey?: string;
  geminiApiKey?: string;
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const openAiApiKey = (import.meta.env.VITE_OPENAI_API_KEY || '').trim();
const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

// A project is considered configured if both URL and Anon key are present
// and not default placeholders.
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseAnonKey.includes('example-anon-key') &&
  !supabaseAnonKey.includes('your-anon-key-placeholder')
);

export const ENV: AppEnvConfig = {
  supabaseUrl,
  supabaseAnonKey,
  isConfigured: isSupabaseConfigured,
  openAiApiKey,
  geminiApiKey,
};
