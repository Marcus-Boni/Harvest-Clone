import type { IWorkItemFormService } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingServices";
import type * as SDK from "azure-devops-extension-sdk";
import { useCallback, useEffect, useState } from "react";
import type { IFormServiceSubset } from "../shared/api";
import { isConfigured } from "../shared/auth";
import { Dashboard } from "./components/Dashboard";
import { SetupScreen } from "./components/SetupScreen";

interface WorkItemFormAppProps {
  sdk: typeof SDK;
}

const WORK_ITEM_FORM_SERVICE_ID = "ms.vss-work-web.work-item-form";
const WORK_ITEM_FORM_GROUP_CONTRIBUTION_ID = "work-item-form-group";

export function WorkItemFormApp({ sdk }: WorkItemFormAppProps) {
  const [configured, setConfigured] = useState(isConfigured());
  const [workItemId, setWorkItemId] = useState<number | null>(null);
  const [workItemTitle, setWorkItemTitle] = useState<string>("");
  const [devOpsProjectName, setDevOpsProjectName] = useState<string>("");
  const [devOpsBaseUrl, setDevOpsBaseUrl] = useState<string>("");
  const [formService, setFormService] = useState<IFormServiceSubset | null>(
    null,
  );
  const [sdkReady, setSdkReady] = useState(false);

  const syncWorkItemContext = useCallback(
    async (service: IFormServiceSubset) => {
      const workItemFields = service.getFieldValues
        ? await service.getFieldValues(["System.Title", "System.TeamProject"], {
            returnOriginalValue: false,
          })
        : {
            "System.Title": await service.getFieldValue("System.Title", {
              returnOriginalValue: false,
            }),
            "System.TeamProject": await service.getFieldValue(
              "System.TeamProject",
              {
                returnOriginalValue: false,
              },
            ),
          };

      const id = await service.getId().catch(() => null);
      const hostCtx = sdk.getHost();
      const pageCtx = sdk.getPageContext() as
        | {
            project?: { name?: string };
            webContext?: { project?: { name?: string } };
          }
        | undefined;
      const projectName =
        (workItemFields["System.TeamProject"] as string | undefined) ??
        pageCtx?.project?.name ??
        pageCtx?.webContext?.project?.name ??
        "";
      const orgName = hostCtx?.name ?? "";

      setWorkItemId(typeof id === "number" && Number.isFinite(id) ? id : null);
      setWorkItemTitle((workItemFields["System.Title"] as string) ?? "");
      setDevOpsProjectName(projectName);

      if (orgName && projectName) {
        setDevOpsBaseUrl(
          `https://dev.azure.com/${orgName}/${encodeURIComponent(projectName)}`,
        );
      } else if (orgName) {
        setDevOpsBaseUrl(`https://dev.azure.com/${orgName}`);
      } else {
        setDevOpsBaseUrl("");
      }
    },
    [sdk],
  );

  useEffect(() => {
    async function init() {
      try {
        await sdk.ready();
        const svc = await sdk.getService<IWorkItemFormService>(
          WORK_ITEM_FORM_SERVICE_ID,
        );
        const normalizedService = svc as unknown as IFormServiceSubset;

        const contributionId =
          sdk.getContributionId() || WORK_ITEM_FORM_GROUP_CONTRIBUTION_ID;
        const contributionProvider = () => ({
          onLoaded: async () => {
            await syncWorkItemContext(normalizedService);
            sdk.resize();
          },
          onRefreshed: async () => {
            await syncWorkItemContext(normalizedService);
            sdk.resize();
          },
          onReset: async () => {
            await syncWorkItemContext(normalizedService);
            sdk.resize();
          },
          onSaved: async () => {
            await syncWorkItemContext(normalizedService);
            sdk.resize();
          },
          onFieldChanged: async (args: { changedFields?: string[] }) => {
            if (
              !args.changedFields ||
              args.changedFields.some((field) =>
                ["System.Title", "System.TeamProject"].includes(field),
              )
            ) {
              await syncWorkItemContext(normalizedService);
              sdk.resize();
            }
          },
          onUnloaded: () => {
            setWorkItemId(null);
            setWorkItemTitle("");
            setDevOpsProjectName("");
            setDevOpsBaseUrl("");
          },
        });

        sdk.register(contributionId, contributionProvider);
        if (contributionId !== WORK_ITEM_FORM_GROUP_CONTRIBUTION_ID) {
          sdk.register(
            WORK_ITEM_FORM_GROUP_CONTRIBUTION_ID,
            contributionProvider,
          );
        }

        setFormService(normalizedService);
        await syncWorkItemContext(normalizedService);

        setSdkReady(true);
        sdk.resize();
      } catch (err) {
        console.error("[OptSolv Extension] SDK init error:", err);
        setSdkReady(true);
      }
    }

    void init();
  }, [sdk, syncWorkItemContext]);

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
      devOpsProjectName={devOpsProjectName}
      devOpsBaseUrl={devOpsBaseUrl}
      formService={formService}
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
    border: "2px solid rgba(249,115,22,0.2)",
    borderTopColor: "var(--brand)",
    animation: "spin 0.8s linear infinite",
  } as React.CSSProperties,
};
