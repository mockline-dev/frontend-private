import type { EndpointDefinition, EndpointGroup, HttpMethod, OpenApiParameter, OpenApiRequestBody } from '../types';

interface OpenApiSpec {
    paths?: Record<string, Record<string, OpenApiOperation>>;
    tags?: { name: string }[];
}

interface OpenApiOperation {
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: OpenApiParameter[];
    requestBody?: OpenApiRequestBody;
    operationId?: string;
}

const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function parseOpenApiSpec(spec: OpenApiSpec): EndpointGroup[] {
    const groupMap = new Map<string, EndpointDefinition[]>();

    if (!spec.paths) return [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [methodStr, operation] of Object.entries(pathItem)) {
            const method = methodStr.toUpperCase() as HttpMethod;
            if (!SUPPORTED_METHODS.includes(method)) continue;

            const tag = operation.tags?.[0] ?? 'Default';
            const id = `${method}:${path}`;

            const endpoint: EndpointDefinition = {
                id,
                method,
                path,
                tag,
                ...(operation.summary ? { summary: operation.summary } : {}),
                ...(operation.description ? { description: operation.description } : {}),
                ...(operation.parameters ? { parameters: operation.parameters } : {}),
                ...(operation.requestBody ? { requestBody: operation.requestBody } : {}),
            };

            const group = groupMap.get(tag) ?? [];
            group.push(endpoint);
            groupMap.set(tag, group);
        }
    }

    return Array.from(groupMap.entries()).map(([tag, endpoints]) => ({ tag, endpoints }));
}
