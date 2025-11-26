export type NotificationType = 'prompt' | 'collection';
export type NotificationStatus = 'pending' | 'confirmed' | 'failed';

export interface UploadNotification {
  id: string;
  type: NotificationType;
  txId: string;
  title: string;
  description?: string;
  status: NotificationStatus;
  timestamp: number;
  error?: string;
}

export interface NotificationState {
  notifications: UploadNotification[];
  unreadCount: number;
}
