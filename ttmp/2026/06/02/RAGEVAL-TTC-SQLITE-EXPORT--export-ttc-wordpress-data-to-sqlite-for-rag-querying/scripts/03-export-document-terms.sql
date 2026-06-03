SELECT JSON_OBJECT(
  'wp_id', p.ID,
  'post_type', p.post_type,
  'taxonomy', tt.taxonomy,
  'term_id', t.term_id,
  'term_name', t.name,
  'term_slug', t.slug,
  'term_description', tt.description,
  'parent_term_id', NULLIF(tt.parent, 0),
  'is_category', IF(tt.taxonomy IN ('category', 'product_cat', 'faq_categories', 'ttc_guide_categories'), TRUE, FALSE)
) AS row_json
FROM wp_posts p
JOIN wp_term_relationships tr ON tr.object_id = p.ID
JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
JOIN wp_terms t ON t.term_id = tt.term_id
WHERE p.post_status IN ('publish', 'private')
  AND p.post_type IN ('product', 'post', 'ttc_guide', 'faq', 'page')
ORDER BY p.ID, tt.taxonomy, t.name;
