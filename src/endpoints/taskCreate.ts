import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {Context} from "hono"
import {taskCreateSchema, taskSelectSchema, Task, TaskCreateSchema} from '../../data/types'
import {DbService} from "../../data/services";
import {tasks} from "../../data/schemas";

export class TaskCreate extends OpenAPIRoute {
	schema = {
		tags: ["Tasks"],
		summary: "Create a new Task",
		request: {
			body: {
				content: {
					"application/json": {
						schema: taskCreateSchema,
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Returns the created task",
				content: {
					"application/json": {
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
	};

	async handle(c: Context) {
		// Get validated data
		const data = await this.getValidatedData<typeof this.schema>();

		// Retrieve the validated request body
		const taskToCreate = data.body

    const db: DbService = c.get('db')

    // const task = await db.insertReturning(tasks, taskToCreate)

		// Implement your own object insertion here

		// return the new task
		return {
			success: true,
			task: {
				name: taskToCreate.name,
				slug: taskToCreate.slug,
				description: taskToCreate.description,
				completed: taskToCreate.completed,
				due_date: taskToCreate.due_date,
			},
		};
	}
}
