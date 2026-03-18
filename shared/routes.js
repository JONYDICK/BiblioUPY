import { z } from 'zod';
import { insertResourceSchema } from './schema';
export const errorSchemas = {
    validation: z.object({
        message: z.string(),
        field: z.string().optional(),
    }),
    notFound: z.object({
        message: z.string(),
    }),
    internal: z.object({
        message: z.string(),
    }),
};
export const api = {
    resources: {
        list: {
            method: 'GET',
            path: '/api/resources',
            responses: {
                200: z.array(z.custom()),
            },
        },
        create: {
            method: 'POST',
            path: '/api/resources',
            input: insertResourceSchema,
            responses: {
                201: z.custom(),
                400: errorSchemas.validation,
            },
        },
    },
};
export function buildUrl(path, params) {
    let url = path;
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (url.includes(`:${key}`)) {
                url = url.replace(`:${key}`, String(value));
            }
        });
    }
    return url;
}
