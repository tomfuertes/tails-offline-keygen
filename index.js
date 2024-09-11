import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import * as slip39 from 'slip39';

// Replace getDiceRolls function with getDiceRoll
function getDiceRoll() {
  return document.getElementById('diceInput').value;
}

// Add getMnemonic function
function getMnemonic() {
  return document.getElementById('mnemonicInput').value;
}

// Modify generateAddresses function
async function generateAddresses() {
  try {
    const diceRoll = getDiceRoll();
    let mnemonic = getMnemonic();

    if (!mnemonic) {
      if (!diceRoll) {
        alert('Please enter either a dice roll or a mnemonic.');
        return;
      }
      const bits = diceRollsToBits(diceRoll.split('').map(Number));
      mnemonic = bitsToMnemonic(bits);

      // Put the generated mnemonic in the textbox
      document.getElementById('mnemonicInput').value = mnemonic;
    }

    const addresses = generateAddressesFromMnemonic(mnemonic);
    const html = await generateHTML(addresses, mnemonic);

    document.getElementById('output').innerHTML = html;
  } catch (error) {
    console.error('An error occurred:', error);
    alert('An error occurred. Please check the console for details.');
  }
  generateMnemonic();
}

// Remove main function and file writing operations

// Export the generateAddresses function to make it accessible in the browser
window.generateAddresses = generateAddresses;

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

  // Use the Uint8Array directly as entropy
  const entropy = bytes;
  console.log('Entropy array length:', entropy.length);
  console.log(
    'Entropy array (hex):',
    Array.from(entropy)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );

  if (entropy.length !== 32) {
    throw new Error(`Invalid entropy length: ${entropy.length}. Expected 32 bytes.`);
  }

  return bip39.entropyToMnemonic(entropy);
}

