import { CheckUser } from '@/services/checkUser'

export default async function HomePage() {
  await CheckUser()
  return null
}
