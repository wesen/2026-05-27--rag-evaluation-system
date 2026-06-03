SELECT JSON_OBJECT(
  'wp_id', p.ID,
  'post_type', p.post_type,
  'post_status', p.post_status,
  'title', p.post_title,
  'slug', p.post_name,
  'post_date', p.post_date,
  'post_modified', p.post_modified,
  'url', p.guid,
  'content_html', p.post_content,
  'excerpt_html', p.post_excerpt,
  'parent_wp_id', NULLIF(p.post_parent, 0),
  'menu_order', p.menu_order,
  'comment_count', p.comment_count,
  'seo_title', (SELECT pm.meta_value FROM wp_postmeta pm WHERE pm.post_id = p.ID AND pm.meta_key = '_su_title' LIMIT 1),
  'seo_description', (SELECT pm.meta_value FROM wp_postmeta pm WHERE pm.post_id = p.ID AND pm.meta_key = '_su_description' LIMIT 1),
  'thumbnail_id', (SELECT pm.meta_value FROM wp_postmeta pm WHERE pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id' LIMIT 1)
) AS row_json
FROM wp_posts p
WHERE p.post_status IN ('publish', 'private')
  AND p.post_type IN ('product', 'post', 'ttc_guide', 'faq', 'page')
ORDER BY p.post_type, p.ID;
