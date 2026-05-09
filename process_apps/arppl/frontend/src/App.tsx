import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './App.css'

type DeviationStats = {
  min: number
  max: number
  mean: number
  mean_abs: number
  rmse: number
  p95_abs: number
}

type RegistrationResponse = {
  transform: number[][]
  iterations: number
  final_energy: number
  out_of_tolerance: number
  scale: number
  u_final: number
  nu_final: number
  elapsed_seconds: number
  transformed_source_points: number[][]
  target_points: number[][]
  signed_deviations: number[]
  deviation_stats: DeviationStats
  visual_sample_size: number
  input_parameters: Record<string, unknown>
  output_parameters: Record<string, unknown>
  record_dir: string
  record_files: Record<string, string>
}

type ExperimentRecord = {
  id: string
  created_at: string
  loss_name: string
  llotp: number | null
  elapsed_seconds: number | null
  rmse: number | null
  source_file: string
  target_file: string
  input_parameters: Record<string, unknown>
  output_parameters: Record<string, unknown>
  record_dir: string
  record_files: Record<string, string>
}

type RecordVisualResponse = ExperimentRecord & {
  transformed_source_points: number[][]
  target_points: number[][]
  signed_deviations: number[]
  deviation_stats: DeviationStats
  visual_sample_size: number
}

export type ArpplAppMode = 'standalone' | 'workflow'

export type ArpplAppInitialData = {
  result?: RegistrationResponse | null
  records?: ExperimentRecord[]
}

export type ArpplAppProps = {
  // standalone keeps the current full application; workflow trims local record
  // management so the host platform can use the component as an embedded panel.
  mode?: ArpplAppMode
  initialData?: ArpplAppInitialData
  apiBase?: string
}

type ViewerProps = {
  sourcePoints: number[][]
  targetPoints: number[][]
  deviations: number[]
  colorMin: number
  colorMax: number
  pointSize: number
  showTarget: boolean
}

const DEFAULT_API_BASE = resolveDefaultApiBase()
const ALPHA_SYMBOL = '\u03B1'
const ALPHA_MIN = -8
const ALPHA_MAX = 2
const ALPHA_TICKS = [
  { value: -8, label: 'Welsch' },
  { value: -2, label: 'GM' },
  { value: 0, label: 'Charb.' },
  { value: 1, label: 'Cauchy' },
  { value: 2, label: 'L2' },
]

