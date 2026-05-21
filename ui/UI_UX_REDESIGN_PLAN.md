# GoClaw UI/UX Redesign Plan
> Inspired by LobeHub / lobe-chat design system · React 19 + TailwindCSS v4 · shadcn/ui

---

## 1. Phân tích hiện trạng (Current State)

### Tech Stack hiện tại
| Layer | Hiện tại |
|---|---|
| Framework | React 19 + Vite |
| CSS | TailwindCSS v4 |
| Components | Radix UI primitives (shadcn/ui pattern) |
| State | Zustand |
| Data | WebSocket + React Query |
| Icons | Lucide React |
| Animation | Framer Motion (imported, ít dùng) |

### Vấn đề của UI hiện tại

1. **Sidebar quá tải** — 35+ mục điều hướng trong 7 nhóm, không phân cấp rõ ràng
2. **Topbar rối** — Language picker + timezone selector + settings + theme + user menu nhồi nhét vào 1 hàng
3. **Không có Command Palette** — Không có Cmd+K global search/navigation
4. **Chat không persistent** — Chat là 1 trang bình thường, không phải split-panel
5. **Agent cards thiếu visual** — Cards không có avatar, không có capability indicators nổi bật
6. **Không có micro-animations** — State transitions thô, không smooth
7. **Overview thiếu visual impact** — StatCards basic, không có hierarchy rõ ràng
8. **Detail pages dùng dialog** — Mở detail trong modal/dialog thay vì split-panel
9. **Mobile UX yếu** — Chỉ có slide-out sidebar, không tối ưu cho mobile
10. **Không có breadcrumbs** — Deep pages không có context navigation

---

## 2. LobeHub Design Principles (học hỏi)

### Layout Architecture
```
┌──┬──────────────────────────────────────────┐
│  │  Secondary Sidebar    │  Main Content     │
│P │  (contextual, resiz-  │  (Page/Panel)     │
│r │   able)               │                   │
│i │                       ├───────────────────┤
│m │  e.g. Agent list,     │  Detail / Chat    │
│a │  Session history,     │  Panel (optional) │
│r │  Settings sections    │                   │
│y │                       │                   │
└──┴───────────────────────┴───────────────────┘
```

### Key LobeHub Patterns
- **Primary nav rail** (48px) — icon-only, VS Code style, persistent
- **Secondary sidebar** — contextual, collapsible, resizable
- **Split-panel detail views** — list + detail side by side, no page navigation
- **Command palette** — `Cmd+K` để navigate, search, execute actions
- **Settings drawer** — slide-in từ phải thay vì full page
- **Rich agent cards** — avatar, model badge, capability tags, status dot
- **Chat UI** — bubble-based, Markdown rendering, streaming support
- **Smooth transitions** — `framer-motion` layout animations cho panels
- **Design tokens** — CSS custom properties cho colors, spacing, radius
- **Glass morphism** — subtle backdrop-blur trong dark mode

---

## 3. Kiến trúc Layout Mới

### 3.1 Shell Layout (3-column)

```
┌────┬──────────────────┬──────────────────────────────┐
│    │                  │                              │
│ N  │  LEFT PANEL      │  MAIN CONTENT AREA           │
│ A  │  (contextual)    │                              │
│ V  │  240px default   │  flex-1, overflow-y-auto     │
│    │  resizable       │                              │
│ R  │  e.g.:           │  <Outlet />                  │
│ A  │  - Agent list    │                              │
│ I  │  - Session list  │                              │
│ L  │  - Nav tree      │                              │
│    │                  │                              │
│ 4  │                  │                              │
│ 8  │                  │                              │
│ p  │                  │                              │
│ x  │                  │                              │
└────┴──────────────────┴──────────────────────────────┘
```

### 3.2 Navigation Rail (Primary)

```tsx
// Cấu trúc nav rail mới - chỉ 6 nhóm chính
const PRIMARY_NAV = [
  // Top section
  { icon: LayoutDashboard, label: "Overview", route: "/overview" },
  { icon: MessageSquare, label: "Chat", route: "/chat" },
  { icon: Bot, label: "Agents", route: "/agents" },
  { icon: Users, label: "Teams", route: "/teams" },
  // divider
  { icon: Zap, label: "Capabilities", route: "/capabilities" },  // sub-nav
  { icon: Database, label: "Data", route: "/data" },             // sub-nav
  // Bottom section (pinned)
  { icon: Activity, label: "Monitoring", route: "/monitoring" }, // sub-nav
  { icon: Settings, label: "Settings", route: "/settings" },    // sub-nav
]
```

### 3.3 Page nhóm Capabilities (secondary sidebar)

```
/capabilities
  /capabilities/skills
  /capabilities/tools
  /capabilities/mcp
  /capabilities/tts
  /capabilities/cron
  /capabilities/hooks
```

