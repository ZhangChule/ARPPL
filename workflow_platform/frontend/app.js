const translations = {
  zh: {
    'actions.clearLinks': '清空连线',
    'actions.close': '关闭',
    'actions.configure': '配置节点',
    'actions.load': '加载工艺',
    'actions.openApp': '打开独立 App',
    'actions.resetLayout': '重置布局',
    'actions.run': '运行流程',
    'actions.save': '保存配置',
    'canvas.label': '画布',
    'catalog.label': '工艺库',
    'catalog.title': '可用工艺 App',
    'dialog.fileHint': '选择 source/target 后，平台会读取模型格式、点数、法向与包围盒，便于确认输入对象。',
    'dialog.inputTitle': '配置输入节点',
    'dialog.outputTitle': '查看输出节点',
    'dialog.processTitle': '配置 ARPPL 工艺节点',
    'edge.from': '从',
    'edge.to': '到',
    'endpoint.label': '服务地址',
    'field.bbox': '包围盒',
    'field.format': '格式',
    'field.no': '无',
    'field.normals': '法向',
    'field.points': '点数',
    'field.unknown': '未知',
    'field.yes': '有',
    'files.geometry': '几何信息',
    'files.source': '源点云',
    'files.target': '目标点云',
    'files.unselected': '未选择',
    'inspector.label': '检查器',
    'language.label': '语言',
    'mode.saved': '保存记录模式',
    'mode.stateless': '无状态模式',
    'node.input': '输入',
    'node.inputMeta': 'source / target',
    'node.inputName': '点云文件',
    'node.output': '输出',
    'node.outputMeta': 'matrix / xyz / angles',
    'node.outputName': '位姿结果',
    'node.process': '工艺',
    'node.processMeta': 'ARPPL register-files',
    'palette.next': '下一个工艺 App',
    'palette.reserved': '预留',
    'param.alpha': '鲁棒损失 alpha',
    'param.full': '全采样',
    'param.half': '1/2 采样',
    'param.help': '参数说明',
    'param.helpText': 'u 是 ARPPL 位移偏置；alpha 控制鲁棒损失类型；Lower/Upper tol 对应独立 App 的 lower tolerance / upper tolerance；采样比例只影响配准输入点数，默认全采样；visual pts 只影响结果可视化点数。',
    'param.lowerTol': 'Lower tol',
    'param.persist': '保存结果到独立 App 记录',
    'param.quarter': '1/4 采样',
    'param.sampleRatio': '配准采样比例',
    'param.upperTol': 'Upper tol',
    'param.visualPts': 'visual pts',
    'result.empty': '暂无结果',
    'result.matrix': '变换矩阵',
    'result.pose': '位姿',
    'result.raw': '原始输出',
    'result.record': '结果记录',
    'result.sourceTarget': '输入模型',
    'status.connecting': '请选择目标输入端口',
    'status.done': '执行成功',
    'status.geometry': '正在读取几何',
    'status.loading': '正在加载 manifest',
    'status.noLinks': '请先连接输入、工艺、输出节点',
    'status.ready': '就绪',
    'status.running': '正在运行',
    'status.saved': '配置已保存',
    'topbar.label': '公共工作流平台',
    'topbar.title': '工艺流程画布',
  },
  en: {
    'actions.clearLinks': 'Clear Links',
    'actions.close': 'Close',
    'actions.configure': 'Configure Node',
    'actions.load': 'Load Process',
    'actions.openApp': 'Open App',
    'actions.resetLayout': 'Reset Layout',
    'actions.run': 'Run Workflow',
    'actions.save': 'Save',
    'canvas.label': 'Canvas',
    'catalog.label': 'Catalog',
    'catalog.title': 'Process Apps',
    'dialog.fileHint': 'After selecting source/target, the platform reads format, point count, normals, and bounding box so the input can be checked.',
    'dialog.inputTitle': 'Configure Input Node',
    'dialog.outputTitle': 'Inspect Output Node',
    'dialog.processTitle': 'Configure ARPPL Process Node',
    'edge.from': 'From',
    'edge.to': 'To',
    'endpoint.label': 'API Base',
    'field.bbox': 'Bounding Box',
    'field.format': 'Format',
    'field.no': 'No',
    'field.normals': 'Normals',
    'field.points': 'Points',
    'field.unknown': 'Unknown',
    'field.yes': 'Yes',
    'files.geometry': 'Geometry',
    'files.source': 'Source Cloud',
    'files.target': 'Target Cloud',
    'files.unselected': 'Not Selected',
    'inspector.label': 'Inspector',
    'language.label': 'Language',
    'mode.saved': 'Saved Record Mode',
    'mode.stateless': 'Stateless Mode',
    'node.input': 'Input',
    'node.inputMeta': 'source / target',
    'node.inputName': 'Point Cloud Files',
    'node.output': 'Output',
    'node.outputMeta': 'matrix / xyz / angles',
    'node.outputName': 'Pose Result',
    'node.process': 'Process',
    'node.processMeta': 'ARPPL register-files',
    'palette.next': 'Next Process App',
    'palette.reserved': 'Reserved',
    'param.alpha': 'Robust loss alpha',
    'param.full': 'Full sampling',
    'param.half': '1/2 sampling',
    'param.help': 'Parameter Help',
    'param.helpText': 'u is the ARPPL displacement bias; alpha controls the robust loss; Lower/Upper tol match the standalone app tolerance fields; sampling ratio only changes registration input size and defaults to full; visual pts only changes result visualization size.',
    'param.lowerTol': 'Lower tol',
    'param.persist': 'Save result to standalone app records',
    'param.quarter': '1/4 sampling',
    'param.sampleRatio': 'Registration sampling ratio',
    'param.upperTol': 'Upper tol',
    'param.visualPts': 'visual pts',
    'result.empty': 'No Result',
    'result.matrix': 'Transform Matrix',
    'result.pose': 'Pose',
    'result.raw': 'Raw Output',
    'result.record': 'Result Record',
    'result.sourceTarget': 'Input Models',
    'status.connecting': 'Choose a target input port',
    'status.done': 'Succeeded',
    'status.geometry': 'Reading geometry',
    'status.loading': 'Loading manifest',
    'status.noLinks': 'Connect input, process, and output nodes first',
    'status.ready': 'Ready',
    'status.running': 'Running',
    'status.saved': 'Configuration saved',
    'topbar.label': 'Public Workflow Platform',
    'topbar.title': 'Process Graph Canvas',
  },
}

