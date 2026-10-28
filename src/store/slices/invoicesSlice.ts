import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { InvoiceRecord } from '../../screens/home/utils/invoiceStorage';

type InvoicesState = {
  items: InvoiceRecord[];
};

const initialState: InvoicesState = {
  items: [],
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    replaceInvoices: (state, action: PayloadAction<InvoiceRecord[]>) => {
      state.items = action.payload;
    },
  },
});

export const { replaceInvoices } = invoicesSlice.actions;
export default invoicesSlice.reducer;
