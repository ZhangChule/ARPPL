# 公共工作流平台

`workflow_platform` 是跨工艺 App 共享的工作流前端，不属于任何单个工艺算法。它通过工艺 App 暴露的 manifest 和 workflow API 进行发现、参数配置、节点执行和结果读取。

## 当前能力

- 图形化节点画布：Input -> Process -> Output。
- 节点拖拽：画布节点可以直接拖拽移动。
- 图形化连线：点击上游节点输出端口，再点击下游节点输入端口，即可建立连接。
- 节点交互：点击选择节点，双击或右键节点打开对应弹窗。
- 工艺服务发现：读取 `/api/process-a/workflow/manifest`。
- 输入节点配置：选择 source/target 点云文件，并设置 `visual pts` 默认值；平台会显示输入模型格式、点数、法向和包围盒。
- 工艺节点配置：设置 `u`、`alpha`、`Lower tol`、`Upper tol`、`max_outer`、`max_inner` 和配准采样比例；默认全采样，也可选择 `1/2` 或 `1/4`。
- 输出节点配置：查看配准后的位姿、矩阵、记录目录和原始 JSON 输出。
- 节点执行：默认调用 `/api/process-a/register-files` 并把结果保存到 ARPPL 独立 App 记录区；关闭保存记录模式后调用 `/api/process-a/workflow/run-files`，若旧服务尚未提供该端点则回退到 `register-files`。
- 结果查看：点击输出节点，在右侧 Inspector 查看 4x4 位姿矩阵、`x/y/z` 平移量、`Rx/Ry/Rz` 欧拉角、记录目录和原始输出。
- 语言切换：顶部 Language 控件支持中文/英文界面切换。

## 本地打开

先启动 ARPPL 工艺 App：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml up -d --no-build
```

然后直接打开：

```text
workflow_platform/frontend/index.html
```

或用 Docker 启动公共平台：

```powershell
docker compose -f workflow_platform/docker/compose.yml up -d --build
```

访问：

```text
http://localhost:8080/
```

默认 API Base 会根据当前浏览器访问的主机名自动生成，例如：

```text
http://localhost/api/process-a
```

如果 ARPPL 工艺 App 部署在其他端口或机器，在平台顶部的 `API Base` 输入框中修改即可。

## 交互方式

- 点击画布节点：选中节点并更新右侧 Inspector。
- 拖动画布节点：调整节点位置。
- 点击节点端口：从输出端口连到输入端口，定义流程关系。
- 双击节点：打开该节点自己的配置或结果弹窗。
- 右键工艺节点：打开快捷菜单，可配置节点、运行流程、打开独立 App。
- 在配置弹窗选择 `source` 和 `target` 文件后保存，平台会先显示输入模型几何信息，再在运行时把文件作为节点输入提交。
- 勾选“保存结果到独立 App 记录”时，平台把输出写入 ARPPL 记录区；运行后可打开独立 App 继续查看记录和 Three.js 可视化。
- 顶部语言控件可切换中文/英文，不影响后端接口。

如果独立 App 或平台出现 `502 Bad Gateway`，先确认 ARPPL 服务已启动，再重启 gateway 让 Nginx 重新解析 Docker 服务名：

```powershell
docker compose -f process_apps/arppl/docker/compose.yml restart gateway
```

## 与工艺 App 的边界

公共平台只负责：

- 发现工艺 App。
- 配置节点输入。
- 调度节点执行。
- 展示输出结果。

工艺 App 负责：

- 自己的算法后端。
- 自己的独立 UI。
- 自己的 `remoteEntry.js` 和 `ProcessLauncher`。
- 自己的 Docker 发布方案。

这样新增第二个工艺时，只需要让它提供同样的 manifest 与 workflow run API，平台就能作为公共调度入口继续扩展。
