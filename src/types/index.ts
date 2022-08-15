export interface ShareTokenConfig {
  dbName?: string;
  validateEndPoint?: string;
  tokenSize?: number;
}

export interface ValidateResponse {
  code: number;
  message: string;
  isBlocked?: boolean;
}
