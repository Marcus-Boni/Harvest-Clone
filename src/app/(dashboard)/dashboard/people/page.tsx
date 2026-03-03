"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USERS } from "@/lib/mock-data";
import { cn, getInitials } from "@/lib/utils";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-400",
  manager: "bg-blue-500/10 text-blue-400",
  member: "bg-muted text-muted-foreground",
};

export default function PeoplePage() {
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
            Equipe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os colaboradores da sua organização.
          </p>
        </div>
        <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
          <UserPlus className="h-4 w-4" />
          Convidar
        </Button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_USERS.map((user) => (
          <motion.div key={user.id} variants={itemVariants}>
            <Card className="border-border/50 bg-card/80 backdrop-blur transition-colors hover:border-border/80">
              <CardContent className="flex items-center gap-4 pt-5">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-brand-500/10 font-semibold text-brand-500">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge className={cn("text-[10px]", roleColors[user.role])}>
                      {user.role}
                    </Badge>
                    {user.department && (
                      <span className="text-[10px] text-muted-foreground">
                        {user.department}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
