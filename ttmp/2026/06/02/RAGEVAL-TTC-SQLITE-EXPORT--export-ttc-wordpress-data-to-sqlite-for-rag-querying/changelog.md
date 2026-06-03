# Changelog

## 2026-06-02

- Initial workspace created


## 2026-06-02

Added docker-compose MySQL source container definition to the ticket scripts folder for reproducible TTC dump loading.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/09-docker-compose.mysql.yml — MySQL compose definition


## 2026-06-02

Added TTC SQLite export runbook with compose/setup/export/validate commands, destination schema notes, and example RAG queries.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/data/ttc-wordpress-rag.sqlite — Generated validated SQLite export
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/reference/02-ttc-sqlite-export-runbook.md — Copy/paste export runbook


## 2026-06-02

Added bot-friendly SQLite views view_products and view_documents, reran export, and updated validation/runbook documentation.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/data/ttc-wordpress-rag.sqlite — Regenerated with simple RAG views
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py — Creates view_products and view_documents
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh — Validates simple RAG views


## 2026-06-02

Added Markdown preservation to the TTC SQLite export, including content_markdown/search_markdown columns and view exposure for RAG prompt context.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/data/ttc-wordpress-rag.sqlite — Regenerated with Markdown columns
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/07-export-ttc-wordpress-to-sqlite.py — Markdown conversion and schema/view columns
- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/scripts/08-validate-ttc-sqlite.sh — Markdown validation sample


## 2026-06-03

Added research logbook evaluating each source resource consulted for the TTC SQLite export, including usefulness, stale assumptions, and update needs.

### Related Files

- /home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-TTC-SQLITE-EXPORT--export-ttc-wordpress-data-to-sqlite-for-rag-querying/reference/03-research-logbook.md — Research logbook

