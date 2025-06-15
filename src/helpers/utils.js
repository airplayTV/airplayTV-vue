import {useAppStore} from "@/stores/app.js";

const getStorageSync = (key) => {
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

const setStorageSync = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    return false
  }
  return true
}

const removeStorageSync = (key) => {
  localStorage.removeItem(key)
  return true
}

const arrayContainsValue = (list, value, compareFn) => {
  let result = null
  list.filter((item) => {
    const r = compareFn(item, value)
    if (r) {
      result = r
    }
  })
  return result
}

const arrayValuePick = (list, params, calculate) => {
  let result = false
  list.filter((item) => {
    if (calculate(item, params)) {
      result = true
    }
  })
  return result
}

const computeWindowWidthColumn = () => {
  let column = 0
  let width = 175
  let height = 230

  const appStore = useAppStore()
  if (appStore.styleConfig) {
    width = 180
    height = 120

    if (window.innerWidth <= 350) {
      column = 1
    } else if (window.innerWidth <= 370) {
      column = 2
      width = 160
      height = 100
    } else if (window.innerWidth <= 370 + 10) {
      column = 2
      width = 160
      height = 100
    } else if (window.innerWidth <= 370 + 50) {
      column = 2
      width = 160
      height = 100
    } else if (window.innerWidth <= 370 + 100) {
      column = 2
      width = 180
      height = 120
    } else if (window.innerWidth <= 370 + 200) {
      column = 2
    } else if (window.innerWidth <= 370 + 200 * 2) {
      column = 3
      width = 180 * 0.95
      height = 120 * 0.95
    } else if (window.innerWidth <= 370 + 200 * 3) {
      column = 4
      width = 180 * 0.95
      height = 120 * 0.95

    } else if (window.innerWidth <= 370 + 200 * 4) {
      column = 4
      width = 180 * 1.2
      height = 120 * 1.2
    } else {
      column = 4
      width = 180 * 1.5
      height = 120 * 1.5
    }
    return {
      _column: column,
      _windowWidth: window.innerWidth,
      _width: width,
      _height: height,
    }
  }

  if (window.innerWidth <= 350) {
    column = 1
  } else if (window.innerWidth <= 370) {
    column = 2
    width = 152
    height = 200
  } else if (window.innerWidth <= 370 + 10) {
    column = 2
    width = 160
    height = 230
  } else if (window.innerWidth <= 370 + 50) {
    column = 2
    width = 165
    height = 230
  } else if (window.innerWidth <= 370 + 100) {
    column = 2
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
  return {
    _column: column,
    _windowWidth: window.innerWidth,
    _width: width,
    _height: height,
  }
}

export {
  getStorageSync,
  setStorageSync,
  removeStorageSync,
  arrayContainsValue,
  computeWindowWidthColumn
}
