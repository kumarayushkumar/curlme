import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { HTTP_STATUS_CODE } from '../utils/constants.js'

type ValidRequestType = "body" | "query" | "params";

export const validateSchema = (schemas: ZodSchema, type: ValidRequestType = "body") => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const parsedData = schemas.parse(req[type]);
			req[type] = {
				...req[type],
				...(typeof parsedData === 'object' && parsedData !== null ? parsedData : {})
			};
			next();
		} catch (error: any) {
			res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
				success: false,
				error: error.errors
			});
		}
	};
};