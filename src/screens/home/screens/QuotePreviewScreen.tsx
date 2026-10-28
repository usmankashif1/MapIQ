import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BusinessIcon from '../components/BusinessIcon';
import type { QuoteRecord } from '../components/QuoteCard';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { showErrorToast, showSuccessToast } from '../../../core/utils/toast';
import { renderSimpleQuote, type SimpleQuote } from '../../../core/QuoteTempletes/simpleQuote';

type Props = NativeStackScreenProps<HomeStackParamList, 'QuotePreview'>;

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getQuoteNumber(quote: QuoteRecord): string {
  return quote.id.slice(-4).padStart(4, '0');
}

function createSimpleQuote(quote: QuoteRecord): SimpleQuote {
  const createdDate = quote.createdAt ? new Date(quote.createdAt) : new Date();
  const areaSqFt = quote.areaSqFt ?? 0;

  return {
    business: {
      name: 'MapIQ',
      phone: '',
    },
    number: `EST-${getQuoteNumber(quote)}`,
    date: Number.isNaN(createdDate.getTime())
      ? new Date().toLocaleDateString()
      : createdDate.toLocaleDateString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
    customer: {
      name: quote.name,
      address: quote.address,
      phone: quote.phone,
      email: quote.email,
    },
    areaSqFt,
    description: quote.jobType,
    items: [{
      description: quote.jobType || 'Service',
      quantity: areaSqFt,
      unit: 'sq ft',
      unitPrice: quote.ratePerSqFt ?? 0,
    }],
    adjustment: quote.adjustment
      ? { label: quote.adjustment < 0 ? 'Discount' : 'Tax / Fee', amount: quote.adjustment }
      : undefined,
  };
}

const PDF_PAGE_OPTIONS = { width: 612, height: 792 } as const;

