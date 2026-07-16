# 🎨 CP Exam Seat — Design System & Frontend Specification

> **วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น**
> Central design reference for the `cpkku-view` frontend — covers visual identity, component API, responsive patterns, and per-page layout.

---

## 1. Design Identity — "Neon Aurora"

### Philosophy

> **"สะอาด ทันสมัย มีชีวิตชีวา"** — Clean minimalism meets vibrant energy.
> Inspired by: Linear.app, Vercel Dashboard, Arc Browser, Raycast

### Color Palette

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FAFBFE` Lavender Mist | `#0A0F24` Deep Navy |
| Surface | `#FFFFFF` | `#141B35` Navy Abyss |
| Surface Hover | `#F4F6FA` | `#1E2647` |
| Border | `#E8ECF4` Frost | `#232E52` Graphite |
| Text Primary | `#0F172A` Ink | `#F1F5F9` Snow |
| Text Secondary | `#64748B` Pewter | `#A5B4D4` Silver |
| Text Muted | `#94A3B8` Fog | `#6475B2` Ash |

**Accent Colors**

| Name | Value | Usage |
|------|-------|-------|
| Primary | `#6366F1 → #818CF8` | Brand gradient, active nav, CTA |
| Secondary | `#06B6D4 → #22D3EE` | Cyan highlights, secondary actions |
| Success | `#10B981` Emerald | Positive states, available seats |
| Warning | `#F59E0B` Amber | Warnings, notes, quarantine |
| Danger | `#EF4444` Red | Errors, seat target pulse |
| Info | `#3B82F6` Blue | General info badges, links |

