<template>

  <!--
      播放器UI参考：https://www.blmp3.cn/
  -->
  <audio autoplay ref="appAudio" :src="music.src" preload="auto"></audio>
  <div class="music-player lyric-active" v-if="music">
    <div class="player-container" style="height: 80px;">
      <div class="top-progress-bar">
        <n-slider
            v-model:value="audioCtx.currentTime"
            :max="audioCtx.duration"
            placement="right-start"
            @update-value="onChangeProgress" />
      </div>

      <div class="player-wrapper">
        <div class="player-left">
          <img
              :src="music.pic || 'https://h5s.kuwo.cn/www/kw-www/img/dialog_pic_vinyl@2x.b683ac0.png'"
              :alt="music.title"
              class="song-cover">
          <div class="song-info">
            <div class="song-name">{{ music.title || 'Untitled' }}</div>
            <div class="song-artist">{{ music.artist || 'Unknown' }}</div>
          </div>
        </div>
        <div class="player-center">
          <div class="control-buttons">
            <button class="control-btn" @click="onPrevAudio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
              </svg>
            </button>

            <button v-if="audioCtx.paused" class="play-btn" @click="playAudio()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </button>
            <button v-else class="play-btn" @click="pauseAudio()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
              </svg>
            </button>

            <button class="control-btn" @click="onNextAudio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="player-right">
          <div class="progress-info">
            <span class="current-time">{{ formatTime(audioCtx.currentTime) }}</span>
            <span class="time-separator"> / </span>
            <span class="total-time">{{ formatTime(audioCtx.duration) }}</span>
          </div>
          <div class="volume-section">

            <button v-if="audioCtx.muted" class="volume-btn" @click="muteAudio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path>
              </svg>
            </button>
            <button v-else class="volume-btn" @click="unmuteAudio">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"></path>
              </svg>
            </button>

            <div class="volume-progress">
              <n-slider v-model:value="audioCtx.volume" :max="100" @update-value="onChangeVolume" />
            </div>
          </div>
          <button v-if="false" class="lyric-btn " @click="onToggleLrc" :class="{'active':showLrc}"> 词</button>
        </div>
      </div>
    </div>
    <div v-show="showLrc" class="lyric-page" style="height: calc(-80px + 100vh);">
      <button class="lyric-back-btn" @click="onToggleLrc">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
        </svg>
      </button>
      <div class="lyric-page-content" style="--player-height: 80px;">
        <div class="lyric-display-area">
          <div class="lyric-spacer" style="height: 150.15px;"></div>
          <div class="lyric-display-line">标题</div>
          <div class="lyric-display-line active">歌词1</div>
          <div class="lyric-display-line playing">歌词2</div>
          <div class="lyric-spacer" style="height: 150.15px;"></div>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup>

import {onMounted, ref, watch} from "vue";
import {NSlider} from 'naive-ui'
import {
  addEventHandler,
  ControlEventBack,
  ControlEventForward,
  ControlEventFullscreen,
  ControlEventFullscreenExit,
  ControlEventInfo,
  ControlEventMute,
  ControlEventPause,
  ControlEventPlay,
  ControlEventQrcode,
  ControlEventVolume,
  EventNameMessage
} from "@/helpers/websocket.js";

const showLrc = ref(false)
const appAudio = ref(null)
const music = ref({})//当前播放的音乐信息
const playList = ref([])// 播放列表
const audioCtx = ref({
  index: 0,
  paused: true,
  muted: false,
  duration: 0,
  currentTime: 0,
  volume: 100, // 进度条：[0-100]
})

const _pageKey = '_key_app_page_audio_player_'

const props = defineProps({
  // 当前播放哪一个
  index: 0,
  // 播放列表、或者单一音乐,src 可以是异步回调
  music: {
    id: null, title: null, artist: null, src: null, pic: null, lrc: null,
  },
})

const emits = defineEmits([
  'next', 'prev', 'changed',
  'error', 'load', 'loadedmetadata', 'loadeddata', 'play', 'pause', 'timeupdate', 'ended',
  'playing', 'progress', 'readystatechange', 'seeked', 'seeking', 'volumechange', 'waiting',
])

watch(() => props.index, (newVal, oldVal) => {
  // console.log('[watch.index]', { newVal, oldVal })
  switchAudio(newVal)
})

watch(() => props.music, (newVal, oldVal) => {
  // console.log('[watch.music]', { newVal, oldVal })
})

