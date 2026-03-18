import { authApi } from './auth';
import { dreamsApi } from './dreams';
import { categoriesApi } from './categories';
import { usersApi } from './users';
import { blogApi } from './blog';
import { searchApi } from './search';
import { contactApi } from './contact';
import { adminApi } from './admin';
import { mediaApi } from './media';

export * from './types';
export * from './client';
export * from './auth';
export * from './dreams';
export * from './categories';
export * from './users';
export * from './blog';
export * from './search';
export * from './contact';
export * from './admin';
export * from './media';

export const api = {
    auth: authApi,
    dreams: dreamsApi,
    categories: categoriesApi,
    users: usersApi,
    blog: blogApi,
    search: searchApi,
    contact: contactApi,
    admin: adminApi,
    media: mediaApi,
};

export default api;
