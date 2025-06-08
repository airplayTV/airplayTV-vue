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

export { formatVideoSourceMap }
