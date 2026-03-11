/**
 * EwayBill Service
 * Handles authentication and data fetching from the Whitebooks EwayBill API.
 *
 * Auth session is cached by timestamp (AsyncStorage).
 * - If last auth was > 8 hours ago → re-authenticate before fetching.
 * - If getewaybill returns auth-related errors (238, 108) → force re-auth and retry once.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const EWB_AUTH_TIMESTAMP_KEY = 'ewb_auth_timestamp';

// Re-authenticate if last auth was more than 8 hours ago
const EWB_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

// ─── Error codes that indicate an expired / invalid auth session ───────────────
const AUTH_ERROR_CODES = new Set(['238', '108']);

// ─── Env Config ───────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_EWB_BASE_URL!;
const EMAIL = process.env.EXPO_PUBLIC_EWB_EMAIL!;
const USERNAME = process.env.EXPO_PUBLIC_EWB_USERNAME!;
const PASSWORD = process.env.EXPO_PUBLIC_EWB_PASSWORD!;
const IP_ADDRESS = process.env.EXPO_PUBLIC_EWB_IP_ADDRESS!;
const CLIENT_ID = process.env.EXPO_PUBLIC_EWB_CLIENT_ID!;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_EWB_CLIENT_SECRET!;
const GSTIN = process.env.EXPO_PUBLIC_EWB_GSTIN!;

// ─── Shared Headers ───────────────────────────────────────────────────────────
const getHeaders = (): Record<string, string> => ({
  accept: '*/*',
  ip_address: IP_ADDRESS,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  gstin: GSTIN,
});

// ─── Known Error Code Map ──────────────────────────────────────────────────────
const EWB_ERROR_MESSAGES: Record<string, string> = {
  '108': 'Auth session expired or invalid. Re-authenticating automatically…',
  '222': 'Invalid Transporter ID. The GSTIN used for this EWB does not belong to your account.',
  '238': 'Auth token invalid or missing. Re-authenticating automatically…',
  '303': 'Vehicle number is missing on this EWB. Cannot verify vehicle match.',
  '344': 'Invalid EWB number. Please double-check the number and try again.',
};

const resolveEwbError = (errorCode?: string, errorDesc?: string, fallback = ''): string => {
  if (errorCode && EWB_ERROR_MESSAGES[errorCode]) {
    return `Error ${errorCode}: ${EWB_ERROR_MESSAGES[errorCode]}`;
  }
  return errorDesc || fallback;
};

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * Returns true if the cached auth session is still within the 8-hour window.
 */
const isCachedSessionValid = async (): Promise<boolean> => {
  try {
    const timestamp = await AsyncStorage.getItem(EWB_AUTH_TIMESTAMP_KEY);
    if (!timestamp) return false;
    const age = Date.now() - parseInt(timestamp, 10);
    const valid = age < EWB_TOKEN_TTL_MS;
    console.log(`[Ewb Auth] Session age: ${Math.round(age / 60000)}m — ${valid ? 'valid' : 'expired (> 8h)'}`);
    return valid;
  } catch {
    return false;
  }
};

/**
 * Wipes the cached timestamp, forcing the next ensureAuthenticated() call
 * to re-authenticate regardless of age.
 */
const invalidateAuthCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(EWB_AUTH_TIMESTAMP_KEY);
  console.log('[Ewb Auth] Cache invalidated — will re-authenticate on next call.');
};

/**
 * Calls the authenticate endpoint and on success persists the current timestamp.
 */
const authenticate = async (): Promise<void> => {
  const url = new URL(`${BASE_URL}/authenticate`);
  url.searchParams.set('email', EMAIL);
  url.searchParams.set('username', USERNAME);
  url.searchParams.set('password', PASSWORD);

  console.log('[Ewb Auth] Calling authenticate…', url.toString());
  console.log('[Ewb Auth] Headers:', getHeaders());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  });

  const text = await response.text();
  console.log('[Ewb Auth] Status:', response.status);
  console.log('[Ewb Auth] Body:', text);

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('EwayBill authentication failed: Invalid JSON response from server.');
  }

  if (!response.ok || data.status_cd !== '1') {
    throw new Error(
      data.status_desc || data.message || data.error || 'EwayBill authentication failed.'
    );
  }

  // Save timestamp so we know when this session started
  await AsyncStorage.setItem(EWB_AUTH_TIMESTAMP_KEY, String(Date.now()));
  console.log('[Ewb Auth] Authenticated successfully. Timestamp saved.');
};

/**
 * Ensures a valid session exists.
 * Re-authenticates if the last auth was more than 8 hours ago.
 */
