const SEPARATOR = '/'
const SINGLE = '+'
const ALL = '#'

export interface IParams {
  [x: string]: any
}

/**
 * Converts (a) pattern(s) into (a) clean topic(s).
 * @param  {string|string[]} pattern The pattern(s) to clean
 * @return {string|string[]}         The clean topis(s)
 */
export function clean (pattern: string|string[]) {
  if (typeof pattern === 'string') {
    return cleanSingle(pattern)
  } else if (Array.isArray(pattern)) {
    return cleanMulti(pattern)
  } else {
    throw new TypeError('pattern must be a string or array')
  }
}

/**
 * Converts a single pattern into a clean topic.
 * @param  {string} pattern The pattern to clean
 * @return {string}         The clean topic
 */
export function cleanSingle (pattern: string) {
  const patternSegments = pattern.split(SEPARATOR)
	const topicSegments = []

	for (let currentPattern of patternSegments) {
		const patternChar = currentPattern[0]

		if (patternChar === SINGLE) {
			topicSegments.push(SINGLE)
		} else if (patternChar === ALL) {
			topicSegments.push(ALL)
		} else {
			topicSegments.push(currentPattern)
		}
	}

	return topicSegments.join(SEPARATOR)
}

/**
 * Converts an array of patterns into an array of clean topics.
 * @param  {string[]} patterns The patterns to clean
 * @return {string[]}          The clean topics
 */
export function cleanMulti (patterns: string[]) {
  if (!Array.isArray(patterns)) {
    throw new TypeError('patterns must be an array')
  }

  const clean = []
  for (let pattern of patterns) {
    clean.push(cleanSingle(pattern))
  }
  return clean
}

/**
 * Checks to see if the given topic matches the given pattern.
 * @param  {string} pattern The pattern to match against
 * @param  {string} topic   The topic to match
 * @return {boolean}        True if the topic matches
 */
export function matches (pattern: string, topic: string) {
  const patternSegments = pattern.split(SEPARATOR)
	const topicSegments = topic.split(SEPARATOR)

	const patternLength = patternSegments.length
	const topicLength = topicSegments.length
	const lastIndex = patternLength - 1

	for (let i = 0; i < patternLength; i++) {
		const currentPattern = patternSegments[i]
		const patternChar = currentPattern[0]
		const currentTopic = topicSegments[i]

		if (!currentTopic && currentPattern !== ALL) return false

		// Only allow # at end
		if (patternChar === ALL)
			return i === lastIndex
		if (patternChar !== SINGLE && currentPattern !== currentTopic)
			return false
	}

  return patternLength === topicLength
}

/**
 * Extracts parameter info from the given topic by the given pattern.
 * @param  {string} pattern The pattern
 * @param  {string} topic   The topic
 * @return {IParams}        The parameters
 */
export function extract (pattern: string, topic: string) {
  const params: IParams = {}
	const patternSegments = pattern.split(SEPARATOR)
	const topicSegments = topic.split(SEPARATOR)

	const patternLength = patternSegments.length

	for (let i = 0; i < patternLength; i++) {
		const currentPattern = patternSegments[i]
		const patternChar = currentPattern[0]

		if (currentPattern.length === 1)
			continue

		if (patternChar === ALL) {
			params[currentPattern.slice(1)] = topicSegments.slice(i)
			break
		} else if (patternChar === SINGLE) {
			params[currentPattern.slice(1)] = topicSegments[i]
		}
	}

	return params
}
