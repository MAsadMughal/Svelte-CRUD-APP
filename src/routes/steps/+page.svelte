<script lang="ts">
	import { fetchUsers } from '$lib/users/api';
	import { onMount } from 'svelte';
	import { fetchInstructions } from '../../lib/instructions/api';
	import {
		createStep,
		deleteStep,
		fetchSteps,
		fetchStepsByInstructionId,
		updateStep
	} from '../../lib/steps/api';
	import type { Instruction, Step, User } from '../../lib/types';

	let type: string = '';
	let title = '';
	let description = '';
	let stepNr: number = 1;
	let attachedFile = '';
	let instructionId: number | undefined = undefined;
	let createdBy: number | undefined = undefined;
	let updatedBy: number | undefined = undefined;
	let users: User[] = [];
	let steps: Step[] = [];
	let instructions: Instruction[] = [];
	let editStepId: number | null = null;

	onMount(async () => {
		steps = await fetchSteps();
		instructions = await fetchInstructions();
		users = await fetchUsers();
		if (users.length > 0) {
			console.log(createdBy);
			if (createdBy === undefined || createdBy === null) createdBy = users[0].id;
			if (updatedBy === undefined || updatedBy === null) updatedBy = users[0].id;
		}
	});

	$: if ((instructionId, steps)) {
		(async () => {
			if (!editStepId) {
				if (instructionId) {
					stepNr = (await fetchStepsByInstructionId(instructionId)).length + 1;
				} else {
					stepNr = 1;
				}
			}
		})();
	}

	const handleSave = async () => {
		if (instructionId === undefined) {
			alert('Please select a valid Instruction.');
			return;
		}

		if (editStepId === null) {
			updatedBy = createdBy;
		}
		const stepData = {
			type,
			title,
			description,
			stepNr,
			attachedFile,
			instructionId,
			createdBy,
			updatedBy
		};

		if (editStepId === null) {
			const newStep = await createStep(stepData);
			steps = [...steps, newStep];
		} else {
			const updatedStep = await updateStep(editStepId, stepData);
			steps = steps.map((step) => (step.id === editStepId ? updatedStep : step));
			editStepId = null;
		}

		resetForm();
	};

	const enableEdit = (step: Step) => {
		editStepId = step.id;
		type = step.type;
		title = step.title;
		description = step.description;
		stepNr = step.stepNr;
		attachedFile = step.attachedFile || '';
		instructionId = step.instructionId;
		createdBy = step.createdBy;
		updatedBy = step.updatedBy;
	};

	const handleDelete = async (id: number) => {
		let user = editStepId ? updatedBy : createdBy;
		const success = await deleteStep(id, user);
		if (success) {
			steps = steps.filter((step) => step.id !== id);

			if (editStepId === id) {
				editStepId = null;
				resetForm();
			}
		}
	};

	const resetForm = () => {
		type = '';
		title = '';
		description = '';
		stepNr = 1;
		attachedFile = '';
		instructionId = undefined;
		createdBy = undefined;
		updatedBy = undefined;
	};
</script>

<h1>Steps</h1>
{#if editStepId === null}
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
	<label for="type">Type</label>
	<select id="type" bind:value={type} required>
		<option value="" disabled>Select Type</option>
		<option value="image">Image</option>
		<option value="video">Video</option>
		<option value="pdf">PDF</option>
		<option value="text">Text</option>
	</select>

	<label for="title">Title</label>
	<input id="title" bind:value={title} placeholder="Title" required />

	<label for="description">Description</label>
	<input id="description" bind:value={description} placeholder="Description" required />

	<label for="attachedFile">Attached File URL</label>
	<input id="attachedFile" bind:value={attachedFile} placeholder="Attached File URL" />

	<label for="instructionId">Select Instruction</label>
	<select id="instructionId" bind:value={instructionId} required>
		<option value={undefined} disabled>Select Instruction</option>
		{#each instructions as instruction}
			<option value={instruction.id}>{instruction.title}</option>
		{/each}
	</select>

	<label for="stepNr">Step Number</label>
	<input
		id="stepNr"
		type="number"
		disabled
		bind:value={stepNr}
		placeholder="Step Number"
		required
	/>

	<button type="submit">{editStepId === null ? 'Create Step' : 'Update Step'}</button>
</form>

<ul>
	{#each steps as step}
		<li>
			<h2 class={editStepId === step.id ? 'editing' : ''}>{step.title}</h2>
			<button on:click={() => enableEdit(step)}>Edit</button>
			<button on:click={() => handleDelete(step.id)}>Delete</button>
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

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		margin: 0 auto;
		margin-bottom: 50px;
		width: 80%;
		max-width: 500px;
		background-color: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	label {
		align-self: flex-start;
		font-size: 1rem;
		font-weight: bold;
		margin-bottom: 0.2rem;
		color: #333;
	}

	input,
	select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
		font-size: 1rem;
		box-sizing: border-box;
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

	.editing {
		color: #d9534f;
		font-weight: bold;
	}

	button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		margin-right: 10px;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #0056b3;
	}

	button:last-child {
		background-color: #d9534f;
	}

	button:last-child:hover {
		background-color: #c9302c;
	}
</style>
