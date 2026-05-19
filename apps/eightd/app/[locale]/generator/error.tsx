'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function GeneratorError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        console.error('Generator error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-4 text-center">
                <h2 className="text-xl font-bold text-neutral-900">
                    Generator Error
                </h2>
                <p className="text-sm text-neutral-600">
                    Your data is safe in local storage. Try refreshing the page.
                </p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={reset}>Try Again</Button>
                    <Button variant="outline" onClick={() => router.push('/')}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    )
}