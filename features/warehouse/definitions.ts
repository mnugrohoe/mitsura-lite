export type WarehouseRecord = {
  id: string;
  username: string;
  fullName: string | null;
  password_hash: string | null;
  email: string | null;
  failed_attempts: number;
  locked: boolean;
  role_id: string | null;
  role_name: string | null;
  rol_offset: string | null;
};
