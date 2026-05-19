import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'demo', 'CSR-Sample-Report.pdf')
    const file = await readFile(filePath)

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="CSR-Sample-Report.pdf"',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Sample PDF not found' }, { status: 404 })
  }
}