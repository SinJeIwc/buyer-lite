# Advanced Motion Patterns for Next.js

## Scroll-Linked Animations

### useScroll + useTransform

```tsx
"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

function ScrollProgress() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <motion.div ref={ref} style={{ opacity, y }}>
      Content that fades and moves up on scroll
    </motion.div>
  );
}
```

### Parallax Effect

```tsx
"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
```

### Progress Bar on Scroll

```tsx
"use client";

import { motion, useScroll } from "motion/react";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
```

---

## Shared Layout Animations

### Shared Layout ID (Image Expand)

```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";

function ImageGallery({ images }: { images: string[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      {images.map((src) => (
        <motion.img
          key={src}
          layoutId={src}
          src={src}
          onClick={() => setSelectedId(src)}
          className="cursor-pointer"
        />
      ))}

      {selectedId && (
        <motion.div layoutId={selectedId} className="fixed inset-0 z-50">
          <img src={selectedId} />
          <button onClick={() => setSelectedId(null)}>Close</button>
        </motion.div>
      )}
    </>
  );
}
```

### Shared Layout Between Pages

```tsx
// In layout.tsx or shared component
"use client";

import { motion } from "motion/react";

export function SharedCard({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <motion.div layoutId={id}>
      {children}
    </motion.div>
  );
}
```

---

## Orchestration

### Orchestrated Enter

```tsx
"use client";

import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

function OrchestratedList() {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      <motion.li variants={item}>Item 1</motion.li>
      <motion.li variants={item}>Item 2</motion.li>
      <motion.li variants={item}>Item 3</motion.li>
    </motion.ul>
  );
}
```

### Sequence Animation

```tsx
"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect } from "react";

function SequenceExample() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    async function sequence() {
      await animate(scope.current, { x: 100 }, { duration: 0.5 });
      await animate(scope.current, { rotate: 180 }, { duration: 0.3 });
      await animate(scope.current, { x: 0 }, { duration: 0.5 });
    }
    sequence();
  }, [animate, scope]);

  return <div ref={scope}>Animated</div>;
}
```

---

## Gesture-Based

### Swipe to Delete

```tsx
"use client";

import { motion, useMotionValue, useTransform } from "motion/react";

function SwipeToDelete({ onDelete }: { onDelete: () => void }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0], [0, 1]);

  return (
    <motion.div
      drag="x"
      style={{ x, opacity }}
      dragConstraints={{ left: -200, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -100) {
          onDelete();
        }
      }}
    >
      Swipe left to delete
    </motion.div>
  );
}
```

### Pull to Refresh

```tsx
"use client";

import { motion, useMotionValue, useTransform } from "motion/react";

function PullToRefresh({ onRefresh }: { onRefresh: () => void }) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, 100], [0, 360]);

  return (
    <motion.div
      drag="y"
      style={{ y, rotate }}
      dragConstraints={{ top: 0, bottom: 100 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 80) {
          onRefresh();
        }
      }}
    >
      Pull down to refresh
    </motion.div>
  );
}
```

---

## CSS Variable Integration

```tsx
"use client";

import { motion, useMotionValue, useTransform } from "motion/react";

function DynamicColor() {
  const hue = useMotionValue(0);
  const color = useTransform(hue, (v) => `hsl(${v}, 70%, 50%)`);

  return (
    <motion.div
      drag="x"
      style={{ x: hue, backgroundColor: color }}
      dragConstraints={{ left: 0, right: 360 }}
    >
      Drag to change color
    </motion.div>
  );
}
```

---

## Combining with Tailwind

### Transition on Class Change

```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";

function ToggleCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-lg bg-card p-4 ${isOpen ? "col-span-2 row-span-2" : ""}`}
      transition={{ layout: { duration: 0.3 } }}
    >
      <h3 onClick={() => setIsOpen(!isOpen)}>Toggle</h3>
      {isOpen && <p>Expanded content</p>}
    </motion.div>
  );
}
```

### Animated Badge Count

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

function AnimatedBadge({ count }: { count: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold"
      >
        {count}
      </motion.span>
    </AnimatePresence>
  );
}
```

---

## Testing Motion Components

```tsx
import { render, screen } from "@testing-library/react";
import { motion } from "motion/react";

// Mock motion for tests
jest.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
```
