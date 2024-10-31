<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchUsers, createUser, deleteUser, updateUser } from '../../lib/users/api';
	import type { User } from '../../lib/types';
	import Modal from '$lib/components/modals/Modal.svelte';
	
	let loading = false;
	let name = '';
	let users: User[] = [];
	let editUserId: number | null = null;

	onMount(async () => {
		users = await fetchUsers();
	});

	const handleSave = async () => {
		loading=true;
		if (editUserId === null) {
			const newUser = await createUser(name);
			if (newUser) {
				users = [...users, newUser];
			}
		} else {
			const updatedUser = await updateUser(editUserId, name);
			if (updatedUser) {
				users = users.map((user) => (user.id === editUserId ? updatedUser : user));
				editUserId = null;
			}
		}
		name = '';
		loading=false;
		toggleModal();
	};

	const enableEdit = (user: User) => {
		editUserId = user.id;
		name = user.name;
		toggleModal();
	};

	const handleDelete = async (id: number) => {
		const success = await deleteUser(id);
		if (success) {
			users = users.filter((user) => user.id !== id);
			if (editUserId === id) {
				editUserId = null;
				name = '';
			}
		}
	};
	let searchQuery="";
	$: filteredUsers = users.filter((user) =>
		user.name.toLowerCase().includes(searchQuery.toLowerCase()) 
		|| user.id.toString().includes(searchQuery.toLowerCase())
		
	);
	
let isModalOpen = false;

function toggleModal() {
  isModalOpen = !isModalOpen;
  if(!isModalOpen){
	name='';
	editUserId=null;
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

    filteredUsers = [...filteredUsers].sort((a, b) => {
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
	<h1 class="text-2xl font-bold">List of Users</h1>
	<button on:click={toggleModal} class="px-5 py-3 text-sm bg-green-500 text-white rounded-lg">
		Create New User
	</button>
	</div>  
	

{#if isModalOpen}

<Modal isOpen={isModalOpen} closeModal={toggleModal} title={editUserId?"Edit User":"Add User"}>
	<form on:submit|preventDefault={handleSave} class="flex flex-col max-w-md mx-auto p-6 bg-white mb-5 rounded-lg shadow-lg space-y-4">
		<input 
			bind:value={name} 
			placeholder="Enter Name" 
			required 
			class="px-4 py-2 border rounded-md bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400" 
		/>
		<button 
			type="submit" 
			class="px-4 py-2 font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{editUserId === null ? 'Create User' : 'Update User'}
		</button>
	</form>
	
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
	Actions
</th>
</tr>
			</thead>
			<tbody>
			  {#each filteredUsers as user (user.id)}
				<tr class="hover:bg-gray-100 odd:bg-gray-100 dark:hover:bg-gray-700">
				  
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200 w-1/4">{user.id}</td>
				  
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200 w-2/3">{user.name}</td>
				  
				  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200 w-1/4">
					<button
					  on:click={() => enableEdit(user)}
					  class="px-3 py-1 mr-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
					>
					  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>
					</button>
					<button
					  on:click={() => handleDelete(user.id)}
					  class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
					>
					  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><rect width="24" height="24" fill="none"/><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/></svg>
					</button>
				  </td>
				</tr>
			  {:else}
				<tr>
				  <td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-300">No Users found</td>
				</tr>
			  {/each}
			</tbody>
		  </table>
		</div>
	</div>