function QuotePreviewScreen({ navigation, route }: Props) {
  const { quote } = route.params;
  const [isSharing, setIsSharing] = useState(false);
  const [isOpeningPdf, setIsOpeningPdf] = useState(false);
  const simpleQuote = useMemo(() => createSimpleQuote(quote), [quote]);
  const html = useMemo(() => renderSimpleQuote(simpleQuote), [simpleQuote]);

  const createPdf = async (): Promise<{ uri: string; webBlob?: Blob }> => {
    if (Platform.OS === 'web') {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      iframe.style.width = `${PDF_PAGE_OPTIONS.width}px`;
      iframe.style.height = `${PDF_PAGE_OPTIONS.height}px`;
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      try {
        const iframeDocument = iframe.contentDocument;
        if (!iframeDocument) {
          throw new Error('Could not create the quote PDF document.');
        }
        iframeDocument.open();
        iframeDocument.write(html);
        iframeDocument.close();
        await iframeDocument.fonts.ready;

        const canvas = await html2canvas(iframeDocument.body, {
          backgroundColor: '#ffffff',
          scale: 2,
          width: PDF_PAGE_OPTIONS.width,
          height: PDF_PAGE_OPTIONS.height,
          windowWidth: PDF_PAGE_OPTIONS.width,
          windowHeight: PDF_PAGE_OPTIONS.height,
          useCORS: true,
        });
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'letter',
          compress: true,
        });
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          0,
          PDF_PAGE_OPTIONS.width,
          PDF_PAGE_OPTIONS.height,
        );
          const webBlob = pdf.output('blob');
          return { uri: URL.createObjectURL(webBlob), webBlob };
      } finally {
          iframe.remove();
      }
    }

    const { uri } = await Print.printToFileAsync({ html, ...PDF_PAGE_OPTIONS });
    return { uri };
  };

  const handleOpenPdf = async () => {
    setIsOpeningPdf(true);
    try {
      const pdf = await createPdf();

      if (Platform.OS === 'web') {
        window.open(pdf.uri, '_blank', 'noopener,noreferrer');
        return;
      }

      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: pdf.uri,
          type: 'application/pdf',
          flags: 1,
        });
        return;
      }

      await Linking.openURL(pdf.uri);
    } catch (error) {
      showErrorToast(
        'Unable to open quote PDF',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsOpeningPdf(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const pdf = await createPdf();

      if (Platform.OS === 'web') {
        const webNavigator = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { title: string; files: File[] }) => Promise<void>;
        };
        const file = new File([pdf.webBlob!], `Quote-${getQuoteNumber(quote)}.pdf`, {
          type: 'application/pdf',
        });

        if (
          typeof webNavigator.share === 'function'
          && (!webNavigator.canShare || webNavigator.canShare({ files: [file] }))
        ) {
          await webNavigator.share({ title: `Quote #${getQuoteNumber(quote)}`, files: [file] });
        } else {
          const downloadUrl = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name;
          link.click();
          URL.revokeObjectURL(downloadUrl);
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
      showErrorToast(
        'Unable to share quote',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSharing(false);
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
          <Text style={styles.headerTitle}>Preview &amp; Send Quote</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open PDF preview"
            accessibilityState={{ disabled: isOpeningPdf }}
            disabled={isOpeningPdf}
            onPress={handleOpenPdf}
            style={({ pressed }) => [styles.document, pressed && styles.documentPressed]}
          >
            <View style={styles.documentBar}>
              <Text style={styles.documentBusiness}>{simpleQuote.business.name}</Text>
              <Text style={styles.documentDocTitle}>QUOTE</Text>
            </View>

            <View style={styles.documentInfo}>
              <View style={styles.documentFor}>
                <Text style={styles.documentLabel}>For</Text>
                <Text style={styles.documentLine}>{simpleQuote.customer.name}</Text>
                <Text style={styles.documentLine}>{simpleQuote.customer.address}</Text>
                {simpleQuote.customer.phone ? (
                  <Text style={styles.documentLine}>{simpleQuote.customer.phone}</Text>
                ) : null}
                {simpleQuote.customer.email ? (
                  <Text style={styles.documentLine}>{simpleQuote.customer.email}</Text>
                ) : null}
              </View>
              <View style={styles.documentMeta}>
                <View style={styles.documentMetaRow}>
                  <Text style={styles.documentLabel}>Quote #</Text>
                  <Text style={styles.documentLine}>{simpleQuote.number}</Text>
                </View>
                <View style={styles.documentMetaRow}>
                  <Text style={styles.documentLabel}>Quote Date</Text>
                  <Text style={styles.documentLine}>{simpleQuote.date}</Text>
                </View>
              </View>
            </View>

            {simpleQuote.description ? (
              <View style={styles.documentJob}>
                <Text style={styles.documentLine}>{simpleQuote.description}</Text>
                <Text style={styles.documentLine}>
                  <Text style={styles.documentMuted}>Measured area: </Text>
                  <Text style={styles.documentLabel}>{(simpleQuote.areaSqFt ?? 0).toLocaleString()} sq ft</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.documentTable}>
              <View style={styles.documentTableHeader}>
                <Text style={[styles.documentTableHeading, styles.qtyColumn]}>Qty</Text>
                <Text style={[styles.documentTableHeading, styles.descriptionColumn]}>Description</Text>
                <Text style={[styles.documentTableHeading, styles.priceColumn]}>Unit Price</Text>
                <Text style={[styles.documentTableHeading, styles.amountColumn]}>Amount</Text>
              </View>
              {simpleQuote.items.map((item, index) => (
                <View key={`${item.description}-${index}`} style={styles.documentTableRow}>
                  <Text style={[styles.documentTableCell, styles.qtyColumn]}>{item.quantity.toLocaleString()} {item.unit}</Text>
                  <Text style={[styles.documentTableCell, styles.descriptionColumn]}>{item.description}</Text>
                  <Text style={[styles.documentTableCell, styles.priceColumn]}>{formatCurrency(item.unitPrice)}</Text>
                  <Text style={[styles.documentTableCell, styles.amountColumn]}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.documentTotals}>
              {(simpleQuote.adjustment) ? (
                <>
                  <View style={styles.documentTotalRow}>
                    <Text>Subtotal</Text>
                    <Text>{formatCurrency(quote.subtotal ?? 0)}</Text>
                  </View>
                  <View style={styles.documentTotalRow}>
                    <Text>{simpleQuote.adjustment.label}</Text>
                    <Text>{formatCurrency(simpleQuote.adjustment.amount)}</Text>
                  </View>
                </>
              ) : null}
              <View style={styles.documentGrandTotal}>
                <Text style={styles.documentGrandLabel}>TOTAL</Text>
                <Text style={styles.documentGrandValue}>{formatCurrency(quote.total ?? 0)}</Text>
              </View>
            </View>
          </Pressable>
          <Text style={styles.previewHint}>Tap to open the quote PDF</Text>

          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>SEND TO CLIENT</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSharing }}
              disabled={isSharing}
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareButton,
                (pressed || isSharing) && styles.pressed,
              ]}
            >
              <BusinessIcon name="share" color="#FFFFFF" size={22} />
              <Text style={styles.shareButtonText}>{isSharing ? 'Preparing…' : 'Share Quote'}</Text>
            </Pressable>
            <Text style={styles.shareHint}>Shares the quote as a PDF file</Text>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                showSuccessToast('Quote saved', `Quote #${getQuoteNumber(quote)} is ready in your quotes.`);
                navigation.popToTop();
              }}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              <Text style={styles.saveButtonText}>Save &amp; Go to Home</Text>
              <BusinessIcon name="chevron" color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default QuotePreviewScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F9',
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
    fontSize: 19,
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  document: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE2E9',
    shadowColor: '#15263B',
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  documentPressed: {
    opacity: 0.82,
  },
  documentBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#3B6CB4',
  },
  documentBusiness: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  documentDocTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  documentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    marginHorizontal: 14,
  },
  documentFor: {
    flex: 1,
  },
  documentMeta: {
    width: 112,
  },
  documentMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 5,
  },
  documentJob: {
    marginHorizontal: 14,
    marginTop: 18,
  },
  documentMuted: {
    color: '#555555',
  },
  documentLine: {
    color: '#252B35',
    fontSize: 10,
    lineHeight: 15,
  },
  documentLabel: {
    color: '#252B35',
    fontSize: 10,
    fontWeight: '700',
  },
  documentTable: {
    marginHorizontal: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#888888',
  },
  documentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
  },
  documentTableHeading: {
    color: '#252B35',
    fontSize: 9,
    fontWeight: '700',
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#888888',
  },
  documentTableRow: {
    flexDirection: 'row',
  },
  documentTableCell: {
    color: '#252B35',
    fontSize: 9,
    lineHeight: 13,
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    borderRightWidth: 1,
    borderRightColor: '#888888',
  },
  qtyColumn: {
    width: 62,
  },
  descriptionColumn: {
    flex: 1,
  },
  priceColumn: {
    width: 58,
    textAlign: 'right',
  },
  amountColumn: {
    width: 58,
    textAlign: 'right',
  },
  documentTotals: {
    alignSelf: 'flex-end',
    width: '62%',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  documentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
  },
  documentGrandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    paddingVertical: 9,
    paddingHorizontal: 8,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  documentGrandLabel: {
    color: '#252B35',
    fontSize: 12,
    fontWeight: '700',
  },
  documentGrandValue: {
    color: '#252B35',
    fontSize: 13,
    fontWeight: '700',
  },
  previewHint: {
    color: '#434B57',
    fontSize: 14,
    marginTop: 9,
    marginBottom: 14,
  },
  actionsCard: {
    width: '100%',
    maxWidth: 560,
    padding: 14,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#15263B',
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    color: '#304258',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  shareButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 13,
    backgroundColor: '#0879DB',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  shareHint: {
    color: '#8A929D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDE3EA',
    marginVertical: 16,
  },
  saveButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    backgroundColor: '#F56600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
