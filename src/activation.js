// Import Node.js modules only in Electron environment
const crypto = window.require ? window.require('crypto') : null;
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;
const electron = window.require ? window.require('electron') : null;
const os = window.require ? window.require('os') : null;

// Get the correct path to the shared directory
const appPath = electron ? path.join(
  (electron.remote ? electron.remote.app.getAppPath() : process.cwd()),
  'shared'
) : null;

// Ensure shared directory exists
if (fs && appPath && !fs.existsSync(appPath)) {
  fs.mkdirSync(appPath, { recursive: true });
}

// Generate machine ID based on hardware info
function generateMachineId() {
  try {
    if (!os || !crypto) {
      console.error('Node.js modules not available');
      return 'error-generating-id';
    }

    const networkInterfaces = os.networkInterfaces();
    const macAddress = Object.values(networkInterfaces)
      .flat()
      .find(iface => !iface.internal)?.mac || 'unknown';
    
    const cpuInfo = os.cpus()[0]?.model || 'unknown';
    const totalMem = os.totalmem() || 0;
    
    const machineString = `${macAddress}-${cpuInfo}-${totalMem}`;
    return crypto.createHash('sha256').update(machineString).digest('hex');
  } catch (error) {
    console.error('Error generating machine ID:', error);
    return 'error-generating-id';
  }
}

// Verify activation code
function verifyActivationCode(machineId, activationCode) {
  try {
    if (!crypto) {
      console.error('Crypto module not available');
      return false;
    }

    // This is the same secret key used to generate the code
    const secretKey = 'PERMI-SECRET-KEY-2024';
    const combinedString = `${machineId}-${secretKey}`;
    
    // Generate the expected code
    const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
    const expectedCode = `PERMI-${hash.substring(0, 4).toUpperCase()}-${hash.substring(4, 8).toUpperCase()}`;
    
    return activationCode === expectedCode;
  } catch (error) {
    console.error('Error verifying activation code:', error);
    return false;
  }
}

// Check if machine is activated
function isMachineActivated() {
  try {
    if (!fs || !appPath) {
      console.error('File system not available');
      return false;
    }

    const activationPath = path.join(appPath, 'activation.json');
    if (!fs.existsSync(activationPath)) {
      return false;
    }
    
    const activationData = JSON.parse(fs.readFileSync(activationPath, 'utf-8'));
    const machineId = generateMachineId();
    
    return activationData.machineId === machineId && activationData.activated;
  } catch (error) {
    console.error('Error checking activation:', error);
    return false;
  }
}

// Activate machine with code
function activateMachine(activationCode) {
  try {
    if (!fs || !appPath) {
      console.error('File system not available');
      return { success: false, message: 'نظام الملفات غير متوفر' };
    }

    const machineId = generateMachineId();
    
    if (!verifyActivationCode(machineId, activationCode)) {
      return { success: false, message: 'رمز التفعيل غير صحيح' };
    }
    
    const activationPath = path.join(appPath, 'activation.json');
    const activationData = {
      machineId,
      activated: true,
      activationDate: new Date().toISOString()
    };
    
    fs.writeFileSync(activationPath, JSON.stringify(activationData, null, 2));
    return { success: true, message: 'تم تفعيل الجهاز بنجاح' };
  } catch (error) {
    console.error('Error activating machine:', error);
    return { success: false, message: 'حدث خطأ أثناء التفعيل' };
  }
}

// Get machine ID
function getMachineId() {
  return generateMachineId();
}

export {
  getMachineId,
  isMachineActivated,
  activateMachine
}; 