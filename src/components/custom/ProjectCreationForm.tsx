'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateProjectData } from '@/types/feathers';

/**
 * Props for ProjectCreationForm component.
 * Fully stateless - all data and handlers passed as props.
 */
export interface ProjectCreationFormProps {
    /** Current form values */
    values: {
        name: string;
        description: string;
        framework: 'fast-api' | 'feathers';
        language: 'python' | 'typescript';
    };
    /** Whether the form is currently submitting */
    isSubmitting: boolean;
    /** Callback invoked when form values change */
    onChange: (values: ProjectCreationFormProps['values']) => void;
    /** Callback invoked when form is submitted — userId is injected by the caller */
    onSubmit: (data: Omit<CreateProjectData, 'userId'>) => void;
    /** Callback invoked when user cancels */
    onCancel?: () => void;
}

/**
 * Stateless Project Creation Form Component.
 *
 * This component provides a simple form for creating new projects with:
 * - Project name input
 * - Project description textarea
 * - Framework selection (FastAPI or Feathers.js)
 * - Language selection (Python or TypeScript)
 *
 * @example
 * ```tsx
 * <ProjectCreationForm
 *   values={formValues}
 *   isSubmitting={isCreating}
 *   onChange={setFormValues}
 *   onSubmit={handleCreateProject}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function ProjectCreationForm({ values, isSubmitting, onChange, onSubmit, onCancel }: ProjectCreationFormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({
            name: values.name,
            description: values.description,
            framework: values.framework,
            language: values.language
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="My Awesome Project"
                    value={values.name}
                    onChange={(e) => onChange({ ...values, name: e.target.value })}
                    disabled={isSubmitting}
                    required
                    className="w-full"
                />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Describe your project (e.g., A REST API for task management with user authentication)"
                    value={values.description}
                    onChange={(e) => onChange({ ...values, description: e.target.value })}
                    disabled={isSubmitting}
                    required
                    rows={4}
                    className="w-full resize-none"
                />
            </div>

            {/* Framework Selection */}
            <div className="space-y-2">
                <Label>Framework</Label>
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        variant={values.framework === 'fast-api' ? 'default' : 'outline'}
                        onClick={() => onChange({ ...values, framework: 'fast-api' })}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        FastAPI
                    </Button>
                    <Button
                        type="button"
                        variant={values.framework === 'feathers' ? 'default' : 'outline'}
                        onClick={() => onChange({ ...values, framework: 'feathers' })}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        Feathers.js
                    </Button>
                </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
                <Label>Language</Label>
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        variant={values.language === 'python' ? 'default' : 'outline'}
                        onClick={() => onChange({ ...values, language: 'python' })}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        Python
                    </Button>
                    <Button
                        type="button"
                        variant={values.language === 'typescript' ? 'default' : 'outline'}
                        onClick={() => onChange({ ...values, language: 'typescript' })}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        TypeScript
                    </Button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {/* Cancel Button */}
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
                        Cancel
                    </Button>
                )}

                {/* Submit Button */}
                <Button type="submit" disabled={isSubmitting || !values.name.trim() || !values.description.trim()} className="flex-1">
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
            </div>
        </form>
    );
}
