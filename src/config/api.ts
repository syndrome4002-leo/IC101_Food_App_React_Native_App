import { Platform } from 'react-native';

// On Android emulator, use 10.0.2.2 to reach host machine's localhost.
// On iOS simulator, use localhost directly.
// For physical devices, replace with your machine's local network IP (e.g. 192.168.x.x).
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${HOST}:8000`;
