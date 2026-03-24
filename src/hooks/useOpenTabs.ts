'use client';

import type { EditorTab } from '@/types/workspace';
import { useCallback, useState } from 'react';

const MAX_TABS = 20;

export interface UseOpenTabsReturn {
    tabs: EditorTab[];
    activeTabId: string | null;
    openTab: (tab: Omit<EditorTab, 'isDirty'>) => void;
    closeTab: (tabId: string) => string | null;
    closeOtherTabs: (tabId: string) => void;
    closeAllTabs: () => void;
    setActiveTab: (tabId: string) => void;
    markDirty: (tabId: string) => void;
    markClean: (tabId: string) => void;
    hasUnsavedChanges: boolean;
}

export function useOpenTabs(): UseOpenTabsReturn {
    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    const openTab = useCallback((tab: Omit<EditorTab, 'isDirty'>) => {
        setTabs((prev) => {
            const existing = prev.find((t) => t.id === tab.id);
            if (existing) {
                setActiveTabId(tab.id);
                return prev;
            }

            let next = [...prev];

            if (next.length >= MAX_TABS) {
                // Evict oldest non-dirty tab
                const evictIndex = next.findIndex((t) => !t.isDirty);
                if (evictIndex >= 0) {
                    next = next.filter((_, i) => i !== evictIndex);
                } else {
                    // All dirty — evict oldest
                    next = next.slice(1);
                }
            }

            const newTab: EditorTab = { ...tab, isDirty: false };
            setActiveTabId(tab.id);
            return [...next, newTab];
        });
    }, []);

    const closeTab = useCallback((tabId: string): string | null => {
        let nextActiveId: string | null = null;

        setTabs((prev) => {
            const idx = prev.findIndex((t) => t.id === tabId);
            if (idx === -1) return prev;

            const next = prev.filter((t) => t.id !== tabId);

            // Determine next active tab
            if (next.length > 0) {
                const nextTab = next[Math.min(idx, next.length - 1)];
                nextActiveId = nextTab?.id ?? null;
            }

            return next;
        });

        setActiveTabId((prev) => {
            if (prev === tabId) return nextActiveId;
            return prev;
        });

        return nextActiveId;
    }, []);

    const closeOtherTabs = useCallback((tabId: string) => {
        setTabs((prev) => prev.filter((t) => t.id === tabId));
        setActiveTabId(tabId);
    }, []);

    const closeAllTabs = useCallback(() => {
        setTabs([]);
        setActiveTabId(null);
    }, []);

    const setActiveTab = useCallback((tabId: string) => {
        setActiveTabId(tabId);
    }, []);

    const markDirty = useCallback((tabId: string) => {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isDirty: true } : t)));
    }, []);

    const markClean = useCallback((tabId: string) => {
        setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t)));
    }, []);

    const hasUnsavedChanges = tabs.some((t) => t.isDirty);

    return {
        tabs,
        activeTabId,
        openTab,
        closeTab,
        closeOtherTabs,
        closeAllTabs,
        setActiveTab,
        markDirty,
        markClean,
        hasUnsavedChanges
    };
}
