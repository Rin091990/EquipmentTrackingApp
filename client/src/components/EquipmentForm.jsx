function EquipmentForm({ form, onChange, onSubmit }) {
  const isComputer = form.category === 'computer';
  const isPhone = form.category === 'phone';

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="equipment-name">שם עובד:</label>
        <input
          id="equipment-name"
          type="text"
          name="name"
          placeholder="הזן שם עובד"
          value={form.name}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="equipment-email">דוא"ל:</label>
        <input
          id="equipment-email"
          type="email"
          name="email"
          placeholder="הזן דוא״ל"
          value={form.email}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="equipment-building">מבנה:</label>
        <input
          id="equipment-building"
          type="text"
          name="building"
          placeholder="הזן מבנה"
          value={form.building}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="equipment-office">משרד:</label>
        <input
          id="equipment-office"
          type="text"
          name="office"
          placeholder="הזן משרד"
          value={form.office}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="equipment-category">קטגוריה:</label>
        <select id="equipment-category" name="category" value={form.category} onChange={onChange}>
          <option value="computer">מחשב</option>
          <option value="phone">פלאפון</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="equipment-status">סטטוס:</label>
        <select id="equipment-status" name="status" value={form.status} onChange={onChange}>
          <option value="active">פעיל</option>
          <option value="scrapped">נגרט</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="equipment-storage">אחסון:</label>
        <select id="equipment-storage" name="storage" value={form.storage} onChange={onChange}>
          {isComputer ? (
            <>
              <option value="512GB">512GB</option>
              <option value="1T">1T</option>
            </>
          ) : (
            <>
              <option value="256GB">256GB</option>
              <option value="512GB">512GB</option>
            </>
          )}
        </select>
      </div>

      <div className="equipment-fields">
        <div className="form-group">
          <label htmlFor="equipment-manufacturer">יצרן:</label>
          <input
            id="equipment-manufacturer"
            type="text"
            name="manufacturer"
            placeholder="הזן יצרן"
            value={form.manufacturer}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="equipment-model">דגם:</label>
          <input
            id="equipment-model"
            type="text"
            name="model"
            placeholder="הזן דגם"
            value={form.model}
            onChange={onChange}
            required
          />
        </div>

        {isPhone && (
          <div className="form-group">
            <label htmlFor="equipment-color">צבע:</label>
            <input
              id="equipment-color"
              type="text"
              name="color"
              placeholder="הזן צבע"
              value={form.color}
              onChange={onChange}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="equipment-serial-number">סיריאל:</label>
          <input
            id="equipment-serial-number"
            type="text"
            name="serialNumber"
            placeholder="הזן סיריאל"
            value={form.serialNumber}
            onChange={onChange}
            required
          />
        </div>

        {isComputer && (
          <div className="form-group">
            <label htmlFor="equipment-inventory-serial">אינוונטר:</label>
            <input
              id="equipment-inventory-serial"
              type="text"
              name="inventorySerial"
              placeholder="הזן אינוונטר"
              value={form.inventorySerial}
              onChange={onChange}
              required
            />
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary">
        שמור מידע
      </button>
    </form>
  );
}

export default EquipmentForm;
