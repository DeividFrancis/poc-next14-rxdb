import { RxDatabase, addRxPlugin, createRxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { TodoCollection, todoSchema } from './models/todo';
import { replicateWithWebsocketServer } from 'rxdb/plugins/replication-websocket';
import { sync } from './sync';

addRxPlugin(RxDBDevModePlugin);

export async function initalizeDB() {
  const database: Database = await createRxDatabase({
    name: 'mydatabase',
    storage: getRxStorageDexie(),
    ignoreDuplicate: true

  });

  await database.addCollections({
    todos: {
      schema: todoSchema
    }
  })

  try {
    sync(database.todos)
  } catch (error) {
    console.log("SDGASDGASD", error)
  }

  return database;
}

export type DatabaseCollections = {
  todos: TodoCollection
}

export type Database = RxDatabase<DatabaseCollections>;

