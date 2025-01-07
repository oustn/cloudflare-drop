import {drizzle, DrizzleD1Database} from "drizzle-orm/d1";
import type { SQLiteTable, SelectedFieldsFlat } from "drizzle-orm/sqlite-core"
import {SQLiteInsertBase, SQLiteInsertValue} from "drizzle-orm/sqlite-core/query-builders/insert";

export class DbService {
  private client: DrizzleD1Database

  constructor(private dbBinding: D1Database) {
    this.client = drizzle(dbBinding)
  }

  insert<TTable extends SQLiteTable>(table: TTable, value: SQLiteInsertValue<TTable>) {
    return this.client.insert(table).values(value)
  }

  async insertReturning<TTable extends SQLiteTable, TSelectedFields extends SelectedFieldsFlat>(table: TTable, value: SQLiteInsertValue<TTable>, fields?: TSelectedFields) {
    const result = await this.client.insert(table)
      .values(value)
      .returning(fields)

    return result[0]
  }
}
