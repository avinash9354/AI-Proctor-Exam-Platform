/**
 * QR Code generation utility for mobile pairing
 */

export interface PairingData {
  sessionId: string;
  pairingCode: string;
  expiresAt: number;
  studentId: string;
}

/**
 * Generate a simple QR code data URL using qrserver API
 * Format: data:image/png;base64,...
 */
function generateQRCodeDataUrl(pairingData: PairingData): string {
  // Direct browser URL so scanning with phone camera immediately suggests opening the link
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';
  const targetUrl = `${origin}/proctor?sessionId=${pairingData.sessionId}&code=${pairingData.pairingCode}&studentId=${pairingData.studentId}`;

  // Using qr-server (free, no auth needed)
  const encoded = encodeURIComponent(targetUrl);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
  
  return qrUrl;
}

/**
 * Generate a pairing code (6-digit alphanumeric)
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format pairing data for display
 */
export function formatPairingInfo(data: PairingData): {
  code: string;
  expiresIn: number;
  qrUrl: string;
} {
  const expiresIn = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000));
  return {
    code: data.pairingCode,
    expiresIn,
    qrUrl: generateQRCodeDataUrl(data),
  };
}
