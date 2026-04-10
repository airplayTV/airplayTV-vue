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
          <button class="lyric-btn " @click="onToggleLrc" :class="{'active':showLrc}"> 词</button>
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
          <div class="lyric-display-line"> 知我（剑来）-国风棠（哦屚）</div>
          <div class="lyric-display-line"> 作词：林泽</div>
          <div class="lyric-display-line"> 作曲：林泽</div>
          <div class="lyric-display-line"> 剩几段月儿忆</div>
          <div class="lyric-display-line"> 风儿吹醒</div>
          <div class="lyric-display-line"> 拂琴又与谁起</div>
          <div class="lyric-display-line"> 试问苍下有几人</div>
          <div class="lyric-display-line"> 琴声知我意</div>
          <div class="lyric-display-line"> 窗外雨声吵醒</div>
          <div class="lyric-display-line"> 谁的孤寂</div>
          <div class="lyric-display-line"> 凉了半生再续</div>
          <div class="lyric-display-line"> 琴瑟鸣</div>
          <div class="lyric-display-line"> 谁又知我心</div>
          <div class="lyric-display-line"> 清风拂柳絮</div>
          <div class="lyric-display-line active"> 江岸风入梦里</div>
          <div class="lyric-display-line playing"> 散落星辰忆往昔</div>
          <div class="lyric-display-line"> 曾几时的梦里</div>
          <div class="lyric-display-line"> 那飘飘身影</div>
          <div class="lyric-display-line"> 而如今</div>
          <div class="lyric-display-line"> 沉入风平</div>
          <div class="lyric-display-line"> 红尘几时里</div>
          <div class="lyric-display-line"> 几多风几时雨</div>
          <div class="lyric-display-line"> 几声琴弦碎了心</div>
          <div class="lyric-display-line"> 一场梦的宿命</div>
          <div class="lyric-display-line"> 潮落又潮起</div>
          <div class="lyric-display-line"> 过路人</div>
          <div class="lyric-display-line"> 皆声叹起</div>
          <div class="lyric-display-line"> 剩几段月儿忆</div>
          <div class="lyric-display-line"> 风儿吹醒</div>
          <div class="lyric-display-line"> 拂琴又与谁起</div>
          <div class="lyric-display-line"> 试问苍下有几人</div>
          <div class="lyric-display-line"> 琴声知我意</div>
          <div class="lyric-display-line"> 窗外雨声吵醒</div>
          <div class="lyric-display-line"> 谁的孤寂</div>
          <div class="lyric-display-line"> 凉了半生再续</div>
          <div class="lyric-display-line"> 琴瑟鸣</div>
          <div class="lyric-display-line"> 谁又知我心</div>
          <div class="lyric-display-line"> 红尘几时里</div>
          <div class="lyric-display-line"> 几多风几时雨</div>
          <div class="lyric-display-line"> 几声琴弦碎了心</div>
          <div class="lyric-display-line"> 一场梦的宿命</div>
          <div class="lyric-display-line"> 潮落又潮起</div>
          <div class="lyric-display-line"> 过路人</div>
          <div class="lyric-display-line"> 皆声叹起</div>
          <div class="lyric-display-line"> 剩几段月儿忆</div>
          <div class="lyric-display-line"> 风儿吹醒</div>
          <div class="lyric-display-line"> 拂琴又与谁起</div>
          <div class="lyric-display-line"> 试问苍下有几人</div>
          <div class="lyric-display-line"> 琴声知我意</div>
          <div class="lyric-display-line"> 窗外雨声吵醒</div>
          <div class="lyric-display-line"> 谁的孤寂</div>
          <div class="lyric-display-line"> 凉了半生再续</div>
          <div class="lyric-display-line"> 琴瑟鸣</div>
          <div class="lyric-display-line"> 谁又知我心</div>
          <div class="lyric-spacer" style="height: 150.15px;"></div>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup>

import {onMounted, ref, watch} from "vue";
import {NSlider} from 'naive-ui'

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

const props = defineProps({
  options: {
    // 播放列表、或者单一音乐,src 可以是异步回调
    music: {
      id: null, title: null, artist: null, src: null, pic: null, lrc: null,
    },
  },
})

const emits = defineEmits([
  'next', 'prev', 'changed',
  'error', 'load', 'loadedmetadata', 'loadeddata', 'play', 'pause', 'timeupdate', 'ended',
  'playing', 'progress', 'readystatechange', 'seeked', 'seeking', 'volumechange', 'waiting',
])

watch(() => props.options, (newVal, oldVal) => {
  console.log('[watch.options]', { newVal, oldVal })
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
  emits('prev', props.music)
  switchAudio(audioCtx.value.index - 1)
}

const onNextAudio = () => {
  emits('next', props.music)
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
        console.log('[emits]', event, ctx)
      } else {
        updateAudioProgress(ctx.target)
      }
      audioCtx.value.paused = !!ctx.target.paused
      audioCtx.value.muted = !!ctx.target.muted
    })
  })
  parseMusic()
}

const parseMusic = () => {
  if (props.options.music.src) {
    playList.value.push(props.options.music)
  }
  for (let i = 0; i < props.options.music.length; i++) {
    if (props.options.music[i].src) {
      playList.value.push(props.options.music[i])
    }
  }
  if (playList.value.length <= 0) {
    emits('error', '暂无播放数据')
  } else {
    switchAudio(0)
  }
}

