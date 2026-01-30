import { apiEndpoints } from '@/config/apiEndpoints'
import { redirect } from 'next/navigation'

export default function Home() {
  redirect(apiEndpoints.auth.login)
}
