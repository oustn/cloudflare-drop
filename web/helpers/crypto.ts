const KEY = 'b3cbcd274587fefc3785586a4adc8c76'

function str2ab(str: string) {
  console.log(str.length)
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

async function importPrivateKey(key: string) {
  // 将二进制字符串转换为 ArrayBuffer
  const binaryDer = str2ab(key)
  console.log(binaryDer)

  return window.crypto.subtle.importKey(
    'raw',
    new Uint8Array(binaryDer),
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  )
}

async function transformData(
  file: Blob | File,
  password: string,
  type: 'encrypt' | 'decrypt' = 'encrypt',
) {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)
  const iv = new TextEncoder().encode(password)
  const key = await importPrivateKey(KEY)
  const encrypted = await crypto.subtle[type](
    { name: 'AES-GCM', iv: iv },
    key,
    data,
  )
  if (file instanceof File) {
    return new File([encrypted], file.name, {
      type: file.type,
      lastModified: file.lastModified,
    })
  } else {
    return new Blob([encrypted], {
      type: 'plain/string',
    })
  }
}

export async function encrypt(file: Blob | File, password: string) {
  return transformData(file, password)
}

export async function decrypt(encryptedFile: Blob, password: string) {
  return transformData(encryptedFile, password, 'decrypt')
}
