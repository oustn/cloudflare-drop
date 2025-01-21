import { Bool } from 'chanfana'
import { z } from 'zod'
import { Context } from 'hono'
import { tasks, taskInsertSchema, taskSelectSchema } from '../../data/schemas'
import { Endpoint } from '../endpoint'

export class TaskCreate extends Endpoint {
  schema = {
    tags: ['Tasks'],
    summary: 'Create a new Task',
    request: {
      body: {
        content: {
          'application/json': {
            schema: taskInsertSchema,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Returns the created task',
        content: {
          'application/json': {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  task: taskSelectSchema,
                }),
              }),
            }),
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()

    const taskToCreate = data.body

    const db = this.getDB(c)

    const [task] = await db.insert(tasks).values(taskToCreate).returning()

    return {
      success: true,
      task,
    }
  }
}