const ensureAuthenticated = async (): Promise<void> => {
  const valid = await isCachedSessionValid();
  if (!valid) {
    await authenticate();
  } else {
    console.log('[Ewb Auth] Session still valid — skipping re-auth.');
  }
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface VehicleDetail {
  vehicleNo?: string;
  updMode?: string;
  fromPlace?: string;
  fromState?: number;
  transMode?: string;
  transDocNo?: string;
  transDocDate?: string;
  enteredDate?: string;
  [key: string]: any;
}

export interface EwayBillDetails {
  ewbNo: number | string;
  docNo?: string;
  fromGstin?: string;
  toGstin?: string;
  fromTrdName?: string;
  toTrdName?: string;
  fromAddr1?: string;
  toAddr1?: string;
  fromStateCode?: number;
  toStateCode?: number;
  totInvValue?: number;
  transMode?: string;
  transDistance?: string;
  transDocNo?: string;
  validUpto?: string;
  status?: string;
  VehiclListDetails?: VehicleDetail[];
  [key: string]: any;
}

export interface EwayBillApiResponse {
  status_cd?: string;
  status?: string;
  data?: EwayBillDetails;
  message?: string;
  // error can be a plain string OR an object with a nested JSON string in .message
  error?: string | { message?: string; [key: string]: any };
  // Some error responses use top-level errorCode/errorDesc
  errorCode?: string;
  errorDesc?: string;
}

// ─── Core Fetch (internal) ────────────────────────────────────────────────────

/**
 * Makes the getewaybill network call. Does NOT handle auth — caller is
 * responsible for calling ensureAuthenticated() first.
 *
 * Returns { data, errorCode } so the caller can decide on retry logic.
 */
const fetchEwayBillRaw = async (
  ewbNo: string
): Promise<EwayBillApiResponse> => {
  const url = new URL(`${BASE_URL}/ewayapi/getewaybill`);
  url.searchParams.set('email', EMAIL);
  url.searchParams.set('ewbNo', ewbNo.trim());

  const headers = getHeaders();

  console.log(`[Ewb Lookup] GET ${url.toString()}`);
  console.log(`[Ewb Lookup] Headers:`, headers);

  const response = await fetch(url.toString(), { method: 'GET', headers });

  const text = await response.text();
  console.log(`[Ewb Lookup] Status: ${response.status}`);
  console.log(`[Ewb Lookup] Body:`, text);

  let data: EwayBillApiResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Failed to fetch EWB ${ewbNo}: Invalid JSON response from server.`);
  }

  return data;
};

/**
 * Extracts a normalised error code from ANY shape the API sends back.
 *
 * Known shapes:
 *  A) Top-level: { errorCode: "344", errorDesc: ".." }
 *  B) Nested:    { status_cd: "0", error: { message: "{\"errorCodes\":\"238\"}" } }
 *
 * Returns the code string if found, otherwise undefined.
 */
const extractErrorCode = (data: EwayBillApiResponse): string | undefined => {
  // Shape A — top-level errorCode field
  if (data.errorCode) return data.errorCode;

  // Shape B — error.message is a JSON string containing errorCodes
  try {
    const errObj = data.error;
    if (errObj && typeof errObj === 'object' && errObj.message) {
      const inner = JSON.parse(errObj.message);
      const code = inner.errorCodes ?? inner.errorCode;
      if (code) return String(code);
    }
  } catch {
    // error.message was not parseable JSON — ignore
  }

  return undefined;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch eway bill details. Full auth flow:
 *
 * 1. Re-authenticate if last auth was more than 8 hours ago.
 * 2. Call getewaybill.
 * 3. If the response returns an auth error (238, 108):
 *    - Invalidate the cached timestamp.
 *    - Force a fresh authenticate().
 *    - Retry getewaybill exactly once.
 * 4. For all other errors, throw immediately with a user-readable message.
 */
export const getEwayBillDetails = async (ewbNo: string): Promise<EwayBillDetails> => {
  // Step 1: Ensure session is fresh (re-auths if > 8h old)
  await ensureAuthenticated();

  // Step 2: First attempt
  let data = await fetchEwayBillRaw(ewbNo);
  let errorCode = extractErrorCode(data);

  // Step 3: Auth-related error (238, 108) → force re-auth + single retry
  if (errorCode && AUTH_ERROR_CODES.has(errorCode)) {
    console.log(`[Ewb Lookup] Auth error (${errorCode}) — invalidating cache and re-authenticating…`);
    await invalidateAuthCache();
    await authenticate();

    console.log('[Ewb Lookup] Retrying getewaybill after re-auth…');
    data = await fetchEwayBillRaw(ewbNo);
    errorCode = extractErrorCode(data);
  }

  // Step 4: Any remaining error code → throw user-readable message
  if (errorCode) {
    console.log(`[Ewb Lookup] API Error ${errorCode}`);
    throw new Error(resolveEwbError(errorCode, data.errorDesc, `Failed to fetch EWB ${ewbNo}.`));
  }

  // Step 5: Generic failure (bad status_cd, no data)
  if (data.status_cd === '0' || data.status === 'error' || data.status === '0') {
    const errMsg =
      typeof data.error === 'object' ? data.error?.message : data.error;
    throw new Error(data.message || errMsg || `Failed to fetch EWB ${ewbNo}.`);
  }

  if (!data.data) {
    throw new Error(`No data returned for EWB number ${ewbNo}.`);
  }

  return data.data;
};
