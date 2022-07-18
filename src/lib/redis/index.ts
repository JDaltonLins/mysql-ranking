import { RedisClientType } from "redis";

export type RedisLocals = {
    redis: RedisClientType
};

export class RedisError extends Error {}