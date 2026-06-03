SELECT JSON_OBJECT(
  'variant_wp_id', v.ID,
  'parent_wp_id', v.post_parent,
  'variant_title', v.post_title,
  'variant_slug', v.post_name,
  'post_status', v.post_status,
  'sku', sku.meta_value,
  'size', size.meta_value,
  'manage_stock', manage_stock.meta_value,
  'stock', stock.meta_value,
  'stock_status', stock_status.meta_value,
  'backorders', backorders.meta_value,
  'price', price.meta_value,
  'regular_price', regular_price.meta_value,
  'sale_price', sale_price.meta_value,
  'cogs', cogs.meta_value,
  'attributes_json', (
    SELECT JSON_OBJECTAGG(REPLACE(pm.meta_key, 'attribute_', ''), pm.meta_value)
    FROM wp_postmeta pm
    WHERE pm.post_id = v.ID
      AND pm.meta_key LIKE 'attribute_%'
  )
) AS row_json
FROM wp_posts v
LEFT JOIN wp_postmeta sku ON sku.post_id = v.ID AND sku.meta_key = '_sku'
LEFT JOIN wp_postmeta size ON size.post_id = v.ID AND size.meta_key = 'attribute_pa_size'
LEFT JOIN wp_postmeta manage_stock ON manage_stock.post_id = v.ID AND manage_stock.meta_key = '_manage_stock'
LEFT JOIN wp_postmeta stock ON stock.post_id = v.ID AND stock.meta_key = '_stock'
LEFT JOIN wp_postmeta stock_status ON stock_status.post_id = v.ID AND stock_status.meta_key = '_stock_status'
LEFT JOIN wp_postmeta backorders ON backorders.post_id = v.ID AND backorders.meta_key = '_backorders'
LEFT JOIN wp_postmeta price ON price.post_id = v.ID AND price.meta_key = '_price'
LEFT JOIN wp_postmeta regular_price ON regular_price.post_id = v.ID AND regular_price.meta_key = '_regular_price'
LEFT JOIN wp_postmeta sale_price ON sale_price.post_id = v.ID AND sale_price.meta_key = '_sale_price'
LEFT JOIN wp_postmeta cogs ON cogs.post_id = v.ID AND cogs.meta_key = '_wc_cog_cost'
WHERE v.post_type = 'product_variation'
  AND v.post_status IN ('publish', 'private')
  AND v.post_parent IN (
    SELECT ID FROM wp_posts WHERE post_type = 'product' AND post_status IN ('publish', 'private')
  )
ORDER BY v.post_parent, v.ID;
