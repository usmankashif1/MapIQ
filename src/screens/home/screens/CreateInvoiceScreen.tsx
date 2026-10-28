import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  calculateSimpleInvoiceTotals,
  type SimpleInvoice,
} from '../../../core/QuoteTempletes/simpleInvoice';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../../core/utils/toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { replaceInvoices } from '../../../store/slices/invoicesSlice';
import BusinessIcon from '../components/BusinessIcon';
import InvoiceLineItemEditor, {
  type InvoiceLineItemDraft,
} from '../components/InvoiceLineItemEditor';
import { InvoiceFormField, InvoiceFormSection } from '../components/InvoiceFormField';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { saveInvoice, type InvoiceRecord } from '../utils/invoiceStorage';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateInvoice'>;
type ParsedInvoiceItem = {
  description: string;
  unit: string;
  quantity: number | null;
  unitPrice: number | null;
  index: number;
};
type ReadyInvoiceItem = Omit<ParsedInvoiceItem, 'quantity' | 'unitPrice'> & {
  quantity: number;
  unitPrice: number;
};

const MAX_INVOICE_ITEMS = 30;
const MAX_AMOUNT = 999_999_999.99;

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

function isValidInvoiceDate(value: string): boolean {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return false;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1000 || year > 9999) return false;

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

