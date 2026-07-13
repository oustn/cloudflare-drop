// @ts-expect-error sub module
import { ArgonType, hash } from 'argon2-browser/dist/argon2-bundled.min.js'
import { i18nStore } from '../i18n'

export class Encryptor {
  private static HEADER_METADATA_SIZE = 4 // 增加版本資訊（2 位元組）
  private static VERSION = 1
  private static SALT_LENGTH = 16
  private static IV_LENGTH = 12
  private static VERSION_LENGTH = 2
  private static HASH_LENGTH = 32

  private static async deriveKey(
    password: string,
    salt: Uint8Array<ArrayBuffer>,
  ) {
    const keyMaterial = await hash({
      pass: password,
      salt: salt,
      time: 3,
      mem: 65536,
      hashLen: 32,
      type: ArgonType.Argon2id,
    })
    return crypto.subtle.importKey(
      'raw',
      keyMaterial.hash,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt'],
    )
  }

  static async encrypt(password: string, blob: File | Blob) {
    const salt = crypto.getRandomValues(new Uint8Array(Encryptor.SALT_LENGTH))
    const iv = crypto.getRandomValues(new Uint8Array(Encryptor.IV_LENGTH))
    const passwordKey = await this.deriveKey(password, salt)
    const dataKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
    const exportedDataKey = await crypto.subtle.exportKey('raw', dataKey)
    const encryptedDataKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      passwordKey,
      exportedDataKey,
    )
    const dataBuffer = await blob.arrayBuffer()
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      dataKey,
      dataBuffer,
    )
    const dataHash = await crypto.subtle.digest('SHA-256', encryptedData)

    const header = new Uint8Array([
      ...new Uint8Array(new Uint16Array([this.VERSION]).buffer), // 版本資訊
      ...salt,
      ...iv,
      ...new Uint8Array(encryptedDataKey),
    ])
    const headerLength = new Uint8Array(new Uint32Array([header.length]).buffer)

    const encryptedBlob = new Blob([
      headerLength,
      header,
      dataHash,
      encryptedData,
    ])

    if (blob instanceof File) {
      return new File([encryptedBlob], blob.name, {
        type: blob.type,
        lastModified: blob.lastModified,
      })
    } else {
      return new Blob([encryptedBlob], {
        type: 'plain/string',
      })
    }
  }

  static async decrypt(password: string, encryptedBlob: Blob | File) {
    const buffer = await encryptedBlob.arrayBuffer()
    const headerLength = new DataView(buffer).getUint32(0, true)

    const header = new Uint8Array(
      buffer.slice(
        this.HEADER_METADATA_SIZE,
        this.HEADER_METADATA_SIZE + headerLength,
      ),
    )
    const version = new DataView(header.buffer).getUint16(0, true)
    if (version !== this.VERSION)
      throw new Error(i18nStore.t('errors', 'versionMismatch'))

    const salt = header.slice(
      Encryptor.VERSION_LENGTH,
      Encryptor.VERSION_LENGTH + Encryptor.SALT_LENGTH,
    )
    const iv = header.slice(
      Encryptor.VERSION_LENGTH + Encryptor.SALT_LENGTH,
      Encryptor.VERSION_LENGTH + Encryptor.SALT_LENGTH + Encryptor.IV_LENGTH,
    )
    const encryptedDataKey = header.slice(
      Encryptor.VERSION_LENGTH + Encryptor.SALT_LENGTH + Encryptor.IV_LENGTH,
    )
    const dataHash = buffer.slice(
      this.HEADER_METADATA_SIZE + headerLength,
      this.HEADER_METADATA_SIZE + headerLength + Encryptor.HASH_LENGTH,
    )
    const encryptedData = buffer.slice(
      this.HEADER_METADATA_SIZE + headerLength + Encryptor.HASH_LENGTH,
    )

    const passwordKey = await this.deriveKey(password, salt)
    const decryptedDataKey = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      passwordKey,
      encryptedDataKey,
    )
    const dataKey = await crypto.subtle.importKey(
      'raw',
      decryptedDataKey,
      { name: 'AES-GCM' },
      true,
      ['decrypt'],
    )
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      dataKey,
      encryptedData,
    )

    const recalculatedHash = await crypto.subtle.digest(
      'SHA-256',
      encryptedData,
    )
    if (!this.compareBuffers(dataHash, recalculatedHash)) {
      throw new Error(i18nStore.t('errors', 'integrityCheckFailed'))
    }

    return new Blob([decryptedData])
  }

  private static compareBuffers(buf1: ArrayBuffer, buf2: ArrayBuffer) {
    if (buf1.byteLength !== buf2.byteLength) return false
    const view1 = new Uint8Array(buf1)
    const view2 = new Uint8Array(buf2)
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) return false
    }
    return true
  }
}
