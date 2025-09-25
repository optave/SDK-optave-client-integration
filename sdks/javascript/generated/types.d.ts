// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: specs/asyncapi.yaml (info.version: 3.2.1)

export type OptaveAction = 'adjust' | 'elevate' | 'customerinteraction' | 'interaction' | 'reception' | 'summarize' | 'translate' | 'recommend' | 'insights';

export interface Payload {
  session: Session;
  request: {
  requestId: string;
  attributes?: RequestAttributes;
  connections?: Connections;
  context?: Context;
  reference?: {
  ids?: ReferenceId[];
  labels?: any[];
  tags?: any[];
};
  resources?: {
  codes?: CodesItem[];
  links?: LinkItem[];
  offers?: any[];
};
  scope?: {
  accounts?: any[];
  appointments?: any[];
  assets?: any[];
  bookings?: any[];
  cases?: any[];
  conversations?: Conversation[];
  documents?: any[];
  events?: any[];
  interactions?: Interaction[];
  items?: any[];
  locations?: any[];
  offers?: any[];
  operators?: any[];
  orders?: any[];
  organizations?: any[];
  persons?: any[];
  policies?: any[];
  products?: Product[];
  properties?: any[];
  services?: any[];
  subscriptions?: any[];
  tickets?: any[];
  transactions?: any[];
  users?: any[];
};
  settings?: {
  disableBrowsing?: boolean;
  disableSearch?: boolean;
  disableSources?: boolean;
  disableStream?: boolean;
  disableTools?: boolean;
  maxResponseLength?: number;
  overrideInterfaceLanguage?: string;
  overrideOutputLanguage?: string;
};
  a2a?: A2AConfiguration[];
  cursor?: Cursor;
};
}

export interface MessageEnvelope {
  action: 'message';
  headers: {
  correlationId: string;
  tenantId?: string;
  traceId?: string;
  idempotencyKey?: string;
  identifier?: 'message';
  action: 'adjust' | 'elevate' | 'customerinteraction' | 'interaction' | 'reception' | 'summarize' | 'translate' | 'recommend' | 'insights';
  schemaRef: 'optave.message.v3';
  sdkVersion?: string;
  networkLatencyMs?: number;
  timestamp?: string;
  issuedAt?: string;
};
  payload: Payload;
}

export interface ResponseEnvelope {
  action: 'message';
  headers: {
  correlationId: string;
  tenantId?: string;
  traceId?: string;
  idempotencyKey?: string;
  identifier?: 'message';
  action: 'adjust' | 'elevate' | 'customerinteraction' | 'interaction' | 'reception' | 'summarize' | 'translate' | 'recommend' | 'insights';
  schemaRef: 'optave.response.v3' | 'optave.error.v3';
  sdkVersion?: string;
  networkLatencyMs?: number;
  timestamp?: string;
  issuedAt?: string;
};
  payload: SuperpowerResponse | ErrorResponse;
}

export interface SuperpowerResponse {
  action: 'superpower';
  actionType: string;
  state: 'started' | 'completed' | 'error';
  message: {
  results: SuperpowerResult[];
};
}

export interface ErrorResponse {
  action: 'superpower';
  actionType: string;
  state: 'error';
  message: {
  results: ErrorResult[];
};
}
