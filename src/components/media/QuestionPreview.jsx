import React from 'react';
import { getFileUrl } from '../../utils/electronUtils';
import './QuestionPreview.css';

function QuestionPreview({ question }) {
  if (!question || typeof question !== 'object') return <div className="question-preview">لا يوجد سؤال</div>;
  const options = Array.isArray(question.options) ? question.options : ['', '', '', ''];
  const correctArr = Array.isArray(question.correct) ? question.correct : [];

  return (
    <div className="question-preview" dir="rtl">
      <div className="preview-image-area">
        {question.mainMedia && question.mainMedia.type === 'image' ? (
          <img src={getFileUrl(question.mainMedia.path)} alt="صورة السؤال" className="preview-image" />
        ) : question.mainMedia && question.mainMedia.type === 'video' ? (
          <video 
            src={getFileUrl(question.mainMedia.path)} 
            controls 
            className="preview-video"
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        ) : (
          <div className="no-image">لا توجد صورة أو فيديو</div>
        )}
      </div>
      <div className="preview-question-text">
        {question.question || '—'}
      </div>
      <div className="preview-options">
        {options.map((opt, idx) => (
          <div key={idx} className={correctArr.includes(idx) ? 'preview-option correct' : 'preview-option'}>
            <input type="checkbox" disabled checked={correctArr.includes(idx)} readOnly />
            <span>{opt || `الإجابة ${idx + 1}`}</span>
          </div>
        ))}
      </div>
      {question.explanationMedia && (
        <div className="preview-explanation">
          <h4>الشرح:</h4>
          {question.explanationMedia.type === 'image' ? (
            <img 
              src={getFileUrl(question.explanationMedia.path)} 
              className='preview-explanation-image'
              alt="شرح السؤال" 
            />
          ) : (
            <video 
              src={getFileUrl(question.explanationMedia.path)} 
              controls 
              className='preview-explanation-video'
            >
              متصفحك لا يدعم تشغيل الفيديو
            </video>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionPreview;