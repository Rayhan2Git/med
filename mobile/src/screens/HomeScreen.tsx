import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getStats, searchMedicines } from "../services/api";
import { getHistory } from "../storage/history";
import { PrescriptionHistory } from "../types";

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ generics: 0, brands: 0, brands_with_price: 0 });
  const [history, setHistory] = useState<PrescriptionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getHistory().then(setHistory).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      navigation.navigate("Search", { query: query.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BD Medicine Price</Text>
        <Text style={styles.subtitle}>Search {stats.brands.toLocaleString()} medicines</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicine name, generic..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.rxButton}
        onPress={() => navigation.navigate("PrescriptionUpload")}
      >
        <Text style={styles.rxIcon}>Rx</Text>
        <View style={styles.rxTextContainer}>
          <Text style={styles.rxTitle}>Upload Prescription</Text>
          <Text style={styles.rxSubtitle}>Take a photo of your prescription</Text>
        </View>
      </TouchableOpacity>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
          <FlatList
            data={history.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() =>
                  navigation.navigate("PrescriptionResult", { result: item })
                }
              >
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString("en-BD")}
                  </Text>
                  <Text style={styles.historyCount}>
                    {item.medicines.length} medicines
                  </Text>
                </View>
                <Text style={styles.historyPrice}>
                  ৳{item.totalPrice.toFixed(2)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { marginTop: 40, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  searchContainer: { flexDirection: "row", marginBottom: 16 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#2F5BA2",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  rxButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#2F5BA2",
    borderStyle: "dashed",
    alignItems: "center",
  },
  rxIcon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F5BA2",
    marginRight: 12,
    fontStyle: "italic",
  },
  rxTextContainer: { flex: 1 },
  rxTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  rxSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  historySection: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: "#1a1a1a" },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  historyCount: { fontSize: 12, color: "#666", marginTop: 2 },
  historyPrice: { fontSize: 16, fontWeight: "600", color: "#2F5BA2" },
});