const onToggleLrc = () => {
  showLrc.value = !showLrc.value
}

const playAudio = () => {
  appAudio.value.play()
}

const pauseAudio = () => {
  appAudio.value.pause()
}

const muteAudio = () => {
  appAudio.value.muted = false
}

const unmuteAudio = () => {
  appAudio.value.muted = true
}

const onPrevAudio = () => {
  switchAudio(audioCtx.value.index - 1)
}

const onNextAudio = () => {
  if (audioCtx.value.index + 1 >= playList.value.length) {
    audioCtx.value.index = 0
    switchAudio(audioCtx.value.index)
  } else {
    switchAudio(audioCtx.value.index + 1)
  }
}

const updateAudioProgress = (elementCtx) => {
  audioCtx.value.duration = elementCtx.duration
  audioCtx.value.currentTime = elementCtx.currentTime
}

const updateAudioVolume = (elementCtx) => {
  if (elementCtx.muted) {
    audioCtx.value.volume = 0
  } else {
    audioCtx.value.volume = elementCtx.volume * 100
  }
}

const formatTime = (seconds) => {
  if (!seconds) {
    seconds = 0
  }
  let h = parseInt(seconds / 60 / 60)
  let m = parseInt(seconds / 60)
  let s = parseInt(seconds - h * 60 * 60 - m * 60)
  if (h > 0 && h < 10) {
    h = `0${h}`
  }
  if (m < 10) {
    m = `0${m}`
  }
  if (s < 10) {
    s = `0${s}`
  }
  if (h) {
    return `${h}:${m}:${s}`
  }
  return `${m}:${s}`
}

const onChangeProgress = (ctx) => {
  appAudio.value.currentTime = ctx
}

const onChangeVolume = (ctx) => {
  appAudio.value.volume = ctx / 100
}

const addControlEventHandler = () => {
  const tmpAppAudio = appAudio.value
  addEventHandler(EventNameMessage, _pageKey, (data) => {
    switch (data.event) {
      case ControlEventMute:
        tmpAppAudio.muted = false
        break
      case ControlEventFullscreen:
        break
      case ControlEventFullscreenExit:
        break
      case ControlEventQrcode:
        break
      case ControlEventInfo:
        break
      case ControlEventVolume:
        break
      case ControlEventBack:
        break
      case ControlEventPlay:
        tmpAppAudio.muted = true
        tmpAppAudio.play()
        break
      case ControlEventPause:
        tmpAppAudio.pause()
        break
      case ControlEventForward:
        break
    }
  })
}


const onMountedHandler = () => {
  ;[
    'error', 'load', 'loadedmetadata', 'loadeddata', 'play', 'pause', 'timeupdate',
    'ended', 'playing', 'progress', 'readystatechange', 'seeked', 'seeking',
    'volumechange', 'waiting'
  ].forEach(event => {
    appAudio.value.addEventListener(event, (ctx) => {
      emits(event, ctx)
      switch (event) {
        case 'play':
          audioCtx.value.paused = false
          break
        case 'playing':
          audioCtx.value.paused = false
          emits('changed', audioCtx.value.index, music.value)
          break
        case 'pause':
          audioCtx.value.paused = true
          break
        case 'ended':
          audioCtx.value.paused = true
          onNextAudio()
          break
        case 'error':
          audioCtx.value.paused = true
          setTimeout(() => {
            onNextAudio()
          }, 3000)
          break
        case 'loadeddata':
          audioCtx.value.volume = ctx.target.volume * 100
          break
        case 'timeupdate':
          updateAudioProgress(ctx.target)
          break
        case 'volumechange':
          updateAudioVolume(ctx.target)
          break
      }
      if (event !== 'timeupdate' && event !== 'progress') {
        // console.log('[emits]', event, ctx)
      } else {
        updateAudioProgress(ctx.target)
      }
      audioCtx.value.paused = !!ctx.target.paused
      audioCtx.value.muted = !!ctx.target.muted
    })
  })

  addControlEventHandler()

  parseMusic()
}

const parseMusic = () => {
  if (!props.music) {
    return emits('error', '暂无播放数据')
  }
  if (props.music.src) {
    playList.value.push(props.music)
  }
  for (let i = 0; i < props.music.length; i++) {
    if (props.music[i].src || props.music[i].fnSrc) {
      playList.value.push(props.music[i])
    }
  }
  if (playList.value.length <= 0) {
    emits('error', '暂无播放数据')
  } else {
    audioCtx.value.index = props.index
    switchAudio(audioCtx.value.index)
  }
}

