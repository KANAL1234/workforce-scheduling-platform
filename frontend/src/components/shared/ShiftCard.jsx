// frontend/src/components/shared/ShiftCard.jsx
/**
 * Reusable component to display shift information
 */
import { Clock, MapPin, Briefcase } from 'lucide-react';

const ShiftCard = ({ shift, variant = 'default' }) => {
    const formatTime = (time) => {
        // Convert 24h time string to 12h format
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const shiftTypeColors = {
        regular: 'bg-blue-100 text-blue-800',
        rotating: 'bg-purple-100 text-purple-800',
        on_call: 'bg-orange-100 text-orange-800',
        special: 'bg-green-100 text-green-800',
    };

    return (
        <div className={`border rounded-lg ${variant === 'compact' ? 'p-3' : 'p-4'} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{shift.day_name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${shiftTypeColors[shift.shift_type] || shiftTypeColors.regular}`}>
                            {shift.shift_type}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </span>
                        </div>

                        {shift.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{shift.location}</span>
                            </div>
                        )}

                        {shift.required_students && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4" />
                                <span>{shift.required_students} student{shift.required_students !== 1 ? 's' : ''} needed</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftCard;
