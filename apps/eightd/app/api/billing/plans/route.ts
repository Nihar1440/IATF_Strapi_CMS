import { NextRequest, NextResponse } from 'next/server'
import { requireBillingAdmin } from '@/lib/billing/adminAuth'
import { deleteBillingPlan, listBillingPlans, upsertBillingPlan } from '@/lib/billing/store'
import { syncPlanToStripe } from '@/lib/billing/stripe'

export async function GET(request: NextRequest) {
  try {
    const toolId = request.nextUrl.searchParams.get('toolId')
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true'
    const plans = await listBillingPlans()

    const filtered = plans.filter((plan) => {
      if (toolId && plan.toolId !== toolId) {
        return false
      }
      if (activeOnly && !plan.active) {
        return false
      }
      return true
    })

    return NextResponse.json({ plans: filtered })
  } catch (error) {
    console.error('[billing/plans][GET]', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
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
    const stripePriceId = String(body?.stripePriceId || '').trim()
    const toolId = String(body?.toolId || '').trim()

    if (!name || !toolId) {
      return NextResponse.json({ error: 'name and toolId are required' }, { status: 400 })
    }

    let plan = await upsertBillingPlan({
      id: body?.id,
      name,
      description: body?.description,
      toolId,
      stripePriceId: stripePriceId,
      stripeProductId: body?.stripeProductId,
      unitAmount: Number(body?.unitAmount || 0),
      currency: body?.currency || 'eur',
      creditCount: Number(body?.creditCount || 1),
      interval: body?.interval || 'one_time',
      active: typeof body?.active === 'boolean' ? body.active : true,
    })

    // Auto-sync to Stripe when requested and unitAmount > 0
    if (body?.syncToStripe && plan.unitAmount > 0) {
      try {
        const synced = await syncPlanToStripe(plan)
        plan = await upsertBillingPlan({
          ...plan,
          stripeProductId: synced.stripeProductId,
          stripePriceId: synced.stripePriceId,
        })
      } catch (syncError) {
        console.error('[billing/plans][POST] Stripe sync failed:', syncError)
        return NextResponse.json({
          plan,
          warning: 'Plan saved but Stripe sync failed: ' + (syncError instanceof Error ? syncError.message : 'Unknown error'),
        })
      }
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('[billing/plans][POST]', error)
    return NextResponse.json({ error: 'Failed to create or update plan' }, { status: 500 })
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

    const deleted = await deleteBillingPlan(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[billing/plans][DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
