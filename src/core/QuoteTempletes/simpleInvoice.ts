/**
 * Simple invoice template for solo / small-crew home-service businesses.
 * Same design as simpleQuote.ts.
 * Usage: Print.printToFileAsync({ html: renderSimpleInvoice(invoice), width: 612, height: 792 })
 */

export interface SimpleInvoice {
  business: {
    name: string;
    phone: string;
    email?: string;
    address?: string; // one line
    logoUrl?: string; // optional, base64 data URI works best
  };
  number: string; // 'INV-0001'
  date: string; // invoice date, e.g. '10/28/2026'
  dueDate: string; // '11/12/2026' or 'Due on receipt'
  serviceDate?: string; // date the work was done
  quoteNumber?: string; // quote this invoice came from
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address: string; // billing address, one line
  };
  serviceAddress?: string; // only if different from billing address
  items: { description: string; quantity: number; unit: string; unitPrice: number }[];
  discountAmount?: number; // optional, dollars off
  taxPercent?: number; // optional, e.g. 8.25
  amountPaid?: number; // optional, deposit or payments already received
  paymentInstructions?: string; // e.g. 'Zelle: 512-555-0100\nCheck payable to ...'
  notes?: string; // optional, e.g. 'Thank you for your business!'
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const commas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const money = (n: number) => {
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '-' : ''}$${commas(i)}.${d}`;
};
const num = (n: number) => {
  const [i, d] = (Math.round(n * 100) / 100).toString().split('.');
  return commas(i) + (d ? `.${d}` : '');
};
const round = (n: number) => Math.round(n * 100) / 100;

export function calculateSimpleInvoiceTotals(inv: Pick<
  SimpleInvoice,
  'items' | 'discountAmount' | 'taxPercent' | 'amountPaid'
>) {
  const itemTotals = inv.items.map(item => round(item.quantity * item.unitPrice));
  const subtotal = round(itemTotals.reduce((sum, total) => sum + total, 0));
  const discount = round(Math.min(inv.discountAmount ?? 0, subtotal));
  const tax = inv.taxPercent
    ? round(((subtotal - discount) * inv.taxPercent) / 100)
    : 0;
  const total = round(subtotal - discount + tax);
  const paid = round(inv.amountPaid ?? 0);

  return {
    itemTotals,
    subtotal,
    discount,
    tax,
    total,
    paid,
    balance: round(total - paid),
  };
}

export function renderSimpleInvoice(inv: SimpleInvoice): string {
  const totals = calculateSimpleInvoiceTotals(inv);
  const rows = inv.items.map((item, index) => ({ ...item, total: totals.itemTotals[index] }));
  const { subtotal, discount, tax, total, paid, balance } = totals;
  const showBreakdown = Boolean(discount || tax || paid);
  const b = inv.business;

  const bizLines = [b.address, b.phone, b.email].filter(Boolean).map(esc).join('<br>');
  const logo = b.logoUrl ? `<img class="logo" src="${esc(b.logoUrl)}" alt="">` : '';
  const custLines = [inv.customer.address, inv.customer.phone, inv.customer.email].filter(Boolean).map(esc).join('<br>');

  const metaRows = [
    ['Invoice #', inv.number],
    ['Invoice Date', inv.date],
    ['Due Date', inv.dueDate],
    inv.serviceDate ? ['Service Date', inv.serviceDate] : null,
    inv.quoteNumber ? ['Quote #', inv.quoteNumber] : null,
  ]
    .filter((r): r is string[] => Boolean(r))
    .map((r) => `<div><b>${r[0]}</b><span>${esc(r[1])}</span></div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Invoice ${esc(inv.number)}</title>
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
.info { display: flex; justify-content: space-between; gap: 16pt; margin-top: 28pt; }
.info b { font-weight: 700; }
.info .col { flex: 1; min-width: 0; }
.info .col p { margin-top: 2pt; }
.meta { width: 190pt; flex: none; }
.meta div { display: flex; justify-content: space-between; gap: 10pt; margin-bottom: 6pt; }
table.items { width: 100%; border-collapse: collapse; margin-top: 24pt; font-variant-numeric: tabular-nums; border: .75pt solid #888; }
.items thead { display: table-header-group; }
.items th { background: #f1f1f1; font-size: 9pt; font-weight: 700; text-transform: uppercase; padding: 7pt 8pt; border: .75pt solid #888; }
.items td { padding: 7pt 8pt; border-left: .75pt solid #888; border-right: .75pt solid #888; border-bottom: .75pt solid #ccc; vertical-align: top; }
.items tr { break-inside: avoid; }
.c { text-align: center; } .r { text-align: right; }
.totals { width: 260pt; margin: 0 0 0 auto; break-inside: avoid; font-variant-numeric: tabular-nums; }
.totals .row { display: flex; justify-content: space-between; padding: 6pt 8pt 6pt 40pt; }
.totals .row.strong { font-weight: 700; border-top: .75pt solid #ccc; }
.totals .grand { display: flex; justify-content: space-between; align-items: center; padding: 10pt 8pt; margin-top: 6pt; background: #f1f1f1; border: .75pt solid #ccc; font-weight: 700; }
.totals .grand span:first-child { font-size: 12pt; padding-left: 32pt; }
.totals .grand span:last-child { font-size: 13pt; }
.text { margin-top: 24pt; break-inside: avoid; }
.text b { display: block; margin-bottom: 3pt; }
.text p { white-space: pre-line; }
</style></head>
<body>
<table class="frame"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>
<div class="bar"><div class="name">${logo}<span>${esc(b.name)}</span></div><div class="doc">INVOICE</div></div>
<p class="biz">${bizLines}</p>

<div class="info">
  <div class="col"><b>Bill To</b><p>${esc(inv.customer.name)}</p><p>${custLines}</p></div>
  ${inv.serviceAddress ? `<div class="col"><b>Service Address</b><p>${esc(inv.serviceAddress)}</p></div>` : ''}
  <div class="meta">${metaRows}</div>
</div>

<table class="items">
  <thead><tr><th style="width:80pt">Qty</th><th>Description</th><th style="width:80pt">Unit Price</th><th style="width:90pt">Amount</th></tr></thead>
  <tbody>${rows
    .map(
      (r) => `<tr><td class="c">${num(r.quantity)} ${esc(r.unit)}</td><td>${esc(r.description)}</td><td class="r">${money(r.unitPrice)}</td><td class="r">${money(r.total)}</td></tr>`,
    )
    .join('')}</tbody>
</table>

<div class="totals">
  ${showBreakdown ? `<div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>` : ''}
  ${discount ? `<div class="row"><span>Discount</span><span>-${money(discount)}</span></div>` : ''}
  ${tax ? `<div class="row"><span>Sales Tax ${num(inv.taxPercent!)}%</span><span>${money(tax)}</span></div>` : ''}
  ${showBreakdown ? `<div class="row strong"><span>Total</span><span>${money(total)}</span></div>` : ''}
  ${paid ? `<div class="row"><span>Amount Paid</span><span>-${money(paid)}</span></div>` : ''}
  <div class="grand"><span>${balance <= 0 ? 'PAID IN FULL' : showBreakdown ? 'BALANCE DUE' : 'TOTAL DUE'}</span><span>${money(Math.max(balance, 0))}</span></div>
</div>

${inv.paymentInstructions ? `<div class="text"><b>Payment Information</b><p>${esc(inv.paymentInstructions)}</p></div>` : ''}
${inv.notes ? `<div class="text"><b>Notes</b><p>${esc(inv.notes)}</p></div>` : ''}
</td></tr></tbody></table>
</body></html>`;
}

export const sampleSimpleInvoice: SimpleInvoice = {
  business: {
    name: 'Lone Star Exterior Care',
    phone: '(512) 555-0143',
    email: 'billing@lonestarexterior.example',
    address: '4120 Industrial Blvd, Austin, TX 78744',
  },
  number: 'INV-0142',
  date: '11/02/2026',
  dueDate: '11/16/2026',
  serviceDate: '11/01/2026',
  quoteNumber: 'EST-0142',
  customer: {
    name: 'Megan Alvarez',
    phone: '(512) 555-0187',
    email: 'malvarez@example.com',
    address: '2814 Willow Creek Drive, Round Rock, TX 78681',
  },
  items: [
    { description: 'Driveway and walkway pressure washing', quantity: 1840, unit: 'sq ft', unitPrice: 0.22 },
    { description: 'Back patio cleaning', quantity: 920, unit: 'sq ft', unitPrice: 0.25 },
    { description: 'Rust stain treatment', quantity: 3, unit: 'ea', unitPrice: 45 },
  ],
  taxPercent: 8.25,
  amountPaid: 200,
  paymentInstructions: 'Zelle: (512) 555-0143\nCheck payable to Lone Star Exterior Care\nCard payments accepted by phone',
  notes: 'Thank you for your business! A late fee may apply to balances unpaid after the due date.',
};
