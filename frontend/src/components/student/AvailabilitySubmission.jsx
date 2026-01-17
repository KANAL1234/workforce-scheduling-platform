import { useState, useEffect } from 'react';
import { availabilityAPI } from '../../services/api';
import { Star, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

// Complete shift definitions for the week
const SHIFTS = [
    // Monday
    { id: 1, day: 'Monday', dayNum: 0, start: '07:00', end: '11:00', hours: 4, type: 'weekday' },
    { id: 2, day: 'Monday', dayNum: 0, start: '11:00', end: '14:00', hours: 3, type: 'weekday' },
    { id: 3, day: 'Monday', dayNum: 0, start: '14:00', end: '17:00', hours: 3, type: 'weekday' },
    { id: 4, day: 'Monday', dayNum: 0, start: '17:00', end: '21:00', hours: 4, type: 'weekday' },
    { id: 5, day: 'Monday', dayNum: 0, start: '21:00', end: '24:00', hours: 3, type: 'weekday' },

    // Tuesday
    { id: 6, day: 'Tuesday', dayNum: 1, start: '07:00', end: '11:00', hours: 4, type: 'weekday' },
    { id: 7, day: 'Tuesday', dayNum: 1, start: '11:00', end: '14:00', hours: 3, type: 'weekday' },
    { id: 8, day: 'Tuesday', dayNum: 1, start: '14:00', end: '17:00', hours: 3, type: 'weekday' },
    { id: 9, day: 'Tuesday', dayNum: 1, start: '17:00', end: '21:00', hours: 4, type: 'weekday' },
    { id: 10, day: 'Tuesday', dayNum: 1, start: '21:00', end: '24:00', hours: 3, type: 'weekday' },

    // Wednesday
    { id: 11, day: 'Wednesday', dayNum: 2, start: '07:00', end: '11:00', hours: 4, type: 'weekday' },
    { id: 12, day: 'Wednesday', dayNum: 2, start: '11:00', end: '14:00', hours: 3, type: 'weekday' },
    { id: 13, day: 'Wednesday', dayNum: 2, start: '14:00', end: '17:00', hours: 3, type: 'weekday' },
    { id: 14, day: 'Wednesday', dayNum: 2, start: '17:00', end: '21:00', hours: 4, type: 'weekday' },
    { id: 15, day: 'Wednesday', dayNum: 2, start: '21:00', end: '24:00', hours: 3, type: 'weekday' },

    // Thursday
    { id: 16, day: 'Thursday', dayNum: 3, start: '07:00', end: '11:00', hours: 4, type: 'weekday' },
    { id: 17, day: 'Thursday', dayNum: 3, start: '11:00', end: '14:00', hours: 3, type: 'weekday' },
    { id: 18, day: 'Thursday', dayNum: 3, start: '14:00', end: '17:00', hours: 3, type: 'weekday' },
    { id: 19, day: 'Thursday', dayNum: 3, start: '17:00', end: '21:00', hours: 4, type: 'weekday' },
    { id: 20, day: 'Thursday', dayNum: 3, start: '21:00', end: '24:00', hours: 3, type: 'weekday' },

    // Friday
    { id: 21, day: 'Friday', dayNum: 4, start: '07:00', end: '11:00', hours: 4, type: 'weekday' },
    { id: 22, day: 'Friday', dayNum: 4, start: '11:00', end: '14:00', hours: 3, type: 'weekday' },
    { id: 23, day: 'Friday', dayNum: 4, start: '14:00', end: '17:00', hours: 3, type: 'weekday' },
    { id: 24, day: 'Friday', dayNum: 4, start: '17:00', end: '21:00', hours: 4, type: 'weekday' },
    { id: 25, day: 'Friday', dayNum: 4, start: '21:00', end: '24:00', hours: 3, type: 'weekday' },

    // Saturday
    { id: 26, day: 'Saturday', dayNum: 5, start: '09:00', end: '12:00', hours: 3, type: 'weekend' },
    { id: 27, day: 'Saturday', dayNum: 5, start: '12:00', end: '15:00', hours: 3, type: 'weekend' },
    { id: 28, day: 'Saturday', dayNum: 5, start: '15:00', end: '18:00', hours: 3, type: 'weekend' },
    { id: 29, day: 'Saturday', dayNum: 5, start: '18:00', end: '21:00', hours: 3, type: 'weekend' },
    { id: 30, day: 'Saturday', dayNum: 5, start: '21:00', end: '24:00', hours: 3, type: 'weekend' },

    // Sunday
    { id: 31, day: 'Sunday', dayNum: 6, start: '09:00', end: '12:00', hours: 3, type: 'weekend' },
    { id: 32, day: 'Sunday', dayNum: 6, start: '12:00', end: '15:00', hours: 3, type: 'weekend' },
    { id: 33, day: 'Sunday', dayNum: 6, start: '15:00', end: '18:00', hours: 3, type: 'weekend' },
    { id: 34, day: 'Sunday', dayNum: 6, start: '18:00', end: '21:00', hours: 3, type: 'weekend' },
    { id: 35, day: 'Sunday', dayNum: 6, start: '21:00', end: '24:00', hours: 3, type: 'weekend' },
];

const StarRating = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="cursor-pointer hover:scale-110 transition-transform"
                >
                    <Star
                        className={`w-5 h-5 ${star <= (hover || value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

export default function AvailabilitySubmission() {
    const [availability, setAvailability] = useState({});
    const [desiredHours, setDesiredHours] = useState(15);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Calculate total hours
    const calculateTotalHours = () => {
        return SHIFTS.reduce((total, shift) => {
            if (availability[shift.id]?.available) {
                return total + shift.hours;
            }
            return total;
        }, 0);
    };

    const totalHours = calculateTotalHours();
    const hoursDifference = totalHours - desiredHours;

    // Toggle availability for a shift
    const toggleAvailability = (shiftId) => {
        setAvailability(prev => ({
            ...prev,
            [shiftId]: {
                available: !prev[shiftId]?.available,
                preference: prev[shiftId]?.preference || 3
            }
        }));
    };

    // Update preference
    const updatePreference = (shiftId, pref) => {
        setAvailability(prev => ({
            ...prev,
            [shiftId]: {
                ...prev[shiftId],
                preference: pref
            }
        }));
    };

    // Submit availability
    const handleSubmit = async () => {
        const availableShifts = SHIFTS.filter(s => availability[s.id]?.available);

        if (availableShifts.length === 0) {
            setMessage({ type: 'error', text: 'Please mark at least one shift as available' });
            return;
        }

        if (Math.abs(hoursDifference) > 3) {
            setMessage({
                type: 'error',
                text: `Your selected shifts total ${totalHours} hours, but you want ${desiredHours} hours. Please adjust (±3 hours tolerance).`
            });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const shifts = availableShifts.map(shift => ({
                day: shift.day.toLowerCase(),
                startTime: shift.start,
                endTime: shift.end,
                hours: shift.hours,
                preference: availability[shift.id]?.preference || 3
            }));

            await availabilityAPI.submitEnhanced({
                semester: 'Spring 2026',
                desiredHours: desiredHours,
                shifts: shifts
            });

            setMessage({ type: 'success', text: 'Availability submitted successfully!' });

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Failed to submit availability'
            });
        } finally {
            setLoading(false);
        }
    };

    // Group shifts by day
    const shiftsByDay = SHIFTS.reduce((acc, shift) => {
        if (!acc[shift.day]) acc[shift.day] = [];
        acc[shift.day].push(shift);
        return acc;
    }, {});

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Availability</h2>
                    <p className="text-gray-600">
                        Mark your available shifts and set preferences (1-5 stars)
                    </p>
                </div>

                {/* Desired Hours Input */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desired Hours Per Week
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            min="5"
                            max="40"
                            value={desiredHours}
                            onChange={(e) => setDesiredHours(parseInt(e.target.value) || 0)}
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">hours/week</span>
                    </div>
                </div>

                {/* Hours Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Selected Hours</p>
                        <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Desired Hours</p>
                        <p className="text-2xl font-bold text-blue-600">{desiredHours}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Difference</p>
                        <p className={`text-2xl font-bold ${Math.abs(hoursDifference) > 3 ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {hoursDifference > 0 ? '+' : ''}{hoursDifference}
                        </p>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                        }`}>
                        {message.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm">{message.text}</p>
                    </div>
                )}

                {/* Shifts Table */}
                <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Day</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">Time</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Type</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Available?</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border">Preference (1-5)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                shiftsByDay[day]?.map(shift => (
                                    <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 border font-medium">{shift.day}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border">
                                            {shift.start} - {shift.end}
                                        </td>
                                        <td className="px-4 py-3 text-center border">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${shift.type === 'weekend' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {shift.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center border">
                                            <input
                                                type="checkbox"
                                                checked={availability[shift.id]?.available || false}
                                                onChange={() => toggleAvailability(shift.id)}
                                                className="w-5 h-5 text-blue-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 border">
                                            <div className="flex justify-center">
                                                <StarRating
                                                    value={availability[shift.id]?.preference || 3}
                                                    onChange={(pref) => updatePreference(shift.id, pref)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        <li>Check the box to mark yourself as available for a shift</li>
                        <li>Click stars to set your preference (1 star = most preferred, 5 stars = least preferred)</li>
                        <li>Your total selected hours should match your desired hours (±3 hours tolerance)</li>
                        <li>Click "Save Changes" when done</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
