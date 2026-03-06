'use client'

import Header from '@/components/custom/Header';
import { Button } from '@/components/ui/button';
import { useAIProjects } from '@/hooks/useAIProjects';
import type { Project } from '@/services/api/projects';
import { projectsService } from '@/services/api/projects';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  FolderOpen,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UserData } from '../auth/types';

interface DashboardProps {
  currentUser: UserData
  initialProjects?: Project[]
}

export function Dashboard({currentUser, initialProjects = [] }: DashboardProps) {
  const { projects, loading, getProjectStats, getRecentProjects } = useAIProjects(initialProjects);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  
  const handleCreateProject = () => {
    router.push('/');
  };

  const handleNavigate = (page: 'dashboard' | 'workspace' | 'initial') => {
    router.push(page === 'dashboard' ? '/dashboard' : '/workspace');
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = currentUser ? currentUser.firstName || 'User' : 'User';
  
  const stats = getProjectStats();
  const recentProjects = getRecentProjects(3);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedProjects = showAllProjects ? filteredProjects : recentProjects;

  const formatTimeAgo = (timestamp: number) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/workspace?projectId=${projectId}`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    setDeletingProjectId(projectId);
    try {
  
      const project = await projectsService.get(projectId);
      if (!currentUser || project.userId !== currentUser.feathersId) {
        toast.error('You do not have permission to delete this project');
        return;
      }

      await projectsService.remove(projectId);
      toast.success(`Deleted: ${projectName}`);
  
      router.refresh();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
     <Header currentUser={currentUser} currentPage="dashboard" onNavigateClick={() => router.push('/')} />
      <div className="animate-element animate-delay-300 max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {greeting}, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-foreground">{loading ? '...' : stats.total}</p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ready Projects</p>
              <p className="text-3xl font-bold text-foreground">{loading ? '...' : stats.ready}</p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-3xl font-bold text-foreground">
                {projects.filter(p => {
                  const oneWeekAgo = new Date();
                  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                  return new Date(p.createdAt) >= oneWeekAgo;
                }).length}
              </p>
              <p className="text-xs text-primary mt-1">new projects</p>
            </div>
          </div>
        </div>

        <div className="animate-element animate-delay-500 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateProject}
              className="group bg-primary hover:bg-primary/90 rounded-xl p-6 text-left transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground font-medium mb-1">Create New Project</p>
                  <p className="text-primary-foreground/70 text-sm">Start building with AI</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setShowAllProjects(true)}
              className="group bg-card/80 backdrop-blur-sm hover:bg-card border border-border rounded-xl p-6 text-left transition-all flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium mb-1">View All Projects</p>
                  <p className="text-muted-foreground text-sm">Browse your collection</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        <div className="animate-element animate-delay-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {showAllProjects ? 'All Projects' : 'Recent Projects'}
            </h2>
            {!showAllProjects && (
              <button
                onClick={() => setShowAllProjects(true)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {showAllProjects && (
              <button
                onClick={() => setShowAllProjects(false)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Show recent
              </button>
            )}
          </div>

          {showAllProjects && (
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="ready">Ready</option>
                <option value="generating">Generating</option>
                <option value="error">Error</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : displayedProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No projects found</p>
                <Button onClick={handleCreateProject} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first project
                </Button>
              </div>
            ) : (
              displayedProjects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => handleProjectClick(project._id)}
                  className="group bg-card/80 backdrop-blur-sm hover:bg-card border border-border rounded-xl p-5 text-left transition-all shadow-sm relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{project.name}</p>
                        {getStatusIcon(project.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground/70">{formatTimeAgo(project.updatedAt)}</p>
                        <span className="text-xs text-muted-foreground/70">•</span>
                        <p className="text-xs text-muted-foreground/70 capitalize">{project.framework}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Button
                        onClick={(e) => handleDeleteProject(e, project._id, project.name)}
                        disabled={deletingProjectId === project._id}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingProjectId === project._id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-foreground" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
