# H5 Presence + request-scoped ACK 实施报告

## 结果

- 新增 request-scoped ACK registry：waiter 在发送前入表，支持同步 ACK、5 秒超时、`accepted=false`、连接 generation 隔离以及 close/error 幂等清理。
- WebSocket ACK 使用创建 socket 时捕获的 generation；旧 socket 的迟到 ACK 不会结算新连接请求；ACK 不再进入普通 Message 分发。
- 新增 5 秒 Presence 单链路生命周期：立即首发、同房幂等、切房/stop 清理、失败无并行、重连立即恢复。
- 扫码页保存房号后等待 Presence ACK，成功才导航；失败留在当前页并显示 `电视未连接，请重新扫码`。
- App 每次 open 先加入 H5 自身组，再对已存房间执行一次 `start`；close/error/unmount 停止 Presence。未使用 `refresh + start`，避免同一次 open 双发 Presence。
- 四个投屏入口和 Control 全部改为 ACK 后导航/更新状态；保留各自 guard、原目标路由/query/control payload。
- load payload 统一规范化：`vid/pid/source` 转非空字符串，`mode:null/undefined` 转空字符串，其余字段保留。
- `pairController` 仅保留兼容导出并委托 Presence，不再发送 `/ctl_pair` 绕过服务端权威状态。
- 新增/改动范围内 console 日志均为固定分类，不输出 room/client/request/payload/URL。

## TDD 证据

- ACK/Presence 首轮 RED：两个模块均以 `ERR_MODULE_NOT_FOUND` 失败。
- WebSocket 接入 RED：`sendControlWithAck is not a function`、`sendPresenceWithAck is not a function`。
- Casting normalize RED：缺少 `normalizeLoadVideoContext` 导出。
- App 单 open 单 Presence RED：源码仍含 `controllerPresence.refresh()`，随后删除并转 GREEN。

## 验证

- `node --test tests/*.mjs`：35/35 PASS。
- `npm run build`：PASS，Vite 处理 15095 modules。
- `rg -n "\b(sendControl|sendControlWithAck|sendPresenceWithAck)\s*\(" src`：业务调用均通过 helper 内显式 await；五个 Vue 入口显式注入 `sendControlWithAck`。
- `git diff --check`：PASS。
- 本任务目标文件 UTF-8 BOM 扫描：无 BOM。

## 已知非阻塞构建警告

- 既有 CSS 使用 `//` 注释。
- `VideoListView.vue` 同时动态和静态导入。
- 既有 chunk 超过 500 kB。

## Git 边界

- 未执行 `git add`、`git commit`、`git push`。
- 未修改依赖声明或 lock 文件；仓库原有 `package-lock.json` 仍保持未跟踪。
- 保留所有任务前已有 dirty/untracked 文件。
