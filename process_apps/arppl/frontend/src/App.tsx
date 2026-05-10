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
  pose: {
    translation_xyz: number[]
    angles_xyz_degrees: number[]
    angles_xyz_radians: number[]
    rotation_matrix: number[][]
    convention: string
  }
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
  emptyLabel: string
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

const APP_COPY = {
  en: {
    alphaField: `${ALPHA_SYMBOL} loss`,
    alphaLabels: {
      cauchy: `Cauchy / Lorentzian loss (${ALPHA_SYMBOL}=1)`,
      charbonnier: `Charbonnier loss (${ALPHA_SYMBOL}=0)`,
      general: (value: number) => `General robust loss (${ALPHA_SYMBOL}=${value.toFixed(1)})`,
      geman: `Geman-McClure loss (${ALPHA_SYMBOL}=-2)`,
      l2: `L2 loss (${ALPHA_SYMBOL}=2)`,
      welsch: `Welsch / Leclerc loss (${ALPHA_SYMBOL}->-inf)`,
    },
    awaitingData: 'Awaiting data',
    backend: 'Backend',
    backendConnectionGateway: (apiBase: string) =>
      `Cannot reach backend gateway at ${apiBase}. Start docker compose so Nginx exposes /api/process-a, then retry.`,
    backendConnectionRemote: (apiBase: string) => `Cannot reach backend at ${apiBase}. Start the backend or gateway, then retry.`,
    backendStatus: {
      checking: 'checking',
      offline: 'offline',
      online: 'online',
    },
    chooseFile: 'Choose file',
    clear: 'Clear',
    clearRecordsConfirm: 'Clear all experiment records?',
    clearRecordsError: 'Could not clear experiment records',
    colorMax: 'Color max',
    colorMin: 'Color min',
    coloredSourcePoints: (count: string) => `${count} colored source points`,
    deviationMap: 'Deviation Map',
    detail: 'Detail',
    emptyViewer: 'No result loaded',
    experiments: 'Experiments',
    files: 'Files',
    input: 'Input',
    iterations: 'Iterations',
    language: 'Language',
    loadingPreview: 'Loading preview...',
    lowerTol: 'Lower tol',
    noRecords: 'No experiment record yet.',
    outerIter: 'Outer iter',
    output: 'Output',
    pointSize: 'Point size',
    pointToPlane: 'Point-to-plane registration',
    previewError: 'Could not preview PLY file',
    previewSourcePoints: (count: string) => `${count} preview source points`,
    recordVisualError: 'Could not load record visual data',
    recordFolder: 'Record folder',
    refresh: 'Refresh',
    regPts: 'Reg pts (0=full)',
    registrationFailed: 'Registration failed',
    rmse: 'RMSE',
    runRegistration: 'Run registration',
    running: 'Running...',
    sourcePly: 'Source PLY',
    status: {
      done: 'done',
      error: 'error',
      loading: 'loading',
      ready: 'ready',
      running: 'running',
    },
    target: 'Target',
    targetPly: 'Target PLY',
    time: 'Time',
    upperTol: 'Upper tol',
    view: 'View',
    viewing: 'Viewing',
    visualPts: 'Visual pts',
  },
  zh: {
    alphaField: `${ALPHA_SYMBOL} 损失函数`,
    alphaLabels: {
      cauchy: `Cauchy / Lorentzian 损失 (${ALPHA_SYMBOL}=1)`,
      charbonnier: `Charbonnier 损失 (${ALPHA_SYMBOL}=0)`,
      general: (value: number) => `通用鲁棒损失 (${ALPHA_SYMBOL}=${value.toFixed(1)})`,
      geman: `Geman-McClure 损失 (${ALPHA_SYMBOL}=-2)`,
      l2: `L2 损失 (${ALPHA_SYMBOL}=2)`,
      welsch: `Welsch / Leclerc 损失 (${ALPHA_SYMBOL}->-inf)`,
    },
    awaitingData: '等待数据',
    backend: '后端',
    backendConnectionGateway: (apiBase: string) =>
      `无法连接后端网关 ${apiBase}。请先启动 docker compose，确保 Nginx 暴露 /api/process-a 后重试。`,
    backendConnectionRemote: (apiBase: string) => `无法连接后端 ${apiBase}。请启动后端或网关后重试。`,
    backendStatus: {
      checking: '检查中',
      offline: '离线',
      online: '在线',
    },
    chooseFile: '选择文件',
    clear: '清空',
    clearRecordsConfirm: '确认清空全部实验记录？',
    clearRecordsError: '无法清空实验记录',
    colorMax: '颜色上限',
    colorMin: '颜色下限',
    coloredSourcePoints: (count: string) => `${count} 个着色源点`,
    deviationMap: '偏差图',
    detail: '详情',
    emptyViewer: '暂无结果',
    experiments: '实验记录',
    files: '文件',
    input: '输入',
    iterations: '迭代次数',
    language: '语言',
    loadingPreview: '正在加载预览...',
    lowerTol: 'Lower tol',
    noRecords: '暂无实验记录。',
    outerIter: '外层迭代',
    output: '输出',
    pointSize: '点尺寸',
    pointToPlane: '点到平面配准',
    previewError: '无法预览 PLY 文件',
    previewSourcePoints: (count: string) => `${count} 个预览源点`,
    recordVisualError: '无法加载记录可视化数据',
    recordFolder: '记录目录',
    refresh: '刷新',
    regPts: '配准点数 (0=全采样)',
    registrationFailed: '配准失败',
    rmse: 'RMSE',
    runRegistration: '运行配准',
    running: '正在运行...',
    sourcePly: '源 PLY',
    status: {
      done: '完成',
      error: '错误',
      loading: '加载中',
      ready: '就绪',
      running: '运行中',
    },
    target: '目标',
    targetPly: '目标 PLY',
    time: '时间',
    upperTol: 'Upper tol',
    view: '查看',
    viewing: '查看中',
    visualPts: '可视化点数',
  },
} as const

