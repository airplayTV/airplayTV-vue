# H5 Presence + ACK 变更清单

## 新增

- `src/helpers/websocket-ack.js`
- `src/helpers/controller-presence.js`
- `tests/websocket-ack.test.mjs`
- `tests/websocket-ack-dispatch.test.mjs`
- `tests/controller-presence.test.mjs`

## 修改

- `src/helpers/websocket.js`：ACK 分发、generation 清理、ACK 发送 API。
- `src/helpers/casting.js`：Presence 兼容入口、load normalize、ACK 驱动投屏/控制。
- `src/App.vue`：join 后恢复 Presence，连接关闭/错误/unmount 停止。
- `src/views/JoinRoomView.vue`：Presence ACK 后导航，失败留页。
- `src/components/AppAudioVideoList.vue`
- `src/components/AppPlayAudio.vue`
- `src/components/AppPlayVideo.vue`
- `src/components/AppSourceList.vue`
- `src/views/ControlView.vue`
- `tests/casting.test.mjs`

## 明确未改

- `package.json`、`package-lock.json` 和任何依赖版本。
- 路由定义、视频源 API、URL 校验和本地播放实现。
- 任务外已有 dirty 文件。
