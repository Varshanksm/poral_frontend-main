# Deployment Guide - Hackathon Management Portal

This guide provides instructions for deploying the Hackathon Management Portal to production environments.

## 1. Database Setup (MongoDB Atlas)

1.  Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a new Cluster (the free tier works fine).
3.  Go to **Database Access** and create a user with "Read and Write to any database" permissions.
4.  Go to **Network Access** and add IP `0.0.0.0/0` (allows access from anywhere).
5.  In the **Deployment > Databases** tab, click **Connect > Drivers**.
6.  Copy the connection string (it looks like `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).
7.  Replace `<password>` with your database user's password.

## 2. Backend Deployment (Render / Railway)

### Using Render
1.  Connect your GitHub repository to [Render](https://render.com/).
2.  Create a new **Web Service**.
3.  Select the `backend` directory or point the root to the `backend` folder.
4.  **Build Command**: `npm install`
5.  **Start Command**: `npm start`
6.  **Environment Variables**:
    *   `PORT`: `5000`
    *   `MONGO_URI`: (Your MongoDB Atlas connection string)
    *   `JWT_SECRET`: (A long, random string)
    *   `EMAIL_USER`: (Your Gmail/SMTP email)
    *   `EMAIL_PASS`: (Your Gmail App Password)

## 3. Frontend Deployment (Vercel / Netlify)

### Using Vercel
1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Create a new Project.
3.  Select the `frontend` directory.
4.  **Framework Preset**: Vite
5.  **Environment Variables**:
    *   `VITE_API_URL`: (The URL of your deployed Backend, e.g., `https://your-backend.onrender.com/api`)

## 4. Production Tips

- **Folder Structure**: The server is designed to automatically create the `uploads` directory structure on startup.
- **SSL**: Most platforms (Render, Vercel) provide free SSL (https) automatically.
- **Environment Files**: Never commit your `.env` file to GitHub. Use the platform's dashboard to set environment variables.
