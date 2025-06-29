# Deployment Guide

This document outlines the deployment process for the Advocate App.

## Prerequisites

- Node.js 18+ installed
- MongoDB database
- Environment variables configured

## Frontend Deployment

1. Build the React application:
   ```bash
   npm run build
   ```

2. Deploy to hosting service (Vercel, Netlify, etc.)

## Backend Deployment

1. Set up environment variables
2. Deploy to cloud service (Heroku, AWS, etc.)
3. Configure database connection

## Environment Variables

- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for authentication
- `CLOUDINARY_URL`: Image upload service
