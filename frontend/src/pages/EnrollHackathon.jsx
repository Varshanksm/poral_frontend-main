import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { SERVER_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import { motion } from 'framer-motion';

const EnrollHackathon = () => {
    const { user } = useContext(AuthContext);
    const { hackathonId } = useParams();
    const navigate = useNavigate();

    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        experience: '',
        motivation: '',
        teamPreference: 'Individual',
        skills: '',
        phone: ''
    });

    useEffect(() => {
        const fetchHackathon = async () => {
            try {
                const res = await API.get(`/upcoming-hackathons/${hackathonId}`);
                setHackathon(res.data);
            } catch (err) {
                setError('Hackathon not found');
                console.error('Error fetching hackathon:', err);
            } finally {
                setLoading(false);
            }
        };

        if (hackathonId) {
            fetchHackathon();
        }
    }, [hackathonId]);

    const handleChange = (e) => {
        setError('');
        setSuccess('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await API.post(`/upcoming-hackathons/${hackathonId}/enroll`, formData);
            setSuccess('Enrollment request submitted successfully! You will receive a confirmation email.');

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/student-dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Enrollment failed');
            console.error('Enrollment error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <h2>Loading...</h2>
                <p>Please wait while we fetch the hackathon details.</p>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="dashboard-container">
                <h2>Hackathon Not Found</h2>
                <p>The hackathon you're looking for doesn't exist or has been removed.</p>
                <button onClick={() => navigate('/')} className="submit-btn">
                    Back to Home
                </button>
            </div>
        );
    }

    if (hackathon.registrationDeadline <= new Date()) {
        return (
            <div className="dashboard-container">
                <h2>Registration Closed</h2>
                <p>The registration deadline for this hackathon has passed.</p>
                <button onClick={() => navigate('/')} className="submit-btn">
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#830000', marginBottom: '10px' }}>Enroll in Hackathon</h1>
                    <p style={{ color: '#666' }}>Submit your enrollment request for participation approval</p>
                </div>

                {/* Hackathon Details */}
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    border: '1px solid #ddd',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    {hackathon.posterPath && (
                        <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', maxHeight: '300px' }}>
                            <img
                                src={hackathon.posterPath.startsWith('http') ? hackathon.posterPath : `${SERVER_URL}/${hackathon.posterPath.replace(/\\/g, '/')}`}
                                alt={hackathon.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                }}
                            />
                        </div>
                    )}
                    <h2 style={{ color: '#830000', margin: '0 0 15px 0' }}>{hackathon.title}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <p><strong>Organization:</strong> {hackathon.organization}</p>
                        <p><strong>Mode:</strong> {hackathon.mode}</p>
                        <p><strong>Date:</strong> {new Date(hackathon.hackathonDate).toLocaleDateString()}</p>
                        <p><strong>Deadline:</strong> <span style={{ color: '#d32f2f' }}>{new Date(hackathon.registrationDeadline).toLocaleDateString()}</span></p>
                    </div>
                    <p style={{ marginTop: '15px', color: '#666', lineHeight: '1.6' }}>{hackathon.description}</p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                        {success}
                    </div>
                )}
                {error && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                        ❌ {error}
                    </div>
                )}

                {/* Enrollment Form */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="form-card"
                    style={{ background: '#f9f9f9', border: '1px solid #ddd', boxShadow: 'none' }}
                >
                    <h3 style={{ marginTop: 0, color: '#333' }}>Enrollment Details</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Student Name *</label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                disabled
                                style={{ background: '#f0f0f0' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Register Number *</label>
                            <input
                                type="text"
                                value={user?.registerNo || ''}
                                disabled
                                style={{ background: '#f0f0f0' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Department *</label>
                            <input
                                type="text"
                                value={user?.department || ''}
                                disabled
                                style={{ background: '#f0f0f0' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Year *</label>
                            <input
                                type="text"
                                value={user?.year || ''}
                                disabled
                                style={{ background: '#f0f0f0' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                style={{ background: '#f0f0f0' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label>Previous Experience *</label>
                            <textarea
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                required
                                placeholder="Describe your previous hackathon or coding experience..."
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label>Motivation for Participating *</label>
                            <textarea
                                name="motivation"
                                value={formData.motivation}
                                onChange={handleChange}
                                required
                                placeholder="Why do you want to participate in this hackathon?"
                                rows="4"
                            />
                        </div>

                        <div className="form-group">
                            <label>Technical Skills *</label>
                            <textarea
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                required
                                placeholder="List your technical skills (e.g., programming languages, frameworks, tools)..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Team Preference *</label>
                            <select
                                name="teamPreference"
                                value={formData.teamPreference}
                                onChange={handleChange}
                                required
                            >
                                <option value="Individual">Individual Participation</option>
                                <option value="Team">Team Participation</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={submitting}
                                style={{
                                    background: submitting ? '#ccc' : '#830000',
                                    flex: 1
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Enrollment'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="cancel-btn"
                                style={{
                                    background: '#666',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default EnrollHackathon;
