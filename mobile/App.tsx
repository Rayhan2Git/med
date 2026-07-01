import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import MedicineDetailScreen from "./src/screens/MedicineDetailScreen";
import AlternativesScreen from "./src/screens/AlternativesScreen";
import PrescriptionUploadScreen from "./src/screens/PrescriptionUploadScreen";
import PrescriptionResultScreen from "./src/screens/PrescriptionResultScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#2F5BA2" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "BD Medicine Price" }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
        <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: "Medicine" }} />
        <Stack.Screen name="Alternatives" component={AlternativesScreen} options={{ title: "Alternatives" }} />
        <Stack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} options={{ title: "Upload Prescription" }} />
        <Stack.Screen name="PrescriptionResult" component={PrescriptionResultScreen} options={{ title: "Prescription Results" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
