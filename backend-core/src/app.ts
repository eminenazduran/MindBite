import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes';
import scanRoutes from './routes/scanRoutes';
import foodRoutes from './routes/foodRoutes';
import authRoutes from './routes/authRoutes';

// Express uygulamasını başlat
const app: Application = express();

// Güvenlik ve Utility Middleware'leri
app.use(helmet()); // Temel HTTP güvenlik başlıkları
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json()); // Gelen JSON verilerini parse et
app.use(morgan('dev')); // İstek loglama

// Basit Sağlık Kontrolü Route'u
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Gıda Platformu Backend Servisi Çalışıyor 🚀',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/food', foodRoutes);

// 404 Route Bulunamadı Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: `Tanımlanmayan Endpoint: ${req.originalUrl}`
  });
});

// Global Hata Yakalama (Error Handler)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Global Hata Yakalandı:', err.message);
  res.status(500).json({
    status: 'error',
    message: 'Sunucu İçi Hata Oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
