import { Response, NextFunction } from 'express';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const handleError = (err: AppError, res: Response) => {
    const status = err.isOperational ? err.statusCode : 500;
    const message = err.isOperational ? err.message : 'Something went wrong!';

    res.status(status).json({
        status: 'error',
        statusCode: status,
        message: message,
    });
};

export const catchAsync = (fn: Function) => {
    return (req: any, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};