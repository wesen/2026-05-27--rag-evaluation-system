---
Title: Recovered Frontend and Design-System Documents
Ticket: RAGEVAL-CONTEXT-WINDOWS-DESIGN
Status: active
Topics:
  - design-system
  - frontend-architecture
  - react
  - rag
  - ui-dsl
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Compact catalog of recovered frontend/design-system documents found via go-minitrace and git searches.
LastUpdated: 2026-06-07T00:00:00Z
WhatFor: Use as the source index before reading full prior design-system docs.
WhenToUse: Before planning transcript, context-window, annotation, or course page implementation.
---

# Recovered frontend/design-system documents

## RAG React Design System Guidelines

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/design-doc/02-rag-react-design-system-guidelines.md`
- Summary: RAG-specific React design-system guidelines modeled after the TTC foundation guide, defining ownership rules, file layout, Storybook requirements, CSS reduction strategy, and phased work needed to move the dashboard closer to a full design system.
- WhatFor: Use before adding or refactoring RAG React components, CSS modules, page boundaries, Storybook stories, or design-system primitives.
- First headings:
  - Executive Summary
  - Problem Statement
  - Current-State Evidence
  - Tokens exist but are too small for a full foundation surface
  - Foundation primitives exist but need stricter adoption
  - Layout primitives exist and should replace raw panel/layout globals
  - Reusable molecules exist but should absorb global table/metadata patterns
  - Storybook exists, but page coverage must be mandatory

## RAG Design System Guideline Audit

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/01/RAG-WEB-DESIGN-SYSTEM-REVIEW--rag-evaluation-web-architecture-and-design-system-review/analysis/01-rag-design-system-guideline-audit.md`
- Summary: Component-by-component audit of the current RAG React dashboard against the RAG React Design System Guidelines, including remaining CSS debt, missing Storybook stories, page-boundary gaps, and extraction recommendations.
- WhatFor: Use this audit to plan the next cleanup passes after foundation Storybook docs and to decide what should be extracted from each component.
- First headings:
  - Executive Summary
  - Audit Method
  - Current Layer Health
  - Strong / mostly compliant
  - Partially compliant
  - Non-compliant / next cleanup targets
  - Component-by-Component Audit and Extraction Plan
  - Foundation package

## Styling and Design Reference

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/01-styling-and-design-reference.md`
- First headings:
  - 1. Executive Summary
  - 2. Visual Identity
  - 2.1 The Retro Monochrome Language
  - 2.2 Typography Roles
  - 2.3 Status Vocabulary
  - 3. CSS Architecture
  - 3.1 Layer Ownership Rules
  - 3.2 The Global Stylesheet

## Widget Hierarchy and Interaction Reference

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/07/RAGEVAL-DS-RAGEVAL-QWEN36-HIGH--rag-design-system-reference-sheet-styling-design-widget-interaction-hierarchy/design-doc/02-widget-hierarchy-and-interaction-reference.md`
- First headings:
  - 1. Executive Summary
  - 2. The Composition Hierarchy
  - 2.1 Layer Map
  - 2.2 The Ownership Rule (Recap)
  - 2.3 How Layers Compose
  - 3. Information Hierarchy
  - 3.1 Density Scale
  - 3.2 Panel as the Primary Content Container

## Widget DSL Visual Quality Analysis and Implementation Guide

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/05/WIDGETDSL-VISUAL-QUALITY--widget-dsl-visual-quality-and-rich-website-design/design-doc/01-widget-dsl-visual-quality-analysis-and-implementation-guide.md`
- First headings:
  - Executive summary
  - Problem statement
  - Scope
  - Glossary
  - Evidence collected
  - Important computed-style evidence
  - Architecture overview
  - Layer 1: Widget IR

## WidgetRenderer Packaging Architecture and Implementation Guide

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/04/WIDGETSITE-PACKAGING--widgetrenderer-packaging-and-standalone-server-design/design-doc/01-widgetrenderer-packaging-architecture-and-implementation-guide.md`
- Summary: Architecture and implementation guide for packaging the WidgetRenderer as a Go-served default app plus reusable npm renderer package.
- WhatFor: Use this when creating a standalone WidgetRenderer server, extracting the RAG-local renderer into packages, or onboarding an intern to the Goja + React packaging model.
- First headings:
  - Executive Summary
  - Implementation Status as of 2026-06-05
  - Problem Statement and Scope
  - Current-State Architecture: Evidence Map
  - RAG frontend already has the Widget IR and renderer contract
  - RAG currently embeds a built SPA in Go
  - RAG has a working API shape for Widget IR pages
  - RAG now has a Goja `widget.dsl` skeleton

