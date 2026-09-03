'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNotifications() {
  const {
    data: notifications,
    error,
    mutate,
  } = useSWR('/api/notifications', fetcher, { refreshInterval: 30000 });

  const { data: countData } = useSWR('/api/notifications/unread-count', fetcher, {
    refreshInterval: 30000,
  });

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    mutate();
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    mutate();
  };

  return {
    notifications: notifications?.data ?? [],
    unreadCount: countData?.count ?? 0,
    error,
    markAsRead,
    markAllAsRead,
    refresh: mutate,
  };
}
