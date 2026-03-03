"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, Link2, RefreshCw, Settings } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AzureDevOpsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Azure DevOps
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a integração com o Azure DevOps para sincronizar work items.
        </p>
      </motion.div>

      {/* Connection Status */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Link2 className="h-4 w-4" />
                Status da Conexão
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-yellow-500/10 text-yellow-400 text-xs"
              >
                Não configurado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-url">URL da Organização</Label>
              <Input
                id="org-url"
                placeholder="https://dev.azure.com/sua-organizacao"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pat">Personal Access Token (PAT)</Label>
              <Input
                id="pat"
                type="password"
                placeholder="••••••••••••••••••••"
              />
              <p className="text-xs text-muted-foreground">
                O PAT precisa de permissão de leitura em Work Items e Projetos.
              </p>
            </div>
            <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
              <CheckCircle2 className="h-4 w-4" />
              Conectar
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sync Settings */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <RefreshCw className="h-4 w-4" />
              Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure a sincronização bidirecional de horas entre o Time
              Tracker e o Azure DevOps.
            </p>
            <div className="rounded-lg border border-border/30 bg-muted/30 p-4 text-center">
              <Settings className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Conecte sua conta para configurar a sincronização.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
