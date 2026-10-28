import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomNavigator from '../BottomTabs/BottomNavigator';

export type MainStackParamList = {
    Tabs: undefined;
    // Add full-screen (non-tab) screens here, e.g. Details: { id: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const StackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={BottomNavigator} />
        </Stack.Navigator>
    );
};

export default StackNavigator;
