import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';



// Import endpoint functions
import { authEndpoints } from './endpoints/auth.js';
import { userEndpoints } from './endpoints/users.js';
import { groupEndpoints } from './endpoints/groups.js';
import { postEndpoints } from './endpoints/posts.js';
import { commentEndpoints } from './endpoints/comments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get Firestore instance
const db = admin.firestore();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.db = db; // Make Firestore available to routes
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Public routes (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running!'
  });
});

// Create API router
const apiRouter = express.Router();

// Mount API router
app.use("/api", apiRouter);

// Initialize endpoints
authEndpoints(apiRouter, authenticateToken);
userEndpoints(apiRouter, authenticateToken);
groupEndpoints(apiRouter, authenticateToken);
postEndpoints(apiRouter, authenticateToken);
commentEndpoints(apiRouter, authenticateToken);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
