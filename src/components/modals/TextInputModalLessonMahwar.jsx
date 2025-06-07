import { useState, useEffect } from 'react';
import { getFileUrl } from '../../utils/electronUtils';
import './TextInputModalLessonMahwar.css';

function TextInputModalLessonMahwar({ 
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
    <div className="lesson-modal-overlay" dir='rtl'>
      <div className="lesson-modal-content">
        <div className="lesson-modal-header">
          <h2 className="lesson-modal-title">{title}</h2>
        </div>
        
        <div className="lesson-modal-body">
          <label className="lesson-modal-label">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="lesson-modal-input"
          />

          {includeImage && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="lesson-modal-input"
              />
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="lesson-modal-image-preview"
                />
              )}
            </div>
          )}

          {includeVehicleTypes && (
            <div className="lesson-modal-vehicle-types">
              {Object.entries(vehicleTypeVisibility)
                .filter(([_, isVisible]) => isVisible)
                .map(([typeId]) => (
                  <div key={typeId} className="lesson-vehicle-type-checkbox">
                    <input
                      type="checkbox"
                      checked={vehicleTypes.includes(typeId)}
                      onChange={() => handleVehicleTypeChange(typeId)}
                    />
                    <span className="lesson-vehicle-type-label">
                      {typeId === "A" ? "A دراجة نارية" :
                       typeId === "B" ? "B سيارة" :
                       typeId === "C" ? "C شاحنة" :
                       typeId === "D" ? "D حافلة" :
                       typeId === "EC" ? "EC شاحنة مع مقطورة" : typeId}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="lesson-modal-buttons">
          <button
            className="lesson-modal-button lesson-modal-button-secondary"
            onClick={onCancel}
          >
            إلغاء
          </button>
          <button
            className="lesson-modal-button lesson-modal-button-primary"
            onClick={handleConfirm}
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextInputModalLessonMahwar;