const NODE_WIDTH = 230
const NODE_HEIGHT = 132
const DEFAULT_NODES = {
  input: { x: 96, y: 150 },
  process: { x: 420, y: 150 },
  output: { x: 744, y: 150 },
}
const DEFAULT_EDGES = [
  { from: 'input', to: 'process' },
  { from: 'process', to: 'output' },
]

const processRegistry = [
  {
    id: 'arppl-process-a',
    fallbackName: 'ARPPL point-to-plane registration',
    defaultApiBase: defaultApiBase(),
    standaloneUrl: defaultStandaloneUrl(),
    defaultParameters: {
      u: '0.001',
      alpha: '-inf',
      lower_tol: '-0.2',
      upper_tol: '20',
      max_outer: '30',
      max_inner: '6',
      sample_ratio: 'full',
      visual_sample_size: '20000',
      persistRecord: true,
    },
  },
]

const state = {
  activeProcess: processRegistry[0],
  connectingFrom: null,
  edges: clone(DEFAULT_EDGES),
  geometry: { source: null, target: null },
  language: localStorage.getItem('workflow-language') || 'zh',
  lastResponse: null,
  manifest: null,
  nodes: clone(DEFAULT_NODES),
  params: { ...processRegistry[0].defaultParameters },
  selectedNode: 'process',
  sourceFile: null,
  targetFile: null,
}

const elements = {
  apiBase: document.querySelector('#apiBase'),
  clearLinks: document.querySelector('#clearLinks'),
  dialogBody: document.querySelector('#dialogBody'),
  dialogFooter: document.querySelector('#dialogFooter'),
  dialogKicker: document.querySelector('#dialogKicker'),
  dialogTitle: document.querySelector('#dialogTitle'),
  graphCanvas: document.querySelector('#graphCanvas'),
  graphStatus: document.querySelector('#graphStatus'),
  inspectorContent: document.querySelector('#inspectorContent'),
  inspectorTitle: document.querySelector('#inspectorTitle'),
  languageSelect: document.querySelector('#languageSelect'),
  loadManifest: document.querySelector('#loadManifest'),
  menuClearLinks: document.querySelector('#menuClearLinks'),
  menuConfigure: document.querySelector('#menuConfigure'),
  menuOpenApp: document.querySelector('#menuOpenApp'),
  menuRun: document.querySelector('#menuRun'),
  nodeDialog: document.querySelector('#nodeDialog'),
  nodeMenu: document.querySelector('#nodeMenu'),
  openNodeConfig: document.querySelector('#openNodeConfig'),
  openStandalone: document.querySelector('#openStandalone'),
  processCatalog: document.querySelector('#processCatalog'),
  resetLayout: document.querySelector('#resetLayout'),
  runWorkflow: document.querySelector('#runWorkflow'),
}

bootstrap()

function bootstrap() {
  elements.languageSelect.value = state.language
  elements.apiBase.value = state.activeProcess.defaultApiBase
  translate()
  renderCatalog()
  renderGraph()
  bindEvents()
  void loadManifest()
}

function bindEvents() {
  elements.languageSelect.addEventListener('change', () => {
    state.language = elements.languageSelect.value
    localStorage.setItem('workflow-language', state.language)
    translate()
    renderCatalog()
    renderGraph()
    if (elements.nodeDialog.open) renderDialogContent()
  })

  elements.loadManifest.addEventListener('click', () => void loadManifest())
  elements.runWorkflow.addEventListener('click', () => void runWorkflow())
  elements.openStandalone.addEventListener('click', openStandaloneApp)
  elements.openNodeConfig.addEventListener('click', openNodeDialog)
  elements.clearLinks.addEventListener('click', clearLinks)
  elements.resetLayout.addEventListener('click', resetLayout)

  elements.menuConfigure.addEventListener('click', () => {
    hideNodeMenu()
    openNodeDialog()
  })
  elements.menuRun.addEventListener('click', () => {
    hideNodeMenu()
    void runWorkflow()
  })
  elements.menuOpenApp.addEventListener('click', () => {
    hideNodeMenu()
    openStandaloneApp()
  })
  elements.menuClearLinks.addEventListener('click', () => {
    hideNodeMenu()
    clearLinks()
  })

  document.addEventListener('click', (event) => {
    if (!elements.nodeMenu.contains(event.target)) hideNodeMenu()
  })
  window.addEventListener('resize', () => renderEdges())
}

function t(key) {
  return translations[state.language]?.[key] ?? translations.en[key] ?? key
}

function translate() {
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en'
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n)
  })
}

function renderCatalog() {
  elements.processCatalog.innerHTML = ''
  processRegistry.forEach((process) => {
    const button = document.createElement('button')
    button.className = process.id === state.activeProcess.id ? 'process-card active' : 'process-card'
    button.type = 'button'
    button.innerHTML = `
      <span>${escapeHtml(process.id)}</span>
      <strong>${escapeHtml(state.manifest?.id === process.id ? state.manifest.name : process.fallbackName)}</strong>
    `
    button.addEventListener('click', () => {
      state.activeProcess = process
      state.params = { ...process.defaultParameters }
      elements.apiBase.value = process.defaultApiBase
      state.manifest = null
      state.lastResponse = null
      renderCatalog()
      renderGraph()
      void loadManifest()
    })
    elements.processCatalog.appendChild(button)
  })

  const next = document.createElement('button')
  next.className = 'process-card ghost'
  next.type = 'button'
  next.disabled = true
  next.innerHTML = `<span>${escapeHtml(t('palette.reserved'))}</span><strong>${escapeHtml(t('palette.next'))}</strong>`
  elements.processCatalog.appendChild(next)
}

