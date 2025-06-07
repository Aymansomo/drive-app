
import { getFileUrl } from "../../utils/electronUtils";

function VehicleTypeSelection({ onSelect, vehicleTypeVisibility }) {
    const vehicleTypes = [
      { id: "A", label: "دراجة نارية", image: "imagesPublic/motorcycle.jpg" },
      { id: "B", label: "سيارة خاصة", image: "imagesPublic/car.jpg" },
      { id: "C", label: "شاحنة", image: "imagesPublic/truck.jpg" },
      { id: "D", label: "حافلة", image: "imagesPublic/bus.jpg" },
      { id: "EC", label: "شاحنة مع مقطورة", image: "imagesPublic/truck-trailer.jpg" },
    ];
  
    return (
      <div className="vehicle-type-selection">
        <h1>اختر نوع المركبة</h1>
        <div className="vehicle-types-grid">
          {vehicleTypes
            .filter(type => vehicleTypeVisibility[type.id])
            .map(type => (
              <button
                key={type.id}
                className="vehicle-type-button"
                onClick={() => onSelect(type.id)}
              >
                <img src={getFileUrl(type.image)} alt={type.label} className="vehicle-type-image" />
                <span className="vehicle-type-id">{type.id}</span>
                <span className="vehicle-type-label">{type.label}</span>
              </button>
            ))}
        </div>
      </div>
    );
  }

export default VehicleTypeSelection;
