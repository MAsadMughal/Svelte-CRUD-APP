<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchSteps, createStep, deleteStep, updateStep } from '../../lib/steps/api';
	import { fetchInstructions } from '../../lib/instructions/api';
	import type { Step, Instruction } from '../../lib/types';

	let type = '';
	let title = '';
	let description = '';
	let stepNr = 1;
	let attachedFile = '';
	let instructionId = 0;
	let createdBy = 0;
	let updatedBy = 0;

	let steps: Step[] = [];
	let instructions: Instruction[] = [];
	let editStepId: number | null = null;

	onMount(async () => {
		steps = await fetchSteps();
		instructions = await fetchInstructions();
	});

	const handleSave = async () => {
		if (instructionId === 0) {
			alert("Please select a valid instruction.");
			return;
		}

		const stepData = { type, title, description, stepNr, attachedFile, instructionId, createdBy, updatedBy };

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
		const success = await deleteStep(id);
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
		instructionId = 0;
		createdBy = 0;
		updatedBy = 0;
	};
</script>

<h1>Steps</h1>

<form on:submit|preventDefault={handleSave}>
	<input bind:value={type} placeholder="Type" required />
	<input bind:value={title} placeholder="Title" required />
	<input bind:value={description} placeholder="Description" required />
	<input type="number" bind:value={stepNr} placeholder="Step Number" required />
	<input bind:value={attachedFile} placeholder="Attached File URL" />

	<select bind:value={instructionId} required>
		<option value="0">Select Instruction</option>
		{#each instructions as instruction}
			<option value={instruction.id}>{instruction.title}</option>
		{/each}
	</select>

	<input type="number" bind:value={createdBy} placeholder="Created By" required />
	<input type="number" bind:value={updatedBy} placeholder="Updated By" required />
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

	input,
	select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
		font-size: 1rem;
	}

	button[type="submit"] {
		background-color: #007bff;
		color: white;
		font-weight: bold;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button[type="submit"]:hover {
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

	/* Delete Button */
	button:last-child {
		background-color: #d9534f;
	}

	button:last-child:hover {
		background-color: #c9302c;
	}
</style>
