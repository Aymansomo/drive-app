const crypto = require('crypto');

// This should be the same secret key as in activation.js
const SECRET_KEY = 'PERMI-SECRET-KEY-2024';

function generateActivationCode(machineId) {
  const combinedString = `${machineId}-${SECRET_KEY}`;
  const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
  return `PERMI-${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}`;
}

// Get machine ID from command line argument
const machineId = process.argv[2];

if (!machineId) {
  console.log('Please provide a machine ID as an argument');
  console.log('Usage: node generate-code.js <machine-id>');
  process.exit(1);
}

const activationCode = generateActivationCode(machineId);
console.log('\nMachine ID:', machineId);
console.log('Activation Code:', activationCode, '\n'); 