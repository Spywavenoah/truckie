declare module "speakeasy" {
  export interface GeneratedSecret {
    ascii: string;
    base32: string;
    hex: string;
    qr_code_ascii?: string;
    qr_code_hex?: string;
    qr_code_base32?: string;
    google_auth_qr?: string;
    otpauth_url?: string;
  }

  export function generateSecret(options?: {
    length?: number;
    name?: string;
    issuer?: string;
    symbols?: boolean;
  }): GeneratedSecret;

  export function totp(options: {
    secret: string;
    encoding: "ascii" | "base32" | "hex";
    token?: string;
    window?: number;
    step?: number;
  }): string;

  export function hotp(options: {
    secret: string;
    counter: number;
    encoding: "ascii" | "base32" | "hex";
  }): string;

  export function verify(options: {
    secret: string;
    encoding: "ascii" | "base32" | "hex";
    token: string;
    window?: number;
    step?: number;
  }): boolean;

  export function generateSecretASCII(
    length?: number,
    symbols?: boolean
  ): string;
}
