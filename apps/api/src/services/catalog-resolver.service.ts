/**
 * Product Catalog Resolver Agent for minimarket inventory.
 * Resolves search queries to structured product candidates (OFF first, then MercadoLibre fallback).
 */

const NORMALIZED_CATEGORIES = [
  "Beverages",
  "Snacks",
  "Dairy",
  "Bakery",
  "Fruits & Vegetables",
  "Frozen",
  "Pantry",
  "Cleaning",
  "Personal Care",
  "Other",
] as const;

export type NormalizedCategory = (typeof NORMALIZED_CATEGORIES)[number];

export interface ProductCatalogCandidate {
  name: string;
  brand: string | null;
  imageUrl: string | null;
  category: string | null;
  barcode: string | null;
}

export interface CatalogResolverResult {
  query: string;
  candidates: ProductCatalogCandidate[];
}

// Keywords to map raw categories to normalized ones (case-insensitive)
const CATEGORY_MAP: { keywords: string[]; category: NormalizedCategory }[] = [
  { keywords: ["bebidas", "beverages", "refrescos", "jugos", "agua", "sodas", "cerveza", "vino"], category: "Beverages" },
  { keywords: ["snacks", "galletas", "dulces", "chocolate", "papas fritas", "palitos", "maní", "nuts"], category: "Snacks" },
  { keywords: ["lácteos", "dairy", "leche", "yogur", "queso", "mantequilla", "crema"], category: "Dairy" },
  { keywords: ["pan", "bakery", "repostería", "tortillas", "pasteles", "bollería"], category: "Bakery" },
  { keywords: ["frutas", "verduras", "vegetables", "fruits", "hortalizas", "ensaladas"], category: "Fruits & Vegetables" },
  { keywords: ["congelados", "frozen", "helados", "ice cream"], category: "Frozen" },
  { keywords: ["despensa", "pantry", "arroz", "fideos", "aceite", "conservas", "salsas", "condimentos", "cereales", "legumbres", "harina"], category: "Pantry" },
  { keywords: ["limpieza", "cleaning", "detergente", "cloro", "jabón", "papel", "toalla"], category: "Cleaning" },
  { keywords: ["cuidado personal", "personal care", "jabón", "shampoo", "pasta dental", "higiene", "cosméticos"], category: "Personal Care" },
];

function normalizeCategory(raw: string | null | undefined): NormalizedCategory | null {
  if (!raw || !raw.trim()) return null;
  const lower = raw.trim().toLowerCase();
  for (const { keywords, category } of CATEGORY_MAP) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Other";
}

// Discard if category/text suggests supplements, bulk, restaurant, accessories
function isExcludedByCategoryOrName(name: string, category: string | null): boolean {
  const text = `${(name || "").toLowerCase()} ${(category || "").toLowerCase()}`;
  const exclude = [
    "suplemento", "supplement", "vitamina", "proteína en polvo", "whey",
    "restaurant", "restaurante", "bulk", "granel", "a granel",
    "materia prima", "raw ingredient", "accesorio", "accessory",
    "pack x12", "pack x24", "multipack", "mayorista", "wholesale",
    "bundle", "combo accesorio",
  ];
  return exclude.some((x) => text.includes(x));
}

// --- Open Food Facts Search API ---
type OffSearchProduct = {
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  code?: string;
};

type OffSearchResponse = {
  count?: number;
  products?: OffSearchProduct[];
};

