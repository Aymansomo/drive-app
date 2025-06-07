import { useState, useEffect } from 'react';
const { ipcRenderer } = window.require('electron');
const isDev = process.env.NODE_ENV === 'development';

function UpdateNotification() {
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateProgress, setUpdateProgress] = useState(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    if (isDev) return; // Don't set up update listeners in development mode

    // Listen for update status messages
    ipcRenderer.on('update-status', (event, message) => {
      setUpdateStatus(message);
      if (message.includes('Update downloaded')) {
        setShowUpdateNotification(true);
      }
    });

    // Listen for update progress
    ipcRenderer.on('update-progress', (event, progressObj) => {
      setUpdateProgress(progressObj);
    });

    return () => {
      ipcRenderer.removeAllListeners('update-status');
      ipcRenderer.removeAllListeners('update-progress');
    };
  }, []);

  const handleInstallUpdate = () => {
    if (!isDev) {
      ipcRenderer.send('install-update');
    }
  };

  if (isDev || !showUpdateNotification) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <h3>Update Available</h3>
        <p>{updateStatus}</p>
        {updateProgress && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${updateProgress.percent}%` }}
            />
            <span>{Math.round(updateProgress.percent)}%</span>
          </div>
        )}
        <button onClick={handleInstallUpdate}>
          Install and Restart
        </button>
      </div>
    </div>
  );
}

export default UpdateNotification; 