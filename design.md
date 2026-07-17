# 🎨 CP Exam Seat — Design System & Frontend Specification

> **วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น**
> Central design reference for the `cpkku-view` frontend — covers visual identity, component API, responsive patterns, and per-page layout.

---

## 1. Design Identity — "Minimal Blue-Navy"

### Philosophy

> **"สะอาด ทันสมัย โล่งสบายตา"** — Clean minimalism with balanced visual hierarchy.
> Inspired by: Linear.app, Vercel Dashboard, and refined dark/light mode interfaces.

### Color Palette

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FAFBFE` Lavender Mist | `#0A0F24` Deep Navy |
| Surface | `#FFFFFF` Pure White | `#141B35` Navy Abyss |
| Surface Hover | `#F4F6FA` | `#1E2647` |
| Border | `#E8ECF4` Frost | `#232E52` Graphite |
| Text Primary | `#0F172A` Ink | `#F1F5F9` Snow |
| Text Secondary | `#64748B` Pewter | `#A5B4D4` Silver |
| Text Muted | `#94A3B8` Fog | `#6475B2` Ash |

**Organic Accent Colors**

| Name | Light (Soft Pastel) | Dark (Muted Contrast) | Usage |
|------|-------|-------|-------|
| Subjects | `bg-blue-500/10` / `text-blue-600` | `bg-blue-500/20` / `text-blue-300` | Exams count |
| Rooms | `bg-emerald-500/10` / `text-emerald-600` | `bg-emerald-500/20` / `text-emerald-300` | Rooms count |
| Days | `bg-violet-500/10` / `text-violet-600` | `bg-violet-500/20` / `text-violet-300` | Days count |
| Branch | `#F1F5F9` bg / `#475569` text | `bg-indigo-500/15` / `text-indigo-300` | Major / Branch badge |

**Color Accents**
```
Indigo/Blue  → Emerald/Teal  → Violet/Rose
```

Used in: Logo badge, hero subtitle, seat-detail accent stripe, glassmorphic card glow meshes.

### Typography

```
Primary:    "Inter" (Latin, numbers, UI) — Google Fonts
Fallback:   "Prompt" (Thai glyphs) — Bunny Fonts
Monospace:  System mono stack (student IDs, course codes, seat numbers)
```

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 3rem (48px) | 900 | Hero title "ค้นหาที่นั่งสอบ" |
| H1 | 2.25rem (36px) | 900 | Page titles |
| H2 | 1.125rem (18px) | 800 | Card/section headers |
| Body | 0.875rem (14px) | 600 | Default text |
| Caption | 0.75rem (12px) | 700 | Primary labels |
| Sub-Caption | 0.6875rem (11px) | 700 | Metadata sub-labels (Sec, Date, Time etc.) |
| Micro | 0.625rem (10px) | 800 | Badges, seat cell labels |
| Nano | 0.5rem (8px) | 800 | Tiny labels inside small cards |

### Spacing & Radius

```
Spacing scale:  4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80
Border radius:  sm=6px  md=10px  lg=14px  xl=20px  2xl=24px  full=9999px
```

### Shadows

| Level | Usage |
|-------|-------|
| `shadow-sm` | Buttons, badges |
| `shadow-md` | Cards at rest |
| `shadow-lg` | Floating panels, dropdowns |
| `shadow-xl` | Exam cards, search card |
| `shadow-2xl` | Hover lift state, modals |

### Animation Tokens

| Token | Specification | Usage |
|-------|--------------|-------|
| `page-enter` | fade-in + slide-up, 400ms ease-out, stagger 60ms | Page route transitions |
| `card-hover` | translateY(−2px), 200ms, shadow increase | Card hover states |
| `button-press` | scale(0.97), 100ms | Button active state |
| `count-up` | Tween from 0, 800ms ease-out | Stat number animations |
| `skeleton-shimmer` | Gradient sweep, 1.5s ease infinite | Loading placeholders |
| `chart-grow` | scaleY(0→1), 600ms spring, stagger 80ms | Bar chart entrance |
| `radar-pulse` | Box-shadow ring pulse, infinite | Target seat indicator |

---

## 2. Component Architecture

### File Structure

