// frontend/src/components/student/AvailabilityCalendar.jsx
/**
 * Interactive availability calendar for students to submit their shift preferences
 */
import { useState, useEffect } from 'react';
import { Star, Save, RefreshCw } from 'lucide-react';
import { shiftsAPI, availabilityAPI } from '../../services/api';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import Button from '../shared/Button';
import Card from '../shared/Card';

const AvailabilityCalendar = () => {
    const [shifts, setShifts] = useState([]);
    const [availability, setAvailability] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const semester = 'Spring 2025'; // Default semester

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all shifts
            const shiftsResponse = await shiftsAPI.list({ is_active: true });
            setShifts(shiftsResponse.data);

            // Fetch student's existing availability
            try {
                const availResponse = await availabilityAPI.getMyAvailability(semester);
                const availMap = {};
                availResponse.data.forEach(avail => {
                    availMap[avail.shift_id] = {
                        is_available: avail.is_available,
                        preference_rank: avail.preference_rank
                    };
                });
                setAvailability(availMap);
            } catch (err) {
                // No availability yet, that's okay
                if (err.response?.status !== 404) {
                    throw err;
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = (shiftId) => {
        setAvailability(prev => {
            const current = prev[shiftId] || { is_available: false, preference_rank: null };
            return {
                ...prev,
                [shiftId]: {
                    ...current,
                    is_available: !current.is_available
                }
            };
        });
        setIsDirty(true);
        setSuccess(false);
    };

    const setPreference = (shiftId, rank) => {
        setAvailability(prev => ({
            ...prev,
            [shiftId]: {
                ...(prev[shiftId] || { is_available: false }),
                preference_rank: rank,
                is_available: true // Auto-mark as available when setting preference
            }
        }));
        setIsDirty(true);
        setSuccess(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Prepare bulk availability data
            const availabilities = Object.entries(availability).map(([shift_id, data]) => ({
                shift_id,
                is_available: data.is_available,
                preference_rank: data.preference_rank
            }));

            await availabilityAPI.bulkCreate({
                semester,
                availabilities
            });

            setSuccess(true);
            setIsDirty(false);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    const groupShiftsByDayAndTime = () => {
        const grouped = {};
        daysOfWeek.forEach(day => {
            grouped[day] = [];
        });

        shifts.forEach(shift => {
            if (grouped[shift.day_name]) {
                grouped[shift.day_name].push(shift);
            }
        });

        // Sort shifts by start time within each day
        Object.keys(grouped).forEach(day => {
            grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return grouped;
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const groupedShifts = groupShiftsByDayAndTime();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Submit Availability</h2>
                    <p className="text-gray-600 mt-1">
                        Mark your available shifts and set preferences (1-5 stars)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        loading={saving}
                        disabled={!isDirty}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">✓ Availability saved successfully!</p>
                </div>
            )}

            {isDirty && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">⚠ You have unsaved changes</p>
                </div>
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Day</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Available?</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Preference (1-5)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                groupedShifts[day]?.map((shift, idx) => {
                                    const avail = availability[shift.id] || { is_available: false, preference_rank: null };
                                    return (
                                        <tr key={shift.id} className={`border-b border-gray-100 hover:bg-gray-50 ${avail.is_available ? 'bg-green-50' : ''}`}>
                                            {idx === 0 && (
                                                <td rowSpan={groupedShifts[day].length} className="py-3 px-4 font-medium text-gray-900 border-r border-gray-200">
                                                    {day}
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs ${shift.shift_type === 'regular' ? 'bg-blue-100 text-blue-800' :
                                                        shift.shift_type === 'rotating' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {shift.shift_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={avail.is_available}
                                                    onChange={() => toggleAvailability(shift.id)}
                                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(rank => (
                                                        <button
                                                            key={rank}
                                                            onClick={() => setPreference(shift.id, rank)}
                                                            className="transition-colors"
                                                            title={`Preference ${rank}`}
                                                        >
                                                            <Star
                                                                className={`w-5 h-5 ${avail.preference_rank >= rank
                                                                        ? 'fill-yellow-400 text-yellow-400'
                                                                        : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Check the box to mark yourself as available for a shift</li>
                    <li>Click stars to set your preference (1 star = most preferred, 5 stars = least preferred)</li>
                    <li>Click "Save Changes" when done</li>
                </ul>
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