function createInvoiceNumber(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

function sanitizeDecimal(value: string, maximumDecimals = 2): string {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...fractionParts] = normalized.split('.');
  const fraction = fractionParts.join('').slice(0, maximumDecimals);
  const limitedWhole = whole.replace(/^0+(?=\d)/, '').slice(0, 9);
  return normalized.includes('.') ? `${limitedWhole}.${fraction}` : limitedWhole;
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function emptyLineItem(): InvoiceLineItemDraft {
  return { description: '', quantity: '1', unit: 'each', unitPrice: '' };
}

function getEmailError(value: string, label: string): string | null {
  if (!value.trim()) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : `Enter a valid ${label} email address.`;
}

function hasValidAmounts(item: ParsedInvoiceItem): item is ReadyInvoiceItem {
  return item.quantity !== null && item.unitPrice !== null;
}

function CreateInvoiceScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const savedInvoices = useAppSelector(state => state.invoices.items);
  const [businessName, setBusinessName] = useState('MapIQ');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(createInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(() => formatDate(new Date()));
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return formatDate(date);
  });
  const [serviceDate, setServiceDate] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [items, setItems] = useState<InvoiceLineItemDraft[]>([emptyLineItem()]);
  const [discountAmount, setDiscountAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const completeItems: ParsedInvoiceItem[] = items.flatMap((item, index) => {
    const description = item.description.trim();
    const unit = item.unit.trim();
    const quantity = parseAmount(item.quantity);
    const unitPrice = parseAmount(item.unitPrice);
    const isBlank = !description && !unit && !item.quantity.trim() && !item.unitPrice.trim();

    if (isBlank) return [];
    return [{ description, unit, quantity, unitPrice, index }];
  });

  const invoiceForCalculation: SimpleInvoice = {
    business: { name: businessName.trim(), phone: businessPhone.trim() },
    number: invoiceNumber.trim(),
    date: invoiceDate.trim(),
    dueDate: dueDate.trim(),
    customer: { name: customerName.trim(), address: billingAddress.trim() },
    items: completeItems.filter(hasValidAmounts).map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
    })),
    discountAmount: parseAmount(discountAmount) ?? 0,
    taxPercent: parseAmount(taxPercent) ?? 0,
    amountPaid: parseAmount(amountPaid) ?? 0,
  };
  const totals = calculateSimpleInvoiceTotals(invoiceForCalculation);

  const updateItem = (index: number, item: InvoiceLineItemDraft) => {
    setItems(current => current.map((existing, itemIndex) => itemIndex === index ? item : existing));
  };

  const validate = (): string | null => {
    if (!businessName.trim()) return 'Enter your business name.';
    if (!invoiceNumber.trim()) return 'Enter an invoice number.';
    if (!invoiceDate.trim()) return 'Enter the invoice date.';
    if (!dueDate.trim()) return 'Enter a due date or enter "Due on receipt".';
    if (!isValidInvoiceDate(invoiceDate)) return 'Enter the invoice date as MM/DD/YYYY.';
    if (dueDate.trim().toLowerCase() !== 'due on receipt' && !isValidInvoiceDate(dueDate)) {
      return 'Enter the due date as MM/DD/YYYY or use "Due on receipt".';
    }
    if (serviceDate.trim() && !isValidInvoiceDate(serviceDate)) {
      return 'Enter the service date as MM/DD/YYYY.';
    }
    if (!customerName.trim()) return 'Enter the customer name.';
    if (!billingAddress.trim()) return 'Enter the customer billing address.';

    const duplicateNumber = savedInvoices.some(invoice =>
      invoice.number.trim().toLowerCase() === invoiceNumber.trim().toLowerCase(),
    );
    if (duplicateNumber) return 'That invoice number is already in use.';

    const emailError = getEmailError(businessEmail, 'business') ?? getEmailError(customerEmail, 'customer');
    if (emailError) return emailError;

    if (completeItems.length === 0) return 'Add at least one invoice item.';
    for (const item of completeItems) {
      if (!item.description || !item.unit) {
        return `Complete the description and unit for item ${item.index + 1}.`;
      }
      if (item.quantity === null || item.quantity <= 0 || item.quantity > MAX_AMOUNT) {
        return `Enter a quantity greater than 0 and no more than ${MAX_AMOUNT.toLocaleString()} for item ${item.index + 1}.`;
      }
      if (item.unitPrice === null || item.unitPrice < 0 || item.unitPrice > MAX_AMOUNT) {
        return `Enter a unit price from 0 to ${MAX_AMOUNT.toLocaleString()} for item ${item.index + 1}.`;
      }
      if (!Number.isFinite(item.quantity * item.unitPrice)) {
        return `The amount for item ${item.index + 1} is too large.`;
      }
    }

    const discount = parseAmount(discountAmount);
    if (discountAmount.trim() && (discount === null || discount < 0 || discount > totals.subtotal)) {
      return 'Discount must be zero or more and cannot exceed the subtotal.';
    }
    const tax = parseAmount(taxPercent);
    if (taxPercent.trim() && (tax === null || tax < 0 || tax > 100)) {
      return 'Tax must be between 0% and 100%.';
    }
    const paid = parseAmount(amountPaid);
    if (amountPaid.trim() && (paid === null || paid < 0 || paid > totals.total)) {
      return 'Amount paid must be zero or less than or equal to the invoice total.';
    }
    if (totals.total > MAX_AMOUNT) return 'The invoice total is too large.';
    return null;
  };

  const handleSave = async () => {
    if (isSaving) return;
    const validationError = validate();
    if (validationError) {
      showInfoToast('Check invoice details', validationError);
      return;
    }

    const readyItems = completeItems.filter(hasValidAmounts);
    if (readyItems.length !== completeItems.length || readyItems.length === 0) {
      showInfoToast('Check invoice items', 'Add a description, quantity, unit, and unit price for each item.');
      return;
    }

    const now = new Date();
    const invoice: InvoiceRecord = {
      id: `${now.getTime()}-${invoiceNumber.trim().toLowerCase()}`,
      createdAt: now.toISOString(),
      status: totals.total <= totals.paid
        ? 'Paid'
        : totals.paid > 0
          ? 'Partially paid'
          : 'Unpaid',
      business: {
        name: businessName.trim(),
        phone: businessPhone.trim(),
        email: businessEmail.trim() || undefined,
        address: businessAddress.trim() || undefined,
      },
      number: invoiceNumber.trim(),
      date: invoiceDate.trim(),
      dueDate: dueDate.trim(),
      serviceDate: serviceDate.trim() || undefined,
      quoteNumber: quoteNumber.trim() || undefined,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim() || undefined,
        email: customerEmail.trim() || undefined,
        address: billingAddress.trim(),
      },
      serviceAddress: serviceAddress.trim() && serviceAddress.trim() !== billingAddress.trim()
        ? serviceAddress.trim()
        : undefined,
      items: readyItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      })),
      discountAmount: parseAmount(discountAmount) || undefined,
      taxPercent: parseAmount(taxPercent) || undefined,
      amountPaid: parseAmount(amountPaid) || undefined,
      paymentInstructions: paymentInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);
    try {
      dispatch(replaceInvoices(await saveInvoice(invoice)));
      showSuccessToast('Invoice created', `${invoice.number} is ready to preview and share.`);
      navigation.replace('InvoicePreview', { invoice });
    } catch (error) {
      showErrorToast(
        'Unable to save invoice',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={navigation.goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <BusinessIcon name="back" color="#FFFFFF" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Invoice</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <InvoiceFormSection title="YOUR BUSINESS">
            <InvoiceFormField
              label="Business name"
              maxLength={100}
              onChangeText={setBusinessName}
              value={businessName}
            />
            <InvoiceFormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Business email"
              maxLength={254}
              onChangeText={setBusinessEmail}
              optional
              value={businessEmail}
            />
            <InvoiceFormField
              keyboardType="phone-pad"
              label="Business phone"
              maxLength={40}
              onChangeText={setBusinessPhone}
              optional
              value={businessPhone}
            />
            <InvoiceFormField
              label="Business address"
              maxLength={250}
              onChangeText={setBusinessAddress}
              optional
              value={businessAddress}
            />
          </InvoiceFormSection>

          <InvoiceFormSection title="INVOICE DETAILS">
            <InvoiceFormField
              label="Invoice number"
              maxLength={40}
              onChangeText={setInvoiceNumber}
              value={invoiceNumber}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <InvoiceFormField
                  label="Invoice date"
                  maxLength={20}
                  onChangeText={setInvoiceDate}
                  placeholder="MM/DD/YYYY"
                  value={invoiceDate}
                />
              </View>
              <View style={styles.half}>
                <InvoiceFormField
                  label="Due date"
                  maxLength={40}
                  onChangeText={setDueDate}
                  placeholder="MM/DD/YYYY or Due on receipt"
                  value={dueDate}
                />
              </View>
            </View>
            <InvoiceFormField
              label="Service date"
              maxLength={20}
              onChangeText={setServiceDate}
              optional
              placeholder="MM/DD/YYYY"
              value={serviceDate}
            />
            <InvoiceFormField
              label="Related quote number"
              maxLength={40}
              onChangeText={setQuoteNumber}
              optional
              value={quoteNumber}
            />
          </InvoiceFormSection>

          <InvoiceFormSection title="CUSTOMER">
            <InvoiceFormField
              label="Customer name"
              maxLength={100}
              onChangeText={setCustomerName}
              value={customerName}
            />
            <InvoiceFormField
              keyboardType="phone-pad"
              label="Customer phone"
              maxLength={40}
              onChangeText={setCustomerPhone}
              optional
              value={customerPhone}
            />
            <InvoiceFormField
              autoCapitalize="none"
              keyboardType="email-address"
              label="Customer email"
              maxLength={254}
              onChangeText={setCustomerEmail}
              optional
              value={customerEmail}
            />
            <InvoiceFormField
              label="Billing address"
              maxLength={250}
              onChangeText={setBillingAddress}
              value={billingAddress}
            />
            <InvoiceFormField
              label="Service address"
              maxLength={250}
              onChangeText={setServiceAddress}
              optional
              value={serviceAddress}
            />
          </InvoiceFormSection>

          <InvoiceFormSection title="ITEMS & PRICING">
            {items.map((item, index) => (
              <InvoiceLineItemEditor
                index={index}
                item={item}
                key={`invoice-item-${index}`}
                onChange={updated => updateItem(index, updated)}
                onRemove={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              disabled={items.length >= MAX_INVOICE_ITEMS}
              onPress={() => setItems(current => [...current, emptyLineItem()])}
              style={({ pressed }) => [
                styles.addItemButton,
                (pressed || items.length >= MAX_INVOICE_ITEMS) && styles.pressed,
              ]}
            >
              <Text style={styles.addItemText}>
                {items.length >= MAX_INVOICE_ITEMS ? 'Maximum items added' : '+ Add another item'}
              </Text>
            </Pressable>
            <View style={styles.row}>
              <View style={styles.half}>
                <InvoiceFormField
                  keyboardType="decimal-pad"
                  label="Discount ($)"
                  onChangeText={value => setDiscountAmount(sanitizeDecimal(value))}
                  optional
                  value={discountAmount}
                />
              </View>
              <View style={styles.half}>
                <InvoiceFormField
                  keyboardType="decimal-pad"
                  label="Tax (%)"
                  onChangeText={value => setTaxPercent(sanitizeDecimal(value))}
                  optional
                  value={taxPercent}
                />
              </View>
            </View>
            <InvoiceFormField
              keyboardType="decimal-pad"
              label="Amount already paid ($)"
              onChangeText={value => setAmountPaid(sanitizeDecimal(value))}
              optional
              value={amountPaid}
            />
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
              </View>
              {totals.discount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <Text style={styles.totalValue}>-{formatCurrency(totals.discount)}</Text>
                </View>
              ) : null}
              {totals.tax > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totals.tax)}</Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>Balance due</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(Math.max(0, totals.total - totals.paid))}
                </Text>
              </View>
            </View>
          </InvoiceFormSection>

          <InvoiceFormSection title="PAYMENT & NOTES">
            <InvoiceFormField
              label="Payment instructions"
              maxLength={1000}
              multiline
              onChangeText={setPaymentInstructions}
              optional
              placeholder="Bank transfer, check, or other payment details"
              value={paymentInstructions}
            />
            <InvoiceFormField
              label="Notes"
              maxLength={1500}
              multiline
              onChangeText={setNotes}
              optional
              placeholder="Additional information for your customer"
              value={notes}
            />
          </InvoiceFormSection>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving invoice…' : 'Save invoice'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default CreateInvoiceScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  screen: {
    flex: 1,
  },
  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#173F78',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  addItemButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#1686E8',
    borderStyle: 'dashed',
  },
  addItemText: {
    color: '#1686E8',
    fontSize: 14,
    fontWeight: '700',
  },
  totalsCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F6F8FC',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    color: '#667587',
    fontSize: 14,
  },
  totalValue: {
    color: '#27364A',
    fontSize: 14,
    fontWeight: '600',
  },
  grandTotal: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D5DDE7',
  },
  grandTotalLabel: {
    color: '#1C2A3D',
    fontSize: 15,
    fontWeight: '800',
  },
  grandTotalValue: {
    color: '#173F78',
    fontSize: 17,
    fontWeight: '800',
  },
  saveButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#16B66B',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
