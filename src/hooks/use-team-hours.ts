"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TeamHourProject {
  id: string;
  name: string;
  color: string;
  clientName: string | null;
}

export interface TeamHourUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface TeamHourEntry {
  id: string;
  description: string;
  date: string;
  duration: number;
  billable: boolean;
  azdoSyncStatus: string;
  createdAt: string;
  user: TeamHourUser;
  project: TeamHourProject;
}

interface UseTeamHoursOptions {
  from?: string;
  to?: string;
  userId?: string;
  projectId?: string;
}

export function useTeamHours(options: UseTeamHoursOptions = {}) {
  const [entries, setEntries] = useState<TeamHourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTeamHours = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (options.from) params.set("from", options.from);
      if (options.to) params.set("to", options.to);
      if (options.userId && options.userId !== "all") {
        params.set("userId", options.userId);
      }
      if (options.projectId && options.projectId !== "all") {
        params.set("projectId", options.projectId);
      }

      const response = await fetch(`/api/team-hours?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Acesso negado para visualizar estas informacoes");
        }
        throw new Error("Falha ao carregar horas da equipe");
      }

      const data = await response.json();
      setEntries(data.entries ?? []);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao buscar dados",
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [options.from, options.projectId, options.to, options.userId]);

  useEffect(() => {
    fetchTeamHours();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchTeamHours]);

  return {
    entries,
    loading,
    error,
    refetch: fetchTeamHours,
  };
}
