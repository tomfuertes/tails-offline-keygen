import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import * as slip39 from 'slip39';

// Define future slip39 groups as a global variable (configurable in ui after first gen)
let groups = [
  // group: threshold, shareCount, name
  [1, 1, 'Home'],
  [1, 1, 'Work'],
  [1, 1, 'Bank'],
  [2, 4, 'Friends'],
  [2, 4, 'Family'],
];

// Replace getDiceRolls function with getDiceRoll
function getDiceRoll() {
  return document.getElementById('diceInput').value;
}

// Add getMnemonic function
function getMnemonic() {
  return document.getElementById('mnemonicInput').value;
}

function validateDiceRoll(diceRoll) {
  const valid = /^[1-6]{1,200}$/.test(diceRoll);
  if (!valid) {
    showNotification('Dice rolls must be between 1 and 6 and up to 200 rolls.', 'error');
  }
  return valid;
}

// Modify generateAddresses function
async function generateAddresses() {
  try {
    clearNotifications();
    const diceRoll = getDiceRoll();
    let mnemonic = getMnemonic();

    if (!mnemonic) {
      if (!diceRoll) {
        showNotification('Please enter either a dice roll or a mnemonic.', 'error');
        return;
      }
      if (!validateDiceRoll(diceRoll)) {
        showNotification('Invalid dice roll. Please check and try again.', 'error');
        return;
      }
      const bits = diceRollsToBits(diceRoll.split('').map(Number));
      mnemonic = bitsToMnemonic(bits);

      // Put the generated mnemonic in the textbox
      document.getElementById('mnemonicInput').value = mnemonic;
      showNotification('Mnemonic generated from dice rolls.', 'success');
    } else {
      // Validate and correct the mnemonic
      const wordlist = bip39.wordlists.english;

      const words = mnemonic.toLowerCase().trim().split(/\s+/);
      let corrected = false;

      const correctedWords = words.map((word) => {
        if (wordlist.indexOf(word) === -1) {
          // Word not found in wordlist, try to find a close match
          const closestMatch = findClosestMatch(word, wordlist);
          if (closestMatch) {
            corrected = true;
            return { original: word, corrected: closestMatch };
          }
        }
        return { original: word, corrected: word };
      });

      mnemonic = correctedWords.map((w) => w.corrected).join(' ');

      if (corrected) {
        document.getElementById('mnemonicInput').value = mnemonic;
        const corrections = correctedWords
          .filter((w) => w.original !== w.corrected)
          .map((w) => `"${w.original}" to "${w.corrected}"`)
          .join(', ');
        showNotification(`Some words in the mnemonic were corrected: ${corrections}. Please verify.`, 'warning');
      }

      if (!bip39.validateMnemonic(mnemonic)) {
        const invalidWords = words.filter((word) => !wordlist.includes(word));

        if (invalidWords.length > 0) {
          const invalidWordList = invalidWords.join(', ');
          showNotification(`Invalid word(s) in mnemonic: ${invalidWordList}. Please check and try again.`, 'error');
        } else {
          showNotification('Invalid mnemonic. Please check and try again.', 'error');
        }
        return;
      }
    }

    const addresses = generateAddressesFromMnemonic(mnemonic);
    const html = await generateHTML(addresses);

    document.getElementById('output').innerHTML = html;
    showNotification('Addresses generated successfully.', 'success');
  } catch (error) {
    console.error('An error occurred:', error);
    showNotification(`An error occurred: ${error.message}`, 'error');
  }
  generateMnemonic();
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
    'BIP44 Root': "m/44'/60'",
    'Account 0': "m/44'/60'/0'",
    'Account 0 External': "m/44'/60'/0'/0",
    'Account 0 External 0': "m/44'/60'/0'/0/0",
    'Account 1': "m/44'/60'/1'",
    'Account 1 External': "m/44'/60'/1'/0",
    'Account 1 External 0': "m/44'/60'/1'/0/0",
    'Account 0 External 1': "m/44'/60'/0'/0/1",
    'Account 1 External 1': "m/44'/60'/1'/0/1",
    'Account 0 External 2': "m/44'/60'/0'/0/2",
    'Ledger Legacy': "m/44'/60'/0'",
  };

  const solanaPaths = {
    'BIP44 Root': "m/44'/501'",
    'Account 0': "m/44'/501'/0'",
    'Account 0 External': "m/44'/501'/0'/0'",
    'Account 1': "m/44'/501'/1'",
    'Account 1 External': "m/44'/501'/1'/0'",
    'Account 2': "m/44'/501'/2'",
    'Account 2 External': "m/44'/501'/2'/0'",
    'Account 3': "m/44'/501'/3'",
    'Account 3 External': "m/44'/501'/3'/0'",
    'Change Address': "m/44'/501'/0'/0'/0'",
    'Change Address Index 1': "m/44'/501'/0'/0'/1'",
    'Ledger Live': "m/44'/501'/0'",
    'Ledger Live Index 1': "m/44'/501'/1'",
  };

  const ethAddresses = Object.fromEntries(
    Object.entries(ethPaths).map(([key, path]) => [
      key,
      { path, address: ethers.HDNodeWallet.fromPhrase(mnemonic, path).address },
    ])
  );

  const deriveSolanaAddress = (path) => {
    const derivedSeed = ed25519.derivePath(path, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    return keypair.publicKey.toBase58();
  };

  const solanaAddresses = Object.fromEntries(
    Object.entries(solanaPaths).map(([key, path]) => [key, { path, address: deriveSolanaAddress(path) }])
  );

  return { ethAddresses, solanaAddresses };
}

