# IPTV 扩展与策略验证（2026-09-21）

- 目录：78 路，原 63 路加 15 路固定直连；东方卫视、CGTN纪录各有一条备用线路。
- 本地 GoAPI 使用 `IPTV_DELIVERY_MODE=direct`；频道接口返回 78 条；旧 `web=1` 和媒体令牌入口均返回 403。
- Vue：原 `/video/detail/` 页面 CNA 实际播放 1920×1080，`readyState=4`、`paused=false`、`iptvDelivery=direct`。
- 东方卫视央视频线路播放失败后，通过播放器“线路”菜单切换到固定备用源，恢复 1920×1080 直连播放；未增加独立播放页面。
- 17 条新增/备用 URL 的 ffprobe 音视频流识别均成功。详细编码与分辨率见 `iptv-expanded-probe.json`，该检查不等于长时间解码或电视真机验收。
- 东方备用源虽然在上游称作 4K，实际本轮为 1080p，界面已据此标注；Love Nature 为 2160p HEVC。
- Vue 全量测试 149 项通过，生产构建通过。Android Debug/Release 各 255 项单测通过，仪器测试代码编译及 Debug APK 构建通过。
- API IPTV 服务竞态测试、Handler、控制器及路由测试通过。默认禁止媒体代理不保证上游清单或客户端网络永远可用。

尚未验证：电视真机扫码、遥控按键、HEVC 硬解、长时间播放及其他地区网络。未部署到生产服务器。
