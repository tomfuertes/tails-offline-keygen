import QRCode from 'qrcode';

export async function generateQRCode(text, size = 150) {
  try {
    return await QRCode.toDataURL(text, { width: size });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
