"use client";

import { motion } from "framer-motion";
import { AtSign, Building2, Clock, Save, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import type { User as UserType } from "@/types/user";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  member: "Membro",
};

export default function ProfilePage() {
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
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Meu Perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informações da sua conta e dados pessoais.
        </p>
      </motion.div>

      {/* Avatar + Identity */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <UserAvatar
                name={user.name}
                image={user.image}
                size="lg"
                className="h-20 w-20 border-2 text-2xl"
              />
              <div className="flex-1 text-center sm:text-left">
                <p className="font-display text-xl font-bold text-foreground">
                  {user.name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {user.email}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-brand-500/10 text-brand-400"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {roleLabel[user.role] ?? user.role}
                  </Badge>
                  {user.department && (
                    <Badge variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {user.department}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome completo</Label>
                <Input
                  id="profile-name"
                  defaultValue={user.name}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    defaultValue={user.email}
                    className="pl-9"
                    disabled
                    aria-describedby="email-hint"
                    placeholder="Seu email"
                  />
                </div>
                <p id="email-hint" className="text-xs text-muted-foreground">
                  Gerenciado pela sua conta Microsoft.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-department">Departamento</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-department"
                    defaultValue={user.department ?? ""}
                    placeholder="Ex: Analista Desenvolvedor"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-capacity">Capacidade semanal (h)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-capacity"
                    type="number"
                    min={1}
                    max={168}
                    defaultValue={user.weeklyCapacity ?? 40}
                    className="pl-9"
                    placeholder="40"
                  />
                </div>
              </div>
            </div>
            <Separator />
            <Button className="gap-2 bg-brand-500 text-white hover:bg-brand-600">
              <Save className="h-4 w-4" />
              Salvar alterações
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={itemVariants}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Função</dt>
                <dd className="font-medium text-foreground">
                  {roleLabel[user.role] ?? user.role}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Provedor de login</dt>
                <dd className="font-medium text-foreground">Microsoft</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge className="bg-green-500/10 text-green-400">
                    Ativo
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