export function App({ mode = 'standalone', initialData, apiBase = DEFAULT_API_BASE }: ArpplAppProps) {
  const normalizedApiBase = apiBase.replace(/\/$/, '')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [u, setU] = useState('0.001')
  const [alphaValue, setAlphaValue] = useState(-8)
  const [valueN, setValueN] = useState('-0.2')
  const [valueP, setValueP] = useState('20')
  const [maxOuter, setMaxOuter] = useState('30')
  const [registrationSampleSize, setRegistrationSampleSize] = useState('0')
  const [visualSampleSize, setVisualSampleSize] = useState('20000')
  const [colorMin, setColorMin] = useState('-0.2')
  const [colorMax, setColorMax] = useState('20')
  const [pointSize, setPointSize] = useState(2.2)
  const [showTarget, setShowTarget] = useState(true)
  const [previewSourcePoints, setPreviewSourcePoints] = useState<number[][]>([])
  const [previewTargetPoints, setPreviewTargetPoints] = useState<number[][]>([])
  const [result, setResult] = useState<RegistrationResponse | null>(initialData?.result ?? null)
  const [records, setRecords] = useState<ExperimentRecord[]>(initialData?.records ?? [])
  const [selectedRecord, setSelectedRecord] = useState<ExperimentRecord | null>(null)
  const [status, setStatus] = useState('ready')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [error, setError] = useState('')

  const canRun = sourceFile !== null && targetFile !== null && status !== 'running' && status !== 'loading'

  const loadRecords = useCallback(async () => {
    try {
      const response = await fetch(`${normalizedApiBase}/records`)
      if (!response.ok) {
        setBackendStatus('offline')
        return
      }
      const data = (await response.json()) as { records: ExperimentRecord[] }
      setBackendStatus('online')
      setRecords(data.records)
    } catch {
      setBackendStatus('offline')
      // The comparison table is auxiliary; keep the main registration UI usable.
    }
  }, [normalizedApiBase])

  useEffect(() => {
    if (mode !== 'standalone') return
    let ignore = false
    fetch(`${normalizedApiBase}/records`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { records?: ExperimentRecord[] } | null) => {
        if (ignore) return
        setBackendStatus(data?.records ? 'online' : 'offline')
        if (data?.records) setRecords(data.records)
      })
      .catch(() => {
        if (!ignore) setBackendStatus('offline')
        // Initial history loading is auxiliary; manual refresh still reports errors through the UI flow.
      })
    return () => {
      ignore = true
    }
  }, [mode, normalizedApiBase])

  async function clearRecords() {
    if (!window.confirm('Clear all experiment records?')) return
    setError('')
    try {
      const response = await fetch(`${normalizedApiBase}/records`, { method: 'DELETE' })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail ?? `HTTP ${response.status}`)
      }
      setRecords([])
      setSelectedRecord(null)
      setResult(null)
      await loadRecords()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not clear experiment records')
    }
  }

  async function viewRecord(record: ExperimentRecord) {
    setStatus('loading')
    setError('')
    try {
      const response = await fetch(`${normalizedApiBase}/records/${encodeURIComponent(record.id)}/visual`)
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail ?? `HTTP ${response.status}`)
      }
      const data = (await response.json()) as RecordVisualResponse
      const deviations = data.signed_deviations ?? []
      const stats = normalizeDeviationStats(data.deviation_stats, deviations)
      setSelectedRecord(data)
      setResult({
        transform: [],
        iterations: numberFromUnknown(data.output_parameters.iterations, 0),
        final_energy: numberFromUnknown(data.output_parameters.final_energy, 0),
        out_of_tolerance: data.llotp ?? numberFromUnknown(data.output_parameters.llotp, 0),
        scale: numberFromUnknown(data.output_parameters.scale, 1),
        u_final: numberFromUnknown(data.output_parameters.mu_final, 0),
        nu_final: numberFromUnknown(data.output_parameters.sigma_final, 0),
        elapsed_seconds: data.elapsed_seconds ?? numberFromUnknown(data.output_parameters.elapsed_seconds, 0),
        transformed_source_points: data.transformed_source_points ?? [],
        target_points: data.target_points ?? [],
        signed_deviations: deviations,
        deviation_stats: stats,
        visual_sample_size: data.visual_sample_size ?? data.transformed_source_points.length,
        input_parameters: data.input_parameters,
        output_parameters: data.output_parameters,
        record_dir: data.record_dir,
        record_files: data.record_files,
      })
      setColorMin(formatNumber(stats.min))
      setColorMax(formatNumber(stats.max))
      setStatus('done')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not load record visual data')
    }
  }

  async function handleSourceFile(file: File | null) {
    setSourceFile(file)
    setResult(null)
    setPreviewSourcePoints([])
    if (!file) return
    await loadPreview(file, setPreviewSourcePoints, 20260425)
  }

  async function handleTargetFile(file: File | null) {
    setTargetFile(file)
    setResult(null)
    setPreviewTargetPoints([])
    if (!file) return
    await loadPreview(file, setPreviewTargetPoints, 20260426)
  }

  async function loadPreview(file: File, setPoints: (points: number[][]) => void, seed: number) {
    setStatus('loading')
    setError('')
    try {
      const maxPoints = Number.parseInt(visualSampleSize, 10) || 20000
      const points = await parsePlyPreview(file, maxPoints, seed)
      setPoints(points)
      setStatus('ready')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Could not preview PLY file')
    }
  }

  async function runRegistration() {
    if (!sourceFile || !targetFile) return
    setStatus('running')
    setError('')
    setResult(null)

    const form = new FormData()
    form.append('source', sourceFile)
    form.append('target', targetFile)
    form.append('u', u)
    form.append('alpha', alphaFormValue(alphaValue))
    form.append('value_n', valueN)
    form.append('value_p', valueP)
    form.append('max_outer', maxOuter)
    form.append('max_inner', '6')
    form.append('stop', '0.00001')
    form.append('use_anderson', 'true')
    form.append('registration_sample_size', registrationSampleSize)
    form.append('visual_sample_size', visualSampleSize)

    try {
      const response = await fetch(`${normalizedApiBase}/register-files`, {
        method: 'POST',
        body: form,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail ?? `HTTP ${response.status}`)
      }
      const data = (await response.json()) as RegistrationResponse
      setResult(data)
      setColorMin(formatNumber(data.deviation_stats.min))
      setColorMax(formatNumber(data.deviation_stats.max))
      setStatus('done')
      await loadRecords()
      setSelectedRecord({
        id: data.record_dir.split(/[\\/]/).pop() ?? data.record_dir,
        created_at: '',
        loss_name: String(data.input_parameters.loss_name ?? ''),
        llotp: data.out_of_tolerance,
        elapsed_seconds: data.elapsed_seconds,
        rmse: data.deviation_stats.rmse,
        source_file: String(data.input_parameters.source_file ?? ''),
        target_file: String(data.input_parameters.target_file ?? ''),
        input_parameters: data.input_parameters,
        output_parameters: data.output_parameters,
        record_dir: data.record_dir,
        record_files: data.record_files,
      })
    } catch (caught) {
      const message = caught instanceof TypeError && caught.message === 'Failed to fetch'
        ? backendConnectionMessage(normalizedApiBase)
        : caught instanceof Error
          ? caught.message
          : 'Registration failed'
      setError(message)
      setStatus('error')
    }
  }

  const colorBounds = useMemo(
    () => ({
      min: Number.parseFloat(colorMin),
      max: Number.parseFloat(colorMax),
    }),
    [colorMin, colorMax],
  )

  return (
    <main className={`app-shell app-shell--${mode}`}>
      <section className="workbench">
        <aside className="control-panel">
          <div className="brand-row">
            <div>
              <h1>ARPPL</h1>
              <p>Point-to-plane registration</p>
              <small className={`backend-indicator backend-${backendStatus}`}>Backend: {backendStatus}</small>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="field-stack">
            <FileField label="Source PLY" file={sourceFile} onChange={handleSourceFile} />
            <FileField label="Target PLY" file={targetFile} onChange={handleTargetFile} />
          </div>

          <div className="param-grid">
            <NumberField label="u" value={u} onChange={setU} />
            <label className="alpha-field">
              <span>{ALPHA_SYMBOL} loss</span>
              <input
                type="range"
                min={ALPHA_MIN}
                max={ALPHA_MAX}
                step="0.1"
                value={alphaValue}
                onChange={(event) => setAlphaValue(Number(event.target.value))}
              />
              <div className="loss-ticks" aria-hidden="true">
                {ALPHA_TICKS.map((tick) => (
                  <span
                    className="loss-tick"
                    key={tick.label}
                    style={{ left: `${alphaTickPosition(tick.value)}%` }}
                  >
                    <i />
                  </span>
                ))}
              </div>
              <strong>{alphaLabel(alphaValue)}</strong>
            </label>
            <NumberField label="Lower tol" value={valueN} onChange={setValueN} />
            <NumberField label="Upper tol" value={valueP} onChange={setValueP} />
            <NumberField label="Outer iter" value={maxOuter} onChange={setMaxOuter} />
            <NumberField label="Reg pts (0=full)" value={registrationSampleSize} onChange={setRegistrationSampleSize} />
            <NumberField label="Visual pts" value={visualSampleSize} onChange={setVisualSampleSize} />
          </div>

          <button className="run-button" type="button" disabled={!canRun} onClick={runRegistration}>
            {status === 'running' ? 'Running...' : status === 'loading' ? 'Loading preview...' : 'Run registration'}
          </button>

          {error && <div className="error-box">{error}</div>}

          <section className="metric-panel">
            <Metric label="LLOTP" value={result ? `${(result.out_of_tolerance * 100).toFixed(2)}%` : '--'} />
            <Metric label="Iterations" value={result ? String(result.iterations) : '--'} />
            <Metric label="Time" value={result ? `${result.elapsed_seconds.toFixed(1)}s` : '--'} />
            <Metric label="RMSE" value={result ? formatNumber(result.deviation_stats.rmse) : '--'} />
          </section>
          {mode === 'standalone' && (
            <ExperimentTable
              records={records}
              selectedRecord={selectedRecord}
              onSelect={viewRecord}
              onRefresh={loadRecords}
              onClear={clearRecords}
            />
          )}
        </aside>

        <section className="viewer-panel">
          <header className="viewer-toolbar">
            <div>
              <h2>Deviation Map</h2>
              <p>
                {result
                  ? `${result.visual_sample_size.toLocaleString()} colored source points`
                  : previewSourcePoints.length
                    ? `${previewSourcePoints.length.toLocaleString()} preview source points`
                    : 'Awaiting data'}
              </p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={showTarget} onChange={(event) => setShowTarget(event.target.checked)} />
              <span>Target</span>
            </label>
          </header>

          <PointCloudViewer
            sourcePoints={result?.transformed_source_points ?? previewSourcePoints}
            targetPoints={result?.target_points ?? previewTargetPoints}
            deviations={result?.signed_deviations ?? []}
            colorMin={Number.isFinite(colorBounds.min) ? colorBounds.min : -1}
            colorMax={Number.isFinite(colorBounds.max) ? colorBounds.max : 1}
            pointSize={pointSize}
            showTarget={showTarget}
          />

          <footer className="color-controls">
            <NumberField label="Color min" value={colorMin} onChange={setColorMin} />
            <div className="legend">
              <span>{colorMin}</span>
              <div className="legend-ramp" style={legendRampStyle(colorBounds.min, colorBounds.max)} />
              <span>{colorMax}</span>
            </div>
            <NumberField label="Color max" value={colorMax} onChange={setColorMax} />
            <label className="range-field">
              <span>Point size</span>
              <input
                type="range"
                min="1"
                max="6"
                step="0.2"
                value={pointSize}
                onChange={(event) => setPointSize(Number(event.target.value))}
              />
            </label>
          </footer>
        </section>
      </section>
    </main>
  )
}

