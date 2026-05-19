'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-4 text-center">
                <h2 className="text-2xl font-bold text-neutral-900">
                    Something went wrong!
                </h2>
                <p className="text-neutral-600">
                    {process.env.NODE_ENV === 'development'
                        ? (error.message || 'An unexpected error occurred')
                        : 'An unexpected error occurred'}
                </p>
                <Button onClick={reset}>Try again</Button>
            </div>
        </div>
    )
}