function renderGraph() {
  const specs = getNodeSpecs()
  const nodesHtml = specs
    .map((node) => {
      const position = state.nodes[node.id]
      const classes = [
        'node',
        state.selectedNode === node.id ? 'active' : '',
        state.connectingFrom === node.id ? 'connecting' : '',
      ].filter(Boolean).join(' ')
      return `
        <article class="${classes}" data-node="${node.id}" style="left:${position.x}px; top:${position.y}px">
          ${node.canIn ? `<button class="port port-in" type="button" data-node="${node.id}" data-port="in" aria-label="${escapeHtml(t('edge.to'))}"></button>` : ''}
          ${node.canOut ? `<button class="port port-out" type="button" data-node="${node.id}" data-port="out" aria-label="${escapeHtml(t('edge.from'))}"></button>` : ''}
          <span>${escapeHtml(node.label)}</span>
          <strong title="${escapeHtml(node.name)}">${escapeHtml(node.name)}</strong>
          <small>${escapeHtml(node.meta)}</small>
          <div class="node-tags">${node.tags.map((tag) => `<em>${escapeHtml(tag)}</em>`).join('')}</div>
        </article>
      `
    })
    .join('')

  elements.graphCanvas.innerHTML = `
    <svg id="edgeLayer" class="edge-layer" aria-hidden="true">
      <defs>
        <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      <g id="edgePaths"></g>
    </svg>
    ${nodesHtml}
  `

  elements.graphCanvas.querySelectorAll('.node').forEach((nodeElement) => {
    const nodeId = nodeElement.dataset.node
    nodeElement.addEventListener('pointerdown', (event) => startNodeDrag(event, nodeId))
    nodeElement.addEventListener('dblclick', (event) => {
      if (event.target.closest('.port')) return
      selectNode(nodeId)
      openNodeDialog()
    })
    nodeElement.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      selectNode(nodeId)
      showNodeMenu(event.clientX, event.clientY)
    })
  })

  elements.graphCanvas.querySelectorAll('.port').forEach((port) => {
    port.addEventListener('pointerdown', (event) => event.stopPropagation())
    port.addEventListener('click', (event) => {
      event.stopPropagation()
      handlePortClick(port.dataset.node, port.dataset.port)
    })
  })

  renderEdges()
  renderInspector()
}

function getNodeSpecs() {
  const processName = state.manifest?.name ?? state.activeProcess.fallbackName
  const fileNames = [state.sourceFile?.name, state.targetFile?.name].filter(Boolean)
  const inputMeta = fileNames.length ? fileNames.join(' / ') : t('node.inputMeta')
  const processMode = state.params.persistRecord ? t('mode.saved') : t('mode.stateless')
  const outputMeta = state.lastResponse?.status ?? t('node.outputMeta')

  return [
    {
      canIn: false,
      canOut: true,
      id: 'input',
      label: t('node.input'),
      meta: inputMeta,
      name: t('node.inputName'),
      tags: [
        state.sourceFile ? t('files.source') : t('files.unselected'),
        state.targetFile ? t('files.target') : t('files.unselected'),
      ],
    },
    {
      canIn: true,
      canOut: true,
      id: 'process',
      label: t('node.process'),
      meta: processMode,
      name: processName,
      tags: [sampleRatioLabel(state.params.sample_ratio), `u=${state.params.u}`],
    },
    {
      canIn: true,
      canOut: false,
      id: 'output',
      label: t('node.output'),
      meta: outputMeta,
      name: t('node.outputName'),
      tags: [state.lastResponse ? t('result.pose') : t('result.empty')],
    },
  ]
}

function renderEdges() {
  const svg = document.querySelector('#edgeLayer')
  const group = document.querySelector('#edgePaths')
  if (!svg || !group) return

  const rect = elements.graphCanvas.getBoundingClientRect()
  svg.setAttribute('width', String(rect.width))
  svg.setAttribute('height', String(rect.height))
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)

  group.innerHTML = state.edges
    .map((edge) => {
      const start = getPortPoint(edge.from, 'out')
      const end = getPortPoint(edge.to, 'in')
      if (!start || !end) return ''
      const handle = Math.max(80, Math.abs(end.x - start.x) * 0.42)
      const d = `M ${start.x} ${start.y} C ${start.x + handle} ${start.y}, ${end.x - handle} ${end.y}, ${end.x} ${end.y}`
      return `<path class="edge-path" d="${d}" marker-end="url(#arrowHead)"></path>`
    })
    .join('')
}

function getPortPoint(nodeId, port) {
  const node = elements.graphCanvas.querySelector(`.node[data-node="${nodeId}"]`)
  if (!node) return null
  const canvasRect = elements.graphCanvas.getBoundingClientRect()
  const nodeRect = node.getBoundingClientRect()
  return {
    x: nodeRect.left - canvasRect.left + (port === 'out' ? nodeRect.width : 0),
    y: nodeRect.top - canvasRect.top + nodeRect.height / 2,
  }
}

