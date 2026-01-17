// frontend/src/pages/StudentDashboard.jsx
/**
 * Student Dashboard - Main layout with nested routing
 */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Home } from 'lucide-react';
import Navbar from '../components/shared/Navbar';
import AvailabilitySubmission from '../components/student/AvailabilitySubmission';
import MySchedule from '../components/student/MySchedule';
import { useAuth } from '../context/AuthContext';
import { schedulesAPI, availabilityAPI } from '../services/api';
import Card from '../components/shared/Card';

// Dashboard Home Component
const StudentDashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        upcomingShifts: 0,
        availabilityStatus: 'Not Submitted',
        monthlyHours: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const semester = 'Spring 2025'; // TODO: Make dynamic

            // Fetch availability status
            const availResponse = await availabilityAPI.getMyAvailability(semester);
            const hasAvailability = availResponse.data && availResponse.data.length > 0;

            // Fetch schedule assignments
            const schedulesResponse = await schedulesAPI.list();
            const publishedSchedules = schedulesResponse.data?.filter(s => s.status === 'published') || [];

            let upcomingCount = 0;
            let monthlyHours = 0;

            if (publishedSchedules.length > 0) {
                const latestSchedule = publishedSchedules[0];
                const assignmentsResponse = await schedulesAPI.getAssignments(latestSchedule.id);
                const myAssignments = assignmentsResponse.data?.filter(a => a.user_id === user.id) || [];

                upcomingCount = myAssignments.length;

                // Calculate total hours from all assignments
                myAssignments.forEach(assignment => {
                    if (assignment.shift && assignment.shift.start_time && assignment.shift.end_time) {
                        // Calculate duration from start and end times
                        const [startHour, startMin] = assignment.shift.start_time.split(':').map(Number);
                        const [endHour, endMin] = assignment.shift.end_time.split(':').map(Number);
                        const startMinutes = startHour * 60 + startMin;
                        const endMinutes = endHour * 60 + endMin;
                        const durationHours = (endMinutes - startMinutes) / 60;
                        monthlyHours += durationHours;
                    }
                });
            }

            setStats({
                upcomingShifts: upcomingCount,
                availabilityStatus: hasAvailability ? 'Submitted' : 'Not Submitted',
                monthlyHours: Math.round(monthlyHours * 10) / 10, // Round to 1 decimal
            });
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {user?.full_name || 'Student'}!
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage your shift availability and view your schedule
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Upcoming Shifts</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? '...' : stats.upcomingShifts}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Availability Status</p>
                            <p className={`text-lg font-semibold ${stats.availabilityStatus === 'Submitted'
                                ? 'text-green-600'
                                : 'text-orange-600'
                                }`}>
                                {loading ? '...' : stats.availabilityStatus}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Hours This Month</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? '...' : stats.monthlyHours}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/student/availability">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-primary-100 rounded-full mb-4">
                                <Calendar className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Submit Availability
                            </h3>
                            <p className="text-gray-600">
                                Mark your available times for upcoming shifts
                            </p>
                        </div>
                    </Card>
                </Link>

                <Link to="/student/schedule">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500">
                        <div className="text-center py-8">
                            <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                                <Clock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                View My Schedule
                            </h3>
                            <p className="text-gray-600">
                                Check your assigned shifts and upcoming schedule
                            </p>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

// Main Student Dashboard with Routing
const StudentDashboard = () => {
    const location = useLocation();
    const isHome = location.pathname === '/student' || location.pathname === '/student/';

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                {!isHome && (
                    <div className="mb-6">
                        <Link
                            to="/student"
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <Home className="w-4 h-4" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                )}

                <Routes>
                    <Route index element={<StudentDashboardHome />} />
                    <Route path="availability" element={<AvailabilitySubmission />} />
                    <Route path="schedule" element={<MySchedule />} />
                    <Route path="*" element={<Navigate to="/student" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default StudentDashboard;
