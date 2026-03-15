/**
 * Prompt validation utilities for AI backend generation
 */

export interface PromptValidationResult {
    isValid: boolean;
    confidence: number; // 0-1 score
    category: 'backend' | 'general' | 'unclear' | 'invalid';
    suggestedQuestions?: string[];
    reason?: string;
    enhancedPrompt?: string;
}

function buildEnhancedPrompt(prompt: string): string {
    return `Create a professional backend application based on this request: "${prompt}".

Please include:
- Clean, well-structured code
- Proper error handling
- Input validation
- Basic security measures
- Clear API endpoints
- Database integration where appropriate
- Comprehensive comments

Generate a complete, production-ready backend with all necessary files.`;
}

// Keywords that indicate backend development intent
const BACKEND_KEYWORDS = [
    // API related
    'api',
    'endpoint',
    'rest',
    'graphql',
    'webhook',
    'route',
    'controller',
    // Database related
    'database',
    'db',
    'sql',
    'mongodb',
    'postgres',
    'mysql',
    'schema',
    'model',
    // Authentication
    'auth',
    'authentication',
    'login',
    'signup',
    'jwt',
    'token',
    'session',
    // Server related
    'server',
    'backend',
    'express',
    'fastapi',
    'django',
    'flask',
    'node',
    // Features
    'crud',
    'middleware',
    'validation',
    'error handling',
    'logging',
    // Architecture
    'microservice',
    'service',
    'architecture',
    'deployment',
    'docker',
    // Review and analysis
    'review',
    'analyze',
    'analysis',
    'check',
    'examine',
    'improve',
    'optimize',
    'refactor',
    'structure',
    'code',
    'implementation',
    'functionality',
    'logic',
    'security',
    'performance'
];

// Frameworks and technologies
const FRAMEWORKS = ['express', 'fastapi', 'django', 'flask', 'nestjs', 'feathersjs', 'spring', 'laravel', 'rails', 'koa', 'hapi'];

// Database technologies
const DATABASES = ['mongodb', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'firestore', 'supabase', 'prisma', 'sequelize'];

// Error/log diagnostics that should always be handled, not rejected as unclear.
const DIAGNOSTIC_KEYWORDS = [
    'error',
    'failed',
    'exception',
    'traceback',
    'stack trace',
    'no matching distribution found',
    'could not find a version that satisfies',
    'pip',
    'npm',
    'uvicorn',
    'ts error',
    'compile',
    'build failed'
];

const DIAGNOSTIC_PATTERNS = [/\berror\b/i, /\bfailed\b/i, /traceback/i, /\bexception\b/i, /\bts\d{4}\b/i, /no matching distribution found/i];

const FILE_REFERENCE_PATTERN = /\b([\w./-]+\.(py|ts|tsx|js|jsx|json|yml|yaml|md|txt|env|toml|ini|sql))\b/i;
const FILE_QUERY_PATTERNS = [
    /\bwhat\s+is\s+in\s+[\w./-]+\b/i,
    /\bshow\s+(me\s+)?([\w./-]+\.(py|ts|tsx|js|jsx|json|yml|yaml|md|txt|env|toml|ini|sql))\b/i,
    /\b(content|contents)\s+of\s+([\w./-]+\.(py|ts|tsx|js|jsx|json|yml|yaml|md|txt|env|toml|ini|sql))\b/i,
    /\b(open|read|inspect|explain)\s+([\w./-]+\.(py|ts|tsx|js|jsx|json|yml|yaml|md|txt|env|toml|ini|sql))\b/i
];

// Common non-backend prompts that should be filtered out
const INVALID_PATTERNS = [
    /^(hi|hello|hey|test|testing)$/i,
    /^(what|how|why|when|where)\s*\?*$/i,
    /^(thanks|thank you|ok|okay)$/i,
    /^\d+$/, // Just numbers
    /^[a-zA-Z]$/ // Single letters
];

// Patterns that suggest backend development
const BACKEND_PATTERNS = [
    /create.*api/i,
    /build.*backend/i,
    /make.*server/i,
    /add.*endpoint/i,
    /remove.*endpoint/i,
    /delete.*endpoint/i,
    /update.*endpoint/i,
    /modify.*endpoint/i,
    /can you (add|remove|delete|update|modify).*(endpoint|route)/i,
    /implement.*auth/i,
    /setup.*database/i,
    /generate.*crud/i,
    /(user|product|order|payment).*management/i,
    /\b(rest|graphql)\s*api/i,
    // Review and analysis patterns
    /review.*api/i,
    /review.*backend/i,
    /review.*code/i,
    /review.*structure/i,
    /review.*implementation/i,
    /analyze.*api/i,
    /analyze.*backend/i,
    /analyze.*code/i,
    /analyze.*structure/i,
    /check.*api/i,
    /check.*backend/i,
    /check.*code/i,
    /examine.*api/i,
    /examine.*backend/i,
    /examine.*code/i,
    /improve.*api/i,
    /improve.*backend/i,
    /improve.*code/i,
    /optimize.*api/i,
    /optimize.*backend/i,
    /optimize.*code/i,
    /refactor.*api/i,
    /refactor.*backend/i,
    /refactor.*code/i,
    /help.*with.*api/i,
    /help.*with.*backend/i,
    /help.*with.*code/i,
    /fix.*api/i,
    /fix.*backend/i,
    /fix.*code/i,
    /debug.*api/i,
    /debug.*backend/i,
    /debug.*code/i
];

/**
 * Validates if a prompt is suitable for backend generation
 */
