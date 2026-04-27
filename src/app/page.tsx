import { InitialScreen } from '@/containers/initialScreen/InitialScreen';
import { getCurrentUser } from '@/services/getCurrentUser';
export const runtime = 'edge';

export default async function HomePage() {
    const currentUser = await getCurrentUser();

    return <InitialScreen currentUser={currentUser} />;
}