type Language = keyof typeof APP_COPY
type AppCopy = (typeof APP_COPY)[Language]

export function App({ mode = 'standalone', initialData, apiBase = DEFAULT_API_BASE }: ArpplAppProps) {
  const normalizedApiBase = apiBase.replace(/\/$/, '')
  const [language, setLanguage] = useState<Language>(() => resolveInitialLanguage())
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
  const copy = APP_COPY[language]

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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('arppl-language', language)
      window.document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    }
  }, [language])

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
    if (!window.confirm(copy.clearRecordsConfirm)) return
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
      setError(caught instanceof Error ? caught.message : copy.clearRecordsError)
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
        pose: {
          translation_xyz: [],
          angles_xyz_degrees: [],
          angles_xyz_radians: [],
          rotation_matrix: [],
          convention: 'Rz(yaw_z) * Ry(pitch_y) * Rx(roll_x)',
        },
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
      setError(caught instanceof Error ? caught.message : copy.recordVisualError)
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
      setError(caught instanceof Error ? caught.message : copy.previewError)
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
        ? backendConnectionMessage(normalizedApiBase, copy)
        : caught instanceof Error
          ? caught.message
          : copy.registrationFailed
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
              <p>{copy.pointToPlane}</p>
              <small className={`backend-indicator backend-${backendStatus}`}>
                {copy.backend}: {copy.backendStatus[backendStatus]}
              </small>
            </div>
            <div className="brand-actions">
              <label className="language-switch">
                <span>{copy.language}</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
              <StatusBadge status={status} labels={copy.status} />
            </div>
          </div>

          <div className="field-stack">
            <FileField label={copy.sourcePly} file={sourceFile} chooseLabel={copy.chooseFile} onChange={handleSourceFile} />
            <FileField label={copy.targetPly} file={targetFile} chooseLabel={copy.chooseFile} onChange={handleTargetFile} />
          </div>

          <div className="param-grid">
            <NumberField label="u" value={u} onChange={setU} />
            <label className="alpha-field">
              <span>{copy.alphaField}</span>
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
              <strong>{alphaLabel(alphaValue, copy)}</strong>
            </label>
            <NumberField label={copy.lowerTol} value={valueN} onChange={setValueN} />
            <NumberField label={copy.upperTol} value={valueP} onChange={setValueP} />
            <NumberField label={copy.outerIter} value={maxOuter} onChange={setMaxOuter} />
            <NumberField label={copy.regPts} value={registrationSampleSize} onChange={setRegistrationSampleSize} />
            <NumberField label={copy.visualPts} value={visualSampleSize} onChange={setVisualSampleSize} />
          </div>

          <button className="run-button" type="button" disabled={!canRun} onClick={runRegistration}>
            {status === 'running' ? copy.running : status === 'loading' ? copy.loadingPreview : copy.runRegistration}
          </button>

          {error && <div className="error-box">{error}</div>}

          <section className="metric-panel">
            <Metric label="LLOTP" value={result ? `${(result.out_of_tolerance * 100).toFixed(2)}%` : '--'} />
            <Metric label={copy.iterations} value={result ? String(result.iterations) : '--'} />
            <Metric label={copy.time} value={result ? `${result.elapsed_seconds.toFixed(1)}s` : '--'} />
            <Metric label="RMSE" value={result ? formatNumber(result.deviation_stats.rmse) : '--'} />
          </section>
          {mode === 'standalone' && (
            <ExperimentTable
              copy={copy}
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
              <h2>{copy.deviationMap}</h2>
              <p>
                {result
                  ? copy.coloredSourcePoints(result.visual_sample_size.toLocaleString())
                  : previewSourcePoints.length
                    ? copy.previewSourcePoints(previewSourcePoints.length.toLocaleString())
                    : copy.awaitingData}
              </p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={showTarget} onChange={(event) => setShowTarget(event.target.checked)} />
              <span>{copy.target}</span>
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
            emptyLabel={copy.emptyViewer}
          />

          <footer className="color-controls">
            <NumberField label={copy.colorMin} value={colorMin} onChange={setColorMin} />
            <div className="legend">
              <span>{colorMin}</span>
              <div className="legend-ramp" style={legendRampStyle(colorBounds.min, colorBounds.max)} />
              <span>{colorMax}</span>
            </div>
            <NumberField label={copy.colorMax} value={colorMax} onChange={setColorMax} />
            <label className="range-field">
              <span>{copy.pointSize}</span>
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

function PointCloudViewer({
  sourcePoints,
  targetPoints,
  deviations,
  colorMin,
  colorMax,
  pointSize,
  showTarget,
  emptyLabel,
}: ViewerProps) {
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
      {!sourcePoints.length && <div className="empty-state">{emptyLabel}</div>}
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

function FileField({
  label,
  file,
  chooseLabel,
  onChange,
}: {
  label: string
  file: File | null
  chooseLabel: string
  onChange: (file: File | null) => void
}) {
  return (
    <label className="file-field">
      <span>{label}</span>
      <input
        type="file"
        accept=".ply,.obj"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <strong>{file ? file.name : chooseLabel}</strong>
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
  copy,
  records,
  selectedRecord,
  onSelect,
  onRefresh,
  onClear,
}: {
  copy: AppCopy
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
        <h3>{copy.experiments}</h3>
        <div className="experiment-actions">
          <button type="button" onClick={() => void onRefresh()}>
            {copy.refresh}
          </button>
          <button className="clear-button" type="button" disabled={!records.length} onClick={() => void onClear()}>
            {copy.clear}
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
                <th>{copy.time}</th>
                <th>{copy.detail}</th>
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
                        {isSelected ? copy.viewing : copy.view}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="record-empty">{copy.noRecords}</p>
      )}

      {detailRecord && (
        <div className="record-content experiment-detail">
          <div className="record-path">
            <span>{copy.recordFolder}</span>
            <strong title={detailRecord.record_dir}>{detailRecord.record_dir}</strong>
          </div>
          <RecordTable title={copy.input} rows={compactEntries(detailRecord.input_parameters)} />
          <RecordTable title={copy.output} rows={compactEntries(detailRecord.output_parameters)} />
          <RecordTable title={copy.files} rows={Object.entries(detailRecord.record_files ?? {})} />
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

function StatusBadge({ status, labels }: { status: string; labels: Readonly<Record<string, string>> }) {
  return <span className={`status-badge status-${status}`}>{labels[status] ?? status}</span>
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

function backendConnectionMessage(apiBase: string, copy: AppCopy) {
  if (apiBase.startsWith('/')) {
    return copy.backendConnectionGateway(apiBase)
  }
  return copy.backendConnectionRemote(apiBase)
}

function resolveDefaultApiBase() {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE
  if (typeof window === 'undefined') return '/api/process-a'
  const { hostname, port } = window.location
  const isLocalFrontendServer = ['127.0.0.1', 'localhost'].includes(hostname) && port && port !== '80'
  if (isLocalFrontendServer) {
    // Vite dev/preview run on their own ports. Point directly at the Docker
    // gateway on port 80 without relying on dev-server-only proxy behavior.
    return 'http://127.0.0.1/api/process-a'
  }
  return '/api/process-a'
}

function resolveInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem('arppl-language')
  if (stored === 'zh' || stored === 'en') return stored
  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
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

function alphaLabel(value: number, copy: AppCopy) {
  if (value <= -7.95) return copy.alphaLabels.welsch
  if (Math.abs(value - 2) < 0.05) return copy.alphaLabels.l2
  if (Math.abs(value - 1) < 0.05) return copy.alphaLabels.cauchy
  if (Math.abs(value) < 0.05) return copy.alphaLabels.charbonnier
  if (Math.abs(value + 2) < 0.05) return copy.alphaLabels.geman
  return copy.alphaLabels.general(value)
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
