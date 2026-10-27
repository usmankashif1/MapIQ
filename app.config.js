import 'dotenv/config';

export default {
  expo: {
    name: "MyApp",
    slug: "MyApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: "com.usmankashif.MyApp"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      name: "MyApp",
      shortName: "MyApp",
      display: "standalone",
      themeColor: "#000000",
      backgroundColor: "#000000"
    },
    plugins: [
      "expo-secure-store",
      "expo-status-bar",
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      ]
    ],
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  }
};