function PointCloudViewer({ sourcePoints, targetPoints, deviations, colorMin, colorMax, pointSize, showTarget }: ViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const sourceRef = useRef<THREE.Points | null>(null)
  const targetRef = useRef<THREE.Points | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f7f8fb')
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100000)
    camera.position.set(0, -1800, 900)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = true

    const light = new THREE.HemisphereLight('#ffffff', '#d8dde8', 2)
    scene.add(light)
    scene.add(new THREE.AxesHelper(250))

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera
    controlsRef.current = controls

    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let frame = 0
    const animate = () => {
      frame = window.requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      scene.traverse(disposeThreeObject)
      renderer.dispose()
      // Micro-frontend hosts can mount/unmount this panel many times. Force the
      // WebGL context to release GPU memory before the host removes the canvas.
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!scene || !camera || !controls) return

    if (sourceRef.current) {
      scene.remove(sourceRef.current)
      disposeThreeObject(sourceRef.current)
      sourceRef.current = null
    }
    if (targetRef.current) {
      scene.remove(targetRef.current)
      disposeThreeObject(targetRef.current)
      targetRef.current = null
    }

    if (!sourcePoints.length) return

    const sourceGeometry = makeColoredGeometry(sourcePoints, deviations, colorMin, colorMax)
    const sourceMaterial = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: false,
    })
    const sourceCloud = new THREE.Points(sourceGeometry, sourceMaterial)
    scene.add(sourceCloud)
    sourceRef.current = sourceCloud

    if (targetPoints.length) {
      const targetGeometry = makeSolidGeometry(targetPoints, [30 / 255, 144 / 255, 255 / 255])
      const targetMaterial = new THREE.PointsMaterial({
        size: Math.max(1, pointSize - 0.4),
        color: '#1E90FF',
        transparent: true,
        opacity: 0.42,
        sizeAttenuation: false,
      })
      const targetCloud = new THREE.Points(targetGeometry, targetMaterial)
      targetCloud.visible = showTarget
      scene.add(targetCloud)
      targetRef.current = targetCloud
    }

    const box = new THREE.Box3().setFromObject(sourceCloud)
    if (targetRef.current) box.expandByObject(targetRef.current)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()
    controls.target.copy(center)
    camera.position.copy(center).add(new THREE.Vector3(0, -size * 0.9, size * 0.45))
    camera.near = Math.max(size / 10000, 0.01)
    camera.far = Math.max(size * 10, 1000)
    camera.updateProjectionMatrix()
    controls.update()
  }, [sourcePoints, targetPoints, deviations, colorMin, colorMax, pointSize, showTarget])

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.visible = showTarget
    }
  }, [showTarget])

  return (
    <div className="viewer-host" ref={hostRef}>
      {!sourcePoints.length && <div className="empty-state">No result loaded</div>}
    </div>
  )
}

