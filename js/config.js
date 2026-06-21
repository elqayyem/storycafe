// =============================================
// StoryCafe — Supabase Configuration
// =============================================
// Replace with your actual Supabase credentials:
// 1. Go to https://supabase.com → your project → Settings → API
// 2. Copy the Project URL and anon public key

const SUPABASE_URL = 'https://qljnzbehcanykfaedxsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsam56YmVoY2FueWtmYWVkeHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Nzk1NDUsImV4cCI6MjA5NzE1NTU0NX0.font6q-f3zYDMRlHa04--TZa63ZNgmlp3YV_f_r00iY';

// Initialize Supabase client (null if not configured).
// NOTE: the Supabase UMD library exposes a global named `supabase`. We must NOT
// redeclare it with `let supabase` (that throws a SyntaxError when the library
// is loaded before this file, e.g. on the admin page, which kills CONFIG). So we
// capture the library locally and expose the created client back on window.supabase.
let _sbClient = null;
try {
  var _sbLib = (typeof window !== 'undefined') ? window.supabase : null;
  if (
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_PUBLIC_KEY' &&
    _sbLib && typeof _sbLib.createClient === 'function'
  ) {
    _sbClient = _sbLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('%c[StoryCafe] Supabase connected ✓', 'color:#C69C6D;font-weight:bold');
  } else {
    console.log('%c[StoryCafe] Using local data (Supabase not configured)', 'color:#888');
  }
} catch (e) {
  console.warn('[StoryCafe] Supabase init failed, using local data:', e.message);
}
// Expose the client (or null) under the global name the rest of the app uses.
if (typeof window !== 'undefined') window.supabase = _sbClient;

// App-wide configuration
const CONFIG = {
  whatsappNumber: '96179331820',
  currency: 'ل.ل',
  storeName: 'StoryCafe',
  cacheKey: 'storycafe_menu_cache_v2',
  cacheTTL: 24 * 60 * 60 * 1000,       // 24 hours in ms
  searchDebounce: 300,                   // ms
  // Admin auth is handled entirely by Supabase Auth (email + password).
  // No admin password is stored in client code.
};
