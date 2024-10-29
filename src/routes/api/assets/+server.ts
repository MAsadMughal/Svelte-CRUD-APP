// src/routes/assets/api/+server.ts

import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
    const assets = await prisma.asset.findMany({ where: { deletedBy: null } });
    return new Response(JSON.stringify(assets), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const asset = await prisma.asset.create({ data });
    return new Response(JSON.stringify(asset), { status: 201 });
};

export const DELETE: RequestHandler = async ({ request }) => {
    const { id } = await request.json();
    await prisma.asset.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date(), deletedBy: 1 },
    });
    return new Response(null, { status: 204 });
};
