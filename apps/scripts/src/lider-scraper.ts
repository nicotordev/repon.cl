/**
 * Scraper de listados de productos de Lider.cl (supermercado).
 * Usa la estructura conocida de www.lider.cl/supermercado/category/
 * Respeta rate limiting con delays entre requests.
 */

import * as cheerio from "cheerio";

const BASE_URL = "https://www.lider.cl";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
};

export interface LiderScrapedProduct {
  name: string;
  brand: string | null;
  sku: string | null;
  priceGross: number | null;
  url: string | null;
  category: string | null;
}

function cleanId(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.replace(/\(Ref:\s*/i, "").replace(/\)/g, "").trim();
  return t.length > 0 ? t : null;
}

function parsePrice(text: string | undefined): number | null {
  if (!text || !text.trim()) return null;
  const digits = text.replace(/\D/g, "");
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? null : n;
}

export function parseListingHtml(html: string, categoryName: string | null): LiderScrapedProduct[] {
  const $ = cheerio.load(html);
  const products: LiderScrapedProduct[] = [];

  const container = $("div.grid-of-five.clearfix.box-products-list");
  container.find("div.box-product").each((_, el) => {
    const $el = $(el);
    const priceText = $el.find("span.price-sell b").first().text().trim();
    const brand = $el.find("span.product-name").first().text().trim() || null;
    const name =
      $el.find("span.product-description.js-ellipsis").first().text().trim() ||
      brand;
    const ref = $el.find("span.reference-code").first().text().trim();
    const href = $el.find("a.product-link").first().attr("href");
    const url = href ? (href.startsWith("http") ? href : BASE_URL + href) : null;

    if (!name) return;

    products.push({
      name,
      brand: brand || null,
      sku: cleanId(ref) || null,
      priceGross: parsePrice(priceText),
      url,
      category: categoryName,
    });
  });

  return products;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchCategoryPage(path: string): Promise<string> {
  const url = path.startsWith("http") ? path : BASE_URL + path;
  const res = await fetch(url, {
    headers: DEFAULT_HEADERS,
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/**
 * Scrapea una página de categoría y opcionalmente sigue la paginación.
 * maxPages: máximo de páginas a recorrer (1 = solo la primera).
 */
export async function scrapeLiderCategory(options: {
  categoryPath?: string;
  maxPages?: number;
  delayMs?: number;
}): Promise<LiderScrapedProduct[]> {
  const { categoryPath = "/supermercado/category/", maxPages = 3, delayMs = 2000 } = options;
  const all: LiderScrapedProduct[] = [];
  const categoryName = categoryPath.split("/").filter(Boolean).pop() ?? null;

  let currentPath = categoryPath.startsWith("http") ? new URL(categoryPath).pathname : categoryPath;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const html = await fetchCategoryPage(currentPath);
    const list = parseListingHtml(html, categoryName);
    all.push(...list);

    const $ = cheerio.load(html);
    const nextLink = $("div.box-pagination.clearfix.hidden-xs a").last().attr("href");
    if (!nextLink || list.length === 0) break;

    currentPath = nextLink.startsWith("http") ? new URL(nextLink).pathname : nextLink;
    pageCount++;
    await delay(delayMs);
  }

  return all;
}
