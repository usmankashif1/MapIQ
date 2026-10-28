import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import BusinessIcon from '../components/BusinessIcon';
import QuoteCard from '../components/QuoteCard';
import InvoiceCard from '../components/InvoiceCard';
import type { BottomTabParamList } from '../../../navigation/main/BottomTabs/BottomNavigator';
import { showInfoToast } from '../../../core/utils/toast';
import { useAppSelector } from '../../../store/hooks';

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function QuotesScreen() {
  const savedQuotes = useAppSelector(state => state.quotes.items);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Quotes" subtitle="Your recent estimates and job quotes" />
        {savedQuotes.length > 0 ? (
          savedQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No quotes yet</Text>
            <Text style={styles.emptyDescription}>
              Quotes you create will show up here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type InvoicesScreenProps = BottomTabScreenProps<BottomTabParamList, 'InvoicesTab'>;

export function InvoicesScreen({ navigation }: InvoicesScreenProps) {
  const savedInvoices = useAppSelector(state => state.invoices.items);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Invoices" subtitle="Track billing and payments" />
        {savedInvoices.length ? (
          savedInvoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <BusinessIcon name="invoice" color="#1686E8" size={30} />
            </View>
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptyDescription}>
              Invoices you create for your customers will show up here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('HomeTab', { screen: 'CreateInvoice' })}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Create invoice</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SETTINGS_OPTIONS = [
  { title: 'Business profile', subtitle: 'Business name and contact details', icon: 'briefcase' as const },
  { title: 'Notifications', subtitle: 'Quote and payment updates', icon: 'bell' as const },
  { title: 'Estimate preferences', subtitle: 'Default units and pricing', icon: 'ruler' as const },
];

export function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Settings" subtitle="Manage your business preferences" />
        <View style={styles.businessCard}>
          <View style={styles.businessAvatar}>
            <BusinessIcon name="briefcase" color="#1686E8" size={22} />
          </View>
          <View style={styles.businessCopy}>
            <Text style={styles.businessName}>Business profile</Text>
            <Text style={styles.businessCaption}>Add your business details</Text>
          </View>
          <BusinessIcon name="chevron" color="#8693A2" size={20} />
        </View>
        <View style={styles.settingsCard}>
          {SETTINGS_OPTIONS.map((option, index) => (
            <Pressable
              key={option.title}
              accessibilityRole="button"
              onPress={() => showInfoToast(option.title, 'This setting will be available soon.')}
              style={({ pressed }) => [
                styles.settingRow,
                index < SETTINGS_OPTIONS.length - 1 && styles.settingBorder,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.settingIcon}>
                <BusinessIcon name={option.icon} color="#1686E8" size={20} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
              </View>
              <BusinessIcon name="chevron" color="#8693A2" size={18} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F7FC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#1C2A3D',
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: '#6C7888',
    fontSize: 14,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9EEF4',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5FF',
  },
  emptyTitle: {
    color: '#1C2A3D',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptyDescription: {
    maxWidth: 260,
    color: '#6C7888',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
  },
  primaryButton: {
    minHeight: 46,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#1686E8',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: { opacity: 0.8 },
  businessCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9EEF4',
  },
  businessAvatar: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#DCEBFF',
  },
  businessCopy: { flex: 1 },
  businessName: {
    color: '#1C2A3D',
    fontSize: 15,
    fontWeight: '700',
  },
  businessCaption: {
    color: '#7B8795',
    fontSize: 12,
    marginTop: 3,
  },
  settingsCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9EEF4',
  },
  settingRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7ECF2',
  },
  settingIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EAF5FF',
  },
  settingCopy: { flex: 1 },
  settingTitle: {
    color: '#27364A',
    fontSize: 14,
    fontWeight: '700',
  },
  settingSubtitle: {
    color: '#8591A0',
    fontSize: 12,
    marginTop: 3,
  },
  rowPressed: { opacity: 0.7 },
});
