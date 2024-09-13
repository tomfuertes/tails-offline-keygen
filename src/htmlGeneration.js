import QRCode from 'qrcode';

export async function generateHTML(addresses, mnemonic) {
  const generateTable = async (title, addressData) => {
    const qrCodes = await Promise.all(Object.values(addressData).map((data) => generateQRCode(data.address)));

    // Generate a single QR code for all addresses
    const allAddressesQR = await generateQRCode(
      Object.entries(addressData)
        .map(([type, data]) => `${type} (${data.path}) ${data.address}`)
        .join('\n'),
      300
    );

    return `
      <h2>${title} Addresses</h2>
      <h3>All ${title} Addresses QR Code</h3>
      <img src="${allAddressesQR}" alt="All ${title} Addresses QR">
      <table>
        <tr>
          <th>Type</th>
          <th>Derivation Path</th>
          <th>Address</th>
          <th>QR Code</th>
        </tr>
        ${Object.entries(addressData)
          .map(
            ([type, data], index) => `
          <tr>
            <td>${type}</td>
            <td>${data.path}</td>
            <td>${data.address}</td>
            <td><img src="${qrCodes[index]}" alt="${type} QR"></td>
          </tr>
        `
          )
          .join('')}
      </table>
    `;
  };

  const ethTable = await generateTable('Ethereum', addresses.ethAddresses);
  const solanaTable = await generateTable('Solana', addresses.solanaAddresses);

  return `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <style>
        table { border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid black; padding: 10px; text-align: center; }
        img { width: 150px; height: 150px; }
      </style>
      ${ethTable}
      ${solanaTable}
      <!-- <h2>Mnemonic</h2> -->
      <!-- <p>${mnemonic}</p> -->
    </div>
  `;
}

async function generateQRCode(text, size = 150) {
  try {
    return await QRCode.toDataURL(text, { width: size });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
