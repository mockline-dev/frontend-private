export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

export interface EndpointDefinition {
    id: string;
    method: HttpMethod;
    path: string;
    summary?: string;
    description?: string;
    parameters?: OpenApiParameter[];
    requestBody?: OpenApiRequestBody;
    tag: string;
}

export interface OpenApiParameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required?: boolean;
    description?: string;
    schema?: { type?: string; example?: unknown };
    example?: unknown;
}

export interface OpenApiRequestBody {
    required?: boolean;
    content?: Record<string, { schema?: unknown; example?: unknown }>;
}

export interface EndpointGroup {
    tag: string;
    endpoints: EndpointDefinition[];
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    durationMs: number;
    size: number;
}

export type AuthType = 'none' | 'bearer' | 'basic';

export interface AuthConfig {
    type: AuthType;
    token: string;
    username: string;
    password: string;
}

export interface RequestState {
    method: HttpMethod;
    url: string;
    params: KeyValuePair[];
    headers: KeyValuePair[];
    body: string;
    contentType: string;
    auth: AuthConfig;
}

export interface ApiTesterProps {
    sessionProxyUrl: string | null;
    isSessionRunning: boolean;
    onRunBackend: () => void;
    isRunning: boolean;
}
