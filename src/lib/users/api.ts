import type { User } from "$lib/types";

export async function fetchUsers() {
    const response = await fetch('/api/users');
    return await response.json();
}

export async function createUser(user: string) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: user })
        });
        return await response.json();
    } catch (error) {
        return false;
    }
}

export async function deleteUser(id: number): Promise<true|string> {
    try {
        const response = await fetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        if(response.ok){
            return true;
        }
        const errorData = await response.json();
        if (errorData.code === 'P2003') {
            return 'Cannot delete user because they have associated records';
        }
        return errorData.message || 'Failed to delete user';
    } catch (error) {
        console.error('Failed to delete user:', error);
        if(error instanceof Error) {
            if (error.message.includes('foreign key constraint')) {
                return 'Cannot delete user because they have associated records';
            }
            return error.message;
        }
        return 'An unexpected error occurred';
    }
}

export async function updateUser(id: number, name: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return await response.json();
  }