import { NextRequest, NextResponse } from 'next/server'
import { requireBillingAdmin } from '@/lib/billing/adminAuth'
import { deleteIntegratedTool, listIntegratedTools, upsertIntegratedTool } from '@/lib/billing/store'

export async function GET(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true'
    const tools = await listIntegratedTools()

    return NextResponse.json({
      tools: activeOnly ? tools.filter((tool) => tool.active) : tools,
    })
  } catch (error) {
    console.error('[billing/tools][GET]', error)
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireBillingAdmin(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const tool = await upsertIntegratedTool({
      id: body?.id,
      name,
      description: body?.description,
      baseUrl: body?.baseUrl,
      active: typeof body?.active === 'boolean' ? body.active : true,
      defaultPlanId: body?.defaultPlanId,
    })

    return NextResponse.json({ tool })
  } catch (error) {
    console.error('[billing/tools][POST]', error)
    return NextResponse.json({ error: 'Failed to create or update tool' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

export async function DELETE(request: NextRequest) {
  const unauthorized = requireBillingAdmin(request)
  if (unauthorized) {
    return unauthorized
  }

  try {
    const idFromQuery = request.nextUrl.searchParams.get('id')
    const body = await request.json().catch(() => ({}))
    const id = String(idFromQuery || body?.id || '').trim()

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const deleted = await deleteIntegratedTool(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[billing/tools][DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 })
  }
}