function startNodeDrag(event, nodeId) {
  if (event.button !== 0 || event.target.closest('.port')) return
  event.preventDefault()
  hideNodeMenu()
  state.selectedNode = nodeId

  const nodeElement = event.currentTarget
  const start = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: state.nodes[nodeId].x,
    y: state.nodes[nodeId].y,
  }
  let moved = false

  nodeElement.setPointerCapture?.(event.pointerId)
  nodeElement.classList.add('dragging')
  elements.graphCanvas.querySelectorAll('.node').forEach((node) => {
    node.classList.toggle('active', node.dataset.node === nodeId)
  })
  renderInspector()

  const onMove = (moveEvent) => {
    const dx = moveEvent.clientX - start.pointerX
    const dy = moveEvent.clientY - start.pointerY
    moved = moved || Math.abs(dx) > 2 || Math.abs(dy) > 2
    const maxX = Math.max(24, elements.graphCanvas.clientWidth - NODE_WIDTH - 24)
    const maxY = Math.max(24, elements.graphCanvas.clientHeight - NODE_HEIGHT - 24)
    state.nodes[nodeId].x = clamp(start.x + dx, 24, maxX)
    state.nodes[nodeId].y = clamp(start.y + dy, 24, maxY)
    nodeElement.style.left = `${state.nodes[nodeId].x}px`
    nodeElement.style.top = `${state.nodes[nodeId].y}px`
    renderEdges()
  }

  const onUp = () => {
    nodeElement.releasePointerCapture?.(event.pointerId)
    nodeElement.classList.remove('dragging')
    nodeElement.removeEventListener('pointermove', onMove)
    nodeElement.removeEventListener('pointerup', onUp)
    nodeElement.removeEventListener('pointercancel', onUp)
    if (!moved) selectNode(nodeId)
  }

  nodeElement.addEventListener('pointermove', onMove)
  nodeElement.addEventListener('pointerup', onUp)
  nodeElement.addEventListener('pointercancel', onUp)
}

function handlePortClick(nodeId, port) {
  selectNode(nodeId, { rerender: false })

  if (port === 'out') {
    state.connectingFrom = nodeId
    setStatus(`${t('edge.from')} ${nodeLabel(nodeId)}: ${t('status.connecting')}`, 'connecting')
    renderGraph()
    return
  }

  if (port === 'in' && state.connectingFrom) {
    const from = state.connectingFrom
    state.connectingFrom = null
    if (from !== nodeId && isValidEdge(from, nodeId)) {
      addEdge(from, nodeId)
      setStatus(t('status.ready'), 'ready')
    } else {
      setStatus(t('status.noLinks'), 'error')
    }
    renderGraph()
  }
}

function isValidEdge(from, to) {
  return (from === 'input' && to === 'process') || (from === 'process' && to === 'output')
}

function addEdge(from, to) {
  if (state.edges.some((edge) => edge.from === from && edge.to === to)) return
  state.edges = state.edges.filter((edge) => edge.to !== to)
  state.edges.push({ from, to })
}

function clearLinks() {
  state.edges = []
  state.connectingFrom = null
  renderGraph()
  setStatus(t('status.ready'), 'ready')
}

function resetLayout() {
  state.nodes = clone(DEFAULT_NODES)
  renderGraph()
}

function hasEdge(from, to) {
  return state.edges.some((edge) => edge.from === from && edge.to === to)
}

function selectNode(nodeId, options = { rerender: true }) {
  state.selectedNode = nodeId || 'process'
  if (options.rerender !== false) renderGraph()
}

function renderInspector() {
  const title = nodeLabel(state.selectedNode)
  elements.inspectorTitle.textContent = title

  if (state.selectedNode === 'input') {
    elements.inspectorContent.innerHTML = `
      <section class="inspector-section">
        <h2>${escapeHtml(t('result.sourceTarget'))}</h2>
        ${fileBlockHtml('source', state.sourceFile, state.geometry.source)}
        ${fileBlockHtml('target', state.targetFile, state.geometry.target)}
        <dl class="kv-list">
          <dt>${escapeHtml(t('param.visualPts'))}</dt><dd>${escapeHtml(state.params.visual_sample_size)}</dd>
        </dl>
        <button type="button" data-action="configure">${escapeHtml(t('actions.configure'))}</button>
      </section>
    `
  } else if (state.selectedNode === 'output') {
    elements.inspectorContent.innerHTML = outputInspectorHtml()
  } else {
    elements.inspectorContent.innerHTML = processInspectorHtml()
  }

  bindInspectorActions()
}

function processInspectorHtml() {
  return `
    <section class="inspector-section">
      <h2>${escapeHtml(state.manifest?.name ?? state.activeProcess.fallbackName)}</h2>
      <dl class="kv-list">
        <dt>u</dt><dd>${escapeHtml(state.params.u)}</dd>
        <dt>alpha</dt><dd>${escapeHtml(state.params.alpha)}</dd>
        <dt>${escapeHtml(t('param.lowerTol'))}</dt><dd>${escapeHtml(state.params.lower_tol)}</dd>
        <dt>${escapeHtml(t('param.upperTol'))}</dt><dd>${escapeHtml(state.params.upper_tol)}</dd>
        <dt>max_outer</dt><dd>${escapeHtml(state.params.max_outer)}</dd>
        <dt>max_inner</dt><dd>${escapeHtml(state.params.max_inner)}</dd>
        <dt>${escapeHtml(t('param.sampleRatio'))}</dt><dd>${escapeHtml(sampleRatioLabel(state.params.sample_ratio))}</dd>
        <dt>registration_sample_size</dt><dd>${escapeHtml(registrationSampleSize())}</dd>
        <dt>${escapeHtml(t('param.persist'))}</dt><dd>${state.params.persistRecord ? escapeHtml(t('field.yes')) : escapeHtml(t('field.no'))}</dd>
      </dl>
      <div class="button-row">
        <button type="button" data-action="configure">${escapeHtml(t('actions.configure'))}</button>
        <button class="secondary" type="button" data-action="openApp">${escapeHtml(t('actions.openApp'))}</button>
      </div>
    </section>
  `
}

function bindInspectorActions() {
  elements.inspectorContent.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action
      if (action === 'configure') openNodeDialog()
      if (action === 'openApp') openStandaloneApp()
      if (action === 'run') void runWorkflow()
    })
  })
}

function fileBlockHtml(kind, file, geometry) {
  return `
    <article class="info-card">
      <span>${escapeHtml(kind === 'source' ? t('files.source') : t('files.target'))}</span>
      <strong title="${escapeHtml(file?.name ?? t('files.unselected'))}">${escapeHtml(file?.name ?? t('files.unselected'))}</strong>
      ${geometrySummaryHtml(geometry)}
    </article>
  `
}

