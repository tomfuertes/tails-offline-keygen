import { generateMnemonic } from './mnemonic.js';

// Define groups as a global variable
let groups = [
  // group: threshold, shareCount, name
  [1, 1, 'Home'],
  [1, 1, 'Work'],
  [1, 1, 'Bank'],
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

// Export functions and variables
export {
  groups,
  updateGroup,
  updateGroupThreshold,
  removeGroup,
  addGroup,
  editGroupName
};