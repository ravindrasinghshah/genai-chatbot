const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'data', 'stock_news.json');
const out = path.join(process.cwd(), 'data', 'stock_news_sanitized.json');

const replacements = [
  [new RegExp('\\u00A0', 'g'), ' '],
  [new RegExp('\\u00C2', 'g'), ''],
  [new RegExp('\\u2019', 'g'), "'"],
  [new RegExp('\\u2018', 'g'), "'"],
  [new RegExp('\\u201C', 'g'), '"'],
  [new RegExp('\\u201D', 'g'), '"'],
  [new RegExp('\\u2013', 'g'), '-'],
  [new RegExp('\\u2014', 'g'), '--'],
  [new RegExp('\\u2026', 'g'), '...'],
  [new RegExp('\\u00E9', 'g'), 'e'],
  [new RegExp('\\u00E2\\u20AC\\u2122', 'g'), "'"],
  [new RegExp('\\u00E2\\u20AC\\u2018', 'g'), "'"],
  [new RegExp('\\u00E2\\u20AC\\u201C', 'g'), '"'],
  [new RegExp('\\u00E2\\u20AC\\u201D', 'g'), '"'],
  [new RegExp('\\u00E2\\u20AC\\u2013', 'g'), '-'],
  [new RegExp('\\u00E2\\u20AC\\u2014', 'g'), '--'],
  [new RegExp('\\u00E2\\u20AC\\u00A6', 'g'), '...'],
];

const cleanupText = (text) => {
  if (!text) return text;
  let t = text;
  for (const [pattern, repl] of replacements) {
    t = t.replace(pattern, repl);
  }
  t = t.replace(/\s+/g, ' ').trim();
  return t;
};

const isPaywalledSnippet = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (lower.includes('premium upgrade') && text.length < 260) return true;
  if (lower.startsWith('premium')) return true;
  return false;
};

const stripPromoBlocks = (text) => {
  if (!text) return text;
  let t = text;

  const promoPatterns = [
    /\bview comments\b\.?/gi,
    /\bread next:?\b[\s\S]*$/gi,
    /\btrending:?\b[\s\S]*$/gi,
    /\bup next:?\b[\s\S]*$/gi,
    /\brelated videos\b[\s\S]*$/gi,
    /\bupgrade already have a subscription\? sign in\b/gi,
    /\bupgrade to read this[\s\S]*$/gi,
    /\bthis article is originally published at\b/gi,
    /\boriginally published at\b/gi,
  ];

  for (const pattern of promoPatterns) {
    t = t.replace(pattern, '');
  }

  t = t
    .replace(/\bclick here to\b[\s\S]*$/gi, '')
    .replace(/\byou can read this article for free\b[\s\S]*$/gi, '')
    .replace(/\bto read this article on\b[\s\S]*$/gi, '')
    .replace(/\bsee stocks free\b[\s\S]*$/gi, '')
    .replace(/\bwant the latest recommendations\b[\s\S]*$/gi, '')
    .replace(/\bcontact(s)? media contact\b[\s\S]*$/gi, '')
    .replace(/\bview source version\b[\s\S]*$/gi, '');

  return t.replace(/\s+/g, ' ').trim();
};

const sanitizeItem = (item) => {
  const title = cleanupText(item.title || '');
  const link = (item.link || '').trim();
  const ticker = (item.ticker || '').trim();
  let fullText = cleanupText(item.full_text || '');

  fullText = stripPromoBlocks(fullText);

  return {
    title,
    link,
    ticker: ticker || undefined,
    full_text: fullText || undefined,
  };
};

const sanitizeStockNews = () => {
  const raw = fs.readFileSync(src, 'utf8');
  const data = JSON.parse(raw);
  const sanitized = {};

  for (const [symbol, items] of Object.entries(data)) {
    const cleanItems = [];
    for (const item of items) {
      const cleaned = sanitizeItem(item);
      if (isPaywalledSnippet(cleaned.full_text || '')) {
        continue;
      }
      if (!cleaned.title && !cleaned.full_text) {
        continue;
      }
      cleanItems.push(cleaned);
    }
    sanitized[symbol] = cleanItems;
  }

  fs.writeFileSync(out, JSON.stringify(sanitized, null, 2), 'utf8');
  console.log(`Wrote ${out}`);
  return sanitized;
};

module.exports = {
  sanitizeStockNews,
};

if (require.main === module) {
  sanitizeStockNews();
}
