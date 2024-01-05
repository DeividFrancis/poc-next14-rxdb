"use client";

import { useDatabase } from "~/stores/database";

export function TodoNew() {
  const database = useDatabase();

  async function handleAddTodo() {
    const document = await database.todos.insert({
      id: crypto.randomUUID(),
      name: "Learn RxDB",
      done: false,
      timestamp: new Date().toISOString(),
    });

    console.log("todo", document);
  }
  return <button onClick={handleAddTodo}>Add todo</button>;
}
