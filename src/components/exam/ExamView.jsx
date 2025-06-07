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

function ExamView({ exam, onFinish, onBack }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [showExamView, setShowExamView] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState(exam.questions[0]?.timeLimit || 15);
    const [locked, setLocked] = useState(false); // Start unlocked
    const [confirmed, setConfirmed] = useState(false);
    const [mediaState, setMediaState] = useState('ready'); // Start ready
    const [audioFinished, setAudioFinished] = useState(false);
    const timerRef = useRef();
    const audioRef = useRef();
    const videoRef = useRef();
  
    const currentQuestion = exam.questions[currentQuestionIndex];
  
    // Handle media sequence
    useEffect(() => {
      setLocked(false);
      setMediaState("ready");
      setAudioFinished(false); // Reset audio finished state
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current = null;
      }
  
      const hasVideo = currentQuestion?.mainMedia?.type === "video";
      const hasAudio = Boolean(currentQuestion?.audio);
  
      // Play audio if present
      const playAudio = () => {
        if (hasAudio) {
          const audioPath = path.join(sharedPath, currentQuestion.audio);
          const audio = new window.Audio(`file://${audioPath.replace(/\\/g, "/")}`);
          audioRef.current = audio;
    
          audio.addEventListener("ended", () => {
            setAudioFinished(true);
            startTimer();
          });
    
          audio.play().catch((err) => {
            console.error("Error playing audio:", err);
            setAudioFinished(true);
            startTimer();
          });
        } else {
          setAudioFinished(true);
          startTimer();
        }
      };
      if (hasVideo) {
        const videoElement = document.querySelector("video");
        if (videoElement) {
          videoRef.current = videoElement;
    
          videoElement.play()
            .then(() => {
              playAudio();
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              playAudio(); // Still play audio if video fails
            });
        } else {
          // fallback if video not ready
          playAudio();
        }
      } else {
        // No video, play audio directly
        playAudio();
      }
    }, [currentQuestionIndex]);
  
    // Timer logic
    const startTimer = () => {
      if (!audioFinished) return; // Don't start timer if audio hasn't finished
  
      setTimeLeft(currentQuestion?.timeLimit || 15);
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setConfirmed(true);
            setTimeout(() => goToNext(), 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };
  
    // Multi-select answer
    const handleSelect = (idx) => {
      if (confirmed) return; // Only check if confirmed
      setSelectedAnswers((prev) => {
        const arr = [...prev];
        const current = Array.isArray(arr[currentQuestionIndex]) ? [...arr[currentQuestionIndex]] : [];
        if (current.includes(idx)) {
          arr[currentQuestionIndex] = current.filter(i => i !== idx);
        } else {
          current.push(idx);
          arr[currentQuestionIndex] = current;
        }
        return arr;
      });
    };
  
    // Reset answer
    const handleReset = () => {
      if (confirmed) return; // Only check if confirmed
      setSelectedAnswers((prev) => {
        const arr = [...prev];
        arr[currentQuestionIndex] = [];
        return arr;
      });
      setConfirmed(false);
    };
  
    // Confirm answer
    const handleConfirm = () => {
      if (confirmed) return; // Only check if confirmed
      setConfirmed(true);
      clearInterval(timerRef.current);
      setTimeout(() => {
        goToNext();
      }, 500);
    };
  
    // Go to next question or finish
    const goToNext = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current = null;
      }
      if (currentQuestionIndex < exam.questions.length - 1) {
        setCurrentQuestionIndex((i) => i + 1);
        setConfirmed(false);
      } else {
        onFinish(selectedAnswers);
      }
    };
  
    // For button highlight
    const isSelected = (idx) => Array.isArray(selectedAnswers[currentQuestionIndex]) && selectedAnswers[currentQuestionIndex].includes(idx);
  
    // Clean up on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current = null;
        }
      };
    }, []);
  
    // Get exam type (if available)
    const examType = exam.type || 'B';
    // Get current question number and total
    const questionNum = currentQuestionIndex + 1;
    const totalQuestions = exam.questions.length;
    // Get remaining time
    const remainingTime = timeLeft;
  
    if (!exam || !exam.questions || !exam.questions[currentQuestionIndex]) {
      return <div className="user-exam-flex">Loading...</div>;
    }
  
    // Component to visualize selected answers
    const AnswerStatusVisualizer = ({ selected }) => {
      const status = Array.isArray(selected) ? selected : [];
      return (
        <div className="answer-status-visualizer">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className={`answer-slot${status.includes(idx) ? ' selected' : ''}`}>
              <span>{idx + 1}</span>
            </div>
          ))}
        </div>
      );
    };
  
    return (
      <>
        <button 
          className="exam-back-button"
          onClick={onBack}
        >
          ← العودة
        </button>
        <div className="user-exam-flex">
          {/* Top: Image */}
          <div className="user-exam-image-area">
            {currentQuestion.mainMedia && currentQuestion.mainMedia.type === 'video' ? (
              <video
                src={getFileUrl(currentQuestion.mainMedia.path)}
                className="user-exam-video"
              />
            ) : currentQuestion.mainMedia && currentQuestion.mainMedia.type === 'image' ? (
              <img
                src={getFileUrl(currentQuestion.mainMedia.path)}
                alt="صورة السؤال"
                className="user-exam-image"
              />
            ) : (
              <div className="user-exam-no-image">لا توجد صورة أو فيديو</div>
            )}
          </div>
          {/* Right: Answer selection panel */}
          <div className="user-exam-panel">
            <AnswerStatusVisualizer selected={selectedAnswers[currentQuestionIndex]} />
            <button
              className="user-exam-reset-btn"
              onClick={handleReset}
              disabled={confirmed}
            >
              تصحيح
            </button>
            <div className="user-exam-panel-nums">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  className={`user-exam-num-btn${
                    isSelected(idx) ? " selected" : ""
                  }`}
                  onClick={() => handleSelect(idx)}
                  disabled={confirmed}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              className="user-exam-confirm-btn"
              onClick={handleConfirm}
              disabled={
                !Array.isArray(selectedAnswers[currentQuestionIndex]) ||
                selectedAnswers[currentQuestionIndex].length === 0 ||
                confirmed
              }
            >
              موافق
            </button>
          </div>
        </div>
        {/* Fixed Bottom Bar */}
        <div className="user-exam-bottom-bar">
          <div className="bottom-bar-item">
            صنف التكوين
            <br />
            <span>{examType}</span>
          </div>
          <div className="bottom-bar-item">
            سؤال
            <br />
            <span>
              {questionNum}/{totalQuestions}
            </span>
          </div>
          <div className="bottom-bar-item">{exam.title}</div>
          <div className="bottom-bar-item">
            الوقت المتبقي
            <br />
            <span>{remainingTime}</span>
          </div>
        </div>
      </>
    );
  }

export default ExamView;