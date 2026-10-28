import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BusinessIcon from '../components/BusinessIcon';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { showErrorToast, showInfoToast } from '../../../core/utils/toast';
import type { QuoteRecord } from '../components/QuoteCard';
import { saveQuote } from '../utils/quoteStorage';
import { useAppDispatch } from '../../../store/hooks';
import { replaceQuotes } from '../../../store/slices/quotesSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'CreateQuote'>;

function parseAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function sanitizeAmount(value: string, allowNegative = false): string {
  const filtered = value.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
  const sign = allowNegative && filtered.startsWith('-') ? '-' : '';
  const unsigned = filtered.replace(/-/g, '');
  const [whole, ...fraction] = unsigned.split('.');
  return `${sign}${whole}${fraction.length ? `.${fraction.join('')}` : ''}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CreateQuoteScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const areaSqFt = Math.max(0, Math.round(route.params.areaSqFt));
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobType, setJobType] = useState('');
  const [rate, setRate] = useState('');
  const [taxOrDiscount, setTaxOrDiscount] = useState('0');

  const { subtotal, total } = useMemo(() => {
    const jobSubtotal = areaSqFt * Math.max(0, parseAmount(rate));
    const adjustment = parseAmount(taxOrDiscount);
    return {
      subtotal: jobSubtotal,
      total: Math.max(0, jobSubtotal + adjustment),
    };
  }, [areaSqFt, rate, taxOrDiscount]);

  const handleCreatePreview = async () => {
    if (!clientName.trim() || !address.trim() || !jobType.trim()) {
      showInfoToast('Quote details needed', 'Enter the client name, address, and service.');
      return;
    }

    if (parseAmount(rate) <= 0) {
      showInfoToast('Enter a valid rate', 'The rate per square foot must be greater than zero.');
      return;
    }

    const now = Date.now();
    const quote: QuoteRecord = {
      id: String(now),
      name: clientName.trim(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      size: `${areaSqFt.toLocaleString()} Sq Ft`,
      amount: formatCurrency(total),
      status: 'Not responded',
      initials: clientName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
      avatarColor: '#DCEBFF',
      areaSqFt,
      jobType,
      ratePerSqFt: Math.max(0, parseAmount(rate)),
      subtotal,
      adjustment: parseAmount(taxOrDiscount),
      total,
      createdAt: new Date(now).toISOString(),
    };

    try {
      const savedQuotes = await saveQuote(quote);
      dispatch(replaceQuotes(savedQuotes));
      navigation.navigate('QuotePreview', { quote, mode: 'created' });
    } catch (error) {
      showErrorToast('Unable to save quote', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={navigation.goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <BusinessIcon name="back" color="#FFFFFF" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Quote</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CLIENT &amp; ADDRESS</Text>
            <TextInput
              accessibilityLabel="Client name"
              autoCapitalize="words"
              onChangeText={setClientName}
              placeholder="Client name"
              placeholderTextColor="#8793A3"
              style={styles.textField}
              value={clientName}
            />
            <TextInput
              accessibilityLabel="Property address"
              autoCapitalize="words"
              onChangeText={setAddress}
              placeholder="Property address"
              placeholderTextColor="#8793A3"
              style={styles.textField}
              value={address}
            />
            <TextInput
              accessibilityLabel="Customer phone number"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="Customer phone number (optional)"
              placeholderTextColor="#8793A3"
              style={styles.textField}
              value={phone}
            />
            <TextInput
              accessibilityLabel="Customer email"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Customer email (optional)"
              placeholderTextColor="#8793A3"
              style={styles.textField}
              value={email}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>MEASUREMENT &amp; JOB DETAILS</Text>
            <View style={styles.areaRow}>
              <BusinessIcon name="lock" color="#596579" size={21} />
              <Text style={styles.areaText}>
                Measured Area: {areaSqFt.toLocaleString()} Sq Ft
              </Text>
              <View style={styles.mapIcon}>
                <BusinessIcon name="map" color="#1686E8" size={21} />
              </View>
            </View>

            <TextInput
              accessibilityLabel="Job or service"
              onChangeText={setJobType}
              placeholder="Job or service"
              placeholderTextColor="#8793A3"
              style={styles.textField}
              value={jobType}
            />

            <View style={styles.rateRow}>
              <Text style={styles.rowLabel}>Rate per Sq Ft:</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  accessibilityLabel="Rate per square foot"
                  keyboardType="decimal-pad"
                  onChangeText={value => setRate(sanitizeAmount(value))}
                  style={styles.amountInput}
                  value={rate}
                />
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.rowLabel}>Total Job Cost:</Text>
              <Text style={styles.subtotal}>{formatCurrency(subtotal)}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.adjustmentRow}>
              <Text style={styles.rowLabel}>Tax/Discount:</Text>
              <View style={styles.adjustmentInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  accessibilityLabel="Tax or discount amount; use a negative value for a discount"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={value => setTaxOrDiscount(sanitizeAmount(value, true))}
                  style={styles.adjustmentTextInput}
                  value={taxOrDiscount}
                />
              </View>
            </View>
            <Text style={styles.quoteTotal}>Total Quote: {formatCurrency(total)}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleCreatePreview}
              style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
            >
              <Text style={styles.previewButtonText}>Create &amp; Preview PDF</Text>
              <BusinessIcon name="chevron" color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default CreateQuoteScreen;

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
    paddingBottom: 26,
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
    gap: 10,
    shadowColor: '#15263B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    color: '#304258',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.35,
    marginBottom: 2,
  },
  textField: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#AAB3C1',
    borderRadius: 11,
    paddingHorizontal: 12,
    color: '#202B3A',
    fontSize: 16,
  },
  areaRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaText: {
    flex: 1,
    color: '#27364A',
    fontSize: 16,
    fontWeight: '600',
  },
  mapIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#EAF3FF',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  rowLabel: {
    flex: 1,
    color: '#27364A',
    fontSize: 15,
  },
  currencyInput: {
    width: '52%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#AAB3C1',
    borderRadius: 11,
  },
  currencySymbol: {
    color: '#27364A',
    fontSize: 16,
  },
  amountInput: {
    flex: 1,
    color: '#202B3A',
    fontSize: 16,
    paddingVertical: 8,
  },
  totalRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  subtotal: {
    color: '#132846',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
    gap: 12,
    shadowColor: '#15263B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  adjustmentInput: {
    width: '40%',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  adjustmentTextInput: {
    minWidth: 64,
    color: '#202B3A',
    fontSize: 16,
    textAlign: 'right',
  },
  quoteTotal: {
    color: '#173F78',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  previewButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#F56600',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
