// src/lib/api/instructions.ts

import type { Instruction } from '../types';

export async function fetchInstructions(): Promise<Instruction[]> {
    const response = await fetch('/api/instructions');
    return await response.json();
}

export async function createInstruction(data: Partial<Instruction>): Promise<Instruction> {
    const response = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
}

export async function updateInstruction(id: number, data: Partial<Instruction>): Promise<Instruction> {
    const response = await fetch(`/api/instructions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
}

export async function deleteInstruction(id: number): Promise<boolean> {
    try {
        const response = await fetch('/api/instructions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id})
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to delete instruction:', error);
        return false;
    }
}
