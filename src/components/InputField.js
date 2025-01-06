export default function InputField({ type, placeholder, value, onChange }) {
  return (
    <div className="input-container">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-field"
        required
      />
    </div>
  );
}
