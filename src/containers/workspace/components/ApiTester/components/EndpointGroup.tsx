'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EndpointItem } from './EndpointItem';
import type { EndpointDefinition, EndpointGroup as EndpointGroupType } from '../types';

interface EndpointGroupProps {
    group: EndpointGroupType;
    selectedEndpointId: string | null;
    onSelect: (endpoint: EndpointDefinition) => void;
}

export function EndpointGroup({ group, selectedEndpointId, onSelect }: EndpointGroupProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div>
            <button
                onClick={() => setCollapsed((c) => !c)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-800 transition-colors"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span className="truncate">{group.tag}</span>
                <span className="ml-auto text-zinc-400 font-normal normal-case tracking-normal">{group.endpoints.length}</span>
            </button>
            {!collapsed && (
                <div className="flex flex-col gap-0.5 pl-1">
                    {group.endpoints.map((ep) => (
                        <EndpointItem key={ep.id} endpoint={ep} isSelected={selectedEndpointId === ep.id} onClick={() => onSelect(ep)} />
                    ))}
                </div>
            )}
        </div>
    );
}
