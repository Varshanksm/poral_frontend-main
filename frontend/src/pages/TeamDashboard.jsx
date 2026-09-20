import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const TeamDashboard = () => {
    const { user } = useContext(AuthContext);
    const { hackathonId } = useParams();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [hackathon, setHackathon] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTeamAndHackathon();
    }, [hackathonId]);

    const fetchTeamAndHackathon = async () => {
        try {
            setLoading(true);
            const hackRes = await API.get(`/upcoming-hackathons/${hackathonId}`);
            setHackathon(hackRes.data);

            try {
                const teamRes = await API.get(`/teams/my-team/${hackathonId}`);
                setTeam(teamRes.data);
            } catch (err) {
                if (err.response?.status !== 404) throw err;
            }
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await API.post('/teams/create', { teamName, upcomingHackathonId: hackathonId });
            setTeam(res.data.team);
            setSuccess('Team created successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create team');
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await API.post('/teams/join', { teamCode });
            setTeam(res.data.team);
            setSuccess('Joined team successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join team');
        }
    };

    const handleProceed = async () => {
        if (!window.confirm('Mark team as filled? Members can then start submitting certificates.')) return;
        setError('');
        try {
            await API.post(`/teams/submit/${team._id}`);
            setSuccess('Team locked! Now members can upload their certificates.');
            fetchTeamAndHackathon();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to proceed');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('certificate', file);

        setUploading(true);
        setError('');
        try {
            const safeTeamName = encodeURIComponent(team.teamName.trim());
            await API.post(`/teams/upload-certificate/${team._id}?teamName=${safeTeamName}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Certificate uploaded successfully!');
            fetchTeamAndHackathon();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="dashboard-container"><p>Loading team status...</p></div>;

    const currentUserId = user?._id || user?.id;

    return (
        <div className="dashboard-container" style={{ maxWidth: '900px', margin: '40px auto' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', color: '#830000', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}
            >
                ← Back
            </button>

            {hackathon && (
                <div style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #830000', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ margin: 0 }}>{hackathon.title}</h2>
                    <p style={{ color: '#666', margin: '5px 0' }}>{hackathon.organization}</p>
                </div>
            )}

            {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}
            {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>{success}</div>}

            {!team ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚀</div>
                        <h3>Create a Team</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Start a new team and invite your friends to join.</p>
                        <form onSubmit={handleCreateTeam}>
                            <input
                                type="text"
                                placeholder="Enter Team Name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                            <button className="submit-btn" style={{ width: '100%', background: '#830000' }}>Create Team</button>
                        </form>
                    </div>

                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤝</div>
                        <h3>Join a Team</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>Enter the unique team code shared by your team leader.</p>
                        <form onSubmit={handleJoinTeam}>
                            <input
                                type="text"
                                placeholder="Enter Team Code"
                                value={teamCode}
                                onChange={(e) => setTeamCode(e.target.value)}
                                required
                                style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                            <button className="submit-btn" style={{ width: '100%', background: '#ff9800' }}>Join Team</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f0f0f0', paddingBottom: '15px' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#333' }}>Team: {team.teamName}</h2>
                            <span style={{
                                background: team.status === 'Approved' ? '#e8f5e9' : team.status === 'Pending Approval' ? '#fff3e0' : '#f5f5f5',
                                color: team.status === 'Approved' ? '#2e7d32' : team.status === 'Pending Approval' ? '#ef6c00' : '#666',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                marginTop: '5px',
                                display: 'inline-block'
                            }}>
                                {team.status === 'Pending Approval' ? 'Submission Phase' : team.status}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Team Code</p>
                            <h3 style={{ margin: 0, color: '#830000', letterSpacing: '2px' }}>{team.teamCode}</h3>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ color: '#333', margin: 0 }}>Members ({team.members.length})</h4>
                            {team.status !== 'Draft' && <p style={{ margin: 0, color: '#830000', fontSize: '0.85rem', fontWeight: 'bold' }}>All members must upload certificates</p>}
                        </div>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {team.members.map((member, idx) => {
                                const isMe = member.studentId?.toString() === currentUserId?.toString();
                                return (
                                    <div key={idx} style={{
                                        padding: '15px 20px',
                                        background: '#f8f9fa',
                                        borderRadius: '10px',
                                        border: isMe ? '1px solid #830000' : '1px solid #eee',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                {member.name} {team.leaderId === member.studentId && <span style={{ color: '#830000', fontSize: '0.7rem' }}>(Leader)</span>}
                                                {isMe && <span style={{ color: '#1a73e8', fontSize: '0.7rem', marginLeft: '5px' }}>(You)</span>}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{member.registerNo} • {member.department}</p>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                color: member.certificateStatus === 'Uploaded' ? '#2e7d32' : '#999',
                                                background: member.certificateStatus === 'Uploaded' ? '#e8f5e9' : '#eee',
                                                padding: '2px 8px',
                                                borderRadius: '4px'
                                            }}>
                                                {member.certificateStatus || 'Pending'}
                                            </span>

                                            {isMe && team.status !== 'Draft' && member.certificateStatus !== 'Uploaded' && (
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="file"
                                                        id="cert-upload"
                                                        hidden
                                                        onChange={handleFileUpload}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        disabled={uploading}
                                                    />
                                                    <label
                                                        htmlFor="cert-upload"
                                                        style={{
                                                            padding: '6px 15px',
                                                            background: '#830000',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {uploading ? 'Uploading...' : 'Upload Certificate'}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {team.leaderId === currentUserId && team.status === 'Draft' && (
                        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '15px' }}>Min 2 members. Proceeding will lock the team and enable certificate uploads.</p>
                            <button
                                onClick={handleProceed}
                                disabled={team.members.length < 2}
                                style={{
                                    padding: '12px 40px',
                                    background: team.members.length < 2 ? '#ccc' : '#830000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: team.members.length < 2 ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                Team is Filled - Proceed
                            </button>
                        </div>
                    )}

                    {team.status === 'Declined' && (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
                            <strong>Rejection Reason:</strong> {team.rejectionReason}
                        </div>
                    )}

                    {team.status === 'Approved' && (
                        <div style={{ marginTop: '20px', padding: '20px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7', textAlign: 'center' }}>
                            <h3 style={{ margin: 0, color: '#2e7d32' }}>🎉 Congratulations!</h3>
                            <p style={{ margin: '5px 0 0 0', color: '#388e3c' }}>Your team and certificates have been verified and approved by the proctor.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamDashboard;
