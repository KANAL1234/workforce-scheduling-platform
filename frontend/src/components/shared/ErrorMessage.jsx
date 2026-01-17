// frontend/src/components/shared/ErrorMessage.jsx
/**
 * Display error messages with proper styling
 */
import { XCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="text-sm text-red-800">{message}</p>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    aria-label="Dismiss error"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
