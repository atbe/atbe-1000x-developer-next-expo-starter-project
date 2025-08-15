# Starter Project - Expo Mobile App

This is the mobile app for Starter Project, built with Expo, React Native, NativeWind (Tailwind CSS), and tRPC.

## Features

- 🎨 Beautiful UI with NativeWind (Tailwind CSS for React Native)
- 🔄 Real-time communication with tRPC
- 🎯 Type-safe API calls
- 📱 Cross-platform (iOS & Android)
- 🚀 Fast and performant

## Tech Stack

- **Expo** - React Native framework
- **NativeWind** - Tailwind CSS for React Native
- **tRPC** - Type-safe API client
- **React Query** - Data fetching and caching
- **Bun** - Package manager

## Getting Started

### Prerequisites

- Bun installed on your machine
- Expo Go app on your phone (for testing)
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Navigate to the expo app directory:
```bash
cd apps/expo-app
```

2. Install dependencies:
```bash
bun install
```

### Running the App

#### Development Server

Start the Expo development server:
```bash
bun run start
```

This will open the Expo developer tools in your browser.

#### Run on iOS (Mac only)

```bash
bun run ios
```

#### Run on Android

```bash
bun run android
```

#### Run on Web

```bash
bun run web
```

### API Configuration

The app is configured to connect to:
- tRPC API: `https://starterp-api-production.abeahmed2.workers.dev`
- WebSocket Server: `wss://starterp-server-prod.abeahmed2.workers.dev`

You can modify these URLs in `lib/trpc/client.ts`.

### Project Structure

```
expo-app/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn-style components
│   └── providers.tsx  # App providers (tRPC, React Query)
├── screens/           # App screens
│   └── LoginScreen.tsx
├── lib/               # Utilities and configurations
│   ├── trpc/         # tRPC client setup
│   └── utils.ts      # Helper functions
├── App.tsx           # Main app component
├── globals.css       # Global styles (NativeWind)
└── tailwind.config.js # Tailwind configuration
```

### Available Components

- **Button** - Customizable button with variants
- **Input** - Text input field
- **Card** - Container component with header, content, and footer
- More components can be added as needed

### Authentication

The app includes a login screen that uses the tRPC `user.login` endpoint. After successful authentication, the JWT token should be stored securely (e.g., using expo-secure-store) and added to the tRPC client headers.

### Development Tips

1. Use the Expo Go app on your phone for quick testing
2. Hot reload is enabled by default
3. Shake your device or press `r` in the terminal to reload
4. Press `m` to open the developer menu

### Building for Production

To create a production build:

```bash
bun run build:ios     # iOS build
bun run build:android # Android build
```

For more detailed build instructions, refer to the [Expo documentation](https://docs.expo.dev/build/introduction/).