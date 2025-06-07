import React, { useState, useEffect } from 'react';
import { getMachineId, activateMachine } from './activation';

function ActivationScreen({ onActivated }) {
  const [machineId, setMachineId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = getMachineId();
    setMachineId(id);
  }, []);

  const handleActivate = () => {
    const result = activateMachine(inputCode);
    if (result.success) {
      onActivated();
    } else {
      setError(result.message);
    }
  };

  const handleDownloadMachineId = () => {
    const element = document.createElement('a');
    const file = new Blob([machineId], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'machine-id.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="activation-screen" style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div className="activation-content" style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#2c3e50',
          marginBottom: '30px',
          fontSize: '24px'
        }}>تفعيل النظام</h2>
        
        <div className="machine-id" style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <p style={{
            color: '#2c3e50',
            marginBottom: '10px',
            fontSize: '16px'
          }}>معرف الجهاز:</p>
          <code style={{
            display: 'block',
            backgroundColor: '#e9ecef',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px',
            wordBreak: 'break-all',
            fontSize: '14px'
          }}>{machineId}</code>
          <button
            onClick={handleDownloadMachineId}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            تحميل معرف الجهاز
          </button>
          <p style={{
            color: '#666',
            marginTop: '15px',
            fontSize: '14px'
          }}>
            يرجى إرسال معرف الجهاز إلى المسؤول للحصول على رمز التفعيل
          </p>
        </div>

        <div className="activation-input" style={{
          marginBottom: '20px'
        }}>
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="أدخل رمز التفعيل"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              marginBottom: '15px',
              fontSize: '16px',
              textAlign: 'center'
            }}
          />
          <button
            onClick={handleActivate}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#27ae60'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2ecc71'}
          >
            تفعيل
          </button>
        </div>

        {error && (
          <div style={{
            color: '#e74c3c',
            backgroundColor: '#fde8e8',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivationScreen; 