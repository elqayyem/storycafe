-- =============================================
-- StoryCafe — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id             SERIAL PRIMARY KEY,
  name_ar        TEXT NOT NULL,
  name_en        TEXT,
  icon           TEXT DEFAULT '☕',
  image_url      TEXT,
  display_order  INT DEFAULT 0,
  is_active      BOOL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  category_id    INT REFERENCES categories(id) ON DELETE CASCADE,
  name_ar        TEXT,
  name_en        TEXT NOT NULL,
  price          INT NOT NULL,
  image_url      TEXT,
  description    TEXT,
  is_available   BOOL DEFAULT TRUE,
  is_featured    BOOL DEFAULT FALSE,
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  order_number   TEXT UNIQUE DEFAULT ('SC-' || to_char(NOW(), 'YYYYMMDD') || '-' || floor(random()*9000+1000)::text),
  items          JSONB NOT NULL DEFAULT '[]',
  total_price    INT DEFAULT 0,
  customer_name  TEXT,
  customer_phone TEXT,
  notes          TEXT,
  status         TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can read categories and available products
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "public_read_products" ON products
  FOR SELECT USING (is_available = TRUE);

-- Allow insert on orders from public (for placing orders)
CREATE POLICY "public_insert_orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

-- Admin can do everything (service_role key bypasses RLS)
-- For the admin dashboard, use the service_role key or create
-- a separate policy with authentication.

