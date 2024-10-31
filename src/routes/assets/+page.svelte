<script lang="ts">
	import Modal from '$lib/components/modals/Modal.svelte';
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
			loading = false;
			return;
		}
		loading = true;
		if (editAssetId === null) {
			if(files.length<=0){
				alert('Please select a file to upload');
				loading = false;
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
		isModalOpen=false;
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
		isModalOpen=true;	
	};

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			const selectedFiles = Array.from(target.files);
			
			// Check if any file is larger than 10MB
			const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
			const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SIZE);
			
			if (oversizedFiles.length > 0) {
				alert('Files must be smaller than 10MB');
				target.value = ''; // Clear the file input
				return;
			}

			// Check if more than 10 files selected
			if (selectedFiles.length > 10) {
				alert('Maximum 10 files allowed');
				target.value = ''; // Clear the file input
				return;
			}
			
			files = selectedFiles;
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

	let isModalOpen = false;

function toggleModal() {
  isModalOpen = !isModalOpen;
  if(isModalOpen===false){
	resetForm();
  }
}


let sortColumn = "";
  let sortOrder = "asc";

  function sortData(column) {
    if (sortColumn === column) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortOrder = "asc";
    }

    filteredSteps = [...filteredSteps].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Convert dates to numbers for sorting
      if (sortColumn === "createdAt" || sortColumn === "updatedAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }


let currFiles=[];
let filesModal=false;
$: {
  console.log(currFiles);
  console.log(filesModal); 
}

</script>

<div class="flex flex-col justify-start min-w-[50vw] max-w-[50vw] md:min-w-[70vw]  md:max-w-[70vw] lg:min-w-[75vw] lg:max-w-[75vw] xl:min-w-[80vw] xl:max-w-[80vw]  bg-white rounded-md shadow-md p-3 px-10 overflow-x-auto my-5">
	<div class="flex flex-row justify-between items-center my-2">
	<h1 class="text-2xl font-bold">List of Assets</h1>
	<button on:click={toggleModal} class="px-5 py-3 text-sm bg-green-500 text-white rounded-lg">
		Create New Asset
	</button>
	</div>  
	

{#if isModalOpen}

<Modal isOpen={isModalOpen} closeModal={toggleModal} title={editAssetId?"Edit Asset":"Add Asset"}>
<form on:submit|preventDefault={handleSave} class="flex flex-col max-w-md mx-auto p-6 mb-5 bg-gray-50 rounded-lg shadow space-y-4">
	<div class="flex flex-col">
		<label for="name" class="text-gray-700 font-medium">Asset Name</label>
		<input 
			id="name" 
			bind:value={name} 
			placeholder="Asset Name" 
			required 
			class="mt-1 px-4 py-2 border rounded-md bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
		/>
	</div>

	<div class="flex flex-col">
		<label for="assetFiles" class="text-gray-700 font-medium">Select Files</label>
		<input
			id="assetFiles"
			type="file"
			multiple
			on:change={handleFileChange}
			class="mt-1 px-4 py-2 border rounded-md bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
		/>
	</div>

	{#if editAssetId === null}
		<div class="flex flex-col">
			<label for="createdBy" class="text-gray-700 dark:text-gray-300 font-medium">Current User</label>
			<select 
				id="createdBy" 
				bind:value={createdBy} 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			>
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			</select>
		</div>
	{:else}
		<div class="flex flex-col">
			<label for="updatedBy" class="text-gray-700 dark:text-gray-300 font-medium">Current User</label>
			<select 
				id="updatedBy" 
				bind:value={updatedBy} 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			>
				{#each users as user}
					<option value={user.id}>{user.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<button 
		type="submit"
		disabled={loading}
		class="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{editAssetId === null ? 'Create Asset' : 'Update Asset'}
	</button>
</form>
</Modal>
{/if}

<div class="flex flex-row justify-start items-center">
	<div class="relative -z-0 w-full max-w-xs mb-2 ">
		<span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
			<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"/></svg>
		</span>
		<input
		  type="text"
		  bind:value={searchQuery}
		  placeholder="Search..."
		  class="pl-10 pr-4 py-2 w-full rounded-md bg-slate-50 text-black border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>
</div>
{#if currFiles.length > 0 && filesModal}
<Modal isOpen={filesModal} closeModal={() => {
    currFiles = [];
    filesModal = false;
}} title="Current Files">
    <div class="p-4">
        <ul class="space-y-2">
            {#each currFiles as file}
                <li class="flex items-center justify-between space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div class="flex items-center space-x-2">
                        {#if file.toLowerCase().endsWith('.pdf')}
                            <span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">PDF</span>
                            <iframe 
                                src={file}
                                title="PDF Document" 
                                class="w-full h-96"
                            ></iframe>
                        {:else if file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.gif')}
                            <span class="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">Image</span>
                            <img  
                                src={file} 
                                alt="file"
                                class="max-w-[350px] h-auto" 
                            />
                        {:else if file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.webm')}
                            <span class="px-2 py-1  text-xs font-semibold bg-purple-100 text-purple-800 rounded">Video</span>
							<video 
							src={file}
							controls
							class="max-w-[350px]"
						>
							<track kind="captions" srclang="en" label="English" />
						</video>
						
                        {:else}
                            <span class="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">File</span>
                            <a 
                                href={file} 
                                target="_blank"
                                rel="noopener noreferrer" 
                                class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 break-all"
                            >
                                {file.split('/').pop()}
                            </a>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</Modal>
{/if}

<div class="overflow-x-auto bg-white rounded-lg 
		 [&::-webkit-scrollbar]:h-0
	">
	<table class="min-w-full bg-white dark:bg-gray-800">
		<thead class="border-b-2 border-b-indigo-800 select-none">
			<tr>
				<th
					class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
					on:click={() => sortData("id")}
				>
					ID {sortColumn === "id" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
				</th>
				<th
					class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
					on:click={() => sortData("name")}
				>
					Name {sortColumn === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
					Created By
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
					Updated By
				</th>
				<th
					class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
					on:click={() => sortData("createdAt")}
				>
					Created At {sortColumn === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
				</th>
				<th
					class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
					on:click={() => sortData("updatedAt")}
				>
					Updated At {sortColumn === "updatedAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
					Files
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
					Actions
				</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredAssets as asset}
				<tr class="hover:bg-gray-100 odd:bg-gray-100 dark:hover:bg-gray-700">
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{asset.id}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{asset.name}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{users.find(user => user.id === asset.createdBy)?.name}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{users.find(user => user.id === asset.updatedBy)?.name}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{new Date(asset.createdAt).toLocaleDateString()}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						{new Date(asset.updatedAt).toLocaleDateString()}
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						<button
							on:click={() => {currFiles=asset.assetFiles;filesModal=true;}}
							class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
						>
							Files
						</button>
					</td>
					<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
						<button
							on:click={() => enableEdit(asset)}
							class="px-3 py-1 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						>
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>

						</button>
						<button
							on:click={() => handleDelete(asset.id)}
							class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
						>
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/></svg>

						</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
						No Assets found
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
</div>
