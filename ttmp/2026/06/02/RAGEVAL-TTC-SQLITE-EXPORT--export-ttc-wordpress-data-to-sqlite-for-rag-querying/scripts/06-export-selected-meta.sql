SELECT JSON_OBJECT(
  'wp_id', p.ID,
  'post_type', p.post_type,
  'meta_key', pm.meta_key,
  'meta_value', pm.meta_value
) AS row_json
FROM wp_posts p
JOIN wp_postmeta pm ON pm.post_id = p.ID
WHERE p.post_status IN ('publish', 'private')
  AND p.post_type IN ('product', 'post', 'ttc_guide', 'faq', 'page')
  AND pm.meta_key IN (
    '_su_title', '_su_description', '_thumbnail_id',
    '_treeinfo_mature_height', '_treeinfo_mature_width', '_treeinfo_botanical_name',
    '_treeinfo_hardiness_zone', '_treeinfo_soil_conditions', '_treeinfo_sunlight',
    '_treeinfo_drought_tolerance', '_treeinfo_brand', '_treeinfo_does_not_ship_to',
    '_treeinfo_qa', '_ttc_content_link', '_sku', '_price', '_regular_price', '_sale_price',
    '_stock', '_stock_status', '_manage_stock', '_backorders', '_wc_cog_cost',
    '_product_attributes', '_default_attributes'
  )
ORDER BY p.ID, pm.meta_key;
