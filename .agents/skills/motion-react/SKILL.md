---
name: motion-react
description: Animation library for React and Next.js. Use for page transitions, micro-interactions, scroll animations, layout animations, number counters, gesture-based animations, and entrance/exit effects. Replaces Framer Motion with lighter `motion` package.
license: MIT
metadata:
  version: 1.0.0
  last_verified: 2026-06-08
  package_version: 12.x+
  keywords:
    - motion
    - framer-motion
    - animation
    - react
    - nextjs
    - transition
    - animate
    - variants
    - stagger
    - layout
    - scroll
    - gesture
    - drag
    - spring
    - keyframes
    - presence
    - enter-exit
    - number-counter
    - micro-interaction
---

# Motion for React (Next.js)

## Overview

`motion` is the modern replacement for `framer-motion` — a lightweight animation library for React. Works with Next.js App Router, Server Components, and React 19.

## Installation

```bash
pnpm add motion
```

**Import:**
```tsx
import { motion, AnimatePresence } from "motion/react";
```

> ⚠️ Always import from `motion/react`, NOT from `motion` or `framer-motion`.

---

## Core Concepts

### 1. Basic Animation

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Hello
</motion.div>
```

### 2. Exit Animation (AnimatePresence)

```tsx
import { AnimatePresence, motion } from "motion/react";

<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="unique-id"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

**`mode` options:**
- `"wait"` — exit finishes before enter starts
- `"popLayout"` — items pop out of layout
- `"sync"` — enter and exit simultaneously

### 3. Layout Animation

```tsx
<motion.div layout>
  {/* Content that changes size/position */}
</motion.div>
```

Automatically animates position and size changes when layout shifts.

### 4. Stagger Children

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.li key={i.id} variants={item}>
      {i.name}
    </motion.li>
  ))}
</motion.ul>;
```

---

## Common Patterns

### Number Counter (Animated Value)

```tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

function AnimatedNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {value.toLocaleString("ru-RU")}
      </motion.span>
    </AnimatePresence>
  );
}
```

### Page Transition (Next.js App Router)

```tsx
"use client";

import { motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

### Fade In on Scroll

```tsx
"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

### Tap/Press Feedback

```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Card Expand/Collapse

```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";

function ExpandableCard({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      animate={{ height: isExpanded ? "auto" : 80 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="overflow-hidden cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
```

### List Reorder

```tsx
import { Reorder } from "motion/react";

function ReorderList({ items }: { items: string[] }) {
  const [list, setList] = useState(items);

  return (
    <Reorder.Group axis="y" values={list} onReorder={setList}>
      {list.map((item) => (
        <Reorder.Item key={item} value={item}>
          {item}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

---

## Next.js Specific

### Client Component Requirement

All `motion` components must be in Client Components (`"use client"`).

```tsx
"use client";

import { motion } from "motion/react";

export function AnimatedCard() {
  return <motion.div animate={{ opacity: 1 }}>...</motion.div>;
}
```

### Lazy Motion (Bundle Optimization)

For code splitting, use `LazyMotion`:

```tsx
"use client";

import { LazyMotion, domAnimation, m } from "motion/react";

export function OptimizedAnimations({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div animate={{ opacity: 1 }}>{children}</m.div>
    </LazyMotion>
  );
}
```

> Use `m` instead of `motion` when using `LazyMotion`.

### Server Components

Motion components **cannot** be used directly in Server Components. Wrap in a Client Component:

```tsx
// ❌ Wrong — Server Component
export default function Page() {
  return <motion.div animate={{ opacity: 1 }}>Hello</motion.div>;
}

// ✅ Correct — Client Component wrapper
export default function Page() {
  return <AnimatedWrapper>Hello</AnimatedWrapper>;
}
```

---

## Transition Types

### Spring (Default)

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>
```

### Tween (Duration-based)

```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>
```

### Keyframes

```tsx
<motion.div
  animate={{ x: [0, 100, 50, 100] }}
  transition={{ duration: 1.5, times: [0, 0.3, 0.6, 1] }}
/>
```

### Inertia (Momentum)

```tsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.5}
/>
```

---

## Easing Curves

```tsx
// Preset easings
transition={{ ease: "easeIn" }}
transition={{ ease: "easeOut" }}
transition={{ ease: "easeInOut" }}

// Custom cubic bezier
transition={{ ease: [0.25, 0.1, 0.25, 1] }}

// Spring-like
transition={{ ease: [0.175, 0.885, 0.32, 1.275] }}
```

---

## Gesture Hooks

```tsx
import { useDragControls, useMotionValue } from "motion/react";

function DragExample() {
  const x = useMotionValue(0);
  const controls = useDragControls();

  return (
    <motion.div
      drag="x"
      style={{ x }}
      dragControls={controls}
      dragConstraints={{ left: -100, right: 100 }}
    />
  );
}
```

---

## Performance Tips

1. **Use `transform` properties** — `x`, `y`, `scale`, `rotate` are GPU-accelerated
2. **Avoid animating `width`/`height`** — use `scale` instead
3. **Use `layout` prop sparingly** — it triggers layout recalculations
4. **Prefer `will-change: transform`** in CSS for frequently animated elements
5. **Use `LazyMotion`** for code splitting in large apps

---

## Quick Reference

| Prop | Purpose |
|------|---------|
| `initial` | Starting state |
| `animate` | Target state |
| `exit` | State when unmounting (needs AnimatePresence) |
| `whileHover` | State on hover |
| `whileTap` | State on press |
| `whileDrag` | State while dragging |
| `whileInView` | State when in viewport |
| `transition` | Animation config |
| `variants` | Named animation states |
| `layout` | Auto-animate layout changes |
| `drag` | Enable dragging |
| `dragConstraints` | Limit drag area |

---

## Common Mistakes

1. **Missing `"use client"`** — motion components don't work in Server Components
2. **Wrong import** — use `motion/react`, not `motion` or `framer-motion`
3. **Missing `key` in AnimatePresence** — required for exit animations
4. **Animating layout without `layout` prop** — won't work
5. **Using `exit` without AnimatePresence** — exit animations won't trigger
