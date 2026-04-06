'use client';

import { GenerationProgress, Project } from '@/types/feathers';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowLeft, CheckCircle2, Code2, Cpu, FileCode2, Layers, RotateCcw, Sparkles, Zap, Clock, Terminal, Database, GitBranch, Activity } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface ProjectCreationLoaderProps {
    status: 'idle' | 'creating' | 'generating' | 'validating' | 'ready' | 'running' | 'error';
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
    onRetry?: () => void;
    onBackToDashboard?: () => void;
    onCancel?: () => void;
    onViewArchitecture?: () => void;
    onViewFiles?: () => void;
}

// Enhanced stage definitions with detailed descriptions
const STAGES = [
    { 
        icon: Cpu, 
        label: 'Analyzing prompt', 
        key: 'analyzing',
        description: 'Understanding requirements and planning architecture',
        estimatedTime: '5-10s'
    },
    { 
        icon: Layers, 
        label: 'Planning architecture', 
        key: 'planning',
        description: 'Designing system structure and dependencies',
        estimatedTime: '10-15s'
    },
    { 
        icon: FileCode2, 
        label: 'Generating files', 
        key: 'generating',
        description: 'Creating project files and code',
        estimatedTime: '20-40s'
    },
    { 
        icon: Code2, 
        label: 'Validating code', 
        key: 'validating',
        description: 'Checking code quality and consistency',
        estimatedTime: '5-10s'
    },
    { 
        icon: Zap, 
        label: 'Finalizing project', 
        key: 'finalizing',
        description: 'Completing setup and preparing workspace',
        estimatedTime: '5-10s'
    }
];

// Context-aware status messages inspired by Claude Code
const CONTEXT_MESSAGES = {
    analyzing: [
        'Parsing your requirements...',
        'Identifying key components...',
        'Mapping out dependencies...',
        'Understanding project scope...'
    ],
    planning: [
        'Designing system architecture...',
        'Planning data models...',
        'Defining API structure...',
        'Setting up project structure...'
    ],
    generating: [
        'Creating configuration files...',
        'Generating models and services...',
        'Building API endpoints...',
        'Writing database schemas...'
    ],
    validating: [
        'Checking code consistency...',
        'Validating imports...',
        'Running quality checks...',
        'Ensuring best practices...'
    ],
    finalizing: [
        'Finalizing project setup...',
        'Preparing workspace...',
        'Optimizing configuration...',
        'Almost ready...'
    ]
};

// Tech stack indicators for visual interest
const TECH_STACK = [
    'FastAPI', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'SQLAlchemy', 'Pydantic', 'JWT'
];

// Enhanced skeleton shimmer with smoother animation
function SkeletonShimmer({ className }: { className?: string }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div 
            className={`relative overflow-hidden ${className}`} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {!prefersReducedMotion && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </motion.div>
    );
}

// Improved file skeleton with better visual feedback
function FileSkeleton({ index, delay = 0 }: { index: number; delay?: number }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay: delay + index * 0.06, 
                duration: prefersReducedMotion ? 0 : 0.35,
                ease: [0.22, 1, 0.36, 1]
            }}
            className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg hover:bg-white/[0.04] transition-colors"
        >
            <SkeletonShimmer className="w-8 h-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
                <SkeletonShimmer className="h-2.5 w-3/4 rounded" />
                <SkeletonShimmer className="h-1.5 w-1/2 rounded" />
            </div>
            <SkeletonShimmer className="w-6 h-6 rounded" />
        </motion.div>
    );
}

// Optimized floating particles with better performance
function FloatingParticle({ index }: { index: number }) {
    const prefersReducedMotion = useReducedMotion();

    const particleProps = useMemo(() => {
        const seed = index * 123.456;
        const random = (n: number) => {
            const x = Math.sin(seed + n) * 10000;
            return x - Math.floor(x);
        };
        
        return {
            size: random(1) * 2.5 + 0.8,
            x: random(2) * 100,
            duration: random(3) * 10 + 8,
            delay: random(4) * 3,
            opacity: random(5) * 0.3 + 0.08
        };
    }, [index]);

    return (
        <motion.div
            className="absolute rounded-full bg-violet-400/60"
            style={{
                width: particleProps.size,
                height: particleProps.size,
                left: `${particleProps.x}%`,
                bottom: '-4px',
                opacity: particleProps.opacity
            }}
            animate={prefersReducedMotion 
                ? { y: -80, opacity: 0 } 
                : { y: [0, -600], opacity: [particleProps.opacity, 0] }
            }
            transition={{ 
                duration: prefersReducedMotion ? 1.5 : particleProps.duration, 
                delay: particleProps.delay, 
                repeat: Infinity, 
                ease: 'linear' 
            }}
        />
    );
}

