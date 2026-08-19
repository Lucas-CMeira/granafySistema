// Página inicial: o resumo do mês corrente, o saldo acumulado, as metas em
// andamento e os últimos lançamentos. (Dashboard)

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdSavings,
  MdFlag,
  MdReceiptLong,
  MdAdd,
  MdArrowForward,
  MdLightbulbOutline,
  MdClose,
} from "react-icons/md";
import API_URL from "../../services/api";
import {
  formatMoney,
  formatDate,
  formatMonthLabel,
  monthKey,
  categoryColor,
  categoryInitials,
  daysUntil,
  monthsUntil,
} from "../../utils/format";
import StatCard from "../../components/StatCard";
import Highlight from "../../components/Highlight";
import EmptyState from "../../components/EmptyState";
import { SkeletonRows, SkeletonLine } from "../../components/Skeleton";
import { useToast } from "../../components/toast-context";
import { errorMessage } from "../../utils/errors";

type Entry = {
  id: string;
  title: string;
  description?: string | null;
  value: number;
  type: "income" | "expenses";
  date: string;
  categoryId?: string | null;
  category?: { name?: string; color?: string | null } | null;
  goalId?: string | null;
  isFixed?: boolean;
  parentId?: string | null;
};

type Goal = {
  id: string;
  title: string;
  value: number;
  limitDate: string;
  entries?: { type: string; value: number }[];
};

const savedInGoal = (goal: Goal) =>
  (goal.entries || [])
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + Math.abs(Number(entry.value)), 0);

const DISMISS_KEY = "granafy:dismissedGoalSuggestion";

