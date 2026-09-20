import React, { useState } from 'react';
import API from '../services/api';

const UserManagement = ({
    students,
    proctors,
    admins,
    userStats,
    onEditUser,
    onDeleteUser,
    editingUser,
    editForm,
    setEditForm,
    onUpdateUser,
    setEditingUser
}) => {
    const [activeUserTab, setActiveUserTab] = useState('students');
    const [selectedProctorFilter, setSelectedProctorFilter] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [creatingUser, setCreatingUser] = useState(null); // 'proctor'
    const [createForm, setCreateForm] = useState({ name: '', email: '', department: '', password: '' });

    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
        setUploadResult(null);
    };

    const handleCreateUser = async () => {
        try {
            await API.post('/users/proctors', createForm);
            alert('Proctor created successfully');
            setCreatingUser(null);
            setCreateForm({ name: '', email: '', department: '', password: '' });
            // Ideally notify parent to refresh
        } catch (error) {
            alert('Failed to create proctor: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleCreateFormChange = (field, value) => {
        setCreateForm(prev => ({ ...prev, [field]: value }));
    };

    const handleBulkUpload = async (type) => {
        if (!uploadFile) return alert('Please select a file first');

        const formData = new FormData();
        formData.append('file', uploadFile);

        setUploading(true);
        try {
            const endpoint = `/users/${type}s/bulk-upload`;
            const res = await API.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult(res.data);
            alert('Bulk upload processed!');
            // Refresh data if possible, though exact refresh might require parent re-fetch
            // Ideally call a prop function like onRefresh()
        } catch (error) {
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
            setUploadFile(null);
        }
    };

    const handleFormChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const getProctorName = (proctorId) => {
        if (!proctorId) return 'Not Assigned';
        const proctor = proctors.find(p => p._id === proctorId);
        return proctor ? proctor.name : 'Unknown';
    };

    const getFilteredUsers = () => {
        if (activeUserTab === 'students') {
            if (!selectedProctorFilter) return students;
            return students.filter(s => s.proctorId === selectedProctorFilter);
        }
        if (activeUserTab === 'proctors') return proctors;
        if (activeUserTab === 'admins') return admins;
        return [];
    };

    const renderUserTable = (users, type) => {
        const getFields = (user, userType) => {
            switch (userType) {
                case 'student':
                    return [
                        { label: 'Name', value: user.name },
                        { label: 'Email', value: user.email },
                        { label: 'Register No', value: user.registerNo },
                        { label: 'Department', value: user.department },
                        { label: 'Year', value: user.year },
                        { label: 'Proctor', value: getProctorName(user.proctorId) },
                        { label: 'Hackathons Attended', value: user.credits || 0 }
                    ];
                case 'proctor':
                    return [
                        { label: 'Name', value: user.name },
                        { label: 'Email', value: user.email },
                        { label: 'Department', value: user.department },
                        { label: 'Assigned Students', value: user.assignedStudents?.length || 0 }
                    ];
                case 'admin':
                    return [
                        { label: 'Email', value: user.email }
                    ];
                default:
                    return [];
            }
        };

        return (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                            {getFields(users[0] || {}, type).map(field => (
                                <th key={field.label} style={{ padding: '12px' }}>{field.label}</th>
                            ))}
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                                {getFields(user, type).map(field => (
                                    <td key={field.label} style={{ padding: '12px' }}>
                                        {field.value}
                                    </td>
                                ))}
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => onEditUser(user, type)}
                                        style={{
                                            background: '#2196f3',
                                            color: 'white',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '4px',
                                            marginRight: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDeleteUser(user, type)}
                                        style={{
                                            background: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderEditForm = () => {
        if (!editingUser) return null;

        const { type } = editingUser;
        const renderFields = () => {
            switch (type) {
                case 'student':
                    return (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                                <input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Register No:</label>
                                <input
                                    type="text"
                                    value={editForm.registerNo || ''}
                                    onChange={(e) => handleFormChange('registerNo', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department:</label>
                                <select
                                    value={editForm.department || ''}
                                    onChange={(e) => handleFormChange('department', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">Select Department</option>
                                    <option value="CSBS">CSBS</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="MECH">MECH</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year:</label>
                                <select
                                    value={editForm.year || ''}
                                    onChange={(e) => handleFormChange('year', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">Select Year</option>
                                    <option value="1st">1st</option>
                                    <option value="2nd">2nd</option>
                                    <option value="3rd">3rd</option>
                                    <option value="4th">4th</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Assign Proctor:</label>
                                <select
                                    value={editForm.proctorId || ''}
                                    onChange={(e) => handleFormChange('proctorId', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">No Proctor Assigned</option>
                                    {proctors.map(proctor => (
                                        <option key={proctor._id} value={proctor._id}>
                                            {proctor.name} ({proctor.department})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    );
                case 'proctor':
                    return (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                                <input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={(e) => handleFormChange('email', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department:</label>
                                <select
                                    value={editForm.department || ''}
                                    onChange={(e) => handleFormChange('department', e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">Select Department</option>
                                    <option value="CSBS">CSBS</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="MECH">MECH</option>
                                </select>
                            </div>
                        </>
                    );
                case 'admin':
                    return (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                            <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => handleFormChange('email', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                    );
                default:
                    return null;
            }
        };

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    width: '500px',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#830000' }}>
                        Edit {type.charAt(0).toUpperCase() + type.slice(1)}
                    </h3>
                    {renderFields()}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setEditingUser(null)}
                            style={{
                                background: '#666',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onUpdateUser}
                            style={{
                                background: '#830000',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* User Statistics */}
            {userStats && (
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div className="stat-card" style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Total Users</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{userStats.total}</p>
                    </div>
                    <div className="stat-card" style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>Students</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{userStats.students}</p>
                    </div>
                    <div className="stat-card" style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Proctors</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{userStats.proctors}</p>
                    </div>
                    <div className="stat-card" style={{ background: '#fff3e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Admins</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{userStats.admins}</p>
                    </div>
                </div>
            )}

            {/* User Type Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                {['students', 'proctors', 'admins'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveUserTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: activeUserTab === tab ? '#830000' : '#f5f5f5',
                            color: activeUserTab === tab ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'students' ? students.length : tab === 'proctors' ? proctors.length : admins.length})
                    </button>
                ))}
            </div>

            {/* Proctor Filter for Students Tab */}
            {activeUserTab === 'students' && (
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Proctor:</label>
                    <select
                        value={selectedProctorFilter}
                        onChange={(e) => setSelectedProctorFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="">All Proctors</option>
                        {proctors.map(proctor => (
                            <option key={proctor._id} value={proctor._id}>
                                {proctor.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Bulk Upload Section */}
            {(activeUserTab === 'students' || activeUserTab === 'proctors') && (
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #2196f3' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Bulk Upload {activeUserTab.charAt(0).toUpperCase() + activeUserTab.slice(1)}</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            style={{ padding: '8px', background: 'white', borderRadius: '4px' }}
                        />
                        <button
                            onClick={() => handleBulkUpload(activeUserTab.slice(0, -1))} // removed 's'
                            disabled={!uploadFile || uploading}
                            style={{
                                padding: '8px 16px',
                                background: uploading ? '#ccc' : '#1565c0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: uploading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {uploading ? 'Processing...' : 'Upload Excel'}
                        </button>
                    </div>
                    {uploadResult && (
                        <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                            <p style={{ margin: '5px 0', color: 'green' }}>✓ Success: {uploadResult.summary.success}</p>
                            <p style={{ margin: '5px 0', color: 'red' }}>✗ Failed: {uploadResult.summary.failed}</p>
                            {uploadResult.summary.errors.length > 0 && (
                                <details>
                                    <summary style={{ cursor: 'pointer', color: '#d32f2f' }}>View Errors</summary>
                                    <ul style={{ maxHeight: '100px', overflowY: 'auto', background: 'white', padding: '5px 20px', borderRadius: '4px' }}>
                                        {uploadResult.summary.errors.map((err, idx) => (
                                            <li key={idx}>Row {JSON.stringify(err.row)}: {err.error}</li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                        Required Columns: {activeUserTab === 'students' ? 'Name, Email, RegisterNo, Department, Year, Password' : 'Name, Email, Department, Password'}
                    </p>
                </div>
            )}

            {/* User Tables */}
            <div className="list-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '20px' }}>
                    {activeUserTab.charAt(0).toUpperCase() + activeUserTab.slice(1)} Management
                </h3>

                {activeUserTab === 'proctors' && (
                    <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                        <button
                            onClick={() => setCreatingUser('proctor')}
                            style={{
                                padding: '8px 16px',
                                background: '#2e7d32',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            + Add New Proctor
                        </button>
                    </div>
                )}

                {renderUserTable(getFilteredUsers(), activeUserTab.slice(0, -1))}
            </div>

            {/* Edit Form Modal */}
            {renderEditForm()}

            {/* Create User Modal */}
            {creatingUser === 'proctor' && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#830000' }}>Add New Proctor</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                            <input
                                type="text"
                                value={createForm.name}
                                onChange={(e) => handleCreateFormChange('name', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                            <input
                                type="email"
                                value={createForm.email}
                                onChange={(e) => handleCreateFormChange('email', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Department:</label>
                            <select
                                value={createForm.department}
                                onChange={(e) => handleCreateFormChange('department', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">Select Department</option>
                                <option value="CSBS">CSBS</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                                <option value="IT">IT</option>
                                <option value="CIVIL">CIVIL</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
                            <input
                                type="password"
                                value={createForm.password}
                                onChange={(e) => handleCreateFormChange('password', e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={() => setCreatingUser(null)}
                                style={{ background: '#666', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateUser}
                                style={{ background: '#830000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Create Proctor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
