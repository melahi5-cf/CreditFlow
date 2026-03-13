export interface ApiCall {
  id: string;
  timestamp: Date;
  method: 'POST' | 'GET';
  endpoint: string;
  payload: Record<string, unknown>;
  status: number | 'error';
  response: string;
}
