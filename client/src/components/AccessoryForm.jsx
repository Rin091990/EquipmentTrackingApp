function AccessoryForm({ accessoryForm, onChange, onSubmit }) {
  const isMonitorAccessory = accessoryForm.type === 'monitor';
  const isPrinterAccessory = accessoryForm.type === 'printer';
  const isDockingStationAccessory = accessoryForm.type === 'dockingStation';
  const showAccessorySerialFields = isMonitorAccessory || isDockingStationAccessory;

  return (
    <form className="accessory-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="accessory-type">סוג ציוד:</label>
        <select id="accessory-type" name="type" value={accessoryForm.type} onChange={onChange}>
          <option value="monitor">מסך</option>
          <option value="printer">מדפסת</option>
          <option value="dockingStation">תחנת עגינה</option>
        </select>
      </div>

      {isMonitorAccessory && (
        <div className="form-group">
          <label htmlFor="accessory-size">גודל:</label>
          <select id="accessory-size" name="size" value={accessoryForm.size} onChange={onChange}>
            <option value="24">24</option>
            <option value="27">27</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="accessory-manufacturer">יצרן:</label>
        <input
          id="accessory-manufacturer"
          type="text"
          name="manufacturer"
          placeholder="הזן יצרן"
          value={accessoryForm.manufacturer}
          onChange={onChange}
          required
        />
      </div>

      {isPrinterAccessory && (
        <div className="form-group">
          <label htmlFor="accessory-model">דגם:</label>
          <input
            id="accessory-model"
            type="text"
            name="model"
            placeholder="הזן דגם"
            value={accessoryForm.model}
            onChange={onChange}
            required
          />
        </div>
      )}

      {showAccessorySerialFields && (
        <>
          <div className="form-group">
            <label htmlFor="accessory-serial-number">סיריאל:</label>
            <input
              id="accessory-serial-number"
              type="text"
              name="serialNumber"
              placeholder="הזן סיריאל"
              value={accessoryForm.serialNumber}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="accessory-inventory-serial">אינוונטר:</label>
            <input
              id="accessory-inventory-serial"
              type="text"
              name="inventorySerial"
              placeholder="הזן אינוונטר"
              value={accessoryForm.inventorySerial}
              onChange={onChange}
              required
            />
          </div>
        </>
      )}

      <button type="submit" className="btn btn-primary accessory-submit">
        הוסף ציוד נלווה
      </button>
    </form>
  );
}

export default AccessoryForm;
