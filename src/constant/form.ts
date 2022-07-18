import { FormValidator } from "../lib/form";

export const FormModel = {
    id: { type: "number", min: 1 }
} as FormValidator;

export const FormUser = {
    id: { type: "number", min: 1, required: false },
    name: { type: "string", min: 8, max: 50 },
    email: { type: "string", min: 8, max: 255, regex: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ },
    password: { type: "string", min: 8, max: 255 }
} as FormValidator;