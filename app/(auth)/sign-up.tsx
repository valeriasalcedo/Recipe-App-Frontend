import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth/AuthContext";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpScreen = () => {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "El nombre es obligatorio.";
    if (!email.trim()) e.email = "El correo es obligatorio.";
    else if (!emailRx.test(email.trim())) e.email = "Ingresa un correo válido.";
    if (!password) e.password = "La contraseña es obligatoria.";
    else if (password.length < 8) e.password = "Mínimo 8 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSignUp = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace("/");
    } catch (err: any) {
      // muestra mensaje del backend si existe
      const msg = err?.message || err?.body?.message || "No se pudo crear la cuenta.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputErrorStyle = { borderColor: "#ff6b6b", borderWidth: 1 };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={authStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={authStyles.title}>Create Account</Text>

          <View style={authStyles.formContainer}>

            {/* Mensaje de error general */}
            {formError && (
              <View style={{ backgroundColor: "rgba(255,107,107,0.12)", borderColor: "#ff6b6b", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: "#ffb3b3" }}>{formError}</Text>
              </View>
            )}

            {/* Name */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, errors.name && inputErrorStyle]}
                placeholder="Nombre"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={(t) => { setName(t); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.name && <Text style={{ color: "#ffb3b3", marginTop: 6 }}>{errors.name}</Text>}
            </View>

            {/* Email */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, errors.email && inputErrorStyle]}
                placeholder="Correo electrónico"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={{ color: "#ffb3b3", marginTop: 6 }}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, errors.password && inputErrorStyle]}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={authStyles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
              {errors.password && <Text style={{ color: "#ffb3b3", marginTop: 6 }}>{errors.password}</Text>}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>{loading ? "Creando cuenta..." : "Registrarme"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={authStyles.linkContainer} onPress={() => router.back()}>
              <Text style={authStyles.linkText}>
                ¿Ya tienes cuenta? <Text style={authStyles.link}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;
