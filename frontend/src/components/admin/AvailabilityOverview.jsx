// frontend/src/components/admin/AvailabilityOverview.jsx
/**
 * Availability Overview - View student availability across all shifts
 */
import { useState, useEffect } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { availabilityAPI, shiftsAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';
import Badge from '../shared/Badge';

const AvailabilityOverview = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const semester = 'Spring 2025'; // Default semester

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await availabilityAPI.getSummary(semester);
            setSummary(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load availability data');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getCoverageColor = (availableStudents, requiredStudents) => {
        if (availableStudents >= requiredStudents) return 'success';
        if (availableStudents >= requiredStudents * 0.5) return 'warning';
        return 'danger';
    };

    const getCoveragePercentage = (availableStudents, requiredStudents) => {
        return Math.round((availableStudents / requiredStudents) * 100);
    };

    const groupShiftsByDay = (shifts) => {
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const grouped = {};

        daysOfWeek.forEach(day => {
            grouped[day] = [];
        });

        shifts?.forEach(shiftData => {
            const dayName = shiftData.shift.day_name;
            if (grouped[dayName]) {
                grouped[dayName].push(shiftData);
            }
        });

        return grouped;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No availability data available</p>
            </div>
        );
    }

    const groupedShifts = groupShiftsByDay(summary.shifts);
    const totalShifts = summary.total_shifts || 0;
    const adequatelyStaffed = summary.shifts?.filter(s => s.is_adequately_staffed).length || 0;
    const overallCoverage = totalShifts > 0 ? Math.round((adequatelyStaffed / totalShifts) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Availability Overview</h2>
                    <p className="text-gray-600 mt-1">
                        Student availability for {semester}
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchSummary}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Total Shifts</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalShifts}</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Adequately Staffed</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{adequatelyStaffed}</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Overall Coverage</p>
                        <p className="text-3xl font-bold text-primary-600 mt-1">{overallCoverage}%</p>
                    </div>
                </Card>
            </div>

            {/* Availability Heatmap */}
            <Card>
                <div className="space-y-6">
                    {Object.entries(groupedShifts).map(([day, shifts]) => (
                        shifts.length > 0 && (
                            <div key={day}>
                                <h3 className="font-semibold text-gray-900 mb-3">{day}</h3>
                                <div className="space-y-2">
                                    {shifts.map((shiftData, index) => {
                                        const shift = shiftData.shift;
                                        const coverage = getCoveragePercentage(
                                            shiftData.available_students,
                                            shiftData.required_students
                                        );
                                        const variant = getCoverageColor(
                                            shiftData.available_students,
                                            shiftData.required_students
                                        );

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium text-gray-900">
                                                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                        </span>
                                                        <Badge variant="info">{shift.shift_type}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">
                                                            <Users className="w-4 h-4 inline mr-1" />
                                                            {shiftData.available_students} / {shiftData.required_students} available
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {shiftData.top_preference_count} top preference
                                                        </p>
                                                    </div>
                                                    <div className="w-24">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={variant}>
                                                                {coverage}%
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </Card>

            {/* Legend */}
            <Card className="bg-gray-50">
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <Badge variant="success">100%+</Badge>
                        <span className="text-gray-600">Fully Staffed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="warning">50-99%</Badge>
                        <span className="text-gray-600">Partially Staffed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="danger">&lt;50%</Badge>
                        <span className="text-gray-600">Under-Staffed</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AvailabilityOverview;
