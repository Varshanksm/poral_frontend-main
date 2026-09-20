import React, { useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProfileCompletionModal = ({ isOpen, onClose, isMandatory }) => {
    const { user, login, token } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Initial state based on existing user data
    const [formData, setFormData] = useState({
        registerNo: user?.registerNo || '',
        year: user?.year || '1st',
        department: user?.department || 'CSBS',
        cgpa: user?.cgpa || ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.put('/student/profile', {
                ...formData,
                cgpa: Number(formData.cgpa)
            });

            // Update Auth Context and LocalStorage with new user data
            login(res.data.student, token);

            alert('Profile Updated Successfully!');
            if (onClose) onClose();
        } catch (error) {
            alert('Update Failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {isMandatory ? (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '3rem' }}>👋</div>
                        <h2 style={{ color: '#830000', margin: '10px 0' }}>Welcome to the Portal!</h2>
                        <p style={{ color: '#666' }}>Please complete your profile to continue. This helps us find the best opportunities for you.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Edit Profile</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Register Number</label>
                        <input
                            type="text"
                            name="registerNo"
                            value={formData.registerNo}
                            onChange={handleChange}
                            required
                            disabled={!isMandatory && user?.registerNo} // Lock RegNo after initial setup unless mandatory (first time)
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="CSBS">CSBS</option>
                                <option value="CSE">CSE</option>
                                <option value="IT">IT</option>
                                <option value="ECE">ECE</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                style={inputStyle}
                            >
                                <option value="1st">1st Year</option>
                                <option value="2nd">2nd Year</option>
                                <option value="3rd">3rd Year</option>
                                <option value="4th">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Current CGPA (0-10)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            name="cgpa"
                            value={formData.cgpa}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                            placeholder="e.g. 8.5"
                        />
                        <small style={{ color: '#666' }}>Used for smart matching with opportunities.</small>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#830000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Styles
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
};

export default ProfileCompletionModal;
