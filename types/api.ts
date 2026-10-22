// types/api.ts

// Format standar untuk sukses
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Format standar untuk error (opsional, untuk referensi)
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error?: string | null;
}
