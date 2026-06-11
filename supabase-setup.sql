-- =============================================
-- StoryCafe - Complete Supabase Setup (ONE FILE)
-- Paste ALL of this into Supabase > SQL Editor > New query > Run. Safe to re-run.
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT, icon TEXT DEFAULT '*',
  image_url TEXT, display_order INT DEFAULT 0, is_active BOOL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY, category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  name_ar TEXT, name_en TEXT NOT NULL, price INT NOT NULL, image_url TEXT,
  is_available BOOL DEFAULT TRUE, display_order INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY, items JSONB NOT NULL DEFAULT '[]', total_price INT DEFAULT 0,
  customer_name TEXT, customer_phone TEXT, notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW());

INSERT INTO categories (id, name_ar, name_en, icon, image_url, display_order) VALUES
  (1, 'مشروبات باردة', 'Cold Drinks', '🥤', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', 1),
  (2, 'سموزي', 'Smoothie', '🍓', 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80', 2),
  (3, 'فرابيه', 'Frappe', '☕', 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', 3),
  (4, 'ايس كريم', 'Ice Cream', '🍦', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80', 4),
  (5, 'تشكيلة لاتيه', 'Coffee Latte Collection', '☕', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', 5),
  (6, 'حلويات', 'Desserts', '🍰', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', 6),
  (7, 'مشروبات ساخنة', 'Hot Drinks', '🔥', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, category_id, name_ar, name_en, price, image_url, is_available, display_order) VALUES
  (1, 1, 'Ice Caramel Latte', 'Ice Caramel Latte', 200000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', TRUE, 1),
  (2, 1, 'Iced Toffee', 'Iced Toffee', 200000, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', TRUE, 2),
  (3, 1, 'Ice Lotus Latte', 'Ice Lotus Latte', 200000, 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80', TRUE, 3),
  (4, 1, 'Banana Ice Latte', 'Banana Ice Latte', 250000, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', TRUE, 4),
  (5, 1, 'Iced Hazelnut Latte', 'Iced Hazelnut Latte', 200000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80', TRUE, 5),
  (6, 1, 'Ice Salted Caramel Latte', 'Ice Salted Caramel Latte', 200000, 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', TRUE, 6),
  (7, 1, 'Ice Mocha Latte', 'Ice Mocha Latte', 250000, 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80', TRUE, 7),
  (8, 1, 'Ice Vanilla Latte', 'Ice Vanilla Latte', 200000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', TRUE, 8),
  (9, 1, 'Ice Blue Curaçao', 'Ice Blue Curaçao', 150000, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80', TRUE, 9),
  (10, 1, 'Ice Strawberry', 'Ice Strawberry', 150000, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', TRUE, 10),
  (11, 1, 'Lemon Mint', 'Lemon Mint', 150000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', TRUE, 11),
  (12, 1, 'Iced Blueberry', 'Iced Blueberry', 150000, 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80', TRUE, 12),
  (13, 1, 'Ice Bubble Gum', 'Ice Bubble Gum', 150000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', TRUE, 13),
  (14, 1, 'Ice Cherry', 'Ice Cherry', 150000, 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80', TRUE, 14),
  (15, 1, 'Ice Passion Fruit', 'Ice Passion Fruit', 150000, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80', TRUE, 15),
  (16, 1, 'Ice Grenadine', 'Ice Grenadine', 150000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', TRUE, 16),
  (17, 1, 'Ice Watermelon', 'Ice Watermelon', 150000, 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80', TRUE, 17),
  (18, 1, 'Ice Pineapple', 'Ice Pineapple', 150000, 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80', TRUE, 18),
  (19, 1, 'Iced Kiwi', 'Iced Kiwi', 150000, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', TRUE, 19),
  (20, 1, 'Ice Coconut', 'Ice Coconut', 150000, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80', TRUE, 20),
  (21, 1, 'Mojito', 'Mojito', 180000, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80', TRUE, 21),
  (22, 1, 'Blue Mojito', 'Blue Mojito', 200000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', TRUE, 22),
  (23, 1, 'Peach Mojito', 'Peach Mojito', 200000, 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80', TRUE, 23),
  (24, 1, 'Ice Strawberry Mojito', 'Ice Strawberry Mojito', 200000, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', TRUE, 24),
  (25, 1, 'Ice Lavender', 'Ice Lavender', 150000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', TRUE, 25),
  (26, 1, 'Ice Kiwi Mojito', 'Ice Kiwi Mojito', 250000, 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80', TRUE, 26),
  (27, 1, 'Lemonade', 'Lemonade', 150000, 'https://images.unsplash.com/photo-1523371054106-bbf80586c38c?w=400&q=80', TRUE, 27),
  (28, 1, 'Jamaica', 'Jamaica', 250000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', TRUE, 28),
  (29, 1, 'Ice Tea Mango', 'Ice Tea Mango', 200000, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80', TRUE, 29),
  (30, 1, 'Ice Mango Peach', 'Ice Mango Peach', 250000, 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80', TRUE, 30),
  (31, 1, 'Ice Tea Mango Peach', 'Ice Tea Mango Peach', 250000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', TRUE, 31),
  (32, 1, 'Iced Apple', 'Iced Apple', 150000, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', TRUE, 32),
  (33, 1, 'Rainbow Paradise', 'Rainbow Paradise', 250000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', TRUE, 33),
  (34, 1, 'Mango Kiwi', 'Mango Kiwi', 250000, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80', TRUE, 34),
  (35, 1, 'Kiwi Blue', 'Kiwi Blue', 200000, 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80', TRUE, 35),
  (36, 1, 'Teal Titan', 'Teal Titan', 250000, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80', TRUE, 36),
  (37, 1, 'Tigers Blood', 'Tigers Blood', 250000, 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80', TRUE, 37),
  (38, 1, 'Tropical Smoothie', 'Tropical Smoothie', 300000, 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80', TRUE, 38),
  (39, 1, 'Mexican', 'Mexican', 150000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', TRUE, 39),
  (40, 1, 'Sunset', 'Sunset', 200000, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', TRUE, 40),
  (41, 1, 'Blue Island', 'Blue Island', 300000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', TRUE, 41),
  (42, 1, 'Milkshake Nutella', 'Milkshake Nutella', 250000, 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', TRUE, 42),
  (43, 1, 'Milkshake Lotus', 'Milkshake Lotus', 250000, 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80', TRUE, 43),
  (44, 1, 'Milkshake Oreo', 'Milkshake Oreo', 250000, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', TRUE, 44),
  (45, 2, 'Smoothie Mango', 'Smoothie Mango', 200000, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80', TRUE, 45),
  (46, 2, 'Raspberry Smoothie', 'Raspberry Smoothie', 200000, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', TRUE, 46),
  (47, 2, 'Peach Smoothie', 'Peach Smoothie', 200000, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80', TRUE, 47),
  (48, 2, 'Blueberry Smoothie', 'Blueberry Smoothie', 200000, 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80', TRUE, 48),
  (49, 2, 'Pineapple Smoothie', 'Pineapple Smoothie', 200000, 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80', TRUE, 49),
  (50, 2, 'Lavender Smoothie', 'Lavender Smoothie', 200000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', TRUE, 50),
  (51, 2, 'Smoothie Passion Fruit', 'Smoothie Passion Fruit', 200000, 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80', TRUE, 51),
  (52, 2, 'Mango Peach Smoothie', 'Mango Peach Smoothie', 200000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80', TRUE, 52),
  (53, 2, 'Green Apple Smoothie', 'Green Apple Smoothie', 200000, 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', TRUE, 53),
  (54, 2, 'Smoothie Kiwi', 'Smoothie Kiwi', 200000, 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80', TRUE, 54),
  (55, 2, 'Grenadine Smoothie', 'Grenadine Smoothie', 200000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', TRUE, 55),
  (56, 2, 'Watermelon Smoothie', 'Watermelon Smoothie', 200000, 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80', TRUE, 56),
  (57, 2, 'Pineapple Smoothie', 'Pineapple Smoothie', 200000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80', TRUE, 57),
  (58, 3, 'Caramel Frappe', 'Caramel Frappe', 250000, 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', TRUE, 58),
  (59, 3, 'Vanilla Frappe', 'Vanilla Frappe', 250000, 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80', TRUE, 59),
  (60, 3, 'Mocha Frappe', 'Mocha Frappe', 250000, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', TRUE, 60),
  (61, 3, 'Oreo Frappe', 'Oreo Frappe', 250000, 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80', TRUE, 61),
  (62, 4, 'Brownie Waffles Ice Cream', 'Brownie Waffles Ice Cream', 250000, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', TRUE, 62),
  (63, 4, 'Small Ice Cream Cone', 'Small Ice Cream Cone', 50000, 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80', TRUE, 63),
  (64, 4, 'Ice Cream Cone', 'Ice Cream Cone', 100000, 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&q=80', TRUE, 64),
  (65, 4, 'Ice Cream 1 Kilo', 'Ice Cream 1 Kilo', 800000, 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80', TRUE, 65),
  (66, 4, '500G Ice Cream', '500G Ice Cream', 400000, 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=400&q=80', TRUE, 66),
  (67, 5, 'Latte', 'Latte', 100000, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', TRUE, 67),
  (68, 5, 'Spanish Latte', 'Spanish Latte', 120000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80', TRUE, 68),
  (69, 5, 'Caramel Latte', 'Caramel Latte', 150000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', TRUE, 69),
  (70, 5, 'Vanilla Latte', 'Vanilla Latte', 150000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', TRUE, 70),
  (71, 5, 'Toffee Latte', 'Toffee Latte', 150000, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', TRUE, 71),
  (72, 5, 'Hazelnut Latte', 'Hazelnut Latte', 150000, 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80', TRUE, 72),
  (73, 6, 'Nutella Tres Leches Cake', 'Nutella Tres Leches Cake', 300000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', TRUE, 73),
  (74, 6, 'Lotus Tres Leches Cake', 'Lotus Tres Leches Cake', 350000, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', TRUE, 74),
  (75, 6, 'Pistachio Tres Leches Cake', 'Pistachio Tres Leches Cake', 400000, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80', TRUE, 75),
  (76, 6, 'Fruit Tres Leches Cake', 'Fruit Tres Leches Cake', 400000, 'https://images.unsplash.com/photo-1488477181899-9542a6c67e29?w=400&q=80', TRUE, 76),
  (77, 6, 'Bomb Cake', 'Bomb Cake', 350000, 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80', TRUE, 77),
  (78, 6, 'Nutella Cup Cake', 'Nutella Cup Cake', 150000, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80', TRUE, 78),
  (79, 6, 'Crunch Cheese Cake', 'Crunch Cheese Cake', 200000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80', TRUE, 79),
  (80, 6, 'Lotus Cup Cake', 'Lotus Cup Cake', 150000, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80', TRUE, 80),
  (81, 6, 'Pistachio Cup Cake', 'Pistachio Cup Cake', 180000, 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80', TRUE, 81),
  (82, 6, 'Caramel Cup Cake', 'Caramel Cup Cake', 150000, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80', TRUE, 82),
  (83, 6, 'Dark Chocolate Cup Cake', 'Dark Chocolate Cup Cake', 150000, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80', TRUE, 83),
  (84, 6, 'Lotus Cup', 'Lotus Cup', 200000, 'https://images.unsplash.com/photo-1541599540903-216a46ab667a?w=400&q=80', TRUE, 84),
  (85, 6, 'Nutella Cup', 'Nutella Cup', 200000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80', TRUE, 85),
  (86, 6, 'Strawberry Nutella Cup', 'Strawberry Nutella Cup', 200000, 'https://images.unsplash.com/photo-1488477181899-9542a6c67e29?w=400&q=80', TRUE, 86),
  (87, 7, 'Espresso', 'Espresso', 70000, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80', TRUE, 87),
  (88, 7, 'Nescafé', 'Nescafé', 100000, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', TRUE, 88),
  (89, 7, 'Cappuccino', 'Cappuccino', 100000, 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80', TRUE, 89),
  (90, 7, 'Coca', 'Coca', 100000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80', TRUE, 90),
  (91, 7, 'Hot Caramel', 'Hot Caramel', 150000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', TRUE, 91),
  (92, 7, 'Mocha', 'Mocha', 150000, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', TRUE, 92),
  (93, 7, 'Pistachio', 'Pistachio', 180000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', TRUE, 93),
  (94, 7, 'Lotus', 'Lotus', 150000, 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80', TRUE, 94),
  (95, 7, 'Zebra', 'Zebra', 180000, 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80', TRUE, 95),
  (96, 7, 'Oreo', 'Oreo', 200000, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80', TRUE, 96),
  (97, 7, 'Hot Nutella', 'Hot Nutella', 150000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80', TRUE, 97),
  (98, 7, 'Hot Chocolate', 'Hot Chocolate', 100000, 'https://images.unsplash.com/photo-1542990253-a781e4585079?w=400&q=80', TRUE, 98)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('categories','id'), (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('products','id'),   (SELECT MAX(id) FROM products));

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cat_read  ON categories;  CREATE POLICY cat_read  ON categories FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS prod_read ON products;    CREATE POLICY prod_read ON products   FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS cat_write  ON categories; CREATE POLICY cat_write  ON categories FOR ALL USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS prod_write ON products;   CREATE POLICY prod_write ON products   FOR ALL USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS ord_insert ON orders; CREATE POLICY ord_insert ON orders FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS ord_read   ON orders; CREATE POLICY ord_read   ON orders FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS ord_update ON orders; CREATE POLICY ord_update ON orders FOR UPDATE USING (TRUE) WITH CHECK (TRUE);