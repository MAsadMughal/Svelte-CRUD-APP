// src/routes/steps/api/+server.ts

import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
    const steps = await prisma.instruction.findMany();
    return new Response(JSON.stringify(steps), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json();
    const instruction = await prisma.instruction.create({ data });
    return new Response(JSON.stringify(instruction), { status: 201 });
};

export const DELETE: RequestHandler = async ({ request }) => {
    const { id } = await request.json();
    console.log(id)
    await prisma.instruction.delete({ where: { id: Number(id) } });
    return new Response(null, { status: 204 });
  };
  
