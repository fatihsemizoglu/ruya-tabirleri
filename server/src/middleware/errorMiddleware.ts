import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    errors?: any[];

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(public field: string, message: string) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const response: any = {
        success: false,
        status: err.status,
        message: err.message,
    };

    if (err.errors) {
        response.errors = err.errors;
    }

    if (err.isOperational && process.env.NODE_ENV === 'production') {
        res.status(err.statusCode).json(response);
    } else {
        logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
        response.message = err.isOperational ? err.message : 'Internal server error';
        res.status(err.statusCode).json(response);
    }
};
