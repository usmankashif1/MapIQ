import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { calculateSimpleInvoiceTotals } from '../../../core/QuoteTempletes/simpleInvoice';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../../core/utils/toast';
import { useAppDispatch } from '../../../store/hooks';
import { replaceInvoices } from '../../../store/slices/invoicesSlice';
import InvoiceDocument from './InvoiceDocument';
import {
  saveInvoice,
  type InvoiceRecord,
  type InvoiceStatus,
} from '../utils/invoiceStorage';
import { shareInvoice } from '../utils/shareInvoice';

type Props = {
  invoice: InvoiceRecord;
};

const STATUSES: InvoiceStatus[] = ['Unpaid', 'Partially paid', 'Paid', 'Overdue'];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInvoiceStatus(invoice: InvoiceRecord): InvoiceStatus {
  if (invoice.status) return invoice.status;
  const { total, paid } = calculateSimpleInvoiceTotals(invoice);
  if (paid >= total) return 'Paid';
  return paid > 0 ? 'Partially paid' : 'Unpaid';
}

function sanitizeAmount(value: string): string {
  const normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...fractionParts] = normalized.split('.');
  const fraction = fractionParts.join('').slice(0, 2);
  const limitedWhole = whole.replace(/^0+(?=\d)/, '').slice(0, 9);
  return normalized.includes('.') ? `${limitedWhole}.${fraction}` : limitedWhole;
}

