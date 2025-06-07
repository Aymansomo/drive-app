import { useState, useEffect, useRef} from 'react';
import { getFileUrl } from "../../utils/electronUtils";

function ResultsView({ exam, selectedAnswers, onBack }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const videoRef = useRef();

  useEffect(() => {
    if (selectedQuestion !== null) {
      // Try to play main media video first
      const mainMediaVideo = document.querySelector('.result-image video');
      if (mainMediaVideo) {
        mainMediaVideo.play().catch((err) => {
          console.error("Error playing main media video:", err);
        });
      }

      // Then try to play explanation video if it exists
      const explanationVideo = videoRef.current;
      if (explanationVideo) {
        explanationVideo.play().catch((err) => {
          console.error("Error playing explanation video:", err);
        });
      }
    }
  }, [selectedQuestion]);
  
  
  // Helper: compare two arrays for equality (order-insensitive)
  function arraysEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  // Multi-select aware answer check
  function isAnswerCorrect(index) {
    const question = exam.questions[index];
    return arraysEqual(selectedAnswers[index], question.correct);
  }

  const correctCount = selectedAnswers ? selectedAnswers.filter((_, index) => isAnswerCorrect(index)).length : 0;
  const scoreClass = correctCount >= 32 ? 'score-value green' : 'score-value red';

  if (!exam || !selectedAnswers) {
    return (
      <div className="results-view" dir="rtl">
        <div className="results-header">
          <h2>خطأ في عرض النتائج</h2>
          <button className="back-button" onClick={onBack}>
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-view" dir="rtl">
      <div className="results-header">
        <h2>نتائج الامتحان</h2>
        <div className="score-display">
          <span className={scoreClass}>{correctCount}/{exam.questions.length}</span>
        </div>
        <button className="back-button" onClick={onBack}>
          العودة للقائمة
        </button>
      </div>

      <div className="results-grid">
        {exam.questions.map((question, index) => (
          <div 
            key={index} 
            className={`question-result ${isAnswerCorrect(index) ? 'correct' : 'incorrect'}`}
            onClick={() => setSelectedQuestion(index)}
          >
            <div className="question-number">سؤال {index + 1}</div>
            {/* Show main media preview (image or video thumbnail) */}
            {question.mainMedia && (
              <div className="result-image">
                {question.mainMedia.type === 'image' ? (
                  <img src={getFileUrl(question.mainMedia.path)} alt={`Question ${index + 1}`} />
                ) : (
                  <video src={getFileUrl(question.mainMedia.path)} controls={false} />
                )}
              </div>
            )}
            <div className="result-status">
              {isAnswerCorrect(index) ? '✓' : '✗'}
            </div>
          </div>
        ))}
      </div>

      {selectedQuestion !== null && (
        <div className="question-details-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setSelectedQuestion(null)}>×</button>
            <h3>تفاصيل السؤال {selectedQuestion + 1}</h3>
            {/* Show explanation media if present */}
            {exam.questions[selectedQuestion].explanationMedia && (
              <div className="preview-explanation">
                <h4>الشرح:</h4>
                {exam.questions[selectedQuestion].explanationMedia.type === 'image' ? (
                  <img 
                    src={getFileUrl(exam.questions[selectedQuestion].explanationMedia.path)}
                    alt="شرح السؤال"
                    className='preview-explanation-image'
                  />
                ) : (
                  <video 
                    ref={videoRef}
                    src={getFileUrl(exam.questions[selectedQuestion].explanationMedia.path)}
                    controls 
                    className='preview-explanation-video'
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            )}
            <div className="answers-comparison">
              <div className="answer-section">
                <h4>إجابتك:</h4>
                <div className="user-answers">
                  {Array.isArray(selectedAnswers[selectedQuestion]) && selectedAnswers[selectedQuestion].length > 0 ? (
                    selectedAnswers[selectedQuestion].map((ansIdx, i) => (
                      <div key={i} className={`answer ${isAnswerCorrect(selectedQuestion) ? 'correct' : 'incorrect'}`}>
                        {exam.questions[selectedQuestion].options[ansIdx] || `الإجابة ${ansIdx + 1}`}
                      </div>
                    ))
                  ) : (
                    <div className="answer incorrect">لم تجب على هذا السؤال</div>
                  )}
                </div>
              </div>
              <div className="answer-section">
                <h4>الإجابة الصحيحة:</h4>
                <div className="correct-answers">
                  {exam.questions[selectedQuestion].correct.map(correctIndex => (
                    <div key={correctIndex} className="answer correct">
                      {exam.questions[selectedQuestion].options[correctIndex] || `الإجابة ${correctIndex + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsView;
