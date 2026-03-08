import * as SDK from "azure-devops-extension-sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WorkItemFormApp } from "./WorkItemFormApp";

async function boot() {
  await SDK.init({
    applyTheme: true,
  });

  const root = document.getElementById("root");
  if (!root) throw new Error("No #root element");

  createRoot(root).render(
    <StrictMode>
      <WorkItemFormApp sdk={SDK} />
    </StrictMode>,
  );
}

void boot();
