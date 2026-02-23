'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type NotificationItem = {
    _id: string;
    tripNumber: string;
    type: 'document_upload' | 'status_change';
    message: string;
    read: boolean;
    createdAt: string;
};

export default function NotificationBell() {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Stable user indicator — avoids re-running effects when session object ref changes
    const isAuthenticated = status === 'authenticated' && !!session?.user;

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    // Fetch on mount and periodically
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark all as read when dropdown opens
    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    }, [isOpen, unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mark all as read
    const markAllAsRead = async () => {
        if (isLoading || unreadCount === 0) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllRead: true }),
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Щойно';
        if (diffMins < 60) return `${diffMins} хв тому`;
        if (diffHours < 24) return `${diffHours} год тому`;
        if (diffDays < 7) return `${diffDays} дн тому`;
        return date.toLocaleDateString('uk-UA');
    };

    // Get icon for notification type
    const getIcon = (type: string) => {
        switch (type) {
            case 'document_upload':
                return (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'status_change':
                return (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
        }
    };

    if (!session?.user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-foreground/10 transition-colors"
                aria-label="Сповіщення"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[#0a0a0f] border border-white/20 rounded-xl shadow-2xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#12121a]">
                        <h3 className="text-sm font-semibold text-white">Сповіщення</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={isLoading}
                                className="text-xs text-primary hover:underline disabled:opacity-50"
                            >
                                Прочитати всі
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-white/50 bg-[#0a0a0f]">
                            Немає сповіщень
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/10">
                            {notifications.map((notification) => (
                                <li
                                    key={notification._id}
                                    className={`px-4 py-3 hover:bg-white/5 transition-colors ${
                                        !notification.read ? 'bg-primary/10' : 'bg-[#0a0a0f]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground leading-snug">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-foreground/50 mt-1">
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="shrink-0">
                                                <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
