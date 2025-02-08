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

export { getStorageSync, setStorageSync, removeStorageSync, arrayContainsValue }
