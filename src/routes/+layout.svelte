<!-- src/routes/_layout.svelte -->

<script>
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	export let title = 'Admin Panel';
</script>

<h1>{title}</h1>

<nav>
	<ul>
		<li><a href="/" class={get(page).url.pathname === '/' ? 'active' : ''}>Home</a></li>
		<li>
			<a href="/instructions" class={get(page).url.pathname === '/instructions' ? 'active' : ''}>Manage Instructions</a>
		</li>
		<li>
			<a href="/steps" class={get(page).url.pathname === '/steps' ? 'active' : ''}>Manage Steps</a>
		</li>
		<li>
			<a href="/assets" class={get(page).url.pathname === '/assets' ? 'active' : ''}
				>Manage Assets</a
			>
		</li>
		<li>
			<a
				href="/instruction-assets"
				class={get(page).url.pathname === '/instruction-assets' ? 'active' : ''}
				>Manage Instruction Assets</a
			>
		</li>
		<li>
			<a href="/users" class={get(page).url.pathname === '/users' ? 'active' : ''}>Manage Users</a>
		</li>
	</ul>
</nav>

<slot />

<style>
	/* General Layout */
	h1 {
		text-align: center;
		color: #333;
		font-size: 2rem;
		margin-bottom: 1.5rem;
	}

	/* Navigation Styling */
	nav {
		background-color: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin: 0 auto 2rem;
		width: 80%;
		box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
	}

	ul {
		display: flex;
		justify-content: space-around;
		list-style-type: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin: 0;
	}

	a {
		text-decoration: none;
		color: #fff;
		font-weight: bold;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: color 0.2s ease, background-color 0.2s ease;
		background-color: #007bff;
	}

	/* Highlight the current route */
	a.active {
		background-color: #0056b3; /* Darker blue for active link */
		color: #fff;
	}

	/* Hover effect */
	a:hover {
		background-color: #0056b3;
		color: #fff;
	}
</style>
