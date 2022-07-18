import { Token, TokenLimiter, User } from "@prisma/client";
import { check, StatusException } from "../api";
import { Middleware, MiddlewareLocals } from "../middleware";
import { RedisLocals } from "../redis/index";

export type TokenHeader = {
    token: string | string[]
}

// Definição das variavéis locais definidas pelo middleware
export type TokenLocals = {
    token: Token & { limiter: TokenLimiter };
    user: User;
    limiter: TokenLimiter;
}

// Realiza a validação do Token de acesso da API
export default function withToken(): Middleware<TokenLocals> {
    return async (req, res, next) => {
        const { prisma, redis } = check<MiddlewareLocals & RedisLocals>(res, "prisma");
        const { token } = check<TokenHeader>(req.headers, "token");
        if (!token || typeof token !== 'string' || !token.match(/[A-F0-9]{64}/)) return next(new StatusException(400, "Bad request"))
        const response = await redis.get(`token:${token}`);
        if (response) {
            const tokenRs = JSON.parse(response) as Token & { limiter: TokenLimiter, user: User };
            res.locals.token = tokenRs;
            res.locals.user = tokenRs.user;
            res.locals.limiter = tokenRs.limiter;
            next();
        } else {
            await prisma.token.findFirstOrThrow({
                where: {
                    token
                },
                include: {
                    limiter: true,
                    user: true
                }
            }).then(token => {
                res.locals.token = token;
                res.locals.user = token.user;
                res.locals.limiter = token.limiter;
                redis.set(`token:${token.token}`, JSON.stringify(token));
                next();
            }).catch(e => next(new StatusException(401, "Token is unauthorized")));
        }
    }
};