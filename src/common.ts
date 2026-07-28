import dayjs from 'dayjs'
import { ManipulateType } from 'dayjs'

export const MAX_DURATION = dayjs('9999-01-01')

export const MIN_DURATION = dayjs('1900-01-01')

const durationUnits = ['minute', 'hour', 'day', 'week', 'month', 'year']
const maxCustomDuration = 5

export function resolveShareDuration(input: string): {
  permanent: boolean
  dueDate: Date
} {
  const match = new RegExp(`^(\\d+)(${durationUnits.join('|')})$`).exec(input)
  if (!match) throw new Error('分享有效期格式错误')
  const amount = Number.parseInt(match[1], 10)
  const unit = match[2] as ManipulateType
  if (amount === 999 && unit === 'year') {
    return { permanent: true, dueDate: MAX_DURATION.toDate() }
  }
  const dueDate = dayjs().add(amount, unit)
  if (amount < 1 || dueDate.isAfter(dayjs().add(maxCustomDuration, 'year'))) {
    throw new Error(`分享有效期不能超过 ${maxCustomDuration} 年`)
  }
  return { permanent: false, dueDate: dueDate.toDate() }
}