const switchAudio = async (index = 0) => {
  if (index >= playList.value.length || index < 0) {
    return emits('error', '切换音频失败，音频不在列表中')
  }
  let tmpMusic = playList.value[index]
  if (typeof tmpMusic.src === 'function') {
    try {
      tmpMusic.src = await tmpMusic.src()
    } catch (e) {
      tmpMusic.src = ''
    }
  }

  updateAudioProgress({ duration: 100, currentTime: 0 })

  music.value = Object.assign({}, tmpMusic)
  audioCtx.value.index = index
  emits('changed', tmpMusic)
}


onMounted(onMountedHandler)


</script>

<style scoped>

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

<style scoped>

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

#app {
  min-height: 100vh
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

.music-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #121212;
  z-index: 1000;
  transition: all .3s ease
}

.music-header:not(.is-mobile) {
  padding: 20px 0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, .4)
}

.music-header:not(.is-mobile) .search-container {
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 40px;
  box-sizing: border-box
}

.search-box {
  background: #2a2a2a;
  border-radius: 25px;
  cursor: text;
  transition: all .3s ease;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  position: relative;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none
}

.search-box:focus-within {
  border-color: #1db954;
  background: #333;
  box-shadow: 0 0 0 2px rgba(29, 185, 84, .2)
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: 16px;
  padding: 0;
  height: 100%
}

.search-input::-moz-placeholder {
  color: #888;
  opacity: .8
}

.search-input::placeholder {
  color: #888;
  opacity: .8
}

.clear-search, .search-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #888;
  transition: color .3s;
  flex-shrink: 0
}

.clear-search:hover, .search-icon-wrapper:hover {
  color: #fff
}

.loading-icon {
  width: 20px;
  height: 20px;
  border: 2px solid hsla(0, 0%, 100%, .3);
  border-radius: 50%;
  border-top-color: #1db954;
  animation: spin-56da09d4 1s linear infinite
}

@keyframes spin-56da09d4 {
  to {
    transform: rotate(1turn)
  }
}

.music-header:not(.is-mobile) .search-box {
  flex: 1;
  height: 40px;
  padding: 0 20px 0 25px
}

.music-header:not(.is-mobile) .search-input {
  font-size: 16px;
  padding-right: 10px
}

.music-header:not(.is-mobile) .clear-search, .music-header:not(.is-mobile) .search-icon-wrapper {
  width: 20px;
  height: 20px;
  margin-left: 8px
}

.pc-buttons {
  display: flex;
  gap: 12px;
  flex-shrink: 0
}

.pc-btn {
  height: 40px;
  background: rgba(29, 185, 84, .2);
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all .3s ease;
  padding: 0 20px;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500
}

.pc-btn:hover {
  background: rgba(29, 185, 84, .4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(29, 185, 84, .3)
}

.pc-btn.active {
  background: rgba(29, 185, 84, .6) !important;
  box-shadow: 0 4px 15px rgba(29, 185, 84, .4) !important;
  position: relative;
  transform: translateY(-1px)
}

.music-header.is-mobile {
  padding: 15px 20px 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .3)
}

.music-header.is-mobile .search-box {
  width: 100%;
  height: 44px;
  padding: 0 15px 0 20px;
  margin-bottom: 15px
}

.music-header.is-mobile .search-input {
  font-size: 16px;
  padding-right: 8px
}

.music-header.is-mobile .clear-search, .music-header.is-mobile .search-icon-wrapper {
  width: 20px;
  height: 20px;
  margin-left: 6px
}

.mobile-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 5px
}

.mobile-buttons::-webkit-scrollbar {
  display: none
}

.mobile-btn {
  flex: 1;
  min-width: 70px;
  height: 40px;
  background: rgba(29, 185, 84, .2);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s ease;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  padding: 0;
  font-size: 12px;
  font-weight: 500
}

.mobile-btn:active {
  opacity: .8;
  transform: scale(.98)
}

.mobile-btn.active {
  background: rgba(29, 185, 84, .6) !important;
  box-shadow: 0 2px 8px rgba(29, 185, 84, .3) !important;
  opacity: 1;
  transform: scale(1)
}

@media (max-width: 1024px) {
  .music-header:not(.is-mobile) .search-container {
    max-width: 100%;
    padding: 0 20px
  }

  .pc-btn {
    min-width: 90px;
    padding: 0 15px
  }

  .pc-btn .btn-text {
    font-size: 14px
  }
}

@media (max-width: 768px) {
  .music-header.is-mobile {
    padding: 12px 15px 8px 15px
  }

  .mobile-btn {
    min-width: 60px;
    height: 36px
  }

  .mobile-btn .btn-text {
    font-size: 11px
  }
}

@media (hover: none) and (pointer: coarse) {
  .pc-btn:hover {
    transform: none
  }
}

.song-list-container {
  background: #121212;
  box-sizing: border-box;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column
}

.list-header {
  display: flex;
  padding: 12px 20px;
  color: #888;
  font-size: 13px;
  border-bottom: 1px solid hsla(0, 0%, 100%, .1);
  background: rgba(0, 0, 0, .9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: sticky;
  z-index: 100;
  flex-shrink: 0
}

.header-cell {
  padding: 0 10px;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box
}

.header-cell.index {
  width: 60px;
  flex: 0 0 60px;
  justify-content: center
}

.header-cell.title {
  flex: 3;
  min-width: 0;
  justify-content: flex-start;
  text-align: left
}

.header-cell.artist {
  flex: 2;
  min-width: 0;
  justify-content: flex-start;
  text-align: left
}

.header-cell.action {
  width: 60px;
  flex: 0 0 60px;
  justify-content: center;
  text-align: center
}

.song-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all .3s;
  color: #ccc;
  border-bottom: 1px solid hsla(0, 0%, 100%, .05);
  min-width: 0
}

