import type * as SDK from "azure-devops-extension-sdk";
import { useEffect, useState } from "react";
import { isConfigured } from "../shared/auth";
import { Dashboard } from "./components/Dashboard";
import { SetupScreen } from "./components/SetupScreen";

interface Props {
  sdk: typeof SDK;
}

export function WorkItemFormApp({ sdk }: Props) {
  const [configured, setConfigured] = useState(isConfigured());
  const [workItemId, setWorkItemId] = useState<number | null>(null);
  const [workItemTitle, setWorkItemTitle] = useState<string>("");
  const [sdkReady, setSdkReady] = useState(false);

  // Initialise the Azure DevOps SDK and grab work item context
  useEffect(() => {
    async function init() {
      try {
        await sdk.ready();

        // Register the extension with the host so it knows we have successfully loaded
        // and clears the "taking longer than expected to load" warning.
        sdk.register(sdk.getContributionId(), () => {
          return {
            // Optional: you can implement onLoaded, onSaved, etc.
            onLoaded: (_args: unknown) => {
              // work item loaded
            },
          };
        });

        const { WorkItemTrackingServiceIds } = await import(
          "azure-devops-extension-api/WorkItemTracking"
        );
        const formService = await sdk.getService<
          import("azure-devops-extension-api/WorkItemTracking").IWorkItemFormService
        >(WorkItemTrackingServiceIds.WorkItemFormService);

        const id = await formService.getId();
        const title = (await formService.getFieldValue("System.Title", {
          returnOriginalValue: false,
        })) as string;

        setWorkItemId(id);
        setWorkItemTitle(title ?? "");
        setSdkReady(true);

        sdk.resize();
      } catch (err) {
        console.error("[OptSolv Extension] SDK init error:", err);
        // Fallback — render the UI without context (e.g., local dev iframe)
        setSdkReady(true);
      }
    }

    void init();
  }, [sdk]);

  if (!sdkReady) {
    return <LoadingSpinner />;
  }

  if (!configured) {
    return <SetupScreen onConfigured={() => setConfigured(true)} />;
  }

  return (
    <Dashboard
      workItemId={workItemId}
      workItemTitle={workItemTitle}
      onLogout={() => setConfigured(false)}
    />
  );
}

function LoadingSpinner() {
  return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );
}

const styles = {
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: 120,
  } as React.CSSProperties,
  spinner: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid rgba(99,102,241,0.2)",
    borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  } as React.CSSProperties,
};
