'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export function Header() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">取り数最適化システム</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              元板から製品を効率的に切り出す配置計算アプリ
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {user && (
              <>
                <div className="text-right mr-2">
                  <p className="text-sm text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-500">Nomura Gosei</p>
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    設定
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  ログアウト
                </Button>
              </>
            )}
            {!user && <p className="text-xs text-gray-500">Nomura Gosei</p>}
          </div>
        </div>
      </div>
    </header>
  )
}
