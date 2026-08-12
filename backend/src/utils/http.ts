import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
export const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ data });
export const fail = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
export const validate = <T extends ZodTypeAny>(schema: T, source: 'body'|'query'|'params' = 'body') => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req[source]); if (!result.success) return fail(res, 422, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid request');
  (req as Request & { validated: unknown }).validated = result.data; next();
};
export const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void fn(req,res,next).catch(next);
export const getValidated = <T>(req: Request) => (req as Request & { validated: T }).validated;
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) { if (error instanceof ZodError) return fail(res,422,'VALIDATION_ERROR','Invalid request'); console.error(error); return fail(res,500,'INTERNAL_ERROR','An unexpected error occurred'); }