export function validatePrompt(prompt: string): PromptValidationResult {
    if (!prompt || typeof prompt !== 'string') {
        return {
            isValid: false,
            confidence: 0,
            category: 'invalid',
            reason: 'Empty or invalid prompt'
        };
    }

    const trimmedPrompt = prompt.trim().toLowerCase();

    const hasDiagnosticKeyword = DIAGNOSTIC_KEYWORDS.some((keyword) => trimmedPrompt.includes(keyword));
    const hasDiagnosticPattern = DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(prompt));
    const hasFileReference = FILE_REFERENCE_PATTERN.test(prompt);
    const isFileQuery = FILE_QUERY_PATTERNS.some((pattern) => pattern.test(prompt));

    if (hasDiagnosticKeyword || hasDiagnosticPattern) {
        return {
            isValid: true,
            confidence: 0.95,
            category: 'backend',
            reason: 'Prompt contains runtime/build diagnostics and should be handled directly.',
            enhancedPrompt: prompt
        };
    }

    if (hasFileReference || isFileQuery) {
        return {
            isValid: true,
            confidence: 0.9,
            category: 'backend',
            reason: 'Prompt references project file content and should be handled directly.',
            enhancedPrompt: prompt
        };
    }

    // Check for obviously invalid patterns
    for (const pattern of INVALID_PATTERNS) {
        if (pattern.test(trimmedPrompt)) {
            return {
                isValid: false,
                confidence: 0.9,
                category: 'invalid',
                reason: 'Prompt appears to be a greeting, test, or too simple',
                suggestedQuestions: [
                    'What type of backend application would you like to create?',
                    'What features should your API include?',
                    'Which database would you like to use?',
                    'Do you need authentication in your backend?'
                ]
            };
        }
    }

    // Check for explicit backend patterns
    for (const pattern of BACKEND_PATTERNS) {
        if (pattern.test(prompt)) {
            return {
                isValid: true,
                confidence: 0.9,
                category: 'backend',
                reason: 'Prompt explicitly mentions backend development',
                enhancedPrompt: buildEnhancedPrompt(prompt)
            };
        }
    }

    // Count backend-related keywords
    const words = trimmedPrompt.split(/\s+/);
    let backendScore = 0;
    let frameworkScore = 0;
    let databaseScore = 0;

    for (const word of words) {
        if (BACKEND_KEYWORDS.includes(word)) {
            backendScore += 1;
        }
        if (FRAMEWORKS.includes(word)) {
            frameworkScore += 2; // Frameworks are strong indicators
        }
        if (DATABASES.includes(word)) {
            databaseScore += 1.5; // Databases are good indicators
        }
    }

    const editIntentWords = ['add', 'remove', 'delete', 'update', 'modify', 'edit'];
    const endpointWords = ['endpoint', 'route', 'api'];
    const hasEditIntent = editIntentWords.some((w) => trimmedPrompt.includes(w));
    const hasEndpointIntent = endpointWords.some((w) => trimmedPrompt.includes(w));

    const totalScore = backendScore + frameworkScore + databaseScore;
    const confidence = Math.min(totalScore / words.length, 1);

    // Determine category based on score and length
    if (confidence >= 0.2 || totalScore >= 1) {
        return {
            isValid: true,
            confidence,
            category: 'backend',
            reason: 'Prompt contains backend-related keywords',
            enhancedPrompt: buildEnhancedPrompt(prompt)
        };
    }

    if (hasEditIntent && hasEndpointIntent) {
        return {
            isValid: true,
            confidence: 0.75,
            category: 'backend',
            reason: 'Prompt contains endpoint edit intent',
            enhancedPrompt: buildEnhancedPrompt(prompt)
        };
    }

    // Check if it's a general development request that could be backend
    const generalDevKeywords = ['app', 'application', 'system', 'platform', 'service', 'project', 'code', 'feature', 'functionality'];
    const hasGeneralDev = generalDevKeywords.some((keyword) => trimmedPrompt.includes(keyword));

    if (hasGeneralDev && words.length >= 2) {
        return {
            isValid: true,
            confidence: 0.4,
            category: 'general',
            reason: 'General development request - will be processed by AI',
            enhancedPrompt: buildEnhancedPrompt(prompt)
        };
    }

    // If prompt is too short or unclear
    if (words.length < 2) {
        return {
            isValid: false,
            confidence: 0.2,
            category: 'unclear',
            reason: 'Prompt is too short or unclear',
            suggestedQuestions: [
                'Could you provide more details about what you want to build?',
                'What type of backend application are you looking for?',
                'What features should your API include?',
                'Are you building a web app, mobile app backend, or something else?'
            ]
        };
    }

    // Default case - accept the prompt and let the AI handle it
    // This allows the AI to respond intelligently to a wider range of requests
    return {
        isValid: true,
        confidence: 0.25,
        category: 'general',
        reason: 'Prompt accepted for AI processing',
        enhancedPrompt: buildEnhancedPrompt(prompt)
    };
}

/**
 * Generates follow-up questions based on a prompt
 */
export function generateFollowUpQuestions(prompt: string): string[] {
    const validation = validatePrompt(prompt);

    if (validation.suggestedQuestions) {
        return validation.suggestedQuestions;
    }

    // Default follow-up questions for valid prompts
    return [
        'What database would you prefer to use?',
        'Do you need user authentication?',
        'Should I include API documentation?',
        'What programming language do you prefer?'
    ];
}

/**
 * Enhances a prompt with additional context for better AI generation
 */
export function enhancePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
        return prompt;
    }

    return buildEnhancedPrompt(prompt);
}
