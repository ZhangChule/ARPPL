import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ProcessLauncher } from './ProcessLauncher'
import processManifest from './processManifest'
import './index.css'
import './platform.css'

type WorkflowRunState = {
  status: 'idle' | 'running' | 'succeeded' | 'failed'
  response: unknown
  error: string
}

const API_BASE = resolvePlatformApiBase()
const WORKFLOW_BASE = `${API_BASE}/workflow`

export function WorkflowPlatformDemo() {
  const [runState, setRunState] = useState<WorkflowRunState>({ status: 'idle', response: null, error: '' })
  const [serviceManifest, setServiceManifest] = useState<unknown>(null)
  const [manifestStatus, setManifestStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    let ignore = false
    fetch(`${WORKFLOW_BASE}/manifest`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: unknown) => {
        if (ignore) return
        setServiceManifest(body)
        setManifestStatus(body ? 'online' : 'offline')
      })
      .catch(() => {
        if (!ignore) setManifestStatus('offline')
      })
    return () => {
      ignore = true
    }
  }, [])

  async function runHeadlessNode() {
    setRunState({ status: 'running', response: null, error: '' })
    try {
      const response = await fetch(`${WORKFLOW_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: processManifest.id,
          trace_id: `demo-${Date.now()}`,
          payload: {
            source_points: [
              [0, 0, 0],
              [1, 0, 0],
              [0, 1, 0],
            ],
            target_points: [
              [0, 0, 0],
              [1, 0, 0],
              [0, 1, 0],
            ],
            target_normals: [
              [0, 0, 1],
              [0, 0, 1],
              [0, 0, 1],
            ],
            max_outer: 1,
            max_inner: 1,
            return_points: false,
          },
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.detail ?? `HTTP ${response.status}`)
      setRunState({ status: 'succeeded', response: body, error: '' })
    } catch (caught) {
      setRunState({
        status: 'failed',
        response: null,
        error: caught instanceof Error ? caught.message : 'Workflow execution failed',
      })
    }
  }

  return (
    <main className="platform-shell">
      <header className="platform-topbar">
        <div>
          <span>Workflow Platform</span>
          <h1>Process Workspace</h1>
        </div>
        <code>{API_BASE}</code>
      </header>

      <section className="platform-layout">
        <aside className="process-catalog">
          <div className="catalog-head">
            <span>Catalog</span>
            <strong>Process apps</strong>
          </div>
          <button className="catalog-item selected" type="button">
            <span>{processManifest.id}</span>
            <strong>{processManifest.name}</strong>
          </button>
          <button className="catalog-item" type="button" disabled>
            <span>reserved</span>
            <strong>Next process app</strong>
          </button>
        </aside>

        <section className="platform-main">
          <section className="platform-metrics">
            <Metric label="Service" value={manifestStatus} />
            <Metric label="Version" value={processManifest.version} />
            <Metric label="Remote" value={processManifest.remote.entry} />
          </section>

          <section className="platform-actions">
            <div className="action-row">
              <div>
                <span>Headless API</span>
                <strong>{processManifest.endpoints.workflowRun}</strong>
              </div>
              <button type="button" onClick={() => void runHeadlessNode()} disabled={runState.status === 'running'}>
                {runState.status === 'running' ? 'Running...' : 'Run'}
              </button>
            </div>

            <ProcessLauncher apiBase={API_BASE} />
          </section>

          <section className="platform-result">
            <header>
              <div>
                <span>Run result</span>
                <strong>{runState.status}</strong>
              </div>
            </header>
            {runState.error && <p className="platform-error">{runState.error}</p>}
            <pre>{JSON.stringify(runState.response ?? { status: runState.status }, null, 2)}</pre>
          </section>

          <section className="platform-result">
            <header>
              <div>
                <span>Service manifest</span>
                <strong>{manifestStatus}</strong>
              </div>
            </header>
            <pre>{JSON.stringify(serviceManifest ?? processManifest, null, 2)}</pre>
          </section>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="platform-metric">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  )
}

createRoot(document.getElementById('platform-root')!).render(
  <StrictMode>
    <WorkflowPlatformDemo />
  </StrictMode>,
)

function resolvePlatformApiBase() {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE
  const { hostname, port } = window.location
  const isLocalFrontendServer = ['127.0.0.1', 'localhost'].includes(hostname) && port && port !== '80'
  return isLocalFrontendServer ? 'http://127.0.0.1/api/process-a' : '/api/process-a'
}
