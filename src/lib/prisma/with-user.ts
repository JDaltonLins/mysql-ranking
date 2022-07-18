import { User } from "@prisma/client";
import { check, StatusException } from "../api";
import { Middleware, MiddlewareLocals } from "../middleware";
import { RedisLocals } from "../redis/index";

// Cabeçarios de autenticação
export type UserHeader = {
    token: string | string[]
}

// Variáveis locais definidas pelo middleware
export type UserLocals = {
    user: User
}

// Realiza a validação do Token do usuário junto ao redis e banco de dados
export default function withUser(): Middleware<UserLocals & RedisLocals> {
    return async (req, res, next) => {
        const { token } = check<UserHeader>(req.headers, "token");
        if (typeof token !== "string" || !token.match(/[A-F0-9]{64}/)) throw new StatusException(400, "Bad request");
        const { prisma, redis } = check<RedisLocals & MiddlewareLocals>(res.locals, "prisma", "redis");
        const response = await redis.get(`user:${token}`);
        if (response) {
            res.locals.user = JSON.parse(response);
            next();
        } else {
            await prisma.userSession.findFirstOrThrow({
                where: {
                    token,
                    OR: [
                        { expiresAt: { gte: new Date() } },
                        { expiresAt: null }
                    ]
                },
                include: {
                    user: true
                }
            }).then(userSession => {
                res.locals.user = userSession.user;
                if (userSession.expiresAt)
                    redis.setEx(`user:${token}`, userSession.expiresAt.getTime() - Date.now(), JSON.stringify(userSession.user));
                else
                    redis.set(`user:${token}`, JSON.stringify(userSession.user));
                next();
            }).catch(e => next(new StatusException(401, "Token is unauthorized")));
        }
    }
}