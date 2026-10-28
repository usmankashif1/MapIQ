import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BusinessIcon from '../components/BusinessIcon';
import type { HomeStackParamList } from '../navigation/HomeNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Estimate'>;

function EstimateOptionsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={navigation.goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <BusinessIcon name="back" color="#27364A" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>New Estimate</Text>
        </View>

        <Text style={styles.question}>How would you like to get the property size?</Text>
        <Text style={styles.description}>Choose the method that works best for this property.</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('MapMeasurement')}
          style={({ pressed }) => [styles.optionCard, styles.mapCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.optionLabel, styles.mapLabel]}>
            <Text style={styles.optionLabelText}>MAP MEASUREMENT</Text>
          </View>
          <View style={styles.optionContent}>
            <View style={styles.mapPreview}>
              <View style={styles.mapBlockRow}>
                <View style={[styles.mapBlock, styles.mapBlockLight]} />
                <View style={[styles.mapBlock, styles.mapBlockDark]} />
                <View style={[styles.mapBlock, styles.mapBlockGreen]} />
              </View>
              <View style={[styles.mapBlockRow, styles.mapBlockRowOffset]}>
                <View style={[styles.mapBlock, styles.mapBlockGreen]} />
                <View style={[styles.mapBlock, styles.mapBlockLight]} />
                <View style={[styles.mapBlock, styles.mapBlockDark]} />
              </View>
              <View style={styles.mapRoad} />
              <View style={styles.mapPin}>
                <BusinessIcon name="map" size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Map Measurement</Text>
              <Text style={styles.optionSubtitle}>Measure using a satellite map</Text>
            </View>
            <BusinessIcon name="chevron" size={21} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ManualEntry')}
          style={({ pressed }) => [styles.optionCard, styles.manualCard, pressed && styles.cardPressed]}
        >
          <View style={[styles.optionLabel, styles.manualLabel]}>
            <Text style={styles.optionLabelText}>MANUAL ENTRY</Text>
          </View>
          <View style={styles.optionContent}>
            <View style={styles.calculatorTile}>
              <BusinessIcon name="calculator" size={48} color="#FFFFFF" />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Manual Entry</Text>
              <Text style={styles.optionSubtitle}>Enter the property size</Text>
            </View>
            <BusinessIcon name="chevron" size={21} color="#FFFFFF" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default EstimateOptionsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E9F0',
    marginBottom: 22,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#202B3A',
    fontSize: 19,
    fontWeight: '700',
  },
  question: {
    color: '#1C2A3D',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  description: {
    color: '#748194',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 22,
  },
  optionCard: {
    borderRadius: 19,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#15263B',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  mapCard: {
    backgroundColor: '#315CB7',
  },
  manualCard: {
    backgroundColor: '#10A95D',
  },
  optionLabel: {
    height: 43,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mapLabel: {
    backgroundColor: '#294F9F',
  },
  manualLabel: {
    backgroundColor: '#0E9652',
  },
  optionLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  optionContent: {
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  mapPreview: {
    width: 82,
    height: 82,
    overflow: 'hidden',
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: '#758D68',
  },
  mapBlockRow: {
    height: 35,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: -8,
  },
  mapBlockRowOffset: {
    marginLeft: 3,
    marginRight: -15,
  },
  mapBlock: {
    width: 28,
    height: 24,
    borderRadius: 5,
    transform: [{ rotate: '-18deg' }],
  },
  mapBlockLight: { backgroundColor: '#D5C9A9' },
  mapBlockDark: { backgroundColor: '#697B66' },
  mapBlockGreen: { backgroundColor: '#53775C' },
  mapRoad: {
    position: 'absolute',
    left: -9,
    right: -9,
    top: 38,
    height: 8,
    backgroundColor: '#D9D2BC',
    transform: [{ rotate: '-28deg' }],
  },
  mapPin: {
    position: 'absolute',
    alignSelf: 'center',
    width: 27,
    height: 27,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1686E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  calculatorTile: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#467C67',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  optionCopy: {
    flex: 1,
    gap: 6,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
