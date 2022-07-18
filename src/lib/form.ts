import { Response } from "express";
import { StatusException } from "./api";

export type FieldType = "string" | "number"

export type FieldValidator = {
    type: FieldType,
    required?: boolean,
    min?: number,
    max?: number,
    regex?: RegExp
}

export type FormValidator<E extends FieldValidator | [FormValidator<E>] = FieldValidator> = Record<string, E>;

// Sistema de validação de formulário em JSON
// Exemplo:
// {
//     "name": { type: "string" },
//     "age": { type: "number", min: 18, max: 65 },
//     "description": { type: "string", required: false, min: 10, max: 100 },
//     "tags": [{ type: "string", required: false, min: 3, max: 10, regex: /^[a-zA-Z0-9]+$/ }]
// }
export default function validate<E extends FieldValidator | [FormValidator<E>]>(data: Record<string, any>, form: FormValidator<E>, path = '$.'): string[] {
    const errors = [];
    for (const [key, value] of Object.entries(form)) {
        const $data = data[key];
        if (Array.isArray(value)) {
            const form = value[0];
            if (!$data && (form.required ?? true)) {
                errors.push(`${path}${key} is required`);
            } else if (!Array.isArray($data)) {
                errors.push(`${path}${key} must be an array like ${JSON.stringify(value[0])}`);
            } else {
                for (const i in $data) {
                    errors.push(...validate($data[i], value[0], `${path}${key}[${i}].`));
                }
            }
        } else if (typeof $data !== value.type) {
            errors.push(`${path}${key} must be a ${value.type}`);
        } else if (typeof $data === 'string') {
            if (value.min && $data.length < value.min) {
                errors.push(`${path}${key} must be at least ${value.min} characters long`);
            } else if (value.max && $data.length > value.max) {
                errors.push(`${path}${key} must be at most ${value.max} characters long`);
            } else if (value.regex && !value.regex.test($data)) {
                errors.push(`${path}${key} must match ${value.regex}`);
            }
        } else if (typeof $data === 'number') {
            if (value.min && $data < value.min) {
                errors.push(`${path}${key} must be at least ${value.min}`);
            } else if (value.max && $data > value.max) {
                errors.push(`${path}${key} must be at most ${value.max}`);
            }
        }
    }
    return errors
}

export class ValidationFormException extends StatusException {

    errors: string[];

    constructor(errors: string[]) {
        super(400, 'Validation error');
        this.errors = errors;
    }

    toJSON(res: Response) {
        return {
            ...super.toJSON(res),
            errors: this.errors
        }
    }
}