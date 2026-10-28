import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  calculateSimpleInvoiceTotals,
  type SimpleInvoice,
} from '../../../core/QuoteTempletes/simpleInvoice';

type Props = {
  invoice: SimpleInvoice;
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function InvoiceDocument({ invoice }: Props) {
  const totals = calculateSimpleInvoiceTotals(invoice);

  return (
    <View style={styles.document}>
      <View style={styles.banner}>
        <View style={styles.bannerCopy}>
          <Text style={styles.businessName}>{invoice.business.name}</Text>
          {!!invoice.business.phone && (
            <Text style={styles.bannerDetail}>{invoice.business.phone}</Text>
          )}
          {!!invoice.business.email && (
            <Text style={styles.bannerDetail}>{invoice.business.email}</Text>
          )}
          {!!invoice.business.address && (
            <Text style={styles.bannerDetail}>{invoice.business.address}</Text>
          )}
        </View>
        <Text style={styles.documentTitle}>INVOICE</Text>
      </View>

      <View style={styles.meta}>
        <View style={styles.customer}>
          <Text style={styles.label}>BILL TO</Text>
          <Text style={styles.valueStrong}>{invoice.customer.name}</Text>
          <Text style={styles.value}>{invoice.customer.address}</Text>
          {!!invoice.customer.phone && (
            <Text style={styles.value}>{invoice.customer.phone}</Text>
          )}
          {!!invoice.customer.email && (
            <Text style={styles.value}>{invoice.customer.email}</Text>
          )}
          {!!invoice.serviceAddress && (
            <View style={styles.serviceAddress}>
              <Text style={styles.label}>SERVICE ADDRESS</Text>
              <Text style={styles.value}>{invoice.serviceAddress}</Text>
            </View>
          )}
        </View>
        <View style={styles.invoiceMeta}>
          <Detail label="Invoice #" value={invoice.number} />
          <Detail label="Invoice date" value={invoice.date} />
          <Detail label="Due date" value={invoice.dueDate} />
          <Detail label="Service date" value={invoice.serviceDate} />
          <Detail label="Quote #" value={invoice.quoteNumber} />
        </View>
      </View>

      <View style={styles.items}>
        <View style={[styles.itemRow, styles.itemHeader]}>
          <Text style={[styles.itemHeading, styles.qty]}>QTY</Text>
          <Text style={[styles.itemHeading, styles.description]}>DESCRIPTION</Text>
          <Text style={[styles.itemHeading, styles.price]}>PRICE</Text>
          <Text style={[styles.itemHeading, styles.amount]}>AMOUNT</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={`${item.description}-${index}`} style={styles.itemRow}>
            <Text style={[styles.itemText, styles.qty]}>
              {item.quantity.toLocaleString()} {item.unit}
            </Text>
            <Text style={[styles.itemText, styles.description]}>{item.description}</Text>
            <Text style={[styles.itemText, styles.price]}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={[styles.itemText, styles.amount]}>
              {formatCurrency(totals.itemTotals[index] ?? 0)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
        </View>
        {totals.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>-{formatCurrency(totals.discount)}</Text>
          </View>
        )}
        {totals.tax > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sales tax ({invoice.taxPercent}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.tax)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.invoiceTotal]}>
          <Text style={styles.totalStrong}>Total</Text>
          <Text style={styles.totalStrong}>{formatCurrency(totals.total)}</Text>
        </View>
        {totals.paid > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount paid</Text>
            <Text style={styles.totalValue}>-{formatCurrency(totals.paid)}</Text>
          </View>
        )}
        <View style={styles.balance}>
          <Text style={styles.balanceLabel}>
            {totals.balance <= 0 ? 'PAID IN FULL' : 'BALANCE DUE'}
          </Text>
          <Text style={styles.balanceAmount}>{formatCurrency(Math.max(0, totals.balance))}</Text>
        </View>
      </View>

      {!!invoice.paymentInstructions && (
        <View style={styles.notes}>
          <Text style={styles.label}>PAYMENT INFORMATION</Text>
          <Text style={styles.value}>{invoice.paymentInstructions}</Text>
        </View>
      )}
      {!!invoice.notes && (
        <View style={styles.notes}>
          <Text style={styles.label}>NOTES</Text>
          <Text style={styles.value}>{invoice.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  document: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7EF',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#3B6CB4',
  },
  bannerCopy: {
    flex: 1,
    gap: 3,
  },
  businessName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  bannerDetail: {
    color: '#E9F1FF',
    fontSize: 11,
  },
  documentTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  customer: {
    flex: 1,
    gap: 4,
  },
  invoiceMeta: {
    width: '42%',
    gap: 8,
  },
  detail: {
    gap: 2,
  },
  label: {
    color: '#758398',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  valueStrong: {
    color: '#1C2A3D',
    fontSize: 13,
    fontWeight: '800',
  },
  value: {
    color: '#526276',
    fontSize: 12,
    lineHeight: 17,
  },
  serviceAddress: {
    gap: 3,
    marginTop: 8,
  },
  items: {
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDE4ED',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDE4ED',
  },
  itemHeader: {
    backgroundColor: '#F1F4F8',
  },
  itemHeading: {
    color: '#526276',
    fontSize: 9,
    fontWeight: '800',
  },
  itemText: {
    color: '#27364A',
    fontSize: 10,
  },
  qty: {
    width: '22%',
  },
  description: {
    flex: 1,
    paddingRight: 4,
  },
  price: {
    width: '20%',
    textAlign: 'right',
  },
  amount: {
    width: '22%',
    textAlign: 'right',
  },
  totals: {
    alignSelf: 'stretch',
    gap: 7,
    padding: 16,
    paddingLeft: '32%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  totalLabel: {
    color: '#667587',
    fontSize: 12,
  },
  totalValue: {
    color: '#27364A',
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceTotal: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CDD5E0',
  },
  totalStrong: {
    color: '#1C2A3D',
    fontSize: 13,
    fontWeight: '800',
  },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    padding: 11,
    borderRadius: 8,
    backgroundColor: '#F1F4F8',
  },
  balanceLabel: {
    flex: 1,
    color: '#173F78',
    fontSize: 11,
    fontWeight: '800',
  },
  balanceAmount: {
    color: '#173F78',
    fontSize: 15,
    fontWeight: '900',
  },
  notes: {
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
});
