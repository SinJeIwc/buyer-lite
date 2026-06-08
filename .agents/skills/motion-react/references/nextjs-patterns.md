# Motion + Next.js App Router Patterns

## Server/Client Boundary

### Problem
Motion components require `"use client"` — they can't run in Server Components.

### Solution: Wrapper Pattern

```tsx
// components/animated-card.tsx
"use client";

import { motion } from "motion/react";

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedCard({ children, delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// page.tsx (Server Component)
import { AnimatedCard } from "@/components/animated-card";

export default async function Page() {
  const data = await fetchData();

  return (
    <AnimatedCard>
      <h1>{data.title}</h1>
    </AnimatedCard>
  );
}
```

---

## Route Transitions

### Basic Page Transition

```tsx
// components/page-transition.tsx
"use client";

import { motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
```

### With usePathname

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## Loading States

### Skeleton Animation

```tsx
"use client";

import { motion } from "motion/react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-muted rounded ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
```

### Loading Spinner

```tsx
"use client";

import { motion } from "motion/react";

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      className="border-2 border-primary border-t-transparent rounded-full"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}
```

---

## Data-Driven Animations

### Animated List with Stagger

```tsx
"use client";

import { motion } from "motion/react";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T) => string;
}

export function AnimatedList<T>({ items, renderItem, getKey }: AnimatedListProps<T>) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={getKey(item)}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Counter with Spring

```tsx
"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString("ru-RU"));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
```

---

## Dialog/Modal Animation

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function AnimatedModal({ isOpen, onClose, children }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Toast/Notification Animation

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";

interface Toast {
  id: string;
  message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-card p-4 rounded-lg shadow-lg"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## Drag & Drop with Constraints

```tsx
"use client";

import { motion } from "motion/react";

function DraggableCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      drag
      dragConstraints={{
        top: -50,
        left: -50,
        right: 50,
        bottom: 50,
      }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      whileHover={{ cursor: "grab" }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Performance Optimization

### useReducedMotion

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";

function AccessibleAnimation({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### Conditional Animation

```tsx
"use client";

import { motion } from "motion/react";

function ConditionalAnimation({ children, animate = true }: { 
  children: React.ReactNode;
  animate?: boolean;
}) {
  if (!animate) return <div>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}
```
