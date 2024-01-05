"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Database, initalizeDB } from "~/databases";

interface DatabaseContextData {
  database: Database;
}

const DatabaseContext = createContext({} as DatabaseContextData);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [database, setDatabase] = useState<Database>();
  useEffect(() => {
    (async () => {
      const database = await initalizeDB();
      setDatabase(database);
    })();

    return () => {
      database?.destroy();
    };
  });

  if (!database) {
    return <span>Carregando...</span>;
  }
  return (
    <DatabaseContext.Provider value={{ database }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const { database } = useContext(DatabaseContext);
  return database;
}
