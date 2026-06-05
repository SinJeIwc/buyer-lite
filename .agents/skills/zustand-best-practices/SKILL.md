---
name: zustand-best-practices
description: "Use when working with zustand state management. Triggers: zustand, store, global state, state management, useStore."
metadata:
  author: buyer-lite
  version: "1.0.0"
---

# Zustand Best Practices

## When to Use

Use zustand for:
- State shared between multiple components
- State that persists across page navigations
- Caching server data
- Complex state logic

Don't use zustand for:
- Local component state (use useState)
- Form state (use react-hook-form)
- Server-only data (use Server Components)

## Store Structure

```typescript
import { create } from "zustand";

interface MyStore {
  // State
  data: DataType[];
  isLoading: boolean;
  lastFetched: number | null;

  // Actions
  fetchData: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  addItem: (item: DataType) => void;
  removeItem: (id: string) => void;
}

export const useMyStore = create<MyStore>((set, get) => ({
  // Initial state
  data: [],
  isLoading: false,
  lastFetched: null,

  // Actions
  fetchData: async (force = false) => {
    const { lastFetched, isLoading } = get();
    
    // Cache for 5 minutes
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
      return;
    }
    
    if (isLoading) return;
    
    set({ isLoading: true });
    try {
      const data = await fetchFromServer();
      set({ data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchData(true);
  },

  addItem: (item) => set((state) => ({ 
    data: [...state.data, item] 
  })),
  
  removeItem: (id) => set((state) => ({ 
    data: state.data.filter((item) => item.id !== id) 
  })),
}));
```

## Usage in Components

```typescript
"use client";

import { useMyStore } from "@/stores/my-store";

function MyComponent() {
  // Select specific state (prevents unnecessary re-renders)
  const data = useMyStore((state) => state.data);
  const isLoading = useMyStore((state) => state.isLoading);
  const refresh = useMyStore((state) => state.refresh);

  // Or select multiple with useShallow
  const { data, isLoading } = useMyStore(
    useShallow((state) => ({ data: state.data, isLoading: state.isLoading }))
  );

  useEffect(() => {
    useMyStore.getState().fetchData(); // Without subscribing
  }, []);

  return (
    <div>
      {isLoading ? <Spinner /> : <List data={data} />}
      <Button onClick={refresh}>Refresh</Button>
    </div>
  );
}
```

## Caching Pattern

```typescript
const useCachedStore = create((set, get) => ({
  data: [],
  lastFetched: null,
  
  fetchData: async (force = false) => {
    const { lastFetched } = get();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL) {
      return; // Use cached data
    }
    
    const data = await fetchFromServer();
    set({ data, lastFetched: Date.now() });
  },
}));
```

## Best Practices

1. **Keep stores small** - One store per feature/domain
2. **Use selectors** - `useStore((state) => state.x)` prevents re-renders
3. **Cache server data** - Use `lastFetched` pattern
4. **Don't store derived state** - Compute in components or selectors
5. **Use `getState()` for non-reactive access** - In event handlers, effects

## File Structure

```
src/stores/
├── suppliers-store.ts  # Поставщики
├── items-store.ts      # Товары от поставщиков
├── clients-store.ts    # Клиенты
├── currencies-store.ts # Валюты
└── ui-store.ts         # UI state (modals, sidebar)
```

## Store Pattern

Each entity has its own store with independent caching:

```typescript
// suppliers-store.ts
export const useSuppliersStore = create<SuppliersStore>((set, get) => ({
  suppliers: [],
  isLoading: false,
  lastFetched: null,

  fetchSuppliers: async (force = false) => {
    const { lastFetched, isLoading } = get();
    if (!force && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) return;
    if (isLoading) return;

    set({ isLoading: true });
    try {
      const data = await getSuppliers();
      set({ suppliers: data, lastFetched: Date.now() });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ lastFetched: null });
    await get().fetchSuppliers(true);
  },
}));
```

## Usage in Components

```typescript
"use client";

import { useSuppliersStore } from "@/stores/suppliers-store";

function MyComponent() {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const refresh = useSuppliersStore((s) => s.refresh);

  useEffect(() => {
    useSuppliersStore.getState().fetchSuppliers();
  }, []);

  return (
    <div>
      {isLoading ? <Spinner /> : <List data={suppliers} />}
      <Button onClick={refresh}>Refresh</Button>
    </div>
  );
}
```
