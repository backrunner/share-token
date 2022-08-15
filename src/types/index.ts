export interface ShareTokenConfig {
  dbName?: string;
  validateEndPoint?: string;
}

export interface ValidateResponse {
  code: number;
  message: string;
  isBlocked?: boolean;
}
