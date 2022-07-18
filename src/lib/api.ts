import { NextFunction, Response, Request } from "express";

export class StatusException extends Error {

    status: number;
    message: string;

    constructor(status: number, message: string) {
        super(`${status} - ${message}`)
        this.status = status;
        this.message = message;
    }

    toJSON(res: Response) {
        return {
            code: this.status,
            message: this.message,
            ...(res.locals.debug ? {
                error: this,
                stack: this.stack
            } : {})
        }
    }
}

// Realizando a captura de erro de status
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err instanceof StatusException) {
        res.status(err.status).send(err.toJSON(res));
    } else {
        res.status(500).send("Internal server error");
    }
}

// Vamos realizar uma pequena gambiarra para validar as variavéis!
export function check<T>(environment: Record<string, any>, ...variables: Array<keyof T>): T {
    const objs: Record<string, any> = {};
    for (var i of variables) {
        const key = i as string;
        if (!(objs[key] = environment[key])) throw new StatusException(500, `Location variable ${key} not started`);
    }
    return objs as T;
} 