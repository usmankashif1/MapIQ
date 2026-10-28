import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BusinessIcon from '../components/BusinessIcon';
import QuoteCard from '../components/QuoteCard';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { showInfoToast } from '../../../core/utils/toast';
import { useAppSelector } from '../../../store/hooks';

type Props = NativeStackScreenProps<HomeStackParamList, 'Dashboard'>;

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning!';
  if (hour < 17) return 'Good afternoon!';
  return 'Good evening!';
}

function DashboardScreen({ navigation }: Props) {
  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);
  const savedQuotes = useAppSelector(state => state.quotes.items);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <BusinessIcon name="briefcase" size={20} color="#1686E8" />
          </View>
          <Text style={styles.brandName} numberOfLines={1}>Business profile</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => showInfoToast('Notifications', 'You are all caught up.')}
            style={styles.iconButton}
          >
            <BusinessIcon name="bell" size={22} color="#26374D" />
          </Pressable>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>{greeting}</Text>
          <Text style={styles.greetingSubtitle}>Let’s get to work.</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Estimate')}
            style={({ pressed }) => [styles.actionCard, styles.estimateCard, pressed && styles.cardPressed]}
          >
            <BusinessIcon name="ruler" size={34} />
            <View>
              <Text style={styles.actionTitle}>Start New{'\n'}Estimate</Text>
              <Text style={styles.actionSubtitle}>Map or Type size</Text>
            </View>
            <View style={styles.actionBadge}>
              <BusinessIcon name="briefcase" size={18} color="#1686E8" />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('CreateInvoice')}
            style={({ pressed }) => [styles.actionCard, styles.invoiceCard, pressed && styles.cardPressed]}
          >
            <BusinessIcon name="invoice" size={34} />
            <View>
              <Text style={styles.actionTitle}>Create{'\n'}Invoice</Text>
              <Text style={styles.actionSubtitle}>Instant billing</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent Quotes &amp; Jobs</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.getParent()?.navigate('QuotesTab')}
            hitSlop={8}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {savedQuotes.length > 0 ? (
          savedQuotes.slice(0, 3).map(quote => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        ) : (
          <View style={styles.emptyQuotesCard}>
            <Text style={styles.emptyQuotesTitle}>No quotes yet</Text>
            <Text style={styles.emptyQuotesDescription}>
              Quotes you create will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default DashboardScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F7FC',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
  },
  brandRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F2FF',
  },
  brandName: {
    flex: 1,
    color: '#1D2D42',
    fontSize: 16,
    fontWeight: '800',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginTop: 20,
    marginBottom: 16,
  },
  greetingTitle: {
    color: '#1C2A3D',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    color: '#667587',
    fontSize: 16,
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 164,
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#14283D',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  estimateCard: {
    backgroundColor: '#168DE7',
  },
  invoiceCard: {
    backgroundColor: '#16B66B',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 23,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    marginTop: 4,
  },
  actionBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 5,
  },
  sectionTitle: {
    color: '#1D2D42',
    fontSize: 18,
    fontWeight: '800',
  },
  seeAll: {
    color: '#1686E8',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyQuotesCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EEF4',
  },
  emptyQuotesTitle: {
    color: '#27364A',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyQuotesDescription: {
    color: '#7B8795',
    fontSize: 13,
    marginTop: 4,
  },
});
