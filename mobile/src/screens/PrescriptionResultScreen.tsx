import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { PrescriptionResult, PrescriptionHistory, PrescriptionMedicine } from "../types";
import { savePrescription } from "../storage/history";
import PrescriptionItem from "../components/PrescriptionItem";

export default function PrescriptionResultScreen({ route, navigation }: any) {
  const { result, thumbnailUri } = route.params as {
    result: PrescriptionResult;
    thumbnailUri?: string;
  };
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) {
      const historyItem: PrescriptionHistory = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        thumbnailUri,
        ocrText: result.ocr_text,
        medicines: result.medicines,
        totalPrice: result.total_estimated_price,
      };
      savePrescription(historyItem).then(() => setSaved(true));
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Prescription Analysis</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{result.total_found}</Text>
            <Text style={styles.summaryLabel}>Medicines</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>৳{result.total_estimated_price.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Est. Total</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Detected Medicines</Text>

      <FlatList
        data={result.medicines}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <PrescriptionItem
            medicine={item}
            onPress={(brandId) =>
              navigation.navigate("MedicineDetail", { brandId })
            }
            onAlternativePress={(genericId, genericName) =>
              navigation.navigate("Alternatives", { genericId, genericName })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No medicines detected from prescription</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  summaryCard: {
    backgroundColor: "#2F5BA2",
    margin: 12,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryValue: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  sectionTitle: { fontSize: 16, fontWeight: "600", paddingHorizontal: 12, marginBottom: 8, color: "#1a1a1a" },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
});
