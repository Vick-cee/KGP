import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically detect host IP from Expo Go session or use current machine Wi-Fi IP
export const getAutoDetectedHost = () => {
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5000/api`;
      }
    }
  } catch (e) {
    console.log('Error detecting host URI:', e);
  }
  // Default to the computer's current Wi-Fi adapter IP
  return 'http://192.168.43.96:5000/api';
};

export const DEFAULT_BACKEND_URL = getAutoDetectedHost();

const api = axios.create({
  baseURL: DEFAULT_BACKEND_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@officer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error reading auth token:', err);
  }
  return config;
});

// Initialize base URL from AsyncStorage or auto-detected IP
export const initApi = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('@server_url');
    if (savedUrl && savedUrl.trim()) {
      api.defaults.baseURL = savedUrl.trim();
      return savedUrl.trim();
    }
    const detected = getAutoDetectedHost();
    api.defaults.baseURL = detected;
    return detected;
  } catch (err) {
    return DEFAULT_BACKEND_URL;
  }
};

// Set and persist new base URL
export const setApiBaseUrl = async (newUrl) => {
  if (!newUrl) return api.defaults.baseURL;
  let formatted = newUrl.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `http://${formatted}`;
  }
  if (!formatted.includes('/api')) {
    formatted = formatted.replace(/\/+$/, '') + '/api';
  }
  api.defaults.baseURL = formatted;
  await AsyncStorage.setItem('@server_url', formatted);
  return formatted;
};

// Test if server is reachable
export const pingServer = async (testUrl) => {
  const target = testUrl || api.defaults.baseURL;
  const healthUrl = target.endsWith('/api') ? `${target}/health` : `${target}/api/health`;
  const startTime = Date.now();
  try {
    const res = await axios.get(healthUrl, { timeout: 3500 });
    const latency = Date.now() - startTime;
    return { ok: true, latency, data: res.data };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.message || err.message || 'Cannot reach server',
    };
  }
};

export const loginOfficer = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data?.token) {
    await AsyncStorage.setItem('@officer_token', res.data.token);
    await AsyncStorage.setItem('@officer_user', JSON.stringify(res.data.user));
    if (res.data.officerProfile) {
      await AsyncStorage.setItem('@officer_profile', JSON.stringify(res.data.officerProfile));
    }
  }
  return res.data;
};

export const verifyScan = async ({ qrToken, direction = 'ENTRY', gateId }) => {
  const res = await api.post('/scan/verify', { qrToken, direction, gateId });
  return res.data;
};

export const getAssignedGate = async () => {
  const res = await api.get('/gates/my-assignment');
  return res.data;
};

export const getGatesList = async () => {
  const res = await api.get('/gates');
  return res.data;
};

export const getShiftLogs = async () => {
  const res = await api.get('/scan/shift-logs?limit=30');
  return res.data;
};

export const logoutOfficer = async () => {
  await AsyncStorage.removeItem('@officer_token');
  await AsyncStorage.removeItem('@officer_user');
  await AsyncStorage.removeItem('@officer_profile');
  await AsyncStorage.removeItem('@is_demo_mode');
};

// --------------------------------------------------------------------------
// MOCK & OFFLINE SIMULATION SUITE (guarantees offline/demo terminal testing)
// --------------------------------------------------------------------------
export const MOCK_GATES = [
  {
    _id: 'mock-gate-entry',
    name: 'KASU Main Entry Gate',
    code: 'GATE-ENTRY',
    type: 'ENTRY',
    status: 'ACTIVE',
    location: 'Main Campus Tafawa Balewa Way Gate 1',
  },
  {
    _id: 'mock-gate-exit',
    name: 'KASU Main Exit Gate',
    code: 'GATE-EXIT',
    type: 'EXIT',
    status: 'ACTIVE',
    location: 'Main Campus Tafawa Balewa Way Gate 2',
  },
];

export const MOCK_OFFICER_MARCUS = {
  user: {
    _id: 'officer-marcus-01',
    fullName: 'Officer Marcus Bello',
    email: 'officer1@university.edu',
    role: 'GATE_OFFICER',
    phone: '+234 803 123 4567',
  },
  officerProfile: {
    _id: 'prof-marcus-01',
    badgeNumber: 'KASU-SEC-001',
    shift: 'MORNING',
    assignedGateId: MOCK_GATES[0],
  },
  gates: MOCK_GATES,
};

