import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import ConfirmModal from '../modals/ConfirmModal';

function LessonManager() {
  const { 
    lessons,
    setLessons,
    lessonCategories,
    saveLessons,
    selectedLessonCategory,
    setSelectedLessonCategory,
    setAdminView
  } = useAppContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Get lessons for current category
  const categoryLessons = selectedLessonCategory 
    ? lessons.filter(l => l.categoryId === selectedLessonCategory.id)
    : [];

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

  return (
    <div className="lesson-manager">
      <div className="lessons-grid">
        {categoryLessons.map((lesson) => (
          <div key={lesson.id} className="lesson-card">
            <div className="lesson-header">
              <h3>{lesson.title}</h3>
              <div className="lesson-actions">
                <button onClick={() => handleEditLesson(lesson.id)}>تعديل</button>
                <button onClick={() => handleDeleteLesson(lesson.id)}>حذف</button>
              </div>
            </div>
            <div className="lesson-content">
              <p>{lesson.description}</p>
              {lesson.image && (
                <img 
                  src={getFileUrl(lesson.image)} 
                  alt="صورة الدرس" 
                  className="lesson-image"
                />
              )}
              {lesson.video && (
                <video 
                  src={getFileUrl(lesson.video)} 
                  controls 
                  className="lesson-video"
                >
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              )}
            </div>
          </div>
        ))}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          {...confirmModalProps}
        />
      )}
    </div>
  );
}

export default LessonManager;
