// Electron environment detection
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;

// Node.js modules for Electron
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;
const electron = window.require ? window.require('electron') : null;

// Get the correct path to the shared directory
let sharedPath;
if (isDev) {
  sharedPath = path.join(process.cwd(), 'shared');
} else {
  // In production, use the unpacked shared folder path
  sharedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'shared');
}

// Helper function to get file URL
export const getFileUrl = (filePath) => {
  if (!filePath || !sharedPath || !path) return null;
  
  // Handle both string paths and objects with path property
  const actualPath = typeof filePath === 'string' ? filePath : filePath.path;
  if (!actualPath) return null;
  
  // For Electron, use the protocol:// format
  if (electron) {
    return `app://${actualPath.replace(/\\/g, '/')}`;
  }
  
  // For web, use a relative path
  return `/${actualPath.replace(/\\/g, '/')}`;
};

export default {
  isDev,
  sharedPath,
  fs,
  path,
  electron
};