async function generateHTML(addresses) {
  const generateTable = async (title, addressData) => {
    const qrCodes = await Promise.all(Object.values(addressData).map((data) => generateQRCode(data.address)));

    // Generate a single QR code for all addresses
    const allAddressesQR = await generateQRCode(
      Object.entries(addressData)
        // eslint-disable-next-line no-unused-vars
        .map(([_, data]) => `- ${data.path}: ${data.address}`)
        .join('\n'),
      500
    );

    return `
      <h2>${title} Addresses</h2>
      <h3>All ${title} Addresses QR Code</h3>
      <img src="${allAddressesQR}" alt="All ${title} Addresses QR" style="width: 500px; height: 500px;">
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
      ${ethTable}
      ${solanaTable}
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
    showNotification('Both input fields must be empty to generate random dice rolls.', 'warning');
    return;
  }

  let randomDice = '';
  for (let i = 0; i < 200; i++) {
    randomDice += Math.floor(Math.random() * 6) + 1;
  }
  diceInput.value = randomDice;
  checkInput('dice');
  generateAddresses();
  showNotification('Random dice rolls generated successfully.', 'success');
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
      showNotification('Please enter either a dice roll or a mnemonic.', 'error');
      return;
    }
    const bits = diceRollsToBits(diceRoll.split('').map(Number));
    mnemonic = bitsToMnemonic(bits);
  }

  // Get the entropy from the mnemonic
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  console.log('entropy', entropy);

  // Convert entropy to Uint8Array
  const entropyArray = new Uint8Array(32); // Corrected to 32 bytes
  for (let i = 0; i < 32; i++) {
    entropyArray[i] = parseInt(entropy.slice(i * 2, i * 2 + 2), 16);
  }

  try {
    // clearNotifications(); // Clear any existing notifications

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
    showNotification('SLIP-39 shares generated successfully.', 'success');
  } catch (error) {
    console.error('Error generating SLIP-39 shares:', error);
    showNotification(`Error generating SLIP-39 shares: ${error.message}`, 'error');
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
document.addEventListener('DOMContentLoaded', () => {
  const thresholdElement = document.getElementById('threshold');
  if (thresholdElement) {
    thresholdElement.addEventListener('change', handleThresholdChange);
  }
});

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

// Add these new functions
function removeGroup(groupIndex) {
  groups.splice(groupIndex, 1);
  generateMnemonic();
}

function addGroup() {
  const lastGroup = groups[groups.length - 1];
  const newGroup = [...lastGroup]; // Duplicate the last group
  newGroup[2] = `Group ${groups.length + 1}`; // Update the group name
  groups.push(newGroup);
  generateMnemonic();
}

// Make new functions globally accessible
window.removeGroup = removeGroup;
window.addGroup = addGroup;

// Make functions globally accessible
window.updateGroup = updateGroup;
window.updateGroupThreshold = updateGroupThreshold;

// Add this new function to handle group name editing
function editGroupName(groupIndex, element) {
  const currentName = groups[groupIndex][2];
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';

  input.onblur = function () {
    const newName = this.value.trim();
    if (newName && newName !== currentName) {
      groups[groupIndex][2] = newName;
      generateMnemonic();
    } else {
      element.textContent = `${groupIndex + 1} - ${currentName}`;
    }
  };

  input.onkeydown = function (event) {
    if (event.key === 'Enter') {
      this.blur();
    } else if (event.key === 'Escape') {
      element.textContent = `${groupIndex + 1} - ${currentName}`;
    }
  };

  element.textContent = '';
  element.appendChild(input);
  input.focus();
}

// Make the new function globally accessible
window.editGroupName = editGroupName;

/**
 * Show a notification message.
 * @param {string} message - The message to display.
 * @param {string} type - The type of notification ('success', 'warning', 'error').
 */
function showNotification(message, type = 'error') {
  const notificationContainer = document.getElementById('notification');
  if (notificationContainer) {
    // Create a new notification message element
    const notificationMessage = document.createElement('div');
    notificationMessage.classList.add('notification-message', `notification-${type}`);

    // Create the message text
    const messageText = document.createElement('span');
    messageText.textContent = message;

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.classList.add('notification-close');
    closeButton.innerHTML = '&times;'; // × symbol

    // Add event listener to remove the notification when the close button is clicked
    closeButton.addEventListener('click', () => {
      notificationContainer.removeChild(notificationMessage);
      if (notificationContainer.children.length === 0) {
        notificationContainer.style.display = 'none';
      }
    });

    // Append message text and close button to the notification message
    notificationMessage.appendChild(messageText);
    notificationMessage.appendChild(closeButton);

    // Append the new notification message to the container
    notificationContainer.appendChild(notificationMessage);
    notificationContainer.style.display = 'block';

    // If the notification is of type 'success', set a timeout to remove it after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (notificationContainer.contains(notificationMessage)) {
          notificationContainer.removeChild(notificationMessage);
          if (notificationContainer.children.length === 0) {
            notificationContainer.style.display = 'none';
          }
        }
      }, 3000);
    }
  } else {
    console.error('Notification container with id "notification" not found.');
  }
}
/**
 * Clear all notifications.
 */
function clearNotifications() {
  const notificationContainer = document.getElementById('notification');
  if (notificationContainer) {
    // Remove all child elements (notifications)
    notificationContainer.innerHTML = '';
    notificationContainer.style.display = 'none';
  }
}

function findClosestMatch(word, wordlist) {
  // Only consider partial matches for words with 4 or more letters
  if (word.length >= 4) {
    const partialMatches = wordlist.filter((dictWord) => dictWord.startsWith(word));
    if (partialMatches.length > 0) {
      // If there are partial matches, return the shortest one
      return partialMatches.reduce((shortest, current) => (current.length < shortest.length ? current : shortest));
    }
  }

  // If no partial match is found or word is shorter than 4 letters,
  // proceed with Levenshtein distance
  let closestWord = null;
  let minDistance = Infinity;

  for (const dictWord of wordlist) {
    const distance = levenshteinDistance(word, dictWord);
    if (distance < minDistance || (distance === minDistance && dictWord.length < closestWord.length)) {
      minDistance = distance;
      closestWord = dictWord;
    }
  }

  // Only return a match if it's reasonably close (e.g., distance <= 2)
  return minDistance <= 2 ? closestWord : null;
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Make the function globally accessible
window.findClosestMatch = findClosestMatch;
