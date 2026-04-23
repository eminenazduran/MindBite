import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const formatResponse = <T>(status: 'success' | 'error', message: string, data?: T) => ({
  status,
  message,
  data
});

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(formatResponse('error', 'Bu e-posta adresi zaten kullanımda.'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json(formatResponse('success', 'Kayıt başarılı.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        allergies: user.allergies,
        calorieGoal: user.calorieGoal
      }
    }));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(formatResponse('error', 'Mevcut ve yeni şifre gereklidir.'));
    }

    if (newPassword.length < 6) {
      return res.status(400).json(formatResponse('error', 'Yeni şifre en az 6 karakter olmalıdır.'));
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json(formatResponse('error', 'Mevcut şifre hatalı.'));
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json(formatResponse('success', 'Şifreniz başarıyla güncellendi.'));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json(formatResponse('error', 'Hesabı silmek için şifreniz gereklidir.'));
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json(formatResponse('error', 'Kullanıcı bulunamadı.'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json(formatResponse('error', 'Şifre hatalı.'));
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json(formatResponse('success', 'Hesabınız kalıcı olarak silindi.'));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json(formatResponse('error', 'Geçersiz e-posta veya şifre.'));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json(formatResponse('error', 'Geçersiz e-posta veya şifre.'));
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json(formatResponse('success', 'Giriş başarılı.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        allergies: user.allergies,
        calorieGoal: user.calorieGoal
      }
    }));
  } catch (error: any) {
    res.status(500).json(formatResponse('error', error.message));
  }
};
