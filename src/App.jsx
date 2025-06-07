import { useState, useEffect, useRef } from 'react'
import './App.css'
import { isMachineActivated } from './activation'
import ActivationScreen from './ActivationScreen'
import BackButton from './components/backButton'
import QuestionForm from './components/media/QuestionForm'
import ExamView from './components/exam/ExamView'
import ResultsView from './components/exam/ResultsView'
import SplashScreen from './components/ui/SplashScreen'
import VehicleTypeSelection from './components/ui/VehicleTypeSelection'
import ContentTypeSelection from './components/ui/ContentTypeSelection'
import TextInputModal from './components/modals/TextInputModal'
import TextInputModalMahwar from './components/modals/TextInputModalMahwar'
import TextInputModalLessonMahwar from './components/modals/TextInputModalLessonMahwar'
import ConfirmModal from './components/modals/ConfirmModal'
import QuestionPreview from './components/media/QuestionPreview'
import LessonCategoryManager from './components/lesson/LessonCategoryManager'
import UpdateNotification from './components/ui/UpdateNotification'

// Node.js modules for Electron
const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;
const electron = window.require ? window.require('electron') : null;

// Get the correct path to the shared directory
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;
let sharedPath;
if (isDev) {
  sharedPath = path.join(process.cwd(), 'shared');
} else {
  // In production, use the unpacked shared folder path
  sharedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'shared');
}

// Helper function to get file URL
const getFileUrl = (filePath) => {
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

// Ensure shared directories exist (only in Electron environment)
const ensureSharedDirectories = () => {
  if (!fs || !sharedPath || !path) return;
  const imagesDir = path.join(sharedPath, 'images');
  const audioDir = path.join(sharedPath, 'audio');
  const videosDir = path.join(sharedPath, 'videos');

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }
};

// Call this when the app starts (only in Electron environment)
if (electron && fs && path) {
  ensureSharedDirectories();
}

// Move getEmptyQuestion outside of QuestionForm
function getEmptyQuestion() {
  return {
    mahwarId: null,
    image: '',
    audio: '',
    video: '',
    options: ['', '', '', ''],
    correct: [],
    timeLimit: 15
  };
}

