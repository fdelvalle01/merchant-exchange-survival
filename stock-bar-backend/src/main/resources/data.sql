INSERT INTO product (
  id,
  name,
  base_price,
  current_price,
  image_url,
  sector,
  enabled,
  created_at,
  last_purchased_at,
  max_price
) VALUES
  (
    11,
    'Ironhill Mines',
    5100.00,
    5100.00,
    'https://placehold.co/320x240/1f2937/f8fafc?text=Ironhill+Mines',
    'MINING',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    5100.00
  ),
  (
    12,
    'Black Harbor Shipping',
    5500.00,
    5500.00,
    'https://placehold.co/320x240/0f172a/f8fafc?text=Black+Harbor',
    'SHIPPING',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    5500.00
  ),
  (
    13,
    'Old Dragon Brewery',
    4800.00,
    4800.00,
    'https://placehold.co/320x240/3f1f16/f8fafc?text=Old+Dragon',
    'FOOD',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    4800.00
  ),
  (
    14,
    'Silvercrown Bank',
    7200.00,
    7200.00,
    'https://placehold.co/320x240/334155/f8fafc?text=Silvercrown+Bank',
    'BANKING',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    7200.00
  ),
  (
    15,
    'Northwind Logistics',
    3900.00,
    3900.00,
    'https://placehold.co/320x240/064e3b/f8fafc?text=Northwind+Logistics',
    'LOGISTICS',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    3900.00
  ),
  (
    16,
    'Arcane Research Guild',
    8600.00,
    8600.00,
    'https://placehold.co/320x240/312e81/f8fafc?text=Arcane+Guild',
    'ARCANE',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    8600.00
  ),
  (
    17,
    'Royal Grain Company',
    4300.00,
    4300.00,
    'https://placehold.co/320x240/365314/f8fafc?text=Royal+Grain',
    'GRAIN',
    true,
    CURRENT_TIMESTAMP,
    NULL,
    4300.00
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  current_price = EXCLUDED.current_price,
  image_url = EXCLUDED.image_url,
  sector = EXCLUDED.sector,
  enabled = EXCLUDED.enabled,
  last_purchased_at = EXCLUDED.last_purchased_at,
  max_price = EXCLUDED.max_price;

SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));
