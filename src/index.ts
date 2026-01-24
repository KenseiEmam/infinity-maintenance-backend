import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user';
import customerRoutes from './routes/customer';
import machineRoutes from './routes/machine';
import callRoutes from './routes/call';
import jobSheetRoutes from './routes/jobSheet';
import scheduledVisitRoutes from './routes/scheduledVisit';


import emailRoutes from './routes/email'
import { authenticateApp } from "./auth"

import './cron'

dotenv.config();

const app = express();
app.use(cors());


app.use(express.json());
app.use(authenticateApp)
// ==================== API ROUTES ====================
app.use('/api/users', userRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/machine', machineRoutes);
app.use('/api/call', callRoutes);
app.use('/api/job-sheet', jobSheetRoutes);
app.use('/api/scheduled-visit', scheduledVisitRoutes);
app.use("/api/email", emailRoutes)

// ==================== SERVER ==================== 
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