function InvoiceCard({ invoice }: Props) {
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [paymentEditorOpen, setPaymentEditorOpen] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState(String(invoice.amountPaid ?? 0));
  const totals = useMemo(() => calculateSimpleInvoiceTotals(invoice), [invoice]);
  const status = getInvoiceStatus(invoice);

  const persistInvoice = async (updatedInvoice: InvoiceRecord, successMessage: string) => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      dispatch(replaceInvoices(await saveInvoice(updatedInvoice)));
      showSuccessToast(successMessage, updatedInvoice.number);
      return true;
    } catch (error) {
      showErrorToast(
        'Unable to update invoice',
        error instanceof Error ? error.message : 'Please try again.',
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (nextStatus: InvoiceStatus) => {
    if (nextStatus === 'Overdue' && totals.balance <= 0) {
      showInfoToast('Invoice is paid', 'A fully paid invoice cannot be marked overdue.');
      return;
    }

    if (nextStatus === 'Partially paid') {
      if (totals.paid <= 0 || totals.paid >= totals.total) {
        setPaymentEditorOpen(true);
        setStatusMenuOpen(false);
        showInfoToast('Update payment amount', 'Enter an amount greater than $0 and less than the invoice total.');
        return;
      }
    }

    const updatedInvoice: InvoiceRecord = {
      ...invoice,
      status: nextStatus,
      amountPaid: nextStatus === 'Paid'
        ? totals.total
        : nextStatus === 'Unpaid'
          ? 0
          : invoice.amountPaid,
    };
    if (await persistInvoice(updatedInvoice, 'Invoice status updated')) {
      setStatusMenuOpen(false);
    }
  };

  const savePayment = async () => {
    const amountPaid = amountPaidInput.trim() ? Number(amountPaidInput) : 0;
    if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > totals.total) {
      showInfoToast(
        'Invalid payment amount',
        `Enter an amount from $0 to ${formatCurrency(totals.total)}.`,
      );
      return;
    }

    const nextStatus: InvoiceStatus = amountPaid >= totals.total
      ? 'Paid'
      : amountPaid > 0
        ? 'Partially paid'
        : status === 'Overdue'
          ? 'Overdue'
          : 'Unpaid';
    const saved = await persistInvoice(
      { ...invoice, amountPaid, status: nextStatus },
      'Payment amount updated',
    );
    if (saved) setPaymentEditorOpen(false);
  };

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

  const statusStyle = status === 'Paid'
    ? styles.statusPaid
    : status === 'Overdue'
      ? styles.statusOverdue
      : status === 'Partially paid'
        ? styles.statusPartial
        : styles.statusUnpaid;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open invoice ${invoice.number} for ${invoice.customer.name}`}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardRow}>
          <View style={styles.invoiceIcon}>
            <Text style={styles.invoiceIconText}>$</Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.customer} numberOfLines={1}>{invoice.customer.name}</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
          </View>
          <View style={styles.amountCopy}>
            <Text style={styles.balance}>{formatCurrency(totals.total)}</Text>
            {totals.balance > 0 ? (
              <Text style={styles.remaining}>Due {formatCurrency(totals.balance)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.dueDate} numberOfLines={1}>
            {invoice.dueDate.trim().toLowerCase() === 'due on receipt'
              ? invoice.dueDate
              : `Due ${invoice.dueDate}`}
          </Text>
          <Text style={[styles.status, statusStyle]}>{status}</Text>
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
              <View style={styles.modalTitleCopy}>
                <Text style={styles.modalTitle}>{invoice.number}</Text>
                <Text style={[styles.status, statusStyle]}>{status}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close invoice details"
                hitSlop={8}
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <InvoiceDocument invoice={invoice} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSharing }}
                disabled={isSharing}
                onPress={handleShare}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>
                  {isSharing ? 'Preparing PDF…' : 'Share invoice'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setAmountPaidInput(String(invoice.amountPaid ?? 0));
                  setPaymentEditorOpen(open => !open);
                  setStatusMenuOpen(false);
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>
                  {paymentEditorOpen ? 'Cancel payment update' : 'Update amount paid'}
                </Text>
              </Pressable>

              {paymentEditorOpen && (
                <View style={styles.paymentEditor}>
                  <Text style={styles.paymentLabel}>
                    Amount paid (balance: {formatCurrency(Math.max(0, totals.balance))})
                  </Text>
                  <View style={styles.paymentRow}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      accessibilityLabel="Amount paid"
                      keyboardType="decimal-pad"
                      onChangeText={value => setAmountPaidInput(sanitizeAmount(value))}
                      placeholder="0.00"
                      placeholderTextColor="#8793A3"
                      style={styles.paymentInput}
                      value={amountPaidInput}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isSaving }}
                      disabled={isSaving}
                      onPress={savePayment}
                      style={({ pressed }) => [styles.savePaymentButton, pressed && styles.buttonPressed]}
                    >
                      <Text style={styles.savePaymentText}>{isSaving ? 'Saving…' : 'Save'}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setStatusMenuOpen(open => !open);
                  setPaymentEditorOpen(false);
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.secondaryButtonText}>Update status</Text>
              </Pressable>

              {statusMenuOpen && (
                <View style={styles.statusOptions}>
                  {STATUSES.map(option => (
                    <Pressable
                      accessibilityRole="button"
                      key={option}
                      onPress={() => void updateStatus(option)}
                      style={({ pressed }) => [
                        styles.statusOption,
                        option === status && styles.statusOptionCurrent,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.statusOptionText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default React.memo(InvoiceCard);

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 15,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEF4',
    shadowColor: '#17324D',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  invoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3FF',
  },
  invoiceIconText: {
    color: '#1686E8',
    fontSize: 17,
    fontWeight: '900',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  customer: {
    color: '#1C2A3D',
    fontSize: 15,
    fontWeight: '800',
  },
  invoiceNumber: {
    color: '#718094',
    fontSize: 12,
  },
  amountCopy: {
    alignItems: 'flex-end',
    gap: 2,
  },
  balance: {
    color: '#173F78',
    fontSize: 15,
    fontWeight: '800',
  },
  remaining: {
    color: '#718094',
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dueDate: {
    flex: 1,
    color: '#718094',
    fontSize: 12,
  },
  status: {
    overflow: 'hidden',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '800',
  },
  statusPaid: {
    color: '#0A8E55',
    backgroundColor: '#E4F7EE',
  },
  statusPartial: {
    color: '#A86805',
    backgroundColor: '#FFF3D9',
  },
  statusUnpaid: {
    color: '#596579',
    backgroundColor: '#EEF1F5',
  },
  statusOverdue: {
    color: '#C54444',
    backgroundColor: '#FCE9E9',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(12, 24, 40, 0.56)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#F6F8FC',
  },
  modalHeader: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF3',
  },
  modalTitleCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#1C2A3D',
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    color: '#526276',
    fontSize: 28,
    lineHeight: 30,
  },
  modalContent: {
    padding: 14,
    gap: 10,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1686E8',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E4F5',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#173F78',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentEditor: {
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
  },
  paymentLabel: {
    color: '#526276',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    color: '#526276',
    fontSize: 17,
    fontWeight: '700',
  },
  paymentInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#AAB3C1',
    color: '#202B3A',
    fontSize: 16,
  },
  savePaymentButton: {
    minWidth: 70,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#16B66B',
  },
  savePaymentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statusOptions: {
    gap: 7,
  },
  statusOption: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusOptionCurrent: {
    borderColor: '#1686E8',
    backgroundColor: '#EAF3FF',
  },
  statusOptionText: {
    color: '#304258',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