function disposeThreeObject(object: THREE.Object3D) {
  const meshLike = object as THREE.Object3D & {
    geometry?: THREE.BufferGeometry
    material?: THREE.Material | THREE.Material[]
  }
  meshLike.geometry?.dispose()
  if (Array.isArray(meshLike.material)) {
    meshLike.material.forEach((material) => material.dispose())
  } else {
    meshLike.material?.dispose()
  }
}

function makeColoredGeometry(points: number[][], deviations: number[], min: number, max: number) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(points.length * 3)
  const colors = new Float32Array(points.length * 3)
  const upper = max > min ? max : min + 1

  points.forEach((point, index) => {
    positions[index * 3] = point[0]
    positions[index * 3 + 1] = point[1]
    positions[index * 3 + 2] = point[2]
    const color: [number, number, number] =
      deviations.length === points.length
        ? deviationColor(deviations[index] ?? 0, min, upper)
        : [218 / 255, 165 / 255, 32 / 255]
    colors[index * 3] = color[0]
    colors[index * 3 + 1] = color[1]
    colors[index * 3 + 2] = color[2]
  })

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  return geometry
}

function makeSolidGeometry(points: number[][], color: [number, number, number]) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(points.length * 3)
  const colors = new Float32Array(points.length * 3)

  points.forEach((point, index) => {
    positions[index * 3] = point[0]
    positions[index * 3 + 1] = point[1]
    positions[index * 3 + 2] = point[2]
    colors[index * 3] = color[0]
    colors[index * 3 + 1] = color[1]
    colors[index * 3 + 2] = color[2]
  })

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  return geometry
}

