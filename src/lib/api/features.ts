import { fetchApi } from './client';

export const communityApi = {
    getTodayPoll() {
        return fetchApi<any>('/community/poll/today');
    },
    vote(pollId: string, optionIndex: number) {
        return fetchApi<any>('/community/poll/vote', {
            method: 'POST',
            body: JSON.stringify({ pollId, optionIndex }),
        });
    },
    getPollHistory(limit = 30) {
        return fetchApi<any[]>(`/community/poll/history?limit=${limit}`);
    },
    getWeeklyTrending(limit = 10) {
        return fetchApi<any[]>(`/community/trending/weekly?limit=${limit}`);
    },
    getMonthlyTrending(limit = 10) {
        return fetchApi<any[]>(`/community/trending/monthly?limit=${limit}`);
    },
};

export const symbolsApi = {
    getAll(page = 1, limit = 50, search?: string) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set('search', search);
        return fetchApi<any>(`/symbols?${params}`);
    },
    getBySlug(slug: string) {
        return fetchApi<any>(`/symbols/${slug}`);
    },
    getRelated(slug: string) {
        return fetchApi<any[]>(`/symbols/${slug}/related`);
    },
    getCultures() {
        return fetchApi<any[]>('/symbols/cultures');
    },
    getCultureByCode(code: string, page = 1) {
        return fetchApi<any>(`/symbols/cultures/${code}?page=${page}`);
    },
    compareSymbol(symbol: string) {
        return fetchApi<any>(`/symbols/compare/${symbol}`);
    },
    getOttomanInterpretations(page = 1, search?: string) {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set('search', search);
        return fetchApi<any>(`/symbols/ottoman?${params}`);
    },
};

export const notificationsApi = {
    getAll(page = 1, limit = 20, unreadOnly = false) {
        return fetchApi<any>(`/notifications?page=${page}&limit=${limit}&unread=${unreadOnly}`);
    },
    getUnreadCount() {
        return fetchApi<any>('/notifications/unread-count');
    },
    markAsRead(id: string) {
        return fetchApi<any>(`/notifications/${id}/read`, { method: 'PUT' });
    },
    markAllAsRead() {
        return fetchApi<any>('/notifications/read-all', { method: 'PUT' });
    },
    delete(id: string) {
        return fetchApi<any>(`/notifications/${id}`, { method: 'DELETE' });
    },
    getPreferences() {
        return fetchApi<any>('/notifications/preferences');
    },
    updatePreferences(prefs: any) {
        return fetchApi<any>('/notifications/preferences', {
            method: 'PUT',
            body: JSON.stringify(prefs),
        });
    },
    subscribePush(subscription: PushSubscription) {
        return fetchApi<any>('/notifications/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription.toJSON()),
        });
    },
};

export const featuresApi = {
    getCalendar(year: number, month: number) {
        return fetchApi<any>(`/features/calendar?year=${year}&month=${month}`);
    },
    getMonthlySummary(year: number, month: number) {
        return fetchApi<any>(`/features/monthly-summary?year=${year}&month=${month}`);
    },
    getSleepQuality(days = 30) {
        return fetchApi<any[]>(`/features/sleep?days=${days}`);
    },
    logSleepQuality(sleepDate: string, quality: number, hoursSlept?: number, notes?: string) {
        return fetchApi<any>('/features/sleep', {
            method: 'POST',
            body: JSON.stringify({ sleepDate, quality, hoursSlept, notes }),
        });
    },
    getSleepCorrelation(days = 90) {
        return fetchApi<any>(`/features/sleep-correlation?days=${days}`);
    },
    getReactions(commentId: string) {
        return fetchApi<any>(`/features/reactions/${commentId}`);
    },
    toggleReaction(commentId: string, emoji: string) {
        return fetchApi<any>(`/features/reactions/${commentId}`, {
            method: 'POST',
            body: JSON.stringify({ emoji }),
        });
    },
    getConsultants() {
        return fetchApi<any[]>('/features/consultants');
    },
    getConsultant(id: string) {
        return fetchApi<any>(`/features/consultants/${id}`);
    },
    bookAppointment(consultantId: string, appointmentDate: string, durationMinutes?: number, notes?: string) {
        return fetchApi<any>('/features/appointments', {
            method: 'POST',
            body: JSON.stringify({ consultantId, appointmentDate, durationMinutes, notes }),
        });
    },
    getAppointments() {
        return fetchApi<any[]>('/features/appointments');
    },
    cancelAppointment(id: string) {
        return fetchApi<any>(`/features/appointments/${id}/cancel`, { method: 'PUT' });
    },
    getAds(position?: string) {
        const params = position ? `?position=${position}` : '';
        return fetchApi<any[]>(`/features/ads${params}`);
    },
};