### 3.4 Page nhóm Data (secondary sidebar)

```
/data
  /data/memory
  /data/vault
  /data/knowledge-graph
  /data/storage
```

### 3.5 Page nhóm Monitoring (secondary sidebar)

```
/monitoring
  /monitoring/traces
  /monitoring/events
  /monitoring/activity
  /monitoring/logs
```

### 3.6 Settings Drawer (không còn /config page)

```
Settings slide-in drawer (480px)
├── General (language, timezone, theme)
├── Providers
├── CLI Credentials
├── API Keys
├── Packages
├── Config (admin)
├── Approvals
├── Import/Export
└── Backup/Restore
```

---

## 4. Component Redesign Chi tiết

### 4.1 NavRail Component (mới)

**File**: `src/components/layout/nav-rail.tsx`

```tsx
// Primary navigation rail - 48px wide, icon-only with tooltips
// - Active state: filled icon + background highlight
// - Hover: subtle bg + scale transform
// - Badge support (pending count)
// - Bottom pinned items (monitoring, settings)
// - Avatar/user menu ở bottom
```

**Design tokens**:
```css
--nav-rail-width: 48px;
--nav-rail-bg: hsl(var(--sidebar));
--nav-item-active-bg: hsl(var(--primary) / 0.1);
--nav-item-active-color: hsl(var(--primary));
```

### 4.2 SidePanel Component (mới)

**File**: `src/components/layout/side-panel.tsx`

```tsx
// Resizable contextual sidebar
// - Default: 240px
// - Min: 180px, Max: 400px
// - Collapse: 0px (với animation)
// - Header với title + collapse button
// - Scrollable content
// - Framer Motion cho resize/collapse transitions
```

### 4.3 AppShell Component (thay thế AppLayout)

**File**: `src/components/layout/app-shell.tsx`

```tsx
// 3-column shell
// - NavRail (48px, always visible)
// - SidePanel (conditional, controlled by route)
// - MainContent (flex-1)
// - CommandPalette (global overlay)
// - Toaster (notifications)
```

### 4.4 Command Palette (mới)

**File**: `src/components/command-palette/command-palette.tsx`

```tsx
// Trigger: Cmd+K
// Features:
// - Navigate to any page
// - Search agents by name
// - Search sessions
// - Create new agent/session
// - Quick actions (toggle theme, logout)
// - Recent pages history
// Built on: Radix UI Dialog + custom fuzzy search
```

### 4.5 AgentCard Redesign

**File**: `src/pages/agents/agent-card.tsx`

Hiện tại: Đơn giản, chỉ có tên + status + model
Mới:
```
┌─────────────────────────────────┐
│ ●  [Avatar/Emoji]  Agent Name   │
│    @key              [Running]  │
│                                 │
│ System prompt preview...        │
│                                 │
│ [Model badge] [Skills: 3]       │
│ [Team: Sales] [Last active 2h]  │
└─────────────────────────────────┘
```

### 4.6 Chat Page Redesign

Hiện tại: Trang chat đơn giản
Mới — **Persistent Split-Panel Chat**:

```
┌──────────────────┬──────────────────────────────────┐
│ Session List     │ Chat Window                      │
│ (secondary panel)│                                  │
│                  │ ┌─ Header: agent name, model ───┐│
│ Search           │ │                               ││
│ ─────────────    │ │  Message bubbles              ││
│ [Session 1]  ●   │ │  (Markdown rendered)          ││
│ [Session 2]      │ │  Streaming indicator          ││
│ [Session 3]      │ │                               ││
│ ...              │ └───────────────────────────────┘│
│                  │ ┌─ Input Area ──────────────────┐│
│                  │ │ [Attach] [Type message...] [▶]││
│                  │ └───────────────────────────────┘│
└──────────────────┴──────────────────────────────────┘
```

### 4.7 Overview Page Redesign

Hiện tại: Stats cards + tab "Usage" + cards

Mới — **Command Center Dashboard**:
```
┌──────────────────────────────────────────────┐
│  METRIC RIBBON (scroll-x on mobile)          │
│  [Req Today] [Tokens] [Cost] [Agents] [Ch]   │
├──────────────────────────────────────────────┤
│  LEFT: System Status      RIGHT: Activity    │
│  - Uptime gauge           - Last 8 traces    │
│  - Provider health        - Live events      │
│  - Channel status dots    - Cron upcoming    │
├──────────────────────────────────────────────┤
│  BOTTOM: Agent Activity Grid                 │
│  [Mini agent cards with running status]      │
└──────────────────────────────────────────────┘
```

---

## 5. Design Tokens & Visual Language

### 5.1 Color System

