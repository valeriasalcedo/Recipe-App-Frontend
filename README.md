#  Recipe App – Frontend (React Native + Expo)

## Descarga & Demo

<p align="center">
  <a href="https://expo.dev/accounts/valeriaasalcedoo/projects/recipe-app/builds/33bcc738-39d8-45ed-b158-48613cf78b63" target="_blank">
    <img src="https://img.shields.io/badge/_Descargar%20APK-blue?style=for-the-badge" alt="Download APK">
  </a>
  &nbsp;
  <a href="https://www.youtube.com/watch?v=your-video-id" target="_blank">
    <img src="https://img.shields.io/badge/_Ver%20Video-purple?style=for-the-badge" alt="YouTubae Video">
  </a>
</p>

Aplicación móvil desarrollada con **React Native + Expo**, diseñada para gestionar y compartir recetas personalizadas.

![Expo](https://img.shields.io/badge/Expo-54-blue)
![ReactNative](https://img.shields.io/badge/React%20Native-Mobile-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Active-success)

Aplicación móvil desarrollada con **React Native (Expo)** que permite a los usuarios **crear, visualizar y gestionar recetas** con imágenes, ingredientes y pasos detallados.  
Incluye autenticación, manejo de tokens, subida de imágenes (Cloudinary o backend), y una interfaz moderna e intuitiva.

---

## 🌟 Funcionalidades principales

-  **Autenticación completa** (registro, login, persistencia y logout)
-  **Gestión de recetas**: crear, editar, eliminar y listar recetas con fotos
-  **Subida de imágenes** mediante `FormData` y `uploadCloudinary.ts`
-  **Contexto global de usuario (`AuthContext`)**
-  **Almacenamiento local seguro** con `AsyncStorage`
-  **Navegación organizada con Expo Router**
-  **Diseño limpio y modular con estilos personalizados**
-  **Búsqueda y filtros de categorías, grupos y recetas favoritas**

---

## 🧱 Estructura del proyecto

```bash
Recipe-App-Frontend/
│
├── app/
│   ├── (auth)/
│   │   ├── _layout.jsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   │
│   ├── (recipes)/
│   │   └── create.jsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.jsx
│   │   ├── create.jsx
│   │   ├── index.jsx
│   │   ├── recipes.jsx
│   │   └── search.tsx
│   │
│   └── recipes/
│       ├── [id].jsx
│       ├── create.jsx
│       └── _layout.jsx
│
├── assets/
│   ├── fonts/
│   ├── images/
│   │   ├── vaca1.png
│   │   ├── vaca2.png
│   │   └── vaca3.png
│   └── styles/
│       ├── auth.styles.ts
│       ├── favorites.styles.ts
│       ├── home.styles.ts
│       └── recipe-detail.styles.ts
│
├── components/
│   ├── Banner.jsx
│   ├── CategoryFilter.jsx
│   ├── GroupModal.jsx
│   ├── LoadingSpinner.jsx
│   ├── NoFavoritesFound.jsx
│   ├── RecipeCard.jsx
│   ├── RecipeForm.jsx
│   ├── RecipeImagesUploader.tsx
│   └── SafeScreen.jsx
│
├── constants/
│   └── colors.js
│
├── hooks/
│   └── useDebounce.js
│
├── services/
│   ├── groupApi.js
│   ├── recipe.service.js
│   ├── recipeAPI.js
│   ├── recipeMapper.js
│   └── uploadCloudinary.ts
│
├── src/
│   └── auth/
│       ├── auth.service.ts
│       ├── AuthContext.tsx
│       └── storage.ts
│
├── package.json
├── tsconfig.json
└── README.md

```

## Instalación y ejecución
### Clonar el repositorio

```bash
git clone https://github.com/valeriasalcedo/Recipe-App-Frontend.git
cd Recipe-App-Frontend
```

## Instalar dependencias
```bash
npm install
```

## Iniciar el proyecto
```bash
npx expo start
```

Esto abrirá Metro Bundler.
Puedes escanear el QR con Expo Go (iOS/Android) o ejecutar en el navegador (w).



##  Stack principal
| Capa | Tecnología |
|------|-------------|
| **Frontend** | React Native (Expo SDK 54) |
| **Backend** | Typescript + Express |
| **Base de datos** | MongoDB |
| **Imágenes** | Cloudinary |
| **Autenticación** | JWT |
| **Estado global** | Context API |
| **Almacenamiento** | AsyncStorage |
