# 工艺微服务与微前端平台

本仓库用于管理可独立发布、也可接入全局工作流平台的工艺算法 App。当前已包含第一个工艺 App：`process_apps/arppl`。后续新增第二个工艺算法时，应复制同一目录契约，而不是把文件散放到仓库根目录。

## 项目结构

```text
.
  process_apps/
    arppl/
      backend/      FastAPI 微服务、算法 API、合同测试
      frontend/     React 独立界面、平台弹窗组件、Vite federation remote
      docker/       Dockerfile、Nginx、Compose，集中管理该工艺运行环境
      README.md     该工艺 App 的独立说明
  testcase/         本地真实测试数据，不作为可发布镜像内容
  GIT_DEVELOPMENT.md
  README.md
```

根目录只放跨工艺的说明、Git 流程、测试数据和平台级约定。每个工艺 App 自己拥有 `backend`、`frontend`、`docker`，以便单独构建、测试、发布和迁移。

## 当前工艺 App

```text
process_apps/arppl
```

它的运行入口：

```text
独立 UI:       http://localhost/
平台示例:     http://localhost/platform.html
微前端入口:   http://localhost/assets/remoteEntry.js
服务发现:     http://localhost/api/process-a/workflow/manifest
健康检查:     http://localhost/health
```

## 条件触发与调度

本项目把“工艺计算”拆成三种触发方式：

- 独立 App 触发：用户打开独立 UI，上传 source/target 模型，前端调用 `/api/process-a/register-files`，后端保存实验记录和可视化数据。
- 工作流 headless 触发：平台节点调度器调用 `/api/process-a/workflow/run`，传入 JSON 点云与参数，后端只返回计算结果，不创建 UI 记录。
- 工作流交互触发：平台读取 `/api/process-a/workflow/manifest`，加载 `remoteEntry.js` 中的 `ProcessLauncher`，用弹窗或侧栏让用户确认输入参数，再决定是否执行节点。

新增工艺 App 时必须提供同样的发现与执行能力：

```text
GET  /api/<process-id>/workflow/manifest
POST /api/<process-id>/workflow/run
GET  /health
```

若该工艺有独立 UI，还应提供：

```text
/assets/remoteEntry.js
<process_remote>/ProcessLauncher
<process_remote>/<ProcessApp>
```

## 环境隔离

每个工艺 App 的环境由自己的 `docker` 目录管理：

```text
process_apps/<process-id>/docker/
  backend.Dockerfile
  frontend.Dockerfile
  nginx.conf
  frontend-nginx.conf
  compose.yml
```

原则：

- 后端容器只在 Docker 内部网络暴露服务端口。
- 外部统一通过 gateway 访问 UI 和 API。
- 运行时记录写入 Docker volume 或 `backend/records`，不提交到 Git。
- 前端 `node_modules`、`dist` 不提交到 Git。
- `testcase` 用于本地验证，不复制进镜像。

## 独立发布一个工艺 App

以 ARPPL 为例，单独发布只需要带上：

```text
process_apps/arppl/
```

在目标设备上执行：

```powershell
cd process_apps/arppl
docker compose -f docker/compose.yml up -d --build
```

如果是在仓库根目录执行：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --build
```

发布物包含完整后端、前端、网关和微前端入口，不依赖全局平台才能运行。

## 异地设备从 GitHub 下载后的执行方案

1. 安装 Docker Desktop、Git、Node.js 和 Python。若只运行 Docker 版本，Node.js 和 Python 不是必须。
2. 克隆仓库：

```powershell
git clone <repo-url>
cd ARPPL_code
```

3. 启动当前工艺 App：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --build
```

4. 验证：

```powershell
Invoke-RestMethod http://localhost/health
Invoke-RestMethod http://localhost/api/process-a/workflow/manifest
```

5. 打开：

```text
http://localhost/
```

如果 Docker Hub 网络不可用，但目标设备已有镜像：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --no-build
```

## 新增第二个工艺 App 的建议流程

1. 新建目录：

```text
process_apps/<new-process-id>/
  backend/
  frontend/
  docker/
  README.md
```

2. 后端至少实现：

```text
GET  /health
GET  /workflow/v1/<new-process-id>/manifest
POST /workflow/v1/<new-process-id>/run
```

3. 前端至少暴露：

```text
<remote_name>/<ProcessApp>
<remote_name>/ProcessLauncher
<remote_name>/processManifest
```

4. Docker Compose 使用独立服务名、镜像名、volume 名和外部端口。若多个工艺 App 同时在本机启动，不要都占用 `80:80`，应改成 `8081:80`、`8082:80` 等。

5. 增加该工艺自己的合同测试，覆盖 manifest、headless run、独立 App API。

## 当前验证命令

后端合同测试：

```powershell
cd process_apps/arppl
python -m unittest backend.test_process_contract -v
```

前端构建：

```powershell
cd process_apps/arppl/frontend
npm run lint
npm run build
```

Docker 配置检查：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml config
```
