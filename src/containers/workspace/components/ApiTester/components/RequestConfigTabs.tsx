'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthEditor } from './AuthEditor';
import { BodyEditor } from './BodyEditor';
import { KeyValueEditor } from './KeyValueEditor';
import type { AuthConfig, KeyValuePair } from '../types';

interface RequestConfigTabsProps {
    params: KeyValuePair[];
    headers: KeyValuePair[];
    body: string;
    contentType: string;
    auth: AuthConfig;
    onParamsChange: (p: KeyValuePair[]) => void;
    onHeadersChange: (h: KeyValuePair[]) => void;
    onBodyChange: (b: string) => void;
    onContentTypeChange: (ct: string) => void;
    onAuthChange: (a: AuthConfig) => void;
}

export function RequestConfigTabs({
    params,
    headers,
    body,
    contentType,
    auth,
    onParamsChange,
    onHeadersChange,
    onBodyChange,
    onContentTypeChange,
    onAuthChange,
}: RequestConfigTabsProps) {
    return (
        <Tabs defaultValue="params" className="h-full flex flex-col">
            <TabsList className="shrink-0 h-8 bg-zinc-100 mx-3 mt-2 w-auto self-start">
                <TabsTrigger value="params" className="text-xs h-6 px-3">Params</TabsTrigger>
                <TabsTrigger value="headers" className="text-xs h-6 px-3">Headers</TabsTrigger>
                <TabsTrigger value="body" className="text-xs h-6 px-3">Body</TabsTrigger>
                <TabsTrigger value="auth" className="text-xs h-6 px-3">Auth</TabsTrigger>
            </TabsList>

            <TabsContent value="params" className="flex-1 overflow-y-auto p-3 mt-0">
                <KeyValueEditor pairs={params} onChange={onParamsChange} addLabel="Add parameter" />
            </TabsContent>

            <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 mt-0">
                <KeyValueEditor pairs={headers} onChange={onHeadersChange} addLabel="Add header" />
            </TabsContent>

            <TabsContent value="body" className="flex-1 overflow-hidden mt-0">
                <BodyEditor body={body} contentType={contentType} onBodyChange={onBodyChange} onContentTypeChange={onContentTypeChange} />
            </TabsContent>

            <TabsContent value="auth" className="flex-1 overflow-y-auto mt-0">
                <AuthEditor auth={auth} onChange={onAuthChange} />
            </TabsContent>
        </Tabs>
    );
}
