import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const OpportunityManager = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [upcomingHackathons, setUpcomingHackathons] = useState([]);
    const [activeTab, setActiveTab] = useState('list'); // list, create, view
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'Conference',
        organization: '',
        description: '',
        minCGPA: 0,
        minCredits: 0,
        allowedDepartments: [],
        eligibleYears: [],
        deadline: '',
        eventDate: '',
        upcomingHackathonId: ''
    });
    const [poster, setPoster] = useState(null);

    const departments = ['CSE', 'CSBS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
    const years = ['1st', '2nd', '3rd', '4th'];

    useEffect(() => {
        fetchOpportunities();
        fetchUpcomingHackathons();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const res = await API.get('/opportunities');
            setOpportunities(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUpcomingHackathons = async () => {
        try {
            const res = await API.get('/upcoming-hackathons');
            setUpcomingHackathons(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleHackathonSelect = (e) => {
        const hackathonId = e.target.value;
        if (!hackathonId) {
            setFormData({
                ...formData,
                upcomingHackathonId: '',
                title: '',
                organization: '',
                description: '',
                deadline: '',
                eventDate: ''
            });
            return;
        }

        const hackathon = upcomingHackathons.find(h => h._id === hackathonId);
        if (hackathon) {
            setFormData({
                ...formData,
                upcomingHackathonId: hackathonId,
                title: hackathon.title,
                type: 'Hackathon',
                organization: hackathon.organization,
                description: hackathon.description,
                deadline: hackathon.registrationDeadline.split('T')[0],
                eventDate: hackathon.hackathonDate.split('T')[0]
            });
        }
    };

    const handleCheckboxChange = (e, field) => {
        const { value, checked } = e.target;
        let updatedList = [...formData[field]];
        if (checked) {
            updatedList.push(value);
        } else {
            updatedList = updatedList.filter(item => item !== value);
        }
        setFormData({ ...formData, [field]: updatedList });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (Array.isArray(formData[key])) {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });
            if (poster) data.append('poster', poster);

            await API.post('/opportunities', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Opportunity Created Successfully!');
            fetchOpportunities();
            setActiveTab('list');
            setFormData({
                title: '', type: 'Conference', organization: '', description: '',
                minCGPA: 0, minCredits: 0, allowedDepartments: [], eligibleYears: [],
                deadline: '', eventDate: '', upcomingHackathonId: ''
            });
            setPoster(null);
        } catch (error) {
            alert('Failed to create opportunity');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (opp) => {
        setScanning(true);
        setSelectedOpp(opp);
        try {
            const res = await API.post(`/opportunities/${opp._id}/scan`);
            setScanResult(res.data);
            setActiveTab('scan');
        } catch (error) {
            alert('Scan failed');
        } finally {
            setScanning(false);
        }
    };

    const handleInvite = async () => {
        if (!scanResult || !selectedOpp) return;
        try {
            const candidateIds = scanResult.candidates.map(c => c._id);
            await API.post(`/opportunities/${selectedOpp._id}/invite`, { candidateIds });
            alert(`Invitations sent to ${candidateIds.length} students!`);
            setActiveTab('list');
            setScanResult(null);
        } catch (error) {
            alert('Failed to send invites');
        }
    };

    return (
        <div className="opportunity-manager">
            <div className="opp-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Smart Opportunity Manager</h3>
                <div>
                    <button
                        onClick={() => setActiveTab('list')}
                        style={tabStyle(activeTab === 'list')}
                    > Manage</button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        style={tabStyle(activeTab === 'analytics')}
                    > 📊 Analytics</button>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={tabStyle(activeTab === 'create')}
                    > Create New</button>
                </div>
            </div>

            {activeTab === 'analytics' && (
                <div className="analytics-view">
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div style={kpiCardStyle}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Reach</h4>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#830000', fontWeight: 'bold' }}>
                                {opportunities.reduce((acc, curr) => acc + curr.invitedStudents.length, 0)}
                            </p>
                            <small>Students Invited</small>
                        </div>
                        <div style={kpiCardStyle}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Interested</h4>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#2e7d32', fontWeight: 'bold' }}>
                                {opportunities.reduce((acc, curr) => acc + (curr.interestedStudents ? curr.interestedStudents.length : 0), 0)}
                            </p>
                            <small>Positive Responses</small>
                        </div>
                        <div style={kpiCardStyle}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Conversion Rate</h4>
                            <p style={{ fontSize: '2rem', margin: 0, color: '#1976d2', fontWeight: 'bold' }}>
                                {(() => {
                                    const totalInvited = opportunities.reduce((acc, curr) => acc + curr.invitedStudents.length, 0);
                                    const totalInterested = opportunities.reduce((acc, curr) => acc + (curr.interestedStudents ? curr.interestedStudents.length : 0), 0);
                                    return totalInvited ? ((totalInterested / totalInvited) * 100).toFixed(1) : 0;
                                })()}%
                            </p>
                            <small>Engagement Level</small>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '400px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Event Performance</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Recharts BarChart rendering */}
                            <BarChart data={opportunities} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="invitedStudents.length" name="Invited" fill="#830000" />
                                <Bar dataKey="interestedStudents.length" name="Interested" fill="#2e7d32" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'create' && (
                <div className="form-card" style={cardStyle}>
                    <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Link to Upcoming Hackathon (Optional)</label>
                        <select
                            value={formData.upcomingHackathonId}
                            onChange={handleHackathonSelect}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">-- Select a Hackathon to pre-fill data --</option>
                            {upcomingHackathons.map(h => (
                                <option key={h._id} value={h._id}>{h.title} ({h.organization})</option>
                            ))}
                        </select>
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Selecting a hackathon will automatically fill the title, organization, and dates.</small>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={gridStyle}>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select name="type" value={formData.type} onChange={handleInputChange}>
                                    <option value="Conference">Conference</option>
                                    <option value="Hackathon">Hackathon</option>
                                    <option value="Workshop">Workshop</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Organization</label>
                                <input type="text" name="organization" value={formData.organization} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Event Date</label>
                                <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Deadline</label>
                                <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <h4 style={{ marginTop: '20px', borderBottom: '1px solid #eee' }}>Eligibility Criteria</h4>
                        <div style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
                            <div style={{ flex: 1 }}>
                                <label>Min CGPA: <strong>{formData.minCGPA}</strong></label>
                                <input
                                    type="range" min="0" max="10" step="0.1"
                                    name="minCGPA" value={formData.minCGPA} onChange={handleInputChange}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Min Past Credits: <strong>{formData.minCredits}</strong></label>
                                <input
                                    type="number" name="minCredits" value={formData.minCredits} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Allowed Departments</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {departments.map(dept => (
                                    <label key={dept} style={{ background: '#f5f5f5', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox" value={dept}
                                            checked={formData.allowedDepartments.includes(dept)}
                                            onChange={(e) => handleCheckboxChange(e, 'allowedDepartments')}
                                        /> {dept}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required></textarea>
                        </div>

                        <div className="form-group">
                            <label>Poster</label>
                            <input type="file" onChange={(e) => setPoster(e.target.files[0])} />
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '20px', width: '100%' }}>
                            {loading ? 'Creating...' : 'Create Opportunity'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="list-view">
                    {opportunities.map(opp => (
                        <div key={opp._id} style={{ ...cardStyle, marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>{opp.title} <span style={{ fontSize: '0.8rem', background: '#e3f2fd', padding: '2px 6px', borderRadius: '4px' }}>{opp.type}</span></h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                                    {opp.organization} • Min CGPA: {opp.criteria.minCGPA}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '5px', fontSize: '0.85rem', color: '#666' }}>
                                    Invited: <strong>{opp.invitedStudents.length}</strong> • Interested: <strong style={{ color: '#2e7d32' }}>{opp.interestedStudents ? opp.interestedStudents.length : 0}</strong>
                                </div>
                                <button
                                    onClick={() => handleScan(opp)}
                                    style={{ background: '#830000', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    🔍 Scan & Invite
                                </button>
                            </div>
                        </div>
                    ))}
                    {opportunities.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No opportunities created yet.</p>}
                </div>
            )}

            {activeTab === 'scan' && scanResult && selectedOpp && (
                <div className="scan-results" style={cardStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3>🎯 Match Results</h3>
                        <p>Found <strong>{scanResult.count}</strong> students matching criteria for <strong>{selectedOpp.title}</strong></p>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>CGPA</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Credits</th>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Dept</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scanResult.candidates.map(c => (
                                    <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{c.name}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#2e7d32' }}>{c.cgpa}</td>
                                        <td style={{ padding: '10px' }}>{c.credits}</td>
                                        <td style={{ padding: '10px' }}>{c.department}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setActiveTab('list')}
                            style={{ flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInvite}
                            style={{ flex: 1, padding: '10px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ✉️ Send {scanResult.count} Invites
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const cardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
};

const tabStyle = (active) => ({
    padding: '8px 16px',
    background: active ? '#830000' : '#f5f5f5',
    color: active ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px',
    marginLeft: '10px',
    cursor: 'pointer'
});

const kpiCardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #eee'
};

export default OpportunityManager;