const switchAudio = async (index = 0) => {
  if (index >= playList.value.length || index < 0) {
    return emits('error', '切换音频失败，音频不在列表中')
  }

  let tmpMusic = playList.value[index]

  emits('changed', index, tmpMusic)
  appAudio.value.pause()

  if (typeof tmpMusic.fnSrc === 'function') {
    try {
      tmpMusic.src = await tmpMusic.fnSrc()
    } catch (e) {
      console.log('[解析播放地址错误]', e)
      tmpMusic.src = ''
    }
    emits('changed', index, tmpMusic)
  }

  updateAudioProgress({ duration: 100, currentTime: 0 })

  music.value = Object.assign({}, tmpMusic)
  audioCtx.value.index = index
}


onMounted(onMountedHandler)


</script>

<style scoped lang="scss">

::v-deep(.n-slider-rail) {
  background-color: #ffffff14;
}

::v-deep(.n-slider:hover .n-slider-rail) {
  background-color: #ffffff14;
}

::v-deep(.n-slider.n-slider--active .n-slider-rail) {
  background-color: #ffffff14;
}


::v-deep(.n-slider-handle-wrapper) {
  display: none !important;
}


</style>

<style scoped lang="scss">

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box
}

body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
  background: #121212;
  color: #fff;
  overflow-x: hidden
}

::-webkit-scrollbar {
  width: 8px
}

::-webkit-scrollbar-track {
  background: hsla(0, 0%, 100%, .1)
}

::-webkit-scrollbar-thumb {
  background: hsla(0, 0%, 100%, .3);
  border-radius: 4px
}

::-webkit-scrollbar-thumb:hover {
  background: hsla(0, 0%, 100%, .4)
}


.song-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  width: 100%
}


audio {
  display: none
}

.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none
}

.player-container {
  background: hsla(0, 0%, 7%, .95);
  border-top: 1px solid hsla(0, 0%, 100%, .1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, .3);
  transition: height .3s ease
}

.player-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
  height: 100%
}

.top-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  cursor: pointer;
  z-index: 10;
  background: transparent;
  transition: height .2s
}

.top-progress-bar:hover {
  height: 4px
}

.top-progress-bar.dragging, .top-progress-bar:hover {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2)
}

.top-progress-bar.dragging {
  height: 6px !important
}

.top-progress-bar.dragging {
  background: hsla(0, 0%, 100%, .12)
}

.player-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  min-width: 0;
  height: 100%
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  -o-object-fit: cover;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3)
}

.song-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  justify-content: center
}

.song-name {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 3px
}

.song-artist, .song-name {
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap
}

.song-artist {
  color: hsla(0, 0%, 100%, .7);
  font-size: 12px;
  opacity: .8
}

.player-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 25px
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .3s;
  opacity: .9
}

.control-btn:hover {
  opacity: 1;
  background: hsla(0, 0%, 100%, .1);
  transform: scale(1.1)
}

.control-btn svg {
  color: currentColor;
  width: 20px;
  height: 20px
}

.play-btn {
  width: 44px;
  height: 44px;
  background: #1db954;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .3s;
  box-shadow: 0 4px 15px rgba(29, 185, 84, .3)
}

.play-btn:hover {
  background: #1ed760;
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(29, 185, 84, .4)
}

.play-btn:active {
  transform: scale(.98)
}

.play-btn svg {
  color: #fff;
  width: 22px;
  height: 22px
}

.player-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  min-width: 0;
  height: 100%
}

.progress-info {
  color: hsla(0, 0%, 100%, .7);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 80px;
  justify-content: flex-end;
  opacity: .9;
  letter-spacing: .5px
}

.time-separator {
  color: hsla(0, 0%, 100%, .4);
  margin: 0 2px
}

.current-time {
  color: #fff
}

.total-time {
  color: hsla(0, 0%, 100%, .7)
}

.volume-section {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px
}

.volume-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .3s;
  opacity: .9;
  flex-shrink: 0
}

.volume-btn:hover {
  opacity: 1;
  background: hsla(0, 0%, 100%, .1);
  transform: scale(1.1)
}

.volume-btn svg {
  color: currentColor;
  width: 20px;
  height: 20px
}

.volume-progress {
  flex: 1;
  height: 4px;
  background: hsla(0, 0%, 100%, .08);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  min-width: 60px;
  transition: height .2s
}

