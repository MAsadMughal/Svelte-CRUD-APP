<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fetchInstructionAssets,
		createInstructionAsset,
		deleteInstructionAsset
	} from '$lib/instructionAssets/api';
	import { fetchInstructions } from '$lib/instructions/api';
	import { fetchAssets } from '$lib/assets/api';
	import type { Instruction, Asset, InstructionAsset } from '$lib/types';

	let instructionId: number | undefined = undefined;
	let assetId: number | undefined = undefined;
	let instructionAssets: InstructionAsset[] = [];
	let instructions: Instruction[] = [];
	let assets: Asset[] = [];

	onMount(async () => {
		instructionAssets = await fetchInstructionAssets();
		instructions = await fetchInstructions();
		assets = await fetchAssets();
	});

	const handleSave = async () => {
		if (instructionId === undefined || assetId === undefined) {
			alert('Please select both Instruction and Asset.');
			return;
		}

		const newInstructionAsset = await createInstructionAsset({ instructionId, assetId });

		if (newInstructionAsset === false) {
			alert('Already Exists a relationship between this Instruction and Asset.');
		} else {
			instructionAssets = [...instructionAssets, newInstructionAsset];
			resetForm();
		}
	};

	const handleDelete = async (instructionId: number, assetId: number) => {
		const success = await deleteInstructionAsset(instructionId, assetId);
		if (success) {
			instructionAssets = instructionAssets.filter(
				(ia) => ia.instructionId !== instructionId || ia.assetId !== assetId
			);
		}
	};

	const resetForm = () => {
		instructionId = undefined;
		assetId = undefined;
	};
	let searchQuery="";
$: filtered = instructionAssets.filter((asset) =>
		asset.instructionId.toString().toLowerCase().includes(searchQuery.toLowerCase()) 
		|| asset.assetId.toString().toLowerCase().includes(searchQuery.toLowerCase())
		|| assets.find((a)=>a.id=== asset.assetId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
		|| instructions.find((i)=>i.id=== asset.instructionId)?.title.toLowerCase().includes(searchQuery.toLowerCase())
		);
</script>
<h1 style="text-align: center; margin-bottom: 20px;">Instruction Assets</h1>
<form on:submit|preventDefault={handleSave}>
	<label for="instructionId">Select Instruction</label>
	<select id="instructionId" bind:value={instructionId} required>
		<option value={undefined} disabled>Select Instruction</option>
		{#each instructions as instruction}
			<option value={instruction.id}>{instruction.title}</option>
		{/each}
	</select>

	<label for="assetId">Select Asset</label>
	<select id="assetId" bind:value={assetId} required>
		<option value={undefined} disabled>Select Asset</option>
		{#each assets as asset}
			<option value={asset.id}>{asset.name}</option>
		{/each}
	</select>

	<button type="submit">Create Relationship</button>
</form>

<div class="search-container">
	<input
		type="text"
		placeholder="Search instructions..."
		bind:value={searchQuery}
	/>
</div>
<ul>
	{#each filtered as instructionAsset}
		<li>
			<p>Instruction: {instructions.find((i)=>i.id=== instructionAsset?.instructionId)?.title}, Asset: {assets.find((a)=>a.id=== instructionAsset?.assetId)?.name}</p>
			<button
				on:click={() => handleDelete(instructionAsset.instructionId, instructionAsset.assetId)}
				>Delete</button
			>
		</li>
	{/each}
</ul>

<style>
	.search-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}
	.search-container input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 80%;
		max-width: 500px;
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

	select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
		font-size: 1rem;
		box-sizing: border-box;
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
</style>
