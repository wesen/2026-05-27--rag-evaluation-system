WITH turn_hits AS (
  SELECT
    id,
    title,
    timing->>'started_at' AS started_at,
    environment->>'model' AS model,
    CAST(t->>'index' AS INTEGER) AS turn_index,
    t->>'role' AS role,
    LEFT(t->>'content', 500) AS snippet,
    CASE
      WHEN regexp_matches(lower(COALESCE(t->>'content', '')), 'design system|design-system') THEN 'design-system'
      WHEN regexp_matches(lower(COALESCE(t->>'content', '')), 'playbook|handbook|contributing|contribution') THEN 'playbook'
      WHEN regexp_matches(lower(COALESCE(t->>'content', '')), 'web/|react|atoms|molecules|foundation|storybook') THEN 'frontend-structure'
      WHEN regexp_matches(lower(COALESCE(t->>'content', '')), 'context window|transcript|annotation|course') THEN 'target-page'
      ELSE 'other'
    END AS hit_kind
  FROM sessions_base, UNNEST(turns) AS u(t)
  WHERE regexp_matches(lower(COALESCE(t->>'content', '')), 'design system|design-system|playbook|handbook|contributing|contribution|web/|react|atoms|molecules|foundation|storybook|context window|transcript|annotation|course')
), tool_hits AS (
  SELECT
    id,
    title,
    timing->>'started_at' AS started_at,
    environment->>'model' AS model,
    CAST(tc->>'emitting_turn_index' AS INTEGER) AS turn_index,
    'tool:' || (tc->>'tool_name') AS role,
    LEFT(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', ''), 500) AS snippet,
    CASE
      WHEN regexp_matches(lower(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', '')), 'design system|design-system') THEN 'design-system'
      WHEN regexp_matches(lower(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', '')), 'playbook|handbook|contributing|contribution') THEN 'playbook'
      WHEN regexp_matches(lower(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', '')), 'web/|react|atoms|molecules|foundation|storybook') THEN 'frontend-structure'
      WHEN regexp_matches(lower(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', '')), 'context window|transcript|annotation|course') THEN 'target-page'
      ELSE 'other'
    END AS hit_kind
  FROM sessions_base, UNNEST(tool_calls) AS u(tc)
  WHERE regexp_matches(lower(COALESCE(tc->'input'->>'command', tc->'input'->>'path', tc->'output'->>'result', '')), 'design system|design-system|playbook|handbook|contributing|contribution|web/|react|atoms|molecules|foundation|storybook|context window|transcript|annotation|course')
), all_hits AS (
  SELECT * FROM turn_hits
  UNION ALL
  SELECT * FROM tool_hits
)
SELECT
  id,
  title,
  started_at,
  model,
  COUNT(*) AS hit_count,
  SUM(CASE WHEN hit_kind = 'design-system' THEN 1 ELSE 0 END) AS design_system_hits,
  SUM(CASE WHEN hit_kind = 'playbook' THEN 1 ELSE 0 END) AS playbook_hits,
  SUM(CASE WHEN hit_kind = 'frontend-structure' THEN 1 ELSE 0 END) AS frontend_hits,
  SUM(CASE WHEN hit_kind = 'target-page' THEN 1 ELSE 0 END) AS target_page_hits,
  MIN(turn_index) AS first_hit_turn,
  STRING_AGG(DISTINCT hit_kind, ', ' ORDER BY hit_kind) AS hit_kinds,
  ARG_MIN(snippet, turn_index) AS first_snippet
FROM all_hits
GROUP BY id, title, started_at, model
ORDER BY (playbook_hits * 5 + design_system_hits * 3 + frontend_hits * 2 + target_page_hits) DESC, hit_count DESC
LIMIT 25;