function deviationColor(value: number, min: number, max: number): [number, number, number] {
  const white: [number, number, number] = [0.98, 0.99, 1.0]
  const negative: [number, number, number] = [0.08, 0.28, 0.78]
  const positive: [number, number, number] = [0.82, 0.12, 0.16]
  if (value < 0) {
    const lower = Math.min(min, 0)
    const k = lower < 0 ? clamp((value - lower) / -lower, 0, 1) : 1
    return mix(negative, white, k)
  }
  const upper = Math.max(max, 0)
  const k = upper > 0 ? clamp(value / upper, 0, 1) : 0
  return mix(white, positive, k)
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (file: File | null) => void }) {
  return (
    <label className="file-field">
      <span>{label}</span>
      <input
        type="file"
        accept=".ply,.obj"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <strong>{file ? file.name : 'Choose file'}</strong>
    </label>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ExperimentTable({
  records,
  selectedRecord,
  onSelect,
  onRefresh,
  onClear,
}: {
  records: ExperimentRecord[]
  selectedRecord: ExperimentRecord | null
  onSelect: (record: ExperimentRecord) => Promise<void>
  onRefresh: () => Promise<void>
  onClear: () => Promise<void>
}) {
  const detailRecord = selectedRecord

  return (
    <section className="experiment-panel">
      <div className="experiment-head">
        <h3>Experiments</h3>
        <div className="experiment-actions">
          <button type="button" onClick={() => void onRefresh()}>
            Refresh
          </button>
          <button className="clear-button" type="button" disabled={!records.length} onClick={() => void onClear()}>
            Clear
          </button>
        </div>
      </div>

      {records.length ? (
        <div className="experiment-table-wrap">
          <table className="experiment-table">
            <thead>
              <tr>
                <th>loss_name</th>
                <th>LLOTP</th>
                <th>Time</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isSelected = detailRecord?.id === record.id
                return (
                  <tr className={isSelected ? 'selected-row' : undefined} key={record.id}>
                    <td title={record.loss_name}>{compactLossName(record.loss_name)}</td>
                    <td>{formatPercent(record.llotp)}</td>
                    <td>{formatSeconds(record.elapsed_seconds)}</td>
                    <td>
                      <button className="detail-button" type="button" onClick={() => void onSelect(record)}>
                        {isSelected ? 'Viewing' : 'View'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="record-empty">No experiment record yet.</p>
      )}

      {detailRecord && (
        <div className="record-content experiment-detail">
          <div className="record-path">
            <span>Record folder</span>
            <strong title={detailRecord.record_dir}>{detailRecord.record_dir}</strong>
          </div>
          <RecordTable title="Input" rows={compactEntries(detailRecord.input_parameters)} />
          <RecordTable title="Output" rows={compactEntries(detailRecord.output_parameters)} />
          <RecordTable title="Files" rows={Object.entries(detailRecord.record_files ?? {})} />
        </div>
      )}
    </section>
  )
}

function RecordTable({ title, rows }: { title: string; rows: [string, unknown][] }) {
  return (
    <section className="record-table">
      <h3>{title}</h3>
      {rows.map(([key, value]) => (
        <div className="record-row" key={`${title}-${key}`}>
          <span>{key}</span>
          <strong title={String(value)}>{formatRecordValue(value)}</strong>
        </div>
      ))}
    </section>
  )
}

function compactEntries(value: Record<string, unknown>) {
  return Object.entries(value).filter((entry) => entry[1] !== null && entry[1] !== undefined)
}

function formatRecordValue(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : formatNumber(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value) >= 100) return value.toFixed(2)
  if (Math.abs(value) >= 1) return value.toFixed(4)
  return value.toPrecision(4)
}

function formatSeconds(value: number | null) {
  return value === null || !Number.isFinite(value) ? '--' : `${value.toFixed(1)}s`
}

function formatPercent(value: number | null) {
  return value === null || !Number.isFinite(value) ? '--' : `${(value * 100).toFixed(2)}%`
}

function numberFromUnknown(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function backendConnectionMessage(apiBase: string) {
  if (apiBase.startsWith('/')) {
    return `Cannot reach backend gateway at ${apiBase}. Start docker compose so Nginx exposes /api/process-a, then retry.`
  }
  return `Cannot reach backend at ${apiBase}. Start the backend or gateway, then retry.`
}

function resolveDefaultApiBase() {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE
  if (typeof window === 'undefined') return '/api/process-a'
  const { hostname, port } = window.location
  const isLocalFrontendServer = ['127.0.0.1', 'localhost'].includes(hostname) && port && port !== '80'
  if (isLocalFrontendServer) {
    // Vite dev/preview run on their own ports. Point directly at the Docker
    // gateway on port 80 so both / and /platform.html work without relying on
    // dev-server-only proxy behavior.
    return 'http://127.0.0.1/api/process-a'
  }
  return '/api/process-a'
}

function normalizeDeviationStats(value: unknown, deviations: number[]): DeviationStats {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return {
      min: numberFromUnknown(record.min, 0),
      max: numberFromUnknown(record.max, 0),
      mean: numberFromUnknown(record.mean, 0),
      mean_abs: numberFromUnknown(record.mean_abs, 0),
      rmse: numberFromUnknown(record.rmse, 0),
      p95_abs: numberFromUnknown(record.p95_abs, 0),
    }
  }
  if (!deviations.length) {
    return { min: 0, max: 0, mean: 0, mean_abs: 0, rmse: 0, p95_abs: 0 }
  }
  const sum = deviations.reduce((acc, item) => acc + item, 0)
  const absValues = deviations.map(Math.abs).sort((a, b) => a - b)
  const squares = deviations.reduce((acc, item) => acc + item * item, 0)
  const p95Index = Math.min(absValues.length - 1, Math.floor(absValues.length * 0.95))
  return {
    min: Math.min(...deviations),
    max: Math.max(...deviations),
    mean: sum / deviations.length,
    mean_abs: absValues.reduce((acc, item) => acc + item, 0) / absValues.length,
    rmse: Math.sqrt(squares / deviations.length),
    p95_abs: absValues[p95Index],
  }
}

function compactLossName(value: string) {
  const lower = value.toLowerCase()
  if (lower.includes('welsch') || lower.includes('leclerc')) return 'Welsch'
  if (lower.includes('geman')) return 'GM'
  if (lower.includes('charbonnier')) return 'Charb.'
  if (lower.includes('cauchy') || lower.includes('lorentzian')) return 'Cauchy'
  if (lower.includes('l2')) return 'L2'
  return value || '--'
}

function alphaFormValue(value: number) {
  return value <= -7.95 ? '-inf' : value.toFixed(2)
}

function alphaTickPosition(value: number) {
  return ((value - ALPHA_MIN) / (ALPHA_MAX - ALPHA_MIN)) * 100
}

function alphaLabel(value: number) {
  if (value <= -7.95) return `Welsch / Leclerc loss (${ALPHA_SYMBOL}->-inf)`
  if (Math.abs(value - 2) < 0.05) return `L2 loss (${ALPHA_SYMBOL}=2)`
  if (Math.abs(value - 1) < 0.05) return `Cauchy / Lorentzian loss (${ALPHA_SYMBOL}=1)`
  if (Math.abs(value) < 0.05) return `Charbonnier loss (${ALPHA_SYMBOL}=0)`
  if (Math.abs(value + 2) < 0.05) return `Geman-McClure loss (${ALPHA_SYMBOL}=-2)`
  return `General robust loss (${ALPHA_SYMBOL}=${value.toFixed(1)})`
}

function legendRampStyle(min: number, max: number) {
  const lower = Number.isFinite(min) ? min : -1
  const upper = Number.isFinite(max) ? max : 1
  const span = upper > lower ? upper - lower : 1
  const whiteStop = clamp((0 - lower) / span, 0, 1) * 100
  return {
    background: `linear-gradient(90deg, #1447c7 0%, #f9fcff ${whiteStop.toFixed(1)}%, #d11f29 100%)`,
  }
}

async function parsePlyPreview(file: File, maxPoints: number, seed: number) {
  const text = await file.text()
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== 'ply') {
    throw new Error('Only ASCII PLY preview is supported')
  }

  let vertexCount = 0
  let headerEnd = -1
  let inVertexElement = false
  const properties: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()
    if (line.startsWith('format') && !line.includes('ascii')) {
      throw new Error('Only ASCII PLY preview is supported')
    }
    if (line.startsWith('element ')) {
      const parts = line.split(/\s+/)
      inVertexElement = parts[1] === 'vertex'
      if (inVertexElement) vertexCount = Number.parseInt(parts[2], 10)
    } else if (line.startsWith('property ') && inVertexElement) {
      const parts = line.split(/\s+/)
      properties.push(parts[parts.length - 1])
    } else if (line === 'end_header') {
      headerEnd = index + 1
      break
    }
  }

  if (!vertexCount || headerEnd < 0) {
    throw new Error('PLY header is missing vertex metadata')
  }

  const xIndex = properties.indexOf('x')
  const yIndex = properties.indexOf('y')
  const zIndex = properties.indexOf('z')
  if (xIndex < 0 || yIndex < 0 || zIndex < 0) {
    throw new Error('PLY vertices must include x/y/z')
  }

  const ids = sampleIndices(vertexCount, maxPoints, seed)
  return ids
    .map((id) => {
      const parts = lines[headerEnd + id]?.trim().split(/\s+/) ?? []
      return [Number(parts[xIndex]), Number(parts[yIndex]), Number(parts[zIndex])]
    })
    .filter((point) => point.every(Number.isFinite))
}

function sampleIndices(count: number, maxPoints: number, seed: number) {
  if (maxPoints <= 0 || count <= maxPoints) {
    return Array.from({ length: count }, (_value, index) => index)
  }
  const random = seededRandom(seed)
  const selected = new Set<number>()
  while (selected.size < maxPoints) {
    selected.add(Math.floor(random() * count))
  }
  return Array.from(selected).sort((a, b) => a - b)
}

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export default App
