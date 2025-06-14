const formatVideoSourceMap = (videoLinks) => {
  let linkMap = {}
  videoLinks?.filter((item) => {
    if (!linkMap[item.group]) {
      linkMap[item.group] = []
    }
    linkMap[item.group].push(item)
  })
  return linkMap
}

const getRouterLinkType = (styleConfig) => {
  if (styleConfig === 1) {
    return '_blank'
  }
  return ''
}

const getImageObjectFit = (styleConfig) => {
  if (styleConfig === 1) {
    return 'cover'
  }
  return 'cover'
}

export {
  formatVideoSourceMap,
  getRouterLinkType,
  getImageObjectFit,
}
