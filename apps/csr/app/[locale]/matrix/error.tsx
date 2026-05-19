'use client'

export default function CsrMatrixError({ error }: { error: Error }) {
  console.error('[csr-matrix] Unhandled error:', error)
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="rounded-lg border border-red-200 bg-white px-6 py-4 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
        <p className="mt-1 text-sm text-neutral-500">Please reload the page or try again later.</p>
      </div>
    </main>
  )
}