// Enhanced code stream with better visual presentation
function CodeStream() {
    const [lines, setLines] = useState<string[]>([]);
    const frameRef = useRef<NodeJS.Timeout | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const codeSnippets = [
            'from fastapi import FastAPI, HTTPException',
            'from sqlalchemy import create_engine',
            'app = FastAPI(title="Generated API")',
            '@router.get("/users/{id}")',
            'async def get_user(id: int, db: Session):',
            'class UserModel(BaseModel):',
            '    email: EmailStr',
            '    hashed_password: str',
            'def verify_token(token: str) -> dict:',
            '    return jwt.decode(token, SECRET_KEY)',
            'engine = create_engine(DATABASE_URL)',
            'SessionLocal = sessionmaker(bind=engine)',
            'CORS(app, origins=["*"])',
            '@app.on_event("startup")',
            'async def startup_event():',
            '    await database.connect()',
            'class AuthService:',
            '    async def login(self, body: LoginDto):'
        ];

        const addLine = () => {
            const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            setLines((prev) => {
                const sliced = prev.slice(-10);
                const filtered = sliced.filter((line): line is string => line !== undefined);
                return [...filtered, snippet];
            });
            frameRef.current = setTimeout(addLine, Math.random() * 500 + 150);
        };

        frameRef.current = setTimeout(addLine, 200);
        return () => {
            if (frameRef.current) clearTimeout(frameRef.current);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden opacity-[0.06] pointer-events-none select-none">
            <div className="font-mono text-[10px] leading-5 text-violet-300 p-6 space-y-0.5">
                {lines.map((line, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -8 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                        className="truncate"
                    >
                        {line}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// Context-aware message bubble
function ContextMessage({ stage }: { stage: string }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const messages = CONTEXT_MESSAGES[stage as keyof typeof CONTEXT_MESSAGES] || ['Processing...'];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [messages]);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={messageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="inline-block text-[11px] text-white/50 font-medium"
            >
                {messages[messageIndex]}
            </motion.span>
        </AnimatePresence>
    );
}

// Enhanced circular progress with better visual feedback
function CircularProgress({ percentage, size = 72, strokeWidth = 5 }: { percentage: number; size?: number; strokeWidth?: number }) {
    const prefersReducedMotion = useReducedMotion();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle 
                    cx={size / 2} 
                    cy={size / 2} 
                    r={radius} 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeWidth={strokeWidth} 
                    fill="none" 
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                    style={{ strokeDasharray: circumference }}
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="50%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span 
                    className="text-[15px] font-bold text-white" 
                    animate={prefersReducedMotion ? {} : { scale: [1, 1.03, 1] }} 
                    transition={{ duration: 0.25 }}
                >
                    {Math.round(percentage)}%
                </motion.span>
            </div>
        </div>
    );
}

// Smooth pulse ring effect
function PulseRing({ active, color = 'violet' }: { active: boolean; color?: 'violet' | 'green' | 'red' }) {
    const prefersReducedMotion = useReducedMotion();

    if (!active) return null;

    const colors = {
        violet: 'border-violet-400/30',
        green: 'border-green-400/30',
        red: 'border-red-400/30'
    };

    return (
        <motion.div
            className={`absolute inset-0 rounded-full border-2 ${colors[color]}`}
            animate={
                prefersReducedMotion
                    ? { scale: 1, opacity: 0.4 }
                    : {
                          scale: [1, 1.4],
                          opacity: [0.4, 0]
                      }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 1.8, repeat: Infinity }}
        />
    );
}

// Staggered animation wrapper with better timing
function StaggeredChildren({ children, delay = 0.05 }: { children: React.ReactNode; delay?: number }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <>
            {React.Children.map(children, (child, i) => (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: i * delay,
                        duration: prefersReducedMotion ? 0 : 0.3,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </>
    );
}

// Time estimation display
function TimeEstimate({ stageIndex, isActive }: { stageIndex: number; isActive: boolean }) {
    if (!isActive || stageIndex >= STAGES.length) return null;
    
    const stage = STAGES[stageIndex];
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-[10px] text-white/30"
        >
            <Clock className="w-3 h-3" />
            <span>{stage.estimatedTime}</span>
        </motion.div>
    );
}

// Main Project Creation Loader Component
export function ProjectCreationLoader({ 
    status, 
    project, 
    progress, 
    error, 
    onRetry, 
    onBackToDashboard, 
    onCancel, 
    onViewArchitecture, 
    onViewFiles 
}: ProjectCreationLoaderProps) {
    const isActive = status === 'creating' || status === 'generating' || status === 'validating';
    const isError = status === 'error';
    const isReady = status === 'ready';
    const percentage = Math.min(100, Math.round(progress?.percentage || 0));
    const prefersReducedMotion = useReducedMotion();

    const activeStageIndex = Math.min(STAGES.length - 1, Math.floor((percentage / 100) * STAGES.length));
    const currentStage = STAGES[activeStageIndex];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background particles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <FloatingParticle key={i} index={i} />
                ))}
            </div>

            {/* Ambient glow effects */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] rounded-full bg-purple-800/6 blur-[70px] pointer-events-none" />

            {/* Active state glow */}
            <AnimatePresence>
                {isActive && !prefersReducedMotion && (
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-violet-500/4 blur-[80px] pointer-events-none"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.25, 0.4, 0.25]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    />
                )}
            </AnimatePresence>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Main card */}
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="relative w-full max-w-md"
            >
                {/* Border glow */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            className="absolute -inset-px rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, transparent 45%, transparent 55%, rgba(139,92,246,0.15) 100%)'
                            }}
                            animate={{
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </AnimatePresence>

                <div className="relative bg-[#0f0f1a] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Code stream background */}
                    {isActive && <CodeStream />}

                    <div className="p-7 relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-violet-600/15 border border-violet-500/25 flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-violet-400" />
                                    </div>
                                    <span className="text-[10px] font-medium text-violet-400 tracking-widest uppercase">Mockline AI</span>
                                </div>
                                <h1 className="text-[20px] font-semibold text-white tracking-tight">
                                    {isError ? 'Build failed' : isReady ? 'Ready to code' : 'Building your project'}
                                </h1>
                                {project?.name && (
                                    <p className="text-[12px] text-white/35 mt-1 font-mono truncate max-w-[280px]">
                                        {project.name.slice(0, 45)}
                                    </p>
                                )}
                            </div>

                            {/* Status indicator */}
                            <div className="relative">
                                <PulseRing active={isActive} color={isError ? 'red' : isReady ? 'green' : 'violet'} />
                                <div
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                                        isError
                                            ? 'bg-red-500/8 border-red-500/15 text-red-400'
                                            : isReady
                                              ? 'bg-green-500/8 border-green-500/15 text-green-400'
                                              : 'bg-violet-500/8 border-violet-500/15 text-violet-400'
                                    }`}
                                >
                                    {isActive && !prefersReducedMotion && (
                                        <motion.span
                                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                                            animate={{ opacity: [1, 0.3, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                    )}
                                    {isError && <AlertCircle className="w-3 h-3" />}
                                    {isReady && <CheckCircle2 className="w-3 h-3" />}
                                    {isActive ? 'Running' : isError ? 'Error' : isReady ? 'Complete' : 'Starting'}
                                </div>
                            </div>
                        </div>

                        {/* Progress section */}
                        {!isError && (
                            <div className="mb-5">
                                {/* Context-aware message */}
                                {isActive && (
                                    <div className="mb-3">
                                        <ContextMessage stage={currentStage.key} />
                                    </div>
                                )}

                                {/* Circular progress */}
                                <div className="flex justify-center mb-4">
                                    <CircularProgress percentage={percentage} size={72} strokeWidth={5} />
                                </div>

                                {/* Linear progress bar */}
                                <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden mb-3">
                                    <motion.div
                                        className="h-full rounded-full relative"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                                        style={{
                                            background: isReady 
                                                ? '#22c55e' 
                                                : 'linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #7c3aed 100%)',
                                            backgroundSize: '200% 100%'
                                        }}
                                    >
                                        {!prefersReducedMotion && isActive && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                            />
                                        )}
                                    </motion.div>
                                </div>

                                {/* Time estimate */}
                                <div className="flex items-center justify-between">
                                    <TimeEstimate stageIndex={activeStageIndex} isActive={isActive} />
                                    <span className="text-[11px] font-mono font-semibold text-white/60">{percentage}%</span>
                                </div>
                            </div>
                        )}

                        {/* Stage steps */}
                        {!isError && (
                            <div className="space-y-1.5 mb-5">
                                <StaggeredChildren delay={0.05}>
                                    {STAGES.map((stage, i) => {
                                        const StageIcon = stage.icon;
                                        const isDone = isReady || i < activeStageIndex;
                                        const isCurrentStage = !isReady && i === activeStageIndex && isActive;
                                        const isPending = !isReady && i > activeStageIndex;

                                        return (
                                            <motion.div
                                                key={stage.key}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                                                    isCurrentStage
                                                        ? 'bg-violet-500/8 border border-violet-500/15 shadow-lg shadow-violet-500/4'
                                                        : isDone
                                                          ? 'bg-white/[0.02]'
                                                          : 'opacity-25'
                                                }`}
                                                whileHover={isCurrentStage ? { scale: 1.01 } : {}}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 relative ${
                                                        isDone
                                                            ? 'bg-green-500/15 border border-green-500/20'
                                                            : isCurrentStage
                                                              ? 'bg-violet-500/15 border border-violet-500/20'
                                                              : 'bg-white/5 border border-white/10'
                                                    }`}
                                                >
                                                    {/* Pulse effect for current stage */}
                                                    {isCurrentStage && !prefersReducedMotion && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-md bg-violet-500/15"
                                                            animate={{
                                                                scale: [1, 1.25],
                                                                opacity: [0.4, 0]
                                                            }}
                                                            transition={{ duration: 1.8, repeat: Infinity }}
                                                        />
                                                    )}
                                                    {isDone ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                        </motion.div>
                                                    ) : isCurrentStage ? (
                                                        <motion.div
                                                            animate={!prefersReducedMotion ? { rotate: 360 } : {}}
                                                            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                                                        >
                                                            <StageIcon className="w-4 h-4 text-violet-400" />
                                                        </motion.div>
                                                    ) : (
                                                        <StageIcon className="w-4 h-4 text-white/30" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-[12px] font-medium transition-colors duration-300 ${
                                                                isDone ? 'text-white/50' : isCurrentStage ? 'text-white/90' : 'text-white/30'
                                                            }`}
                                                        >
                                                            {stage.label}
                                                        </span>
                                                        {isCurrentStage && !prefersReducedMotion && (
                                                            <div className="flex gap-0.5">
                                                                {[0, 1, 2].map((dot) => (
                                                                    <motion.span
                                                                        key={dot}
                                                                        className="w-1 h-1 rounded-full bg-violet-400"
                                                                        animate={{ opacity: [0.25, 1, 0.25] }}
                                                                        transition={{ duration: 0.9, delay: dot * 0.15, repeat: Infinity }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isCurrentStage && (
                                                        <p className="text-[10px] text-white/35 mt-0.5 truncate">
                                                            {stage.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </StaggeredChildren>
                            </div>
                        )}

                        {/* File skeleton preview */}
                        {isActive && (
                            <div className="mb-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5 text-white/40" />
                                        <span className="text-[11px] text-white/40 font-medium">Generating files...</span>
                                    </div>
                                    {progress && progress.totalFiles > 0 && (
                                        <span className="text-[11px] font-mono font-semibold text-white/60">
                                            {progress.filesGenerated} <span className="text-white/25">/</span> {progress.totalFiles}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <FileSkeleton key={i} index={i} />
                                    ))}
                                </div>
                                {progress?.currentStage && (
                                    <motion.p 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        className="text-[10px] text-white/25 font-mono mt-2 truncate flex items-center gap-1.5"
                                    >
                                        <Activity className="w-3 h-3" />
                                        {progress.currentStage.replace(/_/g, ' ')}
                                    </motion.p>
                                )}
                            </div>
                        )}

                        {/* File progress bar */}
                        {isActive && progress && progress.totalFiles > 0 && (
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileCode2 className="w-3.5 h-3.5 text-white/40" />
                                        <span className="text-[11px] text-white/40">Files generated</span>
                                    </div>
                                    <span className="text-[11px] font-mono font-semibold text-white/60">
                                        {progress.filesGenerated} <span className="text-white/25">/</span> {progress.totalFiles}
                                    </span>
                                </div>
                                <div className="h-[1.5px] bg-white/[0.05] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-violet-500 rounded-full relative"
                                        animate={{ width: `${(progress.filesGenerated / progress.totalFiles) * 100}%` }}
                                        transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
                                    >
                                        {!prefersReducedMotion && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                            />
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {/* Error state */}
                        {isError && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="bg-red-500/6 border border-red-500/12 rounded-xl overflow-hidden mb-5"
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <motion.div 
                                            animate={!prefersReducedMotion ? { rotate: [0, -8, 8, -8, 0] } : {}} 
                                            transition={{ duration: 0.4 }}
                                        >
                                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <p className="text-[13px] text-red-300 font-semibold mb-1">Build error</p>
                                            <p className="text-[11px] text-red-400/75 leading-relaxed">
                                                {error || 'An unexpected error occurred. Please try again.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable error details */}
                                <div className="border-t border-red-500/8">
                                    <button
                                        onClick={() => {
                                            const details = document.getElementById('error-details');
                                            details?.classList.toggle('hidden');
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            View error details
                                        </span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div id="error-details" className="hidden px-4 pb-4 space-y-2.5">
                                        <div className="bg-red-950/25 rounded-lg p-3">
                                            <p className="text-[10px] text-red-400/60 font-medium mb-1">Error Message</p>
                                            <p className="text-[11px] text-red-300 font-mono leading-relaxed">{error || 'Unknown error'}</p>
                                        </div>
                                        <div className="bg-red-950/25 rounded-lg p-3">
                                            <p className="text-[10px] text-red-400/60 font-medium mb-2">Suggested Solutions</p>
                                            <ul className="space-y-1.5">
                                                <li className="text-[11px] text-red-300/80 flex items-start gap-2">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>Try simplifying your prompt or breaking it into smaller tasks</span>
                                                </li>
                                                <li className="text-[11px] text-red-300/80 flex items-start gap-2">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>Check if you have sufficient API credits or quota</span>
                                                </li>
                                                <li className="text-[11px] text-red-300/80 flex items-start gap-2">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    <span>Try again in a few moments if the service is busy</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Ready state */}
                        {isReady && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                                className="bg-green-500/6 border border-green-500/12 rounded-xl p-4 mb-5 flex items-center gap-3"
                            >
                                <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }} 
                                    transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.08 }}
                                >
                                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                </motion.div>
                                <div>
                                    <p className="text-[12px] text-green-300 font-medium">Project ready</p>
                                    <p className="text-[11px] text-green-400/60">Loading workspace...</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Action buttons */}
                        {(isError || isActive) && (
                            <div className="flex items-center gap-2">
                                {isError && onRetry && (
                                    <motion.button
                                        onClick={onRetry}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium transition-colors shadow-lg shadow-violet-600/15"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Retry
                                    </motion.button>
                                )}
                                {onBackToDashboard && (
                                    <motion.button
                                        onClick={onBackToDashboard}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-medium transition-colors border border-white/[0.06]"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Dashboard
                                    </motion.button>
                                )}
                                {isActive && onCancel && (
                                    <motion.button
                                        onClick={onCancel}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="h-9 px-4 rounded-lg text-white/25 hover:text-white/50 text-[12px] transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Ready state buttons */}
                        {isReady && (
                            <div className="flex items-center gap-2">
                                {onViewArchitecture && (
                                    <motion.button
                                        onClick={onViewArchitecture}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/70 hover:text-white text-[12px] font-medium transition-colors border border-white/[0.06]"
                                    >
                                        <GitBranch className="w-3.5 h-3.5" />
                                        Architecture
                                    </motion.button>
                                )}
                                {onViewFiles && (
                                    <motion.button
                                        onClick={onViewFiles}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-medium transition-colors shadow-lg shadow-violet-600/15"
                                    >
                                        <Code2 className="w-3.5 h-3.5" />
                                        View Files
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        {isActive && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-[10px] text-white/20 text-center mt-4"
                            >
                                This usually takes 30–90 seconds depending on project complexity
                            </motion.p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
