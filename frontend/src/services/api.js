import axios from 'axios';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const API = axios.create({
    baseURL: `${SERVER_URL}/api`,
});

export { SERVER_URL };

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;