function NavigationGrid({ questions, currentIdx, onSelect }) {
  return (
    <div className="navigation-grid">
      {[...Array(questions.length)].map((_, i) => (
        <button
          key={i}
          className={currentIdx === i ? 'nav-btn active' : 'nav-btn'}
          onClick={() => onSelect(i)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}


function App() {
  // All state declarations at the top
  const [selectedRole, setSelectedRole] = useState("user");
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [liveEdit, setLiveEdit] = useState(null);
  const [error, setError] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [showQuestionCountDialog, setShowQuestionCountDialog] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState("");
  const [adminView, setAdminView] = useState("exams");
  const [mahawir, setMahawir] = useState([]);
  const [lessonMahwar, setLessonMahwar] = useState([]);
  const [selectedMahwar, setSelectedMahwar] = useState(null);
  const [mahwarIdForNewExam, setMahwarIdForNewExam] = useState(null);
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [showTextInputModalMahwar, setShowTextInputModalMahwar] = useState(false);
  const [showTextInputModalLessonMahwar, setShowTextInputModalLessonMahwar] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [textInputModalProps, setTextInputModalProps] = useState({
    title: "",
    label: "",
    initialValue: "",
    includeImage: false,
    includeVehicleTypes: false,
    vehicleTypeVisibility: {},
    initialImage: "",
    initialVehicleTypes: [],
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [textInputModalPropsMahwar, setTextInputModalPropsMahwar] = useState({
    title: "",
    label: "",
    initialValue: "",
    includeImage: true,
    includeVehicleTypes: true,
    initialImage: "",
    initialVehicleTypes: [],
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [textInputModalPropsLessonMahwar, setTextInputModalPropsLessonMahwar] = useState({
    title: "",
    label: "",
    initialValue: "",
    includeImage: true,
    includeVehicleTypes: true,
    initialImage: "",
    initialVehicleTypes: [],
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleEditLessonCategory = (categoryId) => {
    const category = lessonCategories.find((c) => c.id === categoryId);
    if (!category) return;

    setTextInputModalProps({
      title: "تعديل سلسلة الدروس",
      label: "عنوان السلسلة",
      initialValue: category.title,
      includeImage: true,
      includeVehicleTypes: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      initialImage: category.image,
      initialVehicleTypes: category.vehicleTypes,
      onConfirm: (title, image, vehicleTypes) => {
        if (title) {
          // Basic validation
          const updatedCategory = {
            ...category,
            title: title,
            image: image || category.image,
            vehicleTypes: vehicleTypes || category.vehicleTypes || [],
          };
          const updatedCategories = lessonCategories.map((c) =>
            c.id === categoryId ? updatedCategory : c
          );
          saveLessonCategories(updatedCategories);
        }
        setShowTextInputModal(false);
      },
      onCancel: () => setShowTextInputModal(false),
    });
    setShowTextInputModal(true);
  };

  const handleDeleteLessonCategory = (categoryId) => {
    setConfirmModalProps({
      message:
        "هل أنت متأكد أنك تريد حذف هذه السلسلة؟ سيتم حذف جميع الدروس المرتبطة بها.",
      onConfirm: () => {
        // First delete all lessons in this category
        const updatedLessons = lessons.filter(
          (l) => l.categoryId !== categoryId
        );
        saveLessons(updatedLessons);

        // Then delete the category
        const updatedCategories = lessonCategories.filter(
          (c) => c.id !== categoryId
        );
        saveLessonCategories(updatedCategories);

        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
    });
    setShowConfirmModal(true);
  };

  const handleViewLessonsInCategory = (category) => {
    setSelectedLessonCategory(category);
    setAdminView("lessons-in-category");
  };
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [showSplash, setShowSplash] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    cin: "KT500120",
    licenseType: "Catégorie B",
    language: "ARABE LITTERAIRE",
    profileImage: "/imageStart.jpg",
  });

  // State for final exam password screen
  const [showFinalExamPassword, setShowFinalExamPassword] = useState(false);
  const [finalExamPassword, setFinalExamPassword] = useState("");
  const [finalExamPasswordError, setFinalExamPasswordError] = useState("");
  const [finalExamStartMessage, setFinalExamStartMessage] = useState("");

  // Add state for 4-digit password
  const [passwordDigits, setPasswordDigits] = useState(["", "", "", ""]);

  // Add state for exam starting screen
  const [showExamStartingScreen, setShowExamStartingScreen] = useState(false);

  // Add this new state
  const [showVehicleTypeSelection, setShowVehicleTypeSelection] =
    useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);

  // Add state for vehicle type visibility (default all visible)
  const [vehicleTypeVisibility, setVehicleTypeVisibility] = useState({
    A: true,
    B: true,
    C: true,
    D: true,
    EC: true,
  });

  // Add state for showing the Mahawir/Lessons selection page
  const [showMahawirOrLessonsSelection, setShowMahawirOrLessonsSelection] =
    useState(false);

  // Add state for lessons
  const [lessons, setLessons] = useState([]);

  // Add state to track the user's current view section (Mahawir or Lessons)
  const [userViewSection, setUserViewSection] = useState(null);

  // Add state for lesson management in admin view
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  // Add state for lesson series
  const [selectedLessonSeries, setSelectedLessonSeries] = useState(null); // State to track the selected series in admin view

  // Add state for viewing lesson details in admin view
  const [selectedLessonForDetails, setSelectedLessonForDetails] =
    useState(null);

  // Add state for handling PDF files
  const [lessonPdfFile, setLessonPdfFile] = useState(null);

  // Function to handle PDF file upload
  const handlePdfFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLessonPdfFile(file);
    }
  };

  // Function to save PDF file
  const savePdfFile = (file) => {
    if (!file) return null;

    if (fs && path && sharedPath) {
      try {
        // Create PDF directory if it doesn't exist
        const pdfDir = path.join(sharedPath, 'pdfs');
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = path.extname(file.name);
        const fileName = `lesson_${timestamp}${extension}`;
        const filePath = path.join(pdfDir, fileName);

        // Save the file
        const buffer = fs.readFileSync(file.path);
        fs.writeFileSync(filePath, buffer);

        // Return the relative path
        return `pdfs/${fileName}`;
      } catch (error) {
        console.error('Error saving PDF file:', error);
        return null;
      }
    }
    return null;
  };

  // Add state for Lesson Categories (similar to Mahawir)
  const [lessonCategories, setLessonCategories] = useState([]);

  // Add state to track the selected Lesson Category in admin view
  const [selectedLessonCategory, setSelectedLessonCategory] = useState(null);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        console.log("Ctrl+Shift+U pressed. Current role:", selectedRole);

        // Always switch to user role and show vehicle type selection
        setSelectedRole("user");
        // Reset all states
        setSelectedExam(null);
        setSelectedMahwar(null);
        setExamResults(null);
        setSelectedLessonCategory(null);
        setSelectedLessonForDetails(null);
        setShowLessonDialog(false);
        setEditingLesson(null);
        setLessonToDelete(null);
        setSelectedLessonSeries(null);
        setAdminView(null);
        // Reset user view states
        setShowMahawirOrLessonsSelection(false);
        setUserViewSection(null);
        // Show vehicle type selection
        setShowVehicleTypeSelection(true);
        setSelectedVehicleType(null);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      console.log("Removing keydown listener.");
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Load user data on component mount
  useEffect(() => {
    if (fs && path && sharedPath) {
      try {
        const userDataPath = path.join(sharedPath, "userData.json");
        if (fs.existsSync(userDataPath)) {
          const data = JSON.parse(fs.readFileSync(userDataPath, "utf-8"));
          setUserData(data);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, []);

  // Check activation status
  useEffect(() => {
    console.log("Checking activation status...");
    const checkActivation = async () => {
      try {
        console.log("Calling isMachineActivated()...");
        const activated = isMachineActivated();
        console.log("Activation status:", activated);
        setIsActivated(activated);
      } catch (error) {
        console.error("Error checking activation:", error);
        setIsActivated(false);
      } finally {
        console.log("Setting isLoading to false");
        setIsLoading(false);
      }
    };
    checkActivation();
  }, []);

  // Load exams, mahawir, lessons, and lesson categories when role changes
  useEffect(() => {
    if (selectedRole) {
      loadExams();
      loadMahawir();
      loadVehicleTypeVisibility(); // Load visibility settings
      loadLessons(); // Load lessons
      loadLessonCategories(); // Load lesson categories
    }
  }, [selectedRole]);

  // Add back the electron IPC event listeners
  useEffect(() => {
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.on("switch-to-admin", () => {
        setSelectedRole("admin");
        // Reset all states when switching to admin
        setSelectedExam(null);
        setCurrentIdx(0);
        setLiveEdit(null);
        setAdminView("exams");
        setSelectedMahwar(null);
        setExamResults(null);
        // Reset lesson-related states
        setSelectedLessonCategory(null);
        setSelectedLessonForDetails(null);
        setShowLessonDialog(false);
        setEditingLesson(null);
        setLessonToDelete(null);
        setSelectedLessonSeries(null);
        // Reset user view states
        setShowVehicleTypeSelection(false);
        setShowMahawirOrLessonsSelection(false);
        setUserViewSection(null);
        // Reload lessons and categories
        loadLessons();
        loadLessonCategories();
      });
      electron.ipcRenderer.on("switch-to-user", () => {
        setSelectedRole("user");
        // Reset all states when switching to user
        setSelectedExam(null);
        setSelectedMahwar(null);
        setExamResults(null);
        // Reset lesson-related states
        setSelectedLessonCategory(null);
        setSelectedLessonForDetails(null);
        setShowLessonDialog(false);
        setEditingLesson(null);
        setLessonToDelete(null);
        setSelectedLessonSeries(null);
        // Reset admin view states
        setAdminView(null);
        // Show vehicle type selection
        setShowVehicleTypeSelection(true);
        setShowMahawirOrLessonsSelection(false);
        setUserViewSection(null);
      });
    }
  }, []);

  // Handle user data updates
  const handleUserDataUpdate = (newData) => {
    setUserData(newData);
    if (fs && path && sharedPath) {
      try {
        const userDataPath = path.join(sharedPath, "userData.json");
        fs.writeFileSync(userDataPath, JSON.stringify(newData, null, 2));
      } catch (error) {
        console.error("Error saving user data:", error);
      }
    }
  };

  // Handle profile image update
  const handleProfileImageUpdate = (e) => {
    const file = e.target.files[0];
    if (file && fs && path && sharedPath) {
      try {
        const imagesDir = path.join(sharedPath, "images");
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
        const destPath = path.join(imagesDir, "profile.jpg");
        const reader = new FileReader();
        reader.onload = function (evt) {
          const buffer = Buffer.from(evt.target.result);
          fs.writeFileSync(destPath, buffer);
          handleUserDataUpdate({
            ...userData,
            profileImage: "images/profile.jpg",
          });
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        alert("خطأ في حفظ الصورة: " + err.message);
      }
    }
  };

  // Define loadExams and loadMahawir functions before using them in useEffect
  const loadExams = () => {
    try {
      const examsPath = path.join(sharedPath, "exams.json");
      if (fs.existsSync(examsPath)) {
        const data = JSON.parse(fs.readFileSync(examsPath, "utf-8"));
        setExams(data);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error("Error loading exams:", error);
      setExams([]);
    }
  };

  const loadMahawir = () => {
    try {
      const mahawirPath = path.join(sharedPath, "mahawir.json");
      if (fs.existsSync(mahawirPath)) {
        const data = JSON.parse(fs.readFileSync(mahawirPath, "utf-8"));
        setMahawir(data);
      } else {
        setMahawir([]);
      }
    } catch (error) {
      console.error("Error loading mahawir:", error);
      setMahawir([]);
    }
  };

  // Add load and save functions for vehicle type visibility
  const loadVehicleTypeVisibility = () => {
    if (fs && path && sharedPath) {
      try {
        const visibilityPath = path.join(sharedPath, "vehicleVisibility.json");
        if (fs.existsSync(visibilityPath)) {
          const data = JSON.parse(fs.readFileSync(visibilityPath, "utf-8"));
          setVehicleTypeVisibility(data);
        } else {
          // Initialize with default visibility if file doesn't exist
          setVehicleTypeVisibility({
            A: true,
            B: true,
            C: true,
            D: true,
            EC: true,
          });
        }
      } catch (error) {
        console.error("Error loading vehicle type visibility:", error);
        // Fallback to default visibility on error
        setVehicleTypeVisibility({
          A: true,
          B: true,
          C: true,
          D: true,
          EC: true,
        });
      }
    }
  };

  const saveVehicleTypeVisibility = (visibilityState) => {
    if (fs && path && sharedPath) {
      try {
        const visibilityPath = path.join(sharedPath, "vehicleVisibility.json");
        fs.writeFileSync(
          visibilityPath,
          JSON.stringify(visibilityState, null, 2)
        );
      } catch (error) {
        console.error("Error saving vehicle type visibility:", error);
      }
    }
  };

  // Add a useEffect to save visibility whenever it changes
  useEffect(() => {
    saveVehicleTypeVisibility(vehicleTypeVisibility);
  }, [vehicleTypeVisibility]);

  // Add load and save functions for lessons
  const loadLessons = () => {
    if (fs && path && sharedPath) {
      try {
        const lessonsPath = path.join(sharedPath, "lessons.json");
        if (fs.existsSync(lessonsPath)) {
          const data = JSON.parse(fs.readFileSync(lessonsPath, "utf-8"));
          setLessons(data);
        } else {
          setLessons([]);
        }
      } catch (error) {
        console.error("Error loading lessons:", error);
        setLessons([]);
      }
    }
  };

  const saveLessons = (updatedLessons) => {
    if (fs && path && sharedPath) {
      try {
        const lessonsPath = path.join(sharedPath, "lessons.json");
        const updatedLessonsWithPdf = updatedLessons.map(lesson => {
          // If this lesson has a PDF path, add it to the lesson object
          if (lesson.pdf?.path) {
            return { ...lesson, pdf: lesson.pdf.path };
          }
          return lesson;
        });

        fs.writeFileSync(lessonsPath, JSON.stringify(updatedLessonsWithPdf, null, 2));
        setLessons(updatedLessonsWithPdf);
      } catch (error) {
        console.error("Error saving lessons:", error);
      }
    }
  };

  // Add load and save functions for Lesson Categories (similar to Mahawir)
  const loadLessonCategories = () => {
    if (fs && path && sharedPath) {
      try {
        const categoriesPath = path.join(sharedPath, "lessonCategories.json");
        if (fs.existsSync(categoriesPath)) {
          const data = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
          setLessonCategories(data);
        } else {
          setLessonCategories([]);
        }
      } catch (error) {
        console.error("Error loading lesson categories:", error);
        setLessonCategories([]);
      }
    }
  };

  const saveLessonCategories = (updatedCategories) => {
    if (fs && path && sharedPath) {
      try {
        const categoriesPath = path.join(sharedPath, "lessonCategories.json");
        fs.writeFileSync(
          categoriesPath,
          JSON.stringify(updatedCategories, null, 2)
        );
        setLessonCategories(updatedCategories); // Update the state after saving
      } catch (error) {
        console.error("Error saving lesson categories:", error);
      }
    }
  };

  // Add lesson management handlers
  const handleAddLesson = (categoryId = null) => {
    setTextInputModalProps({
      title: "إضافة درس جديد",
      label: "عنوان الدرس",
      includeImage: true,
      includeVehicleTypes: true,
      includePdf: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      categoryId: categoryId,
      onConfirm: (title, thumbnail, video, selectedVehicleTypes, pdf) => {
        if (title) {
          const newLesson = {
            id: Date.now().toString(),
            title,
            thumbnail: thumbnail ? thumbnail.path : "",
            video: video ? { path: video.path } : null, // Fix video structure
            pdf: pdf ? { path: pdf.path } : null,
            content: "",
            vehicleTypes: Array.isArray(selectedVehicleTypes)
              ? selectedVehicleTypes
              : [], // Ensure it's an array          
            categoryId: categoryId || null,
          };

          const updatedLessons = [...lessons, newLesson];
          saveLessons(updatedLessons);
        }
        setShowTextInputModal(false);
      },
      onCancel: () => setShowTextInputModal(false),
    });
    setShowTextInputModal(true);
  };

  const handleEditLesson = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (lesson) {
      setTextInputModalProps({
        title: "تعديل الدرس",
        label: "عنوان الدرس",
        initialValue: lesson.title,
        initialDescription: lesson.description,
        includeImage: true,
        includeVehicleTypes: true,
        includePdf: true,
        vehicleTypeVisibility: vehicleTypeVisibility,
        vehicleTypes: lesson.vehicleTypes,
        initialImage: lesson.image,
        initialPdf: lesson.pdf,
        initialThumbnail: lesson.thumbnail,
        initialVideo: lesson.video,
        initialCategoryId: lesson.categoryId,
        onConfirm: (title, thumbnail, video, vehicleTypes, pdf) => {
          {
            console.log("thumbnail 123", lesson.vehicleTypes[0]);
          }
          if (title) {
            const updatedLessons = lessons.map((l) => {
              if (l.id === lessonId) {
                return {
                  ...l,
                  title: title,
                  thumbnail: thumbnail ? { path: thumbnail.path } : l.thumbnail,
                  video: video ? { path: video.path } : l.video,
                  vehicleTypes: vehicleTypes || m.vehicleTypes || [],
                  pdf: pdf ? { path: pdf.path } : l.pdf,
                };
              }
              return l;
            });
            saveLessons(updatedLessons);
          }
          setShowTextInputModal(false);
        },
        onCancel: () => setShowTextInputModal(false),
      });
      setShowTextInputModal(true);
    }
  };

  const handleDeleteLesson = (lessonId) => {
    setConfirmModalProps({
      message: "هل أنت متأكد أنك تريد حذف هذا الدرس؟",
      onConfirm: () => {
        const updatedLessons = lessons.filter((l) => l.id !== lessonId);
        saveLessons(updatedLessons);
        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
    });
    setShowConfirmModal(true);
  };

  // Add handler to view lesson details
  const handleViewLessonDetails = (lesson) => {
    setSelectedLessonForDetails(lesson);
  };

  // Confirm deletion for lesson - simplified
  const handleConfirmLessonDelete = (lessonId) => {
    const updatedLessons = lessons.filter((l) => l.id !== lessonId);
    saveLessons(updatedLessons);
    setShowConfirmModal(false);
  };

  // Modify handleConfirm for general use, check which item is being deleted
  const handleConfirm = () => {
    if (confirmModalProps.onConfirm) {
      // Use the onConfirm function provided in modal props
      confirmModalProps.onConfirm();
    }
    // No need to check lessonToDelete here anymore
    setShowConfirmModal(false); // Always close modal after handling
  };

  // Add new function to handle starting final exam process (show password screen)
  const startFinalExamProcess = () => {
    // Reset password state
    setFinalExamPassword("");
    setFinalExamPasswordError("");
    setFinalExamStartMessage("");
    // Show password input screen
    setShowFinalExamPassword(true);
  };

  // Add new function to create and start final exam after password validation
  const createAndStartFinalExam = () => {
    try {
      // Get all questions from all exams
      const allQuestions = exams.reduce((acc, exam) => {
        // Only include questions if the exam has a questions array
        if (Array.isArray(exam.questions)) {
          return [...acc, ...exam.questions];
        }
        return acc;
      }, []);

      console.log(
        "Total available questions for final exam:",
        allQuestions.length
      ); // Log total questions

      // Handle case where there are no questions
      if (allQuestions.length === 0) {
        setError(
          `لا توجد أسئلة متاحة لإنشاء الامتحان النهائي.`
        );
        setShowFinalExamPassword(false); // Hide password screen
        setFinalExamPassword(""); // Reset password
        return;
      }

      // Shuffle array using Fisher-Yates algorithm
      const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      // Select random questions (up to 40) and set 30 seconds timer for each
      const selectedQuestions = shuffleArray([...allQuestions])
        .slice(0, Math.min(40, allQuestions.length)) // Take up to 40 questions
        .map((question) => ({
          ...question,
          timeLimit: 30, // Set 30 seconds for each question
        }));

      // Create final exam object
      const finalExam = {
        id: `final-${Date.now()}`,
        title: "الامتحان النهائي",
        type: "B FINAL",
        questions: selectedQuestions,
      };

      // Hide password screen and set the selected exam to start the exam view
      setShowFinalExamPassword(false);
      setFinalExamPassword(""); // Reset password after success
      setFinalExamStartMessage(""); // Clear start message
      setSelectedExam(finalExam);
    } catch (error) {
      console.error("Error creating final exam:", error);
      setError("حدث خطأ أثناء إنشاء الامتحان النهائي");
      setShowFinalExamPassword(false); // Hide password screen on error
      setFinalExamPassword(""); // Reset password on error
      setFinalExamStartMessage(""); // Clear start message on error
    }
  };

  // Handle password input
  const handlePasswordInput = (number) => {
    // Only add number if password is less than 4 digits
    if (finalExamPassword.length < 4) {
      const newPassword = finalExamPassword + number;
      setFinalExamPassword(newPassword);
      setFinalExamPasswordError(""); // Clear error on input

      // If 4 digits are entered, automatically submit
      if (newPassword.length === 4) {
        // Use a small timeout to allow state to update and UI to reflect the last digit
        setTimeout(() => {
          handlePasswordSubmit(newPassword); // Pass the new password here
        }, 50);
      }
    }
  };

  // Handle password clear
  const handlePasswordClear = () => {
    setFinalExamPassword("");
    setFinalExamPasswordError("");
  };

  // Handle password submit
  const handlePasswordSubmit = (passwordToSubmit) => {
    if (passwordToSubmit === "1234") {
      setFinalExamPasswordError("");
      setPasswordDigits(["", "", "", ""]);
      setShowExamStartingScreen(true);
      setShowFinalExamPassword(false);
      // Create the exam first, then show the starting screen
      createAndStartFinalExam();
      setTimeout(() => {
        setShowExamStartingScreen(false);
      }, 3000); // 3 seconds
    } else {
      setFinalExamPasswordError("رمز سري خاطئ. حاول مرة أخرى.");
      setPasswordDigits(["", "", "", ""]);
    }
  };

  // Handle closing the password screen
  const handleClosePasswordScreen = () => {
    setShowFinalExamPassword(false);
    setFinalExamPassword("");
    setFinalExamPasswordError("");
    setFinalExamStartMessage("");
  };

  // Handle activation completion
  const handleActivated = () => {
    console.log("Machine activated");
    setIsActivated(true);
  };

  // Handle splash screen completion
  const handleSplashComplete = () => {
    console.log("Splash screen completed");
    setShowSplash(false);
  };

  // Show loading state
  if (isLoading) {
    console.log("Rendering loading state");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: "20px", color: "#333" }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show splash screen first
  if (showSplash) {
    console.log("Rendering splash screen");
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Then show activation screen if not activated
  if (!isActivated) {
    console.log("Rendering activation screen");
    return <ActivationScreen onActivated={handleActivated} />;
  }

  // Move this block here:
  if (showExamStartingScreen) {
    return (
      <div className="exam-starting-overlay">
        <div className="exam-starting-box">
          <div className="exam-starting-french">
            L'examen va commencer
            <br />
            dans quelques secondes
          </div>
          <div className="exam-starting-arabic">
            استعد سيبدأ الإمتحان
            <br />
            بعد قليل
          </div>
        </div>
      </div>
    );
  }

  const handleExamFinish = (selectedAnswers) => {
    setExamResults({
      selectedAnswers: selectedAnswers,
    });
  };

  const saveExams = (updatedExams) => {
    try {
      const examsPath = path.join(sharedPath, "exams.json");
      fs.writeFileSync(examsPath, JSON.stringify(updatedExams, null, 2));
      setExams(updatedExams);
    } catch (error) {
      console.error("Error saving exams:", error);
    }
  };

  const saveMahawir = (updatedMahawir) => {
    try {
      const mahawirPath = path.join(sharedPath, "mahawir.json");
      fs.writeFileSync(mahawirPath, JSON.stringify(updatedMahawir, null, 2));
      setMahawir(updatedMahawir);
    } catch (error) {
      console.error("Error saving mahawir:", error);
    }
  };
  const saveLessonMahwar = (updatedLessonMahwar) => {
    try {
      const lessonMahwarPath = path.join(sharedPath, "lessonMahwar.json");
      fs.writeFileSync(lessonMahwarPath, JSON.stringify(updatedLessonMahwar, null, 2));
      setLessonMahwar(updatedLessonMahwar);
    } catch (error) {
      console.error("Error saving lessonMahwar:", error);
    }
  };

  const renderExamList = (exams) => {
    const uniqueExams = new Map();
    exams.forEach((exam) => {
      if (!uniqueExams.has(exam.id)) {
        uniqueExams.set(exam.id, exam);
      }
    });

    return Array.from(uniqueExams.values()).map((exam) => (
      <div key={exam.id} className="exam-item">
        <div className="exam-info">
          <h3>{exam.title}</h3>
        </div>
        <div className="exam-actions">
          <button
            onClick={() => {
              setSelectedExam(exam);
              setCurrentIdx(0);
              setLiveEdit(exam.questions[0]);
              setIsCreatingNew(false);
              setAdminView("edit-exam");
            }}
            className="edit-button"
          >
            تعديل
          </button>
          <button
            onClick={() => {
              setConfirmModalProps({
                message: "هل أنت متأكد أنك تريد حذف هذا الامتحان؟",
                onConfirm: () => {
                  const updatedExams = exams.filter((e) => e.id !== exam.id);
                  saveExams(updatedExams);
                  setShowConfirmModal(false);
                },
                onCancel: () => setShowConfirmModal(false),
              });
              setShowConfirmModal(true);
            }}
            className="delete-button"
          >
            حذف
          </button>
        </div>
      </div>
    ));
  };

  const handleCreateNewExam = (mahwarId = null) => {
    const mahwar = mahawir.find((m) => m.id === mahwarId);
    if (!mahwar) {
      console.error("Mahwar not found:", mahwarId);
      return;
    }

    setSelectedExamType("");
    setMahwarIdForNewExam(mahwarId);
    setShowQuestionCountDialog(true);

    if (mahwarId) {
      setAdminView("mahwar-exams");
    }
  };

  const handleQuestionCountSubmit = (count) => {
    const mahwar = mahawir.find((m) => m.id === mahwarIdForNewExam);
    if (!selectedExamType) {
      console.error("No exam type selected");
      return;
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${timestamp}_${randomStr}`;

    const examExists = exams.some((exam) => exam.id === uniqueId);
    if (examExists) {
      console.error("Exam with this ID already exists, generating new ID");
      return;
    }

    const newExam = {
      id: uniqueId,
      mahwarId: mahwarIdForNewExam,
      title: `امتحان ${selectedExamType}${mahwar ? ` - ${mahwar.title}` : ""}`,
      type: selectedExamType,
      questions: Array(parseInt(count))
        .fill(null)
        .map(() => ({ ...getEmptyQuestion() })),
    };

    newExam.questions = newExam.questions.map((q) => ({
      ...q,
      mahwarId: mahwarIdForNewExam,
    }));

    const updatedExams = [...exams, newExam];
    saveExams(updatedExams);

    setSelectedExam(newExam);
    setCurrentIdx(0);
    setLiveEdit(newExam.questions[0]);
    setIsCreatingNew(true);
    setShowQuestionCountDialog(false);
    setSelectedExamType("");
    setMahwarIdForNewExam(null);
    setAdminView("edit-exam");
  };

  const handleAddMahwar = () => {
    setTextInputModalPropsMahwar({
      title: "إضافة محور جديد",
      label: "اسم المحور:",
      initialValue: "",
      includeImage: true,
      includeVehicleTypes: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      initialImage: "",
      initialVehicleTypes: [],
      onConfirm: (title, image, vehicleTypes) => {
        if (title) {
          const newMahwar = {
            id: Date.now().toString(),
            title: title,
            image: image || "",
            vehicleTypes: vehicleTypes || [],
          };
          const updatedMahawir = [...mahawir, newMahwar];
          saveMahawir(updatedMahawir);
        }
        setShowTextInputModalMahwar(false);
      },
      onCancel: () => setShowTextInputModalMahwar(false),
    });
    setShowTextInputModalMahwar(true);
  };
  const handleAddLessonMahwar = () => {
    setTextInputModalPropsLessonMahwar({
      title: "إضافة سلسلة دروس جديدة",
      label: "عنوان السلسلة",
      initialValue: "",
      includeImage: true,
      includeVehicleTypes: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      initialImage: "",
      initialVehicleTypes: [],
      onConfirm: (title, image, vehicleTypes) => {
        if (title) {
          const newLessonCategory = {
            id: Date.now().toString(),
            title: title,
            image: image || "",
            vehicleTypes: vehicleTypes || [],
          };
          const updatedLessonCategories = [
            ...lessonCategories,
            newLessonCategory,
          ];
          saveLessonCategories(updatedLessonCategories);
        }
        setShowTextInputModalLessonMahwar(false);
      },
      onCancel: () => setShowTextInputModalLessonMahwar(false),
    });
    setShowTextInputModalLessonMahwar(true);
  };

  const handleViewMahwarExams = (mahwar) => {
    setSelectedMahwar(mahwar);
    setAdminView("mahwar-exams"); // Assuming this is the correct view for admin after selecting mahwar
    // In user view, we will navigate to the exams list for this mahwar
    if (selectedRole === "user") {
      // Set state to show the exams list for the selected mahwar in user view
      // We might need a specific state for this, e.g., selectedUserMahwarForExams
      // For now, let's set selectedMahwar and rely on the render logic
    }
  };

  const handleEditMahwar = (mahwarId) => {
    const mahwar = mahawir.find((m) => m.id === mahwarId);
    if (!mahwar) return;

    setTextInputModalPropsMahwar({
      title: "تعديل المحور",
      label: "اسم المحور:",
      initialValue: mahwar.title,
      includeVehicleTypes: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      includeImage: true,
      initialImage: mahwar.image.path,
      initialVehicleTypes: mahwar.vehicleTypes || [],
      onConfirm: (title, image, vehicleTypes) => {
        if (title) {
          const updatedMahawir = mahawir.map((m) => {
            if (m.id === mahwarId) {
              return {
                ...m,
                title: title,
                image: image || m.image,
                vehicleTypes: vehicleTypes || m.vehicleTypes || [],
              };
            }
            return m;
          });
          saveMahawir(updatedMahawir);
        }
        setShowTextInputModalMahwar(false);
      },
      onCancel: () => setShowTextInputModalMahwar(false),
    });
    setShowTextInputModalMahwar(true);
  };

  const handleDeleteMahwar = (mahwarId) => {
    setConfirmModalProps({
      message:
        "هل أنت متأكد أنك تريد حذف هذا المحور؟ سيتم فصل الامتحانات المرتبطة به ولكن لن يتم حذفها.",
      onConfirm: () => {
        const updatedMahawir = mahawir.filter((m) => m.id !== mahwarId);
        saveMahawir(updatedMahawir);
        const updatedExams = exams.map((exam) =>
          exam.mahwarId === mahwarId ? { ...exam, mahwarId: null } : exam
        );
        saveExams(updatedExams);
        if (selectedMahwar && selectedMahwar.id === mahwarId) {
          setSelectedMahwar(null);
          setAdminView("mahawir");
        }
        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
    });
    setShowConfirmModal(true);
  };

  const handleEditMahwarExam = (exam) => {
    setSelectedExam(exam);
    setCurrentIdx(0);
    setLiveEdit(exam.questions[0]);
    setIsCreatingNew(false);
    setAdminView("edit-exam");
  };

  const handleDeleteMahwarExam = (examId) => {
    setConfirmModalProps({
      message: "هل أنت متأكد أنك تريد حذف هذا الامتحان؟",
      onConfirm: () => {
        const updatedExams = exams.filter((e) => e.id !== examId);
        saveExams(updatedExams);
        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
    });
    setShowConfirmModal(true);
  };

  const handleSaveQuestion = (question) => {
    if (!selectedExam) return;

    const updatedQuestions = [...selectedExam.questions];
    updatedQuestions[currentIdx] = question;

    const updatedExam = {
      ...selectedExam,
      questions: updatedQuestions,
    };

    const updatedExams = exams.map((exam) =>
      exam.id === updatedExam.id ? updatedExam : exam
    );

    saveExams(updatedExams);
    setSelectedExam(updatedExam);
  };

  // Render final exam password screen if needed
  if (showFinalExamPassword) {
    return (
      <div
        className="final-exam-password-screen"
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#7daaec",
          padding: "20px",
        }}
      >
        {/* Flex container for password and identification details */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            alignItems: "flex-start",
          }}
        >
          {/* Identification Details Section */}
          <div
            className="identification-details"
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            {/* Profile Image at the top */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <img
                src={getFileUrl(userData.profileImage)}
                alt="صورة المستخدم"
                style={{
                  width: "440px",
                  height: "240px",
                  borderRadius: "16px",
                  background: "#e0e0e0",
                  objectFit: "cover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
            </div>
            <h2
              style={{
                color: "#2c3e50",
                marginBottom: "20px",
                fontSize: "22px",
              }}
            >
              بيانات المستخدم
            </h2>

            {/* Container for the detail rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                width: "inherit",
                gap: "10px",
              }}
            >
              {/* Detail Row: CIN */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  gap: "10px",
                  width: "inherit",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "12px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  رقم البطاقة الوطنية{" "}
                </div>
                <div
                  style={{
                    backgroundColor: "#3498db",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "16px",
                    color: "white",
                    fontWeight: "bold",
                    flexGrow: 1,
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {userData.cin}
                </div>
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "120px",
                    textAlign: "left",
                  }}
                >
                  N° CIN
                </div>
              </div>

              {/* Detail Row: License Type */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "inherit",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  نوع الرخصة
                </div>
                <div
                  style={{
                    backgroundColor: "#3498db",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "16px",
                    color: "white",
                    fontWeight: "bold",
                    flexGrow: 1,
                    textAlign: "center",
                  }}
                >
                  {userData.licenseType}
                </div>
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "120px",
                    textAlign: "left",
                  }}
                >
                  Type Permis
                </div>
              </div>

              {/* Detail Row: Language */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "inherit",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  اللغة
                </div>
                <div
                  style={{
                    backgroundColor: "#3498db",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "16px",
                    color: "white",
                    fontWeight: "bold",
                    flexGrow: 1,
                    textAlign: "center",
                  }}
                >
                  {userData.language}
                </div>
                <div
                  style={{
                    backgroundColor: "#ecf0f1",
                    padding: "8px 15px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    color: "#2c3e50",
                    fontWeight: "bold",
                    minWidth: "120px",
                    textAlign: "left",
                  }}
                >
                  Langue
                </div>
              </div>
            </div>
          </div>

          {/* Custom Password UI */}
          <div
            className="password-container"
            style={{
              background: "#e6eefa",
              borderRadius: 20,
              padding: 32,
              boxShadow: "0 4px 24px #0002",
              width: 340,
              margin: "0 auto",
              textAlign: "center",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {/* Top labels */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: "bold", color: "#444", fontSize: 16 }}>
                Entrez votre mot de passe
              </div>
              <div style={{ color: "#1a237e", fontSize: 15, marginTop: 2 }}>
                إدخلوا رمزكم السري
              </div>
            </div>

            {/* Keypad */}
            <div
              style={{
                background:
                  "linear-gradient(180deg, #3a7fc4 60%, #1a237e 100%)",
                borderRadius: 18,
                padding: 18,
                margin: "18px 0 18px 0",
                display: "grid",
                gridTemplateColumns: "repeat(3, 60px)",
                gridGap: 12,
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, ""].map((n, i) => (
                <button
                  key={i}
                  disabled={n === ""}
                  onClick={() => n !== "" && handleNumpadClick(n)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: n === "" ? "transparent" : "#fff",
                    color: n === "" ? "transparent" : "#1a237e",
                    fontSize: 28,
                    fontWeight: "bold",
                    border: n === "" ? "none" : "2px solid #b0c4de",
                    boxShadow: n === "" ? "none" : "0 2px 8px #0001",
                    cursor: n === "" ? "default" : "pointer",
                    outline: "none",
                    transition: "background 0.2s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Password boxes */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 36,
                      height: 48,
                      border: "2px solid #b0c4de",
                      borderRadius: 6,
                      background: "#fff",
                      fontSize: 28,
                      color: "#1a237e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      boxShadow: "0 1px 4px #0001",
                    }}
                  >
                    {passwordDigits[i] || ""}
                  </div>
                ))}
            </div>

            {/* Error/Start Message */}
            {finalExamPasswordError && (
              <div style={{ color: "#e74c3c", marginBottom: 10, fontSize: 14 }}>
                {finalExamPasswordError}
              </div>
            )}
            {finalExamStartMessage && (
              <div style={{ color: "#2ecc71", marginBottom: 10, fontSize: 16 }}>
                {finalExamStartMessage}
              </div>
            )}

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 18,
                marginTop: 10,
              }}
            >
              <button
                onClick={handleCorriger}
                style={{
                  background:
                    "linear-gradient(180deg, #b6e7b0 60%, #4caf50 100%)",
                  color: "#222",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 32px",
                  fontSize: 18,
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #0001",
                }}
              >
                Corriger
              </button>
              <button
                onClick={handleFermer}
                style={{
                  background: "linear-gradient(180deg, #fbb 60%, #e53935 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 32px",
                  fontSize: 18,
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #0001",
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handlers for the custom numpad
  function handleNumpadClick(n) {
    setPasswordDigits((prev) => {
      const idx = prev.findIndex((d) => d === "");
      if (idx === -1) return prev; // already full
      const next = [...prev];
      next[idx] = n.toString();
      // If all 4 digits entered, call your submit logic here
      if (idx === 3) handlePasswordSubmit(next.join(""));
      return next;
    });
  }
  function handleCorriger() {
    setPasswordDigits(["", "", "", ""]);
    setFinalExamPasswordError("");
    setFinalExamStartMessage("");
  }
  function handleFermer() {
    setShowFinalExamPassword(false);
    setPasswordDigits(["", "", "", ""]);
    setFinalExamPasswordError("");
    setFinalExamStartMessage("");
  }

  // Add this new function
  const handleVehicleTypeSelect = (type) => {
    setSelectedVehicleType(type);
    setShowVehicleTypeSelection(false);
    setShowMahawirOrLessonsSelection(true); // Show the new selection page
    // Update user data with selected vehicle type
    handleUserDataUpdate({ ...userData, licenseType: type });
    // Ensure the user is in the user view and sees the mahawir list
    if (selectedRole === "user") {
      // Assuming 'mahawir' is the correct initial user view after selection
      // No need to set adminView here, as we are already handling user view
    }
  };

  // Add this function to filter Mahawir based on selected vehicle type
  const getFilteredMahawir = () => {
    console.log(
      "getFilteredMahawir called with selectedType:",
      selectedVehicleType,
      "visibility:",
      vehicleTypeVisibility
    );
    // Only filter if a vehicle type is selected AND that type is visible
    if (
      !selectedVehicleType ||
      !vehicleTypeVisibility ||
      !vehicleTypeVisibility[selectedVehicleType]
    ) {
      console.log("Filtering skipped: no type selected or type not visible.");
      return []; // Return empty array if no type selected or type is not visible
    }

    const filtered = mahawir.filter(
      (mahwar) =>
        // Check if the mahwar has vehicleTypes defined and includes the selected and visible type
        mahwar.vehicleTypes && mahwar.vehicleTypes.includes(selectedVehicleType)
    );
    console.log("Filtered Mahawir:", filtered);
    return filtered;
  };

  // Define renderMahwarList function within App component
  const renderMahwarList = () => {
    const isAdminView = selectedRole === "admin";

    // Get the list of Mahawir to display (all for admin, filtered for user)
    const mahawirToDisplay = isAdminView ? mahawir : getFilteredMahawir();
    console.log(
      "Mahawir to display (" + (isAdminView ? "admin" : "user") + "):",
      mahawirToDisplay
    );

    if (mahawirToDisplay.length === 0) {
      // Display a different message if in user view and no mahawir found for selected type
      if (
        !isAdminView &&
        selectedVehicleType &&
        vehicleTypeVisibility &&
        vehicleTypeVisibility[selectedVehicleType]
      ) {
        return (
          <div className="no-mahawir-message">
            <p>
              لا توجد محاور متاحة لنوع المركبة المحدد ({selectedVehicleType})
            </p>
          </div>
        );
      }
      // Default message for no mahawir (e.g., admin view with no mahawir, or user view with no selected/visible type)
      // Also show this message if vehicleTypeVisibility is not yet loaded or available
      return (
        <div className="no-mahawir-message">
          <p>لا توجد محاور متاحة</p>
        </div>
      );
    }

    return (
      <div className="mahawir-grid">
        {mahawirToDisplay.map((mahwar) => (
          <div key={mahwar.id} className="mahwar-card">
            <div className="mahwar-card-image">
              {mahwar.image ? (
                <img src={getFileUrl(mahwar.image)} alt={mahwar.title} />
              ) : (
                <div className="mahwar-card-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <span>لا توجد صورة</span>
                </div>
              )}
            </div>
            <div className="mahwar-card-content">
              <h3>{mahwar.title}</h3>
              <div className="mahwar-card-stats">
                <span className="exam-count">
                  {
                    exams.filter((exam) => exam.mahwarId === mahwar.id).length
                  }{" "}
                  اختبارات
                </span>
              </div>
              <div className="mahwar-vehicle-types">
                {mahwar.vehicleTypes &&
                Array.isArray(mahwar.vehicleTypes) &&
                mahwar.vehicleTypes.length > 0 ? (
                  mahwar.vehicleTypes
                    // Filter vehicle types based on visibility before mapping
                    .filter(
                      (type) =>
                        vehicleTypeVisibility && vehicleTypeVisibility[type]
                    )
                    .map((type) => (
                      <span key={type} className="vehicle-type-badge">
                        {type}
                      </span>
                    ))
                ) : (
                  <span className="no-vehicle-types">
                    لا توجد أنواع مركبات محددة
                  </span>
                )}
              </div>
            </div>
            <div className="mahwar-card-footer">
              {/* Show Start Exam button only in user view */}
              {!isAdminView && (
                <button
                  className="start-exam-button"
                  onClick={() => handleViewMahwarExams(mahwar)}
                >
                  عرض الاختبارات
                </button>
              )}
              {/* Show Admin buttons only in admin view */}
              {isAdminView && (
                <>
                  <button
                    className="edit-button"
                    onClick={() => handleEditMahwar(mahwar.id)}
                  >
                    تعديل
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteMahwar(mahwar.id)}
                  >
                    حذف
                  </button>
                  <button
                    className="start-exam-button"
                    onClick={() => handleViewMahwarExams(mahwar)}
                  >
                    عرض الاختبارات
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add renderVehicleTypeSelector function
  const renderVehicleTypeSelector = () => {
    if (!selectedVehicleType) return null;

    return (
      <div className="vehicle-type-selector">
        <div className="selected-vehicle-type">
          <span>نوع المركبة المحدد:</span>
          <span className="vehicle-type-badge">{selectedVehicleType}</span>
        </div>
        <button
          className="change-vehicle-type-button"
          onClick={() => setShowVehicleTypeSelection(true)}
        >
          تغيير نوع المركبة
        </button>
      </div>
    );
  };

  // Modify the render logic to show vehicle type selection
  if (showVehicleTypeSelection) {
    return (
      <VehicleTypeSelection
        onSelect={handleVehicleTypeSelect}
        vehicleTypeVisibility={vehicleTypeVisibility}
      />
    );
  }

  // Render admin view
  if (selectedRole === "admin") {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>
            <button
              className={
                adminView === "exams"
                  ? "admin-view-btn active"
                  : "admin-view-btn"
              }
              onClick={() => {
                setAdminView("exams");
                setSelectedMahwar(null);
                setSelectedExam(null);
              }}
            >
              إدارة الامتحانات
            </button>
            <button
              className={
                adminView === "mahawir" || adminView === "mahwar-exams"
                  ? "admin-view-btn active"
                  : "admin-view-btn"
              }
              onClick={() => {
                setAdminView("mahawir");
                setSelectedMahwar(null);
                setSelectedExam(null);
              }}
            >
              إدارة المحاور
            </button>
            <button
              className={
                adminView === "vehicle-types"
                  ? "admin-view-btn active"
                  : "admin-view-btn"
              }
              onClick={() => {
                setAdminView("vehicle-types");
                setSelectedMahwar(null);
                setSelectedExam(null);
              }}
            >
              إدارة أنواع المركبات
            </button>
            <button
              className={
                adminView === "user-data"
                  ? "admin-view-btn active"
                  : "admin-view-btn"
              }
              onClick={() => {
                setAdminView("user-data");
                setSelectedMahwar(null);
                setSelectedExam(null);
              }}
            >
              بيانات المستخدم
            </button>
            <button
              className={
                adminView === "lessons"
                  ? "admin-view-btn active"
                  : "admin-view-btn"
              }
              onClick={() => {
                setAdminView("lessons");
                setSelectedMahwar(null);
                setSelectedExam(null);
              }}
            >
              إدارة الدروس
            </button>
          </h1>
        </div>

        {/* User Data View */}
        {adminView === "user-data" && (
          <div className="user-container">
            <div className="user-header">
              <h1>بيانات المستخدم</h1>
              <div className="header-decoration"></div>
            </div>
            <div
              style={{
                maxWidth: "800px",
                margin: "0 auto",
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Profile Image Section */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                }}
              >
                <img
                  src={getFileUrl(userData.profileImage)}
                  alt="صورة المستخدم"
                  style={{
                    width: "200px",
                    height: "200px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    marginBottom: "15px",
                  }}
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpdate}
                    style={{ display: "none" }}
                    id="profile-image-input"
                  />
                  <label
                    htmlFor="profile-image-input"
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      backgroundColor: "#3498db",
                      color: "white",
                      borderRadius: "5px",
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#2980b9")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#3498db")
                    }
                  >
                    تغيير الصورة
                  </label>
                </div>
              </div>

              {/* User Details Form */}
              <div style={{ direction: "rtl" }}>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    رقم البطاقة الوطنية (CIN)
                  </label>
                  <input
                    type="text"
                    value={userData.cin}
                    onChange={(e) =>
                      handleUserDataUpdate({ ...userData, cin: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    نوع الرخصة (Type Permis)
                  </label>
                  <input
                    type="text"
                    value={userData.licenseType}
                    onChange={(e) =>
                      handleUserDataUpdate({
                        ...userData,
                        licenseType: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    اللغة (Langue)
                  </label>
                  <input
                    type="text"
                    value={userData.language}
                    onChange={(e) =>
                      handleUserDataUpdate({
                        ...userData,
                        language: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exams List View */}
        {adminView === "exams" && !selectedExam && (
          <div className="user-container">
            <div className="user-header">
              <h1>إدارة الامتحانات</h1>
              <div className="header-decoration"></div>
            </div>
            <div className="exams-grid">
              {exams.length === 0 ? (
                <div className="no-exams-message">
                  <div className="empty-state-icon">📝</div>
                  <p>لا توجد امتحانات</p>
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="exam-card" dir="rtl">
                    <div className="exam-card-header">
                      <h3>{exam.title}</h3>
                      <div className="exam-type">{exam.type}</div>
                    </div>
                    <div className="exam-card-content">
                      <div className="exam-stats">
                        <span className="question-count">
                          {exam.questions.length} سؤال
                        </span>
                      </div>
                    </div>
                    <div className="exam-card-footer">
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          setCurrentIdx(0);
                          setLiveEdit(exam.questions[0]);
                          setIsCreatingNew(false);
                          setAdminView("edit-exam");
                        }}
                        className="start-exam-button"
                      >
                        تعديل الامتحان
                      </button>
                      <button
                        onClick={() => {
                          setConfirmModalProps({
                            message: "هل أنت متأكد أنك تريد حذف هذا الامتحان؟",
                            onConfirm: () => {
                              const updatedExams = exams.filter(
                                (e) => e.id !== exam.id
                              );
                              saveExams(updatedExams);
                              setShowConfirmModal(false);
                            },
                            onCancel: () => setShowConfirmModal(false),
                          });
                          setShowConfirmModal(true);
                        }}
                        className="delete-button"
                        style={{ marginTop: "10px", width: "100%" }}
                      >
                        حذف الامتحان
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mahawir List View */}
        {adminView === "mahawir" && !selectedMahwar && !selectedExam && (
          <div className="user-container">
            <div className="user-header">
              <h1>إدارة المحاور</h1>
              <div className="header-decoration"></div>
            </div>
            <div style={{ margin: "20px 0", textAlign: "right" }}>
              <button
                className="create-mahwar-button"
                onClick={handleAddMahwar}
                style={{
                  padding: "15px 30px",
                  fontSize: "1.1em",
                  borderRadius: "8px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                إضافة محور جديد
              </button>
            </div>
            {renderMahwarList()}
          </div>
        )}

        {/* Mahwar Exams View */}
        {adminView === "mahwar-exams" && selectedMahwar && !selectedExam && (
          <div className="user-container">
            <div className="user-header">
              <button
                className="back-button"
                onClick={() => {
                  setAdminView("mahawir");
                  setSelectedMahwar(null);
                }}
              >
                <span className="back-icon">←</span>
                العودة للمحاور
              </button>
              <h1>الامتحانات في {selectedMahwar.title}</h1>
              <div className="header-decoration"></div>
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="create-exam-button"
                onClick={() => handleCreateNewExam(selectedMahwar.id)}
                style={{
                  padding: "15px 30px",
                  fontSize: "1.1em",
                  borderRadius: "8px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                إنشاء امتحان جديد
              </button>
            </div>
            <div className="exams-grid" dir="rtl">
              {(() => {
                const uniqueExams = new Map();
                exams.forEach((exam) => {
                  if (!uniqueExams.has(exam.id)) {
                    uniqueExams.set(exam.id, exam);
                  }
                });

                const mahwarExams = Array.from(uniqueExams.values()).filter(
                  (exam) => exam.mahwarId === selectedMahwar.id
                );

                return mahwarExams.length === 0 ? (
                  <div className="no-exams-message">
                    <div className="empty-state-icon">📝</div>
                    <p>لا توجد امتحانات في هذا المحور</p>
                  </div>
                ) : (
                  mahwarExams.map((exam) => (
                    <div key={exam.id} className="exam-card" dir="rtl">
                      <div className="exam-card-header">
                        <div className="exam-type">{exam.type}</div>
                      </div>
                      <div className="exam-card-content">
                        <h3>{exam.title}</h3>
                        <div className="exam-stats">
                          <span className="question-count">
                            {exam.questions.length} سؤال
                          </span>
                        </div>
                      </div>
                      <div className="exam-card-footer">
                        <button
                          onClick={() => handleEditMahwarExam(exam)}
                          className="start-exam-button"
                        >
                          تعديل الامتحان
                        </button>
                        <button
                          onClick={() => handleDeleteMahwarExam(exam.id)}
                          className="delete-button"
                          style={{ marginTop: "10px", width: "100%" }}
                        >
                          حذف الامتحان
                        </button>
                      </div>
                    </div>
                  ))
                );
              })()}
            </div>
          </div>
        )}

        {/* Exam Editing View */}
        {adminView === "edit-exam" && selectedExam && (
          <div className="main-ui-grid" dir="rtl">
            <div className="exam-header">
              <input
                type="text"
                value={selectedExam.title}
                onChange={(e) => {
                  const updated = { ...selectedExam, title: e.target.value };
                  setSelectedExam(updated);
                  setExams((prevExams) => {
                    const updatedExams = prevExams.map((exam) =>
                      exam.id === updated.id ? updated : exam
                    );
                    saveExams(updatedExams);
                    return updatedExams;
                  });
                }}
                className="exam-title-input"
              />
              <button
                className="back-button"
                onClick={() => {
                  setSelectedExam(null);
                  setLiveEdit(null);
                  if (selectedExam.mahwarId) {
                    setAdminView("mahwar-exams");
                    const mahwar = mahawir.find(
                      (m) => m.id === selectedExam.mahwarId
                    );
                    setSelectedMahwar(mahwar);
                  } else {
                    setAdminView("exams");
                  }
                }}
              >
                العودة للقائمة
              </button>
            </div>
            {error && (
              <div
                style={{ color: "red", textAlign: "center", margin: "20px" }}
              >
                {error}
              </div>
            )}
            <div className="ui-left">
              <QuestionPreview question={liveEdit || {}} />
            </div>
            <div className="ui-center">
              <QuestionForm
                questionData={liveEdit}
                onChange={setLiveEdit}
                onSave={handleSaveQuestion}
              />
            </div>
            <div className="ui-right">
              <NavigationGrid
                questions={selectedExam.questions}
                currentIdx={currentIdx}
                onSelect={(idx) => {
                  setCurrentIdx(idx);
                  setLiveEdit(selectedExam.questions[idx]);
                }}
              />
            </div>
          </div>
        )}

        {/* Vehicle Type Management View */}
        {adminView === "vehicle-types" && (
          <div className="admin-container">
            <div className="user-header">
              <h1>إدارة أنواع المركبات</h1>
              <div className="header-decoration"></div>
            </div>
            <div
              style={{
                maxWidth: "100%",
                margin: "0 auto",
                padding: "20px",
                backgroundColor: "white",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                direction: "rtl",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ marginBottom: "20px", color: "#555" }}>
                اختر أنواع المركبات التي ستكون مرئية للمستخدمين في قسم المحاور:
              </p>
              <div
                className="vehicle-types-checkboxes"
                style={{ gridTemplateColumns: "1fr" }}
              >
                {Object.keys(vehicleTypeVisibility).map((typeId) => (
                  <div
                    key={typeId}
                    className="vehicle-type-checkbox"
                    style={{ justifyContent: "space-between" }}
                  >
                    <label
                      htmlFor={`visibility-${typeId}`}
                      style={{ flexGrow: 1, textAlign: "right", margin: "0" }}
                    >
                      <span className="vehicle-type-id">{typeId}</span>
                      <span className="vehicle-type-label">
                        {typeId === "A"
                          ? "دراجة نارية"
                          : typeId === "B"
                          ? "سيارة خاصة"
                          : typeId === "C"
                          ? "شاحنة"
                          : typeId === "D"
                          ? "حافلة"
                          : typeId === "EC"
                          ? "شاحنة مع مقطورة"
                          : typeId}
                      </span>
                    </label>
                    <input
                      type="checkbox"
                      id={`visibility-${typeId}`}
                      checked={vehicleTypeVisibility[typeId]}
                      onChange={(e) =>
                        setVehicleTypeVisibility({
                          ...vehicleTypeVisibility,
                          [typeId]: e.target.checked,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lessons Management View - Main Categories List */}
        {adminView === "lessons" && (
          <div className="user-container">
            <div className="user-header">
              <h1>إدارة الدروس</h1>
              <div className="header-decoration"></div>
            </div>
            <div style={{ margin: "20px 0", textAlign: "right" }}>
              <button
                className="create-mahwar-button"
                onClick={handleAddLessonMahwar}
                style={{
                  padding: "15px 30px",
                  fontSize: "1.1em",
                  borderRadius: "8px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                إضافة سلسلة دروس جديدة
              </button>
            </div>
            <div className="mahawir-grid">
              {lessonCategories.length === 0 ? (
                <div className="no-mahawir-message">
                  <div className="empty-state-icon">📚</div>
                  <p>لا توجد سلاسل دروس متاحة</p>
                </div>
              ) : (
                lessonCategories.map((category) => (
                  <div key={category.id} className="mahwar-card">
                    <div className="mahwar-card-image">
                      {category.image ? (
                        <img
                          src={getFileUrl(category.image)}
                          alt={category.title}
                        />
                      ) : (
                        <div className="mahwar-card-placeholder">
                          <span className="placeholder-icon">📚</span>
                          <span>لا توجد صورة</span>
                        </div>
                      )}
                    </div>
                    <div className="mahwar-card-content" dir="rtl">
                      <h3>{category.title}</h3>
                      <div className="mahwar-vehicle-types">
                        {category.vehicleTypes?.length > 0 ? (
                          category.vehicleTypes.map((typeId) => (
                            <span key={typeId} className="vehicle-type-badge">
                              {typeId === "A"
                                ? "دراجة نارية A"
                                : typeId === "B"
                                ? "سيارة B"
                                : typeId === "C"
                                ? "شاحنة C"
                                : typeId === "D"
                                ? "حافلة D"
                                : typeId === "EC"
                                ? "شاحنة مع مقطورة EC"
                                : typeId}
                            </span>
                          ))
                        ) : (
                          <span className="no-vehicle-types">
                            لا توجد أنواع مركبات
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mahwar-card-footer">
                      <button
                        className="lesson-series-button edit"
                        onClick={() => handleEditLessonCategory(category.id)}
                      >
                        تعديل
                      </button>
                      <button
                        className="lesson-series-button delete"
                        onClick={() => handleDeleteLessonCategory(category.id)}
                      >
                        حذف
                      </button>
                      <button
                        className="lesson-series-button view"
                        onClick={() => handleViewLessonsInCategory(category)}
                      >
                        عرض الدروس
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Lessons Management View - Lessons in Category */}
        {adminView === "lessons-in-category" && selectedLessonCategory && (
          <div className="user-container">
            <div className="user-header">
              <button
                className="back-button"
                onClick={() => {
                  setSelectedLessonCategory(null);
                  setAdminView("lessons");
                }}
              >
                <span className="back-icon">←</span>
                العودة لسلاسل الدروس
              </button>
              <h1 dir="rtl">الدروس في {selectedLessonCategory.title}</h1>
              <div className="header-decoration"></div>
            </div>
            <div style={{ margin: "20px 0", textAlign: "right" }}>
              <button
                className="create-mahwar-button"
                onClick={() => handleAddLesson(selectedLessonCategory.id)}
                style={{
                  padding: "15px 30px",
                  fontSize: "1.1em",
                  borderRadius: "8px",
                  background: "#3498db",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                إضافة درس جديد
              </button>
            </div>
            <div className="mahawir-grid">
              {lessons.filter(
                (lesson) => lesson.categoryId === selectedLessonCategory.id
              ).length === 0 ? (
                <div className="no-mahawir-message">
                  <p>لا توجد دروس في هذه السلسلة</p>
                </div>
              ) : (
                lessons
                  .filter(
                    (lesson) => lesson.categoryId === selectedLessonCategory.id
                  )
                  .map((lesson) => (
                    <div key={lesson.id} className="mahwar-card">
                      <div className="mahwar-card-image">
                        {lesson.thumbnail ? (
                          <img
                            src={getFileUrl(lesson.thumbnail)}
                            alt={lesson.title}
                          />
                        ) : (
                          <div className="mahwar-card-placeholder">
                            <span className="placeholder-icon">📚</span>
                            <span>لا توجد صورة</span>
                          </div>
                        )}
                      </div>
                      <div className="mahwar-card-content" dir="rtl">
                        <h3>{lesson.title}</h3>
                        <div className="mahwar-vehicle-types">
                          {lesson.vehicleTypes?.length > 0 ? (
                            lesson.vehicleTypes.map((typeId) => (
                              <span key={typeId} className="vehicle-type-badge">
                                {typeId === "A"
                                  ? "دراجة نارية A"
                                  : typeId === "B"
                                  ? "سيارة B"
                                  : typeId === "C"
                                  ? "شاحنة C"
                                  : typeId === "D"
                                  ? "حافلة D"
                                  : typeId === "EC"
                                  ? "شاحنة مع مقطورة EC"
                                  : typeId}
                              </span>
                            ))
                          ) : (
                            <span className="no-vehicle-types">
                              لا توجد أنواع مركبات
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mahwar-card-footer">
                        <button
                          className="lesson-series-button edit"
                          onClick={() => handleEditLesson(lesson.id)}
                        >
                          تعديل
                        </button>
                        <button
                          className="lesson-series-button delete"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          حذف
                        </button>
                        {/* <button
                          className="lesson-series-button view"
                          onClick={() => handleViewLessonDetails(lesson)}
                        >
                          عرض التفاصيل
                        </button> */}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Question Count Dialog */}
        {showQuestionCountDialog && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <h3>اختر نوع الامتحان وعدد الأسئلة</h3>
              <div className="exam-type-buttons">
                {["A1", "A", "B", "C", "D", "EC"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedExamType(type)}
                    className={selectedExamType === type ? "selected" : ""}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {selectedExamType && (
                <div className="question-count-buttons">
                  {[1, 20, 30, 40, 50].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleQuestionCountSubmit(count)}
                    >
                      {count} سؤال
                    </button>
                  ))}
                </div>
              )}
              <button
                className="cancel-button"
                onClick={() => {
                  setShowQuestionCountDialog(false);
                  setSelectedExamType("");
                  setMahwarIdForNewExam(null);
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Render Modals */}
        {showTextInputModal && (
          <TextInputModal
            title={textInputModalProps.title}
            label={textInputModalProps.label}
            initialValue={textInputModalProps.initialValue}
            includeImage={textInputModalProps.includeImage}
            includeVehicleTypes={textInputModalProps.includeVehicleTypes}
            vehicleTypeVisibility={vehicleTypeVisibility}
            initialVehicleTypes={textInputModalProps.initialVehicleTypes}
            initialImage={textInputModalProps.initialImage}
            initialDescription={textInputModalProps.initialDescription}
            onConfirm={textInputModalProps.onConfirm}
            onCancel={textInputModalProps.onCancel}
          />
        )}

        {showTextInputModalMahwar && (
          <TextInputModalMahwar
            title={textInputModalPropsMahwar.title}
            label={textInputModalPropsMahwar.label}
            initialValue={textInputModalPropsMahwar.initialValue}
            includeImage={textInputModalPropsMahwar.includeImage}
            includeVehicleTypes={textInputModalPropsMahwar.includeVehicleTypes}
            vehicleTypeVisibility={vehicleTypeVisibility}
            initialVehicleTypes={textInputModalPropsMahwar.initialVehicleTypes}
            initialImage={textInputModalPropsMahwar.initialImage}
            onConfirm={textInputModalPropsMahwar.onConfirm}
            onCancel={textInputModalPropsMahwar.onCancel}
          />
        )}
        {showTextInputModalLessonMahwar && (
          <TextInputModalLessonMahwar
            title={textInputModalPropsLessonMahwar.title}
            label={textInputModalPropsLessonMahwar.label}
            initialValue={textInputModalPropsLessonMahwar.initialValue}
            includeImage={textInputModalPropsLessonMahwar.includeImage}
            includeVehicleTypes={
              textInputModalPropsLessonMahwar.includeVehicleTypes
            }
            vehicleTypeVisibility={vehicleTypeVisibility}
            initialVehicleTypes={
              textInputModalPropsLessonMahwar.initialVehicleTypes
            }
            initialImage={textInputModalPropsLessonMahwar.initialImage}
            onConfirm={textInputModalPropsLessonMahwar.onConfirm}
            onCancel={textInputModalPropsLessonMahwar.onCancel}
          />
        )}
        {showConfirmModal && (
          <ConfirmModal
            message={confirmModalProps.message}
            onConfirm={handleConfirm}
            onCancel={() => {
              if (lessonToDelete) {
                setLessonToDelete(null);
              } else if (confirmModalProps.onCancel) {
                confirmModalProps.onCancel();
              }
              setShowConfirmModal(false);
            }}
          />
        )}

        {/* Lesson Dialog Modal */}
        {showLessonDialog && editingLesson && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <h3>{editingLesson.id ? "تعديل الدرس" : "إضافة درس جديد"}</h3>
              <div className="form-group">
                <label>عنوان الدرس</label>
                <input
                  type="text"
                  value={editingLesson.title || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      title: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    textAlign: "right",
                  }}
                />
                <label>محتوى الدرس</label>
                <textarea
                  value={editingLesson.content || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      content: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    textAlign: "right",
                    minHeight: "150px",
                  }}
                />
                <label>الملف المرفق</label>
                <input
                  type="file"
                  onChange={(e) => handlePdfChange(e, editingLesson.id)}
                />
                <div className="vehicle-types-section">
                  <label>أنواع المركبات المرتبطة بالدرس:</label>
                  <div className="vehicle-types-checkboxes">
                    {Object.entries(vehicleTypeVisibility)
                      .filter(([_, isVisible]) => isVisible)
                      .map(([typeId]) => (
                        <div key={typeId} className="vehicle-type-checkbox">
                          <input
                            type="checkbox"
                            id={`lesson-${typeId}`}
                            checked={editingLesson.vehicleTypes?.includes(
                              typeId
                            )}
                            onChange={() => {
                              const currentTypes =
                                editingLesson.vehicleTypes || [];
                              const newTypes = currentTypes.includes(typeId)
                                ? currentTypes.filter((t) => t !== typeId)
                                : [...currentTypes, typeId];
                              setEditingLesson({
                                ...editingLesson,
                                vehicleTypes: newTypes,
                              });
                            }}
                          />
                          <label htmlFor={`lesson-${typeId}`}>
                            <span className="vehicle-type-id">{typeId}</span>
                            <span className="vehicle-type-label">
                              {typeId === "A"
                                ? "دراجة نارية"
                                : typeId === "B"
                                ? "سيارة"
                                : typeId === "C"
                                ? "شاحنة"
                                : typeId === "D"
                                ? "حافلة 2"
                                : typeId === "EC"
                                ? "شاحنة مع مقطورة"
                                : typeId}
                            </span>
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="dialog-actions">
                  <button
                    className="confirm-button"
                    onClick={() => setShowLessonDialog(false)}
                  >
                    حفظ
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => setShowLessonDialog(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lesson Details Modal */}
        {selectedLessonForDetails && (
          <div className="lesson-details-content">
            <h2>{selectedLessonForDetails.title}</h2>
            {selectedLessonForDetails.image && (
              <div className="lesson-image">
                <img
                  src={getFileUrl(selectedLessonForDetails.image)}
                  alt={selectedLessonForDetails.title}
                />
              </div>
            )}
            {selectedLessonForDetails.content && (
              <div className="lesson-content">
                <p>{selectedLessonForDetails.content}</p>
              </div>
            )}
            {selectedLessonForDetails.description && (
              <div className="lesson-description">
                {typeof selectedLessonForDetails.description === "object" &&
                selectedLessonForDetails.description.type === "pdf" ? (
                  <div className="pdf-container">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                        window.location.origin +
                          getFileUrl(selectedLessonForDetails.description.path)
                      )}&embedded=true`}
                      width="100%"
                      height="500px"
                      frameBorder="0"
                      title="PDF Viewer"
                    />
                  </div>
                ) : (
                  <p>{selectedLessonForDetails.description}</p>
                )}
              </div>
            )}
            {selectedLessonForDetails.vehicleTypes &&
              selectedLessonForDetails.vehicleTypes.length > 0 && (
                <div className="lesson-vehicle-types">
                  <h4>أنواع المركبات</h4>
                  <div className="vehicle-types-list">
                    {selectedLessonForDetails.vehicleTypes.map((typeId) => (
                      <span key={typeId} className="vehicle-type-tag">
                        {vehicleTypeVisibility[typeId]?.label || typeId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            <div className="dialog-actions">
              <button
                className="close-button"
                onClick={() => selectedLessonForDetails(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render user view
  if (selectedRole === "user") {
    // If showVehicleTypeSelection is true, the intermediate page is rendered already
    // Otherwise, show the ContentTypeSelection page if showMahawirOrLessonsSelection is true
    if (showVehicleTypeSelection) {
      return (
        <VehicleTypeSelection
          onSelect={handleVehicleTypeSelect}
          vehicleTypeVisibility={vehicleTypeVisibility}
        />
      );
    }

    // If showMahawirOrLessonsSelection is true, render the intermediate page to select Mahawir or Lessons
    if (showMahawirOrLessonsSelection) {
      // Render the ContentTypeSelection component
      return (
        <ContentTypeSelection
          onSelect={(type) => {
            setUserViewSection(type); // Set the user's selected content section
            setShowMahawirOrLessonsSelection(false); // Hide the selection page
            setSelectedMahwar(null); // Reset selected Mahwar when changing section
            setSelectedExam(null); // Reset selected Exam when changing section
            setExamResults(null); // Reset results
          }}
          onBack={() => {
            setShowVehicleTypeSelection(true);
            setShowMahawirOrLessonsSelection(false);
            setUserViewSection(null);
          }}
        />
      );
    }

    // Otherwise, render the main user view content (Mahawir list or Exam view or Lessons list)
    // Check which section the user is viewing

    // Remove the filtering since we don't need question text anymore
    const filteredExam = selectedExam && {
      ...selectedExam,
      questions: selectedExam.questions,
    };

    if (examResults) {
      return (
        <ResultsView
          exam={filteredExam}
          selectedAnswers={examResults.selectedAnswers}
          onBack={() => {
            setExamResults(null);
            setSelectedExam(null);
          }}
        />
      );
    }

    if (selectedExam) {
      return (
        <ExamView
          exam={filteredExam}
          onFinish={handleExamFinish}
          onBack={() => {
            setSelectedExam(null);
            setExamResults(null);
          }}
        />
      );
    }

    // Render Lessons List if userViewSection is 'lessons'
    if (userViewSection === "lessons") {
      return (
        <div className="user-container">
          <div className="user-header">
            {/* <button
              className="back-button"
              onClick={() => setSelectedLessonSeries(null)}
            >
              <span className="back-icon">←</span>
              العودة للخلف
            </button> */}
            <h1>الدروس</h1>
            <div className="header-decoration"></div>
          </div>

          {selectedLessonSeries ? (
            <div>
              <BackButton
                className="back-button"
                onClick={() => setSelectedLessonSeries(null)}
              />
              <div className="lessons-list">
                {lessons
                  .filter(
                    (lesson) =>
                      lesson.categoryId === selectedLessonSeries.id &&
                      lesson.vehicleTypes &&
                      lesson.vehicleTypes.includes(selectedVehicleType) &&
                      vehicleTypeVisibility[selectedVehicleType]
                  )
                  .map((series) => (
                    <div key={series.id} className="mahwar-card">
                      <div className="mahwar-card-image">
                        <div className="lesson-card-image-placeholder">
                          <img
                            src={getFileUrl(series.thumbnail)}
                            alt={series.title}
                          />
                        </div>
                      </div>
                      <div className="mahwar-card-content lesson-card-content">
                        <h3>{series.title}</h3>
                        <div className="start-lesson-container">
                          {series.video ? (
                            <button
                              onClick={() => {
                                setShowVideoModal(true);
                                setCurrentVideo(series.video.path);
                              }}
                              className="start-lesson"
                            >
                              ابدء ادرس
                            </button>
                          ) : (
                            <a
                              href={getFileUrl(series.pdf)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="start-lesson"
                            >
                              ابدء ادرس
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {showVideoModal && (
                  <div className="video-modal">
                    <button
                      onClick={() => setShowVideoModal(false)}
                      className="close-modal"
                    >
                      &times;
                    </button>
                    <div className="video-modal-content">
                      <video
                        src={getFileUrl(currentVideo)}
                        controls
                        playsInline
                        autoPlay
                        muted={false}
                        width="100%"
                        height="auto"
                        className="video-player"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show lesson series in grid layout
            <div>
              <BackButton
                onClick={() => setShowMahawirOrLessonsSelection(true)}
              />

              <div className="mahawir-grid">
                {lessonCategories.length === 0 ? (
                  <div className="no-mahawir-message">
                    <div className="empty-state-icon">📚</div>
                    <p>لا توجد سلاسل دروس متاحة</p>
                  </div>
                ) : (
                  lessonCategories
                    .filter((series) =>
                      lessons.some(
                        (lesson) =>
                          lesson.vehicleTypes.includes(selectedVehicleType) &&
                          lesson.categoryId === series.id
                      )
                    )
                    .map((series) => (
                      <div
                        key={series.id}
                        className="mahwar-card"
                        onClick={() => setSelectedLessonSeries(series)}
                      >
                        <div className="mahwar-card-image">
                          <div className="mahwar-card-image-placeholder">
                            <img
                              src={getFileUrl(series.image)}
                              alt={series.title}
                            />
                          </div>
                        </div>
                        <div className="mahwar-card-content">
                          <h3>{series.title}</h3>
                          <div className="mahwar-card-stats">
                            <span className="exam-count">
                              {
                                lessons.filter(
                                  (lesson) =>
                                    lesson.vehicleTypes.includes(
                                      selectedVehicleType
                                    ) && lesson.categoryId === series.id
                                ).length
                              }
                              درس
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show topics (Mahawir) if userViewSection is 'mahawir' and no specific Mahwar is selected
    if (userViewSection === "mahawir" && !selectedMahwar) {
      return (
        <div className="user-container">
          <div className="user-header">
            {/* Back button to Content Type Selection if a section is selected */}
            {userViewSection && (
              <button
                className="back-button"
                onClick={() => setShowMahawirOrLessonsSelection(true)}
              >
                <span className="back-icon">←</span>
                العودة للخلف
              </button>
            )}
            <h1>اختر المحور</h1>
            <div className="header-decoration"></div>
          </div>

          {selectedVehicleType === "B" && (
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                الامتحان النهائي
              </h2>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                امتحان شامل من جميع المحاور (40 سؤال)
              </p>
              <button
                onClick={startFinalExamProcess}
                style={{
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#c0392b")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#e74c3c")}
              >
                ابدأ الامتحان النهائي
              </button>
            </div>
          )}

          {/* Use renderMahwarList here */}
          {renderMahwarList()}
        </div>
      );
    }

    // Show exams for selected topic if userViewSection is 'mahawir' and a Mahwar is selected
    if (userViewSection === "mahawir" && selectedMahwar) {
      const uniqueExams = new Map();
      exams.forEach((exam) => {
        if (!uniqueExams.has(exam.id)) {
          uniqueExams.set(exam.id, exam);
        }
      });

      const topicExams = Array.from(uniqueExams.values()).filter(
        (exam) => exam.mahwarId === selectedMahwar.id
      );

      return (
        <div className="user-container">
          <div className="user-header">
            <button
              className="back-button"
              onClick={() => setSelectedMahwar(null)}
            >
              <span className="back-icon">←</span>
              العودة للمحاور
            </button>
            <h1>الامتحانات في {selectedMahwar.title}</h1>
            <div className="header-decoration"></div>
          </div>
          <div className="exams-grid" dir="rtl">
            {topicExams.length === 0 ? (
              <div className="no-exams-message">
                <div className="empty-state-icon">📝</div>
                <p>لا توجد امتحانات متاحة في هذا المحور</p>
              </div>
            ) : (
              topicExams.map((exam) => (
                <div
                  key={exam.id}
                  className="exam-card"
                  onClick={() => setSelectedExam(exam)}
                  dir="rtl"
                >
                  <div className="exam-card-header">
                    <h3>{exam.title}</h3>
                    <div className="exam-type">{exam.type}</div>
                  </div>
                  <div className="exam-card-content">
                    <div className="exam-stats">
                      <span className="question-count">
                        {exam.questions.length} سؤال
                      </span>
                      <span className="time-limit">
                        {exam.questions[0]?.timeLimit || 15} ثانية لكل سؤال
                      </span>
                    </div>
                  </div>
                  <div className="exam-card-footer">
                    <button className="start-exam-button">ابدأ الامتحان</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // If we get here, something went wrong - maybe an invalid userViewSection value?
    return (
      <div className="user-container">
        <h1>حدث خطأ في العرض</h1>
        <p>الرجاء العودة للصفحة الرئيسية.</p>
        <button
          className="back-button"
          onClick={() => setSelectedRole("user")} // Go back to initial role selection
        >
          العودة
        </button>
      </div>
    );
  }

  // If we get here, something went wrong with role selection
  return <div>Error: Invalid role selected</div>;

  return (
    <div className="app">
      {/* ... existing components ... */}
      <UpdateNotification />
    </div>
  );
}

export default App;