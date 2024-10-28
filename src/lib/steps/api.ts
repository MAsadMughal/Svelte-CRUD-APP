// src/lib/api/steps.ts

import type { Step } from '../types';

export async function fetchSteps(): Promise<Step[]> {
    const response = await fetch('/api/steps');
    return await response.json();
}

export async function createStep(data: Partial<Step>): Promise<Step> {
    const response = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
}

export async function updateStep(id: number, data: Partial<Step>): Promise<Step> {
    const response = await fetch(`/api/steps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
}


export async function deleteStep(id: number): Promise<boolean> {
    try {
        const response = await fetch('/api/steps', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to delete Step:', error);
        return false;
    }
}