import { Request, Response } from "express";
import { check } from "../api";
import { Middleware } from "../middleware";
import { RedisError, RedisLocals } from "./index";

export interface RedisRateLimitConfig {
    key: string | ((req: Request, res: Response) => string),
    limit: number | ((req: Request, res: Response) => number),
    time: number | ((req: Request, res: Response) => number),
    prefix: string
}

export class RedisRateLimit extends RedisError { }

export default function withRateLimit({ key: _key, limit: _limit, time: _time, prefix = "" }: RedisRateLimitConfig): Middleware<RedisLocals> {
    return (async (req, res, next) => {
        const { redis } = check<RedisLocals>(res.locals, "redis");
        if (redis == null) return next(new RedisError("Redis is not initialized"));
        const $key = typeof _key === "string" ? _key : _key(req, res);
        const $rKey = `${prefix}${$key}`;
        const $limit = typeof _limit === "number" ? _limit : _limit(req, res);
        const value = await redis.get($rKey);
        const $reset = await redis.ttl($rKey);
        const $count = $reset > 0 && value ? parseInt(value) + 1 : 1;

        res.setHeader("X-RateLimit-Limit", $limit);
        res.setHeader("X-RateLimit-Remaining", ($limit - $count).toString());
        res.setHeader("X-RateLimit-Reset", ($count == 1 || $reset == 0 ? Date.now() : $reset).toString());


        if ($count > $limit && $reset > 0) {
            return next(new RedisRateLimit(`Rate limit exceeded for ${$key}`));
        }

        if ($count == 1) {
            redis.setEx($rKey, typeof _time === "number" ? _time : _time(req, res), $count.toString());
        } else {
            redis.incr($rKey);
        }

        next();
    });
}