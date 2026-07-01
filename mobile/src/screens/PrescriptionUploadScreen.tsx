import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadPrescription } from "../services/api";

export default function PrescriptionUploadScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const permFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permFn();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera/gallery access is required");
      return;
    }

    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await uploadPrescription({
        uri: image,
        type: "image/jpeg",
        name: "prescription.jpg",
      });
      navigation.replace("PrescriptionResult", { result, thumbnailUri: image });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to process prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Prescription</Text>
      <Text style={styles.subtitle}>Take a photo or select from gallery</Text>

      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity style={styles.removeButton} onPress={() => setImage(null)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {image && (
        <TouchableOpacity
          style={[styles.processButton, loading && styles.processButtonDisabled]}
          onPress={processImage}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.processText}>  Processing...</Text>
            </View>
          ) : (
            <Text style={styles.processText}>Process Prescription</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 24 },
  buttonGroup: { flexDirection: "row", justifyContent: "space-around", marginTop: 40 },
  optionButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: { fontSize: 40, marginBottom: 8 },
  optionText: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  previewContainer: { flex: 1, alignItems: "center", marginTop: 16 },
  preview: { width: "100%", height: 400, borderRadius: 12, backgroundColor: "#e0e0e0" },
  removeButton: { marginTop: 12, padding: 8 },
  removeText: { color: "#e74c3c", fontSize: 14 },
  processButton: {
    backgroundColor: "#2F5BA2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  processButtonDisabled: { opacity: 0.7 },
  processText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
});
