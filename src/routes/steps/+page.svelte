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

			if(type != 'text' && files.length === 0){
					alert('Please select a file to upload');
					loading=false;
					return;
			}
			console.log(1)
			if (type === 'image' && !files[0].type.startsWith('image/')) {
				alert('Please select an image file');
				loading=false;
				return;
			}
			console.log(2)
			if (type === 'video' && !files[0].type.startsWith('video/')) {
				alert('Please select a video file');
				loading=false; 
				return;
			}
			console.log(3)
			if (type === 'pdf' && !files[0].type.startsWith('application/')) {
				alert('Please select a pdf file');
				loading=false;
				return;
			}
			console.log(4)
			if(type === 'text' && files[0]){
				files=[];
				stepData.attachedFile = "";
				console.log(5)
			}
			else if(files[0]){
					await handleUpload();
					stepData.attachedFile = uploadResults[0].url;
			}

			const newStep = await createStep(stepData);
			steps = [...steps, newStep];
		} else {

			//Edit Func
			if(files.length > 0) {
				if (type === 'image' && !files[0].type.startsWith('image/')) {
					alert('Please select an image file');
							loading=false;
					return;
				}
				if (type === 'video' && !files[0].type.startsWith('video/')) {
					alert('Please select a video file'); 
							loading=false;
					return;
				}
				if (type === 'pdf' && !files[0].type.startsWith('application/')) {
					alert('Please select a pdf file');
							loading=false;
					return;
				}	
				
				if(type === 'text' && files[0]){
					files=[];
					stepData.attachedFile = "";
				}
				else{
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
		loading = false;	
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
		||step.description.toLowerCase().includes(searchQuery.toLowerCase()) 
	);
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
	
	<label for="title">Title</label>
	<input id="title" bind:value={title} placeholder="Title" required />
	
	<label for="description">Description</label>
	<input id="description" bind:value={description} placeholder="Description" required />
	
	<label for="type">Type</label>
	<select id="type" bind:value={type} required>
		<option value="text">Text</option>
		<option value="image">Image</option>
		<option value="video">Video</option>
		<option value="pdf">PDF</option>
	</select>

	{#if type === 'image'}
		<label for="imageFile">Image File</label>
		<input
			id="attachedFile"
			type="file"
			accept="image/*"
			on:change={handleFileChange}
		/>
	{/if}
	{#if type === 'video'}
		<label for="videoFile">Video File</label>
		<input
			id="attachedFile" 
			type="file"
			accept="video/*"
			on:change={handleFileChange}
		/>
	{/if}
	{#if type === 'pdf'}
		<label for="pdfFile">PDF File</label>
		<input
			id="attachedFile"
			type="file" 
			accept="application/pdf"
			on:change={handleFileChange}
		/>
	{/if}
	
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

	<button type="submit" disabled={loading}>{editStepId === null ? 'Create Step' : 'Update Step'}</button>
</form>
<div class="search-container">
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
