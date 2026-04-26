import { BookOpenIcon, LinkIcon, NotebookPenIcon, UsersIcon } from 'lucide-react';

import type { CommandSuggestion } from './types';

export const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
    {
        icon: <NotebookPenIcon className="w-4 h-4" />,
        label: 'Notes API',
        description: 'Simple notes app with tags and search',
        prefix: 'Build a REST API for a notes app. Users can create, read, update, and delete notes. Notes have a title, content, and optional tags. Include search by title or tag.',
    },
    {
        icon: <UsersIcon className="w-4 h-4" />,
        label: 'User Auth API',
        description: 'User registration, login, and profile management',
        prefix: 'Build a user authentication API with registration, login, logout, and profile management. Use JWT tokens. Include password hashing and basic profile fields (name, email, avatar URL).',
    },
    {
        icon: <BookOpenIcon className="w-4 h-4" />,
        label: 'Blog API',
        description: 'Posts, comments, and author profiles',
        prefix: 'Build a blog backend API with posts and comments. Posts have a title, body, author, publish date, and slug. Users can comment on posts. Include list and detail endpoints.',
    },
    {
        icon: <LinkIcon className="w-4 h-4" />,
        label: 'URL Shortener',
        description: 'Shorten URLs and track click counts',
        prefix: 'Build a URL shortener API. Users submit a long URL and receive a short code. Visiting the short code redirects to the original URL. Track total click count per link.',
    },
];
