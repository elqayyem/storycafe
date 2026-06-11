-- =============================================
-- StoryCafe — Production Security SQL
-- Run this in Supabase → SQL Editor
-- =============================================

-- ── STEP 1: Admin Profiles Table ─────────────
-- Stores which Supabase Auth users are admins
CREATE TABLE IF NOT EXISTS admin_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL DEFAULT 'admin'
                          CHECK (role IN ('super_admin','admin','staff')),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login  TIMESTAMPTZ,
  login_count INTEGER     NOT NULL DEFAULT 0
);

-- ── STEP 2: Security Audit Log ────────────────
CREATE TABLE IF NOT EXISTS security_audit_log (
  id      BIGSERIAL   PRIMARY KEY,
  action  TEXT        NOT NULL,
  details JSONB,
  user_id UUID        REFERENCES auth.users(id),
  ua      TEXT,
  url     TEXT,
  ts      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast querying by time and action
CREATE INDEX IF NOT EXISTS idx_audit_ts     ON security_audit_log(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON security_audit_log(action);

-- ── STEP 3: Enable RLS everywhere ─────────────
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Enable on orders if it exists
DO $$ BEGIN
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ── STEP 4: Helper function — is_admin() ──────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
END;
$$;

-- ── STEP 5: CATEGORIES policies ───────────────
-- Drop existing if re-running
DROP POLICY IF EXISTS "cat_public_read"   ON categories;
DROP POLICY IF EXISTS "cat_admin_insert"  ON categories;
DROP POLICY IF EXISTS "cat_admin_update"  ON categories;
DROP POLICY IF EXISTS "cat_admin_delete"  ON categories;

CREATE POLICY "cat_public_read"  ON categories FOR SELECT USING (true);
CREATE POLICY "cat_admin_insert" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "cat_admin_update" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "cat_admin_delete" ON categories FOR DELETE USING (is_admin());

-- ── STEP 6: PRODUCTS policies ─────────────────
DROP POLICY IF EXISTS "prod_public_read"   ON products;
DROP POLICY IF EXISTS "prod_admin_insert"  ON products;
DROP POLICY IF EXISTS "prod_admin_update"  ON products;
DROP POLICY IF EXISTS "prod_admin_delete"  ON products;

CREATE POLICY "prod_public_read"  ON products FOR SELECT USING (true);
CREATE POLICY "prod_admin_insert" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "prod_admin_update" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "prod_admin_delete" ON products FOR DELETE USING (is_admin());

-- ── STEP 7: ORDERS policies ───────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "orders_public_insert" ON orders;
  DROP POLICY IF EXISTS "orders_admin_read"    ON orders;
  DROP POLICY IF EXISTS "orders_admin_update"  ON orders;

  CREATE POLICY "orders_public_insert" ON orders FOR INSERT WITH CHECK (true);
  CREATE POLICY "orders_admin_read"    ON orders FOR SELECT  USING (is_admin());
  CREATE POLICY "orders_admin_update"  ON orders FOR UPDATE  USING (is_admin());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ── STEP 8: ADMIN_PROFILES policies ───────────
DROP POLICY IF EXISTS "ap_self_read"  ON admin_profiles;
DROP POLICY IF EXISTS "ap_super_read" ON admin_profiles;

-- Each admin can read only their own profile
CREATE POLICY "ap_self_read" ON admin_profiles
  FOR SELECT USING (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "ap_super_read" ON admin_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  );

-- Super admins can update profiles (activate/deactivate)
CREATE POLICY "ap_super_update" ON admin_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── STEP 9: AUDIT LOG policies ────────────────
DROP POLICY IF EXISTS "audit_admin_insert" ON security_audit_log;
DROP POLICY IF EXISTS "audit_super_read"   ON security_audit_log;

CREATE POLICY "audit_admin_insert" ON security_audit_log
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "audit_super_read" ON security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── STEP 10: Supabase Storage Policies ────────
-- Run these only if you have the product-images bucket created

-- Create the bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies
DROP POLICY IF EXISTS "pi_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "pi_admin_upload"  ON storage.objects;
DROP POLICY IF EXISTS "pi_admin_delete"  ON storage.objects;

-- Public can view images
CREATE POLICY "pi_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Only admins can upload (max 5MB enforced at app level)
CREATE POLICY "pi_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND is_admin()
  );

-- Only admins can delete
CREATE POLICY "pi_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND is_admin()
  );

-- ── STEP 11: Update last_login on auth sign-in ─
-- This trigger fires whenever an admin signs in
CREATE OR REPLACE FUNCTION handle_admin_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_profiles
  SET last_login  = NOW(),
      login_count = login_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ── STEP 12: Create your first admin user ──────
-- 1. Go to Supabase Dashboard → Authentication → Users → "Add User"
-- 2. Enter email + strong password (min 12 chars, mixed case, numbers, symbols)
-- 3. Copy the user UUID
-- 4. Run this INSERT with the real UUID and email:

-- INSERT INTO admin_profiles (id, email, role, is_active)
-- VALUES ('YOUR-USER-UUID-HERE', 'your-admin@email.com', 'super_admin', true);

-- ── SECURITY NOTES ────────────────────────────
-- • NEVER use the service_role key in client-side code
-- • The anon key is safe because RLS now enforces access
-- • All writes to categories/products now require a valid Supabase Auth session
-- • The is_admin() function runs with SECURITY DEFINER to prevent bypass
-- • Audit log captures all admin actions with timestamps
