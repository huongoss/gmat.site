import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

const register = async (req: Request, res: Response) => {
    const { email, password, username } = req.body as { email: string; password: string; username?: string };

    try {
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, username, password: hashedPassword });
        await newUser.save();

        const token = signToken(String(newUser._id));
        const user = { _id: newUser._id, email: newUser.email, username: newUser.username, subscriptionActive: newUser.subscriptionActive };
        res.status(201).json({ message: 'User registered successfully!', token, user });
    } catch (error) {
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
        const payload = { _id: user._id, email: user.email, username: user.username, subscriptionActive: user.subscriptionActive, stripeCustomerId: user.stripeCustomerId, subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd };
        res.status(200).json({ token, user: payload });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

const getUserProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user.id).lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const payload = { _id: user._id, email: user.email, username: user.username, subscriptionActive: user.subscriptionActive, stripeCustomerId: user.stripeCustomerId, subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd };
        res.status(200).json(payload);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user profile', error });
    }
};

export { register, login, getUserProfile };