import React, { useState } from 'react';
import TextInputModal from '../modals/TextInputModal';

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
  
  const actualPath = typeof filePath === 'string' ? filePath : filePath.path;
  if (!actualPath) return null;
  
  if (window.require) {
    return `app://${actualPath.replace(/\\/g, '/')}`;
  }
  
  return `/${actualPath.replace(/\\/g, '/')}`;
};

function LessonCategoryManager({ 
  lessonCategories, 
  setLessonCategories,
  vehicleTypeVisibility,
  saveLessonCategories,
  selectedLessonCategory,
  setSelectedLessonCategory,
  setAdminView
}) {
  const [showTextInputModal, setShowTextInputModal] = useState(false);
  const [textInputModalProps, setTextInputModalProps] = useState({
    title: "",
    label: "",
    initialValue: "",
    includeImage: true,
    includeVehicleTypes: true,
    vehicleTypeVisibility: {},
    initialImage: "",
    initialVehicleTypes: [],
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleAddLessonCategory = () => {
    setTextInputModalProps({
      title: "إضافة سلسلة دروس جديدة",
      label: "عنوان السلسلة",
      initialValue: "",
      includeImage: true,
      includeVehicleTypes: true,
      vehicleTypeVisibility: vehicleTypeVisibility,
      onConfirm: (title, image, vehicleTypes) => {
        if (title) {
          const newCategory = {
            id: Date.now().toString(),
            title: title,
            image: image || "",
            vehicleTypes: vehicleTypes || [],
          };
          const updatedCategories = [...lessonCategories, newCategory];
          setLessonCategories(updatedCategories);
          saveLessonCategories(updatedCategories);
        }
        setShowTextInputModal(false);
      },
      onCancel: () => setShowTextInputModal(false),
    });
    setShowTextInputModal(true);
  };

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
          const updatedCategory = {
            ...category,
            title: title,
            image: image || category.image,
            vehicleTypes: vehicleTypes || category.vehicleTypes || [],
          };
          const updatedCategories = lessonCategories.map((c) => 
            c.id === categoryId ? updatedCategory : c
          );
          setLessonCategories(updatedCategories);
          saveLessonCategories(updatedCategories);
        }
        setShowTextInputModal(false);
      },
      onCancel: () => setShowTextInputModal(false),
    });
    setShowTextInputModal(true);
  };

  const handleDeleteLessonCategory = (categoryId) => {
    const updatedCategories = lessonCategories.filter((c) => c.id !== categoryId);
    setLessonCategories(updatedCategories);
    saveLessonCategories(updatedCategories);
  };

  const handleViewLessonsInCategory = (category) => {
    setSelectedLessonCategory(category);
    setAdminView("lessons-in-category");
  };

  return (
    <div className="lesson-category-manager">
      <button onClick={handleAddLessonCategory} className="add-category-btn">
        إضافة سلسلة دروس جديدة
      </button>
      
      <div className="categories-grid">
        {lessonCategories.map((category) => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <h3>{category.title}</h3>
              <div className="category-actions">
                <button onClick={() => handleEditLessonCategory(category.id)}>تعديل</button>
                <button onClick={() => handleDeleteLessonCategory(category.id)}>حذف</button>
              </div>
            </div>
            <div className="category-content">
              <button onClick={() => handleViewLessonsInCategory(category)}>
                عرض الدروس
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTextInputModal && (
        <TextInputModal
          {...textInputModalProps}
        />
      )}
    </div>
  );
}

export default LessonCategoryManager;
