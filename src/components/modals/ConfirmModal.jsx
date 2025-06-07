import './ConfirmModal.css';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>تأكيد</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button type="button" onClick={onCancel} className="cancel-button">
            إلغاء
          </button>
          <button type="button" onClick={onConfirm} className="confirm-button">
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
