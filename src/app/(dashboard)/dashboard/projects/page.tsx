"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { cn, getStatusColor } from "@/lib/utils";
import { motion } from "framer-motion";
import { Archive, Folder, Plus } from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function ProjectsPage() {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === "active");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os projetos da sua organização.
          </p>
        </div>
        <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeProjects.map((project) => {
          const usedPercent = project.budget
            ? Math.min(Math.round((120 / project.budget) * 100), 100)
            : 0;

          return (
            <motion.div key={project.id} variants={itemVariants}>
              <Link href={`/dashboard/projects/${project.id}`}>
                <Card className="group h-full cursor-pointer border-border/50 bg-card/80 backdrop-blur transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <CardTitle className="font-display text-base font-semibold">
                          {project.name}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          getStatusColor(project.status),
                        )}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="ml-7 text-xs text-muted-foreground">
                      {project.code}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.clientName && (
                      <p className="text-xs text-muted-foreground">
                        Cliente: {project.clientName}
                      </p>
                    )}
                    {project.budget && (
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-mono text-foreground">
                            120h / {project.budget}h
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
                      {project.memberIds.length} membros
                      {project.billable && (
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
      </div>
    </motion.div>
  );
}