```
frontend/src/
├── components/
│   ├── ui/                    # Shared design primitives
│   │   ├── Button.tsx         # variant: primary|secondary|ghost, size: sm|md|lg
│   │   ├── Card.tsx           # glass, borderVariant, hover lift
│   │   ├── Badge.tsx          # variant colors, size: sm|md
│   │   ├── Select.tsx         # Styled <select> with chevron
│   │   ├── Input.tsx          # leftIcon slot, focus ring
│   │   ├── Skeleton.tsx       # Shimmer loading placeholder
│   │   └── EmptyState.tsx     # Icon + title + description
│   │
│   ├── icons/                 # Unified icon wrapper
│   │   └── index.tsx          # Re-exports from lucide-react + custom Github SVG
│   │
│   ├── layout/                # App chrome
│   │   ├── AppShell.tsx       # Root: aurora blurs, Navbar, MobileTabBar, <Outlet>
│   │   ├── Navbar.tsx         # Desktop nav links + theme/GitHub controls
│   │   ├── MobileTabBar.tsx   # Fixed bottom tab bar (md:hidden)
│   │   └── PageTransition.tsx # Route entrance animation wrapper
│   │
│   ├── search/                # StudentSearch sub-components
│   │   ├── SearchHistory.tsx  # History dropdown list
│   │   └── StudentProfileCard.tsx  # Post-search student identity + branch card
│   │
│   ├── exam/                  # Exam display
│   │   ├── ExamCard.tsx       # Left details + Right SeatMap preview
│   │   └── ExamCardSkeleton.tsx # Shimmer loading state
│   │
│   ├── room/                  # Room/seat visualization
│   │   └── SeatMap.tsx        # Interactive pan/zoom seat grid with legend
│   │
│   ├── ImageViewer.tsx        # Fullscreen pan/zoom image overlay
│   └── ScrollToTopButton.tsx  # Floating scroll-to-top
│
├── hooks/
│   ├── useTheme.ts            # Dark/light mode toggle
│   └── useAnimatedNumber.ts   # Count-up tween for stat numbers
│
├── lib/
│   ├── constants.ts           # SEAT_PALETTE[], design tokens
│   └── utils.ts               # parseSeat(), formatting helpers
│
├── pages/
│   ├── StudentSearch.tsx      # "/" — Search by student ID
│   ├── RoomInfo.tsx           # "/room" — Room cards + Leaflet map
│   ├── RoomExplorer.tsx       # "/explorer" — Interactive seat map
│   └── Stats.tsx              # "/stats" — Dashboard statistics
│
├── index.css                  # Tailwind v4 @theme tokens, global styles
├── App.tsx                    # React Router setup
├── main.tsx                   # Entry point
├── config.ts                  # GitHub URL, app metadata
└── types.ts                   # ExamResult, RoomConfig, LayoutItem types
```

### UI Primitive API Reference

#### `<Button>`
```tsx
variant: "primary" | "secondary" | "ghost"   // primary = blue gradient
size:    "sm" | "md" | "lg"                  // lg = py-3.5
icon?:   ReactNode                           // Left icon slot
fullWidth?: boolean
```

#### `<Card>`
```tsx
glass?:         boolean    // backdrop-blur + frosted border
borderVariant?: "default" | "rose" | "amber" | "sky"
className?:     string     // Tailwind overrides
```

#### `<Badge>`
```tsx
variant: "blue" | "indigo" | "rose" | "amber" | "sky" | "slate"
size:    "sm" | "md"
```

#### `<Select>`
```tsx
label?:    string              // Optional label text above
options?:  {value, label}[]    // Alternative to children
disabled?: boolean
```

#### `<Input>`
```tsx
label?:              string
leftIcon?:           ReactNode
containerClassName?: string
```

---

## 3. Layout System

### AppShell Structure

```
┌─────────────────────────────────────────────────┐
│  Navbar (h-16, sticky, backdrop-blur)           │  ← Always visible
│  [Logo] [Desktop Nav Links] [Theme] [GitHub]    │
├─────────────────────────────────────────────────┤
│                                                  │
│  <main> — flex-1, overflow-hidden               │  ← pb-16 on mobile for tab bar
│    <Outlet /> (page content)                    │
│                                                  │
├─────────────────────────────────────────────────┤
│  MobileTabBar (h-16, fixed bottom, md:hidden)   │  ← 4 tabs with icons
│  [🔍 ค้นหา] [🏫 ห้องสอบ] [🗺️ สำรวจ] [📊 สถิติ]  │
└─────────────────────────────────────────────────┘

Background: Two large aurora blur circles (indigo + cyan) at
            absolute position behind all content, pointer-events-none
```

### Navigation

| Viewport | Pattern | Details |
|----------|---------|---------|
| Desktop (≥768px) | Top navbar links | Horizontal pill-shaped links with icons, active = blue bg |
| Mobile (<768px) | Bottom tab bar | Fixed bottom, 4 tabs, icon + 10px label, active = blue tint bg |

**Desktop Navbar** hides nav links on mobile; **MobileTabBar** hides on desktop via `md:hidden`.

---

## 4. Responsive Breakpoints

```
           0px           640px          768px         1024px        1280px
            │              │              │              │              │
  ◄─ MOBILE ──────────────►│              │              │              │
            │  ◄─ sm ──────►              │              │              │
            │              │  ◄─ md ──────►              │              │
            │              │              │  ◄─ lg ──────►              │
            │              │              │              │  ◄─ xl ──────►
```

| Breakpoint | Tailwind | Target |
|------------|----------|--------|
| Default (0) | — | Phones (portrait, 320–639px) |
| `sm:` | 640px | Large phones (landscape), small tablets |
| `md:` | 768px | **Primary mobile↔desktop split** — tablets, landscape |
| `lg:` | 1024px | Small laptops |
| `xl:` | 1280px | Desktop monitors |

### Global Mobile Rules

1. **Bottom safe area**: `<main>` has `pb-16 md:pb-0` to clear MobileTabBar
2. **Touch targets**: All interactive elements ≥ 44×44px on mobile
3. **No hover-only interactions**: Every hover effect has a tap/click equivalent
4. **Font scaling**: Hero title `text-3xl md:text-5xl`, body stays `text-sm`
5. **Padding**: `px-4` on mobile, `px-6` on `md:` and above
6. **Single column default**: Grids start as `grid-cols-1`, expand at `md:`

---

## 5. Page-by-Page Layout Specification

### 5.1 StudentSearch (`/`)

**Purpose**: Primary landing page — search exam seat by student ID, with prominent student branch/major display after search.

#### Design Concept

> After searching, the page transitions from a "search landing" to a "student profile + exam schedule" view.
> The key new component is the **Student Profile Card** — a wide glassmorphic banner that appears between the search card and exam results, showing the student's identity, branch/major, and exam count at a glance.

#### Student Profile Card Specification

