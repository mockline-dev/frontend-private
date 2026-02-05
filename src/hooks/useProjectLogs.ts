'use client'

import { getBackendUrl } from '@/config/environment'
import { useCallback, useEffect, useState } from 'react'

export interface LogEntry {
  id: string
  type: 'info' | 'error' | 'success' | 'system' | 'warning'
  message: string
  timestamp: Date
  projectId: string
  source?: string
}

export interface UseProjectLogsReturn {
  logs: LogEntry[]
  loading: boolean
  error: string | null
  clearLogs: () => void
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  isConnected: boolean
}

/**
 * Hook to manage project logs and real-time updates
 */
export function useProjectLogs(projectId?: string): UseProjectLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Add a new log entry
  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp' | 'projectId'>) => {
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      projectId: projectId || ''
    }
    
    setLogs(prev => [...prev, newLog])
  }, [projectId])

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Connect to WebSocket for real-time logs
  const connectWebSocket = useCallback(() => {
    if (!projectId || ws) return

    try {
      const wsUrl = getBackendUrl('/socket.io').replace('http', 'ws')
      const websocket = new WebSocket(`${wsUrl}/?projectId=${projectId}`)
      
      websocket.onopen = () => {
        setIsConnected(true)
        setError(null)
        addLog({
          type: 'system',
          message: 'Connected to project logs',
          source: 'terminal'
        })
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'log' && data.projectId === projectId) {
            addLog({
              type: data.logType || 'info',
              message: data.message,
              source: data.source || 'server'
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      websocket.onclose = () => {
        setIsConnected(false)
        setWs(null)
        addLog({
          type: 'system',
          message: 'Disconnected from project logs',
          source: 'terminal'
        })
      }

      websocket.onerror = (error) => {
        setError('WebSocket connection failed')
        setIsConnected(false)
        console.error('WebSocket error:', error)
      }

      setWs(websocket)
    } catch (err) {
      setError('Failed to connect to logs')
      console.error('WebSocket connection error:', err)
    }
  }, [projectId, ws, addLog])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (ws) {
      ws.close()
      setWs(null)
      setIsConnected(false)
    }
  }, [ws])

  // Load initial logs when projectId changes
  useEffect(() => {
    if (!projectId) {
      setLogs([])
      return
    }

    const loadInitialLogs = async () => {
      try {
        setLoading(true)
        setError(null)

        // Add initial system logs
        addLog({
          type: 'system',
          message: `Loading logs for project ${projectId}...`,
          source: 'terminal'
        })

        // Simulate loading project-specific logs
        // In a real implementation, this would fetch from the backend
        setTimeout(() => {
          addLog({
            type: 'success',
            message: 'Project initialized successfully',
            source: 'system'
          })
          
          addLog({
            type: 'info',
            message: 'Backend generation completed',
            source: 'ai-service'
          })
          
          addLog({
            type: 'info',
            message: 'Files uploaded to storage',
            source: 'r2-service'
          })
        }, 1000)

      } catch (err) {
        console.error('Failed to load initial logs:', err)
        setError('Failed to load logs')
        addLog({
          type: 'error',
          message: 'Failed to load project logs',
          source: 'terminal'
        })
      } finally {
        setLoading(false)
      }
    }

    loadInitialLogs()
  }, [projectId, addLog])

  // Auto-connect WebSocket when projectId is available
  useEffect(() => {
    if (projectId && !ws) {
      // Delay connection slightly to allow component to mount
      const timer = setTimeout(connectWebSocket, 1000)
      return () => clearTimeout(timer)
    }
  }, [projectId, ws, connectWebSocket])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [disconnectWebSocket])

  // Simulate some periodic logs for demo purposes
  useEffect(() => {
    if (!projectId || !isConnected) return

    const interval = setInterval(() => {
      const logTypes: Array<LogEntry['type']> = ['info', 'success']
      const messages = [
        'Health check passed',
        'Database connection stable',
        'Memory usage: 45%',
        'Request processed successfully',
        'Cache updated',
        'Backup completed'
      ]

      const randomType = logTypes[Math.floor(Math.random() * logTypes.length)]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]

      addLog({
        type: randomType,
        message: randomMessage,
        source: 'server'
      })
    }, 10000) // Add a log every 10 seconds

    return () => clearInterval(interval)
  }, [projectId, isConnected, addLog])

  return {
    logs,
    loading,
    error,
    clearLogs,
    addLog,
    connectWebSocket,
    disconnectWebSocket,
    isConnected
  }
}