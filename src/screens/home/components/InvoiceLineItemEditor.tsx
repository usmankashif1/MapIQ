import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InvoiceFormField } from './InvoiceFormField';

export type InvoiceLineItemDraft = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type Props = {
  index: number;
  item: InvoiceLineItemDraft;
  onChange: (item: InvoiceLineItemDraft) => void;
  onRemove: () => void;
};

export default function InvoiceLineItemEditor({ index, item, onChange, onRemove }: Props) {
  const update = (key: keyof InvoiceLineItemDraft, value: string) => {
    onChange({ ...item, [key]: value });
  };

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.itemTitle}>Item {index + 1}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove item ${index + 1}`}
          hitSlop={8}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
      <InvoiceFormField
        label="Description"
        maxLength={200}
        onChangeText={value => update('description', value)}
        placeholder="Service or product"
        value={item.description}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <InvoiceFormField
            keyboardType="decimal-pad"
            label="Quantity"
            onChangeText={value => update('quantity', value)}
            placeholder="1"
            value={item.quantity}
          />
        </View>
        <View style={styles.half}>
          <InvoiceFormField
            label="Unit"
            maxLength={30}
            onChangeText={value => update('unit', value)}
            placeholder="each, hour, sq ft"
            value={item.unit}
          />
        </View>
      </View>
      <InvoiceFormField
        keyboardType="decimal-pad"
        label="Unit price"
        onChangeText={value => update('unitPrice', value)}
        placeholder="0.00"
        value={item.unitPrice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#F6F8FC',
    borderWidth: 1,
    borderColor: '#E8EDF3',
  },
  heading: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: '#27364A',
    fontSize: 15,
    fontWeight: '700',
  },
  removeButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  removeText: {
    color: '#C54444',
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
