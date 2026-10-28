import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { renderSimpleInvoice } from '../../../core/QuoteTempletes/simpleInvoice';
import type { InvoiceRecord } from './invoiceStorage';

const PDF_PAGE_OPTIONS = { width: 612, height: 792 } as const;

export async function createInvoicePdf(
  invoice: InvoiceRecord,
): Promise<{ uri: string; webBlob?: Blob }> {
  const html = renderSimpleInvoice(invoice);
  if (Platform.OS === 'web') {
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = [
      'position:fixed',
      'left:-10000px',
      'top:0',
      `width:${PDF_PAGE_OPTIONS.width}px`,
      `height:${PDF_PAGE_OPTIONS.height}px`,
      'border:0',
    ].join(';');
    document.body.appendChild(iframe);

    try {
      const iframeDocument = iframe.contentDocument;
      if (!iframeDocument) {
        throw new Error('Could not create the invoice PDF document.');
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

  const { uri } = await Print.printToFileAsync({
    html,
    ...PDF_PAGE_OPTIONS,
  });
  return { uri };
}
