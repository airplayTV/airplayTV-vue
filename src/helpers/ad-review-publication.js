export const mergeCandidateActivation = (currentActive, candidate) => {
  const activation = candidate?.activation ?? candidate?.Activation ?? null
  if (!activation) return currentActive
  return {
    activation,
    rule: candidate?.rule ?? candidate?.Rule ?? null,
  }
}

export const loadCandidateConflictsSafely = async (ruleId, loader) => {
  if (!ruleId) return { conflicts: [], error: null }
  try {
    const conflicts = await loader(ruleId)
    return { conflicts: Array.isArray(conflicts) ? conflicts : [], error: null }
  } catch (error) {
    return { conflicts: [], error }
  }
}
