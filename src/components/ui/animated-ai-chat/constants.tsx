import { CheckSquareIcon, CreditCardIcon, ShoppingCartIcon, UsersIcon } from 'lucide-react';

import type { CommandSuggestion } from './types';

export const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
    {
        icon: <CheckSquareIcon className="w-4 h-4" />,
        label: 'Task Manager API',
        description: 'Build a task management backend with projects and tasks',
        prefix: 'Build a backend for a task management application with projects and tasks. Include user authentication, task CRUD operations, project organization, task assignment, due dates, status tracking, and pagination.'
    },
    {
        icon: <CreditCardIcon className="w-4 h-4" />,
        label: 'SaaS Platform Backend',
        description: 'Generate a SaaS platform backend with subscriptions and payments',
        prefix: 'Generate a backend for a SaaS platform with user authentication, subscription plans, payment integration, organization workspaces, and role-based access control.'
    },
    {
        icon: <ShoppingCartIcon className="w-4 h-4" />,
        label: 'E-commerce API',
        description: 'Build an e-commerce backend with products, categories, shopping cart, orders, payments, inventory management, and user accounts.',
        prefix: 'Build an e-commerce backend with products, categories, shopping cart, orders, payments, inventory management, and user accounts.'
    },
    {
        icon: <UsersIcon className="w-4 h-4" />,
        label: 'Social Platform API',
        description: 'Generate a backend for a social media platform with users, posts, comments, likes, follows, and notifications.',
        prefix: 'Generate a backend for a social media platform with users, posts, comments, likes, follows, and notifications.'
    }
];
