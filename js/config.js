// =============================================
// StoryCafe — Supabase Configuration
// =============================================
// Replace with your actual Supabase credentials:
// 1. Go to https://supabase.com → your project → Settings → API
// 2. Copy the Project URL and anon public key

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

// Initialize Supabase client (null if not configured)
let supabase = null;
try {
  if (
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_PUBLIC_KEY' &&
    typeof window !== 'undefined' &&
    window.supabase
  ) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('%c[StoryCafe] Supabase connected ✓', 'color:#C69C6D;font-weight:bold');
  } else {
    console.log('%c[StoryCafe] Using local data (Supabase not configured)', 'color:#888');
  }
} catch (e) {
  console.warn('[StoryCafe] Supabase init failed, using local data:', e.message);
}

// App-wide configuration
const CONFIG = {
  whatsappNumber: '96179331820',
  currency: 'ل.ل',
  storeName: 'StoryCafe',
  cacheKey: 'storycafe_menu_cache_v2',
  cacheTTL: 24 * 60 * 60 * 1000,       // 24 hours in ms
  searchDebounce: 300,                   // ms
  adminPassword: 'ash2oush#$%543',
};
