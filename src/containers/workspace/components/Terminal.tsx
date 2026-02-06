import { Button } from '@/components/ui/button';
import { LogEntry, useProjectLogs } from '@/hooks/useProjectLogs';
import { BrushCleaning, Terminal as TerminalIcon, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function Terminal({ isOpen, onClose, projectId }: TerminalProps) {
  const { 
    logs, 
    loading, 
    error, 
    clearLogs, 
    isConnected 
  } = useProjectLogs(projectId);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
      case 'warning':
        return 'text-yellow-400';
      case 'system':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[600px] h-[400px] bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-xs font-medium text-gray-900">Terminal</span>
          <span className="inline-flex items-center gap-1">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">Disconnected</span>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-gray-900"
            onClick={onClose}
            title="Close terminal"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-gray-900 relative">
      <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-gray-900 absolute bottom-4 right-4 cursor-pointer hover:bg-gray-800"
            onClick={clearLogs}
            title="Clear logs"
          >
            <BrushCleaning className="w-3.5 h-3.5" color='red' />
          </Button>
        {loading ? (
          <div className="text-gray-400 text-center py-8">
            Loading logs...
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">
            Error: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {projectId ? 'No logs yet for this project' : 'No project selected'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 text-xs">
                <span className="text-gray-500 shrink-0">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                {log.source && (
                  <span className="text-gray-400 shrink-0">
                    [{log.source}]
                  </span>
                )}
                <span className={getLogColor(log.type)}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
