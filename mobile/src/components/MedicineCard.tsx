import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Brand } from "../types";

interface Props {
  brand: Brand;
  onPress: () => void;
  compact?: boolean;
}

export default function MedicineCard({ brand, onPress, compact }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {brand.name}
        </Text>
        {brand.strength && (
          <Text style={styles.strength}>{brand.strength}</Text>
        )}
        {!compact && brand.manufacturer && (
          <Text style={styles.manufacturer} numberOfLines={1}>
            {brand.manufacturer}
          </Text>
        )}
        {!compact && brand.generic_name && (
          <Text style={styles.generic} numberOfLines={1}>
            Generic: {brand.generic_name}
          </Text>
        )}
      </View>
      {brand.unit_price != null && (
        <View style={styles.priceContainer}>
          <Text style={styles.price}>৳{brand.unit_price.toFixed(2)}</Text>
          <Text style={styles.unit}>/unit</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  cardCompact: { padding: 10 },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  strength: { fontSize: 13, color: "#2F5BA2", marginTop: 2 },
  manufacturer: { fontSize: 12, color: "#888", marginTop: 2 },
  generic: { fontSize: 11, color: "#999", marginTop: 2, fontStyle: "italic" },
  priceContainer: { alignItems: "flex-end" },
  price: { fontSize: 16, fontWeight: "700", color: "#2F5BA2" },
  unit: { fontSize: 10, color: "#999" },
});
