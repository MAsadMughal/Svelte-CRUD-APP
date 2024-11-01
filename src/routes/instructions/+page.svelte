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
	import { fetchUsers } from '../../lib/users/api';
	import { uploadFiles } from '$lib/uploadMultipleFiles';
	import { fetchStepsByInstructionId } from '$lib/steps/api';
	import Modal from '$lib/components/modals/Modal.svelte';

let isModalOpen = false;

function toggleModal() {
	if(loading){	
		return;
	}
	isModalOpen = !isModalOpen;
	if(isModalOpen===false){
resetForm();
  }
}

	let users: User[] = [];
	let title = '';
	let description = '';
	let duration = 0;
	let previewFile = '';
	let createdBy: number | undefined = undefined;
	let updatedBy: number | undefined = undefined;
	let instructions: Instruction[] = [];
	let editInstructionId: number | null = null;
	let files: File[] = [];
	let uploadResults: any[] = [];
	let loading = false;
	let currSteps: any[] = [];
	let openStepId: number | null = null;
	onMount(async () => {
		instructions = await fetchInstructions();
		users = await fetchUsers();
		if (users.length > 0) {
			if (createdBy === undefined || createdBy === null) createdBy = users[0].id;
			if (updatedBy === undefined || updatedBy === null) updatedBy = users[0].id;
		}
	});

	const handleSave = async () => {
		
		if (editInstructionId === null) {
			updatedBy = createdBy;
		}
		
		
		const instructionData = { title, description, duration, previewFile, createdBy, updatedBy };
		loading = true;
		if (editInstructionId === null) {
				if(files.length<=0){
					alert('Please select a file to upload');
					loading =false;
					return;
				}			
				await handleUpload();
				if(uploadResults.length > 0){
					instructionData.previewFile = uploadResults[0].url;
				}
				
				const newInstruction = await createInstruction(instructionData);
				instructions = [...instructions, newInstruction];
			} else {
				if(files.length > 0){
					await handleUpload();
					if(uploadResults.length>0){
						instructionData.previewFile = uploadResults[0].url;
					}
				}
				const updatedInstruction = await updateInstruction(editInstructionId, instructionData);
				instructions = instructions.map((instruction) =>
				instruction.id === editInstructionId ? updatedInstruction : instruction
			);
			editInstructionId = null;
		}
		
		resetForm();
		loading = false;
		isModalOpen=false;
		editInstructionId=null;
		const fileInput = document.getElementById('previewFile') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	};
	
	const enableEdit = (instruction: Instruction) => {
		const fileInput = document.getElementById('previewFile') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		editInstructionId = instruction.id;
		title = instruction.title;
		description = instruction.description;
		duration = instruction.duration;
		previewFile = instruction.previewFile;
		createdBy = instruction.createdBy;
		updatedBy = instruction.updatedBy;
		files=[];
		isModalOpen=true;
	};
	
	const handleDelete = async (id: number) => {
		let user = editInstructionId ? updatedBy : createdBy;
		try {
			const success = await deleteInstruction(id, user);
			if (success) {
				instructions = instructions.filter((instruction) => instruction.id !== id);
				

            if (editInstructionId === id) {
                editInstructionId = null;
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
		title = '';
		description = '';
		duration = 0;
		previewFile = '';
		createdBy = users[0].id;
		updatedBy = users[0].id;
		files = [];
		uploadResults = [];
		loading = false;	
		editInstructionId=null;
		isModalOpen=false;
	};

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			if (!file.type.startsWith('image/')) {
				alert('Please select an image file');
				target.value = '';
				return;
			}
			files = [file];
		}
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			alert('Please select files to upload');
			return;
		}

		uploadResults = await uploadFiles(files, 'images', '');
	};

