// src/routes/steps/api/[id]/+server.ts

import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const PATCH: RequestHandler = async ({ params, request }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    const step = await prisma.step.update({
        where: { id },
        data,
    });
    return new Response(JSON.stringify(step), { status: 200 });
};
