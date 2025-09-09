import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/mockApiService';
import { Notification, NotificationType } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { Bell, Wallet, Package, Sparkles, UserPlus, XCircle, Check, AlertTriangle } from 'lucide-react';

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactElement> = {
    [NotificationType.WALLET_LOW]: <Wallet className="text-black" />,
    [NotificationType.ORDER_PLACED]: <Package className="text-black" />,
    [NotificationType.ORDER_FAILED]: <XCircle className="text-red-500" />,
    [NotificationType.NEW_SCHEME]: <Sparkles className="text-black" />,
    [NotificationType.DISTRIBUTOR_ADDED]: <UserPlus className="text-black" />,
    [NotificationType.CREDIT_LIMIT_HIGH]: <AlertTriangle className="text-orange-500" />,
};

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        await api.markAllNotificationsAsRead();
        fetchNotifications();
    };

    const handleMarkAsRead = async (id: string) => {
        await api.markNotificationAsRead(id);
        fetchNotifications();
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <div className="flex items-center gap-4">
                     <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <Button variant={filter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('all')} className={filter !== 'all' ? 'bg-white !text-black hover:bg-gray-200' : ''}>All</Button>
                        <Button variant={filter === 'unread' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('unread')} className={filter !== 'unread' ? 'bg-white !text-black hover:bg-gray-200' : ''}>Unread</Button>
                    </div>
                    <Button onClick={handleMarkAllAsRead} variant="secondary" size="sm" disabled={notifications.every(n => n.isRead)}>
                        <Check size={16} className="mr-2"/> Mark all as read
                    </Button>
                </div>
            </div>
            {loading ? (
                <div className="text-center p-8">Loading notifications...</div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.length > 0 ? filteredNotifications.map(notification => (
                        <div key={notification.id} className={`flex items-start p-4 rounded-lg transition-colors ${notification.isRead ? 'bg-gray-50 text-black opacity-70' : 'bg-white shadow-sm'}`}>
                            <div className="flex-shrink-0 mr-4 mt-1">
                                {NOTIFICATION_ICONS[notification.type]}
                            </div>
                            <div className="flex-grow">
                                <p className={!notification.isRead ? 'font-semibold text-text-primary' : ''}>{notification.message}</p>
                                <p className="text-xs mt-1">{timeSince(notification.date)}</p>
                            </div>
                            {!notification.isRead && (
                                <button title="Mark as read" onClick={() => handleMarkAsRead(notification.id)} className="ml-4 p-1 rounded-full hover:bg-gray-200">
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                                </button>
                            )}
                        </div>
                    )) : (
                        <p className="text-center p-8 text-black">No notifications to display.</p>
                    )}
                </div>
            )}
        </Card>
    );
};

export default NotificationsPage;