.volume-progress:hover {
  height: 6px
}

.lyric-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsla(0, 0%, 100%, .08);
  border: 1px solid hsla(0, 0%, 100%, .12);
  color: hsla(0, 0%, 100%, .8);
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  transition: all .3s;
  min-width: 40px;
  flex-shrink: 0;
  letter-spacing: .5px;
  font-weight: 500
}

.lyric-btn:hover {
  color: #fff;
  border-color: hsla(0, 0%, 100%, .2);
  background: hsla(0, 0%, 100%, .12);
  transform: translateY(-1px)
}

.lyric-btn.active {
  color: #1db954;
  border-color: rgba(29, 185, 84, .3);
  background: rgba(29, 185, 84, .08);
  box-shadow: 0 2px 8px rgba(29, 185, 84, .15)
}

.lyric-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: hsla(0, 0%, 4%, .98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 998;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid hsla(0, 0%, 100%, .05);
  transition: bottom .3s ease
}

.lyric-back-btn {
  position: absolute;
  top: 20px;
  right: 24px;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all .3s;
  opacity: .8;
  z-index: 2;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid hsla(0, 0%, 100%, .1)
}

.lyric-back-btn:hover {
  opacity: 1;
  background: hsla(0, 0%, 100%, .1);
  border-color: hsla(0, 0%, 100%, .2);
  transform: rotate(-90deg)
}

.lyric-back-btn svg {
  width: 20px;
  height: 20px;
  transform: rotate(180deg)
}

.lyric-page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  height: calc(100vh - var(--player-height, 80px));
  padding: 0 20px
}

.lyric-display-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 20px;
  padding: 0 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  scroll-behavior: auto;
  -webkit-overflow-scrolling: touch
}

.lyric-display-area::-webkit-scrollbar {
  display: none
}

.lyric-spacer {
  flex-shrink: 0;
  transition: height .3s ease
}

.lyric-display-line {
  color: hsla(0, 0%, 100%, .4);
  font-size: 20px;
  line-height: 2.2;
  padding: 12px 0;
  transition: all .3s ease;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
  opacity: .6;
  position: relative;
  transform-origin: center;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  word-break: break-word;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;
  padding-left: 20px;
  padding-right: 20px;
  flex-shrink: 0;
  transform: scale(1);
  transition: transform .3s cubic-bezier(.4, 0, .2, 1), color .3s cubic-bezier(.4, 0, .2, 1), opacity .3s cubic-bezier(.4, 0, .2, 1)
}

.lyric-display-line.active {
  color: hsla(0, 0%, 100%, .8);
  font-size: 22px;
  opacity: .9;
  transform: scale(1.02)
}

.lyric-display-line.playing {
  color: #fff;
  font-size: 24px;
  font-weight: 500;
  opacity: 1;
  transform: scale(1.05);
  text-shadow: 0 2px 10px hsla(0, 0%, 100%, .2);
  transition: all .3s cubic-bezier(.4, 0, .2, 1)
}

@media (max-width: 768px) {
  .player-container {
    height: 70px !important
  }

  .player-wrapper {
    padding: 0 16px
  }

  .song-name {
    font-size: 14px
  }

  .song-artist {
    font-size: 11px
  }

  .control-buttons {
    gap: 20px
  }

  .play-btn {
    width: 40px;
    height: 40px
  }

  .play-btn svg {
    width: 20px;
    height: 20px
  }

  .control-btn svg {
    width: 18px;
    height: 18px
  }

  .progress-info {
    font-size: 11px
  }

  .lyric-btn {
    padding: 5px 12px;
    font-size: 11px
  }

  .lyric-page-content {
    max-width: 100%;
    padding: 0 15px
  }

  .lyric-back-btn {
    top: 15px;
    right: 15px
  }

  .lyric-display-area {
    padding: 0 5px;
    max-width: 100%
  }

  .lyric-display-line {
    font-size: 18px;
    line-height: 2;
    min-height: 50px;
    padding: 10px 20px
  }

  .lyric-display-line.active {
    font-size: 20px
  }

  .lyric-display-line.playing {
    font-size: 22px
  }

  .placeholder-icon {
    font-size: 50px
  }

  .progress-handle {
    width: 16px;
    height: 16px
  }
}

@media (min-width: 0px) and (max-width: 720px) {
  .volume-section {
    display: none;
  }

  .control-buttons {
    gap: 2px;
  }
}


</style>