.song-item:hover {
  background: hsla(0, 0%, 100%, .05)
}

.song-item.active {
  background: rgba(29, 185, 84, .1);
  color: #1db954
}

.song-cell {
  padding: 0 10px;
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box
}

.song-cell.index {
  width: 60px;
  flex: 0 0 60px;
  justify-content: center;
  text-align: center;
  font-size: 14px;
  color: hsla(0, 0%, 100%, .7)
}

.playing-icon {
  color: #1db954;
  font-style: normal;
  animation: pulse-181015a2 1s infinite;
  font-size: 16px
}

@keyframes pulse-181015a2 {
  0% {
    opacity: .6
  }

  50% {
    opacity: 1
  }

  to {
    opacity: .6
  }
}

.song-cell.title {
  flex: 3
}

.song-cell.artist, .song-cell.title {
  min-width: 0;
  justify-content: flex-start;
  text-align: left;
  overflow: hidden
}

.song-cell.artist {
  flex: 2;
  font-size: 14px;
  color: hsla(0, 0%, 100%, .9)
}

.song-cell.action {
  width: 60px;
  flex: 0 0 60px;
  justify-content: center;
  text-align: center;
  padding: 0 5px
}

.song-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  width: 100%
}

.song-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px
}

.song-album, .song-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  width: 100%
}

.song-album {
  font-size: 12px;
  color: #888
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsla(0, 0%, 100%, .1);
  border: none;
  cursor: pointer;
  transition: all .3s;
  color: hsla(0, 0%, 100%, .7);
  flex-shrink: 0
}

.action-btn:hover {
  transform: scale(1.1)
}

.download-btn:hover {
  background: rgba(33, 150, 243, .2);
  color: #2196f3
}

.favorite-btn:hover {
  background: rgba(255, 193, 7, .2);
  color: #ffc107
}

.favorite-btn.favorited {
  background: rgba(255, 193, 7, .3);
  border-color: #ffc107;
  color: #ffc107
}

.remove-btn {
  background: rgba(244, 67, 54, .2);
  border-color: rgba(244, 67, 54, .5);
  color: #f44336
}

.remove-btn:hover {
  background: rgba(244, 67, 54, .3);
  color: #f44336
}

@media (max-width: 768px) {
  .song-item {
    padding: 10px 15px
  }

  .list-header {
    padding: 10px 15px;
    font-size: 12px
  }

  .header-cell.index {
    width: 40px;
    flex: 0 0 40px
  }

  .header-cell.artist {
    display: none
  }

  .header-cell.action {
    width: 50px;
    flex: 0 0 50px
  }

  .song-cell.index {
    width: 40px;
    flex: 0 0 40px
  }

  .song-cell.artist {
    display: none
  }

  .song-cell.action {
    width: 50px;
    flex: 0 0 50px
  }

  .song-title {
    font-size: 14px
  }

  .action-btn {
    width: 28px;
    height: 28px
  }
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

.top-progress-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: hsla(0, 0%, 100%, .08)
}

.top-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: #1db954;
  transition: width .1s linear;
  border-radius: 0 1px 1px 0
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity .2s, transform .2s;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 0, 0, .3);
  z-index: 11
}

.top-progress-bar.dragging .progress-handle, .top-progress-bar:hover .progress-handle {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2)
}

.top-progress-bar.dragging {
  height: 6px !important
}

.top-progress-bar.dragging .top-progress-background {
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

.volume-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 2px;
  background: hsla(0, 0%, 100%, .08)
}

.volume-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: #1db954;
  border-radius: 2px;
  transition: width .1s linear;
  min-width: 4px;
  box-shadow: 0 0 4px rgba(29, 185, 84, .3)
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

.no-lyrics-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  text-align: center;
  flex: 1
}

.placeholder-icon {
  font-size: 60px;
  margin-bottom: 20px;
  opacity: .5;
  animation: pulse-2d7a4980 2s infinite
}

.placeholder-text {
  font-size: 16px;
  color: #aaa
}

@keyframes pulse-2d7a4980 {
  0%, to {
    opacity: .5;
    transform: scale(1)
  }

  50% {
    opacity: .8;
    transform: scale(1.1)
  }
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

.system-playlists-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #121212, #1a1a1a);
  color: #fff;
  padding: 0 20px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 20px;
  text-align: center;
  min-height: 300px
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid hsla(0, 0%, 100%, .1);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin-2d7b5101 1s linear infinite;
  margin-bottom: 20px
}

.loading-text {
  color: #aaa;
  font-size: 16px;
  letter-spacing: 1px
}

@keyframes spin-2d7b5101 {
  to {
    transform: rotate(1turn)
  }
}

.playlist-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  overflow-y: auto;
  padding-bottom: 20px;
  min-height: 0
}

.mobile-view .playlist-grid {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px
}

.playlist-card {
  background: hsla(0, 0%, 100%, .05);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all .3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 350px;
  border: 1px solid transparent
}

.playlist-card:hover {
  transform: translateY(-4px);
  background: hsla(0, 0%, 100%, .1);
  border-color: hsla(0, 0%, 100%, .2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .3)
}

