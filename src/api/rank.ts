import { Router } from "express";
import withUser from "../lib/prisma/with-user";
import withRateLimit from "../lib/redis/with-ratelimit";

export default (router: Router) => {
    router.use(withUser());
    router.use(withRateLimit({
        key: (req) => req.ip,
        time: 1000,
        limit: 10,
        prefix: "ratelimite-ip:"
    }));

    router.post("/refresh");
    router.post("/create");
    router.get("/");
}