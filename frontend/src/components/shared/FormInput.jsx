// frontend/src/components/shared/FormInput.jsx
/**
 * Form input wrapper with label and error display
 */

const FormInput = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    required = false,
    disabled = false,
    options = [], // For select inputs
    rows = 3, // For textarea
    className = '',
    ...props
}) => {
    const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

    const renderInput = () => {
        switch (type) {
            case 'textarea':
                return (
                    <textarea
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        className={inputClasses}
                        {...props}
                    />
                );

            case 'select':
                return (
                    <select
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={disabled}
                        className={inputClasses}
                        {...props}
                    >
                        <option value="">Select...</option>
                        {options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            default:
                return (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={inputClasses}
                        {...props}
                    />
                );
        }
    };

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {renderInput()}
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default FormInput;
