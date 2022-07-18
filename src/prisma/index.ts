import { LimiterType, PrismaClient, Token, TokenLimiter } from "@prisma/client";

// Transformando os tipos de limite em segundos
export const times: Record<LimiterType, number> = {
    MONTH: 2592000,
    WEEK: 604800,
    DAY: 86400,
    MINUTE: 60
};

// Definindo o tipo para a referencia.
export type RankingPrismaClient = PrismaClient & {
    tokenIncrement: (token: Token & { limiter: TokenLimiter }) => Promise<void>;
};

// Realizando a junção dos objetos
export default (prisma: PrismaClient): RankingPrismaClient =>
    Object.assign(prisma, {
        tokenIncrement: async (token) => {
            const time = token.limiter.limit * (times[token.limiter.type] ?? 0)
            const diff = token.lastUsed ? new Date().getTime() - token.lastUsed.getTime() : time;
            await prisma.token.update({
                where: {
                    id: token.id
                },
                data: (diff >= time ? {
                    uses: 1,
                    lastUsed: new Date()
                } : {
                    uses: { increment: 1 }
                })
            });
        }
    } as RankingPrismaClient);