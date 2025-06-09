import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useAppStore = defineStore('app', () => {
  const sourceList = ref(null)
  const source = ref(null)
  const tags = ref(null)

  function getSourceList() {
    return sourceList.value
  }

  function setSourceList(data) {
    sourceList.value = data
  }

  function setSource(data) {
    source.value = data
  }

  function setTags(data) {
    tags.value = data
  }

  return {
    sourceList,
    getSourceList,
    setSourceList,
    source,
    tags,
    setSource,
    setTags,
  }
})
