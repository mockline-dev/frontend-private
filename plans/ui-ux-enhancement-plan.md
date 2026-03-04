# UI/UX Enhancement Plan
## Initial Screen, Dashboard, and Workspace

**Project:** Mockline - AI-Powered Backend Generator
**Date:** 2026-03-04
**Design System:** shadcn/ui (New York style, Zinc color scheme)
**Theme:** Stunning AI/Developer Experience Platform

---

## Executive Summary

This plan outlines a comprehensive redesign of the three core screens in Mockline: **Initial Screen**, **Dashboard**, and **Workspace**. The redesign focuses on modern, minimalist UI/UX principles using shadcn/ui components and blocks, with emphasis on visual hierarchy, accessibility, and user experience.

---

## Design Principles

1. **Minimalism**: Clean, uncluttered interfaces with purposeful elements
2. **Visual Hierarchy**: Clear distinction between primary, secondary, and tertiary actions
3. **Consistency**: Unified design language across all screens
4. **Accessibility**: WCAG AA compliant with proper contrast ratios and focus states
5. **Performance**: Optimized rendering with minimal re-renders
6. **Responsive**: Mobile-first approach with breakpoints at sm (640px), md (768px), lg (1024px)

---

## AI-Themed Loading States & Animations

### Design Philosophy
Since Mockline is an AI-powered backend builder, loading states should reflect the AI processing nature with:
- **Progressive Disclosure**: Show what's happening at each stage
- **Visual Feedback**: Animated elements that indicate AI processing
- **Status Updates**: Real-time messages about the AI's actions
- **Engaging Experience**: Make waiting feel productive and exciting

### Loading Component Library

#### 1. `AILoadingState` - Main AI Loading Component
A sophisticated loading state that shows AI processing stages.

