import React, { useState, useEffect, useContext, useRef } from 'react';
import API, { SERVER_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileCompletionModal from '../components/ProfileCompletionModal';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [hackathons, setHackathons] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        eventType: 'Hackathon',
        hackathonTitle: '',
        organization: '',
        description: '',
        mode: 'Online',
        date: '',
        year: new Date().getFullYear(),
        certificate: null,
        attendanceStatus: 'Attended',
        achievementLevel: 'Participation',
        certificateType: 'Participation Certificate'
    });
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Ref for certificate input to reset it after submission
    const certificateRef = useRef(null);

    const [approvedEnrollments, setApprovedEnrollments] = useState([]);
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
    const [recommendedOpportunities, setRecommendedOpportunities] = useState([]);

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isProfileMandatory, setIsProfileMandatory] = useState(false);

    useEffect(() => {
        // Check if mandatory profile data is missing (Onboarding Flow)
        if (user) {
            const isMissingData = !user.registerNo || !user.cgpa || user.cgpa === 0;
            if (isMissingData) {
                setIsProfileMandatory(true);
                setShowProfileModal(true);
            }
        }
    }, [user]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchHackathons(),
                fetchCredits(),
                checkCreditAlert(),
                fetchApprovedEnrollments(),
                fetchRecommendedOpportunities()
            ]);
            setLoading(false);
        };
        loadData();

        // Add click outside listener to close suggestions
        const handleClickOutside = (event) => {
            if (!event.target.closest('.form-group')) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const fetchHackathons = async () => {
        try {
            const res = await API.get('/hackathons/my-hackathons');
            setHackathons(res.data);
        } catch (err) {
            console.error('Error fetching hackathons:', err);
            setError('Failed to load hackathons');
        }
    };

    const fetchApprovedEnrollments = async () => {
        try {
            const res = await API.get('/upcoming-hackathons/my/enrollments');
            const approved = res.data.filter(e => e.status === 'Approved');
            setApprovedEnrollments(approved);
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        }
    };

    const fetchRecommendedOpportunities = async () => {
        try {
            const res = await API.get('/opportunities/recommended');
            // Ensure uniqueness just in case
            const unique = res.data.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
            setRecommendedOpportunities(unique);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    };

    const handleMarkInterest = async (oppId) => {
        try {
            await API.put(`/opportunities/${oppId}/interest`);
            alert('Great! We have notified your proctor that you are interested.');
            // Update local state to show "Request Sent"
            setRecommendedOpportunities(prev => prev.map(o =>
                o._id === oppId ? { ...o, markedInterest: true } : o
            ));
        } catch (error) {
            alert('Failed to mark interest: ' + error.message);
        }
    };

    const fetchCredits = async () => {
        try {
            const res = await API.get('/student/participation-count');
            setCredits(res.data.credits);
        } catch (err) {
            console.error('Error fetching credits:', err);
        }
    };

    const checkCreditAlert = async () => {
        try {
            await API.post('/student/check-participation');
        } catch (err) {
            console.error('Error checking credits:', err);
        }
    };

    const fetchHackathonSuggestions = async (query) => {
        try {
            const res = await API.get(`/hackathons/names?query=${encodeURIComponent(query)}`);
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setFormData({ ...formData, hackathonTitle: suggestion.name });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleEnrollmentSelect = (e) => {
        const enrollmentId = e.target.value;
        setSelectedEnrollmentId(enrollmentId);

        if (enrollmentId) {
            const enrollment = approvedEnrollments.find(en => en._id === enrollmentId);
            if (enrollment && enrollment.upcomingHackathonId) {
                const hackathon = enrollment.upcomingHackathonId;
                setFormData({
                    ...formData,
                    hackathonTitle: hackathon.title,
                    organization: hackathon.organization,
                    mode: hackathon.mode,
                    date: hackathon.hackathonDate ? new Date(hackathon.hackathonDate).toISOString().split('T')[0] : '',
                    // Keep existing description or clear it? Let's keep it empty for student to fill role
                    description: formData.description
                });
            }
        } else {
            // Reset if deselected? Maybe not needed
        }
    };

    const handleChange = (e) => {
        setError('');
        setSuccess('');
        if (['certificate'].includes(e.target.name)) {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        } else {
            let updatedFormData = { ...formData, [e.target.name]: e.target.value };

            // Auto-update certificate type based on achievement level
            if (e.target.name === 'achievementLevel') {
                const achievementToCertificate = {
                    'Winner': 'Winner Certificate',
                    'Runner-up': 'Runner-up Certificate',
                    'Participation': 'Participation Certificate',
                    'None': 'None'
                };
                updatedFormData.certificateType = achievementToCertificate[e.target.value];
            }

            // If attendance is "Did Not Attend", set achievement to None
            if (e.target.name === 'attendanceStatus') {
                if (e.target.value !== 'Attended') {
                    updatedFormData.certificate = null;
                }
                if (e.target.value === 'Did Not Attend') {
                    updatedFormData.achievementLevel = 'None';
                    updatedFormData.certificateType = 'None';
                }
            }

            setFormData(updatedFormData);

            // Fetch suggestions when typing hackathon title
            if (e.target.name === 'hackathonTitle' && e.target.value.length > 2) {
                fetchHackathonSuggestions(e.target.value);
            } else if (e.target.name === 'hackathonTitle') {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                data.append(key, formData[key]);
            }
        });

        if (selectedEnrollmentId) {
            const enrollment = approvedEnrollments.find(en => en._id === selectedEnrollmentId);
            if (enrollment) {
                data.append('upcomingHackathonId', enrollment.upcomingHackathonId._id);
            }
        }

        if (new Date(formData.date) > new Date()) {
            setError('Event date cannot be in the future.');
            setSubmitting(false);
            return;
        }

        try {
            await API.post('/hackathons/submit', data);
            setSuccess(`${formData.eventType} submitted successfully! You will receive a confirmation email.`);

            // Reset form
            setFormData({
                eventType: 'Hackathon',
                hackathonTitle: '',
                organization: '',
                description: '',
                mode: 'Online',
                date: '',
                year: new Date().getFullYear(),
                certificate: null,
                attendanceStatus: 'Attended',
                achievementLevel: 'Participation',
                certificateType: 'Participation Certificate'
            });
            setSelectedEnrollmentId('');

            // Clear suggestions
            setSuggestions([]);
            setShowSuggestions(false);

            // Reset file input
            if (certificateRef.current) certificateRef.current.value = '';

            // Refresh data
            await fetchHackathons();
            setShowForm(false); // Close form on success
        } catch (err) {
            setError('Submission failed: ' + (err.response?.data?.message || err.message));
            console.error('Submission error:', err);
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="dashboard-container">
                <h2>Student Dashboard</h2>
                <p>Loading your data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* Simplified Welcome Section */}
            <div style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ color: '#333', margin: '0 0 10px 0' }}>Welcome, {user?.name || 'Student'}</h1>
                        <p style={{ color: '#666', margin: 0 }}>Manage your hackathons and track your participation.</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsProfileMandatory(false);
                            setShowProfileModal(true);
                        }}
                        style={{
                            background: 'none',
                            border: '1px solid #830000',
                            color: '#830000',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        ✏️ Edit Profile
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                    <div className="info-pill">
                        <span className="label">Reg No:</span>
                        <span className="value">{user?.registerNo || 'N/A'}</span>
                    </div>
                    <div className="info-pill">
                        <span className="label">Year:</span>
                        <span className="value">{user?.year || 'N/A'}</span>
                    </div>
                    <div className="info-pill">
                        <span className="label">Hackathons:</span>
                        <span className="value" style={{ color: '#830000' }}>{hackathons.length}</span>
                    </div>
                </div>
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

            {/* Recommended Opportunities */}
            {recommendedOpportunities.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ margin: '0 0 15px 0', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ Recommended for You
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {recommendedOpportunities.map(opp => (
                            <div key={opp._id} style={{ background: 'white', padding: '0', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #2e7d32', overflow: 'hidden' }}>
                                {opp.poster && (
                                    <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
                                        <img
                                            src={opp.poster.startsWith('http') ? opp.poster : `${SERVER_URL}/${opp.poster.replace(/\\/g, '/')}`}
                                            alt={opp.title}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                            }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{opp.title}</h3>
                                            <span style={{ background: '#e3f2fd', color: '#01579b', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                {opp.type}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{new Date(opp.eventDate).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '15px' }}>{opp.organization}</p>
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleMarkInterest(opp._id)}
                                            disabled={opp.markedInterest}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                background: opp.markedInterest ? '#ccc' : '#2e7d32',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: opp.markedInterest ? 'not-allowed' : 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {opp.markedInterest ? '  Request Sent' : "I'm Interested"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Action Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: '#830000' }}>My Events</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? '#666' : '#830000',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {showForm ? 'Cancel' : 'Submit Event Details'}
                </button>
            </div>

            {/* Submission Form (Collapsible) */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '30px' }}
                    >
                        <div className="form-card" style={{ background: '#f9f9f9', border: '1px solid #ddd', boxShadow: 'none' }}>
                            <h3 style={{ marginTop: 0, color: '#333' }}>New Event Submission</h3>
                            <form onSubmit={handleSubmit}>
                                {/* Event Type Selector */}
                                <div className="form-group">
                                    <label>Event Type *</label>
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleChange}
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    >
                                        <option value="Hackathon">Hackathon</option>
                                        <option value="Codeathon">Codeathon</option>
                                    </select>
                                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                        Select the type of event you participated in
                                    </small>
                                </div>

                                {approvedEnrollments.length > 0 && (
                                    <div className="form-group">
                                        <label>Select Approved Hackathon (Optional)</label>
                                        <select
                                            value={selectedEnrollmentId}
                                            onChange={handleEnrollmentSelect}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        >
                                            <option value="">-- Select from Approved --</option>
                                            {approvedEnrollments.map(enrollment => (
                                                <option key={enrollment._id} value={enrollment._id}>
                                                    {enrollment.upcomingHackathonId.title}
                                                </option>
                                            ))}
                                        </select>
                                        <small style={{ color: '#666' }}>Selecting an approved hackathon will auto-fill details.</small>
                                    </div>
                                )}
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label>{formData.eventType} Title *</label>
                                    <input
                                        type="text"
                                        name="hackathonTitle"
                                        value={formData.hackathonTitle}
                                        onChange={handleChange}
                                        required
                                        placeholder={formData.eventType === 'Hackathon' ? 'e.g., Smart India Hackathon, CodeFest' : 'e.g., Google Code Jam, LeetCode Contest'}
                                        autoComplete="off"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: 'white',
                                            border: '1px solid #ddd',
                                            borderTop: 'none',
                                            borderRadius: '0 0 4px 4px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 10,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    style={{
                                                        padding: '10px 15px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #f0f0f0',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                                >
                                                    <span>{suggestion.name}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                                        {suggestion.count} {suggestion.count === 1 ? 'submission' : 'submissions'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Organization *</label>
                                    <input type="text" name="organization" value={formData.organization} onChange={handleChange} required placeholder="e.g., Google, Microsoft, College Name" />
                                </div>
                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} required placeholder="Describe your role..." />
                                </div>
                                <div className="form-group">
                                    <label>Mode *</label>
                                    <select name="mode" value={formData.mode} onChange={handleChange}>
                                        <option value="Online">🌐 Online</option>
                                        <option value="Offline">🏢 Offline</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Year *</label>
                                        <input type="number" name="year" value={formData.year} onChange={handleChange} required min="2020" max="2030" />
                                    </div>
                                </div>

                                {/* Enhanced Tracking Section */}
                                <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#830000' }}>    Participation Details</h4>

                                <div className="form-group">
                                    <label>Attendance Status *</label>
                                    <select name="attendanceStatus" value={formData.attendanceStatus} onChange={handleChange} required>
                                        <option value="Attended">Attended</option>
                                        <option value="Did Not Attend">Did Not Attend</option>
                                        <option value="Registered">Registered Only</option>
                                    </select>
                                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                        Select "Attended" if you participated and have a certificate.
                                    </small>
                                </div>

                                {formData.attendanceStatus === 'Attended' && (
                                    <>
                                        <div className="form-group">
                                            <label>Achievement Level *</label>
                                            <select name="achievementLevel" value={formData.achievementLevel} onChange={handleChange} required>
                                                <option value="Participation">Participation</option>
                                                <option value="Runner-up">Runner-up</option>
                                                <option value="Winner">Winner</option>
                                            </select>
                                            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                                💡 Winners get 3 points, Runner-ups get 2 points, Participation gets 1 point
                                            </small>
                                        </div>

                                        <div className="form-group">
                                            <label>Certificate Type</label>
                                            <input
                                                type="text"
                                                value={formData.certificateType}
                                                readOnly
                                                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                                Auto-selected based on achievement level
                                            </small>
                                        </div>
                                    </>
                                )}

                                {formData.attendanceStatus === 'Did Not Attend' && (
                                    <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #ffc107' }}>
                                        <p style={{ margin: 0, color: '#856404' }}>
                                            <strong>Note:</strong> Submissions marked as "Did Not Attend" will not earn participation points.
                                        </p>
                                    </div>
                                )}

                                {formData.attendanceStatus === 'Registered' && (
                                    <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #bee5eb' }}>
                                        <p style={{ margin: 0, color: '#0c5460' }}>
                                            ℹ️ <strong>Info:</strong> For "Registered Only" submissions, certificate upload is optional. You can submit this to track your registration.
                                        </p>
                                    </div>
                                )}

                                {formData.attendanceStatus === 'Attended' && (
                                    <>
                                        <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Upload Certificate</h4>
                                        <div className="form-group">
                                            <label>Certificate (PDF/Image) *</label>
                                            <input type="file" name="certificate" ref={certificateRef} onChange={handleChange} required accept=".pdf,.jpg,.jpeg,.png" />
                                        </div>
                                    </>
                                )}

                                <button type="submit" className="submit-btn" disabled={submitting} style={{
                                    background: submitting ? '#ccc' : '#d32f2f',
                                    width: '100%',
                                    marginTop: '20px'
                                }}>
                                    {submitting ? 'Submitting...' : `Submit ${formData.eventType}`}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hackathons List */}
            <div className="submissions-list">
                {hackathons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                        <p style={{ fontSize: '2rem', margin: 0 }}>📭</p>
                        <p>No events submitted yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {hackathons.map(hack => (
                            <div key={hack._id} className="hackathon-card-item" style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{hack.hackathonTitle}</h3>
                                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>
                                        {hack.organization} • {new Date(hack.date).toLocaleDateString()} • {hack.year} • {hack.mode}
                                    </p>

                                    {/* Event Type & Attendance & Achievement Badges */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        {/* Event Type Badge */}
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: hack.eventType === 'Codeathon' ? '#e3f2fd' : '#fce4ec',
                                            color: hack.eventType === 'Codeathon' ? '#0277bd' : '#c2185b',
                                            border: `1px solid ${hack.eventType === 'Codeathon' ? '#90caf9' : '#f48fb1'}`
                                        }}>
                                            {hack.eventType || 'Hackathon'}
                                        </span>

                                        {/* Attendance Badge */}
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: hack.attendanceStatus === 'Attended' ? '#e8f5e9' :
                                                hack.attendanceStatus === 'Did Not Attend' ? '#ffebee' : '#fff8e1',
                                            color: hack.attendanceStatus === 'Attended' ? '#2e7d32' :
                                                hack.attendanceStatus === 'Did Not Attend' ? '#c62828' : '#f9a825',
                                            border: `1px solid ${hack.attendanceStatus === 'Attended' ? '#a5d6a7' :
                                                hack.attendanceStatus === 'Did Not Attend' ? '#ef9a9a' : '#ffe0b2'}`
                                        }}>
                                            {hack.attendanceStatus === 'Attended' ? '  Attended' :
                                                hack.attendanceStatus === 'Did Not Attend' ? '❌ Did Not Attend' : '📝 Registered'}
                                        </span>

                                        {/* Achievement Badge */}
                                        {hack.attendanceStatus === 'Attended' && hack.achievementLevel && (
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: hack.achievementLevel === 'Winner' ? '#fff9c4' :
                                                    hack.achievementLevel === 'Runner-up' ? '#e1f5fe' : '#f3e5f5',
                                                color: hack.achievementLevel === 'Winner' ? '#f57f17' :
                                                    hack.achievementLevel === 'Runner-up' ? '#01579b' : '#6a1b9a',
                                                border: `1px solid ${hack.achievementLevel === 'Winner' ? '#fbc02d' :
                                                    hack.achievementLevel === 'Runner-up' ? '#4fc3f7' : '#ba68c8'}`
                                            }}>
                                                {hack.achievementLevel === 'Winner' ? '   Winner' :
                                                    hack.achievementLevel === 'Runner-up' ? '   Runner-up' : '📜 Participation'}
                                            </span>
                                        )}
                                    </div>

                                    {hack.status === 'Declined' && (
                                        <p style={{ color: '#d32f2f', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                            Reason: {hack.rejectionReason}
                                        </p>
                                    )}

                                    {hack.certificateFilePath && (
                                        <div style={{ marginTop: '10px' }}>
                                            <a
                                                href={hack.certificateFilePath.startsWith('http') ? hack.certificateFilePath : `${SERVER_URL}/${hack.certificateFilePath.replace(/\\/g, '/')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#1a73e8',
                                                    textDecoration: 'none',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                📄 View Certificate
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`status-badge ${hack.status.toLowerCase()}`} style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        background: hack.status === 'Accepted' ? '#e8f5e9' : hack.status === 'Declined' ? '#ffebee' : '#fff3e0',
                                        color: hack.status === 'Accepted' ? '#2e7d32' : hack.status === 'Declined' ? '#c62828' : '#ef6c00',
                                        border: `1px solid ${hack.status === 'Accepted' ? '#a5d6a7' : hack.status === 'Declined' ? '#ef9a9a' : '#ffe0b2'}`
                                    }}>
                                        {hack.status === 'Pending' ? '⏳ Pending Verification' : hack.status === 'Accepted' ? '  Accepted' : '❌ Declined'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Profile Modal - Always rendered but visibility controlled by props */}
            <ProfileCompletionModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                isMandatory={isProfileMandatory}
            />
        </div>
    );
};

export default StudentDashboard;