.playlist-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  background-size: cover;
  background-position: 50%;
  background-color: #2a2a2a;
  overflow: hidden;
  flex-shrink: 0
}

.playlist-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(255, 71, 87, .3);
  animation: pulse-2d7b5101 2s infinite;
  white-space: nowrap
}

@keyframes pulse-2d7b5101 {
  0%, to {
    box-shadow: 0 2px 8px rgba(255, 71, 87, .3)
  }

  50% {
    box-shadow: 0 2px 12px rgba(255, 71, 87, .5)
  }
}

.playlist-play-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: #1db954;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all .3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3);
  z-index: 2;
  cursor: pointer
}

.playlist-card:hover .playlist-play-btn {
  opacity: 1;
  transform: translateY(0)
}

.playlist-play-btn:hover {
  transform: scale(1.1);
  background: #1ed760
}

.playlist-listen-count {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, .6);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  gap: 4px
}

.playlist-listen-count:before {
  content: "▶";
  font-size: 10px;
  color: #1db954
}

.playlist-info {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 120px
}

.playlist-name {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  cursor: help
}

.playlist-description {
  font-size: 14px;
  color: #aaa;
  margin: 0 0 12px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  height: 3em;
  flex: 1
}

.mobile-view .playlist-description {
  font-size: 13px;
  -webkit-line-clamp: 1;
  height: 1.5em
}

.playlist-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  padding-top: 8px;
  border-top: 1px solid hsla(0, 0%, 100%, .1);
  margin-top: auto;
  flex-shrink: 0
}

.playlist-type {
  color: #1db954;
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(29, 185, 84, .1);
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%
}

.playlist-time {
  color: #888;
  font-size: 12px;
  white-space: nowrap
}

.empty-playlist {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: #888;
  padding: 40px 20px;
  background: hsla(0, 0%, 100%, .02);
  border-radius: 12px;
  border: 2px dashed hsla(0, 0%, 100%, .1);
  min-height: 300px
}

.empty-icon {
  color: #666;
  margin-bottom: 20px;
  opacity: .5
}

.empty-icon svg {
  width: 80px;
  height: 80px
}

.empty-playlist h3 {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 10px 0;
  color: #aaa
}

.empty-playlist p {
  font-size: 14px;
  margin: 0 0 20px 0;
  color: #666;
  max-width: 300px;
  line-height: 1.5
}

.refresh-btn {
  background: #1db954;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all .3s
}

.refresh-btn:hover {
  background: #1ed760;
  transform: translateY(-2px)
}

@media (max-width: 768px) {
  .system-playlists-container {
    padding: 0 15px 15px
  }

  .playlist-info {
    padding: 15px;
    min-height: 100px
  }

  .playlist-name {
    font-size: 16px
  }

  .playlist-card {
    min-height: 280px
  }

  .empty-playlist {
    padding: 30px 15px
  }

  .empty-playlist h3 {
    font-size: 18px
  }

  .empty-playlist p {
    font-size: 13px
  }
}

.playlist-grid::-webkit-scrollbar {
  width: 8px
}

.playlist-grid::-webkit-scrollbar-track {
  background: hsla(0, 0%, 100%, .05);
  border-radius: 4px
}

.playlist-grid::-webkit-scrollbar-thumb {
  background: hsla(0, 0%, 100%, .2);
  border-radius: 4px
}

.playlist-grid::-webkit-scrollbar-thumb:hover {
  background: hsla(0, 0%, 100%, .3)
}

.pack-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, .7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn-288b66bf .3s ease
}

@keyframes fadeIn-288b66bf {
  0% {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

.pack-modal-container {
  width: 100%;
  max-width: 600px;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, .5);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border: 1px solid hsla(0, 0%, 100%, .1);
  animation: slideUp-288b66bf .4s cubic-bezier(.4, 0, .2, 1)
}

@keyframes slideUp-288b66bf {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(.95)
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1)
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(0, 0, 0, .3);
  border-bottom: 1px solid hsla(0, 0%, 100%, .1);
  backdrop-filter: blur(20px)
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: .5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, .3)
}

.modal-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  color: hsla(0, 0%, 100%, .7);
  transition: all .3s;
  background: hsla(0, 0%, 100%, .1);
  border: 1px solid transparent;
  font-size: 20px;
  font-weight: 700
}

.modal-close:hover {
  background: hsla(0, 0%, 100%, .2);
  color: #fff;
  border-color: hsla(0, 0%, 100%, .3);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2)
}

.modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column
}

.pack-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  max-height: calc(85vh - 180px);
  display: flex;
  flex-direction: column;
  gap: 12px
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #667eea;
  gap: 20px
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, .1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin-288b66bf 1s linear infinite
}

.loading-text {
  font-size: 16px;
  color: hsla(0, 0%, 100%, .7);
  letter-spacing: 1px
}

@keyframes spin-288b66bf {
  to {
    transform: rotate(1turn)
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
  gap: 20px
}

.empty-icon {
  color: hsla(0, 0%, 100%, .3);
  opacity: .5
}

.empty-text {
  font-size: 16px;
  color: hsla(0, 0%, 100%, .5)
}

.retry-btn {
  padding: 8px 20px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all .3s
}

.retry-btn:hover {
  background: #5d61e6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, .3)
}

.pack-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: hsla(0, 0%, 100%, .05);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all .3s ease;
  gap: 16px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  min-height: 80px
}

