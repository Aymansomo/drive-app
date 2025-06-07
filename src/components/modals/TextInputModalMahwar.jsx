import { useState, useEffect } from 'react';
import { getFileUrl } from '../../utils/electronUtils';
import './TextInputModalMahwar.css';

function TextInputModalMahwar({ 
  title, 
  label, 
  initialValue, 
  includeImage = false, 
  includeVehicleTypes = false, 
  vehicleTypeVisibility = {}, 
  initialVehicleTypes = [], 
  initialImage = null, 
  onConfirm, 
  onCancel
}) {
  const [value, setValue] = useState(initialValue || '');
  const [image, setImage] = useState(initialImage || null);
  const [vehicleTypes, setVehicleTypes] = useState(initialVehicleTypes || []);

  const handleConfirm = () => {
    const data = {
      value,
      image,
      vehicleTypes
    };
    onConfirm(data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = function(evt) {
          setImage(evt.target.result);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error reading image:', err);
      }
    } else {
      setImage(null);
    }
  };

  const handleVehicleTypeChange = (typeId) => {
    setVehicleTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(t => t !== typeId);
      }
      return [...prev, typeId];
    });
  };

  return (
    <div className="mahwar-modal-overlay" dir='rtl'>
      <div className="mahwar-modal-content">
        <div className="mahwar-modal-header">
          <h2 className="mahwar-modal-title">{title}</h2>
        </div>
        
        <div className="mahwar-modal-body">
          <label className="mahwar-modal-label">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mahwar-modal-input"
          />

          {includeImage && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mahwar-modal-input"
              />
              {image && (
                
                <img
                  src={image}
                  alt="Preview"
                  className="mahwar-modal-image-preview"
                />
              )}
            </div>
          )}

          {includeVehicleTypes && (
            <div className="mahwar-modal-vehicle-types">
              {Object.entries(vehicleTypeVisibility)
                .filter(([_, isVisible]) => isVisible)
                .map(([typeId]) => (
                  <div key={typeId} className="mahwar-vehicle-type-checkbox">
                    <input
                      type="checkbox"
                      checked={vehicleTypes.includes(typeId)}
                      onChange={() => handleVehicleTypeChange(typeId)}
                    />
                    <span className="mahwar-vehicle-type-label">
                      {typeId === "A" ? "دراجة نارية" :
                       typeId === "B" ? "سيارة" :
                       typeId === "C" ? "شاحنة" :
                       typeId === "D" ? "حافلة" :
                       typeId === "EC" ? "شاحنة مع مقطورة" : typeId}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mahwar-modal-buttons">
          <button
            className="mahwar-modal-button mahwar-modal-button-secondary"
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button
            className="mahwar-modal-button mahwar-modal-button-primary"
            onClick={handleConfirm}
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextInputModalMahwar;
