import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import HomeNavigator from '../../../screens/home/navigation/HomeNavigator';
import {
    InvoicesScreen,
    QuotesScreen,
    SettingsScreen,
} from '../../../screens/home/screens/WorkspaceScreens';
import type { HomeStackParamList } from '../../../screens/home/navigation/HomeNavigator';

export type BottomTabParamList = {
    HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
    QuotesTab: undefined;
    InvoicesTab: undefined;
    SettingsTab: undefined;
};

type TabIconName = 'home' | 'quote' | 'invoice' | 'settings';

const Tab = createBottomTabNavigator<BottomTabParamList>();

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
    const shared = {
        fill: 'none' as const,
        stroke: color,
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
            {name === 'home' && (
                <Path {...shared} d="M3.5 10.5 12 3.8l8.5 6.7v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-4v6h-5A1.5 1.5 0 0 1 3.5 19.5z" />
            )}
            {name === 'quote' && (
                <>
                    <Path {...shared} d="M6 3.5h8l4 4v13H6z" />
                    <Path {...shared} d="M14 3.5v4h4M9 12h6M9 16h6" />
                </>
            )}
            {name === 'invoice' && (
                <>
                    <Path {...shared} d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z" />
                    <Path {...shared} d="M9 9h6M9 13h6" />
                </>
            )}
            {name === 'settings' && (
                <>
                    <Circle {...shared} cx={12} cy={12} r={3} />
                    <Path {...shared} d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.5a7.8 7.8 0 0 1-1.5.9l-.2 1.5h-2.4l-.3-1.5a7.8 7.8 0 0 1-1.5-.9l-1.4.5-1.2-2.1 1.2-.9a7 7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.4.5a7.8 7.8 0 0 1 1.5-.9l.3-1.5h2.4l.2 1.5a7.8 7.8 0 0 1 1.5.9l1.4-.5 1.2 2.1-1.2.9a7 7 0 0 1 0 1.8z" />
                </>
            )}
        </Svg>
    );
}

const tabIcons: Record<keyof BottomTabParamList, TabIconName> = {
    HomeTab: 'home',
    QuotesTab: 'quote',
    InvoicesTab: 'invoice',
    SettingsTab: 'settings',
};

const BottomNavigator = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#1686E8',
            tabBarInactiveTintColor: '#7B8798',
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 3,
            },
            tabBarIcon: ({ color }) => <TabIcon name={tabIcons[route.name]} color={color} />,
            tabBarStyle: {
                height: 66,
                paddingTop: 7,
                paddingBottom: 5,
                borderTopColor: '#E8EDF3',
                backgroundColor: '#FFFFFF',
                elevation: 10,
            },
        })}
    >
        <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
        <Tab.Screen name="QuotesTab" component={QuotesScreen} options={{ title: 'Quotes' }} />
        <Tab.Screen name="InvoicesTab" component={InvoicesScreen} options={{ title: 'Invoices' }} />
        <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
);

export default BottomNavigator;