-- Seed categories
INSERT INTO categories (name_ar, name_en, icon, image_url, display_order) VALUES
  ('مشروبات باردة', 'Cold Drinks',            '🥤', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', 1),
  ('سموزي',         'Smoothie',               '🍓', 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80', 2),
  ('فرابيه',        'Frappe',                 '☕', 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', 3),
  ('ايس كريم',      'Ice Cream',              '🍦', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80', 4),
  ('تشكيلة لاتيه', 'Coffee Latte Collection', '☕', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', 5),
  ('حلويات',        'Desserts',               '🍰', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', 6),
  ('مشروبات ساخنة', 'Hot Drinks',             '🔥', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', 7)
ON CONFLICT DO NOTHING;

-- Seed products (Cold Drinks — category 1)
INSERT INTO products (category_id, name_en, price, display_order) VALUES
  (1, 'Ice Caramel Latte',        200000, 1),
  (1, 'Iced Toffee',              200000, 2),
  (1, 'Ice Lotus Latte',          200000, 3),
  (1, 'Banana Ice Latte',         250000, 4),
  (1, 'Iced Hazelnut Latte',      200000, 5),
  (1, 'Ice Salted Caramel Latte', 200000, 6),
  (1, 'Ice Mocha Latte',          250000, 7),
  (1, 'Ice Vanilla Latte',        200000, 8),
  (1, 'Ice Blue Curaçao',         150000, 9),
  (1, 'Ice Strawberry',           150000, 10),
  (1, 'Lemon Mint',               150000, 11),
  (1, 'Iced Blueberry',           150000, 12),
  (1, 'Ice Bubble Gum',           150000, 13),
  (1, 'Ice Cherry',               150000, 14),
  (1, 'Ice Passion Fruit',        150000, 15),
  (1, 'Ice Grenadine',            150000, 16),
  (1, 'Ice Watermelon',           150000, 17),
  (1, 'Ice Pineapple',            150000, 18),
  (1, 'Iced Kiwi',                150000, 19),
  (1, 'Ice Coconut',              150000, 20),
  (1, 'Mojito',                   180000, 21),
  (1, 'Blue Mojito',              200000, 22),
  (1, 'Peach Mojito',             200000, 23),
  (1, 'Ice Strawberry Mojito',    200000, 24),
  (1, 'Ice Lavender',             150000, 25),
  (1, 'Ice Kiwi Mojito',          250000, 26),
  (1, 'Lemonade',                 150000, 27),
  (1, 'Jamaica',                  250000, 28),
  (1, 'Ice Tea Mango',            200000, 29),
  (1, 'Ice Mango Peach',          250000, 30),
  (1, 'Ice Tea Mango Peach',      250000, 31),
  (1, 'Iced Apple',               150000, 32),
  (1, 'Rainbow Paradise',         250000, 33),
  (1, 'Mango Kiwi',               250000, 34),
  (1, 'Kiwi Blue',                200000, 35),
  (1, 'Teal Titan',               250000, 36),
  (1, 'Tigers Blood',             250000, 37),
  (1, 'Tropical Smoothie',        300000, 38),
  (1, 'Mexican',                  150000, 39),
  (1, 'Sunset',                   200000, 40),
  (1, 'Blue Island',              300000, 41),
  (1, 'Milkshake Nutella',        250000, 42),
  (1, 'Milkshake Lotus',          250000, 43),
  (1, 'Milkshake Oreo',           250000, 44),
-- Smoothie (category 2)
  (2, 'Smoothie Mango',           200000, 1),
  (2, 'Raspberry Smoothie',       200000, 2),
  (2, 'Peach Smoothie',           200000, 3),
  (2, 'Blueberry Smoothie',       200000, 4),
  (2, 'Pineapple Smoothie',       200000, 5),
  (2, 'Lavender Smoothie',        200000, 6),
  (2, 'Smoothie Passion Fruit',   200000, 7),
  (2, 'Mango Peach Smoothie',     200000, 8),
  (2, 'Green Apple Smoothie',     200000, 9),
  (2, 'Smoothie Kiwi',            200000, 10),
  (2, 'Grenadine Smoothie',       200000, 11),
  (2, 'Watermelon Smoothie',      200000, 12),
  (2, 'Pineapple Smoothie',       200000, 13),
-- Frappe (category 3)
  (3, 'Caramel Frappe',           250000, 1),
  (3, 'Vanilla Frappe',           250000, 2),
  (3, 'Mocha Frappe',             250000, 3),
  (3, 'Oreo Frappe',              250000, 4),
-- Ice Cream (category 4)
  (4, 'Brownie Waffles Ice Cream', 250000, 1),
  (4, 'Small Ice Cream Cone',      50000, 2),
  (4, 'Ice Cream Cone',           100000, 3),
  (4, 'Ice Cream 1 Kilo',         800000, 4),
  (4, '500G Ice Cream',           400000, 5),
-- Coffee Latte Collection (category 5)
  (5, 'Latte',                    100000, 1),
  (5, 'Spanish Latte',            120000, 2),
  (5, 'Caramel Latte',            150000, 3),
  (5, 'Vanilla Latte',            150000, 4),
  (5, 'Toffee Latte',             150000, 5),
  (5, 'Hazelnut Latte',           150000, 6),
-- Desserts (category 6)
  (6, 'Nutella Tres Leches Cake',    300000, 1),
  (6, 'Lotus Tres Leches Cake',      350000, 2),
  (6, 'Pistachio Tres Leches Cake',  400000, 3),
  (6, 'Fruit Tres Leches Cake',      400000, 4),
  (6, 'Bomb Cake',                   350000, 5),
  (6, 'Nutella Cup Cake',            150000, 6),
  (6, 'Crunch Cheese Cake',          200000, 7),
  (6, 'Lotus Cup Cake',              150000, 8),
  (6, 'Pistachio Cup Cake',          180000, 9),
  (6, 'Caramel Cup Cake',            150000, 10),
  (6, 'Dark Chocolate Cup Cake',     150000, 11),
  (6, 'Lotus Cup',                   200000, 12),
  (6, 'Nutella Cup',                 200000, 13),
  (6, 'Strawberry Nutella Cup',      200000, 14),
-- Hot Drinks (category 7)
  (7, 'Espresso',       70000, 1),
  (7, 'Nescafé',       100000, 2),
  (7, 'Cappuccino',    100000, 3),
  (7, 'Coca',          100000, 4),
  (7, 'Hot Caramel',   150000, 5),
  (7, 'Mocha',         150000, 6),
  (7, 'Pistachio',     180000, 7),
  (7, 'Lotus',         150000, 8),
  (7, 'Zebra',         180000, 9),
  (7, 'Oreo',          200000, 10),
  (7, 'Hot Nutella',   150000, 11),
  (7, 'Hot Chocolate', 100000, 12)
ON CONFLICT DO NOTHING;