const fetchSteps = async (instructionId: number) => {
	if(openStepId===instructionId){
openStepId=null;
	}else{
		openStepId=instructionId; 
		currSteps=	await fetchStepsByInstructionId(instructionId);
	}
}
let searchQuery="";
$: filteredInstructions = instructions.filter((instruction) =>
		instruction.title.toLowerCase().includes(searchQuery.toLowerCase()) 
		|| instruction.id.toString().includes(searchQuery.toLowerCase())
		||instruction.description.toLowerCase().includes(searchQuery.toLowerCase()) 
	);

	

	let sortColumn = "";
  let sortOrder = "asc";

  function sortData(column: string) {
    if (sortColumn === column) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortOrder = "asc";
    }

    filteredInstructions = [...filteredInstructions].sort((a, b) => {
      let aValue = String(a[sortColumn as keyof typeof a] || '').toLowerCase();
      let bValue = String(b[sortColumn as keyof typeof b] || '').toLowerCase();

      // Convert dates to numbers for sorting
      if (sortColumn === "createdAt" || sortColumn === "updatedAt") {
        aValue = String(new Date(a[sortColumn as keyof typeof a]).getTime());
        bValue = String(new Date(b[sortColumn as keyof typeof b]).getTime());
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

</script>

<div class="flex flex-col justify-start min-w-[50vw] max-w-[50vw] md:min-w-[70vw]  md:max-w-[70vw] lg:min-w-[75vw] lg:max-w-[75vw] xl:min-w-[80vw] xl:max-w-[80vw]  bg-white rounded-md shadow-md p-3 px-10 overflow-x-auto my-5">
<div class="flex flex-row justify-between items-center my-2">
<h1 class="text-2xl font-bold">List of Instructions</h1>
<button on:click={toggleModal} class="px-5 py-3 text-sm bg-green-500 text-white rounded-lg">
	Create New Instruction
</button>
</div>  
  
{#if isModalOpen}
<Modal isOpen={isModalOpen} closeModal={toggleModal} title={editInstructionId?"Edit Instruction":"Add Instruction"}>
	<form on:submit|preventDefault={handleSave} class="max-w-lg mx-auto px-6 pb-6 bg-white dark:bg-gray-800 shadow-md rounded-lg space-y-4">
		
		<div class="flex flex-col">
			<label for="title" class="text-gray-700 dark:text-gray-300 font-medium">Title</label>
			<input 
				id="title" 
				bind:value={title} 
				placeholder="Enter title" 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			/>
		</div>
	
		<div class="flex flex-col">
			<label for="description" class="text-gray-700 dark:text-gray-300 font-medium">Description</label>
			<textarea 
				id="description" 
				bind:value={description} 
				placeholder="Enter description" 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			></textarea>
		</div>
	
		{#if editInstructionId === null}
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
	
		<div class="flex flex-col">
			<label for="duration" class="text-gray-700 dark:text-gray-300 font-medium">Duration (minutes)</label>
			<input 
				id="duration" 
				type="number" 
				bind:value={duration} 
				placeholder="Enter duration" 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			/>
		</div>
	
		<div class="flex flex-col">
			<input 
			id="previewFile" 
			type="file" 
			accept="image/*" 
			on:change={handleFileChange} 
			class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			/>
			{#if editInstructionId && previewFile}
			<div class="flex flex-col items-center">
			<label for="previewFile" class="text-gray-700 dark:text-gray-300 font-medium">Preview File</label>
				<img src={previewFile} alt="Current preview" class="max-w-sm mb-2 rounded"/>
			</div>
			{/if}
		</div>
		<button 
			type="submit" 
			disabled={loading} 
			class="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition focus:outline-none focus:ring focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{editInstructionId === null ? 'Create Instruction' : 'Update Instruction'}
		</button>
	</form>
	
</Modal>
{/if}


<div>
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
  
	
	
	
	  <!-- Instructions Table -->
	<div class="overflow-x-auto bg-white rounded-lg 
	  [&::-webkit-scrollbar]:h-0
	">
	<table class="min-w-full bg-white dark:bg-gray-800">
		<thead class="border-b-2 border-b-indigo-800 select-none">
		  <tr>
			  <th
			  class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
			  on:click={() => sortData("title")}
			  >
			  Title {sortColumn === "title" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
			</th>
			<th
			  class="px-6  py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
			  on:click={() => sortData("description")}
			>
			Description {sortColumn === "description" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
		</th>
			<th
			  class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
			  on:click={() => sortData("createdBy")}
			  >
			  Created By {sortColumn === "createdBy" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
			</th>
			<th
			class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
			  on:click={() => sortData("updatedBy")}
			>
			Updated By {sortColumn === "updatedBy" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
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
  Preview
</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider w-0">
			  Actions
			</th>
		  </tr>
		</thead>
		<tbody>
		  {#each filteredInstructions as instruction (instruction.id)}
			<tr class="hover:bg-gray-100 odd:bg-gray-100 dark:hover:bg-gray-700">
			 
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{instruction.title}</td>
			  <td class="max-w-16 truncate px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{instruction.description}</td>
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
				{users.find(user => user.id === instruction.createdBy)?.name}
			  </td>
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
				{users.find(user => user.id === instruction.updatedBy)?.name}
			  </td>
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
				{new Date(instruction.createdAt).toLocaleDateString()}
			  </td>
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
				{new Date(instruction.updatedAt).toLocaleDateString()}
			  </td>
			  <td class="px-6 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
				<a href={instruction.previewFile} target="_blank">
				  <img src={instruction.previewFile} alt="Preview" class="w-10 h-10 object-contain rounded-md" />
				</a>
			  </td>
			  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
				<button
				  on:click={() => enableEdit(instruction)}
				  class="px-3 py-1 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
				>
				  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>
				</button>
				<button
				  on:click={() => handleDelete(instruction.id)}
				  class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
				>
				  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/></svg>
				</button>
			  </td>
			</tr>
		  {:else}
			<tr>
			  <td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-300">No instructions found</td>
			</tr>
		  {/each}
		</tbody>
	  </table>
	</div>
</div>  
</div>  