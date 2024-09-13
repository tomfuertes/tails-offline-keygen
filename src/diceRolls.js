export function getDiceRolls() {
  return document.getElementById('diceInput').value.split('').map(Number);
}

export function diceRollsToBits(rolls) {
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