This new component (`<StudentProfileCard>`) appears only after a successful search with results.

```
┌── Student Profile Card (full content width, minimal blue-navy style) ┐
│                                                                      │
│  ┌──────┐                                                            │
│  │  68  │  รหัสนักศึกษา (Student ID)          ┌──────────────────┐  │
│  │avatar│  683380031-4                        │ Computer Science │  │
│  │square│  (mono, tracking-wider)             │ (navy/slate badge)│  │
│  └──────┘                                     └──────────────────┘  │
│                                                                      │
│  3 รายวิชา       2 ห้องสอบ       2 วันสอบ (spaced row, no icons)    │
│                                                                      │
│  [▼ เพิ่มตารางสอบลงปฏิทิน] (minimal flat accordion)                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Props / Data:**
| Field | Source | Display |
|-------|--------|---------|
| Student ID | `studentId` state | Monospace, bold, `text-lg` |
| Branch | `branch` from API → `formatBranch()` | Slate/Indigo pill badge (no icon), `font-bold` |
| Exam Count | `results.length` | Text: "{n} รายวิชา" (no icons) |
| Room Count | `new Set(results.map(r => r.room)).size` | Text: "{n} ห้องสอบ" (no icons) |
| Exam Days | `new Set(results.map(r => r.date)).size` | Text: "{n} วันสอบ" (no icons) |

**Styling Tokens:**
```
Card:           pure white / navy surface (bg-white dark:bg-slate-900), max-w-3xl, w-full, p-6, rounded-2xl, border-slate-200 dark:border-slate-800
Avatar Box:     w-12 h-12, bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500
                text-white font-black, rounded-full, flex items-center justify-center
                Content: first 2 chars of student ID (e.g. "68")
Branch Badge:   bg-slate-100 dark:bg-indigo-500/15
                text-slate-700 dark:text-indigo-300
                border border-slate-200 dark:border-indigo-500/30
                px-3.5 py-1 rounded-full font-bold text-xs
Stat Chips:
  - Subjects:   bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300
                border border-blue-200/50 dark:border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold
  - Rooms:      bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300
                border border-emerald-200/50 dark:border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold
  - Days:       bg-violet-500/10 dark:bg-violet-500/20 text-violet-650 dark:text-violet-300
                border border-violet-200/50 dark:border-violet-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold
```

**Animation:** Entrance: `fade-in + slide-up 400ms ease-out` when results load.

#### Desktop (≥768px)

```
┌──────────────────────────────────────────────────────┐
│                       Navbar                          │
├──────────────────────────────────────────────────────┤
│                                                        │
│      ◌ Aurora gradient mesh (animated blurs)          │
│                                                        │
│             ✨ ค้นหาที่นั่งสอบ                         │  ← text-5xl
│        วิทยาลัยการคอมพิวเตอร์ มข.                    │  ← gradient text
│                                                        │
│  ┌──── Glass Search Card (max-w-lg) ──────────────┐  │
│  │  [Exam Round ▾]                                 │  │
│  │  ┌────────────────────────┬──────────────────┐  │  │
│  │  │  🔍  683380031-4       │  ค้นหาที่นั่งสอบ  │  │  │  ← inline input+button
│  │  └────────────────────────┴──────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──── Student Profile Card (max-w-3xl) ──────────┐  │  ← NEW: appears after search
│  │ ┌────┐  Student ID             ┌──────────────┐│  │
│  │ │ 68 │  683380031-4            │🎓 Computer   ││  │
│  │ └────┘                          │   Science    ││  │
│  │                                 └──────────────┘│  │
│  │ [📋 3 รายวิชา] [🏫 2 ห้อง] [📅 2 วัน]            │  │
│  │ [▼ เพิ่มตารางสอบลงปฏิทิน]                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│    ── ตารางสอบทั้งหมด (3 รายการ) ──                   │  ← section label
│                                                        │
│  ┌── ExamCard ────────────────────────────────────┐  │
│  │  LEFT 38%             │  RIGHT 62%             │  │
│  │  Subject name         │  SeatMap               │  │
│  │  Code · Sec badge     │  (pan/zoom)            │  │
│  │  📅 Date  ⏰ Time     │                        │  │
│  │  ┌─ Room ──── Seat ─┐│                        │  │
│  │  │ CP.9127     A12  ││                        │  │
│  │  └──────────────────┘│                        │  │
│  │  [🗺️ Explorer] [📷]  │                        │  │
│  └───────────────────────┴────────────────────────┘  │
│                                                        │
│  ┌── ExamCard ────────────────────────────────────┐  │
│  │  ...next exam...                                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
└──────────────────────────────────────────────────────┘

── When NO results yet (initial state): ─────────────────

