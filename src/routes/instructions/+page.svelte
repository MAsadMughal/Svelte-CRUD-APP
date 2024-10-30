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
		loading = true;
		if (editInstructionId === null) {
				if(files.length<=0){
					alert('Please select a file to upload');
					return ;
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

	<label for="previewFile"><strong>Preview File</strong></label>
	<input
		id="previewFile"
		type="file"
		accept="image/*"
		on:change={handleFileChange}
		
		/>
	
	<button type="submit" disabled={loading}>
		{editInstructionId === null ? 'Create Instruction' : 'Update Instruction'}
	</button>
</form>

<div class="search-container">
	<input
		type="text"
		placeholder="Search instructions..."
		bind:value={searchQuery}
	/>
</div>


<div class="main-box-container">

	<div class="main-box">
		{#each filteredInstructions as ins}
		<div class="single-instruction">
			<div class="instruction-top">
				<div class="flex flex-row">
					<img height="30px" width="30px" src={ins.previewFile} style="margin-right: 10px;" alt="">
					<h2 class={editInstructionId === ins.id ? 'editing' : ''}>{ins.title}</h2>
				</div>
				<div class="flex flex-row">
					<button on:click={() => enableEdit(ins)} class="icon-btn edit">
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m14.06 9l.94.94L5.92 19H5v-.92zm3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83l3.75 3.75l1.83-1.83c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29m-3.6 3.19L3 17.25V21h3.75L17.81 9.94z"/></svg>
					</button>
					<button on:click={() => handleDelete(ins.id)} class="icon-btn delete">
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...$$props}>
							<path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z" />
						</svg>			
					</button>
					<button on:click={() => fetchSteps(ins.id)} class="icon-btn open">
						{#if openStepId === ins.id}
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M17 15a1 1 0 0 0 .707-1.707l-5-5a1 1 0 0 0-1.414 0l-5 5A1 1 0 0 0 7 15z" clip-rule="evenodd"/></svg>
						{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M7 9a1 1 0 0 0 .293 1.707l5 5a1 1 0 0 0 1.414 0l5-5A1 1 0 0 0 17 9z" clip-rule="evenodd"/></svg>
						{/if}</button>
					</div>
			</div>	

			{#if openStepId === ins.id}
			<div class="steps-box">
					{#each currSteps.sort((a, b) => a.stepNr - b.stepNr) as step}
						<div class="single-step">
							{#if step.type === 'text'}
								<div class="text-step">
									<h4>{step.stepNr}. {step.title}</h4>
									<p>{step.description}</p>
								</div>
							{:else if step.type === 'image'}
								<div class="image-step">
									<h4 class="step-heading">{step.stepNr}. {step.title}</h4>
									<p class="step-description">{step.description}</p>
									<img height="100px" width="100px" src={step.attachedFile} alt={step.title} />
								</div>
							{:else if step.type === 'video'}
								<div class="video-step">
									<h4>{step.stepNr}. {step.title}</h4>
									<p>{step.description}</p>
									<!-- svelte-ignore a11y-media-has-caption -->
									<video height="200px" width="200px" controls>
										<source height="100px" width="100px" src={step.attachedFile} type="video/mp4">
										
									</video>
								</div>
								{:else if step.type === 'pdf'}
								<div>
									<h4>{step.stepNr}. {step.title}</h4>
									<p>{step.description}</p>
									<!-- svelte-ignore a11y-media-has-caption -->
									<iframe  
										src={`${step.attachedFile}#page=1`}
										height="300px"
										width="100%" 
										style="border: none;"
										title={step.title}
									></iframe>
								</div>
							{/if}
						</div>
					{/each}
				</div>
				{/if}
			
		</div>
		{/each}
	</div>
</div>

<style>
	/* Additional styling for search input */
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
	::-webkit-scrollbar{
		display: none;
	}
	.flex{
		display: flex;
	}
	.flex-row{
		flex-direction: row;
	align-items: center;
	justify-content: start;
	}
	.main-box-container{
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.main-box{
		box-shadow: inset 0 0 10px 1px #ddd;
		padding: 10px;
		display: flex;
		width: 95%;
		overflow-x: auto;
		flex-direction: row;
		column-gap: 10px;
	}
	.single-instruction{
		height: 200px;
		overflow-y: auto;
		border-radius: 10px;
		border: 1px solid #ddd;
		display: flex;
		flex-direction: column;
		min-width: 300px;
		max-width: 300px;
		overflow-y: auto;
	}
	.instruction-top{

		padding: 10px;
		display: flex;
		flex-direction: row;
		align-items: center;
justify-content: space-between;
	}
	.steps-box{		
padding: 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: start;
	row-gap: 10px;
	}
	.single-step{
		background-color: black;
		width:90%;
color: white;
		box-shadow: #ddd;
		border-radius: 10px;
		padding: 10px;
	}
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
		display: flex;
		 flex-direction: row;
		 justify-content: center;
		 align-items: center;
		background-color: #007bff;
		color: white;
		border-radius: 5px;
		margin-right: 2px;	
		border: none;
		cursor: pointer;
	padding-top: 5px;
	padding-bottom: 5px;
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
