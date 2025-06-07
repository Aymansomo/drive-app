import { useState, useEffect, useRef } from 'react'

// Node.js modules for Electron
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

// Get the correct path to the shared directory
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;
let sharedPath;
if (isDev) {
  sharedPath = path.join(process.cwd(), 'shared');
} else {
  sharedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'shared');
}

// Helper function to get file URL
const getFileUrl = (filePath) => {
  if (!filePath || !sharedPath || !path) return null;
  
  // Handle both string paths and objects with path property
  const actualPath = typeof filePath === 'string' ? filePath : filePath.path;
  if (!actualPath) return null;
  
  // For Electron, use the protocol:// format
  if (window.require) {
    return `app://${actualPath.replace(/\\/g, '/')}`;
  }
  
  // For web, use a relative path
  return `/${actualPath.replace(/\\/g, '/')}`;
};

function QuestionForm({ questionData, onChange, onSave }) {
    // Controlled form for editing/adding a question
    const [local, setLocal] = useState(questionData || getEmptyQuestion());
    const mainMediaInputRef = useRef();
    const explanationVideoInputRef = useRef();
    const audioInputRef = useRef();
  
    useEffect(() => {
      setLocal(questionData || getEmptyQuestion());
    }, [questionData]);
  
    const handleChange = (field, value) => {
      const updated = { ...local, [field]: value };
      setLocal(updated);
      onChange && onChange(updated);
    };
  
    const handleCorrectChange = (idx) => {
      let newCorrect = Array.isArray(local.correct) ? [...local.correct] : [];
      if (newCorrect.includes(idx)) {
        newCorrect = newCorrect.filter(i => i !== idx);
      } else {
        newCorrect.push(idx);
      }
      handleChange('correct', newCorrect);
    };
  
    // Main media (image or video) for question display
    const handleMainMediaChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');
          if (!isVideo && !isImage) {
            alert('الرجاء اختيار ملف صورة أو فيديو فقط');
            return;
          }
          const targetDir = isVideo ? 'videos' : 'images';
          const targetDirPath = path.join(sharedPath, targetDir);
          if (!fs.existsSync(targetDirPath)) fs.mkdirSync(targetDirPath);
          const destPath = path.join(targetDirPath, file.name);
          const reader = new FileReader();
          reader.onload = function(evt) {
            const buffer = Buffer.from(evt.target.result);
            fs.writeFileSync(destPath, buffer);
            // Store as mainMedia: { type, path }
            handleChange('mainMedia', {
              type: isVideo ? 'video' : 'image',
              path: `${targetDir}/${file.name}`
            });
          };
          reader.readAsArrayBuffer(file);
        } catch (err) {
          alert('خطأ في حفظ الملف: ' + err.message);
          handleChange('mainMedia', null);
        }
      } else {
        handleChange('mainMedia', null);
      }
    };
  
    // Explanation video for results
    const handleExplanationVideoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');
          if (!isVideo && !isImage) {
            alert('الرجاء اختيار ملف صورة أو فيديو فقط');
            return;
          }
          const targetDir = isVideo ? 'videos' : 'images';
          const targetDirPath = path.join(sharedPath, targetDir);
          if (!fs.existsSync(targetDirPath)) fs.mkdirSync(targetDirPath);
          const destPath = path.join(targetDirPath, file.name);
          const reader = new FileReader();
          reader.onload = function(evt) {
            const buffer = Buffer.from(evt.target.result);
            fs.writeFileSync(destPath, buffer);
            handleChange('explanationMedia', {
              type: isVideo ? 'video' : 'image',
              path: `${targetDir}/${file.name}`
            });
          };
          reader.readAsArrayBuffer(file);
        } catch (err) {
          alert('خطأ في حفظ الملف: ' + err.message);
          handleChange('explanationMedia', null);
        }
      } else {
        handleChange('explanationMedia', null);
      }
    };
  
    const handleAudioChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const audioDir = path.join(sharedPath, 'audio');
          if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);
          const destPath = path.join(audioDir, file.name);
          const reader = new FileReader();
          reader.onload = function(evt) {
            const buffer = Buffer.from(evt.target.result);
            fs.writeFileSync(destPath, buffer);
            handleChange('audio', `audio/${file.name}`);
          };
          reader.readAsArrayBuffer(file);
        } catch (err) {
          alert('خطأ في حفظ الصوت: ' + err.message);
          handleChange('audio', '');
        }
      } else {
        handleChange('audio', '');
      }
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(local);
    };
  
    return (
      <form className="question-form" dir="rtl" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>ملف الصورة أو فيديو:</label>
          <input type="file" accept="image/*,video/*" ref={mainMediaInputRef} onChange={handleMainMediaChange} />
          <span>
            {local.mainMedia
              ? local.mainMedia.type === 'image'
                ? `تم اختيار صورة: ${local.mainMedia.path}`
                : `تم اختيار فيديو: ${local.mainMedia.path}`
              : 'غير موجود'}
          </span>
        </div>
        <div className="form-group">
          <label>ملف الفيديو أو الصورة (شرح):</label>
          <input type="file" accept="video/*,image/*" ref={explanationVideoInputRef} onChange={handleExplanationVideoChange} />
          <span>
            {local.explanationMedia
              ? local.explanationMedia.type === 'image'
                ? `تم اختيار صورة: ${local.explanationMedia.path}`
                : `تم اختيار فيديو: ${local.explanationMedia.path}`
              : 'غير موجود'}
          </span>
          {local.explanationMedia && local.explanationMedia.type === 'image' && (
            <div style={{ marginTop: '10px' }}>
              <img 
                src={getFileUrl(local.explanationMedia.path)} 
                alt="شرح السؤال" 
                style={{
                  maxWidth: '300px',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '5px',
                  backgroundColor: '#f5f5f5'
                }}
              />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>ملف الصوت:</label>
          <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioChange} />
          <span>{local.audio ? local.audio : 'غير موجود'}</span>
        </div>
        <div className="form-group">
          <label>اختر الإجابات الصحيحة:</label>
          <div className="options-grid">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="option-checkbox">
                <input
                  type="checkbox"
                  id={`option-${idx}`}
                  checked={Array.isArray(local.correct) && local.correct.includes(idx)}
                  onChange={() => handleCorrectChange(idx)}
                />
                <label htmlFor={`option-${idx}`}>الإجابة {idx + 1}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>المدة الزمنية (بالثواني):</label>
          <input type="number" min="1" value={local.timeLimit} onChange={e => handleChange('timeLimit', e.target.value)} required />
        </div>
        <button type="submit" className="save-btn">حفظ</button>
      </form>
    );
  }

export default QuestionForm;