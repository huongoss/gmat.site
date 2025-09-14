import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRegistration = [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('username').optional().isString(),
    body('name').optional().isString(),
];

export const validateLogin = [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
];

export const validateTestSubmission = [
    body('answers').isArray().withMessage('Answers must be an array.'),
    body('testId').notEmpty().withMessage('Test ID is required.'),
];

export const validateResultsRetrieval = [
    body('userId').notEmpty().withMessage('User ID is required.'),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};