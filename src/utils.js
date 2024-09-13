
export const ethPaths = {
    base: "m/44'/60'",
  bip44: "m/44'/60'/0'/0/0",
  ledgerLive: "m/44'/60'/0'/0/0",
  ledgerLegacy: "m/44'/60'/0'",

    // m/44'/60'
  // m/44'/60'/0'
  // m/44'/60'/0'/0
  // m/44'/60'/0'/0/0
  // m/44'/60'/1'
  // m/44'/60'/1'/0
  // m/44'/60'/1'/0/0
  // m/44'/60'/0'/0/1
  // m/44'/60'/1'/0/1
  // m/44'/60'/0'/0/2
  // m/44'/60'/1'/0
};

export const solanaPaths = {
  base: "m/44'/501'",
  ledgerLive: "m/44'/501'/0'",
  bip44: "m/44'/501'/0'/0'",
  bip44Change: "m/44'/501'/0'/0'/0'",
};

export function checkInput(type) {
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

export function generateRandomDice() {
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
}

// Initialize groups as a global variable
export let groups = [
  // group: threshold, shareCount, name
  [1, 1, 'Home'],
  [1, 1, 'Work'],
  [1, 1, 'Bank'],
  [2, 4, 'Friends'],
  [2, 4, 'Family'],
];

export function updateGroup(groupIndex, change) {
  const [threshold, shareCount] = groups[groupIndex];

  if (change > 0 && threshold === shareCount) {
    groups[groupIndex][0]++; // Increase threshold
    groups[groupIndex][1]++; // Increase shareCount
  } else {
    groups[groupIndex][1] += change;

    if (groups[groupIndex][1] < 1) {
      groups[groupIndex][1] = 1;
    }

    if (groups[groupIndex][0] > groups[groupIndex][1]) {
      groups[groupIndex][0] = groups[groupIndex][1];
    }
  }
}

export function updateGroupThreshold(groupIndex) {
  const thresholdInput = document.getElementById(`threshold-${groupIndex}`);
  const newThreshold = parseInt(thresholdInput.value);
  const shareCount = groups[groupIndex][1];

  if (newThreshold >= 1 && newThreshold <= shareCount) {
    groups[groupIndex][0] = newThreshold;
  } else {
    thresholdInput.value = groups[groupIndex][0];
  }
}

export function removeGroup(groupIndex) {
  groups.splice(groupIndex, 1);
}

export function addGroup() {
  const lastGroup = groups[groups.length - 1];
  const newGroup = [...lastGroup];
  newGroup[2] = `Group ${groups.length + 1}`;
  groups.push(newGroup);
}

export function editGroupName(groupIndex, element) {
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
    } else {
      element.textContent = currentName;
    }
  };

  input.onkeydown = function (event) {
    if (event.key === 'Enter') {
      this.blur();
    } else if (event.key === 'Escape') {
      element.textContent = currentName;
    }
  };

  element.textContent = '';
  element.appendChild(input);
  input.focus();
}
