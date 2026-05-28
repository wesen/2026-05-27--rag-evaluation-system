# Changelog

## 2026-05-28

- Initial workspace created


## 2026-05-28

Created ticket, bounded dump inspection script, isolated MySQL import workflow, normalized SQLite export script, and implementation guide for TTC dump corpus extraction.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/28/RAGEVAL-002--extract-the-tree-center-content-dump-into-ordered-sqlite-corpus/scripts/01-inspect-dump-schema.py — Bounded schema/count inspection
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/28/RAGEVAL-002--extract-the-tree-center-content-dump-into-ordered-sqlite-corpus/scripts/02-load-dump-into-mysql.sh — MySQL import workflow
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/28/RAGEVAL-002--extract-the-tree-center-content-dump-into-ordered-sqlite-corpus/scripts/03-export-mysql-to-sqlite.py — SQLite export workflow


## 2026-05-28

Executed isolated MySQL import and SQLite export. Import needed filtering mysqldump warning/GTID lines and authenticated readiness check; export produced 483 articles, 19 guides, and 2594 products in data/corpus/ttc-dump/ttc-corpus.sqlite.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/28/RAGEVAL-002--extract-the-tree-center-content-dump-into-ordered-sqlite-corpus/scripts/02-load-dump-into-mysql.sh — Executed dump import into isolated MySQL
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/05/28/RAGEVAL-002--extract-the-tree-center-content-dump-into-ordered-sqlite-corpus/scripts/03-export-mysql-to-sqlite.py — Executed normalized SQLite export

