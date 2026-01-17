// frontend/src/components/admin/ScheduleViewer.jsx
/**
 * Schedule Viewer - View schedule details with assignments
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trash2, ArrowLeft, Calendar, Users } from 'lucide-react';
import { schedulesAPI, shiftsAPI } from '../../services/api';
import Button from '../shared/Button';
import Badge from '../shared/Badge';
import Card from '../shared/Card';
import Modal from '../shared/Modal';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const ScheduleViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [publishModal, setPublishModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    useEffect(() => {
        fetchScheduleData();
    }, [id]);

    const fetchScheduleData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [scheduleRes, assignmentsRes, shiftsRes] = await Promise.all([
                schedulesAPI.get(id),
                schedulesAPI.getAssignments(id),
                shiftsAPI.list({ is_active: true }),
            ]);

            setSchedule(scheduleRes.data);
            setAssignments(assignmentsRes.data);
            setShifts(shiftsRes.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            await schedulesAPI.publish(id);
            await fetchScheduleData();
            setPublishModal(false);
        } catch (err) {
            setError('Failed to publish schedule');
        }
    };

    const handleDelete = async () => {
        try {
            await schedulesAPI.delete(id);
            navigate('/admin/schedules');
        } catch (err) {
            setError('Failed to delete schedule');
            setDeleteModal(false);
        }
    };

    const getPreferenceColor = (preferenceRank) => {
        if (!preferenceRank) return 'bg-gray-100 border-gray-300';
        if (preferenceRank <= 2) return 'bg-green-100 border-green-300';
        if (preferenceRank <= 4) return 'bg-yellow-100 border-yellow-300';
        return 'bg-white border-gray-300';
    };

    const getPreferenceLabel = (rank) => {
        if (!rank) return 'No Preference';
        if (rank === 1) return '⭐⭐⭐⭐⭐ Top Choice';
        if (rank === 2) return '⭐⭐⭐⭐ High';
        if (rank === 3) return '⭐⭐⭐ Medium';
        if (rank === 4) return '⭐⭐ Low';
        return '⭐ Minimal';
    };

    const groupAssignmentsByShift = () => {
        const grouped = {};

        shifts.forEach(shift => {
            const key = `${shift.day_of_week}-${shift.id}`;
            grouped[key] = {
                shift,
                assignments: assignments.filter(a => a.shift_id === shift.id),
            };
        });

        return grouped;
    };

    const groupByDay = (groupedAssignments) => {
        const days = {
            0: { name: 'Monday', shifts: [] },
            1: { name: 'Tuesday', shifts: [] },
            2: { name: 'Wednesday', shifts: [] },
            3: { name: 'Thursday', shifts: [] },
            4: { name: 'Friday', shifts: [] },
            5: { name: 'Saturday', shifts: [] },
            6: { name: 'Sunday', shifts: [] },
        };

        Object.values(groupedAssignments).forEach(({ shift, assignments }) => {
            if (days[shift.day_of_week]) {
                days[shift.day_of_week].shifts.push({ shift, assignments });
            }
        });

        return days;
    };

    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const calculateStats = () => {
        const totalAssignments = assignments.length;
        const totalShifts = shifts.length;
        const assignedShifts = new Set(assignments.map(a => a.shift_id)).size;
        const coverage = totalShifts > 0 ? Math.round((assignedShifts / totalShifts) * 100) : 0;

        const preferenceSum = assignments.reduce((sum, a) => sum + (a.assignment_score || 5), 0);
        const avgPreference = totalAssignments > 0 ? (preferenceSum / totalAssignments).toFixed(1) : 0;

        return { totalAssignments, totalShifts, assignedShifts, coverage, avgPreference };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!schedule) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Schedule not found</p>
            </div>
        );
    }

    const groupedByShift = groupAssignmentsByShift();
    const dayGroups = groupByDay(groupedByShift);
    const stats = calculateStats();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate('/admin/schedules')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {schedule.semester} Schedule
                        </h2>
                        <p className="text-sm text-gray-600">
                            Created {new Date(schedule.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={schedule.status === 'published' ? 'success' : 'warning'}>
                        {schedule.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                    {schedule.status === 'draft' && (
                        <Button variant="primary" onClick={() => setPublishModal(true)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish Schedule
                        </Button>
                    )}
                    <Button variant="danger" onClick={() => setDeleteModal(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Total Assignments</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Shift Coverage</p>
                        <p className="text-2xl font-bold text-primary-600">{stats.coverage}%</p>
                        <p className="text-xs text-gray-500">{stats.assignedShifts}/{stats.totalShifts} shifts</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Avg Preference</p>
                        <p className="text-2xl font-bold text-green-600">{stats.avgPreference}</p>
                        <p className="text-xs text-gray-500">1 = Top choice</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Unique Students</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {new Set(assignments.map(a => a.student_id)).size}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Schedule Grid */}
            <div className="space-y-6">
                {Object.values(dayGroups).map((day, index) => (
                    day.shifts.length > 0 && (
                        <Card key={index}>
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">{day.name}</h3>
                            <div className="space-y-4">
                                {day.shifts.map(({ shift, assignments: shiftAssignments }, idx) => (
                                    <div key={idx} className="border-l-4 border-primary-500 pl-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">
                                                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                </span>
                                                <Badge variant="info">{shift.shift_type}</Badge>
                                                <span className="text-sm text-gray-600">
                                                    {shiftAssignments.length} / {shift.required_students} assigned
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                            {shiftAssignments.length > 0 ? (
                                                shiftAssignments.map((assignment, aIdx) => (
                                                    <div
                                                        key={aIdx}
                                                        className={`p-3 rounded-lg border-2 ${getPreferenceColor(assignment.assignment_score)}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {assignment.user?.full_name || 'Student'}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    {getPreferenceLabel(assignment.assignment_score)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                                    <p className="text-sm text-gray-500 italic">No assignments</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )
                ))}
            </div>

            {/* Publish Modal */}
            <Modal
                isOpen={publishModal}
                onClose={() => setPublishModal(false)}
                title="Publish Schedule"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setPublishModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handlePublish}>
                            Publish Schedule
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Publishing this schedule will make it visible to all students. They will be able to view their assigned shifts.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> You can unpublish the schedule later if needed.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                title="Delete Schedule"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete Schedule
                        </Button>
                    </div>
                }
            >
                <p className="text-gray-700">
                    Are you sure you want to delete this schedule? This action cannot be undone and will remove all assignments.
                </p>
            </Modal>
        </div>
    );
};

export default ScheduleViewer;
