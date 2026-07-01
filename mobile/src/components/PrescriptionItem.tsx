import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { PrescriptionMedicine } from "../types";

interface Props {
  medicine: PrescriptionMedicine;
  onPress: (brandId: number) => void;
  onAlternativePress: (genericId: number, genericName: string) => void;
}

export default function PrescriptionItem({ medicine, onPress, onAlternativePress }: Props) {
  const confidenceColor =
    medicine.confidence >= 0.7 ? "#27ae60" : medicine.confidence >= 0.4 ? "#f39c12" : "#e74c3c";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.rawName}>{medicine.raw_name}</Text>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceText}>
            {Math.round(medicine.confidence * 100)}%
          </Text>
        </View>
      </View>

      {medicine.strength ? (
        <Text style={styles.strength}>{medicine.strength}</Text>
      ) : null}

      {medicine.frequency ? (
        <Text style={styles.frequency}>Dosage: {medicine.frequency}</Text>
      ) : null}

      {medicine.suggested_generic && (
        <Text style={styles.generic}>Generic: {medicine.suggested_generic}</Text>
      )}

      {medicine.cheapest ? (
        <View style={styles.priceSection}>
          <View style={styles.cheapestRow}>
            <Text style={styles.cheapestLabel}>Best Price:</Text>
            <Text style={styles.cheapestPrice}>৳{medicine.cheapest.unit_price?.toFixed(2)}</Text>
            <Text style={styles.cheapestBrand}>{medicine.cheapest.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onPress(medicine.cheapest!.id)}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noMatch}>No match found in database</Text>
      )}

      {medicine.db_matches.length > 1 && (
        <TouchableOpacity
          style={styles.alternativeLink}
          onPress={() => {
            const genericId = medicine.cheapest?.generic_id || medicine.db_matches[0]?.generic_id;
            const genericName = medicine.suggested_generic || medicine.db_matches[0]?.generic_name;
            if (genericId) onAlternativePress(genericId, genericName);
          }}
        >
          <Text style={styles.alternativeText}>
            View all {medicine.db_matches.length} alternatives →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rawName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", flex: 1 },
  confidenceBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  confidenceText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  strength: { fontSize: 13, color: "#2F5BA2", marginTop: 4 },
  frequency: { fontSize: 12, color: "#666", marginTop: 2 },
  generic: { fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cheapestRow: { flex: 1 },
  cheapestLabel: { fontSize: 12, color: "#666" },
  cheapestPrice: { fontSize: 16, fontWeight: "700", color: "#27ae60" },
  cheapestBrand: { fontSize: 11, color: "#999", marginTop: 2 },
  viewButton: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewButtonText: { color: "#2F5BA2", fontWeight: "600", fontSize: 12 },
  noMatch: { fontSize: 12, color: "#e74c3c", marginTop: 8 },
  alternativeLink: { marginTop: 8 },
  alternativeText: { color: "#2F5BA2", fontSize: 12, fontWeight: "500" },
});
