import QRCode from 'qrcode';

export interface DecodedQRTarget {
  type: 'material' | 'shelf' | 'unknown';
  code: string;
  raw: string;
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

export function parseQRCodeText(text: string): DecodedQRTarget {
  const trimmed = text.trim();

  // Try JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'material' && parsed.code) {
        return { type: 'material', code: String(parsed.code).toUpperCase(), raw: trimmed };
      }
      if (parsed.type === 'shelf' && parsed.code) {
        return { type: 'shelf', code: String(parsed.code).toUpperCase(), raw: trimmed };
      }
    } catch {
      // Fall through to plain text parsing
    }
  }

  // Check prefix or known patterns
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('PRAT-') || upper.startsWith('LOC-') || upper.startsWith('SHELF-')) {
    return { type: 'shelf', code: upper, raw: trimmed };
  }

  if (
    upper.startsWith('EPI-') ||
    upper.startsWith('FER-') ||
    upper.startsWith('CON-') ||
    upper.startsWith('SIN-') ||
    upper.startsWith('QUI-') ||
    upper.startsWith('MAT-') ||
    /^\d{4,10}$/.test(trimmed) ||
    /^[A-Z0-9_-]{3,20}$/.test(upper)
  ) {
    return { type: 'material', code: trimmed, raw: trimmed };
  }

  return { type: 'unknown', code: trimmed, raw: trimmed };
}