function outputInspectorHtml() {
  if (!state.lastResponse) {
    return `
      <section class="inspector-section">
        <h2>${escapeHtml(t('result.empty'))}</h2>
        <button type="button" data-action="run">${escapeHtml(t('actions.run'))}</button>
      </section>
    `
  }

  const result = state.lastResponse.result ?? {}
  const pose = result.pose ?? poseFromTransform(result.transform)
  return `
    <section class="inspector-section">
      <h2>${escapeHtml(t('result.pose'))}</h2>
      ${poseSummaryHtml(pose)}
    </section>
    <section class="inspector-section">
      <h2>${escapeHtml(t('result.matrix'))}</h2>
      ${matrixHtml(result.transform)}
    </section>
    <section class="inspector-section">
      <h2>${escapeHtml(t('result.record'))}</h2>
      ${recordHtml(result)}
      <button class="secondary" type="button" data-action="openApp">${escapeHtml(t('actions.openApp'))}</button>
    </section>
    <section class="inspector-section">
      <h2>${escapeHtml(t('result.raw'))}</h2>
      <pre class="raw-output">${escapeHtml(JSON.stringify(state.lastResponse, null, 2))}</pre>
    </section>
  `
}

function poseSummaryHtml(pose) {
  if (!pose) return `<p class="muted">${escapeHtml(t('result.empty'))}</p>`
  const translation = pose.translation_xyz ?? [0, 0, 0]
  const angles = pose.angles_xyz_degrees ?? [0, 0, 0]
  const rows = [
    ['X', translation[0], ''],
    ['Y', translation[1], ''],
    ['Z', translation[2], ''],
    ['Rx', angles[0], 'deg'],
    ['Ry', angles[1], 'deg'],
    ['Rz', angles[2], 'deg'],
  ]
  return `
    <div class="metric-grid">
      ${rows.map(([label, value, unit]) => `
        <div class="metric">
          <span>${label}</span>
          <strong>${escapeHtml(formatNumber(value))}${unit ? ` ${unit}` : ''}</strong>
        </div>
      `).join('')}
    </div>
  `
}

function matrixHtml(matrix) {
  if (!Array.isArray(matrix)) return `<p class="muted">${escapeHtml(t('result.empty'))}</p>`
  return `
    <table class="matrix-table">
      ${matrix.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(formatNumber(value))}</td>`).join('')}</tr>`).join('')}
    </table>
  `
}

