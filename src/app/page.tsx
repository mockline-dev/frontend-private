import { InitialScreen } from '@/containers/initialScreen/InitialScreen'

export const dynamic = 'force-static'
export const revalidate = false // Never revalidate, truly static

export default function HomePage() {
  return <InitialScreen />
}
