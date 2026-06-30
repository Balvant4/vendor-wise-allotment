import { NextResponse } from 'next/server';
import connectDB from '@/database/connection';
import User from '@/models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setCookies,
  clearCookies,
  getTokenFromRequest,
  getRefreshTokenFromRequest,
  verifyAccessToken,
} from '@/lib/auth';
import { AppError } from '@/lib/api-response';

class AuthService {
  async login(email: string, password: string, res: NextResponse): Promise<object> {
    await connectDB();

    const user = await User.findOne({ email }).select('+password +refreshTokens +isActive');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact admin.', 403, 'ACCOUNT_INACTIVE');
    }

    const payload = { id: String(user._id), role: user.role };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Keep max 5 active sessions
    user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken];
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setCookies(res, accessToken, refreshToken);
    return user.toSafeObject();
  }

  async refresh(req: Request, res: NextResponse): Promise<object> {
    await connectDB();

    const token = getRefreshTokenFromRequest(req);
    if (!token) throw new AppError('No refresh token', 401, 'NO_REFRESH_TOKEN');

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshTokens +isActive');
    if (!user)        throw new AppError('User not found', 401);
    if (!user.isActive) throw new AppError('Account deactivated', 403);

    if (!user.refreshTokens?.includes(token)) {
      // Token reuse — clear all sessions
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      clearCookies(res);
      throw new AppError('Refresh token reuse detected. Please login again.', 401, 'TOKEN_REUSE');
    }

    const payload = { id: String(user._id), role: user.role };
    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshTokens = user.refreshTokens.filter((t) => t !== token).concat(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    setCookies(res, newAccessToken, newRefreshToken);
    return user.toSafeObject();
  }

  async logout(req: Request, res: NextResponse): Promise<void> {
    await connectDB();

    const accessToken  = getTokenFromRequest(req);
    const refreshToken = getRefreshTokenFromRequest(req);

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        const user = await User.findById(decoded.id).select('+refreshTokens');
        if (user && refreshToken) {
          user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t !== refreshToken);
          await user.save({ validateBeforeSave: false });
        }
      } catch {
        // Already invalid token, just clear cookies
      }
    }

    clearCookies(res);
  }

  async getMe(req: Request): Promise<object> {
    await connectDB();

    const token = getTokenFromRequest(req);
    if (!token) throw new AppError('Authentication required', 401, 'NO_TOKEN');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404);

    return user.toSafeObject();
  }
}

export const authService = new AuthService();