export const MOCK_OFFICER_SARAH = {
  user: {
    _id: 'officer-sarah-02',
    fullName: 'Officer Sarah Danladi',
    email: 'officer2@university.edu',
    role: 'GATE_OFFICER',
    phone: '+234 802 987 6543',
  },
  officerProfile: {
    _id: 'prof-sarah-02',
    badgeNumber: 'KASU-SEC-002',
    shift: 'AFTERNOON',
    assignedGateId: MOCK_GATES[1],
  },
  gates: MOCK_GATES,
};

// Mock pass verification engine for offline demonstration
export const mockVerifyScan = async ({ qrToken, direction = 'ENTRY' }) => {
  // Simulate 350ms network verification latency
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cleanToken = (qrToken || '').trim();
  const isEntry = direction === 'ENTRY';
  const gate = isEntry ? MOCK_GATES[0] : MOCK_GATES[1];

  if (!cleanToken) {
    return {
      success: false,
      isValid: false,
      verificationStatus: 'INVALID',
      failureReason: 'QR token is empty or invalid format.',
      direction,
      gate,
    };
  }

  // Pre-configured mock passes
  if (cleanToken === 'UGP-SUSPENDED-TEST') {
    return {
      success: false,
      isValid: false,
      verificationStatus: 'SUSPENDED',
      movementAction: isEntry ? 'CHECKED_IN' : 'CHECKED_OUT',
      failureReason: 'Pass is currently SUSPENDED by Security Unit due to outstanding verification check.',
      direction,
      gate,
      vehicleDetails: {
        registrationNumber: 'SUS-555-ZZ',
        make: 'Peugeot',
        model: '307',
        colour: 'Black',
        vehicleType: 'CAR',
      },
      ownerDetails: {
        fullName: 'Aliyu Mohammed',
        role: 'STAFF',
        idNumber: 'KASU/STF/2019/088',
        department: 'Bursary Department',
      },
    };
  }

  if (cleanToken === 'UGP-INVALID-FAKE-TOKEN') {
    return {
      success: false,
      isValid: false,
      verificationStatus: 'INVALID',
      failureReason: 'Token not found in database or pass revoked by University Administration.',
      direction,
      gate,
    };
  }

  // Determine vehicle profile based on token or generate realistic sample
  let vehicle = {
    registrationNumber: 'KASU-789-KD',
    make: 'Toyota',
    model: 'Corolla',
    colour: 'Navy Blue',
    vehicleType: 'CAR',
  };
  let owner = {
    fullName: 'Ibrahim Musa Sani',
    role: 'STUDENT',
    idNumber: 'KASU/21/CMP/1042',
    department: 'Computer Science Department',
  };

  if (cleanToken.includes('STAFF') || cleanToken.includes('FAC')) {
    vehicle = {
      registrationNumber: 'FAC-404-OK',
      make: 'Honda',
      model: 'Accord',
      colour: 'Silver',
      vehicleType: 'CAR',
    };
    owner = {
      fullName: 'Dr. Aisha Garba',
      role: 'STAFF',
      idNumber: 'KASU/FAC/SCI/023',
      department: 'Faculty of Science',
    };
  } else if (cleanToken.includes('VISITOR') || cleanToken.includes('VIS')) {
    vehicle = {
      registrationNumber: 'VIS-880-NY',
      make: 'Hyundai',
      model: 'Elantra',
      colour: 'Pearl White',
      vehicleType: 'CAR',
    };
    owner = {
      fullName: 'Alhaji Sani Umar',
      role: 'VISITOR',
      idNumber: 'NIN-98765432101',
      department: 'Official Visit (Vice-Chancellor Office)',
    };
  }

  return {
    success: true,
    isValid: true,
    verificationStatus: 'VALID',
    movementAction: isEntry ? 'CHECKED_IN' : 'CHECKED_OUT',
    movementMessage: isEntry
      ? 'CHECKED IN — ENTRY GRANTED'
      : 'CHECKED OUT — EXIT CLEARED',
    campusStatus: isEntry ? 'INSIDE' : 'OUTSIDE',
    failureReason: '',
    direction,
    gate,
    passDetails: {
      id: 'pass-demo-101',
      passNumber: `KASU-PASS-${cleanToken.slice(0, 8)}`,
      expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      status: 'APPROVED',
      campusStatus: isEntry ? 'INSIDE' : 'OUTSIDE',
      lastAction: isEntry ? 'CHECKED_IN' : 'CHECKED_OUT',
    },
    vehicleDetails: vehicle,
    ownerDetails: owner,
    scannedAt: new Date().toISOString(),
  };
};

export default api;
