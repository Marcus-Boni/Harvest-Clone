"use client";

import { motion } from "framer-motion";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartColors } from "@/hooks/use-chart-colors";
import { getMockWeeklyHours } from "@/lib/mock-data";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const projectDistribution = [
  { name: "OptSolv Time Tracker", value: 35, color: "#f97316" },
  { name: "Plano de Corte", value: 30, color: "#3b82f6" },
  { name: "Portal do Cliente", value: 20, color: "#22c55e" },
  { name: "Dashboard Analytics", value: 15, color: "#8b5cf6" },
];

export default function ReportsPage() {
  const weeklyData = getMockWeeklyHours();
  const chartColors = useChartColors();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analise sua produtividade e distribuição de horas.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Este mês", value: "142h", icon: BarChart3, change: "+12%" },
          {
            label: "Média diária",
            value: "7.1h",
            icon: TrendingUp,
            change: "+0.3h",
          },
          { label: "Projetos", value: "4", icon: PieChart, change: "ativos" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                  <stat.icon className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-mono text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-green-500">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display text-base font-semibold">
                Horas por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barSize={40}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={chartColors.gridStroke}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: chartColors.tickFill }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: chartColors.tickFill }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: "8px",
                        color: chartColors.tooltipColor,
                      }}
                      itemStyle={{ color: chartColors.tooltipColor }}
                      labelStyle={{ color: chartColors.tooltipLabelColor }}
                      cursor={{ fill: chartColors.cursorFill }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#f97316"
                      radius={[6, 6, 0, 0]}
                      name="Horas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Distribution Pie */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-display text-base font-semibold">
                Distribuição por Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={projectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent, x, y, cx }) => {
                        const val = typeof percent === "number" ? percent : 0;
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={chartColors.pieLabelFill}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight="500"
                          >
                            {`${name} ${(val * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {projectDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: "8px",
                        color: chartColors.tooltipColor,
                      }}
                      itemStyle={{ color: chartColors.tooltipColor }}
                      labelStyle={{ color: chartColors.tooltipLabelColor }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {projectDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1 text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