│  ┌─ Stats Quick Glance (3-col grid) ──────────────┐  │
│  │ ┌──────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│  │ │ 2,847    │ │ Top Subjects │ │ Cohorts      │ │  │
│  │ │ คน       │ │ list         │ │ breakdown    │ │  │
│  │ │ 14 ห้อง  │ │              │ │              │ │  │
│  │ └──────────┘ └──────────────┘ └──────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar (compact)    │
├────────────────────────────┤
│                             │
│   ✨ ค้นหาที่นั่งสอบ        │  ← text-3xl
│   วิทยาลัยการคอมพิวเตอร์   │
│                             │
│  ┌── Glass Search Card ──┐ │  ← full width, max-w-lg
│  │ [Exam Round ▾]         │ │
│  │ ┌────────────┬───────┐ │ │
│  │ │ 683380xx.. │ค้นหา  │ │ │  ← inline input+button
│  │ └────────────┴───────┘ │ │
│  └────────────────────────┘ │
│                             │
│  ┌── Student Profile ─────┐ │  ← NEW: compact mobile version
│  │ ┌──┐ 683380031-4       │ │
│  │ │68│ ┌──────────────┐  │ │
│  │ └──┘ │🎓 Comp. Sci. │  │ │  ← abbreviated on narrow
│  │      └──────────────┘  │ │
│  │ [📋 3] [🏫 2] [📅 2]    │ │  ← compact chips
│  │ [▼ ปฏิทิน]              │ │
│  └────────────────────────┘ │
│                             │
│  ── 3 รายการ ──             │
│                             │
│  ┌── ExamCard (stacked) ─┐ │
│  │  Subject info          │ │
│  │  Date / Time           │ │
│  │  Room / Seat           │ │
│  │  [Explorer] [Map]      │ │
│  │  ─ border-b ─          │ │
│  │  SeatMap preview       │ │  ← h-48 sm:h-64
│  └────────────────────────┘ │
│                             │
├────────────────────────────┤
│  MobileTabBar (fixed)       │
└────────────────────────────┘

── When NO results yet (initial state): ─────────

│  ┌── Stats (1-col stack) ─┐ │
│  │ ┌── นักศึกษา 2,847 ──┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── ห้องสอบ 14 ──────┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── Top Subjects ────┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── Cohorts ─────────┐ │ │
│  │ └────────────────────┘ │ │
│  └────────────────────────┘ │
```

#### Search Card Redesign: Inline Input+Button

The search button and student ID input are **responsive**—stacking vertically (`flex-col`) on mobile to maximize input and recent history dropdown width, and aligning inline (`md:flex-row`) on desktop/tablet:

```tsx
// Layout: flex-col (mobile) -> md:flex-row (desktop)
<div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
  <div className="w-full md:flex-1 relative">
    <Input className="w-full font-mono text-center text-xl" ... />
  </div>
  <button className="w-full md:w-auto shrink-0 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white flex items-center justify-center gap-2 h-[50px]">
    <Search className="w-5 h-5 text-white" />
    <span>ค้นหา</span>
  </button>
</div>
```

#### Stats Summary Dashboard: Rainbow Cards
On the initial page state, statistical summary cards display with colorful left-border accent bars and matching color numbers:
- **Headcount Card**: `border-l-blue-500` / `text-blue-600 dark:text-blue-400`
- **Rooms Card**: `border-l-emerald-500` / `text-emerald-600 dark:text-emerald-400`
- **Top Subjects Card**: `border-l-sky-500` / `bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300`
- **Cohort Breakdown Card**: `border-l-violet-500` / `text-violet-600 dark:text-violet-400`

#### Completed Exams Filter: "ซ่อนวิชาที่สอบผ่านไปแล้ว"
A checklist toggle appears directly above search results to control passed exam visibility:
- **Default State (Unchecked / disabled)**: All exams (including past ones) display in normal colors sorted chronologically.
- **Enabled State (Checked)**: Exams that have already passed (according to current local time) are pushed to the bottom of the list and grayed out using `opacity-40 filter grayscale pointer-events-none`.
- **Sync**: State is saved in `localStorage` under `hide_passed_exams`.

This reduces vertical height of the search card and feels more like a modern search bar.

#### Key Design Changes from Previous Version

| Aspect | Before | After |
|--------|--------|-------|
| Branch display | Small badge inside search card, easy to miss | **Student Profile Card** — dedicated full-width banner |
| Search button | Full-width below input | Stacks on mobile, inline on desktop |
| Calendar actions | Inside search card | Moved to Student Profile Card |
| Stat chips | Not present | Shows exam count, room count, exam days |
| Profile avatar | Not present | Gradient circle with year prefix (e.g. "68") |
| Post-search flow | Search card → exams | Search card → **Profile Card** → exams |

**Key Mobile Adaptations:**
- Hero title shrinks from `text-5xl` → `text-3xl`
- Search card stays centered, `max-w-lg`, full-width padding `p-6`
- Search input and button stack vertically on mobile to prevent squeezing history dropdown
- Student Profile Card: avatar + ID on one line, branch badge below, stat chips in compact row
- Stats grid switches from `md:grid-cols-3` → `grid-cols-1` (initial state only)
- ExamCard switches from `md:flex-row` → `flex-col` (details on top, map below)
- SeatMap preview height: `h-48 sm:h-64` on mobile vs `h-auto` filling card on desktop
- Calendar action section is collapsible by default to reduce mobile height
- Content area has `pb-20` to clear MobileTabBar

---

### 5.2 RoomInfo (`/room`)

**Purpose**: Browse all exam rooms with Leaflet map + room cards.

#### Desktop (≥768px)

```
┌──────────────────────────────────────────────┐
│                 Navbar                        │
├──────────────────────────────────────────────┤
│  ← กลับ    ข้อมูลห้องสอบทั้งหมด              │
│             วิทยาลัยการคอมพิวเตอร์ มข.        │
│                                               │
│  [🔍 ค้นหาห้อง...] [ทั้งหมด] [CP] [SC]       │
│                                               │
│  ┌── Leaflet Map ────── h-[380px] ────────┐  │
│  │        📍 markers grouped by building   │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌── Room Grid (2-col) ─────────────────────┐│
│  │ ┌─────────────┐  ┌─────────────┐         ││
│  │ │ CP.9127     │  │ CP.9525     │         ││
│  │ │ Layout img  │  │ Layout img  │         ││
│  │ │ [📷 photos] │  │ [📷 photos] │         ││
│  │ └─────────────┘  └─────────────┘         ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar              │
├────────────────────────────┤
│ ┌── Sticky Header (row) ─┐ │  ← Single row layout (px-4 py-2.5) to avoid blocking content
│ │ [◀ Back] ข้อมูลห้องสอบ   │ │  ← Back icon link & title side-by-side
│ └────────────────────────┘ │
│                             │
│ ┌── Content Flow (scroll) ┐ │
│ │ ┌── Search ──────────┐ │ │  ← Filters live inside scroll container (hides on scroll)
│ │ │ 🔍 ค้นหาห้อง...     │ │ │
│ │ └────────────────────┘ │ │
│ │ [ทั้งหมด] [CP] [SC]      │ │
│ │                           │ │
│ │ ┌── Leaflet Map ──────┐ │ │  ← h-[320px]
│ │ │     📍              │ │ │
│ │ └─────────────────────┘ │ │
│ │                           │ │
│ │ ┌── Room Cards (1-col) ┐ │ │
│ │ │ CP.9127             │ │ │
│ │ └──────────────────────┘ │ │
│ └──────────────────────────┘ │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- **Compact Sticky Header (Single-row)**: The sticky header bar is reduced to a single compact row (`px-4 py-2.5`) with the back button and title side-by-side. Decorative icon and descriptions are hidden.
- **Scrolling Filters**: Quick Filters (Search input and CP/SC building tab selector buttons) are relocated from the sticky header to the main scrolling content area. This ensures they scroll out of view when the user scrolls down, maximizing map and card viewport space.
- **Search input**: Stretches full-width (`w-full`) on mobile.
- **Map height**: Compact `h-[320px]` on mobile vs `h-[380px]` on desktop.
- **Room cards**: Stack vertically in a single column (`grid-cols-1`).
- **Layout images**: Constrained to `max-h-[220px]` with `object-contain` to fit mobile widths.

