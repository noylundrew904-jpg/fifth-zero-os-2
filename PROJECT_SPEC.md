# Fifth & Zero OS — Master Specification (Starter Edition)

> This document is the single source of truth for Claude Code.

## Mission

Build a calm, premium personal operating system that combines:
- Tasks
- Clients
- Projects
- Finance
- Health
- Habits
- Calendar
- Notes

The home screen must never feel overwhelming.

## Core Principles

1. Show only what matters now.
2. Everything else is one click away.
3. Progressive disclosure.
4. Desktop-first PWA-ready.
5. Pure HTML, CSS, JavaScript.
6. LocalStorage first.
7. Future-ready for Supabase.

## Home Dashboard

Greeting, date, time.

Cards only:
- Tasks Today
- Cash Available
- Pending Payments
- Steps
- Calories
- Calendar Events

Quick actions: + Task, + Expense, + Client, + Note

Each card expands into a detailed module.

## Modules

### Tasks
Today's tasks, priorities, deadlines, recurring tasks.

### Finance
Income, expenses, subscriptions, loans, pending invoices, charts.

### Clients
CRM, contacts, projects, notes, invoices.

### Projects
Timeline, budget, tasks, profit.

### Health
Manual entry initially. Future Apple Health sync.

Metrics: Steps, Calories, Weight, Sleep, Workout, Water

### Habits
Streaks and completion.

### Knowledge
Markdown notes and search.

## Folder Structure

```
index.html
styles.css
script.js

/modules
/components
/utils
/data
```

## Local Storage

tasks, clients, projects, finance, health, habits, settings

Keep each isolated.

## Future Integrations

Supabase, Apple Health, Google Calendar, Gmail, Drive, AI assistant

## Design

Dark mode. Apple + Linear inspired. Lots of whitespace. Rounded cards.
Smooth animations. No clutter.

## Coding Rules

Comment everything. Modular functions. Reusable components. No
duplicated code. No frameworks.

## Acceptance Criteria

Everything works offline. No broken buttons. Expandable cards. Easy to
extend.

After completing Version 1, recommend improvements before adding new
features.
