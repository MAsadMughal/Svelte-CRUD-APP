// src/routes/steps/api/+server.ts

import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
    const steps = await prisma.step.findMany();
    return new Response(JSON.stringify(steps), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const step = await prisma.step.create({ data });
    return new Response(JSON.stringify(step), { status: 201 });
};

// DELETE
export const DELETE: RequestHandler = async ({ request }) => {
    const { id } = await request.json();
    await prisma.step.delete({ where: { id: Number(id) } });
    return new Response(null, { status: 204 });
  };