import React, { useState } from 'react';
import { Bell, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeContext';
import { useLanguage, languages } from '@/components/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Notification.filter({ created_by: user.email }, '-created_date', 50);
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-50 flex items-center justify-end px-4 gap-2">
      {/* Notification Bell */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 dark:bg-slate-800 dark:border-slate-700" align="end">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-sm dark:text-white">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs h-7 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.is_read && markAsReadMutation.mutate(notif.id)}
                    className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                      !notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {format(new Date(notif.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        )}
      </Button>

      {/* Language Selector */}
      <Popover open={langOpen} onOpenChange={setLangOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
            <Globe className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1 dark:bg-slate-800 dark:border-slate-700" align="end">
          <div className="space-y-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setLangOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  language === lang.code
                    ? 'bg-[#0FB5BA] text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-medium w-6">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}