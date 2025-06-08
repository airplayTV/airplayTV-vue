import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const sourceList = ref(null)

  function getSourceList() {
    return sourceList.value
  }

  function setSourceList(data) {
    sourceList.value = data
  }

  return { sourceList, getSourceList, setSourceList }
})
