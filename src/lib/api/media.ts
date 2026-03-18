import { fetchApi, getAuthToken, API_BASE_URL } from './client';

export const mediaApi = {
    async listFiles(bucket: string = 'blog-images') {
        return fetchApi<{ files: { id: string; name: string; size: number; type: string; url: string; created_at: string }[] }>(`/media/list?bucket=${bucket}`);
    },

    async uploadFile(file: File, bucket: string = 'blog-images', folder: string = 'posts') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('folder', folder);

        const response = await fetch(`${API_BASE_URL}/media/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken() || ''}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || `HTTP error: ${response.status}`,
            };
        }

        return data;
    },

    async deleteFile(fileName: string, bucket: string = 'blog-images') {
        return fetchApi(`/media/delete`, {
            method: 'DELETE',
            body: JSON.stringify({ bucket, fileName }),
        });
    },

    async deleteFiles(fileNames: string[], bucket: string = 'blog-images') {
        return fetchApi(`/media/delete-bulk`, {
            method: 'DELETE',
            body: JSON.stringify({ bucket, fileNames }),
        });
    },
};
