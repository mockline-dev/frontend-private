'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { EndpointGroup } from './EndpointGroup';
import type { EndpointDefinition, EndpointGroup as EndpointGroupType } from '../types';

interface EndpointSidebarProps {
    groups: EndpointGroupType[];
    selectedEndpointId: string | null;
    onSelect: (endpoint: EndpointDefinition) => void;
}

export function EndpointSidebar({ groups, selectedEndpointId, onSelect }: EndpointSidebarProps) {
    const [search, setSearch] = useState('');
    const query = search.toLowerCase();

    const filtered = query
        ? groups
            .map((g) => ({ ...g, endpoints: g.endpoints.filter((e) => e.path.toLowerCase().includes(query) || e.method.toLowerCase().includes(query)) }))
            .filter((g) => g.endpoints.length > 0)
        : groups;

    return (
        <div className="h-full flex flex-col bg-zinc-50 border-r border-zinc-200 overflow-hidden">
            <div className="p-2 border-b border-zinc-200">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search endpoints…"
                        className="h-7 pl-7 text-xs bg-white border-zinc-200"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1">
                {filtered.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-6">No endpoints found</p>
                ) : (
                    filtered.map((g) => (
                        <EndpointGroup key={g.tag} group={g} selectedEndpointId={selectedEndpointId} onSelect={onSelect} />
                    ))
                )}
            </div>
        </div>
    );
}
