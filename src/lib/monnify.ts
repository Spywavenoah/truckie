import { prisma } from "@/lib/prisma";

let configCache: { apiKey: string; secretKey: string; contractCode: string; baseUrl: string } | null = null;
let configCacheAt = 0;

async function getConfig() {
  if (configCache && Date.now() - configCacheAt < 300_000) return configCache;
  const settings = await prisma.platformSettings.findFirst();
  if (settings?.monnifyApiKey && settings?.monnifySecretKey) {
    configCache = {
      apiKey: settings.monnifyApiKey || "",
      secretKey: settings.monnifySecretKey || "",
      contractCode: settings.monnifyContractCode || "",
      baseUrl: settings.monnifyBaseUrl || "https://sandbox.monnify.com",
    };
  } else {
    configCache = {
      apiKey: process.env.MONNIFY_API_KEY || "",
      secretKey: process.env.MONNIFY_SECRET_KEY || "",
      contractCode: process.env.MONNIFY_CONTRACT_CODE || "",
      baseUrl: process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com",
    };
  }
  configCacheAt = Date.now();
  return configCache;
}

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const cfg = await getConfig();
  const credentials = Buffer.from(`${cfg.apiKey}:${cfg.secretKey}`).toString("base64");
  const res = await fetch(`${cfg.baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Monnify auth failed: ${res.status}`);

  const json = await res.json();
  accessToken = json.responseBody.accessToken;
  tokenExpiresAt = Date.now() + (json.responseBody.expiresIn - 60) * 1000;
  return accessToken!;
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const [token, cfg] = await Promise.all([getAccessToken(), getConfig()]);
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok || !json.requestSuccessful) {
    throw new Error(json.responseMessage || `Monnify API error: ${res.status}`);
  }
  return json.responseBody;
}

export async function provisionVirtualAccount(params: {
  accountName: string;
  accountReference: string;
  customerEmail: string;
  customerName: string;
}) {
  const cfg = await getConfig();
  return apiPost("/api/v2/bank-transfer/reserved-accounts", {
    accountName: params.accountName,
    accountReference: params.accountReference,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    contractCode: cfg.contractCode,
    getAllAvailableBanks: true,
  });
}

export async function singlePayment(params: {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  sourceAccountNumber: string;
}) {
  return apiPost("/api/v1/disbursements/single", {
    amount: params.amount,
    reference: params.reference,
    narration: params.narration,
    destinationBankCode: params.destinationBankCode,
    destinationAccountNumber: params.destinationAccountNumber,
    currency: "NGN",
    sourceAccountNumber: params.sourceAccountNumber,
  });
}

export async function getPaymentStatus(reference: string) {
  const [token, cfg] = await Promise.all([getAccessToken(), getConfig()]);
  const res = await fetch(`${cfg.baseUrl}/api/v2/transactions/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.requestSuccessful) {
    throw new Error(json.responseMessage || "Monnify status check failed");
  }
  return json.responseBody;
}

async function apiGet(path: string) {
  const [token, cfg] = await Promise.all([getAccessToken(), getConfig()]);
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!res.ok || !json.requestSuccessful) {
    throw new Error(json.responseMessage || `Monnify API error: ${res.status}`);
  }
  return json.responseBody;
}

export async function getBanks() {
  const data = await apiGet("/api/v1/banks");
  return (data as Array<{ name: string; code: string }>).map((b) => ({
    bankName: b.name,
    bankCode: b.code,
  }));
}

export async function validateBankAccount(bankCode: string, accountNumber: string) {
  const [token, cfg] = await Promise.all([getAccessToken(), getConfig()]);
  const res = await fetch(`${cfg.baseUrl}/api/v1/disbursements/account/validate?bankCode=${bankCode}&accountNumber=${accountNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (!res.ok || !json.requestSuccessful) {
    throw new Error(json.responseMessage || `Monnify validation error: ${res.status}`);
  }
  return json.responseBody;
}
