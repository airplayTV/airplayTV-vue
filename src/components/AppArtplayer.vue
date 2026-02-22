<template>
  <div ref="artRef"></div>
</template>

<script>
import Artplayer from 'artplayer'

export default {
  data() {
    return {
      instance: null,
    }
  },
  props: {
    option: {
      type: Object,
      required: true,
    },
    source: {
      type: Object,
      required: false,
    },
  },
  mounted() {
    this.instance = new Artplayer({
      ...this.option,
      container: this.$refs.artRef,
    })
    this.instance.on('hotkey', (event) => {
      console.info('hotkey', event);
    });

    this.instance.on('restart', () => {
      this.instance.notice.show = `正在播放：${this.option.video.title}`
      setTimeout(() => {
        this.instance.notice.show = `正在播放：${this.option.video.title}`
      }, 1000)
      setTimeout(() => {
        this.instance.notice.show = `正在播放：${this.option.video.title}`
      }, 2500)
      setTimeout(() => {
        this.instance.notice.show = `正在播放：${this.option.video.title}`
      }, 3500)
    });

    // this.instance.on('ready', () => {
    //   this.instance.autoSize();
    // });
    this.$nextTick(() => {
      this.$emit('get-instance', this.instance)
    })
  },
  beforeUnmount() {
    if (this.instance && this.instance.destroy) {
      this.instance.destroy(false)
    }
  },
}
</script>
