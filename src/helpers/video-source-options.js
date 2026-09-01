export const formatVideoSourceOptions = (sourceList = []) => (sourceList ?? []).map((item, index) => ({
  label: `(${index + 1}) ${item.name} [${item.id}]`,
  value: item.name,
  data: item,
}))