---

### 5.3 RoomExplorer (`/explorer`)

**Purpose**: Interactive seat map explorer with cascading filters and live seat details.

> ⚠️ **Most complex mobile layout** — three-panel layout collapses to overlays.

#### Desktop (≥768px)

```
┌──────────────────────────────────────────────────┐
│                     Navbar                        │
├──────────────────────────────────────────────────┤
│ ┌── Dashboard Toolbar ────────────────────────┐  │
│ │ สำรวจห้องสอบ [CP.9127]                       │  │
│ │   [Round▾] [Date▾] [Time▾] [Room▾] [🔍NID] [⊞]│  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────┬────────────────────────┬─────────────┐  │
│ │ LEFT │  CENTER                │ RIGHT       │  │
│ │ w-64 │  flex-1                │ w-72        │  │
│ │      │                        │ (slides in) │  │
│ │ ◉78% │  ┌─ Front ─┐          │             │  │
│ │ occ. │  │ [A1][A2]…│          │ 💺 B3       │  │
│ │      │  │ [B1][★B3]│          │ 🆔 653xxxx │  │
│ │ ──── │  └──────────┘          │ 📘 CALC I   │  │
│ │ Subj │                        │ 📅 15/7     │  │
│ │ list │  [+] [⊕] [−] zoom     │ ⏰ 09:00    │  │
│ └──────┴────────────────────────┴─────────────┘  │
└──────────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar              │
├────────────────────────────┤
│ ┌── Toolbar (stacked) ──┐ │
│ │ สำรวจห้องสอบ [CP.9127]  │ │
│ │ [Round ▾] ← full width  │ │  ← w-full on mobile
│ │ [Date ▾][Time ▾] ← 48%  │ │  ← w-[48%] each
│ │ [Room ▾] ← full width   │ │  ← w-full on mobile
│ │ [🔍 ค้นหา NID...] full  │ │  ← w-full on mobile
│ │     vvvvvvvvvvvv       │  │
│ └──────────────────────────┘ │
│                             │
│ ┌── Seat Map (full) ─────┐ │  ← flex-1, fills remaining
│ │                         │ │
│ │     ┌─ Front ─┐        │ │
│ │     │ [A1][A2] │        │ │  ← touch pan/zoom
│ │     │ [B1][★B3]│        │ │
│ │     └──────────┘        │ │
│ │                         │ │
│ │  [◀ sidebar] [+][⊕][−] │ │  ← floating controls
│ └─────────────────────────┘ │
│                             │
│  ← Tap [◀] opens sidebar   │
│     as slide-over drawer    │
│                             │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘

── When sidebar opens: ──────

┌────────────────────────────┐
│ ┌── Backdrop (dim) ──────┐ │  ← bg-slate-900/40
│ │ ┌── Drawer (left) ───┐ │ │     backdrop-blur-sm
│ │ │ w-80 max-w-[85vw]  │ │ │  ← fixed, slides in
│ │ │                     │ │ │
│ │ │ ◉ 78% Occupancy    │ │ │
│ │ │ 312/400 seats      │ │ │
│ │ │                     │ │ │
│ │ │ ── Subjects ──     │ │ │
│ │ │ 🟦 261101 (45)     │ │ │  ← tap to highlight
│ │ │ 🟩 261102 (32)     │ │ │
│ │ │ [✕ close]          │ │ │
│ │ └─────────────────────┘ │ │
│ └────────────────────────┘ │
└────────────────────────────┘

── When seat tapped: ────────

┌────────────────────────────┐
│ ┌── Backdrop (dim) ──────┐ │
│ │                         │ │
│ │  Seat map (behind)      │ │
│ │                         │ │
│ ├── Bottom Sheet ────────┤ │  ← rounded-t-3xl
│ │  ─── drag handle ───   │ │     max-h-[55vh]
│ │                         │ │     slide up from bottom
│ │  💺 B3                  │ │
│ │  🆔 653380xxx-x        │ │
│ │  📘 CALCULUS I          │ │
│ │  📅 15 ก.ค. 69         │ │
│ │  ⏰ 09:00-12:00        │ │
│ │  [↗️ Open full search]  │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- **Compact Header & Collapsible Filters**: The sticky header bar is reduced to a single compact row (`px-4 pt-2.5 pb-1`) with a simplified title block (decorative icon and sub-headings are hidden). The vertical cascading filters are inside a collapsible container that is closed by default to prevent blocking map visibility.
- **Left sidebar**: Hidden by default, opens as **slide-over drawer** (`fixed inset-y-0 left-0 w-80 max-w-[85vw]`) with dim backdrop
- **Sidebar toggle**: Floating `[◀]` button at `top-4 left-4` on the map, `md:hidden`
- **Seat map**: Takes full remaining height, touch pan/zoom/pinch supported
- **Right details panel**: Becomes **bottom sheet** (`fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[55vh]`) sliding up from bottom with drag handle
- **Backdrop overlays**: Both sidebar and bottom sheet have `bg-slate-900/40 backdrop-blur-sm` backdrops, tapping backdrop dismisses
- **Zoom controls**: Floating at `bottom-6 right-6`, always visible above MobileTabBar
- **SeatMap legend**: Hidden on mobile (shown inside left sidebar instead), visible inline on `sm:` screens

#### 5.3.1 Seat Cell Display Customizer

Users can customize what fields are rendered inside the map seat cells.

- **Toggle Button**: A `SlidersHorizontal` icon button in the toolbar row. Activates with indigo `ring-2` state to show it is open.
- **Configurator Popover**: A floating glassmorphic panel (`bg-white/75 dark:bg-slate-950/65 backdrop-blur-xl`) positioned absolutely below the toggle button. Does **not** push the layout down. Dismissed on click-outside via `useRef` + `mousedown` listener.
  - **Animation**: `animate-in fade-in slide-in-from-top-1 duration-150` — slides down from the button, not from an unrelated origin.
  - **Border**: `border-white/[0.08]` micro-glow ring + `ring-1 ring-inset ring-white/[0.04]` in dark mode for the glassmorphic depth effect.
  - **Shadow**: `shadow-2xl shadow-black/60` in dark mode for elevation separation.
- **Field Selector Layout**: Implements a **Mirrored Select Dropdown Layout** where the Line 1 choice (left select box) and Line 2 choice (right select box) are rendered side-by-side inside a 2-column grid (`grid grid-cols-2`). 
  - Standard `<Select>` components are used, featuring custom chevron icons, dark mode borders, and focus rings.
  - Left select represents **บรรทัด 1** (no "none" option allowed).
  - Right select represents **บรรทัด 2** (includes a "(ว่าง) / none" option to hide the second line).
- **Section Dividers**: Symmetrical gradient `bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent` separates the header title and select boxes.
- **Storage Persistence**: State persists to `localStorage` under the key `explorer_seat_display` with schema `{ line1: SeatField, line2: SeatField }`.
- **Default State**: `{ line1: 'seat', line2: 'subject' }` to display the default seat number and subject code.
- **Field Formatting Rules**:
  - `student_id`: Normalized to digits-only and rendered as a cohort-prefixed compact code `xx..xxx-x` (e.g. `68..041-4` for `6833800414` or `683380041-4`).
  - `branch`: Stripped of prefixes and resolved to capitalized short abbreviation only (e.g. `CS`, `CY`, `AI`, `GIS`) to save space.
- **Dynamic Text Scaling**: Text inputs with $\ge$ 8 characters (e.g. student IDs, long subject names) automatically scale down to `text-[9px]` (line 1) and `text-[8px]` (line 2) with `tracking-tighter font-sans` to prevent text truncation by the browser inside the `42px` width boundaries.
- **Mobile Behavior**:
  - The Search Input and Preferences Toggle Button are nested in a side-by-side flex container (`w-full sm:w-auto flex items-center gap-2`) to stay on the same line on mobile screens.
  - Clicking the toggle button opens a full-screen backdrop overlay (`sm:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20`) for easy click-to-dismiss.
  - The Popover transforms into a floating bottom sheet layout (`fixed bottom-4 left-4 right-4 sm:absolute sm:bottom-auto ...`) with bottom slide-up animation (`slide-in-from-bottom-4`).
  - To prevent viewport overflow on smaller devices, the mobile layout bounds the content height using `max-h-[50vh]` combined with `overflow-y-auto`.

---

### 5.4 Stats (`/stats`)

**Purpose**: High-fidelity dashboard displaying analytical highlights and room occupancy metrics.

#### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│                           Navbar                            │
├─────────────────────────────────────────────────────────────┤
│ ┌── Sticky Filter Bar (Glassmorphic) ─────────────────────┐ │
│ │ 📊 แผงควบคุมสถิติ (Statistics Dashboard)   [View Select ▾] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌── Hero Counter Cards (4-col grid) ──────────────────────┐ │
│ │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │ │
│ │ │👥 2,847   │ │🏫 14      │ │📚 47      │ │💺 4,120   │ │ │
│ │ │students   │ │rooms      │ │subjects   │ │seatings   │ │ │
│ │ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌── Highlight strip (4-col border-variants) ──────────────┐ │
│ │ [🔥 Peak Day]   [⚡ Back-to-Back] [🏆 MVP Room] [📊 AvgLoad]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌── Advanced Charts (2-col grid) ─────────────────────────┐ │
│ │ ┌── Department Breakdown ───┐ ┌── Time Slot Balance ────┐ │ │
│ │ │ █░░░░░ (CP:52% SC:34%...) │ │ █░░░░░ AM: 48% vs PM:52%│ │ │
│ │ └───────────────────────────┘ └─────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌── Room Utilization Progress List ───────────────────────┐ │
│ │ CP.9127 ░░░░░░░░░░░░░░░░ 782 seats (100%)               │ │
│ │ SC.5102 ░░░░░░░░░░░░     521 seats (66%)                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar              │
├────────────────────────────┤
│ ┌── Sticky Filter (row) ─┐ │  ← Single row layout (px-4 py-2.5) to avoid blocking content
│ │ 📊 สถิติการจัดสอบ [View ▾] │ │  ← Title & dropdown side-by-side, no icon/subtitle on mobile
│ └────────────────────────┘ │
│                             │
│ ┌── Hero Stats (stacked) ┐ │
│ │ ┌────────────────────┐ │ │  ← Stacks vertically (1-col grid)
│ │ │ 👥 2,847 Students  │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ 🏫 14 Rooms        │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ 📚 47 Subjects     │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ 💺 4,120 Seatings  │ │ │
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│                             │
│ ┌── Highlights (2x2 grid) ┐ │  ← Stacks as 2-column grid on mobile
│ │ [Peak Day]   [Back-to-B] │ │
│ │ [MVP Room]   [Avg Load ] │ │
│ └────────────────────────┘ │
│                             │
│ ┌── Charts (stacked) ────┐ │
│ │ ┌── Department ──────┐ │ │  ← Stacks as 1-column cards
│ │ │ CP 52%   SC 34%    │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌── Time Slot Balance│ │ │
│ │ │ AM 48%   PM 52%    │ │ │
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│                             │
│ ┌── Room Utilization ────┐ │
│ │ CP.9127 (782 seats)     │ │  ← Progress bars scale to fit mobile screen
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │ │     labels stack on top of progress bars
│ └────────────────────────┘ │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- **Compact Sticky Header (Single-row)**: The sticky header bar is reduced to a single compact row (`px-4 py-2.5`) with a direct side-by-side layout (`flex-row items-center justify-between`) on mobile. The large gradient icon box is hidden (`hidden sm:flex`), the description subtitle is hidden (`hidden sm:block`), and the title is shortened to fit alongside a compact dropdown selector to avoid blocking vertical viewport content.
- **Hero stat cards**: Stacks vertically in a single column (`grid-cols-1`) on mobile, scaling to `sm:grid-cols-2` and `md:grid-cols-4`.
- **Highlights strip**: Switches from a single horizontal row (`md:grid-cols-4`) to a 2-column grid (`grid-cols-2 gap-4`), keeping widgets compact.
- **Visual breakdowns**: Department and Time Slot Balance cards stack vertically in a single column rather than side-by-side.
- **Room utilization progress**: Text labels (e.g., room name & total seats count) stack above progress bars instead of remaining in a single horizontal row, giving the bar maximum width on narrow screen displays.
- **Background elements**: Muted dark overlays are solid colors to ensure charts and lists maintain high readability. Muted grid text changes to high-contrast slate-500.

---

## 6. Mobile-Specific Patterns

### 6.1 Bottom Sheet Pattern

Used in: **RoomExplorer** (seat details)

```css
/* Responsive drawer: Bottom sheet on mobile, side panel on desktop */
.bottom-sheet {
  /* Mobile: slides up from bottom */
  position: fixed;
  bottom: 0; left: 0; right: 0;
  border-radius: 1.5rem 1.5rem 0 0;    /* rounded-t-3xl */
  max-height: 55vh;
  transform: translateY(100%);          /* hidden state */
  transition: transform 300ms ease-in-out;

  /* Desktop: slides in from right */
  @media (min-width: 768px) {
    position: absolute;
    top: 0; bottom: 0; left: auto; right: 0;
    width: 18rem;                       /* w-72 */
    border-radius: 0;
    max-height: none;
    transform: translateX(100%);        /* hidden state */
  }
}

