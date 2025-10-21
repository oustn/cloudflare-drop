import { z } from 'zod'
import { Context } from 'hono'
import { eq } from 'drizzle-orm'

import { Endpoint } from '../endpoint'
import { files } from '../../data/schemas'

export class AdminDownloadFile extends Endpoint {
  schema = {
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      '200': {
        description: 'Returns the file for download',
        content: {
          'application/octet-stream': {
            schema: z.any(),
          },
        },
      },
      '404': {
        description: 'File not found',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const id = data.params.id
    const kv = this.getKV(c)
    const db = this.getDB(c)

    // Get file record from database
    const [record] = await db.select().from(files).where(eq(files.id, id))
    if (!record) {
      return this.error('File not found', true, 404)
    }

    const objectId = record.objectId

    // Get file from KV storage
    const {
      value: file,
      metadata,
    }: {
      value: null | ArrayBuffer
      metadata: null | Array<{
        objectId: string
        chunkId: number
      }>
    } = await kv.getWithMetadata(objectId, 'arrayBuffer')

    if (!file && !metadata) {
      return this.error('File data not found', true, 404)
    }

    // Handle large files (chunked)
    if (metadata) {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      
      // Process chunks asynchronously
      ;(async () => {
        try {
          for (let i = 0; i < metadata.length; i++) {
            const chunk = await kv.get(metadata[i].objectId, 'arrayBuffer')
            if (!chunk) {
              await writer.close()
              throw new Error('File chunk missing')
            }
            await writer.write(new Uint8Array(chunk))
          }
          await writer.close()
        } catch (error) {
          await writer.abort(error)
        }
      })()

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': record.type ?? 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(record.filename)}"`,
          'Content-Length': record.size.toString(),
        },
      })
    }

    // Handle small files
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': record.type ?? 'application/octet-stream',  
        'Content-Disposition': `attachment; filename="${encodeURIComponent(record.filename)}"`,
        'Content-Length': record.size.toString(),
      },
    })
  }
}
