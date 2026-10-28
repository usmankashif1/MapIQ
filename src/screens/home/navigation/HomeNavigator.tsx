import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import EstimateOptionsScreen from '../screens/EstimateOptionsScreen';
import HomeScreen from '../screens/HomeScreen';
import ManualEntryScreen from '../screens/ManualEntryScreen';
import CreateQuoteScreen from '../screens/CreateQuoteScreen';
import QuotePreviewScreen from '../screens/QuotePreviewScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import InvoicePreviewScreen from '../screens/InvoicePreviewScreen';
import type { QuoteRecord } from '../components/QuoteCard';
import type { InvoiceRecord } from '../utils/invoiceStorage';

export type HomeStackParamList = {
    Dashboard: undefined;
    Estimate: undefined;
    MapMeasurement: undefined;
    ManualEntry: undefined;
    CreateQuote: { areaSqFt: number };
    QuotePreview: { quote: QuoteRecord; mode: 'created' };
    CreateInvoice: undefined;
    InvoicePreview: { invoice: InvoiceRecord };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

function MapMeasurementScreen({
    navigation,
}: NativeStackScreenProps<HomeStackParamList, 'MapMeasurement'>) {
    return (
        <HomeScreen
            onGenerateQuote={areaSqFt => navigation.navigate('CreateQuote', { areaSqFt })}
        />
    );
}

const HomeNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Estimate" component={EstimateOptionsScreen} />
            <Stack.Screen name="MapMeasurement" component={MapMeasurementScreen} />
            <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
            <Stack.Screen name="CreateQuote" component={CreateQuoteScreen} />
            <Stack.Screen name="QuotePreview" component={QuotePreviewScreen} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
            <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
        </Stack.Navigator>
    );
};

export default HomeNavigator;
