export interface OptionsType {
    value: string | number;
    label: string | number;
}

export type LanguageType = 'en' | 'fr' | 'es' | 'tr';

export interface FeathersResponse<T> {
    data: T[];
    total: number;
    limit?: number;
    skip?: number;
    stats?: {
        active: number;
        inactive: number;
    };
}
