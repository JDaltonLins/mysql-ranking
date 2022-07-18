import Permissions from "../../constant/permissions";
import { StatusException } from "../api";
import { Middleware } from "../middleware";

// Pequeno Middleware para verificar as permissões do usuário!
export default (permission: Permission): Middleware => {
    if (!((typeof permission === "string" && Permissions[permission]) ||
        (typeof permission === "number" && Object.values(Permissions).some(v => v & permission)) ||
        (Array.isArray(permission) && Object.values(permission).some(v => Permissions[v]))))
        throw new PermissionException(permission);
    return (req, res, next) => {
        if (!res.locals.user)
            throw "User not authenticated";
        if (typeof permission === "number") {
            return res.locals.user.permissions & permission ? next() : res.status(403).json({ code: 403, error: "You don't have permission to do this" });
        } else if (typeof permission === "string") {
            return res.locals.user.permissions & Permissions[permission] ? next() : res.status(403).json({ code: 403, error: "You don't have permission to do this" });
        } else if (Array.isArray(permission)) {
            return res.locals.user.permissions & permission.reduce((acc, cur) => acc | Permissions[cur], 0) ? next() : res.status(403).json({ code: 403, error: "You don't have permission to do this" });
        }
    }
};

// Podermos definir uma regra para o tipo do parametro de entrada poder aceitar.
// Exemplo:
//    1 | 2 | 4 | 8 | 16 | 32 | 64 | 128
//    ["CREATE_USER", "READ_USER", "UPDATE_USER", "DELETE_USER"]
export type Permission = number | keyof typeof Permissions | Array<keyof typeof Permissions>;

// Prescisamos de algo para lançar o erro e poder identificar o mesmo.
export class PermissionException extends StatusException {

    permission: Permission;

    constructor(permission: Permission) {
        super(404, `Forbidden, withou permission ${permission}`);
        this.permission = permission;
    }

}