```tsx
// src/components/shared/AILoadingState.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Cpu, Database, Code2, CheckCircle2, Loader2 } from 'lucide-react'

interface AILoadingStage {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'processing' | 'complete' | 'error'
}

interface AILoadingStateProps {
  title?: string
  stages: AILoadingStage[]
  progress: number
  message?: string
  variant?: 'default' | 'compact' | 'minimal'
}

export function AILoadingState({
  title = 'AI is generating your backend...',
  stages,
  progress,
  message,
  variant = 'default'
}: AILoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className={`w-full max-w-md ${variant === 'minimal' ? 'border-0 shadow-none bg-transparent' : ''}`}>
        <CardContent className={`p-8 space-y-6 ${variant === 'minimal' ? 'p-0' : ''}`}>
          {/* Header with animated icon */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                {variant === 'default' ? (
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                ) : (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {message && (
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {variant !== 'minimal' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generating...</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Processing Stages */}
          {variant !== 'minimal' && (
            <div className="space-y-3">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    stage.status === 'complete' ? 'bg-green-500/10' :
                    stage.status === 'processing' ? 'bg-primary/10' :
                    stage.status === 'error' ? 'bg-destructive/10' :
                    'bg-muted'
                  }`}>
                    {stage.status === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : stage.status === 'processing' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : stage.status === 'error' ? (
                      <div className="h-4 w-4 text-destructive">✕</div>
                    ) : (
                      stage.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      stage.status === 'complete' ? 'text-green-600' :
                      stage.status === 'processing' ? 'text-foreground' :
                      stage.status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                  {stage.status === 'processing' && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Processing
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI Tips */}
          {variant === 'default' && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">AI Tip</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Our AI is analyzing your requirements and generating optimal code structure, API endpoints, and database schemas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2. `CodeGenerationLoader` - Code-Specific Loading Animation
Animated loading state that shows code being generated.

```tsx
// src/components/shared/CodeGenerationLoader.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Code2, Terminal, Database, Zap } from 'lucide-react'

interface CodeGenerationLoaderProps {
  currentFile?: string
  totalFiles?: number
  generatedFiles?: number
}

export function CodeGenerationLoader({
  currentFile = 'Initializing...',
  totalFiles = 0,
  generatedFiles = 0
}: CodeGenerationLoaderProps) {
  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardContent className="p-6 space-y-4">
        {/* Animated Code Blocks */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">// Generating API structure</span>
          </div>
          <div className="pl-5 space-y-1 text-muted-foreground/70">
            <div className="animate-pulse">→ Creating routes...</div>
            <div className="animate-pulse delay-100">→ Setting up middleware...</div>
            <div className="animate-pulse delay-200">→ Configuring controllers...</div>
          </div>
        </div>

        {/* Current File Indicator */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Current File</p>
              <p className="text-sm font-mono truncate">{currentFile}</p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {generatedFiles} / {totalFiles} files
            </span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Zap className="h-3 w-3 animate-pulse" />
            <span>AI Processing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3. `NeuralNetworkLoader` - Visual AI Processing Animation
Animated neural network visualization for AI processing states.

```tsx
// src/components/shared/NeuralNetworkLoader.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Network } from 'lucide-react'

export function NeuralNetworkLoader({ message }: { message?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-8">
        <div className="relative h-48 flex items-center justify-center">
          {/* Animated neural network nodes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Network className="h-32 w-32 text-primary/20 animate-pulse" />
          </div>
          
          {/* Central brain icon */}
          <div className="relative z-10">
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Orbiting particles */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-primary animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  top: `${50 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                }}
              />
            ))}
          </div>
        </div>

        {message && (
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 4. `StreamingTextLoader` - Text Streaming Animation
Shows AI-generated text appearing character by character.

```tsx
// src/components/shared/StreamingTextLoader.tsx
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

interface StreamingTextLoaderProps {
  text: string
  speed?: number
}

export function StreamingTextLoader({ text, speed = 30 }: StreamingTextLoaderProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">AI Response</p>
            <p className="text-sm font-mono leading-relaxed">
              {displayText}
              {!isComplete && <span className="animate-pulse">▋</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Loading State Usage Examples

#### Initial Screen Loading
```tsx
// When user submits a prompt
<AILoadingState
  title="AI is building your backend..."
  message="Analyzing requirements and generating optimal code structure"
  stages={[
    { id: '1', label: 'Analyzing requirements', icon: <Cpu className="h-4 w-4" />, status: 'complete' },
    { id: '2', label: 'Designing API structure', icon: <Network className="h-4 w-4" />, status: 'processing' },
    { id: '3', label: 'Generating code', icon: <Code2 className="h-4 w-4" />, status: 'pending' },
    { id: '4', label: 'Setting up database', icon: <Database className="h-4 w-4" />, status: 'pending' },
  ]}
  progress={35}
  variant="default"
/>
```

#### Workspace Project Creation Loading
```tsx
<AILoadingState
  title="Creating your project..."
  stages={[
    { id: '1', label: 'Initializing project', icon: <FolderOpen className="h-4 w-4" />, status: 'complete' },
    { id: '2', label: 'Generating files', icon: <FileCode className="h-4 w-4" />, status: 'processing' },
    { id: '3', label: 'Setting up dependencies', icon: <Package className="h-4 w-4" />, status: 'pending' },
    { id: '4', label: 'Finalizing setup', icon: <CheckCircle2 className="h-4 w-4" />, status: 'pending' },
  ]}
  progress={50}
  variant="compact"
/>
```

#### File Generation Loading
```tsx
<CodeGenerationLoader
  currentFile="src/api/routes/users.ts"
  totalFiles={12}
  generatedFiles={5}
/>
```

#### AI Chat/Assistant Loading
```tsx
<NeuralNetworkLoader message="AI is thinking about your request..." />
```

#### Streaming AI Response
```tsx
<StreamingTextLoader
  text="I'll help you create a RESTful API with user authentication, CRUD operations, and proper error handling..."
  speed={20}
/>
```

### Animation Utilities

#### Add to `src/lib/animations.ts`
```typescript
export const animations = {
  // Fade in animation
  fadeIn: 'animate-in fade-in duration-300',
  
  // Slide in from bottom
  slideInBottom: 'animate-in slide-in-from-bottom duration-300',
  
  // Scale in
  scaleIn: 'animate-in zoom-in duration-200',
  
  // Pulse
  pulse: 'animate-pulse',
  
  // Spin
  spin: 'animate-spin',
  
  // Bounce
  bounce: 'animate-bounce',
}

export const transitions = {
  // Smooth transition
  smooth: 'transition-all duration-300 ease-in-out',
  
  // Fast transition
  fast: 'transition-all duration-150 ease-out',
  
  // Slow transition
  slow: 'transition-all duration-500 ease-in-out',
}
```

---

## Available shadcn/ui Components

Based on the project configuration, the following components are available:

### Core Components
- `Button` (variants: default, destructive, outline, secondary, ghost, link)
- `Input` - Form input with focus states
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge` (variants: default, secondary, destructive, outline, ghost, link)
- `Separator` - Horizontal/vertical dividers
- `Avatar` - User avatars
- `Dialog`, `Sheet` - Modal and drawer components
- `DropdownMenu` - Context menus
- `Tooltip` - Hover tooltips
- `Skeleton` - Loading states

### Navigation Components
- `Sidebar`, `SidebarProvider`, `SidebarTrigger` - Collapsible sidebar system
- `Breadcrumb` - Navigation breadcrumbs

### Form Components
- `Field`, `Label` - Form field wrappers
- `Textarea` - Multi-line input
- `Select` - Dropdown select
- `Checkbox`, `Switch`, `RadioGroup` - Form controls

### Feedback Components
- `Alert` - Informational alerts
- `Toast` (via sonner) - Notifications
- `Progress` - Progress indicators

---

## Screen-by-Screen Redesign Plan

### 1. Initial Screen (`InitialScreen.tsx`)

#### Current State Analysis
- Uses gradient backgrounds (blue-100 to amber-50)
- Custom styling not using shadcn design tokens
- Basic textarea with custom styling
- Quick prompt buttons with emoji icons

#### Proposed Enhancements

##### 1.1 Header Section
**Changes:**
- Replace custom header with shadcn `Card` or clean div with design tokens
- Use `Badge` for authentication status indicator
- Add `Avatar` component for user profile when authenticated
- Implement `DropdownMenu` for user actions

```tsx
// New header structure
<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container flex h-14 items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-semibold">Mockline</span>
    </div>
    <nav className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('dashboard')}>
            Dashboard
          </Button>
          <UserMenu currentPage="home" onNavigate={handleNavigate} onLogout={logout} />
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={() => router.push('/auth/login')}>
          Sign In
        </Button>
      )}
    </nav>
  </div>
</header>
```

##### 1.2 Hero Section
**Changes:**
- Replace gradient background with clean `background` design token
- Use `Card` component for the main input area
- Add `Textarea` component with proper styling
- Implement `Badge` for quick prompt categories

```tsx
// New hero structure
<main className="flex-1 flex items-center justify-center p-6">
  <div className="w-full max-w-3xl space-y-8">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Turn your ideas into{' '}
        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Beautiful APIs
        </span>
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
        Describe your backend idea and let AI generate production-ready code in seconds.
      </p>
    </div>

    <Card className="p-6">
      <form onSubmit={handleCustomPrompt} className="space-y-4">
        <Textarea
          name="prompt"
          placeholder="Describe your app idea... (e.g., 'Build a travel booking API with user authentication')"
          className="min-h-[120px] resize-none"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((item, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handlePromptClick(item.label)}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Badge>
            ))}
          </div>
          <Button type="submit" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  </div>
</main>
```

##### 1.3 Loading State
**Changes:**
- Use `AILoadingState` component for AI-themed loading
- Add `NeuralNetworkLoader` for visual AI processing feedback
- Implement `StreamingTextLoader` for AI response streaming

```tsx
// New loading state with AI-themed animation
<AILoadingState
  title="Initializing AI Backend Builder..."
  message="Setting up your development environment"
  stages={[
    { id: '1', label: 'Loading AI models', icon: <Cpu className="h-4 w-4" />, status: 'complete' },
    { id: '2', label: 'Connecting to workspace', icon: <Network className="h-4 w-4" />, status: 'processing' },
    { id: '3', label: 'Ready to build', icon: <Sparkles className="h-4 w-4" />, status: 'pending' },
  ]}
  progress={65}
  variant="default"
/>
```

**Alternative: Neural Network Visualization**
```tsx
<NeuralNetworkLoader message="AI is preparing your workspace..." />
```

---

### 2. Dashboard (`Dashboard.tsx`)

#### Current State Analysis
- Uses gradient backgrounds similar to InitialScreen
- Custom stat cards with inconsistent styling
- Project list with custom buttons and icons
- Basic search and filter inputs

#### Proposed Enhancements

##### 2.1 Header Section
**Changes:**
- Consistent header with InitialScreen
- Add `Button` with `icon` variant for actions
- Use `Separator` for visual separation

```tsx
// New header structure
<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container flex h-14 items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-semibold">Mockline</span>
      <Separator orientation="vertical" className="mx-2 h-4" />
      <span className="text-sm text-muted-foreground">Dashboard</span>
    </div>
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateProject}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>
      <UserMenu currentPage="dashboard" onNavigate={handleNavigate} onLogout={logout} />
    </div>
  </div>
</header>
```

##### 2.2 Stats Section
**Changes:**
- Use `Card` components for each stat
- Add `Badge` for trend indicators
- Implement `Skeleton` for loading states

```tsx
// New stats structure
<div className="grid gap-4 md:grid-cols-3">
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
        <p className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.total}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <FolderOpen className="h-5 w-5 text-primary" />
      </div>
    </div>
  </Card>

  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Ready Projects</p>
        <p className="text-3xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.ready}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="h-5 w-5 text-green-600" />
      </div>
    </div>
  </Card>

  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">This Week</p>
        <p className="text-3xl font-bold">
          {loading ? <Skeleton className="h-8 w-16" /> : thisWeekCount}
        </p>
        <Badge variant="secondary" className="text-xs">
          <TrendingUp className="mr-1 h-3 w-3" />
          new projects
        </Badge>
      </div>
      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
        <TrendingUp className="h-5 w-5 text-purple-600" />
      </div>
    </div>
  </Card>
