// =============================================
// StoryCafe — Security Module v1.0
// Loaded on every page before all other scripts
// =============================================
'use strict';

const Security = (() => {

  // ═══════════════════════════════════════════
  // 1. HTML SANITIZATION — prevents XSS
  // ═══════════════════════════════════════════
  // Uses the browser's own DOM parser: textContent → innerHTML
  // converts <script>alert(1)</script> → &lt;script&gt;alert(1)&lt;/script&gt;
  function sanitize(dirty) {
    if (dirty === null || dirty === undefined) return '';
    if (typeof dirty === 'number') return String(dirty);
    const el = document.createElement('div');
    el.textContent = String(dirty);
    return el.innerHTML;
  }

  // Stricter: for use inside HTML attributes (href, src, data-*)
  function sanitizeAttr(dirty) {
    if (!dirty && dirty !== 0) return '';
    return String(dirty)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, '&#x60;');
  }

  // URL sanitization — block javascript: data:text/html blob: etc.
  function sanitizeURL(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(s)) return s;
    if (/^https?:\/\//i.test(s)) return s;
    return '';
  }

  // ═══════════════════════════════════════════
  // 2. INPUT VALIDATION
  // ═══════════════════════════════════════════
  function validateInput(value, rules = {}) {
    const errors = [];
    const val = String(value ?? '').trim();

    if (rules.required && !val)                              errors.push('هذا الحقل مطلوب');
    if (rules.minLength && val.length < rules.minLength)     errors.push(`الحد الأدنى ${rules.minLength} أحرف`);
    if (rules.maxLength && val.length > rules.maxLength)     errors.push(`الحد الأقصى ${rules.maxLength} حرفاً`);
    if (rules.pattern && !rules.pattern.test(val))           errors.push(rules.patternMsg || 'تنسيق غير صحيح');
    if (rules.min !== undefined && Number(val) < rules.min)  errors.push(`القيمة الدنيا ${rules.min}`);
    if (rules.max !== undefined && Number(val) > rules.max)  errors.push(`القيمة القصوى ${rules.max}`);
    if (rules.numeric && !/^\d+(\.\d+)?$/.test(val))         errors.push('أرقام فقط');

    // Block script injection in ANY input
    if (/<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i.test(val))
      errors.push('محتوى غير مسموح');

    return { valid: errors.length === 0, errors };
  }

  // ═══════════════════════════════════════════
  // 3. BRUTE-FORCE PROTECTION
  // Uses sessionStorage so it survives tab refreshes but not new sessions
  // ═══════════════════════════════════════════
  const BF_KEY = '_sc_bf';
  const BF_MAX = 5;
  // Exponential lockout: 1m → 5m → 15m → 30m
  const BF_DURATIONS = [60e3, 5*60e3, 15*60e3, 30*60e3];

  const bruteForce = {
    _get() {
      try { return JSON.parse(sessionStorage.getItem(BF_KEY) || '{"n":0,"locks":0,"until":0}'); }
      catch { return { n: 0, locks: 0, until: 0 }; }
    },
    _set(d) { try { sessionStorage.setItem(BF_KEY, JSON.stringify(d)); } catch {} },

    check() {
      const d = this._get();
      const now = Date.now();
      if (d.until > now) {
        return { locked: true, remaining: Math.ceil((d.until - now) / 60000) };
      }
      if (d.until && d.until <= now) this._set({ n: 0, locks: d.locks, until: 0 });
      return { locked: false, remaining: Math.max(0, BF_MAX - d.n) };
    },

    increment() {
      const d = this._get();
      d.n = (d.n || 0) + 1;
      if (d.n >= BF_MAX) {
        const idx = Math.min(d.locks, BF_DURATIONS.length - 1);
        d.until = Date.now() + BF_DURATIONS[idx];
        d.locks = (d.locks || 0) + 1;
        d.n = 0;
      }
      this._set(d);
      return this.check();
    },

    reset() { sessionStorage.removeItem(BF_KEY); },
  };

  // ═══════════════════════════════════════════
  // 4. RATE LIMITER — in-memory sliding window
  // ═══════════════════════════════════════════
  const _rl = {};
  function rateLimit(key, max = 10, windowMs = 60000) {
    const now = Date.now();
    _rl[key] = (_rl[key] || []).filter(t => now - t < windowMs);
    if (_rl[key].length >= max) {
      const retry = Math.ceil((windowMs - (now - _rl[key][0])) / 1000);
      return { allowed: false, retryAfter: retry };
    }
    _rl[key].push(now);
    return { allowed: true, remaining: max - _rl[key].length };
  }

  // ═══════════════════════════════════════════
  // 5. AUTO-LOGOUT ON INACTIVITY
  // ═══════════════════════════════════════════
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 min
  const WARN_BEFORE  = 2  * 60 * 1000; // warn 2 min before
  let _idleTimer = null, _warnTimer = null, _cbLogout = null, _cbWarn = null;

  const autoLogout = {
    start(onLogout, onWarn) {
      _cbLogout = onLogout;
      _cbWarn   = onWarn;
      const EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
      EVENTS.forEach(ev => document.addEventListener(ev, () => this._reset(), { passive: true }));
      this._reset();
    },
    _reset() {
      clearTimeout(_idleTimer);
      clearTimeout(_warnTimer);
      _warnTimer  = setTimeout(() => { if (_cbWarn)   _cbWarn(); },   IDLE_TIMEOUT - WARN_BEFORE);
      _idleTimer  = setTimeout(() => { if (_cbLogout) _cbLogout(); }, IDLE_TIMEOUT);
    },
    stop() { clearTimeout(_idleTimer); clearTimeout(_warnTimer); }
  };

  // ═══════════════════════════════════════════
  // 6. AUDIT LOGGING
  // ═══════════════════════════════════════════
  const _queue = [];

  const audit = {
    async log(action, details = {}) {
      const entry = {
        action: String(action).substring(0, 100),
        details: JSON.stringify(details).substring(0, 2000),
        ua: navigator.userAgent.substring(0, 200),
        url: window.location.pathname,
        ts: new Date().toISOString(),
      };
      _queue.push(entry);
      // Non-blocking console record
      console.info('[AUDIT]', action, details);
      // Persist to Supabase if available
      try {
        if (typeof supabase !== 'undefined' && supabase) {
          await supabase.from('security_audit_log').insert([entry]);
          _queue.pop();
        }
      } catch { /* keep in queue, don't crash */ }
    }
  };

  // ═══════════════════════════════════════════
  // 7. FILE UPLOAD VALIDATION
  // ═══════════════════════════════════════════
  const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB
  const DANGEROUS_EXT = /\.(php|js|html?|exe|sh|bat|cmd|ps1|py|rb|pl|cgi|svg|xml|json)$/i;

  function validateFile(file) {
    const errs = [];
    if (!file) return { valid: false, errors: ['لم يتم اختيار ملف'] };

    if (!ALLOWED_MIME.includes(file.type.toLowerCase()))
      errs.push(`نوع الملف غير مسموح: ${file.type}. استخدم JPG أو PNG أو WEBP`);

    if (file.size > MAX_BYTES)
      errs.push(`حجم الملف كبير جداً: ${(file.size/1024/1024).toFixed(1)}MB. الحد الأقصى 5MB`);

    if (DANGEROUS_EXT.test(file.name))
      errs.push('امتداد الملف غير مسموح');

    if (/\.\.|[/\\]/.test(file.name))
      errs.push('اسم الملف غير صالح');

    return { valid: errs.length === 0, errors: errs };
  }

  // Verify real file type via magic bytes (first 4 bytes)
  function verifyMagicBytes(file) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = e => {
        const b = new Uint8Array(e.target.result);
        const jpeg = b[0]===0xFF && b[1]===0xD8 && b[2]===0xFF;
        const png  = b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47;
        const webp = b[0]===0x52 && b[1]===0x49 && b[2]===0x46 && b[3]===0x46;
        const gif  = b[0]===0x47 && b[1]===0x49 && b[2]===0x46 && b[3]===0x38;
        resolve({ valid: jpeg || png || webp || gif });
      };
      r.onerror = () => resolve({ valid: false });
      r.readAsArrayBuffer(file.slice(0, 8));
    });
  }

  // ═══════════════════════════════════════════
  // 8. CSRF TOKEN (per-session)
  // ═══════════════════════════════════════════
  let _token = null;
  const csrf = {
    get() {
      if (!_token) {
        const buf = new Uint8Array(32);
        crypto.getRandomValues(buf);
        _token = Array.from(buf).map(b => b.toString(16).padStart(2,'0')).join('');
        sessionStorage.setItem('_sc_csrf', _token);
      }
      return _token;
    },
    verify(t) {
      const stored = sessionStorage.getItem('_sc_csrf');
      return !!(stored && t && t === stored);
    },
    rotate() {
      _token = null;
      sessionStorage.removeItem('_sc_csrf');
      return this.get();
    }
  };

  // ═══════════════════════════════════════════
  // 9. SESSION HELPER
  // ═══════════════════════════════════════════
  const session = {
    async isValid() {
      if (typeof supabase !== 'undefined' && supabase) {
        try {
          const { data: { session: s } } = await supabase.auth.getSession();
          return !!s;
        } catch { return false; }
      }
      return sessionStorage.getItem('sc_admin') === '1';
    }
  };

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════
  return { sanitize, sanitizeAttr, sanitizeURL, validateInput, bruteForce, rateLimit, autoLogout, audit, validateFile, verifyMagicBytes, csrf, session };
})();
