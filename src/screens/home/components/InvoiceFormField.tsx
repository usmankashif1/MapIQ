import React from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
  maxLength?: number;
};

export function InvoiceFormField({
  label,
  value,
  onChangeText,
  placeholder,
  optional = false,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  maxLength,
}: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{optional ? ' (optional)' : ''}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8793A3"
        returnKeyType={multiline ? 'default' : 'next'}
        style={[styles.input, multiline && styles.multiline]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

export function InvoiceFormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
    padding: 16,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF3',
    shadowColor: '#15263B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#304258',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#526276',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#AAB3C1',
    borderRadius: 11,
    paddingHorizontal: 12,
    color: '#202B3A',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