.pack-item:hover {
  background: hsla(0, 0%, 100%, .1);
  border-color: rgba(102, 126, 234, .3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, .3)
}

.pack-item:hover:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  animation: slideIn-288b66bf .5s ease
}

@keyframes slideIn-288b66bf {
  0% {
    transform: translateX(-100%)
  }

  to {
    transform: translateX(100%)
  }
}

.pack-number {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, .3);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, .3);
  flex-shrink: 0;
  position: relative;
  overflow: hidden
}

.pack-number:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, hsla(0, 0%, 100%, .2), hsla(0, 0%, 100%, .1) 50%, transparent);
  pointer-events: none
}

.pack-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden
}

.pack-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  hyphens: auto;
  cursor: default;
  position: relative
}

.pack-title:hover:after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, .9);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  border: 1px solid hsla(0, 0%, 100%, .2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3);
  word-wrap: break-word;
  white-space: normal;
  width: -moz-max-content;
  width: max-content;
  max-width: 300px;
  min-width: 100px;
  text-align: center
}

.pack-item:hover .pack-title {
  color: #667eea;
  text-shadow: 0 0 8px rgba(102, 126, 234, .3)
}

.pack-meta {
  display: flex;
  gap: 20px;
  align-items: center;
  font-size: 12px;
  color: hsla(0, 0%, 100%, .6);
  flex-wrap: wrap
}

.pack-date, .pack-hot {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color .3s;
  white-space: nowrap
}

.pack-item:hover .pack-date, .pack-item:hover .pack-hot {
  color: hsla(0, 0%, 100%, .8)
}

.pack-hot svg {
  color: #ff4757;
  animation: flame-288b66bf 1.5s ease-in-out infinite alternate
}

@keyframes flame-288b66bf {
  0% {
    transform: scale(1)
  }

  to {
    transform: scale(1.1)
  }
}

.pack-date svg {
  color: #1db954
}

.pack-action {
  flex-shrink: 0
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all .3s ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(102, 126, 234, .2);
  border: 1px solid hsla(0, 0%, 100%, .1);
  position: relative;
  overflow: hidden;
  min-width: 60px
}

.download-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, .4);
  background: linear-gradient(135deg, #5d61e6, #6a4a9c)
}

.download-btn:active {
  transform: translateY(0) scale(.98);
  box-shadow: 0 2px 8px rgba(102, 126, 234, .2)
}

.download-btn svg {
  width: 16px;
  height: 16px;
  transition: transform .3s ease;
  flex-shrink: 0
}

.download-btn:hover svg {
  animation: bounce-288b66bf .5s ease infinite alternate
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid hsla(0, 0%, 100%, .1);
  background: hsla(0, 0%, 100%, .05);
  backdrop-filter: blur(20px)
}

.total-info {
  font-size: 14px;
  color: hsla(0, 0%, 100%, .7);
  display: flex;
  align-items: center;
  gap: 6px
}

.total-info:before {
  content: "📦";
  font-size: 12px
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 20px
}

.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsla(0, 0%, 100%, .1);
  border: 1px solid hsla(0, 0%, 100%, .1);
  cursor: pointer;
  transition: all .3s;
  color: hsla(0, 0%, 100%, .7)
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  transform: translateY(-2px);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(102, 126, 234, .3)
}

.page-btn:disabled {
  opacity: .3;
  cursor: not-allowed;
  transform: none;
  box-shadow: none
}

.page-number {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  min-width: 60px;
  text-align: center;
  padding: 4px 12px;
  background: hsla(0, 0%, 100%, .05);
  border-radius: 6px;
  border: 1px solid hsla(0, 0%, 100%, .1)
}

.pack-list::-webkit-scrollbar {
  width: 8px
}

.pack-list::-webkit-scrollbar-track {
  background: hsla(0, 0%, 100%, .05);
  border-radius: 4px;
  margin: 4px 0
}

.pack-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
  -webkit-transition: background .3s;
  transition: background .3s
}

.pack-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5d61e6, #6a4a9c)
}

@media (max-width: 768px) {
  .pack-modal-overlay {
    padding: 10px;
    background: rgba(0, 0, 0, .9)
  }

  .pack-modal-container {
    max-height: 90vh;
    max-width: 95vw;
    border-radius: 16px
  }

  .modal-header {
    padding: 16px 20px
  }

  .modal-title {
    font-size: 18px
  }

  .pack-list {
    padding: 16px 20px;
    gap: 10px
  }

  .pack-item {
    padding: 12px 16px;
    flex-wrap: nowrap;
    gap: 12px;
    min-height: 72px
  }

  .pack-number {
    width: 40px;
    height: 40px;
    font-size: 16px;
    flex-shrink: 0
  }

  .pack-content {
    flex: 1;
    min-width: 0;
    padding-right: 8px
  }

  .pack-title {
    font-size: 13px;
    line-height: 1.3;
    -webkit-line-clamp: 2;
    word-break: break-all
  }

  .pack-meta {
    gap: 10px;
    font-size: 11px;
    margin-top: 4px
  }

  .pack-date, .pack-hot {
    white-space: nowrap
  }

  .pack-date svg, .pack-hot svg {
    width: 12px;
    height: 12px
  }

  .download-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 60px
  }

  .download-btn svg {
    width: 14px;
    height: 14px
  }

  .pagination {
    padding: 12px 20px
  }

  .page-number {
    font-size: 14px
  }
}

