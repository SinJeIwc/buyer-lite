const STORAGE_KEY = "buyer-lite-item-suggestions";
const MAX_RECENT = 50;
const MAX_SUGGESTIONS = 5;

interface ItemSuggestionCache {
  names: string[]; // ["Юбка", "Клеш брюки"]
  sizes: string[]; // ["32-34", "M"]
  recent: Array<{ name: string; size?: string }>; // Последние комбинации
}

function getCache(): ItemSuggestionCache {
  if (typeof window === "undefined") {
    return { names: [], sizes: [], recent: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { names: [], sizes: [], recent: [] };
}

function saveCache(cache: ItemSuggestionCache) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

function addToUnique(arr: string[], value: string, max: number): string[] {
  const filtered = arr.filter((item) => item !== value);
  return [value, ...filtered].slice(0, max);
}

// Сохранить товар в историю
export function saveItemSuggestion(name: string, size?: string) {
  const cache = getCache();

  // Сохраняем имя
  cache.names = addToUnique(cache.names, name, MAX_RECENT);

  // Сохраняем размер (если есть)
  if (size) {
    cache.sizes = addToUnique(cache.sizes, size, MAX_RECENT);
  }

  // Сохраняем комбинацию
  const combo = { name, size: size || undefined };
  cache.recent = [
    combo,
    ...cache.recent.filter(
      (r) => !(r.name === name && r.size === (size || undefined)),
    ),
  ].slice(0, MAX_RECENT);

  saveCache(cache);
}

// Получить рекомендации по имени
export function getNameSuggestions(query: string): string[] {
  if (!query || query.length < 1) return [];

  const cache = getCache();
  const lowerQuery = query.toLowerCase();

  // 1. Ищем в recent (последние использованные)
  const recentNames = cache.recent
    .map((r) => r.name)
    .filter((name, index, arr) => arr.indexOf(name) === index); // unique

  // 2. Ищем в names (все имена)
  const allNames = [...new Set([...recentNames, ...cache.names])];

  // Сортируем: exact start > contains
  const exactStart: string[] = [];
  const contains: string[] = [];

  for (const name of allNames) {
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith(lowerQuery)) {
      exactStart.push(name);
    } else if (lowerName.includes(lowerQuery)) {
      contains.push(name);
    }
  }

  // Приоритет: exact start → contains
  return [...exactStart, ...contains].slice(0, MAX_SUGGESTIONS);
}

// Получить рекомендации по размеру
export function getSizeSuggestions(query: string): string[] {
  if (!query || query.length < 1) return [];

  const cache = getCache();
  const lowerQuery = query.toLowerCase();

  // Сортируем: recent first
  const recentSizes = cache.recent
    .map((r) => r.size)
    .filter((s): s is string => !!s)
    .filter((size, index, arr) => arr.indexOf(size) === index);

  const allSizes = [...new Set([...recentSizes, ...cache.sizes])];

  const exactStart: string[] = [];
  const contains: string[] = [];

  for (const size of allSizes) {
    const lowerSize = size.toLowerCase();
    if (lowerSize.startsWith(lowerQuery)) {
      exactStart.push(size);
    } else if (lowerSize.includes(lowerQuery)) {
      contains.push(size);
    }
  }

  return [...exactStart, ...contains].slice(0, MAX_SUGGESTIONS);
}

// Получить рекомендации на основе последних товаров (для начального отображения)
export function getRecentSuggestions(): Array<{ name: string; size?: string }> {
  const cache = getCache();
  return cache.recent.slice(0, MAX_SUGGESTIONS);
}
