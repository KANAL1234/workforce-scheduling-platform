// frontend/src/components/student/MySchedule.jsx
/**
 * My Schedule - View assigned shifts in calendar or list format
 */
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, RefreshCw } from 'lucide-react';
import { schedulesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import Button from '../shared/Button';
import Card from '../shared/Card';
import ShiftCard from '../shared/ShiftCard';

const MySchedule = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [dateFilter, setDateFilter] = useState('all'); // 'week', 'month', 'all'

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all schedules and filter by current user
            const response = await schedulesAPI.list();

            if (response.data && response.data.length > 0) {
                // Get the most recent published schedule
                const publishedSchedules = response.data.filter(s => s.status === 'published');

                if (publishedSchedules.length > 0) {
                    const latestSchedule = publishedSchedules[0];

                    // Fetch assignments for this schedule
                    const assignmentsResponse = await schedulesAPI.getAssignments(latestSchedule.id);

                    // Filter assignments for current user
                    const myAssignments = assignmentsResponse.data.filter(
                        a => a.user_id === user.id
                    );

                    setAssignments(myAssignments);
                } else {
                    setAssignments([]);
                }
            } else {
                setAssignments([]);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setAssignments([]);
            } else {
                setError(err.response?.data?.detail || 'Failed to load schedule');
            }
        } finally {
            setLoading(false);
        }
    };

    const filterAssignments = () => {
        if (dateFilter === 'all') return assignments;

        const now = new Date();
        const filtered = assignments.filter(assignment => {
            // This would need proper date filtering logic
            // For now, return all
            return true;
        });

        return filtered;
    };

    const groupByWeek = (assignments) => {
        const weeks = {};
        assignments.forEach(assignment => {
            // Group by week - simplified for now
            const weekKey = 'Current Week'; // Would calculate actual week
            if (!weeks[weekKey]) {
                weeks[weekKey] = [];
            }
            weeks[weekKey].push(assignment);
        });
        return weeks;
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

    const filteredAssignments = filterAssignments();
    const groupedAssignments = groupByWeek(filteredAssignments);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Schedule</h2>
                    <p className="text-gray-600 mt-1">
                        View your assigned shifts
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-md transition-colors ${viewMode === 'list'
                                ? 'bg-white shadow text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-2 rounded-md transition-colors ${viewMode === 'calendar'
                                ? 'bg-white shadow text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={fetchSchedule}
                        disabled={loading}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {filteredAssignments.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Shifts Assigned
                        </h3>
                        <p className="text-gray-600">
                            You don't have any shifts assigned yet. Check back later or contact your administrator.
                        </p>
                    </div>
                </Card>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <div className="space-y-6">
                            {Object.entries(groupedAssignments).map(([week, weekAssignments]) => (
                                <div key={week}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{week}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {weekAssignments.map(assignment => (
                                            assignment.shift && (
                                                <ShiftCard key={assignment.id} shift={assignment.shift} />
                                            )
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'calendar' && (
                        <Card>
                            <div className="text-center py-12">
                                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Calendar View Coming Soon
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Calendar view will be available in a future update.
                                </p>
                                <Button variant="secondary" onClick={() => setViewMode('list')}>
                                    Switch to List View
                                </Button>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {filteredAssignments.length > 0 && (
                <Card className="bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">📋 Schedule Summary</p>
                        <p>Total shifts assigned: <strong>{filteredAssignments.length}</strong></p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default MySchedule;
