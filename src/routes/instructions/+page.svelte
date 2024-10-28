<!-- src/routes/instructions/+page.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchInstructions, createInstruction, deleteInstruction, updateInstruction } from '../../lib/instructions/api';
    import type { Instruction } from '../../lib/types';

    let title = '';
    let description = '';
    let duration = 0;
    let previewFile = '';
    let createdBy = 0;
    let updatedBy = 0;

    let instructions: Instruction[] = [];
    let editInstructionId: number | null = null;

    onMount(async () => {
        instructions = await fetchInstructions();
    });

    const handleSave = async () => {
        const instructionData = { title, description, duration, previewFile, createdBy, updatedBy };

        if (editInstructionId === null) {
            const newInstruction = await createInstruction(instructionData);
            instructions = [...instructions, newInstruction];
        } else {
            const updatedInstruction = await updateInstruction(editInstructionId, instructionData);
            instructions = instructions.map((instruction) => (instruction.id === editInstructionId ? updatedInstruction : instruction));
            editInstructionId = null;
        }

        resetForm();
    };

    const enableEdit = (instruction: Instruction) => {
        editInstructionId = instruction.id;
        title = instruction.title;
        description = instruction.description;
        duration = instruction.duration;
        previewFile = instruction.previewFile || '';
        createdBy = instruction.createdBy;
        updatedBy = instruction.updatedBy;
    };

    const handleDelete = async (id: number) => {
        const success = await deleteInstruction(id);
        if (success) {
            instructions = instructions.filter((instruction) => instruction.id !== id);

            if (editInstructionId === id) {
                editInstructionId = null;
                resetForm();
            }
        }else{
            alert("Foreign Key Error");
        }
    };

    const resetForm = () => {
        title = '';
        description = '';
        duration = 0;
        previewFile = '';
        createdBy = 0;
        updatedBy = 0;
    };
</script>

<h1>Instructions</h1>

<form on:submit|preventDefault={handleSave}>
    <input bind:value={title} placeholder="Title" required />
    <textarea bind:value={description} placeholder="Description" required></textarea>
    <input type="number" bind:value={duration} placeholder="Duration" required />
    <input bind:value={previewFile} placeholder="Preview File URL" />
    <input type="number" bind:value={createdBy} placeholder="Created By" required />
    <input type="number" bind:value={updatedBy} placeholder="Updated By" required />
    <button type="submit">{editInstructionId === null ? 'Create Instruction' : 'Update Instruction'}</button>
</form>

<ul>
    {#each instructions as ins}
        <li>
            <h2 class={editInstructionId === ins.id ? 'editing' : ''}>{ins.title}</h2>
            <button on:click={() => enableEdit(ins)}>Edit</button>
            <button on:click={() => handleDelete(ins.id)}>Delete</button>
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

    /* Form Styling */
    form {
        display: flex;
        flex-direction: column;
        align-items: center;
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

    input,
    textarea,
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
        margin-right: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
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
