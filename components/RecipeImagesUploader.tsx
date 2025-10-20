import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, FlatList } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getUploadSignature, uploadToCloudinary } from "../services/uploadCloudinary";
import { cloudinaryThumb } from "../src/utils/cloudinary";

type Props = {
  API_URL: string;
  token: string;
  value: { images: string[]; imagePublicIds: string[] };
  onChange: (next: { images: string[]; imagePublicIds: string[] }) => void;
  maxImages?: number;
};

export default function RecipeImagesUploader({ API_URL, token, value, onChange, maxImages = 6 }: Props) {
  const [loading, setLoading] = useState(false);

  async function pickAndUpload() {
    try {
      if (value.images.length >= maxImages) {
        Alert.alert("Límite", `Máximo ${maxImages} imágenes`);
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];

      // Redimensiona/Comprime en cliente
      setLoading(true);
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1920 } }],     // máx ancho 1920
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 1) Firma
      const sig = await getUploadSignature(API_URL, token);
      // 2) Subir a Cloudinary
      const { url, publicId } = await uploadToCloudinary(
        { uri: manip.uri, type: "image/jpeg", name: "recipe.jpg" },
        sig
      );

      onChange({
        images: [...value.images, url],
        imagePublicIds: [...value.imagePublicIds, publicId],
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo subir la imagen");
    } finally {
      setLoading(false);
    }
  }

  function removeAt(index: number) {
    const nextImages = value.images.filter((_, i) => i !== index);
    const nextPids = value.imagePublicIds.filter((_, i) => i !== index);
    onChange({ images: nextImages, imagePublicIds: nextPids });
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontWeight: "600", fontSize: 16 }}>Imágenes de la receta</Text>

      <FlatList
        horizontal
        data={value.images}
        keyExtractor={(u, i) => `${u}-${i}`}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item, index }) => (
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: cloudinaryThumb(item, { w: 200, h: 200, crop: "fill" }) }}
              style={{ width: 120, height: 120, borderRadius: 10, backgroundColor: "#eee" }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => removeAt(index)}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "rgba(0,0,0,0.6)",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            onPress={pickAndUpload}
            style={{
              width: 120,
              height: 120,
              borderRadius: 10,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#999",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={{ color: "#555", textAlign: "center" }}>+ Agregar</Text>
            )}
          </TouchableOpacity>
        }
      />
    </View>
  );
}
