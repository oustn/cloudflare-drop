export interface PasswordStrength {
  label: '弱' | '中' | '强'
  value: 33 | 66 | 100
  color: 'error' | 'warning' | 'success'
  suggestion: string
}

export function passwordStrength(password: string): PasswordStrength {
  const characterTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z\d]/.test(password),
  ].filter(Boolean).length

  const score =
    Number(password.length >= 8) +
    Number(password.length >= 12) +
    Number(characterTypes >= 2) +
    Number(characterTypes >= 3) +
    Number(characterTypes === 4)

  if (score >= 4) {
    return {
      label: '强',
      value: 100,
      color: 'success',
      suggestion: '密码强度良好，请妥善保存',
    }
  }

  if (score >= 2) {
    return {
      label: '中',
      value: 66,
      color: 'warning',
      suggestion: '建议使用 12 个以上字符，并增加字符类型',
    }
  }

  return {
    label: '弱',
    value: 33,
    color: 'error',
    suggestion: '建议至少使用 8 个字符，并混合字母、数字和符号',
  }
}
