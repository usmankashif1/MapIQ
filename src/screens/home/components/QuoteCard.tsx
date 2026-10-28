import React, { memo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { renderSimpleQuote, type SimpleQuote } from '../../../core/QuoteTempletes/simpleQuote';
import { useAppDispatch } from '../../../store/hooks';
import { replaceQuotes } from '../../../store/slices/quotesSlice';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { saveQuote } from '../utils/quoteStorage';

export type QuoteRecord = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  size: string;
  amount: string;
  status: 'Accepted' | 'Rejected' | 'Not responded';
  initials: string;
  avatarColor: string;
  areaSqFt?: number;
  jobType?: string;
  ratePerSqFt?: number;
  subtotal?: number;
  adjustment?: number;
  total?: number;
  createdAt?: string;
};

type Props = {
  quote: QuoteRecord;
};

const statuses: QuoteRecord['status'][] = ['Accepted', 'Rejected', 'Not responded'];

function getQuoteNumber(quote: QuoteRecord) {
  return quote.id.slice(-4).padStart(4, '0');
}

function createSimpleQuote(quote: QuoteRecord): SimpleQuote {
  return {
    business: { name: 'MapIQ', phone: '' },
    number: `EST-${getQuoteNumber(quote)}`,
    date: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    customer: {
      name: quote.name,
      address: quote.address,
      phone: quote.phone,
      email: quote.email,
    },
    areaSqFt: quote.areaSqFt ?? 0,
    description: quote.jobType,
    items: [{
      description: quote.jobType || 'Service',
      quantity: quote.areaSqFt ?? 0,
      unit: 'sq ft',
      unitPrice: quote.ratePerSqFt ?? 0,
    }],
    adjustment: quote.adjustment
      ? { label: quote.adjustment < 0 ? 'Discount' : 'Tax / Fee', amount: quote.adjustment }
      : undefined,
  };
}

async function createPdf(quote: QuoteRecord): Promise<{ uri: string; webBlob?: Blob }> {
  const html = renderSimpleQuote(createSimpleQuote(quote));
  if (Platform.OS === 'web') {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:612px;height:792px;border:0';
    document.body.appendChild(iframe);
    try {
      const documentFrame = iframe.contentDocument;
      if (!documentFrame) throw new Error('Could not create the quote PDF document.');
      documentFrame.open();
      documentFrame.write(html);
      documentFrame.close();
      await documentFrame.fonts.ready;
      const canvas = await html2canvas(documentFrame.body, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 612,
        height: 792,
        windowWidth: 612,
        windowHeight: 792,
        useCORS: true,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 612, 792);
      const webBlob = pdf.output('blob');
      return { uri: URL.createObjectURL(webBlob), webBlob };
    } finally {
      iframe.remove();
    }
  }

  const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
  return { uri };
}

