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
			if(files.length<=0){
				alert('Please select a file to upload');
				return;
			}
			
			await handleUpload();
			const assetData = {
				name,
				assetFiles: uploadResults.length>0?uploadResults.map((i) => i.url):[],
				createdBy,
				updatedBy
			};
			assetData.updatedBy = assetData.createdBy;
			const newAsset = await createAsset(assetData);
			
			assets = [...assets, newAsset];
		} else {
			if(files.length>0){
				await handleUpload();
			}
			const assetData = {
					name,
					assetFiles: uploadResults.length>0?uploadResults.map((i) => i.url):assetFiles,
					createdBy,
					updatedBy
				};
			const updatedAsset = await updateAsset(editAssetId, assetData);
			assets = assets.map((asset) => (asset.id === editAssetId ? updatedAsset : asset));
			editAssetId = null;
		}
		loading = false;
		const fileInput = document.getElementById('assetFiles') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		resetForm();
	};

	const enableEdit = (asset: Asset) => {
		const fileInput = document.getElementById('assetFiles') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		editAssetId = asset.id;
		name = asset.name;
		assetFiles = asset.assetFiles;
		createdBy = asset.createdBy;
		updatedBy = asset.updatedBy;
		files=[];
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

		uploadResults = await uploadFiles(files, 'images', '');
	};

	const handleDelete = async (id: number) => {
		let user = editAssetId ? updatedBy : createdBy;
    try {
        const success = await deleteAsset(id, user);
        if (success) {
            assets = assets.filter((instruction) => instruction.id !== id);
            if (editAssetId === id) {
                editAssetId = null;
                resetForm();
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            alert(`Error: ${error.message}`);
        } else {
            alert('An unexpected error occurred.');
        }
    }

	};

	const resetForm = () => {
		name = '';
		assetFiles = [];
		createdBy = users[0].id;
		updatedBy = users[0].id;
		files = [];
		uploadResults = [];
		loading = false;	
	};
	let searchQuery="";
$: filteredAssets = assets.filter((asset) =>
		asset.name.toLowerCase().includes(searchQuery.toLowerCase()) 
		|| asset.id.toString().includes(searchQuery.toLowerCase())
		|| asset.assetFiles.some((file) => file.toLowerCase().includes(searchQuery.toLowerCase()))
		);
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
		multiple
		on:change={handleFileChange}
		disabled={editAssetId !== null}
	/>
	<button disabled={loading} type="submit">{editAssetId === null ? 'Create Asset' : 'Update Asset'}</button>
</form>
<div class="search-container">
	<input 
		type="text"
		placeholder="Search instructions..."
		bind:value={searchQuery}
	/>
</div>
<ul>
	{#each filteredAssets as asset}
		<li>
			<h2 class={editAssetId === asset.id ? 'editing' : ''}>{asset.name}</h2>
			{#each asset.assetFiles as fileUrl}
				{#if fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)}
					<img
						src={fileUrl}
						height="50px"
						width="50px"
						style="margin-right: 30px;"
						alt={asset.name}
					/>
				{:else if fileUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)}
					<a href={fileUrl} target="_blank" rel="noopener noreferrer">
						<video
							src={fileUrl}
							height="50px"
							width="50px"
							style="margin-right: 30px;"
							autoplay
							muted
							loop
						/>
					</a>
				{:else if fileUrl.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/)}
					<a href={fileUrl} target="_blank" rel="noopener noreferrer" style="margin-right: 30px;" title="Audio file">
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><path fill="none" d="M204 0h48v48h-48z"/><path fill="#90caf9" d="M244 45h-32V3h22l10 10z"/><path fill="#e1f5fe" d="M242.5 14H233V4.5z"/><g fill="#1976d2"><circle cx="227" cy="30" r="4"/><path d="m234 21l-5-2v11h2v-7.1l3 1.1z"/></g><path fill="#90caf9" d="M40 45H8V3h22l10 10z"/><path fill="#e1f5fe" d="M38.5 14H29V4.5z"/><g fill="#1976d2"><circle cx="23" cy="30" r="4"/><path d="m30 21l-5-2v11h2v-7.1l3 1.1z"/></g></svg>
					</a>
				{:else if fileUrl.toLowerCase().match(/\.(xlsx|docx|pdf)$/)}
					<a href={fileUrl} target="_blank" rel="noopener noreferrer" style="margin-right: 30px;" title="Document file">
						<svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 32 32"><g fill="none"><path fill="url(#fluentColorDocument320)" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument322)" fill-opacity="0.5" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument321)" d="M17 10V2l10 10h-8a2 2 0 0 1-2-2"/><defs><linearGradient id="fluentColorDocument320" x1="20.4" x2="22.711" y1="2" y2="25.61" gradientUnits="userSpaceOnUse">
							<stop stop-color="#6ce0ff"/><stop offset="1" stop-color="#4894fe"/></linearGradient><linearGradient id="fluentColorDocument321" x1="21.983" x2="19.483" y1="6.167" y2="10.333" gradientUnits="userSpaceOnUse"><stop stop-color="#9ff0f9"/><stop offset="1" stop-color="#b3e0ff"/></linearGradient><radialGradient id="fluentColorDocument322" cx="0" cy="0" r="1" gradientTransform="rotate(133.108 13.335 7.491)scale(17.438 10.2853)" gradientUnits="userSpaceOnUse"><stop offset=".362" stop-color="#4a43cb"/><stop offset="1" stop-color="#4a43cb" stop-opacity="0"/></radialGradient></defs></g></svg>
					</a>
				{:else}
				<a href={fileUrl} target="_blank" rel="noopener noreferrer" style="margin-right: 30px;" title="Other file">
					<svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 32 32"><g fill="none"><path fill="url(#fluentColorDocument320)" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument322)" fill-opacity="0.5" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument321)" d="M17 10V2l10 10h-8a2 2 0 0 1-2-2"/><defs><linearGradient id="fluentColorDocument320" x1="20.4" x2="22.711" y1="2" y2="25.61" gradientUnits="userSpaceOnUse"><stop stop-color="#6ce0ff"/><stop offset="1" stop-color="#4894fe"/></linearGradient><linearGradient id="fluentColorDocument321" x1="21.983" x2="19.483" y1="6.167" y2="10.333" gradientUnits="userSpaceOnUse"><stop stop-color="#9ff0f9"/><stop offset="1" stop-color="#b3e0ff"/></linearGradient><radialGradient id="fluentColorDocument322" cx="0" cy="0" r="1" gradientTransform="rotate(133.108 13.335 7.491)scale(17.438 10.2853)" gradientUnits="userSpaceOnUse"><stop offset=".362" stop-color="#4a43cb"/><stop offset="1" stop-color="#4a43cb" stop-opacity="0"/></radialGradient></defs></g></svg>
				</a>
				{/if}
			{/each}
			<button on:click={() => enableEdit(asset)}>Edit</button>
			<button on:click={() => handleDelete(asset.id)}>Delete</button>
		</li>
	{/each}
</ul>

<style>
	/* Styling similar to the assets file */
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
