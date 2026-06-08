const STORAGE_KEY = "buyer-lite-item-suggestions";
const MAX_NAMES = 200;
const MAX_SIZES = 100;
const MAX_ASSOCIATIONS = 500;
const MAX_SUGGESTIONS = 5;

// Дефолтные названия товаров (одежда)
const DEFAULT_NAMES = [
  "Юбка",
  "Штаны",
  "Блузка",
  "Платье",
  "Футболка",
  "Рубашка",
  "Куртка",
  "Пальто",
  "Джинсы",
  "Шорты",
  "Свитер",
  "Кардиган",
  "Жилет",
  "Костюм",
  "Брюки",
  "Леггинсы",
  "Топ",
  "Туника",
  "Пиджак",
  "Жакет",
];

// Дефолтные размеры
const DEFAULT_SIZES = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "32-34",
  "34-36",
  "36-38",
  "38-40",
  "40-42",
  "42-44",
  "44-46",
  "46-48",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
];

interface ItemEntry {
  value: string;
  count: number;
}

interface Association {
  name: string;
  size: string;
  count: number;
}

interface ItemSuggestionCache {
  names: ItemEntry[];
  sizes: ItemEntry[];
  associations: Association[];
  recent: Array<{ name: string; size?: string }>;
}

function getCache(): ItemSuggestionCache {
  if (typeof window === "undefined") {
    return { names: [], sizes: [], associations: [], recent: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Миграция со старого формата (массив строк → массив ItemEntry)
      if (parsed.names && typeof parsed.names[0] === "string") {
        parsed.names = parsed.names.map((n: string) => ({
          value: n,
          count: 1,
        }));
      }
      if (parsed.sizes && typeof parsed.sizes[0] === "string") {
        parsed.sizes = parsed.sizes.map((s: string) => ({
          value: s,
          count: 1,
        }));
      }
      if (!parsed.associations) parsed.associations = [];
      return parsed;
    }
  } catch {}
  return { names: [], sizes: [], associations: [], recent: [] };
}

function saveCache(cache: ItemSuggestionCache) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

function upsertEntry(
  arr: ItemEntry[],
  value: string,
  max: number,
): ItemEntry[] {
  const existing = arr.find((e) => e.value === value);
  if (existing) {
    existing.count++;
    // Сортируем по count (убывание)
    return arr.sort((a, b) => b.count - a.count);
  }
  const result = [{ value, count: 1 }, ...arr];
  if (result.length > max) result.pop();
  return result;
}

function upsertAssociation(
  arr: Association[],
  name: string,
  size: string,
  max: number,
): Association[] {
  const existing = arr.find((a) => a.name === name && a.size === size);
  if (existing) {
    existing.count++;
    return arr.sort((a, b) => b.count - a.count);
  }
  const result = [{ name, size, count: 1 }, ...arr];
  if (result.length > max) result.pop();
  return result;
}

// Сохранить товар в историю
export function saveItemSuggestion(name: string, size?: string) {
  const cache = getCache();

  cache.names = upsertEntry(cache.names, name, MAX_NAMES);

  if (size) {
    cache.sizes = upsertEntry(cache.sizes, size, MAX_SIZES);
    cache.associations = upsertAssociation(
      cache.associations,
      name,
      size,
      MAX_ASSOCIATIONS,
    );
  }

  // Recent (последние комбинации)
  const combo = { name, size: size || undefined };
  cache.recent = [
    combo,
    ...cache.recent.filter(
      (r) => !(r.name === name && r.size === (size || undefined)),
    ),
  ].slice(0, 50);

  saveCache(cache);
}

// Получить рекомендации по имени
export function getNameSuggestions(query: string): string[] {
  if (!query || query.length < 1) return [];

  const cache = getCache();
  const lowerQuery = query.toLowerCase();

  // Объединяем: recent → names (по частоте) → defaults
  const recentNames = cache.recent
    .map((r) => r.name)
    .filter((name, index, arr) => arr.indexOf(name) === index);

  const savedNames = cache.names
    .sort((a, b) => b.count - a.count)
    .map((e) => e.value);

  const allNames = [
    ...new Set([...recentNames, ...savedNames, ...DEFAULT_NAMES]),
  ];

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

  return [...exactStart, ...contains].slice(0, MAX_SUGGESTIONS);
}

// Получить рекомендации по размеру (с учётом выбранного имени)
export function getSizeSuggestions(query: string, forName?: string): string[] {
  if (!query || query.length < 1) return [];

  const cache = getCache();
  const lowerQuery = query.toLowerCase();

  // Если есть имя — приоритет связанным размерам
  let associatedSizes: string[] = [];
  if (forName) {
    associatedSizes = cache.associations
      .filter((a) => a.name === forName)
      .sort((a, b) => b.count - a.count)
      .map((a) => a.size);
  }

  const recentSizes = cache.recent
    .map((r) => r.size)
    .filter((s): s is string => !!s)
    .filter((size, index, arr) => arr.indexOf(size) === index);

  const savedSizes = cache.sizes
    .sort((a, b) => b.count - a.count)
    .map((e) => e.value);

  const allSizes = [
    ...new Set([
      ...associatedSizes,
      ...recentSizes,
      ...savedSizes,
      ...DEFAULT_SIZES,
    ]),
  ];

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

// Получить рекомендации на основе последних товаров
export function getRecentSuggestions(): Array<{ name: string; size?: string }> {
  const cache = getCache();
  return cache.recent.slice(0, MAX_SUGGESTIONS);
}