**Brand Gradient (Aurora Borealis)**
```
#6366F1 → #06B6D4 → #10B981
Indigo  → Cyan     → Emerald
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
│   │   └── SearchHistory.tsx  # History dropdown list
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

**Purpose**: Primary landing page — search exam seat by student ID.

#### Desktop (≥768px)

```
┌──────────────────────────────────────────────┐
│                 Navbar                        │
├──────────────────────────────────────────────┤
│                                               │
│    ◌ Aurora gradient mesh (animated blurs)    │
│                                               │
│           ✨ ค้นหาที่นั่งสอบ                   │  ← text-5xl
│      วิทยาลัยการคอมพิวเตอร์ มข.              │  ← gradient text
│                                               │
│    ┌──── Glass Search Card (max-w-lg) ────┐  │
│    │  [Exam Round ▾]                       │  │
│    │  [  🔍  653380xxx-x  ]  ← mono,xl    │  │
│    │  [ ══════ ค้นหา ══════ ] ← Button lg  │  │
│    │                                       │  │
│    │  ── Calendar Actions (post-search) ── │  │
│    │  [Copy Link] [Subscribe] [Download]   │  │
│    └───────────────────────────────────────┘  │
│                                               │
│    ┌─ Stats Quick Glance (3-col grid) ────┐  │
│    │ ┌────────┐ ┌──────────┐ ┌──────────┐ │  │
│    │ │ 2,847  │ │ Top Subj │ │ Cohorts  │ │  │
│    │ │ คน     │ │ list     │ │ breakdown│ │  │
│    │ └────────┘ └──────────┘ └──────────┘ │  │
│    └──────────────────────────────────────┘  │
│                                               │
│    ┌── ExamCard ─────────────────────────┐   │
│    │  LEFT 1/3          │  RIGHT 2/3     │   │
│    │  Subject info      │  SeatMap       │   │
│    │  Date / Time       │  (pan/zoom)    │   │
│    │  Room / Seat       │                │   │
│    │  [Explorer] [Map]  │                │   │
│    └────────────────────┴────────────────┘   │
│                                               │
└──────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar (compact)    │
├────────────────────────────┤
│                             │
│   ✨ ค้นหาที่นั่งสอบ        │  ← text-3xl (smaller)
│   วิทยาลัยการคอมพิวเตอร์   │
│                             │
│  ┌── Glass Search Card ──┐ │
│  │ [Exam Round ▾]         │ │  ← full width
│  │ [  653380xxx-x  ]      │ │
│  │ [ ═══ ค้นหา ═══ ]      │ │
│  │                        │ │
│  │ [Copy] [Sub] [.ics]    │ │  ← 3-col grid inside card
│  └────────────────────────┘ │
│                             │
│  ┌── Stats (1-col stack) ─┐ │  ← grid-cols-1 on mobile
│  │ ┌── นักศึกษา 2,847 ──┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── ห้องสอบ 14 ──────┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── Top Subjects ────┐ │ │
│  │ └────────────────────┘ │ │
│  │ ┌── Cohorts ─────────┐ │ │
│  │ └────────────────────┘ │ │
│  └────────────────────────┘ │
│                             │
│  ┌── ExamCard (stacked) ─┐ │
│  │  Subject info          │ │  ← full width, vertical
│  │  Date / Time (2-col)   │ │
│  │  Room / Seat           │ │
│  │  [Explorer] [Map]      │ │
│  │  ─ border-b ─          │ │
│  │  SeatMap preview       │ │  ← h-64, below details
│  │  (touch pan/zoom)      │ │
│  └────────────────────────┘ │
│                             │
├────────────────────────────┤
│  MobileTabBar (fixed)       │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- Hero title shrinks from `text-5xl` → `text-3xl`
- Search card stays centered, `max-w-lg`, full-width padding `p-6`
- Stats grid switches from `md:grid-cols-3` → `grid-cols-1`
- ExamCard switches from `md:flex-row` → `flex-col` (details on top, map below)
- SeatMap preview height: `h-64` on mobile vs `h-auto` filling card on desktop
- Calendar action buttons remain 3-col grid inside the card (small enough)
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
│ ← กลับ                     │
│ ข้อมูลห้องสอบทั้งหมด       │  ← text-3xl
│ วิทยาลัยการคอมพิวเตอร์     │
│                             │
│ ┌── Search ────────────┐   │  ← full width (w-full)
│ │ 🔍 ค้นหาห้อง...       │   │
│ └──────────────────────┘   │
│ [ทั้งหมด] [CP] [SC]        │  ← tab row, full width
│                             │
│ ┌── Leaflet Map ────────┐  │  ← h-[320px]
│ │     📍                 │  │
│ └────────────────────────┘  │
│                             │
│ ┌── Room Cards (1-col) ──┐ │  ← grid-cols-1 on mobile
│ │ ┌────────────────────┐ │ │
│ │ │ CP.9127            │ │ │
│ │ │ Layout image       │ │ │
│ │ │ [📷 x3 grid]       │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ CP.9525            │ │ │
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│                             │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- Header switches from `md:flex-row` → `flex-col` (title stacks above filters)
- Search input: `w-full` on mobile, `sm:w-56` on desktop
- Tab buttons: row wraps naturally via flex
- Map height: `h-[320px]` mobile vs `h-[380px]` desktop
- Room cards grid: `grid-cols-1` mobile → `md:grid-cols-2`
- Photo grid inside cards stays `grid-cols-3` (thumbnails are small enough)
- Layout images: `max-h-[220px]` constrained, `object-contain`

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
│ │     [Round▾] [Date▾] [Time▾] [Room▾] 🔍NID  │  │
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
- **Toolbar filters**: Stack vertically — Round & Room are `w-full`, Date & Time are `w-[48%]` side by side, Search is `w-full`
- **Left sidebar**: Hidden by default, opens as **slide-over drawer** (`fixed inset-y-0 left-0 w-80 max-w-[85vw]`) with dim backdrop
- **Sidebar toggle**: Floating `[◀]` button at `top-4 left-4` on the map, `md:hidden`
- **Seat map**: Takes full remaining height, touch pan/zoom/pinch supported
- **Right details panel**: Becomes **bottom sheet** (`fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[55vh]`) sliding up from bottom with drag handle
- **Backdrop overlays**: Both sidebar and bottom sheet have `bg-slate-900/40 backdrop-blur-sm` backdrops, tapping backdrop dismisses
- **Zoom controls**: Floating at `bottom-6 right-6`, always visible above MobileTabBar
- **SeatMap legend**: Hidden on mobile (shown inside left sidebar instead), visible inline on `sm:` screens

---