/* Active state */
.bottom-sheet.open {
  transform: translateY(0);
  @media (min-width: 768px) {
    transform: translateX(0);
  }
}
```

### 6.2 Slide-Over Drawer Pattern

Used in: **RoomExplorer** (left analytics sidebar)

```
Mobile: fixed inset-y-0 left-0 w-80 max-w-[85vw] z-40
        transform: -translateX(100%) → translateX(0)
        backdrop: fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30

Desktop: static w-64, always visible, no backdrop
```

### 6.3 Touch Interactions

| Component | Gesture | Behavior |
|-----------|---------|----------|
| SeatMap | Pinch | Zoom in/out (min 0.2×, max 4×) |
| SeatMap | Drag (1 finger) | Pan the map |
| SeatMap | Double tap | Center + reset zoom |
| Bottom Sheet | Tap backdrop | Dismiss |
| Drawer | Tap backdrop | Dismiss |
| ImageViewer | Pinch/pan | Fullscreen zoom/pan |
| Room photos | Tap | Open ImageViewer |

### 6.4 Mobile Tab Bar Specification

```
Height:        h-16 (64px)
Position:      fixed bottom-0 left-0 right-0
Background:    bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg
Border:        border-t border-slate-200/50 dark:border-slate-800/60
Z-index:       z-30
Padding:       px-4, pb-safe (iOS safe area)

