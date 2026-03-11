import UniqueLoading from '@/components/ui/morph-loading';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <UniqueLoading variant="morph" size="lg" />
        </div>
    );
}
