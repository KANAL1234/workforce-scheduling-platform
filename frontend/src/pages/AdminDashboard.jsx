// frontend/src/pages/AdminDashboard.jsx
/**
 * Admin Dashboard - Main layout with nested routing
 */
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Users, Calendar, BarChart3, Home, Plus, FileText } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import StudentManager from '../components/admin/StudentManager';
import ShiftManagement from '../components/admin/ShiftManagement';
import AvailabilityOverview from '../components/admin/AvailabilityOverview';
import ScheduleGenerator from '../components/admin/ScheduleGenerator';
import ScheduleList from '../components/admin/ScheduleList';
import ScheduleViewer from '../components/admin/ScheduleViewer';
import Card from '../components/shared/Card';
import { useEffect, useState } from 'react';
import { studentsAPI, shiftsAPI, availabilityAPI } from '../services/api';

// Dashboard Home Component
const AdminDashboardHome = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        totalShifts: 0,
        averageCoverage: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch students
            const studentsResponse = await studentsAPI.list();
            const totalStudents = studentsResponse.data.length;
            const activeStudents = studentsResponse.data.filter(s => s.is_active).length;

            // Fetch shifts
            const shiftsResponse = await shiftsAPI.list({ is_active: true });
            const totalShifts = shiftsResponse.data.length;

            // Fetch availability summary
            try {
                const availResponse = await availabilityAPI.getSummary('Spring 2025');
                const shifts = availResponse.data.shifts || [];
                const avgCoverage = shifts.length > 0
                    ? shifts.reduce((acc, s) => acc + (s.is_adequately_staffed ? 100 : (s.available_students / s.required_students * 100)), 0) / shifts.length
                    : 0;

                setStats({
                    totalStudents,
                    activeStudents,
                    totalShifts,
                    averageCoverage: Math.round(avgCoverage),
                });
            } catch (err) {
                setStats({
                    totalStudents,
                    activeStudents,
                    totalShifts,
                    averageCoverage: 0,
                });
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage students, shifts, and view availability
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalStudents}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Students</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.activeStudents}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Shifts</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalShifts}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Coverage</p>
                            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : `${stats.averageCoverage}%`}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/students">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Manage Students
                            </h3>
                            <p className="text-gray-600">
                                View all students and their availability status
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link to="/admin/shifts">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                                <Calendar className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Manage Shifts
                            </h3>
                            <p className="text-gray-600">
                                Create, edit, and delete shifts
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link to="/admin/availability">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                                <BarChart3 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Availability Overview
                            </h3>
                            <p className="text-gray-600">
                                View student availability and shift coverage
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link to="/admin/schedules">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-orange-100 rounded-full mb-4">
                                <FileText className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Schedules
                            </h3>
                            <p className="text-gray-600">
                                Generate and manage student schedules
                            </p>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

// Main Admin Dashboard with Routing
const AdminDashboard = () => {
    const location = useLocation();
    const isHome = location.pathname === '/admin' || location.pathname === '/admin/';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                {!isHome && (
                    <div className="mb-6">
                        <Link
                            to="/admin"
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <Home className="w-4 h-4" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                )}

                <Routes>
                    <Route index element={<AdminDashboardHome />} />
                    <Route path="students" element={<StudentManager />} />
                    <Route path="shifts" element={<ShiftManagement />} />
                    <Route path="availability" element={<AvailabilityOverview />} />
                    <Route path="schedules" element={<ScheduleList />} />
                    <Route path="schedules/generate" element={<ScheduleGenerator />} />
                    <Route path="schedules/:id" element={<ScheduleViewer />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;
