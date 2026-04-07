import { Platform } from 'react-native';

// On Android emulator, use 10.0.2.2 to reach host machine's localhost.
// On iOS simulator, use localhost directly.
// For physical devices, replace with your machine's local network IP (e.g. 192.168.x.x).
export const API_BASE_URL = `https://ic-101-food-app-server.vercel.app`;