### 5.4 Stats (`/stats`)

**Purpose**: Statistical dashboard with charts and data tables.

#### Desktop (≥768px)

```
┌──────────────────────────────────────────────┐
│                 Navbar                        │
├──────────────────────────────────────────────┤
│ ┌── Sticky Filter Bar ────────────────────┐  │
│ │ 📊 แผงควบคุมสถิติ     [View Select ▾]   │  │
│ └──────────────────────────────────────────┘  │
│                                               │
│  ┌── Hero Stats (3-col) ────────────────────┐│
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │ │👥 2,847  │ │🏫 14     │ │📚 47     │  ││
│  │ │students  │ │rooms     │ │subjects  │  ││
│  │ └──────────┘ └──────────┘ └──────────┘  ││
│  └──────────────────────────────────────────┘│
│                                               │
│  ┌── Chart Card ────────────────────────────┐│
│  │ [Legend: 🟦 68  🟩 67  🟨 66  ⬜ Other]  ││
│  │ ┌────────────────────────────────────┐   ││
│  │ │ ║█████║  ║████║  ║███████║  ║██║   │   ││
│  │ │ Midterm   Final   Summer    Spec   │   ││
│  │ └────────────────────────────────────┘   ││
│  └──────────────────────────────────────────┘│
│                                               │
│  ┌── Data Table ────────────────────────────┐│
│  │ Round ↕ │ ปี68 │ ปี67 │ ปี66 │ รวม ↕   ││
│  │ Midterm │ 892  │ 756  │ 421  │ 2,069   ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

#### Mobile (<768px)

```
┌────────────────────────────┐
│         Navbar              │
├────────────────────────────┤
│ ┌── Sticky Filter ──────┐ │
│ │ 📊 แผงควบคุมสถิติ      │ │  ← title & select stack
│ │ [View Select ▾ full-w] │ │     sm:flex-row, default col
│ └────────────────────────┘ │
│                             │
│ ┌── Hero Stats ──────────┐ │
│ │ ┌────────────────────┐ │ │  ← grid-cols-1 on mobile
│ │ │ 👥 2,847 students  │ │ │     sm:grid-cols-2
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │
│ │ │ 🏫 14 rooms        │ │ │
│ │ └────────────────────┘ │ │
│ │ ┌────────────────────┐ │ │  ← sm:col-span-2 on last
│ │ │ 📚 47 subjects     │ │ │
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│                             │
│ ┌── Chart Card ──────────┐ │
│ │ Title + Legend (wrap)   │ │
│ │ ┌── Bars ────────────┐ │ │  ← overflow-x-auto
│ │ │ ║██║ ║██║ ║███║    │ │ │     h-[240px]
│ │ │  M    F    S       │ │ │     bars get narrower
│ │ └────────────────────┘ │ │
│ └────────────────────────┘ │
│                             │
│ ┌── Data Table ──────────┐ │
│ │  (overflow-x-auto)      │ │  ← horizontal scroll
│ │  ┌─────────────────┐   │ │
│ │  │ Round│ 68│ 67│Tot│   │ │
│ │  │ Mid  │892│756│2k │   │ │
│ │  └─────────────────┘   │ │
│ └────────────────────────┘ │
│                             │
├────────────────────────────┤
│  MobileTabBar               │
└────────────────────────────┘
```

**Key Mobile Adaptations:**
- **Filter bar**: Title & select stack vertically `flex-col` on mobile, `sm:flex-row` on tablet+
- **Hero stat cards**: `grid-cols-1` → `sm:grid-cols-2` → `md:grid-cols-3`
- **Third stat card**: Gets `sm:col-span-2 md:col-span-1` to fill the row on sm
- **Bar chart**: Keep same height (`h-[240px]`), bars compress horizontally — `max-w-[45px]` per bar, gap shrinks
- **Chart legend**: Wraps into multiple lines via `flex-wrap`
- **Data table**: Wrapped in `overflow-x-auto` div for horizontal scrolling on narrow screens
- **Sub-view (per-round)**: Top subjects table (`lg:col-span-2`) and cohort sidebar stack vertically as `grid-cols-1 lg:grid-cols-3`

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
