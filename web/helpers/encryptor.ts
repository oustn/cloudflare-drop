// @ts-expect-error sub module
import { ArgonType, hash } from 'argon2-browser/dist/argon2-bundled.min.js'

interface EncryptionMetadata {
  filename?: string
  type?: string
}

interface DecryptedContent {
  blob: Blob
  metadata: EncryptionMetadata
}

interface ArgonParameters {
  time: number
  memory: number
}

interface EncryptionProgress {
  bytes: number
  lengthComputable: boolean
  loaded: number
  total: number
  progress: number
  upload: boolean
}

interface EncryptedStream {
  stream: ReadableStream<Uint8Array>
  size: number
}

export class Encryptor {
  private static HEADER_LENGTH_SIZE = 4
  private static VERSION_V1 = 1
  private static VERSION_V2 = 2
  private static VERSION = Encryptor.VERSION_V2
  private static V2_STREAM_MODE = 1
  private static SALT_LENGTH = 16
  private static IV_LENGTH = 12
  private static VERSION_LENGTH = 2
  private static MODE_LENGTH = 2
  private static WRAPPED_KEY_LENGTH_SIZE = 2
  private static METADATA_LENGTH_SIZE = 4
  private static ARGON_TIME_SIZE = 4
  private static ARGON_MEMORY_SIZE = 4
  private static CHUNK_SIZE_SIZE = 4
  private static NONCE_PREFIX_LENGTH = 8
  private static AES_GCM_TAG_LENGTH = 16
  private static V1_HASH_LENGTH = 32
  private static V2_CHUNK_SIZE = 1024 * 1024
  private static V2_MAX_CHUNK_SIZE = 64 * 1024 * 1024
  private static FOOTER_MAGIC = new Uint8Array([0x43, 0x44, 0x46, 0x54])
  private static FOOTER_PLAINTEXT_LENGTH = 16
  private static FOOTER_CIPHERTEXT_LENGTH =
    Encryptor.FOOTER_PLAINTEXT_LENGTH + Encryptor.AES_GCM_TAG_LENGTH
  private static ARGON: ArgonParameters = { time: 3, memory: 65536 }

  private static concat(...parts: Uint8Array[]) {
    const result = new Uint8Array(
      parts.reduce((size, part) => size + part.length, 0),
    )
    let offset = 0
    for (const part of parts) {
      result.set(part, offset)
      offset += part.length
    }
    return result
  }

  private static uint16(value: number) {
    const bytes = new Uint8Array(2)
    new DataView(bytes.buffer).setUint16(0, value, true)
    return bytes
  }

  private static uint32(value: number) {
    const bytes = new Uint8Array(4)
    new DataView(bytes.buffer).setUint32(0, value, true)
    return bytes
  }