function generateAddressesFromMnemonic(mnemonic) {
  // const ethWallet = ethers.Wallet.fromPhrase(mnemonic);
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

async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

function checkInput(type) {
  const diceInput = document.getElementById('diceInput');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const diceCounter = document.getElementById('diceCounter');
  const mnemonicCounter = document.getElementById('mnemonicCounter');

  if (type === 'dice') {
    diceInput.value = diceInput.value.replace(/[^1-6]/g, '');
    const diceCount = diceInput.value.length;
    diceCounter.textContent = `${diceCount}/200 dice rolls`;
  } else if (type === 'mnemonic') {
    const wordCount = mnemonicInput.value.trim().split(/\s+/).length;
    mnemonicCounter.textContent = `${wordCount}/24 words`;
  }
}

function generateRandomDice() {
  const diceInput = document.getElementById('diceInput');
  const mnemonicInput = document.getElementById('mnemonicInput');

  if (diceInput.value.trim() !== '' || mnemonicInput.value.trim() !== '') {
    alert('Error: Both input fields must be empty to generate random dice rolls.');
    return;
  }

  let randomDice = '';
  for (let i = 0; i < 200; i++) {
    randomDice += Math.floor(Math.random() * 6) + 1;
  }
  diceInput.value = randomDice;
  checkInput('dice');
  generateAddresses();
}

// Make functions globally accessible
window.generateAddresses = generateAddresses;
window.diceRollsToBits = diceRollsToBits;
window.bitsToMnemonic = bitsToMnemonic;
window.generateAddressesFromMnemonic = generateAddressesFromMnemonic;
window.generateHTML = generateHTML;
window.generateQRCode = generateQRCode;
window.checkInput = checkInput;
window.generateRandomDice = generateRandomDice;

function generateMnemonic() {
  const passphrase = document.getElementById('passphrase').value;
  const threshold = parseInt(document.getElementById('threshold').value);
  const sharesElement = document.getElementById('shares');
  const shares = sharesElement ? parseInt(sharesElement.value) : 2;

  // Use the existing mnemonic or generate one from dice rolls
  let mnemonic = getMnemonic();
  if (!mnemonic) {
    const diceRoll = getDiceRoll();
    if (!diceRoll) {
      alert('Please enter either a dice roll or a mnemonic.');
      return;
    }
    const bits = diceRollsToBits(diceRoll.split('').map(Number));
    mnemonic = bitsToMnemonic(bits);
  }

  // Get the entropy from the mnemonic
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  console.log('entropy', entropy);

  // Convert entropy to Uint8Array
  const entropyArray = new Uint8Array(entropy.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

  try {
    // Generate Slip39 shares
    const slip39Mnemonic = slip39.fromArray(entropyArray, {
      threshold: threshold,
      passphrase,
      shareCount: shares,
      groups,
    });

    // Display Slip39 output
    const slip39Output = document.getElementById('slip39Output');
    slip39Output.innerHTML = '<h4>Slip39 Output:</h4>';
    slip39Output.innerHTML += '<p><strong>Entropy:</strong> ' + entropy + '</p>';
    slip39Output.innerHTML += '<p><strong>Shares:</strong></p>';

    // Create a table for the shares
    let tableHTML = '<table border="1"><tr><th>Group</th><th>Share</th><th>Mnemonic</th><th>Action</th></tr>';

    slip39Mnemonic.root.children.forEach((group, groupIndex) => {
      const groupThreshold = groups[groupIndex][0];
      const groupShareCount = groups[groupIndex][1];
      const groupName = groups[groupIndex][2];

      tableHTML += `
        <tr>
          <td rowspan="${groupShareCount}">${groupIndex + 1} - ${groupName}</td>
          <td>${1}</td>
          <td>${group.children[0].mnemonic}</td>
          <td rowspan="${groupShareCount}" style="white-space: nowrap;">
            <button onclick="updateGroup(${groupIndex}, -1)" ${groupShareCount <= 1 ? 'disabled' : ''} style="padding: 2px 5px; font-size: 12px;">-</button>
            <input type="number" id="threshold-${groupIndex}" value="${groupThreshold}" min="1" max="${groupShareCount}" onchange="updateGroupThreshold(${groupIndex})" style="width: 30px; padding: 2px; font-size: 12px;">
            <button onclick="updateGroup(${groupIndex}, 1)" style="padding: 2px 5px; font-size: 12px;">+</button>
          </td>
        </tr>
      `;

      // Add nested rows for additional shares
      for (let shareIndex = 1; shareIndex < groupShareCount; shareIndex++) {
        tableHTML += `
          <tr>
            <td>${shareIndex + 1}</td>
            <td>${group.children[shareIndex].mnemonic}</td>
          </tr>
        `;
      }
    });

    tableHTML += '</table>';
    slip39Output.innerHTML += tableHTML;
  } catch (error) {
    console.error('Error generating SLIP-39 shares:', error);
    alert('Error generating SLIP-39 shares. Please check the console for details.');
  }
}

function addSubshare(groupIndex) {
  groups[groupIndex][1]++;
  generateMnemonic();
}

// Make addSubshare function globally accessible
window.addSubshare = addSubshare;

// Add this new function to handle threshold changes
function handleThresholdChange() {
  generateMnemonic();
}

// Add event listener for threshold input
document.getElementById('threshold').addEventListener('change', handleThresholdChange);

// Define groups as a global variable
let groups = [
  // group: threshold, shareCount, name
  [1, 1, 'Home'],
  [1, 1, 'Work'],
  [2, 4, 'Friends'],
  [2, 4, 'Family'],
];

function updateGroup(groupIndex, change) {
  const [threshold, shareCount, name] = groups[groupIndex];
  console.log('updateGroup', name, groupIndex, change);

  if (change > 0 && threshold === shareCount) {
    // If increasing and threshold equals shareCount, increase both
    groups[groupIndex][0]++; // Increase threshold
    groups[groupIndex][1]++; // Increase shareCount
  } else {
    // Otherwise, just change the shareCount
    groups[groupIndex][1] += change;

    // Ensure shareCount is at least 1
    if (groups[groupIndex][1] < 1) {
      groups[groupIndex][1] = 1;
    }

    // Ensure threshold is not greater than shareCount
    if (groups[groupIndex][0] > groups[groupIndex][1]) {
      groups[groupIndex][0] = groups[groupIndex][1];
    }
  }

  generateMnemonic();
}

function updateGroupThreshold(groupIndex) {
  const thresholdInput = document.getElementById(`threshold-${groupIndex}`);
  const newThreshold = parseInt(thresholdInput.value);
  const shareCount = groups[groupIndex][1];

  if (newThreshold >= 1 && newThreshold <= shareCount) {
    groups[groupIndex][0] = newThreshold;
  } else {
    thresholdInput.value = groups[groupIndex][0];
  }
  generateMnemonic();
}

// Make functions globally accessible
window.updateGroup = updateGroup;
window.updateGroupThreshold = updateGroupThreshold;
