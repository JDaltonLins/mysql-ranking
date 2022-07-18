import { Request, Router } from "express"
import { PrismaClient } from "@prisma/client"
import withUser from "../lib/prisma/with-user";
import withRateLimit from "../lib/redis/with-ratelimit";
import { Middleware } from "../lib/middleware";
import { RedisLocals } from "../lib/redis/index";
import withPermission from "../lib/prisma/with-permission";
import validate, { ValidationFormException } from "../lib/form";
import withCondition from "../lib/prisma/with-condition";
import { FormModel, FormUser } from "../constant/form";

const IP_REQUESTER = (req: Request) =>
    req.headers["x-forwarded-for"] as string ??
    req.socket.remoteAddress ??
    req.ip

export default (router: Router, prisma: PrismaClient) => {
    router.use(withUser());
    router.use(withRateLimit({
        key: IP_REQUESTER,
        time: 1000,
        limit: 10,
        prefix: "ratelimite-ip:"
    }));

    router.post("/user", withPermission("CREATE_USER"), ((req, res, next) => {
        const errors = validate(req.body, FormUser);
        if (errors.length) return next(new ValidationFormException(errors));

        prisma.user.create({
            data: {
                name: req.body.name as string,
                email: req.body.email as string,
                password: req.body.password as string
            }
        }).then(user => next({ status: 200, message: "User created", data: user })).catch(next);
    }) as Middleware<RedisLocals>);

    router.put("/user",
        withCondition((req, res) => req.body.id !== res.locals.user.id,
            withPermission("UPDATE_USER")),
        ((req, res, next) => {
            const { prisma } = res.locals;
            const errors = validate(req.body, FormUser);
            if (errors.length) return next(new ValidationFormException(errors));
            
            prisma.user.update({
                where: { id: req.body.id },
                data: Object.fromEntries(Object.entries({
                    name: req.body.name as string,
                    email: req.body.email as string,
                    password: req.body.password as string
                }).filter(([, value]) => value !== undefined))
            }).then(user => res.json({ status: 200, message: "User updated", data: user })).catch(next);
        }) as Middleware<RedisLocals>);

    router.delete("/user", withCondition((req, res) => req.body.id !== res.locals.user.id,
        withPermission("DELETE_USER")), ((req, res, next) => {
            const { prisma, redis } = res.locals;
            const erros = validate(req.body, FormModel);
            if (erros.length) return next(new ValidationFormException(erros));

            prisma.user.delete({
                where: { id: req.body.id },
                include: {
                    access: true,
                    tokens: true
                }
            }).then(user => {
                user.tokens.forEach(token => redis.del(`token:${token.token}`));
                user.access.forEach(access => redis.del(`access:${access.id}`));
                res.json({ status: 200, message: "User deleted", data: user })
            }).catch(next);
        }) as Middleware<RedisLocals>);
}