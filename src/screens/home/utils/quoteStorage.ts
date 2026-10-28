import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QuoteRecord } from '../components/QuoteCard';

const QUOTES_STORAGE_KEY = '@mapiq/saved-quotes';

function isQuoteRecord(value: unknown): value is QuoteRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const quote = value as Record<string, unknown>;
  return (
    typeof quote.id === 'string' &&
    typeof quote.name === 'string' &&
    typeof quote.address === 'string' &&
    (quote.phone === undefined || typeof quote.phone === 'string') &&
    (quote.email === undefined || typeof quote.email === 'string') &&
    typeof quote.size === 'string' &&
    typeof quote.amount === 'string' &&
    typeof quote.initials === 'string' &&
    typeof quote.avatarColor === 'string' &&
    (quote.status === 'Accepted' || quote.status === 'Rejected' || quote.status === 'Not responded') &&
    (quote.areaSqFt === undefined || typeof quote.areaSqFt === 'number') &&
    (quote.ratePerSqFt === undefined || typeof quote.ratePerSqFt === 'number') &&
    (quote.subtotal === undefined || typeof quote.subtotal === 'number') &&
    (quote.adjustment === undefined || typeof quote.adjustment === 'number') &&
    (quote.total === undefined || typeof quote.total === 'number') &&
    (quote.jobType === undefined || typeof quote.jobType === 'string') &&
    (quote.createdAt === undefined || typeof quote.createdAt === 'string')
  );
}

export async function getSavedQuotes(): Promise<QuoteRecord[]> {
  const storedValue = await AsyncStorage.getItem(QUOTES_STORAGE_KEY);
  if (storedValue === null) {
    return [];
  }

  const parsedValue: unknown = JSON.parse(storedValue);
  if (!Array.isArray(parsedValue) || !parsedValue.every(isQuoteRecord)) {
    throw new Error('Saved quote data is invalid.');
  }

  return parsedValue;
}

export async function saveQuote(quote: QuoteRecord): Promise<QuoteRecord[]> {
  const currentQuotes = await getSavedQuotes();
  const updatedQuotes = [quote, ...currentQuotes.filter(savedQuote => savedQuote.id !== quote.id)];
  await AsyncStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(updatedQuotes));
  return updatedQuotes;
}
