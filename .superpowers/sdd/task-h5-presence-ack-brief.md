# H5 Presence + request-scoped ACK Brief

## Goal

H5 扫码仅在服务端确认 TV 消息已入队后离开扫码页；控制/投屏同样 ACK 后才导航或更新状态；每 5 秒续约 Presence，断线停止，重连立即恢复。

## Scope

- Create `src/helpers/websocket-ack.js`, `src/helpers/controller-presence.js`
- Modify `src/helpers/websocket.js`, `src/helpers/casting.js`, `src/App.vue`, `src/views/JoinRoomView.vue`
- Modify 四个投屏入口和 `ControlView.vue` 仅为接入 ACK/统一 normalize。
- Create/update Node tests.
- 保留现有 dirty changes、目标路由/query/payload字段与 local guards；不 add/commit/push。

## Protocol

- `controller-presence` data: `{group, request_id}`; ACK `controller-presence-ack`。
- `send-to-group` data 在原 control context 上新增 `request_id`; ACK `send-to-group-ack`。
- waiter 必须先注册再 send；timeout 5000ms；generation close/error全部reject并清理。
- request ID 使用 `crypto.randomUUID` 或安全随机字节回退，不递增/不包含room/client。
- ACK accepted=false 作为 reject/业务失败，统一用户文案 `电视未连接，请重新扫码`。

## Presence

- `createControllerPresence`: 立即首发，成功后单一 5000ms loop；同room start幂等；切房停止旧；stop清timer；refresh立即发。
- 扫码：暂存/保存 room 后 `await presence.start(room)`，成功才 `router.push('/?from-join-room')`，失败留扫码页并显示统一文案。
- App open：先 join own client group，再对已存 room refresh/start；close/error stop timer；重连后恢复。
- 页面关闭/应用 unmount stop；服务端15s租约最终unpair。

## Casting/control

- `normalizeLoadVideoContext`: vid/pid/source转string且非空，mode null/undefined -> ''；保留其他字段。
- `sendCastingCommand` 用 `sendControlWithAck`，ACK accepted后导航原目标；失败不导航。
- `sendControlCommand` ACK后才 updateState；失败调用onFailure。
- `pairController` 老实现不再作为扫码/重连主路径；可保留兼容导出但不得再发送裸 `/ctl_pair` 绕过 Presence ACK。
- 四入口继续各自 guard，所有 promise显式 await/catch。

## Tests

- ACK registry: success/false/timeout/generation close/error/duplicate/unknown/map cleanup/同步ACK竞态。
- Presence fake timers: immediate/5s/idempotent/switch/stop/failure no overlap/refresh。
- Websocket dispatch ACK不进入普通Message；close/error reject对应generation；reconnect generation isolation。
- Scan fail stays page; success navigates after ACK only；App open/join/presence order。
- normalize load; all casting entries ACK before navigation; Control state ACK after; mode null。
- `node --test tests/*.mjs`, build, source scan。

## Safety

- console不得打印 room/client/request/payload/URL；仅固定分类。
- UTF-8无BOM；不改依赖/锁文件，除非构建必需且先报告。
