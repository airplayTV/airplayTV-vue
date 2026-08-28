const playTypeOption = Object.freeze({
  dp: 1,
  art: 2,
  iframe: 3,
  libmedia: 4,
})

const resolvePlayerPreference = (value, playerTypes = playTypeOption) => {
  const selectableTypes = [playerTypes.dp, playerTypes.art, playerTypes.libmedia]
  return selectableTypes.includes(value) ? value : playerTypes.dp
}

export {playTypeOption, resolvePlayerPreference}