function QuoteCard({ quote }: Props) {
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusStyle = quote.status === 'Accepted'
    ? styles.accepted
    : quote.status === 'Rejected'
      ? styles.rejected
      : styles.notResponded;

  const updateStatus = async (status: QuoteRecord['status']) => {
    try {
      const updatedQuotes = await saveQuote({ ...quote, status });
      dispatch(replaceQuotes(updatedQuotes));
      setStatusMenuOpen(false);
      showSuccessToast('Quote status updated', status);
    } catch (error) {
      showErrorToast('Unable to update status', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const shareQuote = async () => {
    setIsSharing(true);
    try {
      const pdf = await createPdf(quote);
      if (Platform.OS === 'web') {
        const navigatorWithShare = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { title: string; files: File[] }) => Promise<void>;
        };
        const file = new File([pdf.webBlob!], `Quote-${getQuoteNumber(quote)}.pdf`, { type: 'application/pdf' });
        if (typeof navigatorWithShare.share === 'function' && (!navigatorWithShare.canShare || navigatorWithShare.canShare({ files: [file] }))) {
          await navigatorWithShare.share({ title: `Quote #${getQuoteNumber(quote)}`, files: [file] });
        } else {
          const link = document.createElement('a');
          link.href = pdf.uri;
          link.download = file.name;
          link.click();
        }
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        showErrorToast('Sharing unavailable', 'This device cannot share the quote PDF.');
        return;
      }
      await Sharing.shareAsync(pdf.uri, {
        dialogTitle: `Share Quote #${getQuoteNumber(quote)}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      showErrorToast('Unable to share quote', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open quote ${getQuoteNumber(quote)} preview`}
      onPress={() => setVisible(true)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.personRow}>
        <View style={[styles.avatar, { backgroundColor: quote.avatarColor }]}>
          <Text style={styles.avatarText}>{quote.initials}</Text>
        </View>
        <View style={styles.personCopy}>
          <Text style={styles.name}>{quote.name}</Text>
          <Text style={styles.address}>{quote.address}</Text>
        </View>
      </View>
      <Text style={styles.quoteDetails}>
        Size: {quote.size} <Text style={styles.dot}>·</Text> {quote.amount}
      </Text>
      <View style={styles.statusRow}>
        <Text style={[styles.status, statusStyle]}>{quote.status}</Text>
        <Text style={styles.quoteLabel}>Quote #{quote.id.slice(-4).padStart(4, '0')}</Text>
      </View>
    </Pressable>

    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quote #{getQuoteNumber(quote)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close quote preview" onPress={() => setVisible(false)}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <View style={styles.previewDocument}>
            <View style={styles.previewBar}>
              <Text style={styles.previewBusiness}>MapIQ</Text>
              <Text style={styles.previewQuoteTitle}>QUOTE</Text>
            </View>
            <View style={styles.previewBody}>
              <Text style={styles.previewLabel}>For</Text>
              <Text style={styles.previewValue}>{quote.name}</Text>
              <Text style={styles.previewValue}>{quote.address}</Text>
              {quote.phone ? <Text style={styles.previewValue}>{quote.phone}</Text> : null}
              {quote.email ? <Text style={styles.previewValue}>{quote.email}</Text> : null}
              {quote.jobType ? <Text style={styles.previewService}>{quote.jobType}</Text> : null}
              <Text style={styles.previewArea}>{(quote.areaSqFt ?? 0).toLocaleString()} sq ft</Text>
              <View style={styles.previewTotal}>
                <Text style={styles.previewTotalLabel}>TOTAL</Text>
                <Text style={styles.previewTotalValue}>${(quote.total ?? 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSharing}
            onPress={shareQuote}
            style={({ pressed }) => [styles.shareButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.shareButtonText}>{isSharing ? 'Preparing PDF…' : 'Share PDF'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setStatusMenuOpen(open => !open)}
            style={({ pressed }) => [styles.statusButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.statusButtonText}>Update Status</Text>
          </Pressable>

          {statusMenuOpen ? (
            <View style={styles.statusOptions}>
              {statuses.map(status => (
                <Pressable
                  key={status}
                  accessibilityRole="button"
                  onPress={() => updateStatus(status)}
                  style={({ pressed }) => [styles.statusOption, status === quote.status && styles.statusOptionCurrent, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.statusOptionText}>{status}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

export default memo(QuoteCard);

const styles = StyleSheet.create({
  cardPressed: { opacity: 0.8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9EEF4',
    shadowColor: '#17324D',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#33445B',
    fontSize: 12,
    fontWeight: '800',
  },
  personCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#1C2A3D',
    fontSize: 15,
    fontWeight: '700',
  },
  address: {
    color: '#6C7888',
    fontSize: 12,
    marginTop: 2,
  },
  quoteDetails: {
    color: '#3C4858',
    fontSize: 13,
    marginTop: 11,
  },
  dot: {
    color: '#A0AAB6',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  status: {
    overflow: 'hidden',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  accepted: { backgroundColor: '#16A765' },
  rejected: { backgroundColor: '#D84A4A' },
  notResponded: { backgroundColor: '#1686E8' },
  quoteLabel: {
    color: '#8A96A5',
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 27, 43, 0.55)',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '92%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#173F78',
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    color: '#596579',
    fontSize: 28,
    lineHeight: 28,
  },
  previewDocument: {
    borderWidth: 1,
    borderColor: '#DDE2E9',
  },
  previewBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#3B6CB4',
  },
  previewBusiness: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  previewQuoteTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  previewBody: { padding: 13 },
  previewLabel: { color: '#252B35', fontSize: 11, fontWeight: '700', marginBottom: 3 },
  previewValue: { color: '#252B35', fontSize: 10, lineHeight: 14 },
  previewService: { color: '#252B35', fontSize: 11, marginTop: 15 },
  previewArea: { color: '#555555', fontSize: 10, marginTop: 4 },
  previewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginTop: 14,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  previewTotalLabel: { color: '#252B35', fontSize: 11, fontWeight: '700' },
  previewTotalValue: { color: '#252B35', fontSize: 13, fontWeight: '700' },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1686E8',
    marginTop: 14,
  },
  shareButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  statusButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1686E8',
    marginTop: 10,
  },
  statusButtonText: { color: '#1686E8', fontSize: 15, fontWeight: '700' },
  statusOptions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  statusOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5DF',
    paddingVertical: 9,
  },
  statusOptionCurrent: { backgroundColor: '#EAF3FF', borderColor: '#1686E8' },
  statusOptionText: { color: '#304258', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  buttonPressed: { opacity: 0.75 },
});
