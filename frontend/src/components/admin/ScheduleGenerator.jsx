// frontend/src/components/admin/ScheduleGenerator.jsx
/**
 * Schedule Generator - Generate new schedules based on student availability
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { schedulesAPI } from '../../services/api';
import Button from '../shared/Button';
import Card from '../shared/Card';
import FormInput from '../shared/FormInput';
import ErrorMessage from '../shared/ErrorMessage';

const ScheduleGenerator = () => {
    const navigate = useNavigate();
    const [semester, setSemester] = useState('Spring 2025');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const semesterOptions = [
        { value: 'Spring 2025', label: 'Spring 2025' },
        { value: 'Fall 2024', label: 'Fall 2024' },
        { value: 'Summer 2024', label: 'Summer 2024' },
    ];

    const handleGenerate = async () => {
        if (!semester) {
            setError('Please select a semester');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setResult(null);

            const response = await schedulesAPI.generate(semester);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate schedule. Please ensure students have submitted availability.');
        } finally {
            setGenerating(false);
        }
    };

    const handleViewSchedule = () => {
        if (result?.id) {
            navigate(`/admin/schedules/${result.id}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule Generator</h2>
                <p className="text-gray-600 mt-1">
                    Generate optimized schedules based on student availability and preferences
                </p>
            </div>

            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

            <Card>
                <div className="space-y-6">
                    <div className="max-w-md">
                        <FormInput
                            label="Select Semester"
                            type="select"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            options={semesterOptions}
                            required
                        />
                    </div>

                    <div>
                        <Button
                            variant="primary"
                            onClick={handleGenerate}
                            loading={generating}
                            disabled={generating}
                            className="w-full sm:w-auto"
                        >
                            <PlayCircle className="w-5 h-5 mr-2" />
                            {generating ? 'Generating Schedule...' : 'Generate Schedule'}
                        </Button>
                    </div>

                    {generating && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                                🔄 Analyzing student availability and preferences...
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                This may take a few moments depending on the number of shifts and students.
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                            <div className="flex items-start gap-4">
                                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                                        Schedule Generated Successfully!
                                    </h3>
                                    <div className="space-y-2 text-sm text-green-800">
                                        <p><strong>Semester:</strong> {result.semester}</p>
                                        <p><strong>Status:</strong> Draft (Not yet published)</p>
                                        <p><strong>Created:</strong> {new Date(result.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <Button variant="primary" onClick={handleViewSchedule}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Schedule
                                        </Button>
                                        <Button variant="secondary" onClick={() => navigate('/admin/schedules')}>
                                            Go to Schedule List
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Information Panel */}
            <Card className="bg-gray-50">
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">How Schedule Generation Works</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-start gap-2">
                            <span className="text-primary-600">1.</span>
                            <p>The system analyzes all student availability submissions for the selected semester</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary-600">2.</span>
                            <p>Students are assigned to shifts based on their availability and preference rankings</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary-600">3.</span>
                            <p>The algorithm optimizes for fairness and preference satisfaction</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary-600">4.</span>
                            <p>Generated schedules are saved as "Draft" status</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary-600">5.</span>
                            <p>Review and publish the schedule to make it visible to students</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ScheduleGenerator;
