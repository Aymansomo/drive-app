import { useState, useEffect } from 'react';
import { getFileUrl } from '../../utils/electronUtils';

function TextInputModal({ 
  title, 
  label, 
  initialValue, 
  includeImage = false, 
  includeVehicleTypes = false, 
  vehicleTypeVisibility = {}, 
  initialVehicleTypes = [], 
  initialImage = null, 
  initialDescription = '', 
  onConfirm, 
  onCancel, 
  includeDescription = false,
  includeThumbnail = false,
  includeVideo = false,
  includePdf = false
}) {
  const [value, setValue] = useState(initialValue || '');
  const [image, setImage] = useState(initialImage || null);
  const [description, setDescription] = useState(initialDescription || '');
  const [vehicleTypes, setVehicleTypes] = useState(initialVehicleTypes || []);
  const [thumbnail, setThumbnail] = useState(null);
  const [video, setVideo] = useState(null);
  const [pdf, setPdf] = useState(null);

  const handleConfirm = () => {
    const data = {
      value,
      image,
      description,
      vehicleTypes,
      thumbnail,
      video,
      pdf
    };
    onConfirm(data);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="modal" dir='rtl'>
      <div className="modal-content">
        <h2>{title}</h2>
        <form onSubmit={handleConfirm}>
          <div className="form-group">
            <label>{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>

          {includeImage && (
            <div className="form-group">
              <label>الصورة</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImage(e.target.files[0]);
                  }
                }}
              />
              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="preview-image"
                />
              )}
            </div>
          )}

          {includeVehicleTypes && (
            <div className="form-group">
              <label>نوع المركبة</label>
              <div className="vehicle-type-checkboxes">
                {Object.entries(vehicleTypeVisibility).map(([type, visible]) => (
                  visible && (
                    <label key={type} className="vehicle-type-label">
                      <input
                        type="checkbox"
                        checked={vehicleTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = [...vehicleTypes];
                          if (e.target.checked) {
                            newTypes.push(type);
                          } else {
                            newTypes.splice(newTypes.indexOf(type), 1);
                          }
                          setVehicleTypes(newTypes);
                        }}
                      />
                      {type}
                    </label>
                  )
                ))}
              </div>
            </div>
          )}

          {includeDescription && (
            <div className="form-group">
              <label>الوصف</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          {includeThumbnail && (
            <div className="form-group">
              <label>الصورة المصغرة</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setThumbnail(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {includeVideo && (
            <div className="form-group">
              <label>الفيديو</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setVideo(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {includePdf && (
            <div className="form-group">
              <label>ملف PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPdf(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={handleCancel} className="cancel-button">
              إلغاء
            </button>
            <button type="submit" className="confirm-button">
              تأكيد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TextInputModal;
