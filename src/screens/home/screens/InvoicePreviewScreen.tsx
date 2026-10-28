import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { showErrorToast } from '../../../core/utils/toast';
import InvoiceDocument from '../components/InvoiceDocument';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { shareInvoice } from '../utils/shareInvoice';

type Props = NativeStackScreenProps<HomeStackParamList, 'InvoicePreview'>;

function InvoicePreviewScreen({ navigation, route }: Props) {
  const { invoice } = route.params;
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await shareInvoice(invoice);
    } catch (error) {
      showErrorToast(
        'Unable to share invoice',
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
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Invoice created</Text>
            <Text style={styles.headerSubtitle}>{invoice.number}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <InvoiceDocument invoice={invoice} />
          <Text style={styles.hint}>Review the invoice, then share the PDF with your customer.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSharing }}
            disabled={isSharing}
            onPress={handleShare}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <Text style={styles.shareButtonText}>
              {isSharing ? 'Preparing PDF…' : 'Share invoice PDF'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default InvoicePreviewScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#173F78',
  },
  backButton: {
    width: 42,
    height: 46,
    justifyContent: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#D6E4F5',
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  hint: {
    color: '#667587',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  shareButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1686E8',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