</div>
```

##### 2.3 Quick Actions Section
**Changes:**
- Use `Card` components with hover effects
- Add `Button` with proper variants

```tsx
// New quick actions structure
<div className="space-y-4">
  <h2 className="text-lg font-semibold">Quick Actions</h2>
  <div className="grid gap-4 md:grid-cols-2">
    <Card className="group cursor-pointer transition-all hover:shadow-md" onClick={handleCreateProject}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Create New Project</p>
              <p className="text-sm text-muted-foreground">Start building with AI</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>

    <Card className="group cursor-pointer transition-all hover:shadow-md" onClick={() => setShowAllProjects(true)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">View All Projects</p>
              <p className="text-sm text-muted-foreground">Browse your collection</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

##### 2.4 Projects List Section
**Changes:**
- Use `Card` for each project item
- Add `Badge` for status indicators
- Implement `Input` for search with `Search` icon
- Use `Select` for filtering

```tsx
// New projects list structure
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">
      {showAllProjects ? 'All Projects' : 'Recent Projects'}
    </h2>
    {!showAllProjects && (
      <Button variant="ghost" size="sm" onClick={() => setShowAllProjects(true)}>
        View all
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    )}
  </div>

  {showAllProjects && (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="ready">Ready</SelectItem>
          <SelectItem value="generating">Generating</SelectItem>
          <SelectItem value="error">Error</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}

  <div className="space-y-2">
    {loading ? (
      // Skeleton loading state
      Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </Card>
      ))
    ) : displayedProjects.length === 0 ? (
      // Empty state
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">No projects found</p>
            <Button variant="outline" size="sm" onClick={handleCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </div>
        </div>
      </Card>
    ) : (
      // Project cards
      displayedProjects.map((project) => (
        <Card
          key={project._id}
          className="group cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleProjectClick(project._id)}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{project.name}</p>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatTimeAgo(project.updatedAt)}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="capitalize">{project.framework}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => handleDeleteProject(e, project._id, project.name)}
                  disabled={deletingProjectId === project._id}
                >
                  {deletingProjectId === project._id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>
</div>
```

---

### 3. Workspace (`Workspace.tsx`)

#### Current State Analysis
- Complex IDE-like layout with custom panels
- Custom tab switching for Files/AI/Versions
- Basic status bar
- Floating terminal toggle button

#### Proposed Enhancements

##### 3.1 Top Bar (Header)
**Changes:**
- Use `Breadcrumb` for navigation
- Add `Tabs` for view switching (Code/API Testing)
- Implement `Button` with proper variants
- Add `Avatar` for user profile

```tsx
// New top bar structure
<header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="flex h-12 items-center justify-between px-4">
    {/* Breadcrumb Navigation */}
    <nav className="flex items-center gap-2 text-sm">
      <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
        Dashboard
      </Button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium truncate max-w-[200px]">{projectName}</span>
      {selectedFile && activeView === 'code' && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold truncate max-w-[150px]">{selectedFile}</span>
        </>
      )}
    </nav>

    {/* View Toggle Tabs */}
    <div className="absolute left-1/2 -translate-x-1/2">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'code' | 'api')}>
        <TabsList variant="line">
          <TabsTrigger value="code">
            <Code2 className="mr-2 h-3.5 w-3.5" />
            Code
          </TabsTrigger>
          <TabsTrigger value="api">
            <TestTube2 className="mr-2 h-3.5 w-3.5" />
            API Testing
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={!currentProjectId || files.length === 0}
      >
        <Download className="mr-2 h-3 w-3" />
        Download
      </Button>
      <UserMenu currentPage="workspace" onNavigate={handleNavigate} onLogout={logout} />
    </div>
  </div>
</header>
```

##### 3.2 Left Sidebar
**Changes:**
- Use `Tabs` for sidebar view switching
- Implement `Separator` for visual separation
- Add `Badge` for file counts or status

```tsx
// New left sidebar structure
<aside className="w-64 border-r bg-background flex flex-col">
  {/* Sidebar Tabs */}
  <div className="border-b">
    <Tabs value={sidebarView} onValueChange={(v) => setSidebarView(v as 'files' | 'ai' | 'versions')}>
      <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0 h-10">
        <TabsTrigger value="files" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
          <FolderTree className="mr-2 h-3.5 w-3.5" />
          Files
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
          <Bot className="mr-2 h-3.5 w-3.5" />
          Mocky
        </TabsTrigger>
        <TabsTrigger value="versions" className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
          <History className="mr-2 h-3.5 w-3.5" />
          Versions
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>

  {/* Sidebar Content */}
  <div className="flex-1 overflow-auto">
    {sidebarView === 'files' ? (
      <div className="p-3 space-y-1">
        {fileTree.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-muted-foreground">Files</span>
              <Badge variant="secondary" className="text-xs">{files.length}</Badge>
            </div>
            <FileTree
              data={fileTree}
              onFileClick={handleFileSelect}
              selectedFile={selectedFile}
            />
          </>
        ) : (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">No files generated yet</p>
                <p className="text-xs text-muted-foreground">Use Mocky to generate code</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    ) : sidebarView === 'ai' ? (
      <AiAgent
        projectId={currentProjectId as string}
        files={files}
        selectedFile={selectedFile}
        selectedFileContent={editorContent}
      />
    ) : (
      <Card className="m-3 p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <History className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">No snapshots yet</p>
            <p className="text-xs text-muted-foreground">Versions will appear here</p>
          </div>
        </div>
      </Card>
    )}
  </div>
</aside>
```

##### 3.3 Main Content Area
**Changes:**
- Use `Card` for editor container
- Add `Badge` for unsaved changes indicator
- Implement `Button` with proper variants for actions

```tsx
// New main content structure
<main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
  {activeView === 'code' ? (
    <>
      {/* File Tab Bar */}
      <div className="border-b bg-background px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedFile}</span>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                ● Unsaved
              </Badge>
            )}
            {isSaving && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          <Button
            size="sm"
            onClick={handleRunBackend}
            disabled={isRunning || !editorContent}
          >
            <Play className="mr-2 h-3 w-3" />
            {isRunning ? 'Running...' : 'Run Backend'}
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-auto bg-background">
        {loadingContent ? (
          <div className="flex h-full items-center justify-center">
            <CodeGenerationLoader
              currentFile={selectedFile}
              totalFiles={files.length}
              generatedFiles={files.length}
            />
          </div>
        ) : selectedFileContent ? (
          <MonacoEditor
            value={editorContent}
            fileName={selectedFile}
            onChange={handleContentChange}
            readOnly={false}
            height="100%"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Card className="p-8 text-center space-y-4">
              <Code2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Select a file to view its content</p>
            </Card>
          </div>
        )}
      </div>
    </>
  ) : (
    <TestPanel projectId={currentProjectId as string} />
  )}
</main>
```

##### 3.4 Terminal Panel
**Changes:**
- Use `Card` for terminal container
- Add `Button` with icon variant for toggle
- Implement `Badge` for terminal status

```tsx
// New terminal panel structure
{isTerminalOpen && (
  <div className="border-t bg-background">
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <div className="flex items-center gap-2">
        <TerminalIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Terminal</span>
        <Badge variant="outline" className="text-xs">Connected</Badge>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsTerminalOpen(false)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
    <Terminal
      variant="panel"
      isOpen={true}
      onClose={() => setIsTerminalOpen(false)}
      projectId={currentProjectId as string}
    />
  </div>
)}

{/* Terminal Toggle Button */}
<Button
  onClick={() => setIsTerminalOpen(prev => !prev)}
  variant="default"
  size="sm"
  className="fixed bottom-4 right-4 shadow-lg z-40"
>
  <TerminalIcon className="mr-2 h-4 w-4" />
  {isTerminalOpen ? 'Hide Terminal' : 'Terminal'}
</Button>
```

##### 3.5 Status Bar
**Changes:**
- Use `Badge` for status indicators
- Add `Separator` for visual separation
- Implement proper spacing with design tokens

```tsx
// New status bar structure
<footer className="border-t bg-muted/50 px-3 py-1.5">
  <div className="flex items-center justify-between text-xs text-muted-foreground">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          project?.status === 'ready' ? 'bg-green-500' :
          project?.status === 'generating' ? 'bg-blue-500 animate-pulse' :
          project?.status === 'error' ? 'bg-red-500' : 'bg-muted-foreground'
        }`} />
        <span className="capitalize">{project?.status ?? 'no project'}</span>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span>Model:</span>
        <Badge variant="outline" className="text-xs">{defaultAiModel}</Badge>
      </div>
      <Separator orientation="vertical" className="h-3" />
      <span>{files.length} files</span>
      {hasUnsavedChanges && (
        <>
          <Separator orientation="vertical" className="h-3" />
          <Badge variant="secondary" className="text-xs">● Unsaved</Badge>
        </>
      )}
    </div>
  </div>
