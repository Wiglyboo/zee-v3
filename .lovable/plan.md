
# PlanSync — Quarterly Plan Visibility & Decision Platform

A premium internal tool for tracking quarterly product plans, quantifying ad-hoc impact, and capturing explicit stakeholder approvals. Built with a Linear/Stripe-inspired aesthetic — clean, data-rich, and motion-aware.

## Design Language
- **Palette**: Soft neutrals with semantic status colors — emerald (on track), amber (slight delay), rose (high delay), indigo/violet (ad-hoc). Subtle gradients on KPI cards, glassmorphism on overlays.
- **Typography**: Inter, tight tracking, strong hierarchy (display numbers for KPIs, mono for dates/deltas).
- **Motion**: Fade/slide entrances, animated counters, smooth bar transitions when timelines shift, count-up numbers, hover lift on cards.
- **Layout**: Persistent left sidebar (collapsible) + top bar with quarter selector and notifications bell.

## App Structure
- Sidebar nav: Dashboard · Ad-hoc Requests · Decisions · Audit Log · Analytics
- Top bar: Quarter selector (Q1–Q4), notifications popover, user avatar
- Toasts via Sonner for real-time broadcasts

## View 1 — Quarterly Plan Dashboard (`/`)
- **KPI strip**: 3 animated counter cards — % Planned Picked, % Ad-hoc Added, % Delivered, with trend deltas vs last quarter.
- **Gantt timeline**: Horizontal scrollable timeline with dual-layer bars (planned ghost bar + current solid bar). Connector lines from ad-hoc requests to impacted projects. Today marker line.
- **Project grid/table** (toggle view): Each row shows name + POC, Planned/Adhoc pill, category (SVOD/AVOD/B2C), resource deltas (E/T/D with planned→current), TD/ND with "+X days slipped", delay reason, color-coded progress bar, priority chip (1/2/3), ⚡ icon if impacted by ad-hoc (hover tooltip lists triggering request).
- Filters: category, status, priority, impacted-only.

## View 2 — Change Impact (`/requests/new` and `/requests/:id`)
- **Request summary card** (top): requester avatar, description, urgency pill.
- **Two-column workspace**:
  - Left input panel: resource sliders (E/T/D), estimated duration, urgency, source-project picker with auto-suggested in-category in-progress projects.
  - Right impact panel: Before/After timeline comparison with animated bar shifts, list of impacted projects showing old date → new date with delta badge, hero callout ("This request delays 3 projects by avg 2.3 weeks").
- Live recalculation as inputs change.

## View 3 — Stakeholder Decision Panel
- Sticky bottom panel on request detail (or modal): Approve / Reject CTAs, optional comment, animated countdown to decision deadline, plain-language impact summary.
- On decision: optimistic UI update, toast broadcast, audit entry created, project timelines and statuses recalculated with animation.

## Audit Log (`/audit`)
- Chronological feed grouped by day. Each entry: timestamp, actor avatar, action type icon, one-line impact summary, expandable details (diff of dates, resources moved, comment).

## Analytics (`/analytics`)
- Donut: Planned vs Delivered
- Stacked bar: Ad-hoc vs Planned per quarter
- Line: Avg delay per project over time
- Leaderboard: most-impacted projects / most-requested categories

## Notifications
- Bell icon with unread count, popover feed of recent ad-hoc requests with impact summary and quick "View" link. Toast on new request.

## Data & State
- All data mocked in-memory with realistic seed (12–15 projects across SVOD/AVOD/B2C, 3–4 ad-hoc requests, decision history). State managed via React context + reducer so approving a request actually shifts timelines and statuses across the app in real time.

## Delight Details
- Animated counters on KPIs and impact summaries
- Smooth bar morph when dates change
- Empty states with friendly copy ("No delays yet — great planning!")
- Hover on a project bar reveals mini popover with resources and POC
- Subtle confetti-free success state on approval (just a soft pulse + toast)

## Out of Scope (v1)
- Real backend / auth (can be added later via Lovable Cloud)
- Multi-tenant or permissions model
- Email notifications
