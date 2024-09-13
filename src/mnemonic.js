import * as bip39 from 'bip39';
import * as slip39 from 'slip39';
import { diceRollsToBits, getDiceRolls } from './diceRolls';
import { groups } from './utils';

export function bitsToMnemonic(bits) {
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

export function getMnemonic() {
  return document.getElementById('mnemonicInput').value;
}

export function generateMnemonic() {
  const passphrase = document.getElementById('passphrase').value;
  const threshold = parseInt(document.getElementById('threshold').value);
  const sharesElement = document.getElementById('shares');
  const shares = sharesElement ? parseInt(sharesElement.value) : 2;

  // Use the existing mnemonic or generate one from dice rolls
  let mnemonic = getMnemonic();
  if (!mnemonic) {
    const diceRoll = getDiceRolls();
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
    let tableHTML =
      '<table border="1"><tr><th>Group</th><th>Share</th><th>Mnemonic</th><th>Action</th><th>Remove</th></tr>';

    slip39Mnemonic.root.children.forEach((group, groupIndex) => {
      const groupThreshold = groups[groupIndex][0];
      const groupShareCount = groups[groupIndex][1];
      const groupName = groups[groupIndex][2];

      tableHTML += `
        <tr>
          <td rowspan="${groupShareCount}" class="editable-cell" ondblclick="editGroupName(${groupIndex}, this)">${groupName}</td>
          <td>${1}</td>
          <td>${group.children[0].mnemonic}</td>
          <td rowspan="${groupShareCount}" class="action-cell">
            <div class="action-buttons">
              <button onclick="updateGroup(${groupIndex}, -1)" ${groupShareCount <= 1 ? 'disabled' : ''} style="padding: 2px 5px; font-size: 12px;">-</button>
              <input type="number" id="threshold-${groupIndex}" value="${groupThreshold}" min="1" max="${groupShareCount}" onchange="updateGroupThreshold(${groupIndex})" style="width: 30px; padding: 2px; font-size: 12px;">
              <button onclick="updateGroup(${groupIndex}, 1)" style="padding: 2px 5px; font-size: 12px;">+</button>
            </div>
          </td>
          <td rowspan="${groupShareCount}" class="remove-cell">
            <button onclick="removeGroup(${groupIndex})" style="color: red; font-weight: bold; padding: 2px 5px; font-size: 12px;">X</button>
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

    // Add a row for adding a new group
    tableHTML += `
      <tr>
        <td colspan="4"></td>
        <td>
          <button onclick="addGroup()" style="color: green; font-weight: bold; padding: 2px 5px; font-size: 12px;">✓</button>
        </td>
      </tr>
    `;

    tableHTML += '</table>';
    slip39Output.innerHTML += tableHTML;
    slip39Output.innerHTML += `
      <style>
        // ... (CSS styles)
      </style>
    `;
  } catch (error) {
    console.error('Error generating SLIP-39 shares:', error);
    alert('Error generating SLIP-39 shares. Please check the console for details.');
  }
}
