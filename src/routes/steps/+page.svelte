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
	import { uploadFiles } from '$lib/uploadMultipleFiles';
	import Modal from '$lib/components/modals/Modal.svelte';
	
	let type: string = 'text';
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
	let files: File[] = [];
	let uploadResults: any[] = [];
	let loading = false;
	
	onMount(async () => {
		steps = await fetchSteps();
		instructions = await fetchInstructions();
		users = await fetchUsers();
		if (users.length > 0) {
			if (createdBy === undefined || createdBy === null) createdBy = users[0].id;
			if (updatedBy === undefined || updatedBy === null) updatedBy = users[0].id;
		}
	});

	const checkAvailable = async (availableSteps: Step[]) => {
		if(instructionId === undefined){
			alert('Please select a valid Instruction.');
			return;
		}
		const usedStepNumbers = availableSteps.map(step => step.stepNr);
		let availableStepNr = 1;
		while(usedStepNumbers.includes(availableStepNr)) {
			availableStepNr++;
		}
		return availableStepNr;
	}
	
	$: if ((instructionId, steps)) {
		(async () => {
			if (!editStepId) {
				if (instructionId) {
					const nextStepNr = await checkAvailable(await fetchStepsByInstructionId(instructionId));
					if (nextStepNr) {
						stepNr = nextStepNr;
					} else {
						stepNr = 1;
					}
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
		loading=true;
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

			if(type === 'text' && files[0]){
				files=[];
				stepData.attachedFile = "";
			}else if(type !== 'text'){
				await handleUpload();
				stepData.attachedFile = uploadResults[0].url;
			}

			const newStep = await createStep(stepData);
			steps = [...steps, newStep];
		} else {
			//Edit Func
			if(files.length > 0) {
				// if (type === 'image' && !files[0].type.startsWith('image/')) {
				// 	alert('Please select an image file');
				// 			loading=false;
				// 	return;
				// }
				// if (type === 'video' && !files[0].type.startsWith('video/')) {
				// 	alert('Please select a video file'); 
				// 			loading=false;
				// 	return;
				// }
				// if (type === 'pdf' && !files[0].type.startsWith('application/')) {
				// 	alert('Please select a pdf file');
				// 			loading=false;
				// 	return;
				// }	
				
				if(type === 'text' && files[0]){
					files=[];
					stepData.attachedFile = "";
				}else{
					await handleUpload();
					stepData.attachedFile = uploadResults[0].url;
				}
			}else if(type === 'text'){
				stepData.attachedFile = "";
			}

			const updatedStep = await updateStep(editStepId, stepData);
			steps = steps.map((step) => (step.id === editStepId ? updatedStep : step));
			editStepId = null;
		}

		resetForm();
		loading=false;
	};

	const enableEdit = (step: Step) => {
		const fileInput = document.getElementById('attachedFile') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		editStepId = step.id;
		type = step.type;
		title = step.title;
		description = step.description;
		stepNr = step.stepNr;
		attachedFile = step.attachedFile || '';
		instructionId = step.instructionId;
		createdBy = step.createdBy;
		updatedBy = step.updatedBy;
		files=[];
		isModalOpen=true;
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
		type = 'text';
		title = '';
		description = '';
		stepNr = 1;
		attachedFile = '';
		instructionId = undefined;
		createdBy = users[0].id;
		updatedBy = users[0].id;
		files = [];
		uploadResults = [];
		editStepId=null;
		loading = false;	
		isModalOpen=false;
	};

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			
			if (type === 'text') {
				alert('Text type does not accept file attachments');
				target.value = '';
				return;
			}

			if (type === 'image' && !file.type.startsWith('image/')) {
				alert('Please select an image file');
				target.value = '';
				return;
			}

			if (type === 'video' && !file.type.startsWith('video/')) {
				alert('Please select a video file'); 
				target.value = '';
				return;
			}

			if (type === 'pdf' && file.type !== 'application/pdf') {
				alert('Please select a PDF file');
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

	let searchQuery="";
	$: filteredSteps = steps.filter((step) =>
		step.title.toLowerCase().includes(searchQuery.toLowerCase()) 
		|| step.id.toString().includes(searchQuery.toLowerCase())
		|| step.type.toLowerCase().includes(searchQuery.toLowerCase())
		|| step.description.toLowerCase().includes(searchQuery.toLowerCase())
		|| instructions.find((i) => i.id === step.instructionId)?.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

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


</script>

<div class="flex flex-col justify-start min-w-[50vw] max-w-[50vw] md:min-w-[70vw]  md:max-w-[70vw] lg:min-w-[75vw] lg:max-w-[75vw] xl:min-w-[80vw] xl:max-w-[80vw]  bg-white rounded-md shadow-md p-3 px-10 overflow-x-auto my-5">
	<div class="flex flex-row justify-between items-center my-2">
	<h1 class="text-2xl font-bold">List of Steps</h1>
	<button on:click={toggleModal} class="px-5 py-3 text-sm bg-green-500 text-white rounded-lg">
		Create New Step
	</button>
	</div>  
	

{#if isModalOpen}
<Modal isOpen={isModalOpen} closeModal={toggleModal} title={editStepId?"Edit Step":"Add Step"}>
	<form on:submit={handleSave} class="max-w-lg mx-auto px-6 pb-6 bg-white dark:bg-gray-800 shadow-md rounded-lg space-y-4">
	
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
			<input 
				id="description" 
				bind:value={description} 
				placeholder="Enter description" 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			/>
		</div>
		
		<div class="flex flex-col">
			<label for="type" class="text-gray-700 dark:text-gray-300 font-medium">Type</label>
			<select 
				id="type" 
				bind:value={type} 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			>
				<option value="text">Text</option>
				<option value="image">Image</option>
				<option value="video">Video</option>
				<option value="pdf">PDF</option>
			</select>
		</div>
	
		{#if type === 'image'}
			<div class="flex flex-col">
				<label for="imageFile" class="text-gray-700 dark:text-gray-300 font-medium">Image File</label>
				<input 
					id="attachedFile" 
					type="file" 
					accept="image/*" 
					required={(editStepId===null && type==='image') || (editStepId!= null && type==='image' && !attachedFile?.toLowerCase().endsWith('.jpg') && !attachedFile?.toLowerCase().endsWith('.jpeg') && !attachedFile?.toLowerCase().endsWith('.png') && !attachedFile?.toLowerCase().endsWith('.gif'))}
					on:change={handleFileChange} 
					class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
					/>
				</div>
				{/if}
				
				{#if type === 'video'}
				<div class="flex flex-col">
					<label for="videoFile" class="text-gray-700 dark:text-gray-300 font-medium">Video File</label>
					<input 
					required={(editStepId===null && type==='video') || (editStepId!==null && type==='video' && !attachedFile?.toLowerCase().endsWith('.mp4') && !attachedFile?.toLowerCase().endsWith('.webm') && !attachedFile?.toLowerCase().endsWith('.mov'))}
					id="attachedFile" 
					type="file" 
					accept="video/*" 
					on:change={handleFileChange} 
					class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
					/>
				</div>
				{/if}
				
				{#if type === 'pdf'}
			<div class="flex flex-col">
				<label for="pdfFile" class="text-gray-700 dark:text-gray-300 font-medium">PDF File</label>
				<input 
					required={(editStepId===null && type==='pdf') || (editStepId!==null && type==='pdf' && !attachedFile?.toLowerCase().endsWith('.pdf'))}
					id="attachedFile" 
					type="file" 
					accept="application/pdf" 
					on:change={handleFileChange} 
					class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
				/>
			</div>
		{/if}
		{#if editStepId !== null && attachedFile}
		<div class="flex flex-col items-center">
			<label for="img" class="text-gray-700 dark:text-gray-300 font-medium">Attached File</label>
			{#if attachedFile.toLowerCase().endsWith('.jpg') || attachedFile.toLowerCase().endsWith('.jpeg') || attachedFile.toLowerCase().endsWith('.png') || attachedFile.toLowerCase().endsWith('.gif')}
				<div class="text-sm text-gray-500 mb-1">Image File (.jpg/.jpeg/.png/.gif)</div>
				<img src={attachedFile} alt="Current" class="max-w-xs mt-2 rounded-lg" />
			{:else if attachedFile.toLowerCase().endsWith('.mp4') || attachedFile.toLowerCase().endsWith('.webm') || attachedFile.toLowerCase().endsWith('.mov')}
				<div class="text-sm text-gray-500 mb-1">Video File (.mp4/.webm/.mov)</div>
				<a href={attachedFile} target="_blank">
					<video src={attachedFile} class="max-w-xs mt-2 rounded-lg" preload="metadata" muted>
					<track kind="metadata" />
				</video>
				</a>
			{:else if attachedFile.toLowerCase().endsWith('.pdf')}
				<div class="text-sm text-gray-500 mb-1">PDF File (.pdf)</div>
				<div class="mt-2">
					<a href={attachedFile} target="_blank" class="text-blue-500 hover:text-blue-700 underline">
						View Current PDF
					</a>
				</div>
			{/if}
		</div>
	{/if}
		{#if editStepId === null}
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
			<label for="instructionId" class="text-gray-700 dark:text-gray-300 font-medium">Select Instruction</label>
			<select 
				id="instructionId" 
				bind:value={instructionId} 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			>
				<option value={undefined} disabled>Select Instruction</option>
				{#each instructions as instruction}
					<option value={instruction.id}>{instruction.title}</option>
				{/each}
			</select>
		</div>
	
		<div class="flex flex-col">
			<label for="stepNr" class="text-gray-700 dark:text-gray-300 font-medium">Step Number</label>
			<input 
				id="stepNr" 
				type="number" 
				disabled 
				bind:value={stepNr} 
				placeholder="Step Number" 
				required 
				class="mt-1 px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring focus:ring-blue-200"
			/>
		</div>
	
		<button 
			type="submit" 
			disabled={loading} 
			class="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition focus:outline-none focus:ring focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{editStepId === null ? 'Create Step' : 'Update Step'}
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
	  
		
		
		
		  <!-- Steps Table -->
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
				class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
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
<th
class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
on:click={() => sortData("instructionId")}
>
Instruction {sortColumn === "instructionId" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
</th>
<th
class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider cursor-pointer"
on:click={() => sortData("type")}
>
Type {sortColumn === "type" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
  File
</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 dark:text-gray-300 uppercase text-nowrap tracking-wider">
	Actions
</th>
</tr>
			</thead>
			<tbody>
			  {#each filteredSteps as step (step.id)}
				<tr class="hover:bg-gray-100 odd:bg-gray-100 dark:hover:bg-gray-700">
				  
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{step.title}</td>
				  <td class="max-w-16 truncate px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{step.description}</td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{users.find(user => user.id === step.createdBy)?.name}
				  </td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{users.find(user => user.id === step.updatedBy)?.name}
				  </td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{new Date(step.createdAt).toLocaleDateString()}
				  </td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{new Date(step.updatedAt).toLocaleDateString()}
				  </td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{instructions.find(instruction => instruction.id === step.instructionId)?.title}
				  </td>
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					{step.type}
				  </td>
				  
				  <td class="px-6 py-4 whitespace-nowrap text-sm  font-semibold text-gray-800 dark:text-gray-200">
					{#if step.type === 'video' && step.attachedFile}
						<a href={step.attachedFile} target="_blank">
							<video src={step.attachedFile} class="" preload="metadata" loop muted>
								<track kind="metadata" />
							</video>
						</a>
					{:else if step.type === 'pdf' && step.attachedFile}
						<a href={step.attachedFile} target="_blank" class="text-blue-500 hover:text-blue-700">
							PDF
						</a>
						{:else if step.type === 'image' && step.attachedFile}
						<a href={step.attachedFile} target="_blank" class="text-blue-500 hover:text-blue-700">
						<img src={step.attachedFile} alt="File" class=" " />
						</a>
						{:else}
						-
					{/if}
				  </td>

				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">
					<button
					  on:click={() => enableEdit(step)}
					  class="px-3 py-1 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
					>
					  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>
					</button>
					<button
					  on:click={() => handleDelete(step.id)}
					  class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
					>
					  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/></svg>
					</button>
				  </td>
				</tr>
			  {:else}
				<tr>
				  <td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-300">No Steps found</td>
				</tr>
			  {/each}
			</tbody>
		  </table>
		</div>
	</div>  
</div>
<!-- <div class="search-container">
	<input 
		type="text"
		placeholder="Search instructions..."
		bind:value={searchQuery}
	/>
</div>
<ul>
	{#each filteredSteps as step}
		<li>
			<h2 class={editStepId === step.id ? 'editing' : ''}>{step.title}</h2>
			{#if step.type === 'image' && step.attachedFile}
				<a href={step.attachedFile} target="_blank" rel="noopener noreferrer">
					<img 
						src={step.attachedFile} 
						height="50px" 
						width="50px" 
						style="margin-right: 30px;"
						alt={step.title}
					/>
				</a>
			{:else if step.type === 'video' && step.attachedFile}
				<a href={step.attachedFile} target="_blank" rel="noopener noreferrer">
					<video
						src={step.attachedFile}
						height="50px"
						width="50px" 
						style="margin-right: 30px;"
						autoplay
						muted
						loop
					/>
				</a>
			{:else if step.type === 'pdf' && step.attachedFile}
				<a href={step.attachedFile} target="_blank" rel="noopener noreferrer" style="margin-right: 30px;" title="Document file">
					<svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 32 32"><g fill="none"><path fill="url(#fluentColorDocument320)" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument322)" fill-opacity="0.5" d="M17 2H8a3 3 0 0 0-3 3v22a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V12l-7-3z"/><path fill="url(#fluentColorDocument321)" d="M17 10V2l10 10h-8a2 2 0 0 1-2-2"/><defs><linearGradient id="fluentColorDocument320" x1="20.4" x2="22.711" y1="2" y2="25.61" gradientUnits="userSpaceOnUse"><stop stop-color="#6ce0ff"/><stop offset="1" stop-color="#4894fe"/></linearGradient><linearGradient id="fluentColorDocument321" x1="21.983" x2="19.483" y1="6.167" y2="10.333" gradientUnits="userSpaceOnUse"><stop stop-color="#9ff0f9"/><stop offset="1" stop-color="#b3e0ff"/></linearGradient><radialGradient id="fluentColorDocument322" cx="0" cy="0" r="1" gradientTransform="rotate(133.108 13.335 7.491)scale(17.438 10.2853)" gradientUnits="userSpaceOnUse"><stop offset=".362" stop-color="#4a43cb"/><stop offset="1" stop-color="#4a43cb" stop-opacity="0"/></radialGradient></defs></g></svg>
				</a>
			{/if}
			<button on:click={() => enableEdit(step)}>Edit</button>
			<button on:click={() => handleDelete(step.id)}>Delete</button>
		</li>
	{/each}
</ul> -->
