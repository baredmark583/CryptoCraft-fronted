import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

const timeSince = (date: number) => {
    const seconds = Math.floor((new Date().getTime() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " г. назад";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " мес. назад";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " д. назад";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ч. назад";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " м. назад";
    return "Только что";
};

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'new_message':
            return (
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.267 2.97 0 4.308 0 6v6c0 1.691 1.267 3.03 3.43 3.475C5.57 15.82 7.764 16 10 16s4.43-.18 6.57-.525C18.733 15.03 20 13.691 20 12V6c0-1.692-1.267-3.03-3.43-3.476C14.43 2.18 12.236 2 10 2zM6.686 4.751a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM14.43 3.691a.75.75 0 10-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        case 'new_review':
            return (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.305-.772 1.626 0l1.393 3.363a1 1 0 00.95.69h3.541c.828 0 1.18 1.073.54 1.583l-2.864 2.082a1 1 0 00-.364 1.118l1.393 3.363c.321.772-.647 1.444-1.372 1.002l-2.864-2.082a1 1 0 00-1.175 0l-2.864 2.082c-.725.442-1.693-.23-1.372-1.002l1.393-3.363a1 1 0 00-.364-1.118L2.33 8.52c-.64-.51-.288-1.583.54-1.583h3.54a1 1 0 00.95-.69l1.393-3.363z" clipRule="evenodd" />
                    </svg>
                </div>
            );
         case 'outbid':
            return (
                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-.625m3.75.625V18" />
                   </svg>
                </div>
            );
        case 'auction_won':
             return (
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-300 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M15.462 3.428a.75.75 0 01.316 1.044l-4.25 7.5a.75.75 0 01-1.343-.16l-2.5-5.25a.75.75 0 111.343-.64L10 8.337l3.538-3.538a2.25 2.25 0 013.181 0zM5.5 13a.75.75 0 001.06 0l1.22-1.22a.75.75 0 00-1.06-1.06l-1.22 1.22a.75.75 0 000 1.06zM2 13a.75.75 0 001.06 0l1.22-1.22a.75.75 0 00-1.06-1.06L2 11.94a.75.75 0 000 1.06z" clipRule="evenodd" />
                      <path d="M10.293 1.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 3.414V13a1 1 0 11-2 0V3.414L5.707 6.707a1 1 0 01-1.414-1.414l4-4z" />
                    </svg>
                </div>
             );
        case 'auction_ended_seller':
             return (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                       <path d="M5.5 16.5a3.5 3.5 0 01-3.5-3.5V8.25a.75.75 0 011.5 0v4.75a2 2 0 002 2h9a2 2 0 002-2V8.25a.75.75 0 011.5 0v4.75a3.5 3.5 0 01-3.5 3.5h-9z" />
                       <path d="M2 9.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.5z" />
                       <path d="M8.5 2.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75z" />
                    </svg>
                </div>
             );
        case 'new_dispute_seller':
            return (
                <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        case 'sale':
             return (
                <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.788 3.212a.75.75 0 00-1.06 0l-7.5 7.5a.75.75 0 000 1.06l7.5 7.5a.75.75 0 001.06-1.06L5.81 11.5h10.44a.75.75 0 000-1.5H5.81l5.038-5.038a.75.75 0 000-1.06z" clipRule="evenodd" /></svg>
                </div>
            );
        case 'new_listing_from_followed':
             return (
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                       <path d="M5.5 3.5A1.5 1.5 0 017 2h6.5a1.5 1.5 0 011.06.44l3.5 3.5a1.5 1.5 0 01.44 1.06V16.5A1.5 1.5 0 0117 18H7a1.5 1.5 0 01-1.5-1.5v-13z" />
                       <path d="M9 8a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                </div>
             );
        case 'personal_offer':
            return (
                <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10 4a2 2 0 100 4 2 2 0 000-4z" />
                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 3.293a1 1 0 011.414 0L10 11.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        default:
            return null;
    }
};


const NotificationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications } = useNotifications();

  return (
    <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-brand-surface rounded-lg shadow-2xl border border-brand-border z-50 animate-fade-in-down">
      <div className="p-3 border-b border-brand-border flex justify-between items-center">
        <h3 className="font-bold text-white">Уведомления</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <ul>
            {notifications.map(notification => (
              <li key={notification.id} className={`${!notification.read ? 'bg-brand-primary/10' : ''}`}>
                <Link to={notification.link} onClick={onClose} className="flex items-start p-3 hover:bg-brand-border/50">
                  <div className="mr-3">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-brand-text-primary">{notification.text}</p>
                    <p className="text-xs text-brand-text-secondary mt-1">{timeSince(notification.timestamp)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-brand-text-secondary">У вас нет новых уведомлений.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
