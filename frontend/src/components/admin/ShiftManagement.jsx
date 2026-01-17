// frontend/src/components/admin/ShiftManagement.jsx
/**
 * Shift Management - Create, edit, and delete shifts
 */
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { shiftsAPI } from '../../services/api';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import FormInput from '../shared/FormInput';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';
import Badge from '../shared/Badge';
import Card from '../shared/Card';

const ShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [formData, setFormData] = useState({
        day_of_week: '',
        start_time: '',
        end_time: '',
        shift_type: 'weekday',
        required_students: 1,
    });

    const daysOfWeek = [
        { value: 0, label: 'Monday' },
        { value: 1, label: 'Tuesday' },
        { value: 2, label: 'Wednesday' },
        { value: 3, label: 'Thursday' },
        { value: 4, label: 'Friday' },
        { value: 5, label: 'Saturday' },
        { value: 6, label: 'Sunday' },
    ];

    const shiftTypes = [
        { value: 'weekday', label: 'Weekday' },
        { value: 'weekend', label: 'Weekend' },
        { value: 'rotating', label: 'Rotating' },
    ];

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await shiftsAPI.list({ is_active: true });
            setShifts(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load shifts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingShift(null);
        setFormData({
            day_of_week: '',
            start_time: '',
            end_time: '',
            shift_type: 'weekday',
            required_students: 1,
        });
        setIsModalOpen(true);
    };

    const handleEdit = (shift) => {
        setEditingShift(shift);
        setFormData({
            day_of_week: shift.day_of_week,
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_type: shift.shift_type,
            required_students: shift.required_students,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setError(null);

            const submitData = {
                ...formData,
                day_of_week: parseInt(formData.day_of_week),
                required_students: parseInt(formData.required_students),
            };

            if (editingShift) {
                await shiftsAPI.update(editingShift.id, submitData);
            } else {
                await shiftsAPI.create(submitData);
            }

            await fetchShifts();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save shift');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (shiftId) => {
        try {
            await shiftsAPI.delete(shiftId);
            await fetchShifts();
            setDeleteConfirm(null);
        } catch (err) {
            setError('Failed to delete shift');
        }
    };

    const groupShiftsByDay = () => {
        const grouped = {};
        daysOfWeek.forEach(day => {
            grouped[day.value] = [];
        });

        shifts.forEach(shift => {
            if (grouped[shift.day_of_week]) {
                grouped[shift.day_of_week].push(shift);
            }
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

    const shiftTypeColors = {
        weekday: 'info',
        weekend: 'warning',
        rotating: 'purple',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const groupedShifts = groupShiftsByDay();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
                    <p className="text-gray-600 mt-1">Create, edit, and manage all shifts</p>
                </div>
                <Button variant="primary" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Shift
                </Button>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Weekly Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {daysOfWeek.map(day => (
                    <div key={day.value}>
                        <h3 className="font-semibold text-gray-900 mb-3">{day.label}</h3>
                        <div className="space-y-3">
                            {groupedShifts[day.value]?.length > 0 ? (
                                groupedShifts[day.value].map(shift => (
                                    <Card key={shift.id}>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium text-sm">
                                                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={shiftTypeColors[shift.shift_type]}>
                                                    {shift.shift_type}
                                                </Badge>
                                                <span className="text-xs text-gray-600">
                                                    {shift.required_students} needed
                                                </span>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleEdit(shift)}
                                                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(shift)}
                                                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    No shifts
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingShift ? 'Edit Shift' : 'Create New Shift'}
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} loading={saving}>
                            {editingShift ? 'Update' : 'Create'} Shift
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <FormInput
                        label="Day of Week"
                        type="select"
                        name="day_of_week"
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        options={daysOfWeek}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Start Time"
                            type="time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            required
                        />
                        <FormInput
                            label="End Time"
                            type="time"
                            name="end_time"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            required
                        />
                    </div>

                    <FormInput
                        label="Shift Type"
                        type="select"
                        name="shift_type"
                        value={formData.shift_type}
                        onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                        options={shiftTypes}
                        required
                    />

                    <FormInput
                        label="Required Students"
                        type="number"
                        name="required_students"
                        value={formData.required_students}
                        onChange={(e) => setFormData({ ...formData, required_students: e.target.value })}
                        required
                    />
                </div>
            </Modal>

            {/* Delete Confirmation */}
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
                            Delete Shift
                        </Button>
                    </div>
                }
            >
                <p className="text-gray-700">
                    Are you sure you want to delete this shift? This action cannot be undone and will remove all associated availability and assignments.
                </p>
            </Modal>
        </div>
    );
};

export default ShiftManagement;
