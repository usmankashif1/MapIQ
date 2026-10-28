import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { QuoteRecord } from '../../screens/home/components/QuoteCard';

type QuotesState = {
  items: QuoteRecord[];
};

const initialState: QuotesState = {
  items: [],
};

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    replaceQuotes: (state, action: PayloadAction<QuoteRecord[]>) => {
      state.items = action.payload;
    },
  },
});

export const { replaceQuotes } = quotesSlice.actions;
export default quotesSlice.reducer;
