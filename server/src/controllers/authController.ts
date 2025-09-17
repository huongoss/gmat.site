import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, generateVerificationToken, sendPasswordResetEmail } from '../services/email';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'testsecret';
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
};

const signToken = (id: string) =>
  jwt.sign({ id }, getJwtSecret(), { expiresIn: '1h' });

const register = async (req: Request, res: Response) => {
    const { email, password, username } = req.body as { email: string; password: string; username?: string };

    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = new User({ 
            email, 
            username, 
            password: hashedPassword,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            emailVerified: false
        });
        await newUser.save();

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email sending fails
        }

        const token = signToken(String(newUser._id));
        const user = { 
            _id: newUser._id, 
            email: newUser.email, 
            username: newUser.username, 
            subscriptionActive: newUser.subscriptionActive,
            emailVerified: newUser.emailVerified
        };
        res.status(201).json({ 
            message: 'User registered successfully! Please check your email to verify your account.', 
            token, 
            user 
        });
    } catch (error: any) {
        if (error?.message === 'JWT_SECRET is not set') {
            return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
        }
        res.status(500).json({ message: 'Error registering user', error });
    }
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = signToken(String(user._id));
        const payload = { 
            _id: user._id, 
            email: user.email, 
            username: user.username, 
            subscriptionActive: user.subscriptionActive, 
            stripeCustomerId: user.stripeCustomerId, 
            subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            emailVerified: user.emailVerified
        };
        res.status(200).json({ token, user: payload });
    } catch (error: any) {
        if (error?.message === 'JWT_SECRET is not set') {
            return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
        }
        res.status(500).json({ message: 'Error logging in', error });
    }
};

const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.body as { token: string };

    try {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying email', error });
    }
};

const resendVerificationEmail = async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        await sendVerificationEmail(email, verificationToken);

        res.status(200).json({ message: 'Verification email sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending verification email', error });
    }
};

const requestPasswordReset = async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const resetToken = generateVerificationToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.emailVerificationToken = resetToken;
        user.emailVerificationExpires = resetExpires;
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Error processing password reset request', error });
    }
};

const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    try {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error });
    }
};

const getUserProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req.user as any).id).lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const payload = { 
            _id: user._id, 
            email: user.email, 
            username: user.username, 
            subscriptionActive: user.subscriptionActive, 
            stripeCustomerId: user.stripeCustomerId, 
            subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
            emailVerified: user.emailVerified
        };
        res.status(200).json(payload);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

export { 
    register, 
    login, 
    getUserProfile, 
    verifyEmail, 
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
};