import { NextFunction, Request, Response } from "express";
import { Middleware } from "../middleware";

export default function withCondition(cond: (req: Request, res: Response) => boolean | Error, middleware: Middleware<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = cond(req, res);
        if (result instanceof Error)
            return next(result);
        else if (!result) return middleware(req, res, next);
        else return next();
    }
}