@media (max-width: 480px) {
  .pack-item {
    padding: 10px 12px;
    gap: 8px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    grid-template-areas: "number title button" "number meta meta";
    align-items: start
  }

  .pack-number {
    grid-area: number;
    align-self: center;
    width: 36px;
    height: 36px
  }

  .pack-content {
    grid-area: title;
    padding-right: 0
  }

  .pack-title {
    font-size: 12px;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden
  }

  .pack-meta {
    grid-area: meta;
    margin-top: 2px;
    gap: 8px
  }

  .pack-date, .pack-hot {
    display: flex;
    align-items: center;
    gap: 4px
  }

  .pack-action {
    grid-area: button;
    align-self: center
  }

  .download-btn {
    padding: 6px 10px;
    font-size: 11px;
    min-width: 50px
  }

  .download-btn .btn-text {
    display: none
  }

  .download-btn svg {
    width: 12px;
    height: 12px;
    margin: 0
  }
}

@media (max-width: 360px) {
  .pack-modal-container {
    max-width: 100vw;
    margin: 0 10px
  }

  .modal-header {
    padding: 12px 16px
  }

  .modal-title {
    font-size: 16px
  }

  .modal-close {
    width: 32px;
    height: 32px
  }

  .pack-list {
    padding: 12px 16px
  }

  .pack-item {
    grid-template-columns: 30px 1fr 40px;
    gap: 6px
  }

  .pack-number {
    width: 30px;
    height: 30px;
    font-size: 12px
  }

  .pack-title {
    font-size: 11px;
    -webkit-line-clamp: 2
  }

  .pack-meta {
    font-size: 10px
  }

  .download-btn {
    padding: 5px 8px;
    min-width: 40px
  }

  .pack-action svg {
    width: 10px;
    height: 10px
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .pack-modal-container {
    max-height: 85vh;
    max-width: 90vw
  }

  .pack-list {
    max-height: calc(85vh - 140px)
  }

  .pack-item {
    min-height: 60px
  }

  .pack-title {
    -webkit-line-clamp: 1
  }
}

.pack-item-skeleton {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: hsla(0, 0%, 100%, .05);
  border-radius: 12px;
  gap: 16px;
  animation: pulse-288b66bf 1.5s ease-in-out infinite;
  min-height: 80px
}

@keyframes pulse-288b66bf {
  0%, to {
    opacity: 1
  }

  50% {
    opacity: .6
  }
}

.skeleton-number {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(90deg, hsla(0, 0%, 100%, .1) 25%, hsla(0, 0%, 100%, .2) 50%, hsla(0, 0%, 100%, .1) 75%);
  background-size: 200% 100%;
  animation: loading-288b66bf 1.5s ease-in-out infinite;
  flex-shrink: 0
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0
}

.skeleton-title {
  height: 20px;
  width: 80%;
  border-radius: 6px;
  background: linear-gradient(90deg, hsla(0, 0%, 100%, .1) 25%, hsla(0, 0%, 100%, .2) 50%, hsla(0, 0%, 100%, .1) 75%);
  background-size: 200% 100%;
  animation: loading-288b66bf 1.5s ease-in-out infinite
}

.skeleton-meta {
  display: flex;
  gap: 20px;
  align-items: center
}

.skeleton-date, .skeleton-hot {
  height: 12px;
  width: 60px;
  border-radius: 4px;
  background: linear-gradient(90deg, hsla(0, 0%, 100%, .1) 25%, hsla(0, 0%, 100%, .2) 50%, hsla(0, 0%, 100%, .1) 75%);
  background-size: 200% 100%;
  animation: loading-288b66bf 1.5s ease-in-out infinite
}

.skeleton-button {
  width: 80px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(102, 126, 234, .2) 25%, rgba(102, 126, 234, .3) 50%, rgba(102, 126, 234, .2) 75%);
  background-size: 200% 100%;
  animation: loading-288b66bf 1.5s ease-in-out infinite;
  flex-shrink: 0
}

@keyframes loading-288b66bf {
  0% {
    background-position: 200% 0
  }

  to {
    background-position: -200% 0
  }
}

.pagination-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  gap: 10px
}

.loading-dots {
  display: flex;
  gap: 8px
}

.loading-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  animation: bounce-288b66bf 1.4s ease-in-out infinite
}

.loading-dots .dot:nth-child(2) {
  animation-delay: .2s
}

.loading-dots .dot:nth-child(3) {
  animation-delay: .4s
}

@keyframes bounce-288b66bf {
  0%, 60%, to {
    transform: translateY(0)
  }

  30% {
    transform: translateY(-6px)
  }
}

.pagination-loading .loading-text {
  font-size: 14px;
  color: hsla(0, 0%, 100%, .5);
  animation: pulse-288b66bf 2s ease-in-out infinite
}

.pack-item {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .3s ease, transform .3s ease
}

.pack-item.fade-in {
  opacity: 1;
  transform: translateY(0)
}

.pack-item:first-child {
  transition-delay: .1s
}

.pack-item:nth-child(2) {
  transition-delay: .2s
}

.pack-item:nth-child(3) {
  transition-delay: .3s
}

.pack-item:nth-child(4) {
  transition-delay: .4s
}

.pack-item:nth-child(5) {
  transition-delay: .5s
}

.pack-item:nth-child(6) {
  transition-delay: .6s
}

.download-btn .btn-text {
  display: inline
}