async function searchOpenFoodFacts(query: string): Promise<ProductCatalogCandidate[]> {
  const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&page_size=10`;
  const res = await fetch(url, {
    headers: { "User-Agent": "repon-catalog/1.0", Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null || !("products" in data)) return [];
  const products = (data as OffSearchResponse).products ?? [];

  const candidates: ProductCatalogCandidate[] = [];

  for (const p of products) {
    const name =
      (p.product_name_es?.trim() ?? "") || (p.product_name?.trim() ?? "") || null;
    if (!name) continue;

    const brandRaw = p.brands?.trim();
    const brand = brandRaw ? brandRaw.split(",")[0]?.trim() ?? null : null;
    const categoryRaw = p.categories?.trim();
    const firstCategory = categoryRaw ? categoryRaw.split(",")[0]?.trim() ?? null : null;
    const imageUrl = (p.image_url?.trim() ?? "") || null;
    const barcode = p.code ? String(p.code).trim() || null : null;

    if (!imageUrl && !brand) continue;
    if (isExcludedByCategoryOrName(name, firstCategory)) continue;

    const category = normalizeCategory(firstCategory ?? "Other");
    candidates.push({
      name,
      brand,
      imageUrl: imageUrl || null,
      category,
      barcode,
    });
  }

  return candidates.slice(0, 8);
}

// --- MercadoLibre fallback ---
type MLItem = {
  id?: string;
  title?: string;
  thumbnail?: string;
  category_id?: string;
  attributes?: { id?: string; value_name?: string }[];
};

type MLSearchResponse = {
  results?: MLItem[];
};

const ML_CATEGORY_TO_NORMALIZED: Record<string, NormalizedCategory> = {
  "MLM1403": "Beverages",
  "MLM1404": "Beverages",
  "MLM1182": "Snacks",
  "MLM1181": "Dairy",
  "MLM1784": "Bakery",
  "MLM1402": "Fruits & Vegetables",
  "MLM1183": "Frozen",
  "MLM1184": "Pantry",
  "MLM1185": "Cleaning",
  "MLM1186": "Personal Care",
};

function mapMlCategory(categoryId: string | undefined): NormalizedCategory | null {
  if (!categoryId) return "Other";
  return ML_CATEGORY_TO_NORMALIZED[categoryId] ?? "Other";
}

function isExcludedMlListing(title: string): boolean {
  const t = title.toLowerCase();
  if (/\bx\d{2,}\b/.test(t)) return true; // multipack x12, x24
  if (/\bmayorista\b|\bwholesale\b|\bpack\b.*\bunidades\b/i.test(t)) return true;
  if (/\baccesorio\b|\bbundle\b|\bcombo\b.*\baccesorio\b/i.test(t)) return true;
  return false;
}

async function searchMercadoLibre(query: string): Promise<ProductCatalogCandidate[]> {
  const url = `https://api.mercadolibre.com/sites/MLC/search?q=${encodeURIComponent(query)}&limit=15`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null || !("results" in data)) return [];
  const results = (data as MLSearchResponse).results ?? [];

  const candidates: ProductCatalogCandidate[] = [];

  for (const item of results) {
    const name = item.title?.trim() ?? null;
    if (!name || isExcludedMlListing(name)) continue;

    const brandAttr = item.attributes?.find((a) => a.id === "BRAND");
    const brand = brandAttr?.value_name?.trim() ?? null;
    const imageUrl = item.thumbnail?.trim() ?? null;
    const category = mapMlCategory(item.category_id);

    candidates.push({
      name,
      brand,
      imageUrl: imageUrl || null,
      category,
      barcode: null,
    });
  }

  return candidates.slice(0, 8);
}

/**
 * Resolve a search query to up to 8 product candidates for the global catalog.
 * Uses Open Food Facts first; if fewer than 3 valid candidates, falls back to MercadoLibre.
 */
export async function resolveCatalogQuery(query: string): Promise<CatalogResolverResult> {
  const q = query.trim();
  if (!q) return { query: q, candidates: [] };

  let candidates = await searchOpenFoodFacts(q);

  if (candidates.length < 3) {
    const mlCandidates = await searchMercadoLibre(q);
    const existingNames = new Set(candidates.map((c) => c.name.toLowerCase()));
    for (const c of mlCandidates) {
      if (existingNames.has(c.name.toLowerCase())) continue;
      candidates.push(c);
      existingNames.add(c.name.toLowerCase());
      if (candidates.length >= 8) break;
    }
  }

  return {
    query: q,
    candidates: candidates.slice(0, 8),
  };
}
