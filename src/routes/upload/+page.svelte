<script lang="ts">
	import { uploadFiles } from '$lib/uploadMultipleFiles';

	let files: File[] = [];
	let uploadResults: any[] = [];
	let loading = false;

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
		console.log(uploadResults);
		loading = false;
	};
</script>

<div>
	<label for="fileInput">Select Files:</label>
	<input id="fileInput" type="file" multiple on:change={handleFileChange} />

	<button on:click={handleUpload} disabled={loading}>
		{loading ? 'Uploading...' : 'Upload Files'}
	</button>

	{#if uploadResults.length > 0}
		<ul>
			{#each uploadResults as result}
				<li>
					{result.file}: {result.success ? 'Uploaded Successfully' : `Error: ${result.error}`}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* Add basic styling here */
</style>