</footer>
```

---

## Component Library Additions

### New Components to Create

#### 1. `ProjectCard` Component
A reusable card component for displaying projects in the dashboard.

```tsx
// src/components/dashboard/ProjectCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Trash2 } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  isDeleting: boolean
}

export function ProjectCard({ project, onClick, onDelete, isDeleting }: ProjectCardProps) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium">{project.name}</p>
              <Badge variant={getStatusBadgeVariant(project.status)}>
                {getStatusIcon(project.status)}
                <span className="ml-1 capitalize">{project.status}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTimeAgo(project.updatedAt)}</span>
              <span>•</span>
              <span className="capitalize">{project.framework}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 2. `StatCard` Component
A reusable card component for displaying statistics.

```tsx
// src/components/dashboard/StatCard.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
  loading?: boolean
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  badge,
  badgeVariant = 'secondary',
  loading = false
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          {badge && (
            <Badge variant={badgeVariant} className="text-xs mt-1">
              {badge}
            </Badge>
          )}
        </div>
        <div className={`h-10 w-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </Card>
  )
}
```

#### 3. `EmptyState` Component
A reusable empty state component.

```tsx
// src/components/shared/EmptyState.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          {actionLabel && onAction && (
            <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
```

---

## Design Tokens & CSS Variables

The project uses the following design tokens from shadcn/ui:

### Color System (Zinc)
```css
--background: oklch(1 0 0);
--foreground: oklch(0.141 0.005 285.823);
--card: oklch(1 0 0);
--card-foreground: oklch(0.141 0.005 285.823);
--primary: oklch(0.21 0.006 285.885);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.967 0.001 286.375);
--secondary-foreground: oklch(0.21 0.006 285.885);
--muted: oklch(0.967 0.001 286.375);
--muted-foreground: oklch(0.552 0.016 285.938);
--accent: oklch(0.967 0.001 286.375);
--accent-foreground: oklch(0.21 0.006 285.885);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.92 0.004 286.32);
--input: oklch(0.92 0.004 286.32);
--ring: oklch(0.705 0.015 286.067);
```

### Spacing
```css
--radius: 0.625rem;
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
--radius-2xl: calc(var(--radius) + 8px);
```

---

## Stunning Visual Enhancements

### Gradient Accents & AI-Themed Visuals
Add subtle gradient accents throughout the interface to create a modern, AI-focused aesthetic:

```tsx
// Gradient text for headings
<h1 className="text-4xl font-bold">
  <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
    AI-Powered Backend Builder
  </span>
