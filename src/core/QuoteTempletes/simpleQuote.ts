/**
 * Simple quote template for solo / small-crew home-service businesses.
 * Usage: Print.printToFileAsync({ html: renderSimpleQuote(quote), width: 612, height: 792 })
 */

export interface SimpleQuote {
  business: {
    name: string;
    phone: string;
    email?: string;
    address?: string; // one line, e.g. '4120 Industrial Blvd, Austin, TX 78744'
    logoUrl?: string; // optional, base64 data URI works best
  };
  number: string; // 'EST-0001'
  date: string; // 'October 28, 2026'
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address: string; // service address, one line
  };
  areaSqFt?: number; // measured area (optional)
  description?: string; // what the job is (optional)
  items: { description: string; quantity: number; unit: string; unitPrice: number }[];
  taxPercent?: number; // optional, e.g. 8.25~
  adjustment?: { label: string; amount: number }; // optional tax/discount amount
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const commas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const money = (n: number) => {
  const [i, d] = n.toFixed(2).split('.');
  return `$${commas(i)}.${d}`;
};
const num = (n: number) => {
  const [i, d] = (Math.round(n * 100) / 100).toString().split('.');
  return commas(i) + (d ? `.${d}` : '');
};
const round = (n: number) => Math.round(n * 100) / 100;

export function renderSimpleQuote(q: SimpleQuote): string {
  const rows = q.items.map((i) => ({ ...i, total: round(i.quantity * i.unitPrice) }));
  const subtotal = round(rows.reduce((a, r) => a + r.total, 0));
  const tax = q.taxPercent ? round((subtotal * q.taxPercent) / 100) : 0;
  const adjustment = round(q.adjustment?.amount ?? 0);
  const total = round(subtotal + tax + adjustment);
  const b = q.business;

  const bizLines = [b.address, b.phone, b.email].filter(Boolean).map(esc).join('<br>');
  const logo = b.logoUrl ? `<img class="logo" src="${esc(b.logoUrl)}" alt="">` : '';
  const custLines = [q.customer.address, q.customer.phone, q.customer.email].filter(Boolean).map(esc).join('<br>');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Quote ${esc(q.number)}</title>
<style>
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.5; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
p { margin: 0; }
.frame { width: 100%; border-collapse: collapse; border: 0; }
.frame > thead > tr > td, .frame > tfoot > tr > td { height: 0.6in; padding: 0; border: 0; }
.frame > tbody > tr > td { padding: 0 0.7in; border: 0; vertical-align: top; }
.bar { display: flex; justify-content: space-between; align-items: center; background: #3b6cb4; color: #fff; padding: 9pt 12pt; }
.bar .name { display: flex; align-items: center; gap: 8pt; font-size: 16pt; font-weight: 700; }
.logo { height: 26pt; width: auto; background: #fff; padding: 2pt; }
.bar .doc { font-size: 15pt; font-weight: 700; }
.biz { margin-top: 12pt; }
.info { display: flex; justify-content: space-between; margin-top: 28pt; }
.info b { font-weight: 700; }
.for p { margin-top: 2pt; }
.meta { width: 112pt; }
.meta div { display: flex; align-items: baseline; gap: 8pt; margin-bottom: 6pt; }
.meta b { white-space: nowrap; }
.meta span { margin-left: auto; }
.job { margin-top: 20pt; }
.job span { color: #555; }
table.items { width: 100%; border-collapse: collapse; margin-top: 24pt; font-variant-numeric: tabular-nums; border: .75pt solid #888; }
.items thead { display: table-header-group; }
.items th { background: #f1f1f1; font-size: 9pt; font-weight: 700; text-transform: uppercase; padding: 7pt 8pt; border: .75pt solid #888; }
.items td { padding: 7pt 8pt; border-left: .75pt solid #888; border-right: .75pt solid #888; border-bottom: .75pt solid #ccc; vertical-align: top; }
.items tr { break-inside: avoid; }
.c { text-align: center; } .r { text-align: right; }
.totals { width: 250pt; margin: 0 0 0 auto; break-inside: avoid; font-variant-numeric: tabular-nums; }
.totals .row { display: flex; justify-content: space-between; padding: 8pt 8pt 8pt 40pt; }
.totals .grand { display: flex; justify-content: space-between; align-items: center; padding: 10pt 8pt; margin-top: 4pt; background: #f1f1f1; border: .75pt solid #ccc; font-weight: 700; }
.totals .grand span:first-child { font-size: 12pt; padding-left: 32pt; }
.totals .grand span:last-child { font-size: 13pt; }
</style></head>
<body>
<table class="frame"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>
<div class="bar"><div class="name">${logo}<span>${esc(b.name)}</span></div><div class="doc">QUOTE</div></div>
<p class="biz">${bizLines}</p>

<div class="info">
  <div class="for"><b>For</b><p>${esc(q.customer.name)}</p><p>${custLines}</p></div>
  <div class="meta">
    <div><b>Quote #</b><span>${esc(q.number)}</span></div>
    <div><b>Quote Date</b><span>${esc(q.date)}</span></div>
  </div>
</div>

${q.description || q.areaSqFt ? `<div class="job">
  ${q.description ? `<p>${esc(q.description)}</p>` : ''}
  ${q.areaSqFt ? `<p><span>Measured area:</span> <b>${num(q.areaSqFt)} sq ft</b></p>` : ''}</div>` : ''}

<table class="items">
  <thead><tr><th style="width:80pt">Qty</th><th>Description</th><th style="width:80pt">Unit Price</th><th style="width:90pt">Amount</th></tr></thead>
  <tbody>${rows
    .map(
      (r) => `<tr><td class="c">${num(r.quantity)} ${esc(r.unit)}</td><td>${esc(r.description)}</td><td class="r">${money(r.unitPrice)}</td><td class="r">${money(r.total)}</td></tr>`,
    )
    .join('')}</tbody>
</table>

<div class="totals">
  ${tax || adjustment ? `<div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>` : ''}
  ${tax ? `<div class="row"><span>Sales Tax ${num(q.taxPercent!)}%</span><span>${money(tax)}</span></div>` : ''}
  ${adjustment ? `<div class="row"><span>${esc(q.adjustment!.label)}</span><span>${money(adjustment)}</span></div>` : ''}
  <div class="grand"><span>TOTAL</span><span>${money(total)}</span></div>
</div>
</td></tr></tbody></table>
</body></html>`;
}

export const sampleSimpleQuote: SimpleQuote = {
  business: {
    name: 'Lone Star Exterior Care',
    phone: '(512) 555-0143',
    email: 'estimates@lonestarexterior.example',
    address: '4120 Industrial Blvd, Austin, TX 78744',
  },
  number: 'EST-0142',
  date: '10/28/2026',
  customer: {
    name: 'Megan Alvarez',
    phone: '(512) 555-0187',
    email: 'malvarez@example.com',
    address: '2814 Willow Creek Drive, Round Rock, TX 78681',
  },
  areaSqFt: 2760,
  description: 'Pressure washing of driveway, front walkway, and back patio.',
  items: [
    { description: 'Driveway and walkway pressure washing', quantity: 1840, unit: 'sq ft', unitPrice: 0.22 },
    { description: 'Back patio cleaning', quantity: 920, unit: 'sq ft', unitPrice: 0.25 },
    { description: 'Rust stain treatment', quantity: 3, unit: 'ea', unitPrice: 45 },
  ],
  taxPercent: 8.25,
};
