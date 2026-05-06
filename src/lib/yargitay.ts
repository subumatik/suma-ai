/**
 * Yargıtay Karar Arama API Client
 *
 * Session tabanlı cookie yönetimi ile
 * https://karararama.yargitay.gov.tr üzerinden arama yapar.
 */

import { XMLParser } from "fast-xml-parser";

const BASE_URL = "https://karararama.yargitay.gov.tr";

export interface YargitayDecision {
  id: string;
  daire: string;
  esasNo: string;
  kararNo: string;
  kararTarihi: string;
  arananKelime: string;
  index: string;
  siraNo: string;
}

export interface YargitaySearchResult {
  recordsTotal: number;
  recordsFiltered: number;
  items: YargitayDecision[];
}

export interface YargitayDocumentDetail {
  id: string;
  html: string;
}

let cachedCookies: Record<string, string> | null = null;
let cachedAt = 0;
const COOKIE_TTL_MS = 1000 * 60 * 10;

async function fetchSessionCookies(): Promise<Record<string, string>> {
  const res = await fetch(`${BASE_URL}/`, {
    method: "GET",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr,en-US;q=0.9,en;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    },
  });

  const cookies: Record<string, string> = {};
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of setCookie) {
    const [kv] = c.split(";");
    const [k, v] = kv.split("=");
    if (k && v) cookies[k.trim()] = v.trim();
  }
  return cookies;
}

async function getCookies(): Promise<Record<string, string>> {
  if (cachedCookies && Date.now() - cachedAt < COOKIE_TTL_MS) {
    return cachedCookies;
  }
  cachedCookies = await fetchSessionCookies();
  cachedAt = Date.now();
  return cachedCookies;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  baseDelay = 1500
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, init);
    if (res.status === 429 && i < retries) {
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded for 429");
}

function normalizeDecisions(rawItems: any[]): YargitayDecision[] {
  return rawItems.map((d) => ({
    id: String(d.id ?? ""),
    daire: String(d.daire ?? ""),
    esasNo: String(d.esasNo ?? ""),
    kararNo: String(d.kararNo ?? ""),
    kararTarihi: String(d.kararTarihi ?? ""),
    arananKelime: String(d.arananKelime ?? ""),
    index: String(d.index ?? ""),
    siraNo: String(d.siraNo ?? ""),
  }));
}

function parseSearchResponse(body: string): YargitaySearchResult {
  try {
    const json = JSON.parse(body);
    const data = json?.data?.data;
    const recordsTotal = Number(json?.data?.recordsTotal ?? 0);
    const recordsFiltered = Number(json?.data?.recordsFiltered ?? 0);

    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data && typeof data === "object") {
      items = [data];
    }

    return { recordsTotal, recordsFiltered, items: normalizeDecisions(items) };
  } catch {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: true,
    });
    const parsed = parser.parse(body);
    const data = parsed?.AdaletResponseDto?.data;
    let recordsTotal = 0;
    let recordsFiltered = 0;
    const items: YargitayDecision[] = [];

    if (data) {
      recordsTotal = Number(data.recordsTotal ?? 0);
      recordsFiltered = Number(data.recordsFiltered ?? 0);
      const wrapper = Array.isArray(data.data) ? data.data[0] : data.data;
      const decisionList = wrapper?.data;
      if (decisionList) {
        const list = Array.isArray(decisionList) ? decisionList : [decisionList];
        for (const d of list) {
          if (d && typeof d === "object") {
            items.push({
              id: String(d.id ?? ""),
              daire: String(d.daire ?? ""),
              esasNo: String(d.esasNo ?? ""),
              kararNo: String(d.kararNo ?? ""),
              kararTarihi: String(d.kararTarihi ?? ""),
              arananKelime: String(d.arananKelime ?? ""),
              index: String(d.index ?? ""),
              siraNo: String(d.siraNo ?? ""),
            });
          }
        }
      }
    }
    return { recordsTotal, recordsFiltered, items };
  }
}

export async function searchYargitay(
  query: string,
  pageSize = 10,
  pageNumber = 1
): Promise<YargitaySearchResult> {
  const cookies = await getCookies();

  const payload = {
    data: {
      aranan: query,
      arananKelime: query,
      pageSize,
      pageNumber,
    },
  };

  const res = await fetchWithRetry(
    `${BASE_URL}/aramalist`,
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json; charset=UTF-8",
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        Cookie: cookieHeader(cookies),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(`Yargıtay arama hatası: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseSearchResponse(text);
}

function parseDocumentResponse(body: string): string {
  try {
    const json = JSON.parse(body);
    let html = json?.data ?? "";
    if (typeof html === "string") {
      html = html
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    return String(html);
  } catch {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: false,
    });
    const parsed = parser.parse(body);
    let html = parsed?.AdaletResponseDto?.data ?? "";
    if (typeof html === "string") {
      html = html
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    return String(html);
  }
}

export async function getYargitayDocument(
  id: string
): Promise<YargitayDocumentDetail> {
  const cookies = await getCookies();

  const res = await fetchWithRetry(
    `${BASE_URL}/getDokuman?id=${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        Accept: "*/*",
        Referer: `${BASE_URL}/`,
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        Cookie: cookieHeader(cookies),
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Yargıtay detay hatası: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const html = parseDocumentResponse(text);
  return { id, html };
}

export async function searchAndFetchDetails(
  query: string,
  maxListResults = 10,
  maxDetails = 2
): Promise<{
  query: string;
  total: number;
  decisions: (YargitayDecision & { detail?: string })[];
}> {
  const list = await searchYargitay(query, maxListResults, 1);

  const decisions = list.items.slice(0, maxListResults);
  const withDetails: (YargitayDecision & { detail?: string })[] = [];

  for (let i = 0; i < Math.min(decisions.length, maxDetails); i++) {
    const d = decisions[i];
    try {
      const doc = await getYargitayDocument(d.id);
      const text = doc.html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
      withDetails.push({ ...d, detail: text });
    } catch (e) {
      withDetails.push(d);
    }
    // Rate limit koruması: detaylar arası bekle
    if (i < Math.min(decisions.length, maxDetails) - 1) {
      await sleep(800);
    }
  }

  for (let i = maxDetails; i < decisions.length; i++) {
    withDetails.push(decisions[i]);
  }

  return { query, total: list.recordsFiltered, decisions: withDetails };
}
