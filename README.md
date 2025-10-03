
# 🏓 Indor Padel App - App de Control y Recompensas

**Proyecto personal - React Native con Expo SDK 53**  
Autor: Ismael Barbé

---

## 📱 Descripción

Indor Padel App es una aplicación móvil diseñada para un centro deportivo de pádel. Permite a los usuarios:

- Registrarse e iniciar sesión 🔐  
- Generar y visualizar su propio código QR 📱  
- Escanear el código QR del cajero y registrar partidos 🎯  
- Llevar un registro de sus partidos jugados  
- Obtener una hora gratis cada 9 partidos jugados 🏆  
- Editar su perfil y subir una foto desde la cámara 📸  
- Cerrar sesión 🔓  

Incluye almacenamiento local con SQLite y sincronización en Firebase. La app está optimizada para Android con diseño visual en azul, negro y blanco.

---

## 🗂️ Estructura de Carpetas

```
IndorPadelApp/
│
├── assets/                # Imágenes, iconos, video
│
├── src/
│   ├── api/               # Servicios de autenticación
│   ├── components/        # Componentes reutilizables
│   ├── firebase/          # Config de Firebase
│   ├── navigation/        # Stack navigators
│   ├── redux/
│   │   ├── slices/        # authSlice, scanSlice
│   │   └── store.ts       # Configuración Redux Toolkit
│   ├── screens/           # Todas las pantallas (Login, QR, Perfil, etc.)
│   ├── sqlite/            # Configuración y manejo de escaneos persistentes
│   └── types/             # Tipos TypeScript
│
├── App.tsx
├── app.json
├── eas.json
└── README.md
```

---

## 🔧 Tecnologías y Dependencias

### 📦 Core

```bash
npm install
```

### 📱 Navegación

```bash
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
npx expo install @react-navigation/native @react-navigation/native-stack
```

### ⚙️ Redux Toolkit

```bash
npm install @reduxjs/toolkit react-redux
```

### 🔥 Firebase

```bash
npm install firebase
```

### 📸 Cámara y archivos

```bash
npx expo install expo-camera expo-image-picker expo-media-library
```

### 💾 SQLite

```bash
npm install @react-native-sqlite-storage/sqlite
```

---

## 🚀 Cómo correr la app

1. Cloná el repositorio:

```bash
git clone https://github.com/IsmaelBH/IndorPadelApp.git
cd IndorPadelApp
```

2. Instalá las dependencias:

```bash
npm install
```

3. Iniciá Expo:

```bash
npx expo start
```

> Usá **Expo Go** en tu celular Android para escanear el QR y testear la app.

---

## 🛠️ Build para Android

```bash
eas build --platform android --profile production
```

> Necesitás tener configurado el `eas.json` y estar logueado con `npx expo login`.

---

## ✅ Estado del Proyecto

✅ Escaneo QR funcionando correctamente con detección de códigos válidos  
✅ Animación con logo agregado en cada escaneo exitoso  
✅ Modal de cancha gratis al llegar a 10 escaneos  
📦 Firebase, SQLite, Redux y navegación funcionando  
📱 Diseño visual terminado

---

## 📌 Posibles mejoras futuras

- 🧾 Historial de escaneos detallado con fechas  
- 💬 Notificaciones push  
- 🌐 Multilenguaje (es/en)  
- 💳 Reservas con pago en línea

---

## 🧑‍💻 Contacto

📧 ismaelbarbe@gmail.com  
🌐 [GitHub - IsmaelBH](https://github.com/IsmaelBH)

