const formatVideoSourceMap = (videoLinks: any) => {
  let linkMap = {}
  videoLinks?.filter((item: any) => {
    if (!linkMap[item.group]) {
      linkMap[item.group] = []
    }
    linkMap[item.group].push(item)
  })
  return linkMap
}

export { formatVideoSourceMap }
