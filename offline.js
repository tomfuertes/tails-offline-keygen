import { Keypair } from '@solana/web3.js';
import bip39 from 'bip39';
import { ethers } from 'ethers';
import fs from 'fs';
import QRCode from 'qrcode';
import readline from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as ed25519 from 'ed25519-hd-key';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getDiceRolls(useGuess = false) {
  if (useGuess) {
    console.log('Using random dice rolls for debugging...');
    return Array.from({ length: 200 }, () => Math.floor(Math.random() * 6) + 1);
  }

  return new Promise((resolve) => {
    let allRolls = '';

    const processInput = (input) => {
      allRolls += input.replace(/[^1-6]/g, '');
      if (allRolls.length >= 200) {
        rl.close();
        resolve(allRolls.slice(0, 200).split('').map(Number));
      } else {
        console.log(`Received ${allRolls.length} valid rolls. Need ${200 - allRolls.length} more.`);
        rl.question('Enter more dice rolls (1-6): ', processInput);
      }
    };

    console.log('Enter at least 200 dice rolls (1-6) as a continuous string:');
    rl.question('Dice rolls: ', processInput);
  });
}

function diceRollsToBits(rolls) {
  const rollToBits = {
    1: '00',
    2: '01',
    3: '10',
    4: '11',
    5: '0',
    6: '1',
  };

  let bits = rolls.map((roll) => rollToBits[roll]).join('');
  bits = bits.padEnd(256, '0').slice(0, 256);
  console.log('Generated bits length:', bits.length);
  console.log('First 32 bits:', bits.slice(0, 32));
  console.log('Last 32 bits:', bits.slice(-32));
  return bits;
}

function bitsToMnemonic(bits) {
  console.log('Bits length:', bits.length);
  console.log('First 32 bits:', bits.slice(0, 32));
  console.log('Last 32 bits:', bits.slice(-32));

  if (bits.length !== 256) {
    throw new Error(`Invalid bits length: ${bits.length}. Expected 256 bits.`);
  }

  if (!/^[01]+$/.test(bits)) {
    throw new Error('Invalid bits: should only contain 0 and 1');
  }

  // Convert bits to bytes
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }

  const entropy = Buffer.from(bytes);
  console.log('Entropy buffer length:', entropy.length);
  console.log('Entropy buffer (hex):', entropy.toString('hex'));

  if (entropy.length !== 32) {
    throw new Error(`Invalid entropy length: ${entropy.length}. Expected 32 bytes.`);
  }

  return bip39.entropyToMnemonic(entropy);
}

function generateAddresses(mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const ethPaths = {
    bip44: "m/44'/60'/0'/0/0",
    ledgerLive: "m/44'/60'/0'/0/0",
    ledgerLegacy: "m/44'/60'/0'",
  };

  const solanaPaths = {
    bip44: "m/44'/501'/0'/0'",
    bip44Change: "m/44'/501'/0'/0'/0'",
    bip44ChangeIndex1: "m/44'/501'/0'/0'/1'",
    ledgerLive: "m/44'/501'/0'",
    ledgerLiveIndex1: "m/44'/501'/1'",
  };

  const ethAddresses = Object.fromEntries(
    Object.entries(ethPaths).map(([key, path]) => [
      key,
      { path, address: ethers.HDNodeWallet.fromPhrase(mnemonic, path).address },
    ])
  );

  const deriveSolanaAddress = (path) => {
    const derivedSeed = ed25519.derivePath(path, Buffer.from(seed, 'hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    return keypair.publicKey.toBase58();
  };

  const solanaAddresses = Object.fromEntries(
    Object.entries(solanaPaths).map(([key, path]) => [key, { path, address: deriveSolanaAddress(path) }])
  );

  return { ethAddresses, solanaAddresses };
}

async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

async function generateHTML(addresses, mnemonic) {
  const generateTable = async (title, addressData) => {
    const qrCodes = await Promise.all(Object.values(addressData).map((data) => generateQRCode(data.address)));

    return `
      <h2>${title} Addresses</h2>
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
    <html>
      <head>
        <style>
          table { border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 10px; text-align: center; }
          img { width: 150px; height: 150px; }
        </style>
      </head>
      <body>
        ${ethTable}
        ${solanaTable}
        <h2>Mnemonic</h2>
        <p>${mnemonic}</p>
      </body>
    </html>
  `;
}

async function main() {
  try {
    const argv = yargs(hideBin(process.argv))
      .option('guess', {
        type: 'boolean',
        description: 'Use random dice rolls for debugging',
      })
      .parse();

    const diceRolls = await getDiceRolls(argv.guess);
    const bits = diceRollsToBits(diceRolls);
    console.log('Dice rolls:', diceRolls.join(''));
    const mnemonic = bitsToMnemonic(bits);
    const addresses = generateAddresses(mnemonic);

    const html = await generateHTML(addresses, mnemonic);

    // Create output directory if it doesn't exist
    const outputDir = './output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const filename = `${outputDir}/${new Date().toISOString().replace(/:/g, '-')}.html`;

    fs.writeFileSync(filename, html);
    console.log(`Output saved to ${filename}`);
  } catch (error) {
    console.error('An error occurred:', error);
    console.error('Stack trace:', error.stack);
  }
}

main();
