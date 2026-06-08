---
Title: Component Duplication Inventory
Ticket: RAGEVAL-DESIGN-SYSTEM-UNIFY
Status: active
Topics: [design-system, frontend-architecture, react, packaging, storybook]
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Machine-generated inventory of duplicated files between web/src and packages/rag-evaluation-site/src.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use to decide which files can be package-canonical and which remain web-specific.
WhenToUse: Before moving imports or deleting duplicated frontend files.
---

# Component Duplication Inventory

## Counts

| Group | Status | Count |
|---|---:|---:|
| components | different | 2 |
| components | identical | 72 |
| components | web_only | 120 |
| hooks | package_only | 1 |
| hooks | web_only | 1 |
| widgets | different | 2 |
| widgets | identical | 3 |
| widgets | web_only | 1 |

## Different shared files

- `components/index.ts`
- `components/molecules/index.ts`
- `widgets/WidgetRenderer.tsx`
- `widgets/actions.ts`

## Web-only files

- `components/atoms/Button/Button.stories.tsx`
- `components/atoms/CheckboxRow/CheckboxRow.stories.tsx`
- `components/atoms/ErrorCallout/ErrorCallout.stories.tsx`
- `components/atoms/IconButton/IconButton.stories.tsx`
- `components/atoms/SelectInput/SelectInput.stories.tsx`
- `components/atoms/TextInput/TextInput.stories.tsx`
- `components/corpus/ArtifactIdentityBar/ArtifactIdentityBar.module.css`
- `components/corpus/ArtifactIdentityBar/ArtifactIdentityBar.stories.tsx`
- `components/corpus/ArtifactIdentityBar/ArtifactIdentityBar.tsx`
- `components/corpus/ArtifactIdentityBar/index.ts`
- `components/corpus/ChunkTimelineBar/ChunkTimelineBar.module.css`
- `components/corpus/ChunkTimelineBar/ChunkTimelineBar.stories.tsx`
- `components/corpus/ChunkTimelineBar/ChunkTimelineBar.tsx`
- `components/corpus/ChunkTimelineBar/index.ts`
- `components/corpus/CorpusExplorerView.tsx`
- `components/corpus/DocumentBrowser/DocumentBrowser.module.css`
- `components/corpus/DocumentBrowser/DocumentBrowser.stories.tsx`
- `components/corpus/DocumentBrowser/DocumentBrowser.tsx`
- `components/corpus/DocumentInspector/DocumentInspector.module.css`
- `components/corpus/DocumentInspector/DocumentInspector.stories.tsx`
- `components/corpus/DocumentInspector/DocumentInspector.tsx`
- `components/corpus/IdentityBar/IdentityBar.module.css`
- `components/corpus/IdentityBar/IdentityBar.stories.tsx`
- `components/corpus/IdentityBar/IdentityBar.tsx`
- `components/corpus/IdentityBar/index.ts`
- `components/corpus/SourcePanel/SourcePanel.module.css`
- `components/corpus/SourcePanel/SourcePanel.stories.tsx`
- `components/corpus/SourcePanel/SourcePanel.tsx`
- `components/embeddings/EmbeddingsView.module.css`
- `components/embeddings/EmbeddingsView.tsx`
- `components/evaluation/EvaluationView.tsx`
- `components/foundation/Caption/Caption.stories.tsx`
- `components/foundation/CodeText/CodeText.stories.tsx`
- `components/foundation/Divider/Divider.stories.tsx`
- `components/foundation/Foundation.stories.module.css`
- `components/foundation/Foundation.stories.tsx`
- `components/foundation/StatusText/StatusText.stories.tsx`
- `components/foundation/Text/Text.stories.tsx`
- `components/foundation/VisuallyHidden/VisuallyHidden.stories.tsx`
- `components/layout/AppShell/AppShell.stories.tsx`
- `components/layout/DashboardGrid/DashboardGrid.stories.tsx`
- `components/layout/FormRow/FormRow.stories.tsx`
- `components/layout/Inline/Inline.stories.tsx`
- `components/layout/Panel/Panel.stories.tsx`
- `components/layout/ScrollRegion/ScrollRegion.stories.tsx`
- `components/layout/Stack/Stack.stories.tsx`
- `components/layout/TabList/TabList.stories.tsx`
- `components/molecules/AppNav/AppNav.stories.tsx`
- `components/molecules/CoveragePanel/CoveragePanel.module.css`
- `components/molecules/CoveragePanel/CoveragePanel.stories.tsx`
- `components/molecules/CoveragePanel/CoveragePanel.tsx`
- `components/molecules/CoveragePanel/index.ts`
- `components/molecules/DataTable/DataTable.stories.tsx`
- `components/molecules/MetadataGrid/MetadataGrid.stories.tsx`
- `components/molecules/QueryPresetList/QueryPresetList.module.css`
- `components/molecules/QueryPresetList/QueryPresetList.stories.tsx`
- `components/molecules/QueryPresetList/QueryPresetList.tsx`
- `components/molecules/QueryPresetList/index.ts`
- `components/organisms/QueueHealthPanel/QueueHealthPanel.stories.tsx`
- `components/organisms/QueueHealthPanel/QueueHealthPanel.tsx`
- `components/organisms/QueueHealthPanel/index.ts`
- `components/organisms/ResultInspectorPanel/ResultInspectorPanel.module.css`
- `components/organisms/ResultInspectorPanel/ResultInspectorPanel.stories.tsx`
- `components/organisms/ResultInspectorPanel/ResultInspectorPanel.tsx`
- `components/organisms/ResultInspectorPanel/index.ts`
- `components/organisms/RetrievalResultsPanel/RetrievalResultsPanel.module.css`
- `components/organisms/RetrievalResultsPanel/RetrievalResultsPanel.stories.tsx`
- `components/organisms/RetrievalResultsPanel/RetrievalResultsPanel.tsx`
- `components/organisms/RetrievalResultsPanel/index.ts`
- `components/organisms/SearchControlsPanel/SearchControlsPanel.module.css`
- `components/organisms/SearchControlsPanel/SearchControlsPanel.stories.tsx`
- `components/organisms/SearchControlsPanel/SearchControlsPanel.tsx`
- `components/organisms/SearchControlsPanel/index.ts`
- `components/organisms/WorkflowListPanel/WorkflowListPanel.stories.tsx`
- `components/organisms/WorkflowListPanel/WorkflowListPanel.tsx`
- `components/organisms/WorkflowListPanel/index.ts`
- `components/organisms/WorkflowOpGraphPanel/WorkflowOpGraphPanel.module.css`
- `components/organisms/WorkflowOpGraphPanel/WorkflowOpGraphPanel.stories.tsx`
- `components/organisms/WorkflowOpGraphPanel/WorkflowOpGraphPanel.tsx`
- `components/organisms/WorkflowOpGraphPanel/index.ts`
- `components/organisms/WorkflowOpGroupsPanel/WorkflowOpGroupsPanel.stories.tsx`
- `components/organisms/WorkflowOpGroupsPanel/WorkflowOpGroupsPanel.tsx`
- `components/organisms/WorkflowOpGroupsPanel/index.ts`
- `components/organisms/WorkflowOpInspectorPanel/WorkflowOpInspectorPanel.module.css`
- `components/organisms/WorkflowOpInspectorPanel/WorkflowOpInspectorPanel.stories.tsx`
- `components/organisms/WorkflowOpInspectorPanel/WorkflowOpInspectorPanel.tsx`
- `components/organisms/WorkflowOpInspectorPanel/index.ts`
- `components/organisms/WorkflowOpResultPanel/WorkflowOpResultPanel.module.css`
- `components/organisms/WorkflowOpResultPanel/WorkflowOpResultPanel.stories.tsx`
- `components/organisms/WorkflowOpResultPanel/WorkflowOpResultPanel.tsx`
- `components/organisms/WorkflowOpResultPanel/index.ts`
- `components/organisms/WorkflowSummaryPanel/WorkflowSummaryPanel.module.css`
- `components/organisms/WorkflowSummaryPanel/WorkflowSummaryPanel.stories.tsx`
- `components/organisms/WorkflowSummaryPanel/WorkflowSummaryPanel.tsx`
- `components/organisms/WorkflowSummaryPanel/index.ts`
- `components/organisms/index.ts`
- `components/pages/DslPreviewPage/DslPreviewPage.module.css`
- `components/pages/DslPreviewPage/DslPreviewPage.tsx`
- `components/pages/DslPreviewPage/index.ts`
- `components/pages/EvaluationPage/EvaluationPage.module.css`
- `components/pages/EvaluationPage/EvaluationPage.stories.tsx`
- `components/pages/EvaluationPage/EvaluationPage.tsx`
- `components/pages/EvaluationPage/index.ts`
- `components/pages/PipelinePage/PipelinePage.stories.tsx`
- `components/pages/PipelinePage/PipelinePage.tsx`
- `components/pages/PipelinePage/index.ts`
- `components/pages/SearchWorkbenchPage/SearchWorkbenchPage.module.css`
- `components/pages/SearchWorkbenchPage/SearchWorkbenchPage.tsx`
- `components/pages/SearchWorkbenchPage/index.ts`
- `components/pages/index.ts`
- `components/pipeline/PipelineOverview.stories.tsx`
- `components/pipeline/PipelineOverview.tsx`
- `components/pipeline/PipelineView.tsx`
- `components/retro/MacButton.tsx`
- `components/retro/MacMenuBar.tsx`
- `components/retro/MacWindow.tsx`
- `components/search/SearchView.tsx`
- `components/workflows/WorkflowsView.module.css`
- `components/workflows/WorkflowsView.tsx`
- `components/workflows/workflowFormat.ts`
- `widgets/WidgetRenderer.stories.tsx`
- `hooks/index.ts`