import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './useAuth';
import type { Notification } from '../types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    let isMounted = true;
    if (user) {
      apiService.getNotificationsByUserId(user.id).then(data => {
        if (isMounted) {
            setNotifications(data);
        }
      });
    }
    return () => { isMounted = false };
  }, [user]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    
    await apiService.markAllNotificationsAsRead(user.id);
  }, [user.id, unreadCount]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
