import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getAlternatives } from "../services/api";
import { Brand } from "../types";
import MedicineCard from "../components/MedicineCard";

export default function AlternativesScreen({ route, navigation }: any) {
  const { genericId, genericName } = route.params;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlternatives(genericId)
      .then((data) => setBrands(data.brands))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genericId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alternatives for {genericName}</Text>
        <Text style={styles.count}>{brands.length} brands found</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2F5BA2" style={styles.loader} />
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.itemContainer}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <MedicineCard
                brand={item}
                onPress={() =>
                  navigation.navigate("MedicineDetail", { brandId: item.id })
                }
                compact
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No alternatives found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  title: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  count: { fontSize: 13, color: "#666", marginTop: 2 },
  loader: { marginTop: 40 },
  itemContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e8f0fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  rankText: { fontSize: 12, fontWeight: "600", color: "#2F5BA2" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
