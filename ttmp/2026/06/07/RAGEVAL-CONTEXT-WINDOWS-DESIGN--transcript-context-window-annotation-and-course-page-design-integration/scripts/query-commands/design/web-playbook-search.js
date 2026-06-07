__section__("filters", {
  fields: {
    limit: { type: "int", default: 50, help: "Maximum rows to return" },
  },
});

function webPlaybookEvidence(filters) {
  const mt = require("minitrace");
  const limit = filters.limit || 50;
  return mt.query(`
    WITH tool_text AS (
      SELECT
        id,
        title,
        timing->>'started_at' AS started_at,
        CAST(tc->>'emitting_turn_index' AS INTEGER) AS turn_index,
        tc->>'tool_name' AS tool_name,
        COALESCE(tc->'input'->>'command', '') AS command,
        COALESCE(tc->'input'->>'path', tc->'input'->>'file_path', '') AS input_path,
        COALESCE(tc->'output'->>'result', '') AS output_result
      FROM ${mt.tableName}, UNNEST(tool_calls) AS u(tc)
    ), scored AS (
      SELECT
        id,
        title,
        started_at,
        turn_index,
        tool_name,
        input_path,
        command,
        LEFT(output_result, 700) AS output_snippet,
        (CASE WHEN regexp_matches(lower(command || ' ' || input_path || ' ' || output_result), 'design system|design-system') THEN 8 ELSE 0 END) +
        (CASE WHEN regexp_matches(lower(command || ' ' || input_path || ' ' || output_result), 'playbook|handbook|contributing|contribution|guide') THEN 6 ELSE 0 END) +
        (CASE WHEN regexp_matches(lower(command || ' ' || input_path || ' ' || output_result), 'web/|packages/rag-evaluation-site|src/components|atoms|molecules|foundation|storybook') THEN 5 ELSE 0 END) +
        (CASE WHEN regexp_matches(lower(command || ' ' || input_path || ' ' || output_result), 'docmgr doc add|docmgr doc relate|write[(]|design-doc|reference|[.]md') THEN 3 ELSE 0 END) AS score
      FROM tool_text
      WHERE regexp_matches(lower(command || ' ' || input_path || ' ' || output_result), 'design system|design-system|playbook|handbook|contributing|contribution|guide|web/|packages/rag-evaluation-site|src/components|atoms|molecules|foundation|storybook')
    )
    SELECT *
    FROM scored
    WHERE score > 0
    ORDER BY score DESC, started_at DESC, turn_index ASC
    LIMIT ${Number(limit)}
  `);
}

__verb__("webPlaybookEvidence", {
  name: "web-playbook-evidence",
  short: "Find transcript tool evidence for web/design-system playbooks",
  fields: { filters: { bind: "filters" } },
});
