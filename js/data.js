// =============================================
// StoryCafe — Complete Menu Data
// =============================================

const CATEGORIES_LOCAL = [
  { id: 1, name: 'مشروبات باردة', nameEn: 'Cold Drinks',            icon: '🥤', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { id: 2, name: 'سموزي',         nameEn: 'Smoothie',               icon: '🍓', image: 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80' },
  { id: 3, name: 'فرابيه',        nameEn: 'Frappe',                 icon: '☕', image: 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80' },
  { id: 4, name: 'ايس كريم',      nameEn: 'Ice Cream',              icon: '🍦', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80' },
  { id: 5, name: 'تشكيلة لاتيه', nameEn: 'Coffee Latte Collection', icon: '☕', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { id: 6, name: 'حلويات',        nameEn: 'Desserts',               icon: '🍰', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' },
  { id: 7, name: 'مشروبات ساخنة', nameEn: 'Hot Drinks',             icon: '🔥', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
];

const PRODUCTS_LOCAL = [

  // ══════════════════════════════════════
  // Cold Drinks (1)
  // ══════════════════════════════════════
  { id: 1,  categoryId: 1, name: 'Ice Caramel Latte',        price: 200000, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { id: 2,  categoryId: 1, name: 'Iced Toffee',              price: 200000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { id: 3,  categoryId: 1, name: 'Ice Lotus Latte',          price: 200000, image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80' },
  { id: 4,  categoryId: 1, name: 'Banana Ice Latte',         price: 250000, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },
  { id: 5,  categoryId: 1, name: 'Iced Hazelnut Latte',      price: 200000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80' },
  { id: 6,  categoryId: 1, name: 'Ice Salted Caramel Latte', price: 200000, image: 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80' },
  { id: 7,  categoryId: 1, name: 'Ice Mocha Latte',          price: 250000, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80' },
  { id: 8,  categoryId: 1, name: 'Ice Vanilla Latte',        price: 200000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { id: 9,  categoryId: 1, name: 'Ice Blue Curaçao',         price: 150000, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80' },
  { id: 10, categoryId: 1, name: 'Ice Strawberry',           price: 150000, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80' },
  { id: 11, categoryId: 1, name: 'Lemon Mint',               price: 150000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { id: 12, categoryId: 1, name: 'Iced Blueberry',           price: 150000, image: 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80' },
  { id: 13, categoryId: 1, name: 'Ice Bubble Gum',           price: 150000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { id: 14, categoryId: 1, name: 'Ice Cherry',               price: 150000, image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80' },
  { id: 15, categoryId: 1, name: 'Ice Passion Fruit',        price: 150000, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80' },
  { id: 16, categoryId: 1, name: 'Ice Grenadine',            price: 150000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
  { id: 17, categoryId: 1, name: 'Ice Watermelon',           price: 150000, image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80' },
  { id: 18, categoryId: 1, name: 'Ice Pineapple',            price: 150000, image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80' },
  { id: 19, categoryId: 1, name: 'Iced Kiwi',                price: 150000, image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80' },
  { id: 20, categoryId: 1, name: 'Ice Coconut',              price: 150000, image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80' },
  { id: 21, categoryId: 1, name: 'Mojito',                   price: 180000, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80' },
  { id: 22, categoryId: 1, name: 'Blue Mojito',              price: 200000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { id: 23, categoryId: 1, name: 'Peach Mojito',             price: 200000, image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80' },
  { id: 24, categoryId: 1, name: 'Ice Strawberry Mojito',    price: 200000, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80' },
  { id: 25, categoryId: 1, name: 'Ice Lavender',             price: 150000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { id: 26, categoryId: 1, name: 'Ice Kiwi Mojito',          price: 250000, image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80' },
  { id: 27, categoryId: 1, name: 'Lemonade',                 price: 150000, image: 'https://images.unsplash.com/photo-1523371054106-bbf80586c38c?w=400&q=80' },
  { id: 28, categoryId: 1, name: 'Jamaica',                  price: 250000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
  { id: 29, categoryId: 1, name: 'Ice Tea Mango',            price: 200000, image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80' },
  { id: 30, categoryId: 1, name: 'Ice Mango Peach',          price: 250000, image: 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80' },
  { id: 31, categoryId: 1, name: 'Ice Tea Mango Peach',      price: 250000, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80' },
  { id: 32, categoryId: 1, name: 'Iced Apple',               price: 150000, image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80' },
  { id: 33, categoryId: 1, name: 'Rainbow Paradise',         price: 250000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { id: 34, categoryId: 1, name: 'Mango Kiwi',               price: 250000, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80' },
  { id: 35, categoryId: 1, name: 'Kiwi Blue',                price: 200000, image: 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80' },
  { id: 36, categoryId: 1, name: 'Teal Titan',               price: 250000, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80' },
  { id: 37, categoryId: 1, name: 'Tigers Blood',             price: 250000, image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80' },
  { id: 38, categoryId: 1, name: 'Tropical Smoothie',        price: 300000, image: 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80' },
  { id: 39, categoryId: 1, name: 'Mexican',                  price: 150000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
  { id: 40, categoryId: 1, name: 'Sunset',                   price: 200000, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80' },
  { id: 41, categoryId: 1, name: 'Blue Island',              price: 300000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { id: 42, categoryId: 1, name: 'Milkshake Nutella',        price: 250000, image: 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80' },
  { id: 43, categoryId: 1, name: 'Milkshake Lotus',          price: 250000, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80' },
  { id: 44, categoryId: 1, name: 'Milkshake Oreo',           price: 250000, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },

  // ══════════════════════════════════════
  // Smoothie (2)
  // ══════════════════════════════════════
  { id: 45, categoryId: 2, name: 'Smoothie Mango',          price: 200000, image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80' },
  { id: 46, categoryId: 2, name: 'Raspberry Smoothie',      price: 200000, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80' },
  { id: 47, categoryId: 2, name: 'Peach Smoothie',          price: 200000, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80' },
  { id: 48, categoryId: 2, name: 'Blueberry Smoothie',      price: 200000, image: 'https://images.unsplash.com/photo-1638514669989-57e6ac7e0d0d?w=400&q=80' },
  { id: 49, categoryId: 2, name: 'Pineapple Smoothie',      price: 200000, image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80' },
  { id: 50, categoryId: 2, name: 'Lavender Smoothie',       price: 200000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { id: 51, categoryId: 2, name: 'Smoothie Passion Fruit',  price: 200000, image: 'https://images.unsplash.com/photo-1502741383585-cdbbad34dd53?w=400&q=80' },
  { id: 52, categoryId: 2, name: 'Mango Peach Smoothie',    price: 200000, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80' },
  { id: 53, categoryId: 2, name: 'Green Apple Smoothie',    price: 200000, image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80' },
  { id: 54, categoryId: 2, name: 'Smoothie Kiwi',           price: 200000, image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=400&q=80' },
  { id: 55, categoryId: 2, name: 'Grenadine Smoothie',      price: 200000, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
  { id: 56, categoryId: 2, name: 'Watermelon Smoothie',     price: 200000, image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80' },
  { id: 57, categoryId: 2, name: 'Pineapple Smoothie',      price: 200000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },

  // ══════════════════════════════════════
  // Frappe (3)
  // ══════════════════════════════════════
  { id: 58, categoryId: 3, name: 'Caramel Frappe',          price: 250000, image: 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80' },
  { id: 59, categoryId: 3, name: 'Vanilla Frappe',          price: 250000, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80' },
  { id: 60, categoryId: 3, name: 'Mocha Frappe',            price: 250000, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },
  { id: 61, categoryId: 3, name: 'Oreo Frappe',             price: 250000, image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80' },

  // ══════════════════════════════════════
  // Ice Cream (4)
  // ══════════════════════════════════════
  { id: 62, categoryId: 4, name: 'Brownie Waffles Ice Cream', price: 250000, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
  { id: 63, categoryId: 4, name: 'Small Ice Cream Cone',      price:  50000, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80' },
  { id: 64, categoryId: 4, name: 'Ice Cream Cone',            price: 100000, image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&q=80' },
  { id: 65, categoryId: 4, name: 'Ice Cream 1 Kilo',          price: 800000, image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80' },
  { id: 66, categoryId: 4, name: '500G Ice Cream',            price: 400000, image: 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7?w=400&q=80' },

  // ══════════════════════════════════════
  // Coffee Latte Collection (5)
  // ══════════════════════════════════════
  { id: 67, categoryId: 5, name: 'Latte',         price: 100000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { id: 68, categoryId: 5, name: 'Spanish Latte', price: 120000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80' },
  { id: 69, categoryId: 5, name: 'Caramel Latte', price: 150000, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { id: 70, categoryId: 5, name: 'Vanilla Latte', price: 150000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { id: 71, categoryId: 5, name: 'Toffee Latte',  price: 150000, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { id: 72, categoryId: 5, name: 'Hazelnut Latte',price: 150000, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80' },

  // ══════════════════════════════════════
  // Desserts (6)
  // ══════════════════════════════════════
  { id: 73, categoryId: 6, name: 'Nutella Tres Leches Cake',   price: 300000, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { id: 74, categoryId: 6, name: 'Lotus Tres Leches Cake',     price: 350000, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80' },
  { id: 75, categoryId: 6, name: 'Pistachio Tres Leches Cake', price: 400000, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80' },
  { id: 76, categoryId: 6, name: 'Fruit Tres Leches Cake',     price: 400000, image: 'https://images.unsplash.com/photo-1488477181899-9542a6c67e29?w=400&q=80' },
  { id: 77, categoryId: 6, name: 'Bomb Cake',                  price: 350000, image: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=80' },
  { id: 78, categoryId: 6, name: 'Nutella Cup Cake',           price: 150000, image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80' },
  { id: 79, categoryId: 6, name: 'Crunch Cheese Cake',         price: 200000, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
  { id: 80, categoryId: 6, name: 'Lotus Cup Cake',             price: 150000, image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80' },
  { id: 81, categoryId: 6, name: 'Pistachio Cup Cake',         price: 180000, image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80' },
  { id: 82, categoryId: 6, name: 'Caramel Cup Cake',           price: 150000, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80' },
  { id: 83, categoryId: 6, name: 'Dark Chocolate Cup Cake',    price: 150000, image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80' },
  { id: 84, categoryId: 6, name: 'Lotus Cup',                  price: 200000, image: 'https://images.unsplash.com/photo-1541599540903-216a46ab667a?w=400&q=80' },
  { id: 85, categoryId: 6, name: 'Nutella Cup',                price: 200000, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { id: 86, categoryId: 6, name: 'Strawberry Nutella Cup',     price: 200000, image: 'https://images.unsplash.com/photo-1488477181899-9542a6c67e29?w=400&q=80' },

  // ══════════════════════════════════════
  // Hot Drinks (7)
  // ══════════════════════════════════════
  { id: 87, categoryId: 7, name: 'Espresso',      price:  70000, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80' },
  { id: 88, categoryId: 7, name: 'Nescafé',       price: 100000, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { id: 89, categoryId: 7, name: 'Cappuccino',    price: 100000, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400&q=80' },
  { id: 90, categoryId: 7, name: 'Coca',          price: 100000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80' },
  { id: 91, categoryId: 7, name: 'Hot Caramel',   price: 150000, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { id: 92, categoryId: 7, name: 'Mocha',         price: 150000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { id: 93, categoryId: 7, name: 'Pistachio',     price: 180000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { id: 94, categoryId: 7, name: 'Lotus',         price: 150000, image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=400&q=80' },
  { id: 95, categoryId: 7, name: 'Zebra',         price: 180000, image: 'https://images.unsplash.com/photo-1572286258217-215cf8e8f498?w=400&q=80' },
  { id: 96, categoryId: 7, name: 'Oreo',          price: 200000, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },
  { id: 97, categoryId: 7, name: 'Hot Nutella',   price: 150000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&q=80' },
  { id: 98, categoryId: 7, name: 'Hot Chocolate', price: 100000, image: 'https://images.unsplash.com/photo-1542990253-a781e4585079?w=400&q=80' },
];

// Derive item counts per category
CATEGORIES_LOCAL.forEach(cat => {
  cat.count = PRODUCTS_LOCAL.filter(p => p.categoryId === cat.id).length;
});

function formatPrice(n) {
  return n.toLocaleString('en-US') + ' ' + CONFIG.currency;
}
