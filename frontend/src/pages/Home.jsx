import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { SERVER_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import tceLogo from '../assets/header_logo.png';

import { motion } from 'framer-motion';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [hackathons, setHackathons] = useState([]);
    const [upcomingHackathons, setUpcomingHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upcomingLoading, setUpcomingLoading] = useState(true);
    const [selectedPoster, setSelectedPoster] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hackathonsRes, upcomingRes] = await Promise.all([
                    API.get('/hackathons/accepted'),
                    API.get('/upcoming-hackathons')
                ]);
                setHackathons(hackathonsRes.data);
                setUpcomingHackathons(upcomingRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
                setUpcomingLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group hackathons by student
    const groupedByStudent = hackathons.reduce((acc, hackathon) => {
        const studentId = hackathon.studentId?._id;
        if (!studentId) return acc;
        if (!acc[studentId]) {
            acc[studentId] = {
                student: hackathon.studentId,
                hackathons: []
            };
        }
        acc[studentId].hackathons.push(hackathon);
        return acc;
    }, {});

    const [expandedStudentId, setExpandedStudentId] = useState(null);

    const toggleExpand = (studentId) => {
        setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
    };

    return (
        <div className="home-container">
            <motion.header
                className="hero-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <motion.p
                    className="college-name"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Thiagarajar College of Engineering
                </motion.p>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Department of Computer Science and Business Systems
                </motion.h1>
                <motion.div
                    className="divider"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                ></motion.div>
                <motion.p
                    className="welcome-text"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    Welcome to the Hackathon Management Portal. This platform facilitates the seamless submission, verification, and approval of student hackathon participations.
                    Track your progress and view approved hackathons from your peers.
                </motion.p>
            </motion.header>

            {/* Upcoming Hackathons Section */}
            <section className="upcoming-section">
                <h2 className="section-title">Upcoming Hackathons</h2>
                {upcomingLoading ? (
                    <div className="loader-container">
                        <p>Discovering new opportunities...</p>
                    </div>
                ) : upcomingHackathons.length === 0 ? (
                    <p className="no-data">No upcoming hackathons at the moment. Check back soon!</p>
                ) : (
                    <div className="upcoming-grid">
                        {upcomingHackathons.map((hackathon, index) => (
                            <motion.div
                                key={hackathon._id}
                                className="upcoming-hackathon-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="poster-wrapper" onClick={() => setSelectedPoster({
                                    url: hackathon.posterPath ? (hackathon.posterPath.startsWith('http') ? hackathon.posterPath : `${SERVER_URL}/${hackathon.posterPath.replace(/\\/g, '/')}`) : 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                    title: hackathon.title
                                })}>
                                    <img
                                        src={hackathon.posterPath ? (hackathon.posterPath.startsWith('http') ? hackathon.posterPath : `${SERVER_URL}/${hackathon.posterPath.replace(/\\/g, '/')}`) : 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                        alt={hackathon.title}
                                        crossOrigin="anonymous"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            e.target.onerror = null; // Prevent infinite loop
                                            e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                        }}
                                    />
                                </div>

                                <div className="card-content">
                                    <h3>{hackathon.title}</h3>

                                    <div className="info-list">
                                        <div className="info-item"><strong>Organization</strong> <span>{hackathon.organization}</span></div>
                                        <div className="info-item"><strong>Mode</strong> <span>{hackathon.mode}</span></div>
                                        <div className="info-item"><strong>Date</strong> <span>{new Date(hackathon.hackathonDate).toLocaleDateString()}</span></div>
                                        <div className="info-item" style={{ color: '#e11d48' }}><strong>Deadline</strong> <span>{new Date(hackathon.registrationDeadline).toLocaleDateString()}</span></div>
                                    </div>

                                    <p className="card-description">
                                        {hackathon.description.length > 120
                                            ? hackathon.description.substring(0, 120) + '...'
                                            : hackathon.description}
                                    </p>

                                    {hackathon.posterPath && (
                                        <a
                                            href={hackathon.posterPath.startsWith('http') ? hackathon.posterPath : `${SERVER_URL}/${hackathon.posterPath.replace(/\\/g, '/')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block',
                                                marginTop: '10px',
                                                color: '#1a73e8',
                                                textDecoration: 'none',
                                                fontWeight: '600',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🖼️ View Poster
                                        </a>
                                    )}

                                    {user && user.role === 'student' && (
                                        <div className="card-actions">
                                            <button
                                                onClick={() => navigate(`/enroll/${hackathon._id}`)}
                                                className="btn-primary"
                                            >
                                                Enroll Now
                                            </button>
                                            <button
                                                onClick={() => navigate(`/team-matching/${hackathon._id}`)}
                                                className="btn-secondary"
                                            >
                                                Team Matching
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <section className="approved-section">
                <h2 className="section-title">Hall of Fame</h2>
                {loading ? (
                    <p className="no-data">Loading achievements...</p>
                ) : Object.keys(groupedByStudent).length === 0 ? (
                    <p className="no-data">Great things are about to happen. No completions yet.</p>
                ) : (
                    <>
                        {['1st', '2nd', '3rd', '4th'].map((year) => {
                            const yearStudents = Object.values(groupedByStudent).filter(
                                ({ student }) => student.year === year
                            );
                            if (yearStudents.length === 0) return null;

                            return (
                                <div key={year} className="year-group">
                                    <div className="year-header">
                                        <h3>Batch: {year} Year</h3>
                                    </div>
                                    <div className="table-wrapper">
                                        <table className="hackathon-table">
                                            <thead>
                                                <tr>
                                                    <th>Reg No</th>
                                                    <th>Student Name</th>
                                                    <th>Department</th>
                                                    <th>Year</th>
                                                    <th>Hackathons</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {yearStudents.map(({ student, hackathons }) => (
                                                    <React.Fragment key={student._id}>
                                                        <tr className={`student-row ${expandedStudentId === student._id ? 'expanded' : ''}`} onClick={() => toggleExpand(student._id)}>
                                                            <td style={{ fontWeight: '600' }}>{student.registerNo}</td>
                                                            <td style={{ color: 'var(--secondary)', fontWeight: '500' }}>{student.name}</td>
                                                            <td>{student.department}</td>
                                                            <td>{student.year}</td>
                                                            <td><span className="badge-count">{hackathons.length} Successes</span></td>
                                                            <td>
                                                                <button className="expand-btn">
                                                                    {expandedStudentId === student._id ? 'Close' : 'View Details'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        {expandedStudentId === student._id && (
                                                            <tr className="details-row">
                                                                <td colSpan="6">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        className="details-container"
                                                                    >
                                                                        <h4>Achievement Showcase</h4>
                                                                        <div className="details-grid">
                                                                            {hackathons.map(hack => (
                                                                                <div key={hack._id} className="detail-card">
                                                                                    <h5>{hack.hackathonTitle || hack.companyName}</h5>
                                                                                    <p><strong>Org:</strong> {hack.organization || hack.companyName}</p>
                                                                                    <p><strong>Date:</strong> {new Date(hack.date || hack.durationFrom).toLocaleDateString()}</p>
                                                                                    <p className="description">{hack.description}</p>
                                                                                    {hack.certificateFilePath && (
                                                                                        <a
                                                                                            href={hack.certificateFilePath.startsWith('http') ? hack.certificateFilePath : `${SERVER_URL}/${hack.certificateFilePath.replace(/\\/g, '/')}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="view-cert-link"
                                                                                            style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}
                                                                                        >
                                                                                            📄 View Certificate
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </section>

            {/* Contact Information */}
            <section className="contact-section">
                <motion.div
                    className="contact-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Get In Touch</h2>
                    <img src={tceLogo} alt="TCE Logo" className="contact-logo" />
                    <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--secondary)' }}>Thiagarajar College of Engineering</p>
                    <p style={{ color: 'var(--text-muted)' }}>Madurai - 625 015, Tamil Nadu, India</p>
                    <div style={{ marginTop: '30px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
                        <p>📞 <strong>+91 452 2482240</strong></p>
                        <p>🌐 <a href="http://www.tce.edu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>www.tce.edu</a></p>
                    </div>
                </motion.div>
            </section>

            {/* Poster Modal */}
            {selectedPoster && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedPoster(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close" onClick={() => setSelectedPoster(null)}>×</button>
                        <img
                            src={selectedPoster.url}
                            alt={selectedPoster.title}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                            }}
                        />
                        <h3>{selectedPoster.title}</h3>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Home;