Tabs (4):
  - ค้นหา   → /          → Search icon
  - ห้องสอบ  → /room      → School icon
  - สำรวจ   → /explorer  → MapPin icon
  - สถิติ   → /stats     → BarChart3 icon

Active state:  text-blue-600, scale-105, bg-blue-50 behind icon
Inactive:      text-slate-500
Label:         text-[10px], tracking-tight, mt-0.5
Icon wrapper:  p-1.5 rounded-xl, active gets background tint
```

---

## 7. Known Mobile Issues & Fixes Needed

> These are identified problems in the current implementation that should be addressed.

### 7.1 RoomExplorer Toolbar Overflow

**Problem**: On narrow phones (<375px), the toolbar filters (4 selects + search) can overflow or stack awkwardly.

**Fix**: Ensure Round select is `w-full` first row, Date+Time are `w-[48%]` second row, Room is `w-full` third row, Search is `w-full` fourth row. Use `flex-wrap` with `gap-3`.

### 7.2 ExamCard SeatMap Preview Height

**Problem**: On mobile, the SeatMap preview in ExamCard is `h-64` which may be too tall on very short phones, pushing content below the fold.

**Fix**: Consider `h-48 sm:h-64` for more compact mobile preview, or make it collapsible.

### 7.3 RoomExplorer MobileTabBar Overlap

**Problem**: The MobileTabBar (fixed bottom, z-30) can overlap with the seat detail bottom sheet (z-40) and the SeatMap zoom controls (z-10).

**Fix**: Bottom sheet should have `z-40` (above tab bar), zoom controls should have margin-bottom to clear tab bar (`bottom-20 md:bottom-6`), and when bottom sheet is open, tab bar stays underneath.

### 7.4 Stats Table Horizontal Scroll

**Problem**: The data matrix table with 5+ year columns doesn't fit on mobile screens.

**Fix**: Already wrapped in `overflow-x-auto` — verify smooth scroll with `-webkit-overflow-scrolling: touch` and consider adding a subtle gradient mask on the right edge to hint scrollability.

### 7.5 Search History Dropdown Z-Index

**Problem**: On mobile, the search history dropdown may appear behind other elements or get clipped.

**Fix**: Ensure the dropdown has `z-50` and its container has `relative` positioning. Consider making it a full-width bottom sheet on mobile instead of a dropdown.

### 7.6 Leaflet Map Touch Conflicts

**Problem**: Leaflet map captures all touch events, making it hard to scroll past the map on mobile.

**Fix**: `scrollWheelZoom={false}` is already set. Ensure `dragging` is enabled but the map has a defined `h-[320px]` so users can scroll around it. Consider adding `tap={false}` on very small screens.

### 7.7 AppShell Main Content Bottom Padding

**Problem**: The `<main>` has `pb-16 md:pb-0` to clear MobileTabBar, but pages like RoomExplorer that use `h-full` layout don't account for this, causing content to be hidden behind the tab bar.

**Fix**: RoomExplorer uses `flex h-full flex-col` which fills the available space after `pb-16` is applied by AppShell's `<main>`. Verify that the SeatMap viewport correctly uses all available height. If not, add explicit bottom padding to the map viewport on mobile.

---

## 8. Dark Mode

All components support dark mode via Tailwind's `dark:` prefix. The theme is toggled by `useTheme()` hook which adds/removes the `dark` class on `<html>`.

| Element | Light | Dark |
|---------|-------|------|
| App background | `bg-[#fafbfe]` | `bg-[#0a0f24]` (Deep Space Navy) |
| Card surface | `bg-white` | `bg-[#141b35]` (Navy Abyss) |
| Glass card | `bg-white/60 backdrop-blur-xl` | `bg-[#141b35]/60 backdrop-blur-xl` |
| Text primary | `text-slate-800` | `text-slate-200` |
| Borders | `border-slate-200/50` | `border-[#232e52]/80` (Graphite) |
| Shadows | Normal shadows | `shadow-none` (borders compensate) |
| Map tiles | OpenStreetMap default | OpenStreetMap default (consider Carto Dark) |

---

## 9. Performance Notes

| Optimization | Status |
|-------------|--------|
| Code splitting (lazy routes) | ❌ Not yet — consider `React.lazy()` for `/room`, `/explorer`, `/stats` |
| Leaflet lazy-load | ❌ Loaded on every page via import in `RoomInfo.tsx` |
| Image lazy loading | ✅ Could add `loading="lazy"` to room photos |
| Font optimization | ✅ Inter + Prompt loaded via Google/Bunny CDN |
| Touch event passive | ✅ Wheel listener uses `{ passive: false }` correctly |
| will-change-transform | ✅ Applied to SeatMap content layer |

---

## 10. Accessibility Checklist

| Requirement | Status |
|-------------|--------|
| Semantic HTML (`<nav>`, `<main>`, `<header>`) | ✅ |
| Unique IDs on interactive elements | ⚠️ Partial |
| ARIA labels on icon-only buttons | ⚠️ Missing on some (theme toggle, GitHub) |
| Keyboard navigation | ⚠️ Tab order works, no custom key shortcuts yet |
| Color contrast (WCAG AA) | ✅ Slate palette meets AA ratios |
| Focus visible styles | ✅ Via Tailwind ring utilities |
| Reduced motion support | ❌ No `prefers-reduced-motion` media query yet |
