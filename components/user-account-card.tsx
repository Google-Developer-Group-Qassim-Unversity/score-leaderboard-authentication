'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useTranslation } from '@/lib/i18n/client'

export function UserAccountCard() {
  const { t } = useTranslation()
  const { user } = useUser()

  return (
    <div className="flex items-center justify-between mb-4 p-3 sm:p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
      <div className="flex items-center gap-3">
        <div className="relative group">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-offset-2 ring-muted-foreground/20 hover:ring-muted-foreground/40 transition-all cursor-pointer",
                userButtonPopoverCard: "shadow-xl"
              }
            }}
            afterSignOutUrl="/sign-in"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm sm:text-base font-semibold truncate">
            {user?.fullName || t('profile.userCard.defaultName')}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
        </div>
      </div>
      <div className="hidden sm:block text-xs text-muted-foreground ml-2 whitespace-nowrap">
        {t('profile.userCard.clickToManage')}
      </div>
    </div>
  )
}
