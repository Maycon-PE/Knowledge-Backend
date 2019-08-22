module.exports = app => {
	function existsOrError(value, errorMessage) {
		if (!value) throw errorMessage
		if (Array.isArray(value) && value.length === 0)	 throw errorMessage
		if (typeof value === 'string' && !value.trim()) throw errorMessage
		if (typeof value === 'number' && value < 0) throw errorMessage
	}

	function equalsOrError(valueA, valueB, errorMessage) {
		if (valueA !== valueB) throw errorMessage
	}

	return { existsOrError, equalsOrError }
}
