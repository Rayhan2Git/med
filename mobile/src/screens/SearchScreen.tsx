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
import { searchMedicines } from "../services/api";
import { Brand } from "../types";
import MedicineCard from "../components/MedicineCard";

export default function SearchScreen({ route, navigation }: any) {
  const { query: initialQuery } = route.params || {};
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchMedicines(q);
      setResults(data.results);
    } catch (e: any) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search medicines..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch(query)}
          returnKeyType="search"
          autoFocus
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2F5BA2" style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MedicineCard
              brand={item}
              onPress={() => navigation.navigate("MedicineDetail", { brandId: item.id })}
            />
          )}
          ListEmptyComponent={
            query ? (
              <Text style={styles.empty}>No medicines found for "{query}"</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchBar: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  loader: { marginTop: 40 },
  error: { textAlign: "center", color: "#e74c3c", marginTop: 40, fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
});
