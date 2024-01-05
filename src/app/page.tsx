import { TodoList } from "./components/todo-list";
import { TodoNew } from "./components/todo-new";

export default function Home() {
  return (
    <main>
      <h1>Todo</h1>
      <TodoNew />
      <TodoList />
    </main>
  );
}
