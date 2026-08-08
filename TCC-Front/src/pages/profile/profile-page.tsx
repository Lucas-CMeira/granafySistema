// Tela de perfil: identidade da conta, indicadores de saúde financeira,
// gráficos analíticos, conquistas de metas e o histórico completo filtrável.

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  MdSearch,
  MdEmojiEvents,
  MdPieChartOutline,
  MdBarChart,
  MdReceiptLong,
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdSavings,
} from "react-icons/md";
import API_URL from "../../services/api";
import { getGoalCompletionDetails } from "../../utils/goals";
import type { Goal } from "../../utils/goals";
import {
  formatMoney,
  formatMoneyCompact,
  formatDate,
  formatMonthLabel,
  monthKey,
  categoryColor,
} from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Highlight from "../../components/Highlight";
import EmptyState from "../../components/EmptyState";
import { SkeletonRows } from "../../components/Skeleton";

type Category = { id: string; name: string; color?: string | null };

type Entry = {
  id: string;
  title: string;
  value: number;
  type: "income" | "expenses";
  date: string;
  categoryId?: string | null;
  category?: Category | null;
  goal?: { title: string } | null;
  isFixed?: boolean;
};

type User = { name?: string; email?: string };

const PAGE_SIZE = 12;

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expenses">(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, entriesRes, goalsRes, categoriesRes] =
          await Promise.all([
            fetch(`${API_URL}/me`, { credentials: "include" }),
            fetch(`${API_URL}/entries`, { credentials: "include" }),
            fetch(`${API_URL}/goals`, { credentials: "include" }),
            fetch(`${API_URL}/categories`, { credentials: "include" }),
          ]);

        if (userRes.ok) setUser(await userRes.json());
        if (entriesRes.ok) setEntries(await entriesRes.json());
        if (goalsRes.ok) setGoals(await goalsRes.json());
        if (categoriesRes.ok) setCategories(await categoriesRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totals = useMemo(() => {
    const income = entries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.value, 0);
    const expenses = entries
      .filter((e) => e.type === "expenses")
      .reduce((sum, e) => sum + e.value, 0);
    const balance = income - expenses;

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return { income, expenses, balance, savingsRate };
  }, [entries]);

  // ── Despesas por categoria ───────────────────────────────────────────────
  const categoryChartData = useMemo(() => {
    const byCategory = new Map<string, { value: number; color: string }>();

    entries
      .filter((entry) => entry.type === "expenses")
      .forEach((entry) => {
        const name = entry.category?.name || "Sem categoria";
        const current = byCategory.get(name);
        byCategory.set(name, {
          value: (current?.value || 0) + entry.value,
          color: current?.color || categoryColor(entry.category),
        });
      });

    return [...byCategory.entries()]
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  const topCategory = categoryChartData[0];

  const monthlyChartData = useMemo(() => {
    const byMonth = new Map<string, { Receitas: number; Despesas: number }>();

    entries.forEach((entry) => {
      const key = monthKey(entry.date);
      if (!byMonth.has(key)) byMonth.set(key, { Receitas: 0, Despesas: 0 });
      const bucket = byMonth.get(key)!;
      if (entry.type === "income") bucket.Receitas += entry.value;
      else bucket.Despesas += entry.value;
    });

    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, values]) => ({
        name: formatMonthLabel(`${key}-15`).split(" de ")[0].slice(0, 3),
        ...values,
      }));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        (entry.category?.name || "").toLowerCase().includes(term);
      const matchesType = filterType === "all" || entry.type === filterType;
      const matchesCategory =
        filterCategory === "all" || entry.categoryId === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [entries, searchTerm, filterType, filterCategory]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterType, filterCategory]);

  const completedGoals = useMemo(
    () => goals.filter((goal) => getGoalCompletionDetails(goal).isCompleted),
    [goals],
  );

  const initials = (user?.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Sua conta"
        title={
          <>
            O retrato da sua{" "}
            <Highlight tone="money">saúde financeira</Highlight>
          </>
        }
        subtitle="Indicadores, gráficos e o histórico completo dos seus lançamentos."
      />

      <section className="card flex flex-col items-center justify-between gap-6 p-6 md:flex-row">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient font-display text-xl font-bold text-white shadow-card"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold text-ink-900">
              {user?.name || "Carregando…"}
            </h2>
            <p className="truncate text-sm text-ink-500">
              {user?.email || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                Conta ativa
              </span>
              <span className="text-xs text-ink-400">
                {entries.length} lançamento{entries.length === 1 ? "" : "s"} ·{" "}
                {categories.length} categorias
              </span>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-4 border-t border-ink-100 pt-5 md:w-auto md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Metas
            </p>
            <p className="tnum mt-1 font-display text-2xl font-bold text-ocean-600">
              {goals.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Conquistas
            </p>
            <p className="tnum mt-1 font-display text-2xl font-bold text-emerald-600">
              {completedGoals.length}
            </p>
          </div>
          <div
            className="text-center"
            title="Percentual da sua receita total que sobrou depois de descontar todas as despesas: (receitas − despesas) ÷ receitas"
          >
            <p className="cursor-help text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Poupança
            </p>
            <p
              className={`tnum mt-1 font-display text-2xl font-bold ${
                totals.savingsRate >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {totals.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receitas totais"
          value={`R$ ${formatMoney(totals.income)}`}
          tone="in"
          icon={<MdTrendingUp />}
        />
        <StatCard
          label="Despesas totais"
          value={`R$ ${formatMoney(totals.expenses)}`}
          tone="out"
          icon={<MdTrendingDown />}
          hint={topCategory ? `Maior gasto: ${topCategory.name}` : undefined}
        />
        <StatCard
          label="Saldo acumulado"
          value={`R$ ${formatMoney(totals.balance)}`}
          tone={totals.balance >= 0 ? "balance" : "out"}
          icon={<MdAccountBalanceWallet />}
        />
        <StatCard
          label="Taxa de poupança"
          value={`${totals.savingsRate.toFixed(1)}%`}
          tone={totals.savingsRate >= 0 ? "in" : "out"}
          icon={<MdSavings />}
          hint={
            totals.savingsRate >= 0
              ? "Do que entrou, é o que sobrou"
              : "Você gastou mais do que recebeu"
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <MdPieChartOutline className="text-lg text-emerald-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Para onde vai o dinheiro
              </h2>
              <p className="text-xs text-ink-400">
                Distribuição das despesas por categoria
              </p>
            </div>
          </div>

          {categoryChartData.length === 0 ? (
            <EmptyState
              icon={<MdPieChartOutline />}
              title="Sem despesas registradas"
              description="Assim que você lançar a primeira despesa, a divisão por categoria aparece aqui."
            />
          ) : (
            <>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={55}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryChartData.map((slice) => (
                        <Cell key={slice.name} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) =>
                        `R$ ${formatMoney(Number(value))}`
                      }
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #E5EFEC",
                        fontSize: 13,
                        boxShadow: "0 8px 24px -12px rgba(15,33,30,.25)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {categoryChartData.slice(0, 6).map((slice) => {
                  const share =
                    totals.expenses > 0
                      ? (slice.value / totals.expenses) * 100
                      : 0;
                  return (
                    <li
                      key={slice.name}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink-700">
                        {slice.name}
                      </span>
                      <span className="tnum shrink-0 text-xs text-ink-400">
                        {share.toFixed(0)}%
                      </span>
                      <span className="tnum shrink-0 text-sm font-semibold text-ink-900">
                        R$ {formatMoney(slice.value)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <MdBarChart className="text-lg text-ocean-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Evolução mês a mês
              </h2>
              <p className="text-xs text-ink-400">
                Receitas e despesas nos últimos 6 meses
              </p>
            </div>
          </div>

          {monthlyChartData.length === 0 ? (
            <EmptyState
              icon={<MdBarChart />}
              title="Sem histórico ainda"
              description="A comparação mês a mês aparece assim que houver lançamentos registrados."
            />
          ) : (
            <div className="h-[19rem] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5EFEC"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6C9990", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={72}
                    tick={{ fill: "#6C9990", fontSize: 11 }}
                    tickFormatter={(value: number) => formatMoneyCompact(value)}
                  />
                  <Tooltip
                    cursor={{ fill: "#F4F8F7" }}
                    formatter={(value: unknown) =>
                      `R$ ${formatMoney(Number(value))}`
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #E5EFEC",
                      fontSize: 13,
                      boxShadow: "0 8px 24px -12px rgba(15,33,30,.25)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="Receitas"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="Despesas"
                    fill="#F43F5E"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {completedGoals.length > 0 && (
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <MdEmojiEvents className="text-lg text-amber-500" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Conquistas
              </h2>
              <p className="text-xs text-ink-400">Metas que você já fechou</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => {
              const detail = getGoalCompletionDetails(goal);

              const badge =
                detail.status === "early"
                  ? {
                      text: `${detail.diffDays} dia${detail.diffDays === 1 ? "" : "s"} antes do prazo`,
                      style: "bg-emerald-100 text-emerald-800",
                    }
                  : detail.status === "on_time"
                    ? {
                        text: "Exatamente no prazo",
                        style: "bg-ocean-100 text-ocean-800",
                      }
                    : {
                        text: `${detail.diffDays} dia${detail.diffDays === 1 ? "" : "s"} após o prazo`,
                        style: "bg-amber-100 text-amber-800",
                      };

              return (
                <article
                  key={goal.id}
                  className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"
                >
                  <div className="flex items-start gap-2.5">
                    <MdEmojiEvents
                      aria-hidden
                      className="mt-0.5 shrink-0 text-lg text-amber-500"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-ink-900">
                        {goal.title}
                      </p>
                      {goal.description && (
                        <p className="truncate text-xs text-ink-500">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="tnum font-display text-lg font-bold text-emerald-700">
                    R$ {formatMoney(goal.value)}
                  </p>

                  <div className="flex flex-col gap-1 text-xs text-ink-500">
                    {detail.completedDate && (
                      <p>
                        Concluída em{" "}
                        <strong className="text-ink-800">
                          {formatDate(detail.completedDate)}
                        </strong>
                      </p>
                    )}
                    <p>
                      Prazo era{" "}
                      <strong className="text-ink-800">
                        {formatDate(goal.limitDate)}
                      </strong>
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.style}`}
                  >
                    {badge.text}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="card p-6">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <MdReceiptLong className="text-lg text-emerald-600" />
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Histórico completo
              </h2>
              <p className="text-xs text-ink-400">
                Todos os lançamentos em uma só lista
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[12rem] flex-1">
              <MdSearch
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                type="search"
                placeholder="Buscar lançamento"
                aria-label="Buscar lançamento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field py-2 pl-10 text-sm"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as typeof filterType)
              }
              aria-label="Filtrar por tipo"
              className="field w-auto py-2 text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expenses">Despesas</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filtrar por categoria"
              className="field w-auto py-2 text-sm"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={6} />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={<MdSearch />}
            title={
              entries.length === 0
                ? "Nenhum lançamento ainda"
                : "Nada com esses filtros"
            }
            description={
              entries.length === 0
                ? "Registre receitas e despesas na tela de Lançamentos para montar seu histórico."
                : "Nenhum lançamento combina com a busca e os filtros selecionados."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-3 font-bold">Data</th>
                    <th className="px-4 py-3 font-bold">Título</th>
                    <th className="px-4 py-3 font-bold">Categoria</th>
                    <th className="px-4 py-3 font-bold">Meta</th>
                    <th className="px-4 py-3 text-right font-bold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {filteredEntries.slice(0, visibleCount).map((entry) => {
                    const color = categoryColor(entry.category);
                    return (
                      <tr
                        key={entry.id}
                        className="transition hover:bg-ink-50/70"
                      >
                        <td className="tnum whitespace-nowrap px-4 py-3 text-xs text-ink-400">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink-900">
                            {entry.title}
                          </span>
                          {entry.isFixed && (
                            <span className="ml-2 rounded-full bg-ocean-50 px-2 py-0.5 text-[10px] font-bold text-ocean-700">
                              Fixo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
                            <span
                              aria-hidden
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {entry.category?.name || "Sem categoria"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {entry.goal ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              {entry.goal.title}
                            </span>
                          ) : (
                            <span className="text-xs text-ink-200">—</span>
                          )}
                        </td>
                        <td
                          className={`tnum whitespace-nowrap px-4 py-3 text-right font-display font-bold ${
                            entry.type === "income"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {entry.type === "income" ? "+" : "−"} R${" "}
                          {formatMoney(entry.value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              <p className="text-xs text-ink-400">
                Mostrando {Math.min(visibleCount, filteredEntries.length)} de{" "}
                {filteredEntries.length}
              </p>
              {visibleCount < filteredEntries.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="btn-ghost"
                >
                  Mostrar mais
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ProfilePage;
