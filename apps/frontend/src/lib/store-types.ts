/** Store as returned by GET /api/v1/user/stores */
export interface Store {
  id: string;
  name: string;
  rut: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
