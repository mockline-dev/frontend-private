import { FC } from 'react'

import LoginPage from './login/page'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const AuthPage: FC = async () => {
  return <LoginPage />
}

export default AuthPage
