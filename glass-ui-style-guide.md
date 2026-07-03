# 🎨 CyberGlass 2.0 Style Guide
## Premium 3D Glassmorphism UI Guidelines & Design System

This document outlines the visual language, utility classes, and component guidelines for the **Akul Dravin HRMS v11.0** cinematic web platform. 

---

## 1. Core Visual Tokens

### 1.1 Glass Panels (Backdrop Blur & Backgrounds)

Always use layered backdrop blur combined with translucent borders and gradients to create realistic glass surfaces:

*   **Base Surface (`.surface-base` / `.glass-elevation-1`):**
    *   `background`: `rgba(255, 255, 255, 0.02)`
    *   `backdrop-filter`: `blur(8px)`
    *   `border`: `1px solid rgba(255, 255, 255, 0.05)`
*   **Raised Surface (`.surface-raised` / `.glass-elevation-2`):**
    *   `background`: `rgba(255, 255, 255, 0.05)`
    *   `backdrop-filter`: `blur(16px)`
    *   `border`: `1px solid rgba(255, 255, 255, 0.08)`
    *   `box-shadow`: `0 8px 32px rgba(0,0,0,0.4)`
*   **High/Overlay Surface (`.surface-overlay` / `.glass-elevation-4`):**
    *   `background`: `rgba(2, 6, 15, 0.85)`
    *   `backdrop-filter`: `blur(40px)`
    *   `border`: `1px solid rgba(255, 255, 255, 0.18)`

### 1.2 Glow Accents (Brand Highlights)

Glows should be applied subtly on hover, active states, or notifications:

| Accent | Color Value | Glow Shadow | Glow Border |
| :--- | :--- | :--- | :--- |
| **Gold** | `#F2AA3B` | `rgba(242, 170, 59, 0.2)` | `rgba(242, 170, 59, 0.3)` |
| **Aqua** | `#0F8B8D` | `rgba(15, 139, 141, 0.2)` | `rgba(15, 139, 141, 0.3)` |
| **Ember** | `#E85A2A` | `rgba(232, 90, 42, 0.2)` | `rgba(232, 90, 42, 0.3)` |
| **Jade** | `#10B981` | `rgba(16, 185, 129, 0.2)` | `rgba(16, 185, 129, 0.3)` |

---

## 2. Utility CSS Classes

### 2.1 Ambient Orbs (`.ambient-orb`)
Overlay floating blurred gradients behind components to create organic depth:
```html
<div class="ambient-orb ambient-orb-gold h-72 w-72 left-10 top-20" />
<div class="ambient-orb ambient-orb-aqua h-96 w-96 right-10 bottom-20" />
```

### 2.2 Glass Shimmer Sweep (`.glass-shimmer`)
Adds a dynamic animated light sweep across the card:
```html
<div class="glass-shimmer surface-raised p-6 rounded-2xl">
  <!-- Content -->
</div>
```

### 2.3 Entrance Animations
Make UI pages feel premium and alive:
*   `.animate-fade-up`: Smooth translation from bottom + fade in.
*   `.animate-fade-in-scale`: Scale up (96% to 100%) + fade in.
*   `.animate-reveal-up`: Slow, heavy cinematic blur reveal.

Stagger entrance using delay helpers: `.delay-100`, `.delay-200`, `.delay-300`, `.delay-400`.

---

## 3. Interactive Components

### 3.1 GlassCard (`GlassCard.tsx`)
A 3D tilt-on-hover card component.
```tsx
import { GlassCard } from '@/components/ui/GlassCard';

<GlassCard tilt={true} glow="gold" onClick={handleSelect}>
  <h3>Interactive 3D Glass Card</h3>
</GlassCard>
```

### 3.2 GlassButton (`GlassButton.tsx`)
Premium button featuring a magnetic hover pull and custom glass glows.
```tsx
import { GlassButton } from '@/components/ui/GlassButton';

<GlassButton variant="primary" size="md">
  Unlock AI Console
</GlassButton>
<GlassButton variant="gold" size="sm">
  Upgrade Tier
</GlassButton>
```

---

## 4. Accessibility & Performance NFRs

1.  **Motion Preference Support:** All hover effects (tilt, scale) and keyframe animations automatically disable or degrade gracefully when `prefers-reduced-motion: reduce` is detected in media queries or JS matches.
2.  **Color Contrast:** Ensure a contrast ratio of at least 4.5:1 for body copy. Avoid placing `text-slate-500` directly on very light glass. Prefer `text-slate-400` or `text-slate-300`.
3.  **Keyboard Nav:** Any clickable card or custom button must handle Space/Enter triggers, carry `tabIndex={0}`, and have clear outline rings via `:focus-visible`.
4.  **Mobile Performance:** Backdrop blur reduces to `blur(12px)` on screens narrower than `640px` to maintain 60fps scrolling on lower-end devices.
