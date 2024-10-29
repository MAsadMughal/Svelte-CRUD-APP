<script lang="ts">
	import { uploadFiles } from '$lib/uploadMultipleFiles';
	import { fetchUsers } from '$lib/users/api';
	import { onMount } from 'svelte';
	import { createAsset, deleteAsset, fetchAssets, updateAsset } from '../../lib/assets/api';
	import type { Asset, User } from '../../lib/types';
	let files: File[] = [];
	let uploadResults: any[] = [];
	let loading = false;
	let name = '';
	let assetFiles: any = []; // Treat as a string for input
	let createdBy: number | undefined = undefined;
	let updatedBy: number | undefined = undefined;
	let users: User[] = [];
	let assets: Asset[] = [];
	let editAssetId: number | null = null;

	onMount(async () => {
		assets = await fetchAssets();
		users = await fetchUsers();
		if (users.length > 0) {
			if (createdBy === undefined || createdBy === null) createdBy = users[0].id;
			if (updatedBy === undefined || updatedBy === null) updatedBy = users[0].id;
		}
	});

	const handleSave = async () => {
		if (!createdBy) {
			alert('Please select a creator.');
			return;
		}
		loading = true;
		if (editAssetId === null) {
			await handleUpload();
			console.log(uploadResults.map((i) => i.url));
			const assetData = {
				name,
				assetFiles: uploadResults.map((i) => i.url),
				createdBy,
				updatedBy
			};
			assetData.updatedBy = assetData.createdBy;
			const newAsset = await createAsset(assetData);
			loading = true;
			assets = [...assets, newAsset];
			loading = false;
		} else {
			const assetData = {
				name,
				assetFiles: assetFiles.split(',').map((url: any) => url.trim()),
				createdBy,
				updatedBy
			};
			const updatedAsset = await updateAsset(editAssetId, assetData);
			assets = assets.map((asset) => (asset.id === editAssetId ? updatedAsset : asset));
			editAssetId = null;
		}
		loading = false;

		resetForm();
	};

	const enableEdit = (asset: Asset) => {
		editAssetId = asset.id;
		name = asset.name;
		assetFiles = asset.assetFiles.join(', '); // Convert to string for input
		createdBy = asset.createdBy;
		updatedBy = asset.updatedBy;
	};

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			files = Array.from(target.files);
		}
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			alert('Please select files to upload');
			return;
		}
		loading = true;
		uploadResults = await uploadFiles(files, 'images', '');
		loading = false;
	};

	const handleDelete = async (id: number) => {
		let user = editAssetId ? updatedBy : createdBy;
		const success = await deleteAsset(id, user);
		if (success) {
			assets = assets.filter((asset) => asset.id !== id);
			if (editAssetId === id) {
				editAssetId = null;
				resetForm();
			}
		}
	};

	const resetForm = () => {
		name = '';
		assetFiles = '';
		createdBy = users[0].id;
		updatedBy = users[0].id;
	};
</script>

{#if editAssetId === null}
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

<h1 style="text-align: center;">Assets</h1>
<form on:submit|preventDefault={handleSave}>
	<label for="name">Asset Name</label>
	<input id="name" bind:value={name} placeholder="Asset Name" required />
	<label for="assetFiles">Select Files:</label>
	<input
		id="assetFiles"
		type="file"
		accept="image/*"
		multiple
		on:change={handleFileChange}
		disabled={editAssetId !== null}
	/>
	<button type="submit">{editAssetId === null ? 'Create Asset' : 'Update Asset'}</button>
</form>

<ul>
	{#each assets as asset}
		<li>
			<h2 class={editAssetId === asset.id ? 'editing' : ''}>{asset.name}</h2>
			{#each asset.assetFiles as imageUrl}
				<img
					src={imageUrl}
					height="50px"
					width="50px"
					style="margin-right: 30px;"
					alt={asset.name}
				/>
			{/each}
			<button on:click={() => enableEdit(asset)}>Edit</button>
			<button on:click={() => handleDelete(asset.id)}>Delete</button>
		</li>
	{/each}
</ul>

<style>
	/* Styling similar to the steps file */
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
