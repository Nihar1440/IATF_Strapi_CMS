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
    currency: 'usd',
    creditCount: 1,
    interval: 'one_time' as EditablePlan['interval'],
  })

  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    baseUrl: '',
    active: true,
  })

  const isAuthenticated = useMemo(() => adminToken.trim().length > 0, [adminToken])

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

  async function savePlan(plan: EditablePlan) {
    try {
      const response = await apiFetch('/api/billing/plans', { method: 'POST', body: JSON.stringify(plan) }, true)
      const json = (await response.json()) as PlansResponse
      if (!response.ok || !json.plan) throw new Error(json.error || 'Failed to save plan')
      setPlans((prev) => prev.map((item) => (item.id === plan.id ? json.plan! : item)))
      toast.success('Plan updated')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update plan'))
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
        currency: 'usd',
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
    <main className="min-h-screen bg-neutral-50 r-p">
      <div className="mx-auto flex w-full max-w-6xl flex-col r-gap-section">
        <Card>
          <CardHeader>
            <CardTitle className="r-text-xl">Billing Microservice Admin Panel</CardTitle>
            <CardDescription className="r-text-sm">
              Manage Stripe config, plans, and the list of integrated tools from one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="r-space-y">
            <div className="grid r-gap-xs">
              <Label htmlFor="admin-token" className="r-text-sm">Admin Token</Label>
              <Input id="admin-token" type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} placeholder="Set BILLING_ADMIN_TOKEN and paste it here" className="r-text-sm" />
            </div>
            <div className="flex flex-wrap r-gap-xs">
              <Button onClick={loadAdminStripeConfig} disabled={!isAuthenticated} className="r-text-sm">Verify Admin Token</Button>
              <Button variant="outline" onClick={loadPublicData} disabled={loading} className="r-text-sm">Refresh Plans &amp; Tools</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="r-text-lg">Stripe Configuration</CardTitle>
            <CardDescription className="r-text-sm">Update Stripe keys and checkout redirect URLs.</CardDescription>
          </CardHeader>
          <CardContent className="grid r-gap-sm md:grid-cols-2">
            <Input value={stripeConfig.publishableKey || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, publishableKey: event.target.value }))} placeholder="Publishable key" className="r-text-sm" />
            <Input value={stripeConfig.secretKey || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, secretKey: event.target.value }))} placeholder="Secret key" className="r-text-sm" />
            <Input value={stripeConfig.webhookSecret || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, webhookSecret: event.target.value }))} placeholder="Webhook secret" className="r-text-sm" />
            <Input value={stripeConfig.apiVersion || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, apiVersion: event.target.value }))} placeholder="Stripe API version" className="r-text-sm" />
            <Input value={stripeConfig.successUrl || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, successUrl: event.target.value }))} placeholder="Success URL or relative path" className="r-text-sm" />
            <Input value={stripeConfig.cancelUrl || ''} onChange={(event) => setStripeConfig((prev) => ({ ...prev, cancelUrl: event.target.value }))} placeholder="Cancel URL or relative path" className="r-text-sm" />
            <div className="md:col-span-2">
              <Button onClick={saveStripeConfig} disabled={!isAuthenticated} className="r-text-sm">Save Stripe Config</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="r-text-lg">Billing Plans</CardTitle>
            <CardDescription className="r-text-sm">Create, edit, and remove Stripe plans per tool.</CardDescription>
          </CardHeader>
          <CardContent className="r-space-y">
            <div className="grid r-gap-xs rounded-md border r-p-sm md:grid-cols-4">
              <Input placeholder="Name" value={newPlan.name} onChange={(event) => setNewPlan((prev) => ({ ...prev, name: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Tool ID" value={newPlan.toolId} onChange={(event) => setNewPlan((prev) => ({ ...prev, toolId: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Stripe Price ID" value={newPlan.stripePriceId} onChange={(event) => setNewPlan((prev) => ({ ...prev, stripePriceId: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Unit amount" type="number" value={newPlan.unitAmount} onChange={(event) => setNewPlan((prev) => ({ ...prev, unitAmount: Number(event.target.value || 0) }))} className="r-text-sm" />
              <Input placeholder="Currency" value={newPlan.currency} onChange={(event) => setNewPlan((prev) => ({ ...prev, currency: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Credit count" type="number" value={newPlan.creditCount} onChange={(event) => setNewPlan((prev) => ({ ...prev, creditCount: Number(event.target.value || 1) }))} className="r-text-sm" />
              <Input placeholder="Interval: one_time | month | year" value={newPlan.interval} onChange={(event) => setNewPlan((prev) => ({ ...prev, interval: event.target.value as EditablePlan['interval'] }))} className="r-text-sm" />
              <Button onClick={createPlan} disabled={!isAuthenticated} className="r-text-sm">Add Plan</Button>
            </div>

            <div className="r-space-y-sm">
              {plans.map((plan) => (
                <div key={plan.id} className="grid r-gap-xs rounded-md border r-p-sm md:grid-cols-5">
                  <Input value={plan.name} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, name: event.target.value } : item)))} className="r-text-sm" />
                  <Input value={plan.toolId} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, toolId: event.target.value } : item)))} className="r-text-sm" />
                  <Input value={plan.stripePriceId} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, stripePriceId: event.target.value } : item)))} className="r-text-sm" />
                  <Input type="number" value={plan.unitAmount} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, unitAmount: Number(event.target.value || 0) } : item)))} className="r-text-sm" />
                  <Input type="number" value={plan.creditCount} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, creditCount: Number(event.target.value || 1) } : item)))} className="r-text-sm" />
                  <Input value={plan.currency} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, currency: event.target.value } : item)))} className="r-text-sm" />
                  <Input value={plan.interval} onChange={(event) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, interval: event.target.value as EditablePlan['interval'] } : item)))} className="r-text-sm" />
                  <div className="flex items-center r-gap-xs">
                    <Label htmlFor={`plan-active-${plan.id}`} className="r-text-sm">Active</Label>
                    <Checkbox id={`plan-active-${plan.id}`} checked={plan.active} onCheckedChange={(checked) => setPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, active: Boolean(checked) } : item)))} />
                  </div>
                  <Button onClick={() => savePlan(plan)} disabled={!isAuthenticated} className="r-text-sm">Save</Button>
                  <Button variant="destructive" onClick={() => deletePlan(plan.id)} disabled={!isAuthenticated} className="r-text-sm">Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="r-text-lg">Integrated Tools</CardTitle>
            <CardDescription className="r-text-sm">List all tools where billing and Stripe are integrated.</CardDescription>
          </CardHeader>
          <CardContent className="r-space-y">
            <div className="grid r-gap-xs rounded-md border r-p-sm md:grid-cols-4">
              <Input placeholder="Tool name" value={newTool.name} onChange={(event) => setNewTool((prev) => ({ ...prev, name: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Description" value={newTool.description} onChange={(event) => setNewTool((prev) => ({ ...prev, description: event.target.value }))} className="r-text-sm" />
              <Input placeholder="Base URL" value={newTool.baseUrl} onChange={(event) => setNewTool((prev) => ({ ...prev, baseUrl: event.target.value }))} className="r-text-sm" />
              <Button onClick={createTool} disabled={!isAuthenticated} className="r-text-sm">Add Tool</Button>
            </div>

            <div className="r-space-y-sm">
              {tools.map((tool) => (
                <div key={tool.id} className="grid r-gap-xs rounded-md border r-p-sm md:grid-cols-5">
                  <Input value={tool.id} disabled className="r-text-sm" />
                  <Input value={tool.name} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, name: event.target.value } : item)))} className="r-text-sm" />
                  <Input value={tool.description || ''} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, description: event.target.value } : item)))} className="r-text-sm" />
                  <Input value={tool.baseUrl || ''} onChange={(event) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, baseUrl: event.target.value } : item)))} className="r-text-sm" />
                  <div className="flex items-center r-gap-xs">
                    <Label htmlFor={`tool-active-${tool.id}`} className="r-text-sm">Active</Label>
                    <Checkbox id={`tool-active-${tool.id}`} checked={tool.active} onCheckedChange={(checked) => setTools((prev) => prev.map((item) => (item.id === tool.id ? { ...item, active: Boolean(checked) } : item)))} />
                  </div>
                  <Button onClick={() => saveTool(tool)} disabled={!isAuthenticated} className="r-text-sm">Save</Button>
                  <Button variant="destructive" onClick={() => deleteTool(tool.id)} disabled={!isAuthenticated} className="r-text-sm">Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