@media (max-width: 480px) {
  .download-btn .btn-text {
    display: none
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, .85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn-7ee3dc88 .2s ease
}

@keyframes fadeIn-7ee3dc88 {
  0% {
    opacity: 0
  }

  to {
    opacity: 1
  }
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  animation: slideUp-7ee3dc88 .3s ease;
  border: 1px solid #333;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .3)
}

@keyframes slideUp-7ee3dc88 {
  0% {
    opacity: 0;
    transform: translateY(20px)
  }

  to {
    opacity: 1;
    transform: translateY(0)
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: hsla(0, 0%, 100%, .1);
  border: none;
  color: hsla(0, 0%, 100%, .6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .2s ease;
  z-index: 10;
  padding: 0
}

.close-btn:hover {
  background: hsla(0, 0%, 100%, .2);
  color: hsla(0, 0%, 100%, .9);
  transform: scale(1.1)
}

.close-btn:active {
  transform: scale(.9)
}

.close-btn svg {
  width: 20px;
  height: 20px
}

.modal-content {
  padding: 30px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px
}

.song-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0;
  text-align: center;
  width: 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  letter-spacing: 1px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  max-height: 2.8em;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box
}

.qrcode-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%
}

.qrcode-wrapper {
  width: 240px;
  height: 240px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2);
  position: relative;
  min-height: 240px
}

.qrcode-canvas {
  width: 220px;
  height: 220px;
  border-radius: 4px;
  animation: fadeIn-7ee3dc88 .3s ease
}

.scan-hint {
  font-size: 16px;
  color: hsla(0, 0%, 100%, .8);
  text-align: center;
  font-weight: 400;
  width: 100%;
  margin: 5px 0;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .2s ease;
  opacity: .8
}

.scan-hint:hover {
  color: #fff;
  opacity: 1;
  text-decoration: underline
}

.qr-loading {
  font-size: 14px;
  color: hsla(0, 0%, 100%, .6);
  text-align: center;
  padding: 8px 0
}

.format-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  margin-top: 10px
}

.format-btn {
  padding: 16px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s ease;
  outline: none;
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 100%;
  letter-spacing: 1px;
  min-width: 120px;
  flex: 1
}

.format-buttons .single-btn {
  max-width: 240px;
  width: auto;
  min-width: 180px;
  flex: none
}

.format-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2)
}

.format-btn.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3);
  border: 2px solid hsla(0, 0%, 100%, .3)
}

.wav-btn {
  background: #4caf50;
  color: #fff;
  border: none
}

.wav-btn:hover {
  background: #45a049;
  box-shadow: 0 4px 12px rgba(76, 175, 80, .2)
}

.wav-btn.active {
  background: #388e3c;
  box-shadow: 0 4px 12px rgba(76, 175, 80, .3);
  border: 2px solid hsla(0, 0%, 100%, .4)
}

.mp3-btn {
  background: #616161;
  color: #fff;
  border: none
}

.mp3-btn:hover {
  background: #555;
  box-shadow: 0 4px 12px rgba(97, 97, 97, .2)
}

.mp3-btn.active {
  background: #424242;
  box-shadow: 0 4px 12px rgba(97, 97, 97, .3);
  border: 2px solid hsla(0, 0%, 100%, .3)
}

.backup-btn {
  background: #616161;
  color: #fff;
  border: none
}

.backup-btn:hover {
  background: #555;
  box-shadow: 0 4px 12px rgba(97, 97, 97, .2)
}

.backup-btn.active {
  background: #424242;
  box-shadow: 0 4px 12px rgba(97, 97, 97, .3);
  border: 2px solid hsla(0, 0%, 100%, .3)
}

.mobile-download-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  margin-top: 20px
}

.mobile-buttons {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  max-width: 320px;
  justify-content: center
}

.mobile-btn {
  padding: 20px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all .2s ease;
  outline: none;
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 100%;
  letter-spacing: 1px;
  min-width: 120px;
  flex: 1
}

.mobile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2)
}

.mobile-btn:active {
  transform: translateY(0)
}

.mobile-buttons .single-btn {
  max-width: 240px;
  width: auto;
  min-width: 180px;
  flex: none
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 320px
  }

  .modal-content {
    padding: 30px 20px 20px;
    gap: 16px
  }

  .song-title {
    font-size: 18px;
    -webkit-line-clamp: 2
  }

  .mobile-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center
  }

  .mobile-btn {
    min-width: 140px
  }

  .mobile-buttons .single-btn {
    max-width: 200px
  }

  .close-btn {
    width: 32px;
    height: 32px;
    top: 12px;
    right: 12px
  }

  .close-btn svg {
    width: 18px;
    height: 18px
  }
}

@media (max-width: 480px) {
  .modal-container {
    max-width: 280px
  }

  .modal-content {
    padding: 24px 16px 16px
  }

  .song-title {
    font-size: 16px;
    -webkit-line-clamp: 2
  }

  .mobile-buttons {
    flex-direction: row;
    gap: 8px
  }

  .mobile-btn {
    padding: 16px 20px;
    font-size: 15px;
    min-width: 120px
  }

  .mobile-buttons .single-btn {
    max-width: 180px
  }

  .close-btn {
    width: 28px;
    height: 28px
  }

  .close-btn svg {
    width: 16px;
    height: 16px
  }

  @media (max-width: 360px) {
    .mobile-buttons {
      flex-direction: column
    }

    .mobile-btn {
      width: 100%;
      max-width: 200px
    }
  }
}

