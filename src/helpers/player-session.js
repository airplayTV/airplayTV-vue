const createLatestOperationGuard = () => {
  let version = 0

  return {
    begin: () => ++version,
    invalidate: () => ++version,
    isCurrent: (operation) => operation === version,
  }
}

const mergePlaylistSource = (currentSource, playlistSource) => ({
  ...currentSource,
  ...playlistSource,
  url: playlistSource.src,
})

const runPlayerCommand = async (command, onError) => {
  try {
    await command()
    return true
  } catch (error) {
    onError(error)
    return false
  }
}

export {
  createLatestOperationGuard,
  mergePlaylistSource,
  runPlayerCommand,
}
