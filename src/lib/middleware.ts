import { Response, Request, NextFunction, RequestHandler } from "express";
import { RankingPrismaClient } from "../prisma";

export type MiddlewareLocals = {
    debug: boolean,
    prisma: RankingPrismaClient
};

export interface MiddlewareNextFunction<Locals = MiddlewareLocals, Req extends Request = Request, Res extends Response = Response<any, Locals & MiddlewareLocals>> extends NextFunction, Middleware<Locals, Req, Res> {
    (): void;
    (request: Req, response: Res): Promise<void>;   
}

export interface Middleware<Locals = Response["locals"], Req extends Request = Request, Res extends Response = Response<any, Locals & MiddlewareLocals>> {
    (request: Req, response: Res, next: MiddlewareNextFunction<Locals>): any;
    (request: Req, response: Res, next: NextFunction): any;
}