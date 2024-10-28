
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const PATCH: RequestHandler = async ({ params, request }) => {
    const id = parseInt(params.id);
    const data = await request.json();
    const step = await prisma.instruction.update({
        where: { id },
        data,
    });
    return new Response(JSON.stringify(step), { status: 200 });
};
