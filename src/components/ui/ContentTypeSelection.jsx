import { getFileUrl } from "../../utils/electronUtils";

function ContentTypeSelection({ onSelect, onBack }) {
    return (
      <div className="content-type-selection">
        <div className="content-type-selection-header">
          <button className="back-button content-type-selection-back-button" onClick={onBack}>
            العودة للقائمة
          </button>
          <h1>اختر نوع المحتوى</h1>
        </div>
        <div className="content-types-grid">
          <button
            className="content-type-button"
            onClick={() => onSelect("mahawir")}
          >
            <img src={getFileUrl("imagesPublic/mahawir.png")} alt="المحاور" className="content-type-image" />
            <div className="content-type-label">المحاور</div>
          </button>
          <button
            className="content-type-button"
            onClick={() => onSelect("lessons")}
          >
            <img src={getFileUrl("imagesPublic/doros.png")} alt="الدروس" className="content-type-image" />
            <div className="content-type-label">الدروس</div>
          </button>
        </div>
      </div>
    );
  }

export default ContentTypeSelection;