```css
/* Extend existing CSS variables với LobeHub-inspired palette */

/* Brand */
--brand-primary: 262 80% 62%;      /* violet */
--brand-secondary: 191 100% 42%;   /* cyan */

/* Surfaces */
--surface-1: var(--background);
--surface-2: hsl(var(--muted) / 0.5);
--surface-3: hsl(var(--card));
--surface-overlay: hsl(var(--background) / 0.8);

/* Status */
--status-running: 142 71% 45%;     /* green */
--status-idle: 48 96% 53%;         /* amber */
--status-error: 0 84% 60%;         /* red */
--status-offline: var(--muted-foreground);

/* Nav */
--nav-rail-width: 48px;
--side-panel-width: 240px;
```

### 5.2 Typography Scale

```css
/* Headings */
.page-title { @apply text-2xl font-semibold tracking-tight; }
.section-title { @apply text-base font-semibold; }
.card-title { @apply text-sm font-medium; }

/* Body */
.body-base { @apply text-sm text-foreground; }
.body-muted { @apply text-sm text-muted-foreground; }
.caption { @apply text-xs text-muted-foreground; }

/* Mono */
.code { @apply font-mono text-xs; }
```

### 5.3 Animation Presets

```tsx
// Framer Motion variants
export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15, ease: "easeOut" }
};

export const slideInFromLeft = {
  initial: { x: -16, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -16, opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" }
};

export const panelCollapse = {
  animate: { width: "auto" },
  exit: { width: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};
```

### 5.4 Radius & Spacing

```css
/* Keep existing radii but add panel-specific */
--radius-panel: 0px;        /* panels flush to edges */
--radius-card: 0.75rem;     /* cards */
--radius-chip: 9999px;      /* pills/badges */
--radius-input: 0.5rem;     /* form inputs */
```

---

## 6. Kế hoạch thực hiện (Roadmap)

### Phase 1 — Foundation (Sprint 1-2) 🔴 CRITICAL

| Task | Files | Effort |
|---|---|---|
| Design tokens extension | `src/index.css` | S |
| NavRail component | `src/components/layout/nav-rail.tsx` | M |
| SidePanel (resizable) | `src/components/layout/side-panel.tsx` | M |
| AppShell refactor | `src/components/layout/app-shell.tsx` | L |
| Route grouping | `src/routes.tsx` | M |
| Animation presets | `src/lib/animations.ts` | S |

### Phase 2 — Core Pages (Sprint 3-4) 🟠 HIGH

| Task | Files | Effort |
|---|---|---|
| Command Palette | `src/components/command-palette/` | L |
| Chat redesign (split-panel) | `src/pages/chat/` | L |
| Agent card redesign | `src/pages/agents/agent-card.tsx` | M |
| Agents split-panel | `src/pages/agents/agents-page.tsx` | M |
| Overview dashboard | `src/pages/overview/` | M |
| Settings drawer | `src/components/layout/settings-drawer.tsx` | L |

### Phase 3 — Polish (Sprint 5-6) 🟡 MEDIUM

| Task | Files | Effort |
|---|---|---|
| Page transitions | All page components | M |
| Mobile UX overhaul | `app-shell.tsx` + all pages | L |
| Breadcrumb system | `src/components/shared/breadcrumb.tsx` | S |
| Empty states redesign | `src/components/shared/empty-state.tsx` | S |
| Loading skeletons redesign | `src/components/shared/loading-skeleton.tsx` | S |
| Notification toasts | `src/components/ui/toaster.tsx` | S |
| Status dot indicators | `src/components/shared/status-dot.tsx` | S |

### Phase 4 — Secondary Pages (Sprint 7-8) 🟢 LOW

| Task | Effort |
|---|---|
| Capabilities section (Skills, Tools, MCP, Cron) | L |
| Data section (Memory, Vault, Knowledge Graph) | M |
| Monitoring section (Traces, Events, Logs) | M |
| Teams split-panel | M |
| Sessions split-panel | M |

---

## 7. Breaking Changes & Migration Notes

### Route changes
```
/config          → /settings (Settings Drawer)
/providers       → /settings/providers
/cli-credentials → /settings/credentials
/api-keys        → /settings/api-keys
/packages        → /settings/packages
/import-export   → /settings/import-export
/backup-restore  → /settings/backup
/approvals       → /settings/approvals
/skills          → /capabilities/skills
/builtin-tools   → /capabilities/tools
/mcp             → /capabilities/mcp
/tts             → /capabilities/tts
/cron            → /capabilities/cron
/hooks           → /capabilities/hooks
/memory          → /data/memory
/vault           → /data/vault
/knowledge-graph → /data/knowledge-graph
/storage         → /data/storage
/traces          → /monitoring/traces
/events          → /monitoring/events
/activity        → /monitoring/activity
/logs            → /monitoring/logs
```

**Note**: Cần redirect từ routes cũ → routes mới để không break bookmarks.

