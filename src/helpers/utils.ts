import { KEY_VIDEO_SOURCE } from '@/helpers/constant.ts'

const getStorageSync = (key: string) => {
  const v = localStorage.getItem(key)
  if (!v) {
    return v
  }
  try {
    return JSON.parse(v)
  } catch (e) {
    return null
  }
}

const setStorageSync = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    return false
  }
  return true
}

const removeStorageSync = (key: string) => {
  localStorage.removeItem(key)
  return true
}

const arrayContainsValue = (list: [], value: any, compareFn: (item: any, v: any) => {}) => {
  let result = null
  list.filter((item) => {
    const r = compareFn(item, value)
    if (r) {
      result = r
    }
  })
  return result
}

const arrayValuePick = (list: [], params: any, calculate: (item: any, v: any) => {}) => {
  let result = false
  list.filter((item) => {
    if (calculate(item, params)) {
      result = true
    }
  })
  return result
}

const getCurrentSource = (route: any) => {
  // if (route && route._source) {
  //   return route._source
  // }
  if (route && route.query?._source) {
    return route.query._source
  }
  return getStorageSync(KEY_VIDEO_SOURCE)
}

const computeWindowWidthColumn = () => {
  let column = 0
  if (window.innerWidth <= 350) {
    column = 1
  } else if (window.innerWidth <= 370 + 200) {
    column = 2
  } else if (window.innerWidth <= 370 + 200 * 2) {
    column = 3
  } else if (window.innerWidth <= 370 + 200 * 3) {
    column = 4
  } else if (window.innerWidth <= 370 + 200 * 4) {
    column = 5
  } else {
    column = 6
  }
  return { _column: column, _windowWidth: window.innerWidth }
}

export {
  getStorageSync,
  setStorageSync,
  removeStorageSync,
  arrayContainsValue,
  getCurrentSource,
  computeWindowWidthColumn
}