const HomePage = () => {
  const toast = useToast();

  const [userName, setUserName] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositingGoalId, setDepositingGoalId] = useState<string | null>(null);
  const [dismissedGoalId, setDismissedGoalId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const fetchData = async () => {
    try {
      const [userRes, entriesRes, goalsRes] = await Promise.all([
        fetch(`${API_URL}/me`, { credentials: "include" }),
        fetch(`${API_URL}/entries`, { credentials: "include" }),
        fetch(`${API_URL}/goals`, { credentials: "include" }),
      ]);

      if (userRes.ok) setUserName((await userRes.json()).name);
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const currentMonth = useMemo(() => monthKey(new Date().toISOString()), []);
  const finances = useMemo(() => {
    const monthEntries = entries.filter(
      (entry) => monthKey(entry.date) === currentMonth,
    );

    const sum = (list: Entry[], type: Entry["type"]) =>
      list
        .filter((entry) => entry.type === type)
        .reduce((total, entry) => total + entry.value, 0);

    const monthGoalsIncome = monthEntries
      .filter((entry) => entry.type === "income" && entry.goalId)
      .reduce((total, entry) => total + entry.value, 0);
    const monthIncome = sum(monthEntries, "income") - monthGoalsIncome;
    const monthExpenses = sum(monthEntries, "expenses");
    const totalBalance = sum(entries, "income") - sum(entries, "expenses");
    const goalsBalance = entries
      .filter((entry) => entry.type === "income" && entry.goalId)
      .reduce((total, entry) => total + entry.value, 0);
    const availableBalance = totalBalance - goalsBalance;

    return {
      monthIncome,
      monthExpenses,
      monthBalance: monthIncome - monthExpenses,
      totalBalance,
      goalsBalance,
      availableBalance,
    };
  }, [entries, currentMonth]);

  const recentEntries = useMemo(() => entries.slice(0, 5), [entries]);

  const activeGoals = useMemo(
    () =>
      goals
        .filter((goal) => savedInGoal(goal) < goal.value)
        .sort((a, b) => daysUntil(a.limitDate) - daysUntil(b.limitDate))
        .slice(0, 3),
    [goals],
  );

  const suggestion = useMemo(() => {
    if (activeGoals.length === 0) return null;
    const goal = activeGoals[0];
    const remaining = Math.max(0, goal.value - savedInGoal(goal));
    const monthlyPace = remaining / monthsUntil(goal.limitDate);
    if (finances.availableBalance < monthlyPace - 0.005) return null;
    return { goal, amount: Math.min(monthlyPace, finances.availableBalance) };
  }, [activeGoals, finances.availableBalance]);

  const monthLabel = formatMonthLabel(new Date().toISOString());

  const dismissSuggestion = (goalId: string) => {
    setDismissedGoalId(goalId);
    try {
      localStorage.setItem(DISMISS_KEY, goalId);
    } catch {}
  };

  const handleDeposit = async (goal: Goal, targetAmount: number) => {
    const target = Math.min(targetAmount, finances.availableBalance);
    if (target <= 0) return;

    setDepositingGoalId(goal.id);
    try {
      const candidates = [...entries]
        .filter((entry) => entry.type === "income" && !entry.goalId)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      const relink = async (
        id: string,
        extra: Record<string, unknown> = {},
      ) => {
        const response = await fetch(`${API_URL}/entries/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ goalId: goal.id, ...extra }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Não foi possível guardar na meta.");
        }
      };

      let remaining = target;
      let moved = 0;

      for (const entry of candidates) {
        if (remaining <= 0.005) break;

        if (entry.value <= remaining + 0.005) {
          await relink(entry.id);
          remaining -= entry.value;
          moved += entry.value;
          continue;
        }

        if (!entry.isFixed && !entry.parentId) {
          const keep = entry.value - remaining;
          await relink(entry.id, { value: remaining });

          const createRes = await fetch(`${API_URL}/entries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: entry.title,
              description: entry.description || undefined,
              value: keep,
              type: "income",
              date: entry.date,
              categoryId: entry.categoryId,
            }),
          });
          if (!createRes.ok) {
            const data = await createRes.json().catch(() => null);
            throw new Error(
              data?.message || "Não foi possível guardar na meta.",
            );
          }

          moved += remaining;
          remaining = 0;
          break;
        }
      }

      if (moved <= 0) {
        toast.error("Não foi possível guardar na meta agora.");
        return;
      }

      toast.success(
        remaining > 0.005
          ? `R$ ${formatMoney(moved)} guardados em "${goal.title}" — o restante não coube em um único lançamento.`
          : `R$ ${formatMoney(moved)} guardados em "${goal.title}".`,
      );
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível guardar na meta."));
      await fetchData();
    } finally {
      setDepositingGoalId(null);
    }
  };

  return (
    <div>
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span aria-hidden className="h-px w-6 bg-emerald-400" />
            {monthLabel}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink-900 sm:text-[2.1rem]">
            {greeting},{" "}
            {loading ? (
              <SkeletonLine className="inline-block h-7 w-40 align-middle" />
            ) : (
              <Highlight tone="money">{userName || "por aqui"}</Highlight>
            )}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Veja como o mês está indo até agora.
          </p>
        </div>

        <Link to="/entries" className="btn-primary shrink-0">
          <MdAdd className="text-lg" />
          Novo lançamento
        </Link>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Receitas · ${monthLabel.split(" de ")[0]}`}
          value={`R$ ${formatMoney(finances.monthIncome)}`}
          tone="in"
          icon={<MdTrendingUp />}
          hint="Somente o mês corrente"
        />
        <StatCard
          label={`Despesas · ${monthLabel.split(" de ")[0]}`}
          value={`R$ ${formatMoney(finances.monthExpenses)}`}
          tone="out"
          icon={<MdTrendingDown />}
          hint={
            finances.monthBalance >= 0
              ? `Sobrou R$ ${formatMoney(finances.monthBalance)} no mês`
              : `Passou R$ ${formatMoney(Math.abs(finances.monthBalance))} do que entrou`
          }
        />
        <StatCard
          label="Saldo disponível"
          value={`R$ ${formatMoney(finances.availableBalance)}`}
          featured
          icon={<MdAccountBalanceWallet />}
        />
        <StatCard
          label="Guardado em metas"
          value={`R$ ${formatMoney(finances.goalsBalance)}`}
          tone="plan"
          icon={<MdSavings />}
          hint={
            goals.length > 0
              ? `Em ${goals.length} meta${goals.length === 1 ? "" : "s"}`
              : "Nenhuma meta ainda"
          }
        />
      </section>

      {!loading && suggestion && dismissedGoalId !== suggestion.goal.id && (
        <section className="relative mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ocean-100 bg-ocean-50/70 p-5 pr-11 sm:flex-row sm:items-center sm:pr-12">
          <button
            type="button"
            onClick={() => dismissSuggestion(suggestion.goal.id)}
            title="Dispensar sugestão"
            aria-label="Dispensar sugestão"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-ocean-400 transition hover:bg-ocean-100 hover:text-ocean-700"
          >
            <MdClose />
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-100 text-lg text-ocean-700">
              <MdLightbulbOutline />
            </span>
            <div>
              <p className="font-display text-sm font-bold text-ocean-900">
                Você tem R$ {formatMoney(finances.availableBalance)} disponíveis
              </p>
              <p className="mt-0.5 text-sm text-ocean-900/80">
                Que tal guardar R$ {formatMoney(suggestion.amount)} este mês na
                meta “{suggestion.goal.title}”?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDeposit(suggestion.goal, suggestion.amount)}
            disabled={depositingGoalId === suggestion.goal.id}
            className="btn-primary shrink-0"
          >
            {depositingGoalId === suggestion.goal.id
              ? "Guardando…"
              : `Guardar R$ ${formatMoney(suggestion.amount)}`}
          </button>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MdReceiptLong className="text-lg text-emerald-600" />
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Últimos lançamentos
              </h2>
            </div>
            <Link
              to="/entries"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Ver todos <MdArrowForward />
            </Link>
          </div>

          {loading ? (
            <SkeletonRows rows={4} />
          ) : recentEntries.length === 0 ? (
            <EmptyState
              icon={<MdReceiptLong />}
              title="Nada lançado ainda"
              description="Registre sua primeira receita ou despesa para o saldo começar a fazer sentido."
              action={
                <Link to="/entries" className="btn-primary">
                  <MdAdd /> Fazer o primeiro lançamento
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {recentEntries.map((entry) => {
                const color = categoryColor(entry.category);
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-ink-50"
                  >
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                      style={{ backgroundColor: `${color}1F`, color }}
                    >
                      {categoryInitials(entry.category?.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {entry.title}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {formatDate(entry.date)} ·{" "}
                        {entry.category?.name || "Sem categoria"}
                      </p>
                    </div>
                    <p
                      className={`tnum shrink-0 font-display text-sm font-bold ${
                        entry.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {entry.type === "income" ? "+" : "−"} R${" "}
                      {formatMoney(entry.value)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MdFlag className="text-lg text-ocean-600" />
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Metas em andamento
              </h2>
            </div>
            <Link
              to="/goals"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 transition hover:text-ocean-800"
            >
              Gerenciar <MdArrowForward />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="rounded-xl border border-ink-100 p-4"
                >
                  <SkeletonLine className="h-3.5 w-1/3" />
                  <SkeletonLine className="mt-3 h-2.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <EmptyState
              tone="plan"
              icon={<MdFlag />}
              title={
                goals.length === 0 ? "Nenhuma meta ainda" : "Tudo conquistado!"
              }
              description={
                goals.length === 0
                  ? "Uma viagem, um curso, a reserva de emergência — escolha um objetivo e acompanhe o progresso."
                  : "Você concluiu todas as metas que criou. Que tal definir a próxima?"
              }
              action={
                <Link to="/goals" className="btn-primary">
                  <MdAdd /> Criar uma meta
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {activeGoals.map((goal) => {
                const saved = savedInGoal(goal);
                const percent =
                  goal.value > 0
                    ? Math.min(100, (saved / goal.value) * 100)
                    : 0;
                const days = daysUntil(goal.limitDate);

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-ink-100 p-4 transition hover:border-ocean-200"
                  >
                    <div className="mb-2.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {goal.title}
                      </p>
                      <p className="tnum shrink-0 text-xs font-bold text-ocean-700">
                        {percent.toFixed(0)}%
                      </p>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-ocean-500 to-emerald-500 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-valuenow={Math.round(percent)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progresso de ${goal.title}`}
                      />
                    </div>

                    <div className="tnum mt-2 flex items-center justify-between text-xs text-ink-500">
                      <span>
                        R$ {formatMoney(saved)} de R$ {formatMoney(goal.value)}
                      </span>
                      <span
                        className={
                          days < 0 ? "font-semibold text-rose-600" : ""
                        }
                      >
                        {days < 0
                          ? "prazo vencido"
                          : `${days} dia${days === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