## UI DSL and Kanban DSL Design and Implementation Guide

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/01-ui-dsl-and-kanban-dsl-design-and-implementation-guide.md`
- Summary: Comprehensive design and implementation guide for adding UI DSL and Kanban DSL capabilities to the RAG Evaluation System, modeled after the goja-hosting-site reference implementation.
- WhatFor: Guide a new intern through understanding the RAG Evaluation System architecture and implementing UI DSL and Kanban DSL modules for webpage generation.
- First headings:
  - Executive Summary
  - Part 1: The RAG Evaluation System — What It Is
  - 1.1 System Purpose
  - 1.2 High-Level Architecture
  - 1.3 Key Backend Components
  - Part 2: The Frontend — React Component Architecture
  - 2.1 Tech Stack
  - 2.2 Component Organization (Atomic Design)

## RAG Widget DSL Design — Component-to-HTML Mapping

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/02-rag-widget-dsl-design-component-to-html-mapping.md`
- Summary: Detailed design for a RAG-specific widget DSL that maps each React component to a JavaScript constructor producing identical HTML structure and CSS classes via ui.dsl.
- WhatFor: Define the exact DSL API surface for every widget in the RAG system so JavaScript authors can generate pages identical to the React SPA.
- First headings:
  - Executive Summary
  - Part 1: Design Principles
  - 1.1 One-to-One Component Mapping
  - 1.2 Props Become Attribute Maps
  - 1.3 CSS Classes Are Hard-Coded
  - 1.4 Data Attributes for Component Identity
  - 1.5 Children Are DSL Nests
  - 1.6 Tables Use Column Definitions

## Review and Revised Implementation Guide for the RAG Widget DSL

- Path: `/home/manuel/workspaces/2026-05-27/rag-evaluation-system/2026-05-27--rag-evaluation-system/ttmp/2026/06/02/RAGEVAL-UI-DSL--ui-dsl-and-kanban-dsl-for-rag-evaluation-system-web-interface/design-doc/03-review-and-revised-implementation-guide-for-the-rag-widget-dsl.md`
- Summary: Review of the previous RAG widget DSL design, identifying strong ideas, incorrect assumptions, missing architecture, and a revised implementation plan centered on a typed Widget IR rendered by the actual React component registry.
- WhatFor: Help a new intern understand what the previous DSL proposal got right and wrong, and give them a safer implementation path for a real RAG-specific UI DSL.
- First headings:
  - Executive Summary
  - 1. What the Previous Work Did Well
  - 1.1 It corrected the biggest conceptual mistake: Kanban was only a pattern reference
  - 1.2 It read real component files instead of inventing widgets from memory
  - 1.3 It identified CSS as a real design problem
  - 1.4 It recognized that interactions need declarative action references
  - 1.5 It produced a useful widget catalog for onboarding
  - 2. What the Previous Work Did Less Well

# Obsidian/source articles referenced by transcripts

## RAG React Design System: From Prototype Dashboard to Structured Design System

- Path: `/home/manuel/code/wesen/go-go-golems/go-go-parc/Projects/2026/06/02/ARTICLE - RAG React Design System - From Prototype Dashboard to Structured Design System.md`
- First headings:
  - The starting point
  - The visual language was preserved
  - The core ownership rule
  - Pass 1: documentation and architecture review
  - Pass 2: tokens, foundation, and layout
  - Pass 3: atoms and basic controls
  - Pass 4: reusable molecules
  - Pass 5: Search as the first vertical slice
