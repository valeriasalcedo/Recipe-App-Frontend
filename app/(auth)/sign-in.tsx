import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../src/auth/AuthContext";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignInScreen = () => {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const loading = authLoading || submitting;

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "El correo es obligatorio.";
    else if (!emailRx.test(email.trim())) e.email = "Ingresa un correo válido.";

    if (!password) e.password = "La contraseña es obligatoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSignIn = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      router.replace("/"); // éxito
    } catch (err: any) {
      // Mensaje legible
      const msg = err?.message?.toLowerCase?.() || "";
      if (
        msg.includes("invalid") ||
        msg.includes("credencial") ||
        msg.includes("correo") ||
        msg.includes("password")
      ) {
        setFormError("Correo o contraseña incorrectos.");
      } else {
        setFormError(err?.message || "No se pudo iniciar sesión.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputErrorStyle = { borderColor: "#ff6b6b", borderWidth: 1 };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/vaca2.png")}
              style={authStyles.image}
              resizeMode="contain"
            />
          </View>
          <Text style={authStyles.title}>Bienvenido/a</Text>

          <View style={authStyles.formContainer}>
            {/* Mensaje de error general */}
            {formError && (
              <View
                style={{
                  backgroundColor: "rgba(255,107,107,0.12)",
                  borderColor: "#ff6b6b",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#ffb3b3" }}>{formError}</Text>
              </View>
            )}

            {/* Email */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, errors.email && inputErrorStyle]}
                placeholder="Correo electrónico"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email)
                    setErrors((e) => ({ ...e, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={{ color: "#ffb3b3", marginTop: 6 }}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[
                  authStyles.textInput,
                  errors.password && inputErrorStyle,
                ]}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password)
                    setErrors((e) => ({ ...e, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
              {errors.password && (
                <Text style={{ color: "#ffb3b3", marginTop: 6 }}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                authStyles.authButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={authStyles.linkText}>
                ¿No tienes cuenta?{" "}
                <Text style={authStyles.link}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;