</h1>

// Gradient borders
<div className="relative rounded-lg">
  <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-lg blur-sm opacity-50" />
  <div className="relative bg-background rounded-lg p-6">
    Content here
  </div>
</div>

// Gradient buttons
<Button className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
  <Sparkles className="mr-2 h-4 w-4" />
  Generate with AI
</Button>
```

### Particle Background Effects
Add subtle particle animations to create depth and visual interest:

```tsx
// src/components/shared/ParticleBackground.tsx
export function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary/30 animate-pulse"
          style={{
            animationDelay: `${i * 0.5}s`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
```

### Glassmorphism Effects
Use glassmorphism for overlays and modals:

```tsx
// Glass card effect
<Card className="backdrop-blur-xl bg-white/80 border-white/50 shadow-lg">
  <CardContent>
    Content
  </CardContent>
</Card>

// Glass header
<header className="backdrop-blur-xl bg-white/80 border-b border-white/50 sticky top-0 z-50">
  Navigation
</header>
```

### Micro-Interactions
Add delightful micro-interactions for better UX:

```tsx
// Button with ripple effect
<Button className="group relative overflow-hidden">
  <span className="relative z-10">Click me</span>
  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
</Button>

// Card hover lift
<Card className="group hover:-translate-y-1 transition-transform duration-300">
  <CardContent>
    Content
  </CardContent>
</Card>

// Icon animations
<Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
```

### Animated Progress Indicators
Create engaging progress animations:

```tsx
// src/components/shared/AnimatedProgress.tsx
export function AnimatedProgress({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100
  
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  )
}
```

### Typing Animation for AI Responses
Show AI responses as if they're being typed in real-time:

```tsx
// src/components/shared/TypingAnimation.tsx
export function TypingAnimation({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <p className="font-mono text-sm">
      {displayText}
      {!isComplete && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
    </p>
  )
}
```

### Success Animations
Celebrate successful actions with delightful animations:

```tsx
// src/components/shared/SuccessAnimation.tsx
export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
        <CheckCircle2 className="relative h-16 w-16 text-green-600 animate-in zoom-in duration-300" />
      </div>
    </div>
  )
}
```

### AI Assistant Avatar
Create an animated AI assistant avatar for the Mocky panel:

```tsx
// src/components/shared/AIAvatar.tsx
export function AIAvatar({ size = 'md', state = 'idle' }: { size?: 'sm' | 'md' | 'lg'; state?: 'idle' | 'thinking' | 'speaking' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center`}>
      {state === 'thinking' && (
        <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
      )}
      {state === 'speaking' && (
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
      )}
      <Bot className="h-1/2 w-1/2 text-white" />
      {state === 'thinking' && (
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 animate-bounce" />
      )}
    </div>
  )
}
```

---

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. Create AI-themed loading components (AILoadingState, NeuralNetworkLoader, CodeGenerationLoader, StreamingTextLoader)
2. Update InitialScreen component with new loading states
3. Create reusable components (ProjectCard, StatCard, EmptyState)
4. Update Dashboard component

### Phase 2: Workspace (Medium Priority)
5. Update Workspace component
6. Refactor sidebar using shadcn components
7. Update terminal panel styling
8. Add AI assistant avatar to Mocky panel

### Phase 3: Visual Polish (Low Priority)
9. Add particle background effects
10. Implement glassmorphism effects
11. Add micro-interactions and animations
12. Add typing animation for AI responses
13. Add success animations
14. Implement animated progress indicators
15. Accessibility audit and improvements

---

## Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements must be keyboard accessible
2. **Focus States**: Use shadcn's built-in focus ring styles
3. **ARIA Labels**: Add proper ARIA labels for icon-only buttons
4. **Color Contrast**: Ensure text meets WCAG AA contrast ratios
5. **Screen Reader Support**: Use semantic HTML and proper heading hierarchy
6. **Reduced Motion**: Respect `prefers-reduced-motion` media query

---

## Testing Checklist

- [ ] Visual regression testing for all three screens
- [ ] Keyboard navigation testing
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] Mobile responsiveness testing
- [ ] Dark mode compatibility
- [ ] Loading states verification
- [ ] Error states verification
- [ ] Performance testing (Lighthouse score)

---

## Migration Notes

### Breaking Changes
- Custom gradient backgrounds will be replaced with design tokens
- Custom button styles will use shadcn variants
- Custom card styles will use shadcn Card component

### Non-Breaking Changes
- Component props will remain the same
- Functionality will be preserved
- Data flow will remain unchanged

---

## Success Criteria

1. All three screens use shadcn/ui components consistently
2. Design tokens are used throughout (no hardcoded colors)
3. Responsive design works on all breakpoints
4. Accessibility score meets WCAG AA standards
5. Performance score remains above 90 on Lighthouse
6. Code is maintainable and follows React best practices
