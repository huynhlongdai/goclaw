# Branding & Theme System — Development Plan

## 1. Dribbble Design Research: Noteflow Dashboard

**URL:** https://dribbble.com/shots/26819791-Project-Management-Dashboard

### Key Design Patterns Extracted

| Element | Noteflow Implementation | Our Adoption |
|---|---|---|
| Background | Off-white (#FAFAFA), cool tint | `theme-lumos`: cool near-white |
| Primary accent | Coral-orange (#FF5722) | `theme-lumos`: vivid coral |
| Sidebar | Icon-only rail, white, subtle border | Both themes: keep current rail |
| Cards | Pure white, soft shadow, 10px radius | `theme-lumos`: stronger white card |
| Kanban columns | Colored headers (status-coded) | Already implemented |
| Priority badges | Colored pill labels | Already implemented |
| Progress bars | Thin inline bars on cards | Already implemented |
| Greeting header | "Good morning, [Name]" | Overview page improvement |
| View switcher | Board / Timeline / Spreadsheet / Calendar | Future work |
| AI CTA button | Orange "Ask AI" button in content area | Chat dispatch button |
| Typography | Large display text, clean hierarchy | Lumos: larger headings |

---

## 2. Theme System Architecture

### Approach: CSS Custom Properties + Theme Class

The app uses OKLCH CSS custom properties on `:root` and `.dark`. We add:
- `.theme-lumos` — overrides `:root` vars (always light)
- `.theme-obsidian` — overrides dark vars (always dark, different hue)
- Dynamic accent injection via JS (for admin custom color)
- Applied on `<html>` element via `useBrandStore`

```
<html class="theme-lumos">  ← light coral theme
<html class="dark theme-obsidian">  ← dark violet theme
<html class="dark">  ← default dark (current)
<html>  ← default light (current)
```

### Theme 1: "Lumos" — Clean Light (Noteflow-inspired)

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.98 0.004 240)` | Slightly cool off-white |
| `--card` | `oklch(1 0 0)` | Pure white |
| `--primary` | `oklch(0.61 0.22 22)` | Deep coral-orange |
| `--primary-foreground` | `oklch(1 0 0)` | White |
| `--muted` | `oklch(0.95 0.005 240)` | Cool light grey |
| `--muted-foreground` | `oklch(0.48 0.01 240)` | Medium cool grey |
| `--border` | `oklch(0.91 0.006 240)` | Subtle cool border |
| `--sidebar` | `oklch(1 0 0)` | Pure white sidebar |
| `--sidebar-accent` | `oklch(0.96 0.01 22)` | Coral tint on hover |
| `--accent` | `oklch(0.96 0.01 22)` | Coral tint |
| `--ring` | `oklch(0.61 0.22 22)` | Coral focus ring |
| `--radius` | `0.625rem` | Slightly tighter radius |
| `--status-running` | `oklch(0.56 0.18 145)` | Green |
| Chat bubble user | `oklch(0.42 0.16 22)` | Darker coral |

**Visual Character:** Airy, professional, clean. White cards on cool grey canvas. Coral accents pop against neutral background. Inspired by Noteflow's orange-on-white aesthetic.

### Theme 2: "Obsidian" — Dark Premium

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.10 0.016 265)` | Deep navy-black |
| `--card` | `oklch(0.155 0.02 265)` | Dark navy card |
| `--primary` | `oklch(0.64 0.24 290)` | Vivid violet |
| `--primary-foreground` | `oklch(0.98 0.005 290)` | Soft white |
| `--muted` | `oklch(0.19 0.018 265)` | Dark navy muted |
| `--muted-foreground` | `oklch(0.60 0.01 265)` | Cool mid-grey |
| `--border` | `oklch(0.24 0.02 265)` | Subtle navy border |
| `--sidebar` | `oklch(0.115 0.018 265)` | Darker sidebar |
| `--sidebar-accent` | `oklch(0.22 0.04 290)` | Violet tint hover |
| `--accent` | `oklch(0.22 0.03 265)` | Dark navy accent |
| `--ring` | `oklch(0.64 0.24 290)` | Violet focus ring |
| `--radius` | `1rem` | More rounded modern feel |
| `--status-running` | `oklch(0.58 0.20 145)` | Bright green |
| Chat bubble user | `oklch(0.50 0.20 290)` | Violet bubble |

**Visual Character:** Deep space premium. Near-black navy base with vivid violet accents. Glowing status indicators. More rounded radius. High contrast text.

---

## 3. Admin System Settings Module

### Route: `/settings/branding` (admin only)

### Store: `useBrandStore` (Zustand + localStorage `goclaw:brand`)

```typescript
interface BrandConfig {
  // Identity
  appName: string;           // default: "GoClaw"
  appTagline: string;        // default: "AI Agent Platform"
  logoDataUrl: string | null; // base64 PNG/SVG
  faviconDataUrl: string | null;

  // Theme
  themeId: "default" | "lumos" | "obsidian";
  colorMode: "light" | "dark" | "system";
  accentHue: number | null;  // null = theme default. 0-360 override

  // Login Page
  loginTitle: string;       // default: "Đăng nhập"
  loginMessage: string;     // default: ""
  loginBgStyle: "default" | "gradient" | "image";

  // Feature Flags (admin can hide sections)
  showWorkModule: boolean;
  showTracesSection: boolean;
  showVaultSection: boolean;
}
```

### UI Sections in BrandingPage

#### Section 1: Identity
- App name text input
- App tagline text input
- Logo uploader: drag-drop or click → preview
- Favicon uploader
- Reset to defaults button

#### Section 2: Theme Picker
- Visual card picker (3 cards: Default · Lumos · Obsidian)
- Each card shows mini screenshot preview
- Light/Dark/System toggle (separate from theme)
- Accent Hue slider (0–360°) with live preview color swatch

#### Section 3: Login Page
- Login title input
- Login welcome message textarea
- Background style: Default / Gradient / Custom Image
- Preview pane (right side)

#### Section 4: Feature Flags
- Toggle switches for each major section
- "Work module", "Traces", "Vault", "Knowledge Graph"

### Apply Brand in App
- Logo → replaces GoClaw icon in NavRail + Login
- App name → `<title>` + sidebar header
- Theme class → `document.documentElement.classList`
- Accent hue → inject `<style>` tag with CSS var overrides
- Feature flags → hide nav items, redirect if accessed directly

---

## 4. Mobile Optimization for Both Themes

### Breakpoints Strategy
- `< 640px` (sm): mobile — bottom nav, single column
- `640–1024px` (md): tablet — narrow sidebar rail
- `> 1024px` (lg): desktop — full split panels

### Mobile-Specific Theme Considerations

**Lumos mobile:**
- Bottom navigation bar: white with coral active indicator
- Touch targets: min `44px` height
- Cards: full-width, tighter padding
- Reduced shadow on mobile (less depth needed)
- Coral FAB (Floating Action Button) for primary actions

**Obsidian mobile:**
- Bottom nav: dark navy bar with violet glow on active
- Cards: slightly more border-radius (feels more native)
- Reduced blur effects on `backdrop-filter` (performance)
- Violet FAB

### Bottom Navigation Component (new)
```tsx
// Renders only on mobile (< 640px)
// Items: Home · Chat · Work · Agents · Settings
// Position: fixed bottom, safe-area-inset padding for notch
```

---

## 5. Implementation Sprints

### Sprint 1 — Theme System (CSS + Store) `~3h`
- [ ] Add `.theme-lumos` CSS variables to `index.css`
- [ ] Add `.theme-obsidian` CSS variables to `index.css`  
- [ ] Create `useBrandStore` with persistence
- [ ] Create `useTheme` hook — applies class to `<html>`
- [ ] Wire into app shell (`app.tsx`)

### Sprint 2 — Theme Picker UI `~2h`
- [ ] `ThemePickerCard` component (mini previews)
- [ ] `AccentHueSlider` component
- [ ] `ColorModePicker` (Light/Dark/System)
- [ ] Wire into Settings Drawer under "Giao diện"

### Sprint 3 — Branding Settings Page `~4h`
- [ ] `BrandingPage` at `/settings/branding`
- [ ] Logo uploader component (with crop + preview)
- [ ] App name/tagline inputs
- [ ] Login page customizer
- [ ] Apply logo to NavRail + Login page

### Sprint 4 — Feature Flags + Polish `~2h`
- [ ] Feature flag toggles
- [ ] Hide/show nav items based on flags
- [ ] Redirect logic for disabled sections
- [ ] Admin-only guard for `/settings/branding`

### Sprint 5 — Mobile Bottom Nav `~3h`
- [ ] `MobileBottomNav` component
- [ ] Safe area inset handling (iOS notch)
- [ ] Active state animations
- [ ] Theme variants for bottom nav

---

## 6. File Structure

```
ui/web/src/
├── stores/
│   └── use-brand-store.ts          ← NEW: brand/theme state
├── hooks/
│   └── use-theme.ts                ← NEW: apply theme to DOM
├── components/
│   ├── brand/
│   │   ├── logo-uploader.tsx       ← NEW
│   │   ├── theme-picker.tsx        ← NEW
│   │   ├── accent-hue-slider.tsx   ← NEW
│   │   └── app-logo.tsx            ← NEW: shows custom or default logo
│   └── layout/
│       └── mobile-bottom-nav.tsx   ← NEW
└── pages/
    └── settings/
        └── branding-page.tsx       ← NEW
```

---

## 7. Technical Notes

### OKLCH Accent Hue Override
When user picks a custom accent hue `H` (0–360), inject:
```css
:root {
  --primary: oklch(0.62 0.19 H);
  --ring: oklch(0.62 0.19 H);
  --sidebar-primary: oklch(0.62 0.19 H);
  /* etc. */
}
```
This preserves lightness/chroma, only shifts hue.

### Logo Storage
- Base64 in localStorage (≤ ~200KB logo is fine for localStorage)
- If > 200KB → warn user to use smaller file
- SVG recommended (scalable, smaller)

### Performance on Mobile
- `.theme-obsidian` avoids heavy `backdrop-filter` blurs
- Transitions reduced from `200ms` to `150ms` on mobile
- `will-change: transform` only on animated elements
- No heavy box-shadows on scrolling lists (use borders instead)
