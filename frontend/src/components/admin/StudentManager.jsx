// frontend/src/components/admin/StudentManager.jsx
/**
 * Student Manager - View and manage all students
 */
import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX } from 'lucide-react';
import { studentsAPI, availabilityAPI } from '../../services/api';
import Table from '../shared/Table';
import Badge from '../shared/Badge';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';
import AddStudentModal from './AddStudentModal';

const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentAvailability, setStudentAvailability] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [students, searchTerm, statusFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await studentsAPI.list();
            setStudents(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = students;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(student =>
                student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter === 'active') {
            filtered = filtered.filter(s => s.is_active);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(s => !s.is_active);
        }

        setFilteredStudents(filtered);
    };

    const handleRowClick = async (student) => {
        setSelectedStudent(student);
        setModalLoading(true);

        try {
            const response = await availabilityAPI.getStudentAvailability(student.id, 'Spring 2025');
            setStudentAvailability(response.data);
        } catch (err) {
            setStudentAvailability([]);
        } finally {
            setModalLoading(false);
        }
    };

    const handleToggleStatus = async (student) => {
        try {
            await studentsAPI.update(student.id, { is_active: !student.is_active });
            await fetchStudents();
            if (selectedStudent?.id === student.id) {
                setSelectedStudent({ ...student, is_active: !student.is_active });
            }
        } catch (err) {
            setError('Failed to update student status');
        }
    };


    const columns = [
        {
            header: 'Name',
            accessor: 'full_name',
        },
        {
            header: 'Email',
            accessor: 'email',
        },
        {
            header: 'Status',
            render: (student) => (
                <Badge variant={student.is_active ? 'success' : 'danger'}>
                    {student.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            header: 'Actions',
            render: (student) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(student);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        {student.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                    <p className="text-gray-600 mt-1">View and manage all students</p>
                </div>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Add Student
                </Button>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="all">All Students</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow">
                <Table
                    columns={columns}
                    data={filteredStudents}
                    loading={loading}
                    emptyMessage="No students found"
                    onRowClick={handleRowClick}
                />
            </div>

            {/* Student Detail Modal */}
            <Modal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                title={`Student Details: ${selectedStudent?.full_name || ''}`}
                size="lg"
                footer={
                    <div className="flex justify-between">
                        <Button
                            variant={selectedStudent?.is_active ? 'danger' : 'success'}
                            onClick={() => selectedStudent && handleToggleStatus(selectedStudent)}
                        >
                            {selectedStudent?.is_active ? (
                                <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate Student
                                </>
                            ) : (
                                <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate Student
                                </>
                            )}
                        </Button>
                        <Button variant="secondary" onClick={() => setSelectedStudent(null)}>
                            Close
                        </Button>
                    </div>
                }
            >
                {modalLoading ? (
                    <LoadingSpinner size="lg" />
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700">Contact Information</h4>
                            <div className="mt-2 space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium">Email:</span> {selectedStudent?.email}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Phone:</span> {selectedStudent?.phone || 'Not provided'}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium">Status:</span>{' '}
                                    <Badge variant={selectedStudent?.is_active ? 'success' : 'danger'}>
                                        {selectedStudent?.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-700">Availability Summary</h4>
                            <p className="text-sm text-gray-600 mt-2">
                                {studentAvailability.length > 0
                                    ? `Submitted availability for ${studentAvailability.length} shift${studentAvailability.length !== 1 ? 's' : ''}`
                                    : 'No availability submitted yet'}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchStudents}
            />
        </div>
    );
};

export default StudentManager;