### Component breaks
- `AppLayout` → `AppShell`
- `Sidebar` → `NavRail` + `SidePanel`
- `Topbar` → bỏ, chức năng phân tán vào NavRail bottom + Settings drawer
- `PageHeader` → giữ nhưng redesign

---

## 8. File Structure Mới

```
src/
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx          (NEW - replaces app-layout.tsx)
│   │   ├── nav-rail.tsx           (NEW)
│   │   ├── side-panel.tsx         (NEW - resizable contextual panel)
│   │   ├── settings-drawer.tsx    (NEW - replaces topbar settings)
│   │   ├── breadcrumb.tsx         (NEW)
│   │   └── ...existing files kept for now
│   ├── command-palette/
│   │   ├── command-palette.tsx    (NEW)
│   │   ├── command-item.tsx       (NEW)
│   │   └── use-command-palette.ts (NEW)
│   ├── shared/
│   │   ├── status-dot.tsx         (NEW)
│   │   ├── agent-avatar.tsx       (NEW)
│   │   └── ...
│   └── ui/
│       └── ...existing components
├── lib/
│   ├── animations.ts              (NEW - framer-motion presets)
│   └── ...
└── pages/
    ├── capabilities/              (NEW - grouped section)
    ├── data/                      (NEW - grouped section)
    ├── monitoring/                (NEW - grouped section)
    └── settings/                  (NEW - drawer-based settings)
```

---

## 9. Visual Mockup Descriptions

### 9.1 New Shell (Dark Mode)

```
┌────────────────────────────────────────────────────────────────┐
│ 48px │ 240px Secondary Panel      │ Main Content Area         │
│ rail │                            │                           │
│  ●   │ ┌ Agents ───────────────┐  │ ┌──────────────────────┐  │
│  💬  │ │ + New Agent  [search] │  │ │ Agent Detail         │  │
│ [B]  │ │ ─────────────────── │  │ │                      │  │
│      │ │ ● SalesBot    [run]  │  │ │ [tabs: Config/Prompt/│  │
│ [⚡] │ │ ● SupportBot  [run]  │  │ │  Skills/Sessions/Mem]│  │
│ [DB] │ │ ○ AnalyticsBot      │  │ │                      │  │
│      │ │ ...                  │  │ └──────────────────────┘  │
│ ─── │ └──────────────────────┘  │                           │
│      │                            │                           │
│ [📊] │                            │                           │
│ [⚙]  │                            │                           │
│ [👤] │                            │                           │
└────────────────────────────────────────────────────────────────┘
```

### 9.2 Chat View

```
┌────────────────────────────────────────────────────────────────┐
│ 48px │ Sessions Panel  240px      │ Chat Window               │
│ rail │                            │                           │
│  ●   │ New Chat  [+]              │ ● SalesBot · GPT-4o      │
│ [💬] │ ─────────────────────────  │ ─────────────────────── │
│      │ 🔍 Search sessions...      │                           │
│      │ ─────────────────────────  │  [User bubble]           │
│      │ Today                      │  Hello, what can you do? │
│      │  ● Marketing campaign      │                           │
│      │  ○ Q2 analysis             │  [Agent bubble]          │
│      │ Yesterday                  │  I can help you with...  │
│      │  ○ Product launch          │  ▋ (streaming)           │
│      │                            │                           │
│      │                            │ ─────────────────────── │
│      │                            │ 📎  Type a message...  ▶ │
└────────────────────────────────────────────────────────────────┘
```

---

## 10. Decisions & Constraints

### Giữ nguyên
- Tech stack (React + Vite + TailwindCSS v4 + shadcn)
- WebSocket API layer
- i18n system (react-i18next)
- Zustand stores
- Form patterns (react-hook-form + zod)

### Không áp dụng từ LobeHub
- Không migrate sang Next.js (GoClaw là pure SPA)
- Không dùng @lobehub/ui hoặc antd (giữ shadcn/ui)
- Không dùng CSS-in-JS (giữ TailwindCSS)
- Không dùng tRPC (giữ WebSocket protocol)

### Áp dụng từ LobeHub
- Multi-rail navigation pattern
- Split-panel page layouts
- Command palette pattern
- Rich agent cards với avatar
- Persistent chat interface
- Settings as drawer
- Smooth micro-animations
- Design token system
- Status dot indicators

---

## 11. Success Metrics

- [ ] Sidebar item count giảm từ 35+ xuống 8 primary rail items
- [ ] Chat accessible từ mọi trang (không cần navigate)
- [ ] Agent detail không mở dialog, dùng split-panel
- [ ] Settings không cần separate page
- [ ] Command Palette hoạt động (Cmd+K)
- [ ] Page load transitions mượt (Framer Motion)
- [ ] Mobile: bottom nav bar thay sidebar drawer
- [ ] Lighthouse Performance score > 90
