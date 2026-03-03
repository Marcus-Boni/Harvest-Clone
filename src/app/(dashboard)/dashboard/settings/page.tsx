"use client";

import { motion } from "framer-motion";
import { Moon, Save, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import type { User as UserType } from "@/types/user";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function SettingsPage() {
  const { theme, toggleTheme } = useUIStore();
  const { data: session } = useSession();
  const user = session?.user as unknown as UserType;

  if (!user) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas preferências e perfil.
        </p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <User className="h-4 w-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarFallback className="bg-brand-500/10 text-lg font-bold text-brand-500">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" defaultValue={user.department} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade Semanal (h)</Label>
                <Input
                  id="capacity"
                  type="number"
                  defaultValue={user.weeklyCapacity}
                />
              </div>
            </div>
            <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Modo Escuro
                </p>
                <p className="text-xs text-muted-foreground">
                  Alternar entre tema claro e escuro
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={() => toggleTheme()}
                aria-label="Alternar tema"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
