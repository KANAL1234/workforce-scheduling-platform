// frontend/src/components/shared/LoadingSpinner.jsx
/**
 * Reusable loading spinner component
 */

const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-t-primary-600 border-b-primary-600 border-gray-200 ${sizeClasses[size]}`}
            ></div>
        </div>
    );
};

export default LoadingSpinner;
