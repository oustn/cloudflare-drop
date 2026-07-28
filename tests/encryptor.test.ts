import { expect, test, vi } from 'vitest'

vi.mock('argon2-browser/dist/argon2-bundled.min.js', () => ({
  ArgonType: { Argon2id: 2 },
  hash: async ({
    pass,
    salt,
    hashLen,
  }: {
    pass: string
    salt: Uint8Array
    hashLen: number
  }) => {
    const passBytes = new TextEncoder().encode(pass)
    const input = new Uint8Array(passBytes.byteLength + salt.byteLength)
    input.set(passBytes)
    input.set(salt, passBytes.byteLength)
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', input))
    const output = new Uint8Array(hashLen)
    for (let offset = 0; offset < hashLen; offset += digest.byteLength) {
      output.set(
        digest.slice(0, Math.min(digest.byteLength, hashLen - offset)),
        offset,
      )
    }
    return { hash: output }
  },
}))

const { Encryptor } = await import('../web/helpers/encryptor')

async function collect(stream: ReadableStream<Uint8Array>) {
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function swapFirstTwoFrames(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const headerLength = view.getUint32(0, true)
  const headerStart = 4
  const chunkSizeOffset = headerStart + 2 + 2 + 4 + 4
  const chunkSize = view.getUint32(chunkSizeOffset, true)
  const firstFrameStart = headerStart + headerLength
  const frameLength = chunkSize + 16
  const firstFrame = bytes.slice(firstFrameStart, firstFrameStart + frameLength)
  const secondFrame = bytes.slice(
    firstFrameStart + frameLength,
    firstFrameStart + frameLength * 2,
  )
  const reordered = bytes.slice()
  reordered.set(secondFrame, firstFrameStart)
  reordered.set(firstFrame, firstFrameStart + frameLength)
  return reordered
}

test('V2 streaming encryption decrypts chunked data and encrypted metadata', async () => {
  const content = 'hello streaming encryption '.repeat(120_000)
  const file = new File([content], '报告.txt', {
    type: 'text/plain;charset=utf-8',
  })
  const arrayBuffer = vi.spyOn(file, 'arrayBuffer')

  const encrypted = await Encryptor.encryptStream('secret', file)
  const decrypted = await Encryptor.decryptWithMetadata(
    'secret',
    new Blob([await collect(encrypted.stream)]),
  )

  expect(arrayBuffer).not.toHaveBeenCalled()
  expect(decrypted.metadata).toEqual({
    filename: '报告.txt',
    type: 'text/plain;charset=utf-8',
  })
  await expect(decrypted.blob.text()).resolves.toBe(content)
})

test('V2 streaming encryption reports the exact encrypted byte length', async () => {
  const file = new File(['hello encrypted size'.repeat(150_000)], '报告.txt', {
    type: 'text/plain',
  })

  const encrypted = await Encryptor.encryptStream('secret', file)
  const bytes = await collect(encrypted.stream)

  expect(encrypted.size).toBe(bytes.byteLength)
})

test('V2 streaming encryption rejects tampered frame data', async () => {
  const encrypted = await Encryptor.encryptStream(
    'secret',
    new Blob(['frame data'.repeat(200_000)]),
  )
  const bytes = await collect(encrypted.stream)
  const headerLength = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(0, true)
  bytes[4 + headerLength + 5] ^= 1

  await expect(
    Encryptor.decryptWithMetadata('secret', new Blob([bytes])),
  ).rejects.toThrow()
})

test('V2 streaming encryption rejects truncated data', async () => {
  const encrypted = await Encryptor.encryptStream(
    'secret',
    new Blob(['truncated data'.repeat(200_000)]),
  )
  const bytes = await collect(encrypted.stream)

  await expect(
    Encryptor.decryptWithMetadata('secret', new Blob([bytes.slice(0, -1)])),
  ).rejects.toThrow()
})

test('V2 streaming encryption rejects reordered frames', async () => {
  const encrypted = await Encryptor.encryptStream(
    'secret',
    new Blob(['abc'.repeat(900_000)]),
  )
  const bytes = await collect(encrypted.stream)

  await expect(
    Encryptor.decryptWithMetadata(
      'secret',
      new Blob([swapFirstTwoFrames(bytes)]),
    ),
  ).rejects.toThrow()
})
