"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Folder,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { cn, getStatusColor } from "@/lib/utils";
import type { User } from "@/types/user";

// ─── Types ─────────────────────────────────────────────────────────────

interface ProjectMemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface ProjectFromAPI {
  id: string;
  name: string;
  description: string | null;
  clientName: string | null;
  color: string;
  status: string;
  billable: boolean;
  budget: number | null;
  source: string;
  azureProjectId: string | null;
  azureProjectUrl: string | null;
  createdAt: string;
  updatedAt: string;
  members: Array<{ id: string; userId: string; user: ProjectMemberUser }>;
}

interface AzureProject {
  id: string;
  name: string;
  description: string;
  url: string;
  state: string;
  lastUpdateTime: string;
  alreadyImported: boolean;
}

// ─── Animation ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Component ─────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Azure import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [azureProjects, setAzureProjects] = useState<AzureProject[]>([]);
  const [azureLoading, setAzureLoading] = useState(false);
  const [selectedAzureIds, setSelectedAzureIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [azureSearch, setAzureSearch] = useState("");

  const user = session?.user as unknown as User | undefined;
  const isPrivileged = user?.role === "manager" || user?.role === "admin";

  // ─── Fetch projects ────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar projetos");
      const data = await res.json();
      setProjects(data.projects);
    } catch {
      toast.error("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ─── Azure import ──────────────────────────────────────────────────

  const openImportDialog = async () => {
    setImportDialogOpen(true);
    setAzureLoading(true);
    setSelectedAzureIds(new Set());
    setAzureSearch("");

    try {
      const res = await fetch("/api/integrations/azure-devops/projects");
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao buscar projetos do Azure DevOps.");
        setImportDialogOpen(false);
        return;
      }
      const data = await res.json();
      setAzureProjects(data.projects);
    } catch {
      toast.error("Erro ao conectar com Azure DevOps.");
      setImportDialogOpen(false);
    } finally {
      setAzureLoading(false);
    }
  };

  const toggleAzureProject = (id: string) => {
    setSelectedAzureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    const selected = azureProjects.filter((p) => selectedAzureIds.has(p.id));
    if (selected.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/integrations/azure-devops/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: selected.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            url: p.url,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setImportDialogOpen(false);
      router.refresh();
      await fetchProjects();
    } catch {
      toast.error("Erro ao importar projetos.");
    } finally {
      setImporting(false);
    }
  };

  // ─── Filtering ─────────────────────────────────────────────────────

  const filteredAzureProjects = azureProjects.filter((p) =>
    p.name.toLowerCase().includes(azureSearch.toLowerCase()),
  );

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPrivileged
              ? "Gerencie os projetos da sua organização."
              : "Visualize os projetos atribuídos a você."}
          </p>
        </div>

        {/* All users can import from Azure. Novo Projeto is privileged-only. */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={openImportDialog}
          >
            <Cloud className="h-4 w-4" />
            Importar do Azure
          </Button>
          {isPrivileged && (
            <Link href="/dashboard/projects/new">
              <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
                <Plus className="h-4 w-4" />
                Novo Projeto
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum projeto encontrado.
              </p>
              {isPrivileged && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Crie um novo projeto ou importe do Azure DevOps.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
          {projects.map((proj) => {
            const usedPercent = proj.budget
              ? Math.min(Math.round((0 / proj.budget) * 100), 100)
              : 0;

            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Link href={`/dashboard/projects/${proj.id}`}>
                  <Card className="group h-full cursor-pointer border-border/50 bg-card/80 backdrop-blur transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color }}
                          />
                          <CardTitle className="font-display text-base font-semibold line-clamp-1">
                            {proj.name}
                          </CardTitle>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] shrink-0",
                            getStatusColor(proj.status),
                          )}
                        >
                          {proj.status}
                        </Badge>
                      </div>
                      <div className="ml-7 flex items-center gap-2">
                        {proj.source === "azure-devops" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0"
                          >
                            Azure DevOps
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {proj.clientName && (
                        <p className="text-xs text-muted-foreground">
                          Cliente: {proj.clientName}
                        </p>
                      )}
                      {proj.budget && (
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Budget
                            </span>
                            <span className="font-mono text-foreground">
                              {proj.budget}h
                            </span>
                          </div>
                          <Progress
                            value={usedPercent}
                            className="mt-1.5 h-1.5"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Folder className="h-3 w-3" />
                        {proj.members.length} membro
                        {proj.members.length !== 1 && "s"}
                        {proj.billable && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] bg-green-500/10 text-green-400"
                          >
                            Billable
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Azure DevOps Import Dialog ─────────────────────────────── */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-400" />
              Importar Projetos do Azure DevOps
            </DialogTitle>
            <DialogDescription>
              Selecione os projetos da sua organização para importar.
            </DialogDescription>
          </DialogHeader>

          {azureLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar projeto..."
                  className="pl-9"
                  value={azureSearch}
                  onChange={(e) => setAzureSearch(e.target.value)}
                />
              </div>

              {/* Project list */}
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {filteredAzureProjects.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum projeto encontrado.
                  </p>
                ) : (
                  filteredAzureProjects.map((ap) => (
                    <button
                      key={ap.id}
                      type="button"
                      disabled={ap.alreadyImported}
                      onClick={() => toggleAzureProject(ap.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-all",
                        ap.alreadyImported
                          ? "cursor-not-allowed border-border/30 opacity-50"
                          : selectedAzureIds.has(ap.id)
                            ? "border-brand-500 bg-brand-500/5"
                            : "border-border/50 hover:border-brand-500/30",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{ap.name}</span>
                        {ap.alreadyImported ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-muted text-muted-foreground"
                          >
                            Importado
                          </Badge>
                        ) : selectedAzureIds.has(ap.id) ? (
                          <div className="h-4 w-4 rounded-full bg-brand-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-border" />
                        )}
                      </div>
                      {ap.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {ap.description}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {selectedAzureIds.size} selecionado
                  {selectedAzureIds.size !== 1 && "s"}
                </p>
                <Button
                  onClick={handleImport}
                  disabled={selectedAzureIds.size === 0 || importing}
                  className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Importar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
