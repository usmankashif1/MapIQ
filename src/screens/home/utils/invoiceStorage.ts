import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SimpleInvoice } from '../../../core/QuoteTempletes/simpleInvoice';

export type InvoiceRecord = SimpleInvoice & {
  id: string;
  createdAt: string;
  status?: InvoiceStatus;
};

export type InvoiceStatus = 'Unpaid' | 'Partially paid' | 'Paid' | 'Overdue';

const INVOICES_STORAGE_KEY = '@mapiq/saved-invoices';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInvoiceRecord(value: unknown): value is InvoiceRecord {
  if (!isObjectRecord(value)) {
    return false;
  }

  const business = value.business;
  const customer = value.customer;
  const isOptionalString = (record: Record<string, unknown>, key: string) =>
    record[key] === undefined || typeof record[key] === 'string';
  const isOptionalAmount = (key: string, maximum = Number.POSITIVE_INFINITY) =>
    value[key] === undefined ||
    (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= maximum);

  return (
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.status === undefined ||
      value.status === 'Unpaid' ||
      value.status === 'Partially paid' ||
      value.status === 'Paid' ||
      value.status === 'Overdue') &&
    typeof value.number === 'string' &&
    typeof value.date === 'string' &&
    typeof value.dueDate === 'string' &&
    isObjectRecord(business) &&
    typeof business.name === 'string' &&
    typeof business.phone === 'string' &&
    isOptionalString(business, 'email') &&
    isOptionalString(business, 'address') &&
    isOptionalString(business, 'logoUrl') &&
    isObjectRecord(customer) &&
    typeof customer.name === 'string' &&
    typeof customer.address === 'string' &&
    (customer.phone === undefined || typeof customer.phone === 'string') &&
    (customer.email === undefined || typeof customer.email === 'string') &&
    Array.isArray(value.items) &&
    value.items.every(item =>
      isObjectRecord(item) &&
      typeof item.description === 'string' &&
      typeof item.quantity === 'number' &&
      Number.isFinite(item.quantity) &&
      item.quantity > 0 &&
      typeof item.unit === 'string' &&
      typeof item.unitPrice === 'number' &&
      Number.isFinite(item.unitPrice) &&
      item.unitPrice >= 0,
    ) &&
    isOptionalAmount('discountAmount') &&
    isOptionalAmount('taxPercent', 100) &&
    isOptionalAmount('amountPaid') &&
    isOptionalString(value, 'serviceDate') &&
    isOptionalString(value, 'quoteNumber') &&
    isOptionalString(value, 'serviceAddress') &&
    isOptionalString(value, 'paymentInstructions') &&
    isOptionalString(value, 'notes')
  );
}

export async function getSavedInvoices(): Promise<InvoiceRecord[]> {
  const storedValue = await AsyncStorage.getItem(INVOICES_STORAGE_KEY);
  if (storedValue === null) {
    return [];
  }

  const parsedValue: unknown = JSON.parse(storedValue);
  if (!Array.isArray(parsedValue) || !parsedValue.every(isInvoiceRecord)) {
    throw new Error('Saved invoice data is invalid.');
  }

  return parsedValue;
}

export async function saveInvoice(invoice: InvoiceRecord): Promise<InvoiceRecord[]> {
  const savedInvoices = await getSavedInvoices();
  const updatedInvoices = [
    invoice,
    ...savedInvoices.filter(savedInvoice => savedInvoice.id !== invoice.id),
  ];
  await AsyncStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(updatedInvoices));
  return updatedInvoices;
}
