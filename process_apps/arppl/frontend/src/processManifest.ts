export type ProcessAppManifest = {
  id: string
  name: string
  version: string
  remote: {
    appName: string
    entry: string
    appModule: string
    launcherModule: string
    manifestModule: string
  }
  endpoints: {
    appBase: string
    workflowBase: string
    health: string
    registerFiles: string
    workflowRun: string
    workflowRunFiles: string
    workflowManifest: string
  }
  capabilities: string[]
  standalone: {
    appUrl: string
  }
}

export const processManifest: ProcessAppManifest = {
  id: 'arppl-process-a',
  name: 'ARPPL point-to-plane registration',
  version: '0.1.0',
  remote: {
    appName: 'arppl_process_app',
    entry: '/assets/remoteEntry.js',
    appModule: './ArpplApp',
    launcherModule: './ProcessLauncher',
    manifestModule: './processManifest',
  },
  endpoints: {
    appBase: '/api/process-a',
    workflowBase: '/api/process-a/workflow',
    health: '/health',
    registerFiles: '/api/process-a/register-files',
    workflowRun: '/api/process-a/workflow/run',
    workflowRunFiles: '/api/process-a/workflow/run-files',
    workflowManifest: '/api/process-a/workflow/manifest',
  },
  capabilities: [
    'standalone-ui',
    'workflow-widget',
    'headless-json-registration',
    'file-registration-with-records',
  ],
  standalone: {
    appUrl: '/',
  },
}

export default processManifest
