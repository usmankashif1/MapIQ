import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { InvoiceRecord } from './invoiceStorage';
import { createInvoicePdf } from './createInvoicePdf';

export async function shareInvoice(invoice: InvoiceRecord): Promise<void> {
  const pdf = await createInvoicePdf(invoice);
  if (Platform.OS === 'web') {
    if (!pdf.webBlob) {
      throw new Error('The invoice PDF was not created.');
    }

    const fileName = invoice.number.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'invoice';
    const webNavigator = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { title: string; files: File[] }) => Promise<void>;
    };
    const file = new File([pdf.webBlob], `${fileName}.pdf`, {
      type: 'application/pdf',
    });

    if (
      typeof webNavigator.share === 'function'
      && (!webNavigator.canShare || webNavigator.canShare({ files: [file] }))
    ) {
      await webNavigator.share({ title: invoice.number, files: [file] });
    } else {
      const link = document.createElement('a');
      link.href = pdf.uri;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(pdf.uri), 1000);
    }
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('This device cannot share the invoice PDF.');
  }

  await Sharing.shareAsync(pdf.uri, {
    dialogTitle: `Share ${invoice.number}`,
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