  private static uint64(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('加密文件格式错误')
    }
    const bytes = new Uint8Array(8)
    new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true)
    return bytes
  }

  private static randomBytes(length: number) {
    if (!globalThis.crypto?.getRandomValues) {
      throw new Error('当前环境不支持 Web Crypto')
    }
    return globalThis.crypto.getRandomValues(new Uint8Array(length))
  }

  private static subtle() {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) {
      throw new Error('当前环境不支持 Web Crypto')
    }
    return subtle
  }

  private static isFile(blob: Blob): blob is File {
    return typeof File !== 'undefined' && blob instanceof File
  }

  private static async deriveKey(
    password: string,
    salt: Uint8Array,
    parameters: ArgonParameters,
  ) {
    const keyMaterial = await hash({
      pass: password,
      salt,
      time: parameters.time,
      mem: parameters.memory,
      hashLen: 32,
      type: ArgonType.Argon2id,
    })
    return this.subtle().importKey(
      'raw',
      keyMaterial.hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    )
  }

  private static frameIv(prefix: Uint8Array, index: number) {
    return this.concat(prefix, this.uint32(index))
  }

  private static label(value: string) {
    return new TextEncoder().encode(`cloudflare-drop:v2:${value}`)
  }

  private static frameAdditionalData(header: Uint8Array, index: number) {
    return this.concat(header, this.label('frame'), this.uint32(index))
  }

  private static footerAdditionalData(header: Uint8Array) {
    return this.concat(header, this.label('footer'))
  }

  private static createFooterPlaintext(
    totalChunks: number,
    plaintextSize: number,
  ) {
    return this.concat(
      this.FOOTER_MAGIC,
      this.uint32(totalChunks),
      this.uint64(plaintextSize),
    )
  }

  private static readFooterPlaintext(footer: ArrayBuffer) {
    if (footer.byteLength !== this.FOOTER_PLAINTEXT_LENGTH) {
      throw new Error('加密文件格式错误')
    }
    const bytes = new Uint8Array(footer)
    if (
      !this.compareBuffers(this.FOOTER_MAGIC.buffer, bytes.slice(0, 4).buffer)
    ) {
      throw new Error('加密文件格式错误')
    }
    const view = new DataView(footer)
    const totalChunks = view.getUint32(4, true)
    const plaintextSize = view.getBigUint64(8, true)
    if (plaintextSize > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('加密文件格式错误')
    }
    return { totalChunks, plaintextSize: Number(plaintextSize) }
  }

  private static async *fixedChunks(
    stream: ReadableStream<Uint8Array>,
    chunkSize: number,
  ) {
    const reader = stream.getReader()
    let pending = new Uint8Array(0)

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value.byteLength) continue

        const combined = new Uint8Array(pending.byteLength + value.byteLength)
        combined.set(pending)
        combined.set(value, pending.byteLength)

        let offset = 0
        while (combined.byteLength - offset >= chunkSize) {
          yield combined.slice(offset, offset + chunkSize)
          offset += chunkSize
        }
        pending = combined.slice(offset)
      }
      if (pending.byteLength) yield pending
    } finally {
      reader.releaseLock()
    }
  }

  private static progressEvent(
    loaded: number,
    total: number,
    bytes: number,
    upload: boolean,
  ): EncryptionProgress {
    return {
      bytes,
      lengthComputable: true,
      loaded,
      total,
      progress: total > 0 ? loaded / total : 1,
      upload,
    }
  }

  static async encryptStream(
    password: string,
    blob: File | Blob,
    onProgress?: (event: EncryptionProgress) => void,
  ): Promise<EncryptedStream> {
    const salt = this.randomBytes(this.SALT_LENGTH)
    const wrappingIv = this.randomBytes(this.IV_LENGTH)
    const metadataIv = this.randomBytes(this.IV_LENGTH)
    const frameNoncePrefix = this.randomBytes(this.NONCE_PREFIX_LENGTH)
    const footerIv = this.randomBytes(this.IV_LENGTH)
    const passwordKey = await this.deriveKey(password, salt, this.ARGON)
    const dataKey = await this.subtle().generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
    const metadata: EncryptionMetadata = {
      ...(this.isFile(blob) ? { filename: blob.name } : {}),
      ...(blob.type ? { type: blob.type } : {}),
    }
    const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata))
    const exportedDataKey = await this.subtle().exportKey('raw', dataKey)
    const prefix = this.concat(
      this.uint16(this.VERSION),
      this.uint16(this.V2_STREAM_MODE),
      this.uint32(this.ARGON.time),
      this.uint32(this.ARGON.memory),
      this.uint32(this.V2_CHUNK_SIZE),
      salt,
      wrappingIv,
      metadataIv,
      frameNoncePrefix,
      footerIv,
      this.uint16(48),
    )
    const encryptedDataKey = new Uint8Array(
      await this.subtle().encrypt(
        { name: 'AES-GCM', iv: wrappingIv, additionalData: prefix },
        passwordKey,
        exportedDataKey,
      ),
    )
    const metadataAdditionalData = this.concat(prefix, encryptedDataKey)
    const encryptedMetadata = new Uint8Array(
      await this.subtle().encrypt(
        {
          name: 'AES-GCM',
          iv: metadataIv,
          additionalData: metadataAdditionalData,
        },
        dataKey,
        metadataBytes,
      ),
    )
    const header = this.concat(
      metadataAdditionalData,
      this.uint32(encryptedMetadata.length),
      encryptedMetadata,
    )
    const totalChunks = Math.ceil(blob.size / this.V2_CHUNK_SIZE)
    const encryptedSize =
      this.HEADER_LENGTH_SIZE +
      header.length +
      blob.size +
      totalChunks * this.AES_GCM_TAG_LENGTH +
      this.FOOTER_CIPHERTEXT_LENGTH

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        let plaintextSize = 0
        let chunkIndex = 0
        try {
          controller.enqueue(this.uint32(header.length))
          controller.enqueue(header)

          for await (const chunk of this.fixedChunks(
            blob.stream(),
            this.V2_CHUNK_SIZE,
          )) {
            if (chunkIndex >= 0xffff_ffff) throw new Error('文件过大')
            const encryptedChunk = new Uint8Array(
              await this.subtle().encrypt(
                {
                  name: 'AES-GCM',
                  iv: this.frameIv(frameNoncePrefix, chunkIndex),
                  additionalData: this.frameAdditionalData(header, chunkIndex),
                },
                dataKey,
                chunk,
              ),
            )
            controller.enqueue(encryptedChunk)
            plaintextSize += chunk.byteLength
            chunkIndex += 1
            onProgress?.(
              this.progressEvent(
                plaintextSize,
                blob.size,
                chunk.byteLength,
                plaintextSize === blob.size,
              ),
            )
          }

          const encryptedFooter = new Uint8Array(
            await this.subtle().encrypt(
              {
                name: 'AES-GCM',
                iv: footerIv,
                additionalData: this.footerAdditionalData(header),
              },
              dataKey,
              this.createFooterPlaintext(chunkIndex, plaintextSize),
            ),
          )
          controller.enqueue(encryptedFooter)
          onProgress?.(this.progressEvent(blob.size, blob.size, 0, true))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return { stream, size: encryptedSize }
  }

  static async encrypt(password: string, blob: File | Blob) {
    const encrypted = await this.encryptStream(password, blob)
    const encryptedBlob = await new Response(encrypted.stream).blob()

    if (this.isFile(blob)) {
      return new File([encryptedBlob], 'encrypted-file', {
        type: 'application/octet-stream',
        lastModified: blob.lastModified,
      })
    }
    return new Blob([encryptedBlob], { type: 'plain/string' })
  }

  static async decrypt(password: string, encryptedBlob: Blob | File) {
    return (await this.decryptWithMetadata(password, encryptedBlob)).blob
  }

  static async decryptWithMetadata(
    password: string,
    encryptedBlob: Blob | File,
  ): Promise<DecryptedContent> {
    const buffer = await encryptedBlob.arrayBuffer()
    if (buffer.byteLength < this.HEADER_LENGTH_SIZE) {
      throw new Error('加密文件格式错误')
    }
    const headerLength = new DataView(buffer).getUint32(0, true)
    if (
      headerLength < this.VERSION_LENGTH ||
      buffer.byteLength <= this.HEADER_LENGTH_SIZE + headerLength
    ) {
      throw new Error('加密文件格式错误')
    }
    const header = new Uint8Array(
      buffer.slice(
        this.HEADER_LENGTH_SIZE,
        this.HEADER_LENGTH_SIZE + headerLength,
      ),
    )
    const encryptedData = buffer.slice(this.HEADER_LENGTH_SIZE + headerLength)
    const version = new DataView(
      header.buffer,
      header.byteOffset,
      header.byteLength,
    ).getUint16(0, true)
    if (version === this.VERSION_V1) {
      return this.decryptV1(password, encryptedBlob, header, encryptedData)
    }
    if (version !== this.VERSION_V2) throw new Error('版本不匹配')
    return this.decryptV2(password, header, encryptedData)
  }

  private static async decryptV1(
    password: string,
    encryptedBlob: Blob | File,
    header: Uint8Array,
    encryptedDataWithHash: ArrayBuffer,
  ): Promise<DecryptedContent> {
    const minimumHeaderLength =
      this.VERSION_LENGTH + this.SALT_LENGTH + this.IV_LENGTH
    if (
      header.length < minimumHeaderLength ||
      encryptedDataWithHash.byteLength <= this.V1_HASH_LENGTH
    ) {
      throw new Error('加密文件格式错误')
    }
    const salt = header.slice(
      this.VERSION_LENGTH,
      this.VERSION_LENGTH + this.SALT_LENGTH,
    )
    const iv = header.slice(
      this.VERSION_LENGTH + this.SALT_LENGTH,
      this.VERSION_LENGTH + this.SALT_LENGTH + this.IV_LENGTH,
    )
    const encryptedDataKey = header.slice(
      this.VERSION_LENGTH + this.SALT_LENGTH + this.IV_LENGTH,
    )
    const dataHash = encryptedDataWithHash.slice(0, this.V1_HASH_LENGTH)
    const encryptedData = encryptedDataWithHash.slice(this.V1_HASH_LENGTH)
    const passwordKey = await this.deriveKey(password, salt, this.ARGON)
    const decryptedDataKey = await this.subtle().decrypt(
      { name: 'AES-GCM', iv },
      passwordKey,
      encryptedDataKey,
    )
    const dataKey = await this.subtle().importKey(
      'raw',
      decryptedDataKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
    const decryptedData = await this.subtle().decrypt(
      { name: 'AES-GCM', iv },
      dataKey,
      encryptedData,
    )
    const recalculatedHash = await this.subtle().digest(
      'SHA-256',
      encryptedData,
    )
    if (!this.compareBuffers(dataHash, recalculatedHash)) {
      throw new Error('数据完整性校验失败')
    }
    return {
      blob: new Blob([decryptedData], { type: encryptedBlob.type }),
      metadata: { type: encryptedBlob.type },
    }
  }

  private static async decryptV2(
    password: string,
    header: Uint8Array,
    encryptedData: ArrayBuffer,
  ): Promise<DecryptedContent> {
    const view = new DataView(
      header.buffer,
      header.byteOffset,
      header.byteLength,
    )
    let offset = this.VERSION_LENGTH
    const minimumPrefixLength =
      this.VERSION_LENGTH +
      this.MODE_LENGTH +
      this.ARGON_TIME_SIZE +
      this.ARGON_MEMORY_SIZE +
      this.CHUNK_SIZE_SIZE +
      this.SALT_LENGTH +
      this.IV_LENGTH * 3 +
      this.NONCE_PREFIX_LENGTH +
      this.WRAPPED_KEY_LENGTH_SIZE
    if (header.length < minimumPrefixLength) throw new Error('加密文件格式错误')

    const mode = view.getUint16(offset, true)
    offset += this.MODE_LENGTH
    if (mode !== this.V2_STREAM_MODE) throw new Error('加密文件格式错误')

    const parameters = {
      time: view.getUint32(offset, true),
      memory: view.getUint32(offset + this.ARGON_TIME_SIZE, true),
    }
    offset += this.ARGON_TIME_SIZE + this.ARGON_MEMORY_SIZE
    const chunkSize = view.getUint32(offset, true)
    offset += this.CHUNK_SIZE_SIZE
    if (
      !parameters.time ||
      !parameters.memory ||
      !chunkSize ||
      chunkSize > this.V2_MAX_CHUNK_SIZE
    ) {
      throw new Error('加密文件格式错误')
    }
    const salt = header.slice(offset, (offset += this.SALT_LENGTH))
    const wrappingIv = header.slice(offset, (offset += this.IV_LENGTH))
    const metadataIv = header.slice(offset, (offset += this.IV_LENGTH))
    const frameNoncePrefix = header.slice(
      offset,
      (offset += this.NONCE_PREFIX_LENGTH),
    )
    const footerIv = header.slice(offset, (offset += this.IV_LENGTH))
    const wrappedKeyLength = view.getUint16(offset, true)
    offset += this.WRAPPED_KEY_LENGTH_SIZE
    if (
      wrappedKeyLength < this.AES_GCM_TAG_LENGTH ||
      header.length < offset + wrappedKeyLength + this.METADATA_LENGTH_SIZE
    ) {
      throw new Error('加密文件格式错误')
    }

    const prefix = header.slice(0, offset)
    const encryptedDataKey = header.slice(offset, (offset += wrappedKeyLength))
    const metadataLength = view.getUint32(offset, true)
    offset += this.METADATA_LENGTH_SIZE
    if (!metadataLength || header.length !== offset + metadataLength) {
      throw new Error('加密文件格式错误')
    }
    const encryptedMetadata = header.slice(offset)
    const passwordKey = await this.deriveKey(password, salt, parameters)
    const decryptedDataKey = await this.subtle().decrypt(
      { name: 'AES-GCM', iv: wrappingIv, additionalData: prefix },
      passwordKey,
      encryptedDataKey,
    )
    const dataKey = await this.subtle().importKey(
      'raw',
      decryptedDataKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
    const metadataAdditionalData = this.concat(prefix, encryptedDataKey)
    const metadataText = new TextDecoder().decode(
      await this.subtle().decrypt(
        {
          name: 'AES-GCM',
          iv: metadataIv,
          additionalData: metadataAdditionalData,
        },
        dataKey,
        encryptedMetadata,
      ),
    )
    let metadata: EncryptionMetadata
    try {
      metadata = JSON.parse(metadataText) as EncryptionMetadata
    } catch (_error) {
      throw new Error('加密文件格式错误')
    }
    if (
      (metadata.filename !== undefined &&
        typeof metadata.filename !== 'string') ||
      (metadata.type !== undefined && typeof metadata.type !== 'string')
    ) {
      throw new Error('加密文件格式错误')
    }

    const encryptedBytes = new Uint8Array(encryptedData)
    if (encryptedBytes.byteLength < this.FOOTER_CIPHERTEXT_LENGTH) {
      throw new Error('加密文件格式错误')
    }
    const footerStart =
      encryptedBytes.byteLength - this.FOOTER_CIPHERTEXT_LENGTH
    const footer = this.readFooterPlaintext(
      await this.subtle().decrypt(
        {
          name: 'AES-GCM',
          iv: footerIv,
          additionalData: this.footerAdditionalData(header),
        },
        dataKey,
        encryptedBytes.slice(footerStart),
      ),
    )
    const expectedChunks =
      footer.plaintextSize === 0
        ? 0
        : Math.ceil(footer.plaintextSize / chunkSize)
    if (footer.totalChunks !== expectedChunks) {
      throw new Error('加密文件格式错误')
    }

    const encryptedFrames = encryptedBytes.slice(0, footerStart)
    if (footer.totalChunks === 0) {
      if (encryptedFrames.byteLength !== 0) throw new Error('加密文件格式错误')
      return { blob: new Blob([], { type: metadata.type }), metadata }
    }

    const lastPlaintextLength =
      footer.plaintextSize - chunkSize * (footer.totalChunks - 1)
    const expectedFrameLength =
      (footer.totalChunks - 1) * (chunkSize + this.AES_GCM_TAG_LENGTH) +
      lastPlaintextLength +
      this.AES_GCM_TAG_LENGTH
    if (encryptedFrames.byteLength !== expectedFrameLength) {
      throw new Error('加密文件格式错误')
    }

    const decryptedChunks: ArrayBuffer[] = []
    let frameOffset = 0
    for (let index = 0; index < footer.totalChunks; index += 1) {
      const encryptedFrameLength =
        index < footer.totalChunks - 1
          ? chunkSize + this.AES_GCM_TAG_LENGTH
          : lastPlaintextLength + this.AES_GCM_TAG_LENGTH
      const encryptedFrame = encryptedFrames.slice(
        frameOffset,
        frameOffset + encryptedFrameLength,
      )
      frameOffset += encryptedFrameLength
      decryptedChunks.push(
        await this.subtle().decrypt(
          {
            name: 'AES-GCM',
            iv: this.frameIv(frameNoncePrefix, index),
            additionalData: this.frameAdditionalData(header, index),
          },
          dataKey,
          encryptedFrame,
        ),
      )
    }
    return {
      blob: new Blob(decryptedChunks, { type: metadata.type }),
      metadata,
    }
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
