<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchUsers, createUser, deleteUser, updateUser } from '../../lib/users/api';
	import type { User } from '../../lib/types';

	let name = '';
	let users: User[] = [];
	let editUserId: number | null = null;

	onMount(async () => {
		users = await fetchUsers();
	});

	const handleSave = async () => {
		if (editUserId === null) {
			const newUser = await createUser(name);
			if (newUser) {
				users = [...users, newUser];
			}
		} else {
			const updatedUser = await updateUser(editUserId, name);
			if (updatedUser) {
				users = users.map((user) => (user.id === editUserId ? updatedUser : user));
				editUserId = null;
			}
		}
		name = '';
	};

	const enableEdit = (user: User) => {
		editUserId = user.id;
		name = user.name;
	};

	const handleDelete = async (id: number) => {
		const success = await deleteUser(id);
		if (success) {
			users = users.filter((user) => user.id !== id);
			if (editUserId === id) {
				editUserId = null;
				name = '';
			}
		}
	};
</script>

<h1>Users</h1>

<!-- Form to create or update a user -->
<form on:submit|preventDefault={handleSave}>
	<input bind:value={name} placeholder="Enter Name" required />
	<button type="submit">{editUserId === null ? 'Create User' : 'Update User'}</button>
</form>

<ul>
	{#each users as user}
		<li>
			<h2 class={editUserId === user.id ? 'editing' : ''}>{user.name}</h2>
			<button on:click={() => enableEdit(user)}>Edit</button>
			<button on:click={() => handleDelete(user.id)}>Delete</button>
		</li>
	{/each}
</ul>

<style>
	/* General Layout */
	h1 {
		text-align: center;
		font-size: 2rem;
		color: #333;
		margin-bottom: 1.5rem;
	}

	/* Form Styling */
	form {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 200px;
		font-size: 1rem;
	}

	button[type='submit'] {
		background-color: #007bff;
		color: white;
		font-weight: bold;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button[type='submit']:hover {
		background-color: #0056b3;
	}

	/* List Styling */
	ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 80%;
		background-color: #f9f9f9;
		padding: 1rem;
		border-radius: 6px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	h2 {
		margin: 0;
		flex: 1;
		font-size: 1.2rem;
		color: #333;
	}

	/* Edit Mode Styling */
	.editing {
		color: #d9534f;
		font-weight: bold;
	}

	/* Button Styling */
	button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #0056b3;
	}

	/* Delete Button */
	button:last-child {
		background-color: #d9534f;
	}

	button:last-child:hover {
		background-color: #c9302c;
	}
</style>
