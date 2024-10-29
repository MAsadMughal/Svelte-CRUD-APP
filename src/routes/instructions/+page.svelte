<!-- src/routes/instructions/+page.svelte -->

<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchInstructions,
		createInstruction,
		deleteInstruction,
		updateInstruction
	} from '../../lib/instructions/api';
	import type { Instruction, User } from '../../lib/types';
	import { fetchUsers } from '$lib/users/api';
	let users: User[] = [];
	let title = '';
	let description = '';
	let duration = 0;
	let previewFile = '';
	let createdBy: number | undefined = undefined;
	let updatedBy: number | undefined = undefined;
	let instructions: Instruction[] = [];
	let editInstructionId: number | null = null;

	onMount(async () => {
		instructions = await fetchInstructions();
		users = await fetchUsers();
		if (users.length > 0) {
			console.log(createdBy);
			if (createdBy === undefined || createdBy === null) createdBy = users[0].id;
			if (updatedBy === undefined || updatedBy === null) updatedBy = users[0].id;
		}
	});

	const handleSave = async () => {
		if (editInstructionId === null) {
			updatedBy = createdBy;
		}
		const instructionData = { title, description, duration, previewFile, createdBy, updatedBy };

		if (editInstructionId === null) {
			const newInstruction = await createInstruction(instructionData);
			instructions = [...instructions, newInstruction];
		} else {
			const updatedInstruction = await updateInstruction(editInstructionId, instructionData);
			instructions = instructions.map((instruction) =>
				instruction.id === editInstructionId ? updatedInstruction : instruction
			);
			editInstructionId = null;
		}

		resetForm();
	};

	const enableEdit = (instruction: Instruction) => {
		editInstructionId = instruction.id;
		title = instruction.title;
		description = instruction.description;
		duration = instruction.duration;
		previewFile = instruction.previewFile || '';
		createdBy = instruction.createdBy;
		updatedBy = instruction.updatedBy;
	};

	const handleDelete = async (id: number) => {
        let user = editInstructionId ? updatedBy : createdBy;
		const success = await deleteInstruction(id,user);
		if (success) {
			instructions = instructions.filter((instruction) => instruction.id !== id);

			if (editInstructionId === id) {
				editInstructionId = null;
				resetForm();
			}
		} else {
			alert('Foreign Key Error');
		}
	};

	const resetForm = () => {
		title = '';
		description = '';
		duration = 0;
		previewFile = '';
		createdBy = undefined;
		updatedBy = undefined;
	};
</script>

<h1>Instructions</h1>
{#if editInstructionId === null}
	<div class="user-select">
		<select id="createdBy" bind:value={createdBy} required>
			{#each users as user}
				<option value={user.id}>{user.name}</option>
			{/each}
		</select>
	</div>
{:else}
	<div class="user-select">
		<select id="updatedBy" bind:value={updatedBy} required>
			{#each users as user}
				<option value={user.id}>{user.name}</option>
			{/each}
		</select>
	</div>
{/if}

<form on:submit|preventDefault={handleSave}>
	<label for="title"><strong>Title</strong></label>
	<input id="title" bind:value={title} placeholder="Title" required />

	<label for="description"><strong>Description</strong></label>
	<textarea id="description" bind:value={description} placeholder="Description" required />

	<label for="duration"><strong>Duration</strong></label>
	<input id="duration" type="number" bind:value={duration} placeholder="Duration" required />

	<label for="previewFile"><strong>Preview File URL</strong></label>
	<input id="previewFile" bind:value={previewFile} placeholder="Preview File URL" />
	<!-- {#if editInstructionId === null}
		<label for="createdBy"><strong>Created By</strong></label>
		<select id="createdBy" bind:value={createdBy} disabled={editInstructionId !== null} required>
			<option value={undefined} disabled>Select Creator</option>
			{#each users as user}
				<option value={user.id}>{user.name}</option>
			{/each}
		</select>
	{:else}
		<label for="updatedBy"><strong>Updated By</strong></label>
		<select id="updatedBy" bind:value={updatedBy} disabled={editInstructionId === null} required>
			<option value={undefined} disabled>Select Updater</option>
			{#each users as user}
				<option value={user.id}>{user.name}</option>
			{/each}
		</select>
	{/if} -->
	<button type="submit"
		>{editInstructionId === null ? 'Create Instruction' : 'Update Instruction'}</button
	>
</form>

<ul>
	{#each instructions as ins}
		<li>
			<h2 class={editInstructionId === ins.id ? 'editing' : ''}>{ins.title}</h2>
			<button on:click={() => enableEdit(ins)}>Edit</button>
			<button on:click={() => handleDelete(ins.id)}>Delete</button>
		</li>
	{/each}
</ul>

<style>
	h1 {
		text-align: center;
		font-size: 2rem;
		color: #333;
		margin-bottom: 1.5rem;
	}

	/* Form Styling */
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 80%;
		max-width: 500px;
		margin: 0 auto;
		background-color: #f9f9f9;
		margin-bottom: 50px;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	label {
		align-self: flex-start;
		font-weight: bold;
		width: 100%;
	}

	input,
	textarea,
	select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
		font-size: 1rem;
	}
	.user-select {
		margin-left: 80vw;
        position: absolute; 
        top: 20px;
		width: 200px;
	}
	button[type='submit'] {
		align-self: flex-end;
		background-color: #007bff;
		color: white;
		font-weight: bold;
		border: none;
		padding: 0.6rem 1.2rem;
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
		width: 80%;
		margin: 0 auto;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background-color: #f1f1f1;
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
		margin-right: 10px;
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
