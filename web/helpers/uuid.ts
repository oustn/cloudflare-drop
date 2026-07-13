export function getUserUUID() {
  const key = 'user_uuid'
  let uuid = localStorage.getItem(key)

  if (!uuid) {
    uuid = crypto.randomUUID() // 產生新的 UUID
    localStorage.setItem(key, uuid) // 儲存到 localStorage
  }

  return uuid
}
