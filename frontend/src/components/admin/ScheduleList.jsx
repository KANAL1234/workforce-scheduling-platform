// frontend/src/components/admin/ScheduleList.jsx
/**
 * Schedule List - View all generated schedules
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { schedulesAPI } from '../../services/api';
import Table from '../shared/Table';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ErrorMessage from '../shared/ErrorMessage';

const ScheduleList = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [filteredSchedules, setFilteredSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [semesterFilter, setSemesterFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchSchedules();
    }, []);

    useEffect(() => {
        filterSchedules();
    }, [schedules, semesterFilter, statusFilter]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await schedulesAPI.list();
            setSchedules(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const filterSchedules = () => {
        let filtered = schedules;

        if (semesterFilter !== 'all') {
            filtered = filtered.filter(s => s.semester === semesterFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        setFilteredSchedules(filtered);
    };

    const handleDelete = async (scheduleId) => {
        if (!scheduleId) {
            setError('Invalid schedule ID');
            return;
        }

        try {
            setError(null);
            await schedulesAPI.delete(scheduleId);
            setDeleteConfirm(null);
            // Refresh the list
            await fetchSchedules();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete schedule');
            setDeleteConfirm(null);
        }
    };

    const handlePublish = async (schedule) => {
        try {
            await schedulesAPI.publish(schedule.id);
            await fetchSchedules();
        } catch (err) {
            setError('Failed to publish schedule');
        }
    };

    const columns = [
        {
            header: 'Semester',
            accessor: 'semester',
        },
        {
            header: 'Status',
            render: (schedule) => (
                <Badge variant={schedule.status === 'published' ? 'success' : 'warning'}>
                    {schedule.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
            ),
        },
        {
            header: 'Created',
            render: (schedule) => new Date(schedule.created_at).toLocaleDateString(),
        },
        {
            header: 'Published',
            render: (schedule) =>
                schedule.published_at
                    ? new Date(schedule.published_at).toLocaleDateString()
                    : '-',
        },
        {
            header: 'Actions',
            render: (schedule) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/schedules/${schedule.id}`);
                        }}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    {schedule.status === 'draft' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(schedule);
                            }}
                            className="text-green-600 hover:text-green-700"
                            title="Publish"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(schedule);
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    // Get unique semesters for filter
    const semesters = ['all', ...new Set(schedules.map(s => s.semester))];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Schedules</h2>
                    <p className="text-gray-600 mt-1">View and manage all generated schedules</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/admin/schedules/generate')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Schedule
                </Button>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {semesters.map(sem => (
                        <option key={sem} value={sem}>
                            {sem === 'all' ? 'All Semesters' : sem}
                        </option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft Only</option>
                    <option value="published">Published Only</option>
                </select>
            </div>

            {/* Schedules Table */}
            <div className="bg-white rounded-lg shadow">
                <Table
                    columns={columns}
                    data={filteredSchedules}
                    loading={loading}
                    emptyMessage="No schedules generated yet"
                    onRowClick={(schedule) => navigate(`/admin/schedules/${schedule.id}`)}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Delete"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)}>
                            Delete Schedule
                        </Button>
                    </div>
                }
            >
                <p className="text-gray-700">
                    Are you sure you want to delete the schedule for <strong>{deleteConfirm?.semester}</strong>?
                    This action cannot be undone and will remove all assignments.
                </p>
            </Modal>
        </div>
    );
};

export default ScheduleList;
