'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BillingPlan, IntegratedTool, StripeConfig } from '@/lib/billing/types'

type EditablePlan = BillingPlan
type EditableTool = IntegratedTool

type PlansResponse = {
  error?: string
  warning?: string
  plan?: EditablePlan
  plans?: EditablePlan[]
}

type ToolsResponse = {
  error?: string
  tool?: EditableTool
  tools?: EditableTool[]
}

type StripeConfigResponse = {
  error?: string
  config?: StripeConfig
}

const emptyStripeConfig: StripeConfig = {
  publishableKey: '',
  secretKey: '',
  webhookSecret: '',
  apiVersion: '2024-12-18.acacia',
  successUrl: '',
  cancelUrl: '',
  updatedAt: '',
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default function BillingAdminPage() {
  const [adminToken, setAdminToken] = useState('')
  const [plans, setPlans] = useState<EditablePlan[]>([])
  const [tools, setTools] = useState<EditableTool[]>([])
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>(emptyStripeConfig)
  const [loading, setLoading] = useState(false)

  const [newPlan, setNewPlan] = useState({
    name: '',
    toolId: 'tool_8d',
    stripePriceId: '',
    unitAmount: 0,
    currency: 'eur',
    creditCount: 1,
    interval: 'one_time' as EditablePlan['interval'],
  })

  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    baseUrl: '',
    active: true,
  })

  const [syncingPlanId, setSyncingPlanId] = useState<string | null>(null)
  const [toolFilter, setToolFilter] = useState('')

  const isAuthenticated = useMemo(() => adminToken.trim().length > 0, [adminToken])
  const filteredPlans = useMemo(() => (toolFilter ? plans.filter((plan) => plan.toolId === toolFilter) : plans), [plans, toolFilter])

  const loadPublicData = useCallback(async () => {
    try {
      setLoading(true)
      const [plansRes, toolsRes] = await Promise.all([fetch('/api/billing/plans'), fetch('/api/billing/tools')])
      const plansJson = (await plansRes.json()) as PlansResponse
      const toolsJson = (await toolsRes.json()) as ToolsResponse

      if (!plansRes.ok) throw new Error(plansJson.error || 'Failed to load billing plans')
      if (!toolsRes.ok) throw new Error(toolsJson.error || 'Failed to load integrated tools')

      setPlans(plansJson.plans || [])
      setTools(toolsJson.tools || [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load billing data'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPublicData()
  }, [loadPublicData])

  async function apiFetch(path: string, init?: RequestInit, admin = false): Promise<Response> {
    const headers = new Headers(init?.headers || {})
    headers.set('Content-Type', 'application/json')
    if (admin) headers.set('x-admin-token', adminToken.trim())
    return fetch(path, { ...init, headers })
  }

  async function loadAdminStripeConfig() {
    if (!isAuthenticated) {
      toast.error('Enter admin token first')
      return
    }

    try {
      const response = await apiFetch('/api/billing/stripe-config', { method: 'GET' }, true)
      const json = (await response.json()) as StripeConfigResponse
      if (!response.ok || !json.config) throw new Error(json.error || 'Failed to load Stripe config')
      setStripeConfig(json.config)
      toast.success('Admin access verified')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Invalid admin token'))
    }
  }

  async function savePlan(plan: EditablePlan, syncToStripe = false) {
    if (syncToStripe) setSyncingPlanId(plan.id)

    try {
      const response = await apiFetch('/api/billing/plans', { method: 'POST', body: JSON.stringify({ ...plan, syncToStripe }) }, true)
      const json = (await response.json()) as PlansResponse
      if (!response.ok || !json.plan) throw new Error(json.error || 'Failed to save plan')

      setPlans((prev) => prev.map((item) => (item.id === plan.id ? json.plan! : item)))
      if (json.warning) {
        toast.warning(json.warning)
      } else {
        toast.success(syncToStripe ? 'Plan saved and synced to Stripe' : 'Plan updated')
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update plan'))
    } finally {
      setSyncingPlanId(null)
    }
  }

  async function createPlan() {
    try {
      const response = await apiFetch('/api/billing/plans', { method: 'POST', body: JSON.stringify(newPlan) }, true)
      const json = (await response.json()) as PlansResponse
      if (!response.ok || !json.plan) throw new Error(json.error || 'Failed to create plan')
      setPlans((prev) => [...prev, json.plan!])
      setNewPlan({
        name: '',
        toolId: 'tool_8d',
        stripePriceId: '',
        unitAmount: 0,
        currency: 'eur',
        creditCount: 1,
        interval: 'one_time',
      })
      toast.success('Plan created')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create plan'))
    }
  }

  async function deletePlan(id: string) {
    try {
      const response = await apiFetch('/api/billing/plans', { method: 'DELETE', body: JSON.stringify({ id }) }, true)
      const json = (await response.json()) as PlansResponse
      if (!response.ok) throw new Error(json.error || 'Failed to delete plan')
      setPlans((prev) => prev.filter((plan) => plan.id !== id))
      toast.success('Plan deleted')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete plan'))
    }
  }

  async function saveTool(tool: EditableTool) {
    try {
      const response = await apiFetch('/api/billing/tools', { method: 'POST', body: JSON.stringify(tool) }, true)
      const json = (await response.json()) as ToolsResponse
      if (!response.ok || !json.tool) throw new Error(json.error || 'Failed to save tool')
      setTools((prev) => prev.map((item) => (item.id === tool.id ? json.tool! : item)))
      toast.success('Tool updated')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update tool'))
    }
  }

  async function createTool() {
    try {
      const response = await apiFetch('/api/billing/tools', { method: 'POST', body: JSON.stringify(newTool) }, true)
      const json = (await response.json()) as ToolsResponse
      if (!response.ok || !json.tool) throw new Error(json.error || 'Failed to create tool')
      setTools((prev) => [...prev, json.tool!])
      setNewTool({ name: '', description: '', baseUrl: '', active: true })
      toast.success('Tool added')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create tool'))
    }
  }

  async function deleteTool(id: string) {
    try {
      const response = await apiFetch('/api/billing/tools', { method: 'DELETE', body: JSON.stringify({ id }) }, true)
      const json = (await response.json()) as ToolsResponse
      if (!response.ok) throw new Error(json.error || 'Failed to delete tool')
      setTools((prev) => prev.filter((tool) => tool.id !== id))
      toast.success('Tool removed')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete tool'))
    }
  }

  async function saveStripeConfig() {
    try {
      const response = await apiFetch('/api/billing/stripe-config', { method: 'PUT', body: JSON.stringify(stripeConfig) }, true)
      const json = (await response.json()) as StripeConfigResponse
      if (!response.ok || !json.config) throw new Error(json.error || 'Failed to update Stripe config')
      setStripeConfig(json.config)
      toast.success('Stripe configuration updated')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update Stripe config'))
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Microservice Admin Panel</CardTitle>
            <CardDescription>Manage Stripe config, plans, and the list of integrated tools from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-token">Admin Token</Label>
              <Input id="admin-token" type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Set BILLING_ADMIN_TOKEN and paste it here" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={loadAdminStripeConfig} disabled={!isAuthenticated}>Verify Admin Token</Button>
              <Button variant="outline" onClick={loadPublicData} disabled={loading}>Refresh Plans & Tools</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Configuration</CardTitle>
            <CardDescription>Update Stripe keys and checkout redirect URLs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input value={stripeConfig.publishableKey || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, publishableKey: event.target.value }))} placeholder="Publishable key" />
            <Input value={stripeConfig.secretKey || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, secretKey: event.target.value }))} placeholder="Secret key" />
            <Input value={stripeConfig.webhookSecret || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, webhookSecret: event.target.value }))} placeholder="Webhook secret" />
            <Input value={stripeConfig.apiVersion || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, apiVersion: event.target.value }))} placeholder="Stripe API version" />
            <Input value={stripeConfig.successUrl || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, successUrl: event.target.value }))} placeholder="Success URL or relative path" />
            <Input value={stripeConfig.cancelUrl || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, cancelUrl: event.target.value }))} placeholder="Cancel URL or relative path" />
            <div className="md:col-span-2">
              <Button onClick={saveStripeConfig} disabled={!isAuthenticated}>Save Stripe Config</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Plans</CardTitle>
            <CardDescription>Create, edit, and remove Stripe plans per tool. Use &quot;Save &amp; Sync&quot; to auto-create or update the Stripe Product and Price.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label>Filter by Tool:</Label>
              <select className="rounded-md border px-3 py-1.5 text-sm" value={toolFilter} onChange={(event) => setToolFilter(event.target.value)}>
                <option value="">All Tools</option>
                <option value="tool_8d">8D (tool_8d)</option>
                <option value="tool_csr">CSR (tool_csr)</option>
              </select>
            </div>

            <div className="grid gap-2 rounded-md border p-3 md:grid-cols-4">
              <Input placeholder="Name" value={newPlan.name} onChange={(event) => setNewPlan((prev) => ({ ...prev, name: event.target.value }))} />
              <select className="rounded-md border px-3 py-1.5 text-sm" value={newPlan.toolId} onChange={(event) => setNewPlan((prev) => ({ ...prev, toolId: event.target.value }))}>
                <option value="tool_8d">8D (tool_8d)</option>
                <option value="tool_csr">CSR (tool_csr)</option>
              </select>
              <Input placeholder="Stripe Price ID (optional)" value={newPlan.stripePriceId} onChange={(event) => setNewPlan((prev) => ({ ...prev, stripePriceId: event.target.value }))} />
              <Input placeholder="Unit amount (cents)" type="number" value={newPlan.unitAmount} onChange={(event) => setNewPlan((prev) => ({ ...prev, unitAmount: Number(event.target.value || 0) }))} />
              <Input placeholder="Currency" value={newPlan.currency} onChange={(event) => setNewPlan((prev) => ({ ...prev, currency: event.target.value }))} />
              <Input placeholder="Credit count" type="number" value={newPlan.creditCount} onChange={(event) => setNewPlan((prev) => ({ ...prev, creditCount: Number(event.target.value || 1) }))} />
              <Input placeholder="Interval: one_time | month | year" value={newPlan.interval} onChange={(event) => setNewPlan((prev) => ({ ...prev, interval: event.target.value as EditablePlan['interval'] }))} />
              <Button onClick={createPlan} disabled={!isAuthenticated}>Add Plan</Button>
            </div>

            <div className="space-y-3">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono">{plan.id}</span>
                    <span>|</span>
                    <span className={plan.toolId === 'tool_8d' ? 'font-bold text-blue-600' : 'font-bold text-green-600'}>{plan.toolId === 'tool_8d' ? '8D' : 'CSR'}</span>
                    {plan.stripeProductId ? (<><span>|</span><span className="text-purple-600">Stripe Product: {plan.stripeProductId}</span></>) : null}
                  </div>
                  <div className="grid gap-2 md:grid-cols-5">
                    <Input value={plan.name} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, name: event.target.value } : item)))} placeholder="Plan name" />
                    <select className="rounded-md border px-3 py-1.5 text-sm" value={plan.toolId} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, toolId: event.target.value } : item)))}>
                      <option value="tool_8d">8D (tool_8d)</option>
                      <option value="tool_csr">CSR (tool_csr)</option>
                    </select>
                    <Input value={plan.stripePriceId} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, stripePriceId: event.target.value } : item)))} placeholder="Stripe Price ID" />
                    <Input type="number" value={plan.unitAmount} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, unitAmount: Number(event.target.value || 0) } : item)))} placeholder="Amount (cents)" />
                    <Input type="number" value={plan.creditCount} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, creditCount: Number(event.target.value || 1) } : item)))} placeholder="Credits" />
                    <Input value={plan.currency} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, currency: event.target.value } : item)))} placeholder="Currency" />
                    <Input value={plan.interval} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, interval: event.target.value as EditablePlan['interval'] } : item)))} placeholder="Interval" />
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`plan-active-${plan.id}`}>Active</Label>
                      <Checkbox id={`plan-active-${plan.id}`} checked={plan.active} onCheckedChange={(checked) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, active: Boolean(checked) } : item)))} />
                    </div>
                    <Button onClick={() => savePlan(plan)} disabled={!isAuthenticated}>Save</Button>
                    <Button onClick={() => savePlan(plan, true)} disabled={!isAuthenticated || syncingPlanId === plan.id} variant="outline">{syncingPlanId === plan.id ? 'Syncing...' : 'Save & Sync to Stripe'}</Button>
                    <Button variant="destructive" onClick={() => deletePlan(plan.id)} disabled={!isAuthenticated}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrated Tools</CardTitle>
            <CardDescription>List all tools where billing and Stripe are integrated.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 rounded-md border p-3 md:grid-cols-4">
              <Input placeholder="Tool name" value={newTool.name} onChange={(event) => setNewTool((prev) => ({ ...prev, name: event.target.value }))} />
              <Input placeholder="Description" value={newTool.description} onChange={(event) => setNewTool((prev) => ({ ...prev, description: event.target.value }))} />
              <Input placeholder="Base URL" value={newTool.baseUrl} onChange={(event) => setNewTool((prev) => ({ ...prev, baseUrl: event.target.value }))} />
              <Button onClick={createTool} disabled={!isAuthenticated}>Add Tool</Button>
            </div>

            <div className="space-y-3">
              {tools.map((tool) => (
                <div key={tool.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-5">
                  <Input value={tool.id} disabled />
                  <Input value={tool.name} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, name: event.target.value } : item)))} />
                  <Input value={tool.description || ''} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, description: event.target.value } : item)))} />
                  <Input value={tool.baseUrl || ''} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, baseUrl: event.target.value } : item)))} />
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`tool-active-${tool.id}`}>Active</Label>
                    <Checkbox id={`tool-active-${tool.id}`} checked={tool.active} onCheckedChange={(checked) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, active: Boolean(checked) } : item)))} />
                  </div>
                  <Button onClick={() => saveTool(tool)} disabled={!isAuthenticated}>Save</Button>
                  <Button variant="destructive" onClick={() => deleteTool(tool.id)} disabled={!isAuthenticated}>Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
