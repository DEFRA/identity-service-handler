export function filterByKeyValue(value, key, filter) {
  return value.filter((x) =>
    Array.isArray(x[key]) ? x[key].includes(filter) : x[key] === filter
  )
}

export function sort(value, key, order = 'asc') {
  return order === 'asc'
    ? value.sort((a, b) => (a[key] > b[key] ? 1 : -1))
    : value.sort((a, b) => (a[key] < b[key] ? 1 : -1))
}
