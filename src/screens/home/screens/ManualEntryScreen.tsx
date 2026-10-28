import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BusinessIcon from '../components/BusinessIcon';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import { showInfoToast } from '../../../core/utils/toast';

type Props = NativeStackScreenProps<HomeStackParamList, 'ManualEntry'>;

function ManualEntryScreen({ navigation }: Props) {
  const [size, setSize] = useState('');
  const validSize = Number.isFinite(Number(size)) && Number(size) > 0;

  const handleContinue = () => {
    if (!validSize) {
      showInfoToast('Enter a property size', 'Enter a number greater than zero.');
      return;
    }

    navigation.navigate('CreateQuote', { areaSqFt: Math.round(Number(size)) });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={navigation.goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <BusinessIcon name="back" color="#27364A" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Manual Entry</Text>
        </View>

        <Text style={styles.title}>Enter the property size</Text>
        <Text style={styles.subtitle}>Add the total area you want included in this estimate.</Text>

        <View style={styles.inputCard}>
          <Text style={styles.label}>PROPERTY SIZE</Text>
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Property size in square feet"
              value={size}
              onChangeText={value => setSize(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="Enter area in square feet"
              placeholderTextColor="#A0AAB6"
              style={styles.input}
            />
            <Text style={styles.unit}>sq ft</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleContinue}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>Use this size</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default ManualEntryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E9F0',
    marginBottom: 24,
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
  title: {
    color: '#1C2A3D',
    fontSize: 23,
    fontWeight: '800',
  },
  subtitle: {
    color: '#748194',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 22,
  },
  inputCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
  },
  label: {
    color: '#738093',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: '#1C2A3D',
    fontSize: 22,
    fontWeight: '700',
  },
  unit: {
    color: '#6C7888',
    fontSize: 15,
    fontWeight: '600',
  },
  continueButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1686E8',
    marginTop: 18,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