@media (min-width: 769px) {
  .mobile-download-area {
    display: none
  }

  .format-buttons, .qrcode-area {
    display: flex
  }
}

@media (max-width: 768px) {
  .format-buttons, .qrcode-area {
    display: none
  }

  .mobile-download-area {
    display: flex
  }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity .2s ease
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0
}

.modal-fade-enter-active .modal-container, .modal-fade-leave-active .modal-container {
  transition: transform .2s ease, opacity .2s ease
}

.modal-fade-enter-from .modal-container, .modal-fade-leave-to .modal-container {
  opacity: 0;
  transform: translateY(20px)
}

.music-app {
  background: #121212;
  min-height: 100vh;
  color: #fff;
  padding-bottom: 80px;
  box-sizing: border-box;
  position: relative
}

.pack-float-btn {
  position: fixed;
  right: 30px;
  bottom: 120px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all .3s cubic-bezier(.4, 0, .2, 1);
  animation: floatBtnAppear-310ae4da .5s ease;
  animation-fill-mode: both;
  animation-delay: 1s;
  opacity: 0
}

@keyframes floatBtnAppear-310ae4da {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(.8)
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1)
  }
}

.float-btn-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, .4);
  transition: all .3s;
  position: relative;
  overflow: hidden
}

.float-btn-icon:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #764ba2, #667eea);
  opacity: 0;
  transition: opacity .3s
}

.float-btn-icon:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 35px rgba(102, 126, 234, .6)
}

.float-btn-icon:hover:before {
  opacity: 1
}

.float-btn-icon svg {
  width: 28px;
  height: 28px;
  color: #fff;
  position: relative;
  z-index: 1;
  transition: transform .3s
}

.float-btn-icon:hover svg {
  transform: translateY(3px)
}

.float-btn-text {
  background: rgba(0, 0, 0, .7);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  opacity: .8;
  transition: all .3s;
  backdrop-filter: blur(10px);
  border: 1px solid hsla(0, 0%, 100%, .1);
  white-space: nowrap
}

.pack-float-btn:hover .float-btn-text {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .3)
}

@media (max-width: 768px) {
  .pack-float-btn {
    right: 20px;
    bottom: 100px
  }

  .float-btn-icon {
    width: 50px;
    height: 50px
  }

  .float-btn-icon svg {
    width: 24px;
    height: 24px
  }

  .float-btn-text {
    font-size: 12px;
    padding: 5px 10px
  }
}

.content-area {
  padding: 20px 20px 20px;
  min-height: calc(100vh - 200px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column
}

.page-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid hsla(0, 0%, 100%, .1)
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #fff;
  letter-spacing: .5px
}

.collection-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1db954;
  letter-spacing: .5px
}

.stat-label {
  font-size: 12px;
  color: hsla(0, 0%, 100%, .7);
  letter-spacing: 1px
}

.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(244, 67, 54, .2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, .3);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all .3s;
  flex-shrink: 0
}

.clear-all-btn:hover {
  background: rgba(244, 67, 54, .3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, .2)
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px);
  text-align: center
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid hsla(0, 0%, 100%, .1);
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin-310ae4da 1s linear infinite;
  margin-bottom: 20px
}

.loading-text {
  color: #aaa;
  font-size: 16px;
  letter-spacing: 1px
}

@keyframes spin-310ae4da {
  to {
    transform: rotate(1turn)
  }
}

.search-status {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 200px);
  text-align: center
}

.searching-text {
  color: #1db954;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
  padding: 20px;
  background: rgba(29, 185, 84, .1);
  border-radius: 10px;
  border: 1px solid rgba(29, 185, 84, .2)
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px);
  text-align: center;
  padding: 20px;
  flex: 1
}

.empty-icon {
  font-size: 60px;
  color: #666;
  margin-bottom: 20px;
  animation: pulse-310ae4da 2s infinite
}

@keyframes pulse-310ae4da {
  0%, to {
    opacity: .6;
    transform: scale(1)
  }

  50% {
    opacity: 1;
    transform: scale(1.1)
  }
}

.empty-text {
  color: #888;
  font-size: 18px;
  margin-bottom: 30px;
  max-width: 300px;
  line-height: 1.5
}

.empty-actions {
  display: flex;
  gap: 20px
}

.explore-btn, .reload-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all .3s;
  border: none;
  outline: none;
  min-width: 120px
}

.explore-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, .3)
}

.explore-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, .4)
}

.reload-btn {
  background: rgba(29, 185, 84, .2);
  color: #fff;
  border: 1px solid rgba(29, 185, 84, .3)
}

.reload-btn:hover {
  background: rgba(29, 185, 84, .4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(29, 185, 84, .2)
}

.reload-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(29, 185, 84, .2)
}

@media (max-width: 768px) {
  .content-area {
    padding: 15px 15px 15px
  }

  .page-title {
    font-size: 20px
  }

  .collection-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px
  }

  .clear-all-btn {
    width: 100%;
    justify-content: center
  }

  .empty-container, .loading-container, .search-status {
    height: calc(100vh - 150px)
  }

  .loading-spinner {
    width: 30px;
    height: 30px
  }

  .empty-icon {
    font-size: 50px
  }

  .searching-text {
    font-size: 16px;
    padding: 15px
  }

  .empty-text {
    font-size: 16px
  }

  .empty-actions {
    flex-direction: column;
    gap: 10px
  }

  .explore-btn, .reload-btn {
    padding: 10px 20px;
    font-size: 13px
  }
}


</style>