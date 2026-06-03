SELECT JSON_OBJECT(
  'wp_id', p.ID,
  'parent_wp_id', NULLIF(p.post_parent, 0),
  'product_type', (
    SELECT wt.name
    FROM wp_term_relationships tr
    JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'product_type'
    JOIN wp_terms wt ON wt.term_id = tt.term_id
    WHERE tr.object_id = p.ID
    LIMIT 1
  ),
  'sku', sku.meta_value,
  'manage_stock', manage_stock.meta_value,
  'stock', stock.meta_value,
  'stock_status', stock_status.meta_value,
  'backorders', backorders.meta_value,
  'price', price.meta_value,
  'regular_price', regular_price.meta_value,
  'sale_price', sale_price.meta_value,
  'cogs', cogs.meta_value,
  'total_stock_qty', total_stock.meta_value,
  'min_variation_price', min_var_price.meta_value,
  'max_variation_price', max_var_price.meta_value,
  'botanical_name', botanical.meta_value,
  'mature_height', mature_height.meta_value,
  'mature_width', mature_width.meta_value,
  'hardiness_zone', hardiness.meta_value,
  'sunlight', sunlight.meta_value,
  'soil_conditions', soil.meta_value,
  'drought_tolerance', drought.meta_value,
  'brand_text', brand_text.meta_value,
  'does_not_ship_to', no_ship.meta_value,
  'treeinfo_qa', qa.meta_value,
  'product_attributes_raw', product_attrs.meta_value,
  'default_attributes_raw', default_attrs.meta_value
) AS row_json
FROM wp_posts p
LEFT JOIN wp_postmeta sku ON sku.post_id = p.ID AND sku.meta_key = '_sku'
LEFT JOIN wp_postmeta manage_stock ON manage_stock.post_id = p.ID AND manage_stock.meta_key = '_manage_stock'
LEFT JOIN wp_postmeta stock ON stock.post_id = p.ID AND stock.meta_key = '_stock'
LEFT JOIN wp_postmeta stock_status ON stock_status.post_id = p.ID AND stock_status.meta_key = '_stock_status'
LEFT JOIN wp_postmeta backorders ON backorders.post_id = p.ID AND backorders.meta_key = '_backorders'
LEFT JOIN wp_postmeta price ON price.post_id = p.ID AND price.meta_key = '_price'
LEFT JOIN wp_postmeta regular_price ON regular_price.post_id = p.ID AND regular_price.meta_key = '_regular_price'
LEFT JOIN wp_postmeta sale_price ON sale_price.post_id = p.ID AND sale_price.meta_key = '_sale_price'
LEFT JOIN wp_postmeta cogs ON cogs.post_id = p.ID AND cogs.meta_key = '_wc_cog_cost'
LEFT JOIN wp_postmeta total_stock ON total_stock.post_id = p.ID AND total_stock.meta_key = '_ttc_total_stock_qty'
LEFT JOIN wp_postmeta min_var_price ON min_var_price.post_id = p.ID AND min_var_price.meta_key = '_min_variation_price'
LEFT JOIN wp_postmeta max_var_price ON max_var_price.post_id = p.ID AND max_var_price.meta_key = '_max_variation_price'
LEFT JOIN wp_postmeta botanical ON botanical.post_id = p.ID AND botanical.meta_key = '_treeinfo_botanical_name'
LEFT JOIN wp_postmeta mature_height ON mature_height.post_id = p.ID AND mature_height.meta_key = '_treeinfo_mature_height'
LEFT JOIN wp_postmeta mature_width ON mature_width.post_id = p.ID AND mature_width.meta_key = '_treeinfo_mature_width'
LEFT JOIN wp_postmeta hardiness ON hardiness.post_id = p.ID AND hardiness.meta_key = '_treeinfo_hardiness_zone'
LEFT JOIN wp_postmeta sunlight ON sunlight.post_id = p.ID AND sunlight.meta_key = '_treeinfo_sunlight'
LEFT JOIN wp_postmeta soil ON soil.post_id = p.ID AND soil.meta_key = '_treeinfo_soil_conditions'
LEFT JOIN wp_postmeta drought ON drought.post_id = p.ID AND drought.meta_key = '_treeinfo_drought_tolerance'
LEFT JOIN wp_postmeta brand_text ON brand_text.post_id = p.ID AND brand_text.meta_key = '_treeinfo_brand'
LEFT JOIN wp_postmeta no_ship ON no_ship.post_id = p.ID AND no_ship.meta_key = '_treeinfo_does_not_ship_to'
LEFT JOIN wp_postmeta qa ON qa.post_id = p.ID AND qa.meta_key = '_treeinfo_qa'
LEFT JOIN wp_postmeta product_attrs ON product_attrs.post_id = p.ID AND product_attrs.meta_key = '_product_attributes'
LEFT JOIN wp_postmeta default_attrs ON default_attrs.post_id = p.ID AND default_attrs.meta_key = '_default_attributes'
WHERE p.post_status IN ('publish', 'private')
  AND p.post_type = 'product'
ORDER BY p.ID;
