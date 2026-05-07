import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { QueryKeys } from '@/constants/queryKeys';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications';
import { updateFcmToken } from '@/services/profile';

export const useNotifications = (userId: string) => {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: QueryKeys.notifications,
    queryFn: () => getNotifications(userId),
    enabled: Boolean(userId)
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications });
    }
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications });
    }
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const registerToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await updateFcmToken(userId, token);
      }
    };

    registerToken();
  }, [userId]);

  return {
    notificationsQuery,
    markAllRead: markAllMutation.mutateAsync,
    markRead: markOneMutation.mutateAsync
  };
};
