/** StoreAlert from API (GET /api/v1/alerts) */
export interface StoreAlert {
  id: string;
  storeId: string;
  type: string;
  title: string;
  message: string;
  severity: number;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}
