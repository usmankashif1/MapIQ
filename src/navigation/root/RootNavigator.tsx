import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Container from '../../components/Container';
import Screen from '../../components/Screen';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getToken } from '../../core/utils/tokenStorage';
import { setToken } from '../../store/slices/authSlice';
import { replaceQuotes } from '../../store/slices/quotesSlice';
import { replaceInvoices } from '../../store/slices/invoicesSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import AuthNavigator from '../auth/AuthNavigator';
import StackNavigator from '../main/Stack/StackNavigator';
import { getSavedQuotes } from '../../screens/home/utils/quoteStorage';
import { getSavedInvoices } from '../../screens/home/utils/invoiceStorage';
import { showErrorToast } from '../../core/utils/toast';

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    const dispatch = useAppDispatch();
    const { token, isBootstrapping } = useAppSelector(state => state.auth);

    useEffect(() => {
        const restoreSession = async () => {
            let storedToken: string | null = null;
            try {
                storedToken = await getToken();
            } catch (error) {
                showErrorToast(
                    'Unable to restore session',
                    error instanceof Error ? error.message : 'Please try again.',
                );
            }

            try {
                dispatch(replaceQuotes(await getSavedQuotes()));
            } catch (error) {
                showErrorToast(
                    'Unable to load saved quotes',
                    error instanceof Error ? error.message : 'Please try again.',
                );
                dispatch(replaceQuotes([]));
            }

            try {
                dispatch(replaceInvoices(await getSavedInvoices()));
            } catch (error) {
                showErrorToast(
                    'Unable to load saved invoices',
                    error instanceof Error ? error.message : 'Please try again.',
                );
                dispatch(replaceInvoices([]));
            }

            dispatch(setToken(storedToken));
        };
        restoreSession();
    }, [dispatch]);

    if (isBootstrapping) {
        return (
            <Screen>
                <Container>
                    <SkeletonLoader loading count={4} />
                </Container>
            </Screen>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* {token ? (
                    <Stack.Screen name="Main" component={StackNavigator} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )} */}

                <Stack.Screen name="Main" component={StackNavigator} />

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
