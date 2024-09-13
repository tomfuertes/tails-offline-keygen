import { generateAddresses } from './addressGeneration.js';
import { getDiceRolls, diceRollsToBits } from './diceRolls.js';
import { checkInput, generateRandomDice } from './utils.js';
import { bitsToMnemonic, getMnemonic, generateMnemonic } from './mnemonic.js';
import { generateHTML } from './htmlGeneration.js';
import { generateQRCode } from './qrCode.js';

// Expose necessary functions to the global scope
window.getDiceRolls = getDiceRolls;
window.generateAddresses = generateAddresses;
window.checkInput = checkInput;
window.generateRandomDice = generateRandomDice;
window.generateMnemonic = generateMnemonic;
window.diceRollsToBits = diceRollsToBits;
window.bitsToMnemonic = bitsToMnemonic;
window.generateHTML = generateHTML;
window.generateQRCode = generateQRCode;
window.getMnemonic = getMnemonic;
window.generateMnemonic = generateMnemonic;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const generateButton = document.getElementById('generateButton');
  if (generateButton) {
    generateButton.addEventListener('click', generateAddresses);
  }

  const randomDiceButton = document.getElementById('randomDiceButton');
  if (randomDiceButton) {
    randomDiceButton.addEventListener('click', generateRandomDice);
  }

  // Add event listener for threshold input
  const thresholdInput = document.getElementById('threshold');
  if (thresholdInput) {
    thresholdInput.addEventListener('change', generateMnemonic);
  }
});