function recordHtml(result) {
  if (!result.record_dir && !result.record_files) {
    return `<p class="muted">${escapeHtml(state.params.persistRecord ? t('result.empty') : t('mode.stateless'))}</p>`
  }
  const files = result.record_files ? Object.entries(result.record_files) : []
  return `
    <dl class="kv-list">
      <dt>record_dir</dt><dd title="${escapeHtml(result.record_dir ?? '')}">${escapeHtml(result.record_dir ?? t('field.unknown'))}</dd>
      ${files.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd title="${escapeHtml(value)}">${escapeHtml(value)}</dd>`).join('')}
    </dl>
  `
}

function openNodeDialog() {
  renderDialogContent()
  elements.nodeDialog.showModal()
}

function renderDialogContent() {
  elements.dialogKicker.textContent = state.selectedNode === 'process'
    ? state.manifest?.id ?? state.activeProcess.id
    : nodeLabel(state.selectedNode)
  if (state.selectedNode === 'input') renderInputDialog()
  else if (state.selectedNode === 'output') renderOutputDialog()
  else renderProcessDialog()
}

function renderInputDialog() {
  elements.dialogTitle.textContent = t('dialog.inputTitle')
  elements.dialogBody.className = 'dialog-body dialog-grid'
  elements.dialogBody.innerHTML = `
    <section class="file-picker">
      <label>
        <span>${escapeHtml(t('files.source'))}</span>
        <input id="dialogSourceFile" type="file" accept=".ply,.obj" />
      </label>
      <label>
        <span>${escapeHtml(t('files.target'))}</span>
        <input id="dialogTargetFile" type="file" accept=".ply,.obj" />
      </label>
      <label>
        <span>${escapeHtml(t('param.visualPts'))}</span>
        <input id="dialogVisualSampleSize" value="${escapeHtml(state.params.visual_sample_size)}" inputmode="numeric" />
      </label>
      <p>${escapeHtml(t('dialog.fileHint'))}</p>
    </section>
    <section class="file-picker">
      <div class="geometry-grid geometry-grid--stacked">
        <div>
          <span>${escapeHtml(t('files.source'))}</span>
          ${fileBlockHtml('source', state.sourceFile, state.geometry.source)}
        </div>
        <div>
          <span>${escapeHtml(t('files.target'))}</span>
          ${fileBlockHtml('target', state.targetFile, state.geometry.target)}
        </div>
      </div>
    </section>
  `
  elements.dialogFooter.innerHTML = `
    <button class="secondary" type="button" data-dialog-action="close">${escapeHtml(t('actions.close'))}</button>
    <button type="button" data-dialog-action="saveInput">${escapeHtml(t('actions.save'))}</button>
  `
  bindDialogActions()
  document.querySelector('#dialogSourceFile').addEventListener('change', (event) => void handleFileSelection('source', event.currentTarget))
  document.querySelector('#dialogTargetFile').addEventListener('change', (event) => void handleFileSelection('target', event.currentTarget))
}

function renderProcessDialog() {
  elements.dialogTitle.textContent = t('dialog.processTitle')
  elements.dialogBody.className = 'dialog-body dialog-grid'
  elements.dialogBody.innerHTML = `
    <section class="dialog-params">
      <label>
        <span>u</span>
        <input id="dialogU" value="${escapeHtml(state.params.u)}" />
      </label>
      <label>
        <span>${escapeHtml(t('param.alpha'))}</span>
        <input id="dialogAlpha" value="${escapeHtml(state.params.alpha)}" />
      </label>
      <label>
        <span>${escapeHtml(t('param.lowerTol'))}</span>
        <input id="dialogLowerTol" value="${escapeHtml(state.params.lower_tol)}" />
      </label>
      <label>
        <span>${escapeHtml(t('param.upperTol'))}</span>
        <input id="dialogUpperTol" value="${escapeHtml(state.params.upper_tol)}" />
      </label>
      <label>
        <span>max_outer</span>
        <input id="dialogMaxOuter" value="${escapeHtml(state.params.max_outer)}" />
      </label>
      <label>
        <span>max_inner</span>
        <input id="dialogMaxInner" value="${escapeHtml(state.params.max_inner)}" />
      </label>
    </section>
    <section class="dialog-params">
      <label>
        <span>${escapeHtml(t('param.sampleRatio'))}</span>
        <select id="dialogSampleRatio">
          <option value="full" ${state.params.sample_ratio === 'full' ? 'selected' : ''}>${escapeHtml(t('param.full'))}</option>
          <option value="0.5" ${state.params.sample_ratio === '0.5' ? 'selected' : ''}>${escapeHtml(t('param.half'))}</option>
          <option value="0.25" ${state.params.sample_ratio === '0.25' ? 'selected' : ''}>${escapeHtml(t('param.quarter'))}</option>
        </select>
      </label>
      <dl class="kv-list">
        <dt>registration_sample_size</dt><dd>${escapeHtml(registrationSampleSize())}</dd>
      </dl>
      <label class="check-row">
        <input id="dialogPersistRecord" type="checkbox" ${state.params.persistRecord ? 'checked' : ''} />
        <span>${escapeHtml(t('param.persist'))}</span>
      </label>
      <details class="help-card">
        <summary>${escapeHtml(t('param.help'))}</summary>
        <p>${escapeHtml(t('param.helpText'))}</p>
      </details>
    </section>
  `
  elements.dialogFooter.innerHTML = `
    <button class="secondary" type="button" data-dialog-action="openApp">${escapeHtml(t('actions.openApp'))}</button>
    <button class="secondary" type="button" data-dialog-action="run">${escapeHtml(t('actions.run'))}</button>
    <button type="button" data-dialog-action="saveProcess">${escapeHtml(t('actions.save'))}</button>
  `
  bindDialogActions()
}

function renderOutputDialog() {
  elements.dialogTitle.textContent = t('dialog.outputTitle')
  elements.dialogBody.className = 'dialog-body output-dialog-body'
  elements.dialogBody.innerHTML = outputInspectorHtml()
  elements.dialogFooter.innerHTML = `
    <button class="secondary" type="button" data-dialog-action="openApp">${escapeHtml(t('actions.openApp'))}</button>
    <button class="secondary" type="button" data-dialog-action="run">${escapeHtml(t('actions.run'))}</button>
    <button type="button" data-dialog-action="close">${escapeHtml(t('actions.close'))}</button>
  `
  bindDialogActions()
  bindDialogBodyActions()
}

function bindDialogActions() {
  elements.dialogFooter.querySelectorAll('[data-dialog-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.dialogAction
      if (action === 'close') elements.nodeDialog.close()
      if (action === 'openApp') openStandaloneApp()
      if (action === 'run') {
        if (state.selectedNode === 'process') saveProcessDialogValues()
        if (state.selectedNode === 'input') saveInputDialogValues()
        elements.nodeDialog.close()
        void runWorkflow()
      }
      if (action === 'saveInput') {
        saveInputDialogValues()
        elements.nodeDialog.close()
      }
      if (action === 'saveProcess') {
        saveProcessDialogValues()
        elements.nodeDialog.close()
      }
    })
  })
}

function bindDialogBodyActions() {
  elements.dialogBody.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action
      if (action === 'openApp') openStandaloneApp()
      if (action === 'run') {
        elements.nodeDialog.close()
        void runWorkflow()
      }
    })
  })
}

function saveInputDialogValues() {
  const visualInput = document.querySelector('#dialogVisualSampleSize')
  state.params.visual_sample_size = visualInput?.value.trim() || '20000'
  setStatus(t('status.saved'), 'ready')
  renderGraph()
}

function saveProcessDialogValues() {
  state.params = {
    ...state.params,
    alpha: valueFromInput('#dialogAlpha', '-inf'),
    lower_tol: valueFromInput('#dialogLowerTol', '-0.2'),
    max_inner: valueFromInput('#dialogMaxInner', '6'),
    max_outer: valueFromInput('#dialogMaxOuter', '30'),
    persistRecord: Boolean(document.querySelector('#dialogPersistRecord')?.checked),
    sample_ratio: document.querySelector('#dialogSampleRatio')?.value ?? 'full',
    u: valueFromInput('#dialogU', '0.001'),
    upper_tol: valueFromInput('#dialogUpperTol', '20'),
  }
  setStatus(t('status.saved'), 'ready')
  renderGraph()
}

async function loadManifest() {
  const apiBase = normalizedApiBase()
  setStatus(t('status.loading'), 'loading')
  try {
    const response = await fetch(`${apiBase}/workflow/manifest`)
    const body = await parseJsonResponse(response)
    state.manifest = body
    setStatus(t('status.ready'), 'ready')
    renderCatalog()
    renderGraph()
  } catch (error) {
    state.manifest = null
    setStatus(errorMessage(error, 'manifest failed'), 'error')
    renderCatalog()
    renderGraph()
  }
}

async function runWorkflow() {
  if (!hasEdge('input', 'process') || !hasEdge('process', 'output')) {
    setStatus(t('status.noLinks'), 'error')
    return
  }

  setStatus(t('status.running'), 'running')
  elements.runWorkflow.disabled = true

  try {
    const body = state.sourceFile && state.targetFile
      ? await runFileWorkflow()
      : await runJsonWorkflow()
    state.lastResponse = compactWorkflowBody(body)
    state.selectedNode = 'output'
    setStatus(t('status.done'), 'done')
    renderGraph()
  } catch (error) {
    state.lastResponse = {
      status: 'failed',
      error: errorMessage(error, 'workflow failed'),
    }
    state.selectedNode = 'output'
    setStatus(state.lastResponse.error, 'error')
    renderGraph()
  } finally {
    elements.runWorkflow.disabled = false
  }
}

async function runFileWorkflow() {
  const traceId = `platform-${Date.now()}`
  const apiBase = normalizedApiBase()

  if (state.params.persistRecord) {
    const response = await fetch(`${apiBase}/register-files`, {
      method: 'POST',
      body: buildFileForm(traceId),
    })
    const result = await parseJsonResponse(response)
    return {
      mode: 'saved-record',
      node_id: state.manifest?.id ?? state.activeProcess.id,
      result,
      status: 'succeeded',
      trace_id: traceId,
    }
  }

  let response = await fetch(`${apiBase}/workflow/run-files`, {
    method: 'POST',
    body: buildFileForm(traceId),
  })
  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${apiBase}/register-files`, {
      method: 'POST',
      body: buildFileForm(traceId),
    })
    const result = await parseJsonResponse(response)
    return {
      mode: 'fallback-record',
      node_id: state.manifest?.id ?? state.activeProcess.id,
      result,
      status: 'succeeded',
      trace_id: traceId,
    }
  }
  return parseJsonResponse(response)
}

