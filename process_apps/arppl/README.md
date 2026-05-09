# ARPPL 工艺 App

`process_apps/arppl` 是一个可独立发布的完整工艺 App。公共工作流平台位于仓库根目录的 `workflow_platform`，不属于本工艺 App。

本工艺 App 提供：

- 独立 React + Three.js 界面。
- FastAPI 后端微服务。
- Vite federation 微前端模块。
- Docker Compose 独立部署编排。
- 供公共工作流平台发现和调度的 manifest 与 headless run API。

## 目录

```text
process_apps/arppl/
  backend/              FastAPI 服务、ARPPL API、合同测试
  frontend/             React 独立界面、平台示例、微前端暴露模块
  docker/               该工艺 App 的 Dockerfile、Nginx、Compose
  .dockerignore         该工艺 App 的 Docker 构建忽略规则
  README.md             当前说明
```

## 后端边界

核心数值计算逻辑位于 `backend/arppy.py` 的 `run_arppl` 及其依赖函数中。平台适配只允许发生在 API 契约、manifest、文件输入输出、记录管理和容器部署层，不应修改 NumPy 数学模型、`pykdtree` 近邻查询或 ARPPL 求解过程。

后端公开两类 API：

- App API: `/api/process-a/*`，给独立 UI 使用，可保存本地实验记录。
- Workflow API: `/api/process-a/workflow/*`，给工作流平台使用，默认无状态。

关键入口：

```text
GET  /api/process-a/workflow/manifest
POST /api/process-a/workflow/run
POST /api/process-a/workflow/run-files
POST /api/process-a/register-files
GET  /api/process-a/records
```

## 微前端边界

Vite federation remote:

```text
app name: arppl_process_app
entry:    /assets/remoteEntry.js
```

暴露模块：

```text
arppl_process_app/ArpplApp
arppl_process_app/ProcessLauncher
arppl_process_app/processManifest
```

`ArpplApp` 是完整工艺界面，支持 `standalone` 与 `workflow` 两种模式。`ProcessLauncher` 是公共平台侧可加载的弹窗式入口，适合节点配置、参数确认和交互式运行。

## 独立部署

在仓库根目录执行：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --build
```

如果本机已经有镜像、但 Docker Hub 暂时不可访问：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --no-build
```

访问：

```text
http://localhost/                                  独立 App
http://localhost/assets/remoteEntry.js             微前端入口
http://localhost/health                            后端健康检查
http://localhost/api/process-a/workflow/manifest   平台发现契约
```

如果页面出现 `502 Bad Gateway`，通常是 gateway 容器在 backend/frontend 重建后仍缓存旧容器地址。当前 Nginx 配置已使用 Docker DNS 动态解析，重启 gateway 即可恢复：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml restart gateway
```

停止：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml down
```

公共平台入口在：

```text
workflow_platform/
```

公共平台默认通过 `register-files` 提交 source/target 点云文件并写入 ARPPL 记录区，便于在独立 App 中复核结果和 Three.js 可视化；关闭保存记录模式后才通过 `workflow/run-files` 做无状态执行。未选择文件时会使用 JSON 形式的 `workflow/run` 示例输入。

平台侧 ARPPL 节点现在使用比例采样而不是绝对点数：默认全采样，用户可选择 `1/2` 或 `1/4`。平台会在提交前根据 source/target 的点数换算为后端既有的 `registration_sample_size`，不改动后端数值计算逻辑。

## 本地开发

终端 1，后端：

```powershell
cd process_apps/arppl
python -m uvicorn backend.arppy:app --host 127.0.0.1 --port 8000
```

终端 2，前端：

```powershell
cd process_apps/arppl/frontend
$env:VITE_API_BASE="http://127.0.0.1:8000/app/v1/process-a"
npm run dev -- --host 127.0.0.1 --port 5173
```

访问：

```text
http://127.0.0.1:5173/
```

## 测试

后端合同测试会使用仓库根目录下的真实 PLY 数据：

```powershell
cd process_apps/arppl
python -m unittest backend.test_process_contract -v
```

前端验证：

```powershell
cd process_apps/arppl/frontend
npm run lint
npm run build
```
