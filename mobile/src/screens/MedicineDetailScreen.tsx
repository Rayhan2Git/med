import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { getMedicineDetail } from "../services/api";
import { BrandDetail } from "../types";

export default function MedicineDetailScreen({ route, navigation }: any) {
  const { brandId } = route.params;
  const [medicine, setMedicine] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMedicineDetail(brandId)
      .then(setMedicine)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2F5BA2" />
      </View>
    );
  }

  if (!medicine) {
    return (
      <View style={styles.center}>
        <Text>Medicine not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.brandName}>{medicine.name}</Text>
        {medicine.strength && (
          <Text style={styles.strength}>{medicine.strength}</Text>
        )}
        {medicine.dosage_form && (
          <Text style={styles.dosageForm}>{medicine.dosage_form}</Text>
        )}
        <Text style={styles.manufacturer}>{medicine.manufacturer}</Text>
        {medicine.generic_name && (
          <View style={styles.genericBadge}>
            <Text style={styles.genericText}>Generic: {medicine.generic_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.sectionTitle}>Price</Text>
        {medicine.unit_price && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit Price:</Text>
            <Text style={styles.priceValue}>৳{medicine.unit_price.toFixed(2)}</Text>
          </View>
        )}
        {medicine.strip_price && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Strip Price:</Text>
            <Text style={styles.priceValue}>৳{medicine.strip_price.toFixed(2)}</Text>
          </View>
        )}
        {medicine.box_price && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Box Price:</Text>
            <Text style={styles.priceValue}>৳{medicine.box_price.toFixed(2)}</Text>
          </View>
        )}
      </View>

      {medicine.indications && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Indications</Text>
          <Text style={styles.infoText}>{medicine.indications}</Text>
        </View>
      )}

      {medicine.dosage && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Dosage & Administration</Text>
          <Text style={styles.infoText}>{medicine.dosage}</Text>
        </View>
      )}

      {medicine.side_effects && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Side Effects</Text>
          <Text style={styles.infoText}>{medicine.side_effects}</Text>
        </View>
      )}

      {medicine.contraindications && (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contraindications</Text>
          <Text style={styles.infoText}>{medicine.contraindications}</Text>
        </View>
      )}

      {medicine.generic_id && (
        <TouchableOpacity
          style={styles.alternativesButton}
          onPress={() =>
            navigation.navigate("Alternatives", {
              genericId: medicine.generic_id,
              genericName: medicine.generic_name,
            })
          }
        >
          <Text style={styles.alternativesButtonText}>
            View All Alternatives ({medicine.alternatives?.length || 0})
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandName: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  strength: { fontSize: 16, color: "#2F5BA2", marginTop: 4 },
  dosageForm: { fontSize: 14, color: "#666", marginTop: 2 },
  manufacturer: { fontSize: 14, color: "#666", marginTop: 8 },
  genericBadge: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  genericText: { fontSize: 12, color: "#2F5BA2", fontWeight: "500" },
  priceCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceLabel: { fontSize: 14, color: "#666" },
  priceValue: { fontSize: 14, fontWeight: "600", color: "#2F5BA2" },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  infoText: { fontSize: 14, color: "#444", lineHeight: 20 },
  alternativesButton: {
    backgroundColor: "#2F5BA2",
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  alternativesButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