async function runJsonWorkflow() {
  const response = await fetch(`${normalizedApiBase()}/workflow/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node_id: state.manifest?.id ?? state.activeProcess.id,
      trace_id: `platform-${Date.now()}`,
      payload: {
        alpha: state.params.alpha.trim() || '-inf',
        max_inner: integerValue(state.params.max_inner, 1),
        max_outer: integerValue(state.params.max_outer, 1),
        return_points: false,
        source_points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
        target_normals: [
          [0, 0, 1],
          [0, 0, 1],
          [0, 0, 1],
        ],
        target_points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
        u: numberValue(state.params.u, 0.001),
        value_n: numberOrNull(state.params.lower_tol),
        value_p: numberOrNull(state.params.upper_tol),
      },
    }),
  })
  return parseJsonResponse(response)
}

function buildFileForm(traceId) {
  const form = new FormData()
  form.append('source', state.sourceFile)
  form.append('target', state.targetFile)
  form.append('node_id', state.manifest?.id ?? state.activeProcess.id)
  form.append('trace_id', traceId)
  form.append('u', state.params.u)
  form.append('alpha', state.params.alpha)
  form.append('value_n', state.params.lower_tol)
  form.append('value_p', state.params.upper_tol)
  form.append('max_outer', state.params.max_outer)
  form.append('max_inner', state.params.max_inner)
  form.append('stop', '0.00001')
  form.append('use_anderson', 'true')
  form.append('registration_sample_size', registrationSampleSize())
  form.append('visual_sample_size', state.params.visual_sample_size)
  return form
}

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(detailMessage(body) || `HTTP ${response.status}`)
  return body
}

function detailMessage(body) {
  if (!body) return ''
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) return body.detail.map((item) => item.msg ?? JSON.stringify(item)).join('; ')
  if (body.error) return String(body.error)
  return ''
}

async function handleFileSelection(kind, input) {
  const visualInput = document.querySelector('#dialogVisualSampleSize')
  if (visualInput) state.params.visual_sample_size = visualInput.value.trim() || state.params.visual_sample_size
  const file = input.files?.[0] ?? null
  state[`${kind}File`] = file
  state.geometry[kind] = null
  renderGraph()
  if (!file) {
    if (elements.nodeDialog.open) renderDialogContent()
    return
  }

  setStatus(t('status.geometry'), 'loading')
  try {
    state.geometry[kind] = await inspectPointCloudFile(file)
  } catch (error) {
    state.geometry[kind] = {
      error: errorMessage(error, 'geometry failed'),
      format: t('field.unknown'),
      name: file.name,
    }
  } finally {
    renderGraph()
    if (elements.nodeDialog.open && state.selectedNode === 'input') renderDialogContent()
    setStatus(t('status.ready'), 'ready')
  }
}

async function inspectPointCloudFile(file) {
  const text = await file.text()
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith('.ply') || text.startsWith('ply')) return inspectPly(file, text)
  if (lowerName.endsWith('.obj') || /^v\s+/m.test(text)) return inspectObj(file, text)
  return {
    error: t('field.unknown'),
    format: t('field.unknown'),
    name: file.name,
    points: null,
  }
}

function inspectPly(file, text) {
  const headerEnd = text.indexOf('end_header')
  if (headerEnd < 0) {
    return { error: 'Missing PLY header', format: 'PLY', name: file.name, points: null }
  }

  const headerText = text.slice(0, headerEnd)
  const headerLines = headerText.split(/\r?\n/)
  const vertexMatch = headerText.match(/element\s+vertex\s+(\d+)/i)
  const vertexCount = vertexMatch ? Number.parseInt(vertexMatch[1], 10) : 0
  const ascii = /format\s+ascii/i.test(headerText)
  const properties = []
  let inVertex = false

  headerLines.forEach((line) => {
    const trimmed = line.trim()
    if (/^element\s+vertex\s+/i.test(trimmed)) {
      inVertex = true
      return
    }
    if (/^element\s+/i.test(trimmed)) inVertex = false
    if (inVertex && /^property\s+/i.test(trimmed)) {
      const parts = trimmed.split(/\s+/)
      properties.push(parts[parts.length - 1])
    }
  })

  const summary = {
    bbox: null,
    format: ascii ? 'PLY ASCII' : 'PLY Binary',
    hasNormals: ['nx', 'ny', 'nz'].every((name) => properties.includes(name)),
    name: file.name,
    points: vertexCount || null,
  }
  if (!ascii) return summary

  const lineEnd = text.indexOf('\n', headerEnd)
  const dataLines = text.slice(lineEnd + 1).split(/\r?\n/)
  const xIndex = properties.indexOf('x')
  const yIndex = properties.indexOf('y')
  const zIndex = properties.indexOf('z')
  if (xIndex < 0 || yIndex < 0 || zIndex < 0) return summary

  let parsed = 0
  for (let index = 0; index < dataLines.length && (!vertexCount || parsed < vertexCount); index += 1) {
    const parts = dataLines[index].trim().split(/\s+/)
    if (parts.length <= Math.max(xIndex, yIndex, zIndex)) continue
    const point = [Number(parts[xIndex]), Number(parts[yIndex]), Number(parts[zIndex])]
    if (point.every(Number.isFinite)) {
      summary.bbox = extendBounds(summary.bbox, point)
      parsed += 1
    }
  }
  summary.points = vertexCount || parsed
  summary.parsedPoints = parsed
  return summary
}

function inspectObj(file, text) {
  const summary = {
    bbox: null,
    format: 'OBJ',
    hasNormals: false,
    name: file.name,
    points: 0,
  }
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('v ')) {
      const parts = trimmed.split(/\s+/)
      const point = [Number(parts[1]), Number(parts[2]), Number(parts[3])]
      if (point.every(Number.isFinite)) {
        summary.points += 1
        summary.bbox = extendBounds(summary.bbox, point)
      }
    } else if (trimmed.startsWith('vn ')) {
      summary.hasNormals = true
    }
  })
  return summary
}

function extendBounds(bounds, point) {
  if (!bounds) return { min: [...point], max: [...point] }
  return {
    min: bounds.min.map((value, index) => Math.min(value, point[index])),
    max: bounds.max.map((value, index) => Math.max(value, point[index])),
  }
}

function geometrySummaryHtml(geometry) {
  if (!geometry) return `<p class="muted">${escapeHtml(t('files.unselected'))}</p>`
  if (geometry.error) return `<p class="error-text">${escapeHtml(geometry.error)}</p>`
  return `
    <dl class="kv-list">
      <dt>${escapeHtml(t('field.format'))}</dt><dd>${escapeHtml(geometry.format ?? t('field.unknown'))}</dd>
      <dt>${escapeHtml(t('field.points'))}</dt><dd>${escapeHtml(formatCount(geometry.points))}</dd>
      <dt>${escapeHtml(t('field.normals'))}</dt><dd>${escapeHtml(geometry.hasNormals ? t('field.yes') : t('field.no'))}</dd>
      <dt>${escapeHtml(t('field.bbox'))}</dt><dd>${escapeHtml(formatBounds(geometry.bbox))}</dd>
    </dl>
  `
}

function openStandaloneApp() {
  window.open(state.activeProcess.standaloneUrl, '_blank', 'noopener,noreferrer')
}

function showNodeMenu(x, y) {
  elements.nodeMenu.style.left = `${x}px`
  elements.nodeMenu.style.top = `${y}px`
  elements.nodeMenu.classList.add('visible')
}

function hideNodeMenu() {
  elements.nodeMenu.classList.remove('visible')
}

function normalizedApiBase() {
  return elements.apiBase.value.replace(/\/$/, '')
}

function nodeLabel(nodeId) {
  if (nodeId === 'input') return t('node.inputName')
  if (nodeId === 'output') return t('node.outputName')
  return state.manifest?.name ?? state.activeProcess.fallbackName
}

function sampleRatioLabel(value) {
  if (value === '0.5') return t('param.half')
  if (value === '0.25') return t('param.quarter')
  return t('param.full')
}

function registrationSampleSize() {
  if (state.params.sample_ratio === 'full') return '0'
  const ratio = Number(state.params.sample_ratio)
  const sourcePoints = Number(state.geometry.source?.points)
  const targetPoints = Number(state.geometry.target?.points)
  if (!Number.isFinite(ratio) || !Number.isFinite(sourcePoints) || !Number.isFinite(targetPoints)) return '0'
  return String(Math.max(1, Math.floor(Math.min(sourcePoints, targetPoints) * ratio)))
}

function numberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function numberValue(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function integerValue(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function valueFromInput(selector, fallback) {
  const value = document.querySelector(selector)?.value?.trim()
  return value || fallback
}

function setStatus(message, tone) {
  elements.graphStatus.textContent = message
  document.body.dataset.status = tone
}

function poseFromTransform(transform) {
  if (!Array.isArray(transform) || transform.length < 4) return null
  const rotation = transform.slice(0, 3).map((row) => row.slice(0, 3))
  const translation = transform.slice(0, 3).map((row) => row[3] ?? 0)
  const sy = Math.hypot(rotation[0][0], rotation[1][0])
  let roll
  let pitch
  let yaw
  if (sy > 1e-9) {
    roll = Math.atan2(rotation[2][1], rotation[2][2])
    pitch = Math.atan2(-rotation[2][0], sy)
    yaw = Math.atan2(rotation[1][0], rotation[0][0])
  } else {
    roll = Math.atan2(-rotation[1][2], rotation[1][1])
    pitch = Math.atan2(-rotation[2][0], sy)
    yaw = 0
  }
  return {
    angles_xyz_degrees: [roll, pitch, yaw].map((value) => (value * 180) / Math.PI),
    angles_xyz_radians: [roll, pitch, yaw],
    rotation_matrix: rotation,
    translation_xyz: translation,
  }
}

function compactWorkflowBody(body) {
  const cloneBody = clone(body)
  const result = cloneBody.result
  if (result && typeof result === 'object') {
    ;['transformed_source_points', 'target_points', 'signed_deviations'].forEach((key) => {
      if (Array.isArray(result[key])) result[key] = `[${result[key].length} rows omitted in platform view]`
    })
  }
  return cloneBody
}

function formatNumber(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '--'
  if (Math.abs(numeric) >= 100) return numeric.toFixed(2)
  if (Math.abs(numeric) >= 1) return numeric.toFixed(4)
  if (numeric === 0) return '0'
  return numeric.toPrecision(4)
}

function formatCount(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : t('field.unknown')
}

function formatBounds(bounds) {
  if (!bounds) return t('field.unknown')
  const min = bounds.min.map(formatNumber).join(', ')
  const max = bounds.max.map(formatNumber).join(', ')
  return `min [${min}] / max [${max}]`
}

function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

function defaultApiBase() {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const host = window.location.hostname || 'localhost'
  return `${protocol}//${host}/api/process-a`
}

function defaultStandaloneUrl() {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  const host = window.location.hostname || 'localhost'
  return `${protocol}//${host}/`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
