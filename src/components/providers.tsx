"use client";

import { PropsWithChildren } from "react";
import { DatabaseProvider } from "~/stores/database";

export function Providers({ children }: PropsWithChildren) {
  return <DatabaseProvider>{children}</DatabaseProvider>;
}
