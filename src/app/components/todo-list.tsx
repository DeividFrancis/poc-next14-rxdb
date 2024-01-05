"use client";
import { useEffect, useState } from "react";
import { TodoCollection, TodoDocType } from "~/databases/models/todo";
import { useDatabase } from "~/stores/database";

export function TodoList() {
  const database = useDatabase();

  const [todos, setTodos] = useState<TodoDocType[]>([]);

  useEffect(() => {
    database?.todos
      .find()
      .exec()
      .then((todos) => {
        setTodos(todos);
      });
  }, [database]);

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
