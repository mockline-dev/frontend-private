import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface TestRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  status?: 'success' | 'error' | 'idle' | 'loading';
  responseTime?: number;
  headers?: Record<string, string>;
  body?: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
}

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const methodColors = {
  GET: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  POST: 'text-blue-600 bg-blue-50 border-blue-200',
  PUT: 'text-amber-600 bg-amber-50 border-amber-200',
  DELETE: 'text-red-600 bg-red-50 border-red-200',
  PATCH: 'text-purple-600 bg-purple-50 border-purple-200',
};

interface TestPanelProps {
  projectId?: string;
}

export function TestPanel({ projectId }: TestPanelProps) {
  // Initialize with common API endpoints for backend testing
  const [requests, setRequests] = useState<TestRequest[]>([
    {
      id: '1',
      name: 'Health Check',
      method: 'GET',
      url: 'http://localhost:3000/api/health',
      status: 'idle'
    },
    {
      id: '2',
      name: 'Get Users',
      method: 'GET',
      url: 'http://localhost:3000/api/users',
      status: 'idle'
    },
    {
      id: '3',
      name: 'Login',
      method: 'POST',
      url: 'http://localhost:3000/api/auth/login',
      status: 'idle',
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123"
      }, null, 2)
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<TestRequest>(requests[0]);
  const [currentMethod, setCurrentMethod] = useState<typeof methods[number]>(selectedRequest.method);
  const [currentUrl, setCurrentUrl] = useState(selectedRequest.url);
  const [currentName, setCurrentName] = useState(selectedRequest.name);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState(selectedRequest.body || '{\n  "key": "value"\n}');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update form when selected request changes
  useEffect(() => {
    setCurrentMethod(selectedRequest.method);
    setCurrentUrl(selectedRequest.url);
    setCurrentName(selectedRequest.name);
    setBody(selectedRequest.body || '{\n  "key": "value"\n}');
  }, [selectedRequest]);

  const parseHeaders = (headersString: string): Record<string, string> => {
    try {
      return JSON.parse(headersString);
    } catch {
      // Fallback to simple parsing
      const headerObj: Record<string, string> = {};
      headersString.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          headerObj[key.trim()] = valueParts.join(':').trim();
        }
      });
      return headerObj;
    }
  };

  const handleSendRequest = async () => {
    if (!currentUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    // Update request status to loading
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: 'loading' as const }
        : req
    ));

    try {
      const requestHeaders = parseHeaders(headers);
      const requestOptions: RequestInit = {
        method: currentMethod,
        headers: requestHeaders,
      };

      // Add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(currentMethod) && body.trim()) {
        try {
          // Validate JSON if Content-Type is application/json
          if (requestHeaders['Content-Type']?.includes('application/json')) {
            JSON.parse(body); // Validate JSON
          }
          requestOptions.body = body;
        } catch (error) {
          toast.error('Invalid JSON in request body');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(currentUrl, requestOptions);
      const responseTime = Date.now() - startTime;
      
      // Get response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Get response data
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        responseTime
      };

      setResponse(apiResponse);
      
      // Update request status
      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              status: response.ok ? 'success' as const : 'error' as const,
              responseTime,
              url: currentUrl,
              method: currentMethod,
              name: currentName,
              headers: requestHeaders,
              body: body
            }
          : req
      ));

      if (response.ok) {
        toast.success(`Request completed in ${responseTime}ms`);
      } else {
        toast.error(`Request failed: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const errorResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: errorMessage },
        responseTime
      };

      setResponse(errorResponse);
      
      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: 'error' as const, responseTime }
          : req
      ));

      toast.error(`Request failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRequest = () => {
    const newRequest: TestRequest = {
      id: Date.now().toString(),
      name: 'New Request',
      method: 'GET',
      url: 'http://localhost:3000/api/',
      status: 'idle'
    };
    setRequests(prev => [...prev, newRequest]);
    setSelectedRequest(newRequest);
  };

  const handleSaveRequest = () => {
    setRequests(prev => prev.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            name: currentName,
            method: currentMethod,
            url: currentUrl,
            headers: parseHeaders(headers),
            body: body
          }
        : req
    ));
    toast.success('Request saved');
  };

  const handleCopyResponse = () => {
    if (response) {
      const responseText = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data, null, 2);
      navigator.clipboard.writeText(responseText);
      toast.success('Response copied to clipboard');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar - Request List */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-3 border-b border-gray-200 bg-white">
          <Button 
            onClick={handleAddRequest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Request
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide px-2 py-2">
            Requests
          </div>
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className={`w-full text-left p-2.5 rounded-lg mb-1 transition-colors group ${
                selectedRequest.id === req.id
                  ? 'bg-white border border-blue-200 shadow-sm'
                  : 'hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${methodColors[req.method]}`}>
                  {req.method}
                </span>
                <span className="text-xs text-gray-900 font-medium truncate flex-1">{req.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(req.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                </button>
              </div>
              {req.status !== 'idle' && (
                <div className="flex items-center gap-1.5">
                  {req.status === 'loading' ? (
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  ) : req.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  {req.responseTime && (
                    <span className="text-[10px] text-gray-500">{req.responseTime}ms</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col">
        {/* Request Builder */}
        <div className="border-b border-gray-200 bg-white">
          <div className="p-4 space-y-3">
            {/* Request Name */}
            <div>
              <input
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                placeholder="Request name"
                className="w-full h-8 bg-gray-50 border border-gray-200 rounded px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
              />
            </div>
            {/* URL Bar */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                  className={`h-10 px-4 rounded-lg font-bold text-xs flex items-center gap-2 border ${methodColors[currentMethod]}`}
                >
                  {currentMethod}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showMethodDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg overflow-hidden z-10 shadow-xl min-w-[120px]">
                    {methods.map(method => (
                      <button
                        key={method}
                        onClick={() => {
                          setCurrentMethod(method);
                          setShowMethodDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 ${methodColors[method]}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="http://localhost:3000/api/endpoint"
                className="flex-1 h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
              />
              <Button
                onClick={handleSendRequest}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
              <Button
                onClick={handleSaveRequest}
                variant="outline"
                className="h-10 px-4"
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="body" className="w-full">
              <TabsList className="bg-gray-100 h-9">
                <TabsTrigger value="params" className="text-xs">Params</TabsTrigger>
                <TabsTrigger value="headers" className="text-xs">Headers</TabsTrigger>
                <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
                <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
              </TabsList>
              <TabsContent value="params" className="mt-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">No parameters</p>
                </div>
              </TabsContent>
              <TabsContent value="headers" className="mt-3">
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-900 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                  rows={6}
                />
              </TabsContent>
              <TabsContent value="body" className="mt-3">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-900 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                  rows={6}
                />
              </TabsContent>
              <TabsContent value="auth" className="mt-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">No authentication configured</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Response */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900 text-sm">Response</h3>
              {response && (
                <div className="flex items-center gap-3 text-xs">
                  <span className={`flex items-center gap-1.5 font-medium ${
                    response.status >= 200 && response.status < 300 
                      ? 'text-emerald-600' 
                      : response.status === 0
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}>
                    {response.status >= 200 && response.status < 300 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {response.status === 0 ? 'Network Error' : `${response.status} ${response.statusText}`}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Clock className="w-4 h-4" />
                    {response.responseTime}ms
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleCopyResponse}
              disabled={!response}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {response ? (
              <div className="space-y-4">
                {/* Response Headers */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Headers</h4>
                  <pre className="text-xs text-gray-600 font-mono bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </div>
                
                {/* Response Body */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Body</h4>
                  <pre className="text-xs text-gray-900 font-mono bg-white rounded-lg p-4 border border-gray-200 whitespace-pre-wrap">
                    {typeof response.data === 'string' 
                      ? response.data 
                      : JSON.stringify(response.data, null, 2)
                    }
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-1">No response yet</p>
                  <p className="text-gray-400 text-xs">Send a request to see the response here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
