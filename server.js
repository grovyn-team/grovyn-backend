import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import careersRoutes from './routes/careers.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.urlencoded({ extended: true }));
app.use(careersRoutes);
app.use(contactRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is up and running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;