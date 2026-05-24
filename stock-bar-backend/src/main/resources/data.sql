INSERT INTO product (
  id,
  name,
  base_price,
  current_price,
  image_url,
  enabled,
  created_at,
  max_price
) VALUES
  (
    11,
    'Cerveza Austral',
    5100.00,
    5100.00,
    'https://d1ks0wbvjr3pux.cloudfront.net/4e13ec55-0419-4f07-a6d1-b7a7e72be667-lg.jpg',
    true,
    CURRENT_TIMESTAMP,
    5100.00
  ),
  (
    12,
    'Cerveza Kunstmann',
    5500.00,
    5500.00,
    'https://cdnx.jumpseller.com/comercial-jp/image/10946668/resize/1200/630?1721839824',
    true,
    CURRENT_TIMESTAMP,
    5500.00
  ),
  (
    13,
    'Cerveza Cusqueña',
    4800.00,
    4800.00,
    'https://i.bolder.run/r/czo0MDY0LGc6MTAwMHg/a29e92b8/851818-7753749275767.jpg',
    true,
    CURRENT_TIMESTAMP,
    4800.00
  ),
  (
    14,
    'Cerveza Cristal',
    3500.00,
    3500.00,
    'https://www.ccu.cl/wp-content/uploads/2024/07/Cristal_500.png',
    true,
    CURRENT_TIMESTAMP,
    3500.00
  )
ON CONFLICT (id) DO NOTHING;

SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));
