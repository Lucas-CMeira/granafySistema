// Tela de lançamentos: cadastro de receitas/despesas, histórico filtrável por
// período, tipo e busca, com edição e exclusão — incluindo o tratamento dos
// lançamentos fixos, que geram ocorrências automáticas todo mês.

import { useEffect, useMemo, useState } from "react";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdSearch,
  MdEdit,
  MdDeleteOutline,
  MdRepeat,
  MdAutoAwesome,
  MdFlag,
  MdReceiptLong,
  MdClose,
  MdWarningAmber,
} from "react-icons/md";
import API_URL from "../../services/api";
import { formatCurrency, parseCurrency } from "../../utils/currencyMask";
import {
  formatMoney,
  formatDate,
  formatMonthLabel,
  monthKey,
  todayInputValue,
  categoryColor,
  categoryInitials,
} from "../../utils/format";
import { isGoalCompleted } from "../../utils/goals";
import type { Goal } from "../../utils/goals";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Highlight from "../../components/Highlight";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { SkeletonRows } from "../../components/Skeleton";
import { useToast } from "../../components/toast-context";
import { errorMessage } from "../../utils/errors";

type Category = { id: string; name: string; color?: string | null };
// A API devolve o objeto completo da meta dentro do lançamento, mas sem a lista
// de `entries` dela (o include de /entries não a traz) — por isso este tipo
// local mais enxuto, separado do `Goal` de utils/goals usado para o <select>.
type GoalRef = { id: string; title: string };

type Entry = {
  id: string;
  title: string;
  value: number;
  type: "income" | "expenses";
  date: string;
  categoryId?: string | null;
  category?: Category | null;
  goalId?: string | null;
  goal?: GoalRef | null;
  isFixed?: boolean;
  fixedDay?: number | null;
  parentId?: string | null;
};

type TypeFilter = "all" | "income" | "expenses";

const EMPTY_FORM = {
  title: "",
  displayValue: "",
  type: "expenses" as Entry["type"],
  date: todayInputValue(),
  categoryId: "",
  customCategory: "",
  goalId: "",
  isFixed: false,
  fixedDay: "",
};

type FormState = typeof EMPTY_FORM;

const EntriesPage = () => {
  const toast = useToast();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  // Filtros do histórico
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [period, setPeriod] = useState("all");

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setEditField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => setEditForm((current) => ({ ...current, [key]: value }));

  const fetchData = async () => {
    try {
      const [entriesRes, categoriesRes, goalsRes] = await Promise.all([
        fetch(`${API_URL}/entries`, { credentials: "include" }),
        fetch(`${API_URL}/categories`, { credentials: "include" }),
        fetch(`${API_URL}/goals`, { credentials: "include" }),
      ]);

      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
    } catch (error) {
      console.error(error);
      toast.error(
        "Não foi possível carregar seus lançamentos. Verifique se a API está no ar.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOthers = (categoryId: string) =>
    categories.find((category) => category.id === categoryId)?.name ===
    "Outros";

  // Metas já concluídas não podem receber novos lançamentos — mas se o
  // formulário já está com uma delas selecionada (edição de um lançamento que
  // já pertence a ela), ela continua na lista para não sumir sob os pés do
  // usuário.
  const availableGoals = (selectedGoalId: string) =>
    goals.filter((goal) => !isGoalCompleted(goal) || goal.id === selectedGoalId);

  // ── Períodos disponíveis, montados a partir dos próprios lançamentos ─────
  const periods = useMemo(() => {
    const seen = new Map<string, string>();
    entries.forEach((entry) =>
      seen.set(monthKey(entry.date), formatMonthLabel(entry.date)),
    );
    return [...seen.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesPeriod = period === "all" || monthKey(entry.date) === period;
      const matchesType = typeFilter === "all" || entry.type === typeFilter;
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        (entry.category?.name || "").toLowerCase().includes(term);

      return matchesPeriod && matchesType && matchesSearch;
    });
  }, [entries, period, typeFilter, search]);

  // Os totais seguem o filtro de período, mas ignoram busca e tipo: um placar
  // que mudasse ao filtrar "só despesas" mostraria um saldo que não existe.
  const totals = useMemo(() => {
    const scope =
      period === "all"
        ? entries
        : entries.filter((e) => monthKey(e.date) === period);

    const income = scope
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.value, 0);
    const expenses = scope
      .filter((e) => e.type === "expenses")
      .reduce((sum, e) => sum + e.value, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      count: scope.length,
    };
  }, [entries, period]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    visibleEntries.forEach((entry) => {
      const key = monthKey(entry.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    });
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [visibleEntries]);

  const hasFilters =
    search.trim() !== "" || typeFilter !== "all" || period !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPeriod("all");
  };

  /** Cria a categoria digitada em "Outros" quando houver nome; devolve o id final. */
  const resolveCategoryId = async (state: FormState): Promise<string> => {
    if (!isOthers(state.categoryId) || !state.customCategory.trim())
      return state.categoryId;

    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: state.customCategory.trim() }),
    });

    if (!response.ok) {
      // Falhar em silêncio aqui gravava o lançamento em "Outros" sem avisar;
      // agora o usuário sabe que a categoria não foi criada.
      throw new Error(
        "Não foi possível criar a categoria nova. Tente outro nome.",
      );
    }

    const created = await response.json();
    return created.id;
  };

  const validate = (state: FormState): string | null => {
    if (!state.title.trim()) return "Dê um título ao lançamento.";
    if (!state.categoryId) return "Escolha uma categoria.";
    if (parseCurrency(state.displayValue) <= 0)
      return "Informe um valor maior que zero.";
    if (!state.date) return "Escolha a data do lançamento.";
    if (state.isFixed) {
      const day = Number(state.fixedDay);
      if (!day || day < 1 || day > 31)
        return "Informe um dia do mês entre 1 e 31 para a repetição.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problem = validate(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      const categoryId = await resolveCategoryId(form);

      const response = await fetch(`${API_URL}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          value: parseCurrency(form.displayValue),
          type: form.type,
          date: form.date,
          categoryId,
          goalId: form.goalId || undefined,
          isFixed: form.isFixed,
          fixedDay: form.isFixed ? Number(form.fixedDay) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "Não foi possível salvar o lançamento.",
        );
      }

      toast.success(
        `${form.type === "income" ? "Receita" : "Despesa"} registrada.`,
      );
      // Mantém tipo e data: quem lança várias contas do mesmo dia não precisa
      // preencher os mesmos campos de novo.
      setForm({ ...EMPTY_FORM, type: form.type, date: form.date });
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível salvar o lançamento."));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (entry: Entry) => {
    setEditing(entry);
    setEditForm({
      title: entry.title,
      displayValue: formatCurrency(String(Math.round(entry.value * 100))),
      type: entry.type,
      date: entry.date ? entry.date.slice(0, 10) : "",
      categoryId: entry.categoryId || "",
      customCategory: "",
      goalId: entry.goalId || "",
      isFixed: Boolean(entry.isFixed),
      fixedDay: entry.fixedDay ? String(entry.fixedDay) : "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const problem = validate(editForm);
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      const categoryId = await resolveCategoryId(editForm);

      const response = await fetch(`${API_URL}/entries/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editForm.title.trim(),
          value: parseCurrency(editForm.displayValue),
          type: editForm.type,
          date: editForm.date,
          categoryId,
          goalId: editForm.goalId || null,
          isFixed: editForm.isFixed,
          fixedDay: editForm.isFixed ? Number(editForm.fixedDay) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "Não foi possível salvar as alterações.",
        );
      }

      toast.success("Lançamento atualizado.");
      setEditing(null);
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, message: string) => {
    try {
      const response = await fetch(`${API_URL}/entries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "Não foi possível excluir o lançamento.",
        );
      }

      toast.success(message);
      setDeleting(null);
      await fetchData();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível excluir o lançamento."));
    }
  };

  // ── Lançamentos fixos ────────────────────────────────────────────────────
  // Um lançamento "fixo" é o molde; a API cria uma cópia dele por mês, marcada
  // com parentId. Apagar uma cópia isolada não resolve nada, porque a próxima
  // listagem a recria. Então a exclusão de uma cópia é oferecida como exclusão
  // do fixo inteiro — e o diálogo diz isso com todas as letras.
  const parentOf = (entry: Entry) =>
    entry.parentId
      ? (entries.find((candidate) => candidate.id === entry.parentId) ?? null)
      : null;

  const occurrencesOf = (entry: Entry) =>
    entries.filter((candidate) => candidate.parentId === entry.id).length;

  return (
    <div>
      <PageHeader
        eyebrow="Movimentações"
        title={
          <>
            Cada real <Highlight tone="money">anotado</Highlight>
          </>
        }
        subtitle="Registre o que entra e o que sai. O saldo é recalculado na hora."
      />

      {/* ── Placar do período ─────────────────────────────────────────────── */}
      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Receitas"
          value={`R$ ${formatMoney(totals.income)}`}
          tone="in"
          icon={<MdTrendingUp />}
          hint={
            period === "all"
              ? "Todo o histórico"
              : formatMonthLabel(`${period}-15`)
          }
        />
        <StatCard
          label="Despesas"
          value={`R$ ${formatMoney(totals.expenses)}`}
          tone="out"
          icon={<MdTrendingDown />}
          hint={`${totals.count} lançamento${totals.count === 1 ? "" : "s"} no período`}
        />
        <StatCard
          label="Saldo do período"
          value={`R$ ${formatMoney(totals.balance)}`}
          featured
          icon={<MdAccountBalanceWallet />}
          hint={
            totals.balance >= 0
              ? "Você fechou o período no positivo."
              : "As despesas passaram das receitas neste período."
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        {/* ── Formulário ─────────────────────────────────────────────────── */}
        <section className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Novo lançamento
          </h2>
          <p className="mb-5 mt-0.5 text-sm text-ink-500">
            Leva alguns segundos.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TypeToggle
              value={form.type}
              onChange={(type) => {
                setField("type", type);
                if (type !== "income") setField("goalId", "");
              }}
            />

            <div>
              <label htmlFor="entry-value" className="field-label">
                Valor
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-sm font-semibold text-ink-400">
                  R$
                </span>
                <input
                  id="entry-value"
                  type="text"
                  inputMode="numeric"
                  value={form.displayValue}
                  onChange={(e) =>
                    setField("displayValue", formatCurrency(e.target.value))
                  }
                  required
                  placeholder="0,00"
                  className={`field tnum py-3.5 pl-12 font-display text-xl font-bold ${
                    form.type === "income" ? "text-emerald-700" : "text-ink-900"
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="entry-title" className="field-label">
                Título
              </label>
              <input
                id="entry-title"
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                required
                placeholder={
                  form.type === "income"
                    ? "Ex: Salário de agosto"
                    : "Ex: Supermercado"
                }
                className="field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="entry-date" className="field-label">
                  Data
                </label>
                <input
                  id="entry-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  required
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="entry-category" className="field-label">
                  Categoria
                </label>
                <select
                  id="entry-category"
                  value={form.categoryId}
                  onChange={(e) => {
                    setField("categoryId", e.target.value);
                    setField("customCategory", "");
                  }}
                  required
                  className="field"
                >
                  <option value="">Selecione…</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isOthers(form.categoryId) && (
              <div className="animate-fade-in rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                <label
                  htmlFor="entry-custom-category"
                  className="field-label text-emerald-800"
                >
                  Criar uma categoria nova
                </label>
                <input
                  id="entry-custom-category"
                  type="text"
                  value={form.customCategory}
                  onChange={(e) => setField("customCategory", e.target.value)}
                  placeholder="Ex: Viagem, Educação, Pet…"
                  className="field border-emerald-300 bg-white"
                />
                <p className="field-hint text-emerald-800/70">
                  Deixe em branco para lançar como “Outros”.
                </p>
              </div>
            )}

            {form.type === "income" && availableGoals(form.goalId).length > 0 && (
              <div className="animate-fade-in">
                <label htmlFor="entry-goal" className="field-label">
                  Guardar para uma meta
                </label>
                <select
                  id="entry-goal"
                  value={form.goalId}
                  onChange={(e) => setField("goalId", e.target.value)}
                  className="field"
                >
                  <option value="">Nenhuma meta</option>
                  {availableGoals(form.goalId).map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                <p className="field-hint">
                  O valor continua no seu saldo e ainda soma à meta.
                </p>
              </div>
            )}

            <FixedToggle
              checked={form.isFixed}
              onChange={(checked) => setField("isFixed", checked)}
              day={form.fixedDay}
              onDayChange={(day) => setField("fixedDay", day)}
              idPrefix="entry"
            />

            <button
              type="submit"
              id="entry-submit"
              disabled={saving}
              className="btn-primary mt-1 py-3"
            >
              {saving ? "Salvando…" : "Salvar lançamento"}
            </button>
          </form>
        </section>

        {/* ── Histórico ──────────────────────────────────────────────────── */}
        <section className="card flex flex-col p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Histórico
            </h2>
            <p className="text-sm text-ink-400">
              {visibleEntries.length} de {entries.length}
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-5 flex flex-col gap-3">
            <div className="relative">
              <MdSearch
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título ou categoria"
                aria-label="Buscar lançamentos"
                className="field pl-11"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterChip
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
              >
                Tudo
              </FilterChip>
              <FilterChip
                active={typeFilter === "income"}
                onClick={() => setTypeFilter("income")}
                tone="in"
              >
                Receitas
              </FilterChip>
              <FilterChip
                active={typeFilter === "expenses"}
                onClick={() => setTypeFilter("expenses")}
                tone="out"
              >
                Despesas
              </FilterChip>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Filtrar por mês"
                className="field ml-auto w-auto py-1.5 text-xs font-semibold"
              >
                <option value="all">Todos os meses</option>
                {periods.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
                >
                  <MdClose /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <SkeletonRows rows={5} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<MdReceiptLong />}
              title="Nenhum lançamento ainda"
              description="Registre a primeira receita ou despesa no formulário ao lado — o saldo aparece assim que você salvar."
            />
          ) : visibleEntries.length === 0 ? (
            <EmptyState
              icon={<MdSearch />}
              title="Nada com esses filtros"
              description="Nenhum lançamento combina com a busca e os filtros selecionados."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-ghost"
                >
                  Limpar filtros
                </button>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedEntries.map(([key, monthEntries]) => {
                const monthBalance = monthEntries.reduce(
                  (sum, entry) =>
                    entry.type === "income"
                      ? sum + entry.value
                      : sum - entry.value,
                  0,
                );

                return (
                  <div key={key}>
                    <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-ink-100 pb-2">
                      <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-500">
                        {formatMonthLabel(`${key}-15`)}
                      </h3>
                      <span
                        className={`tnum text-xs font-bold ${
                          monthBalance >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {monthBalance >= 0 ? "+" : "−"} R${" "}
                        {formatMoney(Math.abs(monthBalance))}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-1.5">
                      {monthEntries.map((entry) => {
                        const color = categoryColor(entry.category);
                        const parent = parentOf(entry);

                        return (
                          <li
                            key={entry.id}
                            className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-ink-100 hover:bg-ink-50/60"
                          >
                            <span
                              aria-hidden
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold"
                              style={{ backgroundColor: `${color}1F`, color }}
                            >
                              {categoryInitials(entry.category?.name)}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-sm font-semibold text-ink-900">
                                  {entry.title}
                                </p>

                                {entry.isFixed && (
                                  <Badge tone="ocean" icon={<MdRepeat />}>
                                    Fixo · dia {entry.fixedDay}
                                  </Badge>
                                )}
                                {parent && (
                                  <Badge tone="ink" icon={<MdAutoAwesome />}>
                                    Repetição de “{parent.title}”
                                  </Badge>
                                )}
                                {entry.goal && (
                                  <Badge tone="emerald" icon={<MdFlag />}>
                                    {entry.goal.title}
                                  </Badge>
                                )}
                              </div>

                              <p className="mt-0.5 truncate text-xs text-ink-400">
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

                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEdit(entry)}
                                title={`Editar ${entry.title}`}
                                aria-label={`Editar ${entry.title}`}
                                className="rounded-lg p-2 text-ink-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <MdEdit />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(entry)}
                                title={`Excluir ${entry.title}`}
                                aria-label={`Excluir ${entry.title}`}
                                className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <MdDeleteOutline />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Modal de edição ─────────────────────────────────────────────── */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar lançamento"
        description={
          editing?.parentId
            ? "Esta é uma repetição gerada automaticamente."
            : undefined
        }
      >
        <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-6">
          <TypeToggle
            value={editForm.type}
            onChange={(type) => {
              setEditField("type", type);
              if (type !== "income") setEditField("goalId", "");
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-entry-value" className="field-label">
                Valor
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
                  R$
                </span>
                <input
                  id="edit-entry-value"
                  type="text"
                  inputMode="numeric"
                  value={editForm.displayValue}
                  onChange={(e) =>
                    setEditField("displayValue", formatCurrency(e.target.value))
                  }
                  required
                  className="field tnum pl-11 font-semibold"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-entry-date" className="field-label">
                Data
              </label>
              <input
                id="edit-entry-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditField("date", e.target.value)}
                required
                className="field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-entry-title" className="field-label">
              Título
            </label>
            <input
              id="edit-entry-title"
              type="text"
              value={editForm.title}
              onChange={(e) => setEditField("title", e.target.value)}
              required
              className="field"
            />
          </div>

          <div>
            <label htmlFor="edit-entry-category" className="field-label">
              Categoria
            </label>
            <select
              id="edit-entry-category"
              value={editForm.categoryId}
              onChange={(e) => {
                setEditField("categoryId", e.target.value);
                setEditField("customCategory", "");
              }}
              required
              className="field"
            >
              <option value="">Selecione…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {isOthers(editForm.categoryId) && (
            <div className="animate-fade-in rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <label
                htmlFor="edit-entry-custom-category"
                className="field-label text-emerald-800"
              >
                Criar uma categoria nova
              </label>
              <input
                id="edit-entry-custom-category"
                type="text"
                value={editForm.customCategory}
                onChange={(e) => setEditField("customCategory", e.target.value)}
                placeholder="Ex: Viagem, Educação, Pet…"
                className="field border-emerald-300 bg-white"
              />
              <p className="field-hint text-emerald-800/70">
                Deixe em branco para manter “Outros”.
              </p>
            </div>
          )}

          {editForm.type === "income" && availableGoals(editForm.goalId).length > 0 && (
            <div>
              <label htmlFor="edit-entry-goal" className="field-label">
                Guardar para uma meta
              </label>
              <select
                id="edit-entry-goal"
                value={editForm.goalId}
                onChange={(e) => setEditField("goalId", e.target.value)}
                className="field"
              >
                <option value="">Nenhuma meta</option>
                {availableGoals(editForm.goalId).map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FixedToggle
            checked={editForm.isFixed}
            onChange={(checked) => setEditField("isFixed", checked)}
            day={editForm.fixedDay}
            onDayChange={(day) => setEditField("fixedDay", day)}
            idPrefix="edit-entry"
          />

          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="edit-entry-submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal de exclusão ───────────────────────────────────────────── */}
      <DeleteEntryDialog
        entry={deleting}
        parent={deleting ? parentOf(deleting) : null}
        occurrences={deleting ? occurrencesOf(deleting) : 0}
        onClose={() => setDeleting(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};

// ── Peças da tela ──────────────────────────────────────────────────────────

/** Escolha entre despesa e receita. Um <select> escondia a decisão mais
 *  importante do formulário atrás de um clique; aqui ela é a primeira coisa
 *  visível, e a cor já antecipa o efeito no saldo. */
function TypeToggle({
  value,
  onChange,
}: {
  value: Entry["type"];
  onChange: (type: Entry["type"]) => void;
}) {
  const options = [
    {
      key: "expenses" as const,
      label: "Despesa",
      icon: <MdTrendingDown />,
      active: "bg-rose-600 text-white shadow-sm",
    },
    {
      key: "income" as const,
      label: "Receita",
      icon: <MdTrendingUp />,
      active: "bg-emerald-600 text-white shadow-sm",
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Tipo do lançamento"
      className="grid grid-cols-2 gap-1.5 rounded-2xl bg-ink-100/70 p-1.5"
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={value === option.key}
          onClick={() => onChange(option.key)}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            value === option.key
              ? option.active
              : "text-ink-500 hover:bg-white/70 hover:text-ink-800"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FixedToggle({
  checked,
  onChange,
  day,
  onDayChange,
  idPrefix,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  day: string;
  onDayChange: (day: string) => void;
  idPrefix: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition ${checked ? "border-ocean-200 bg-ocean-50/60" : "border-ink-200"}`}
    >
      <label
        htmlFor={`${idPrefix}-isFixed`}
        className="flex cursor-pointer items-start gap-3"
      >
        <input
          type="checkbox"
          id={`${idPrefix}-isFixed`}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-ocean-600 focus:ring-ocean-500"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <MdRepeat className="text-ocean-600" />
            Repetir todo mês
          </span>
          <span className="mt-0.5 block text-xs text-ink-500">
            Para contas que caem sempre — aluguel, assinatura, salário.
          </span>
        </span>
      </label>

      {checked && (
        <div className="mt-3 animate-fade-in">
          <label htmlFor={`${idPrefix}-fixed-day`} className="field-label">
            Dia do mês
          </label>
          <input
            id={`${idPrefix}-fixed-day`}
            type="number"
            value={day}
            onChange={(e) => onDayChange(e.target.value)}
            required
            min={1}
            max={31}
            placeholder="5"
            className="field w-28 bg-white"
          />
          <p className="field-hint">Em meses mais curtos, cai no último dia.</p>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  tone = "neutral",
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "neutral" | "in" | "out";
  children: React.ReactNode;
}) {
  const activeStyle =
    tone === "in"
      ? "bg-emerald-600 text-white"
      : tone === "out"
        ? "bg-rose-600 text-white"
        : "bg-ink-800 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
        active ? activeStyle : "bg-ink-100 text-ink-600 hover:bg-ink-200"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({
  tone,
  icon,
  children,
}: {
  tone: "ocean" | "ink" | "emerald";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = {
    ocean: "bg-ocean-50 text-ocean-700 ring-ocean-100",
    ink: "bg-ink-100 text-ink-600 ring-ink-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <span
      className={`inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${styles[tone]}`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * Diálogo de exclusão.
 *
 * Antes, apagar uma repetição automática parecia funcionar e ela reaparecia na
 * próxima listagem — o app dizia uma coisa e fazia outra. Agora o diálogo
 * explica de onde a repetição vem e oferece a ação que realmente resolve.
 */
function DeleteEntryDialog({
  entry,
  parent,
  occurrences,
  onClose,
  onDelete,
}: {
  entry: Entry | null;
  parent: Entry | null;
  occurrences: number;
  onClose: () => void;
  onDelete: (id: string, message: string) => void;
}) {
  if (!entry) return null;

  const isOccurrence = Boolean(entry.parentId);
  const isTemplate = Boolean(entry.isFixed);

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={isOccurrence ? "Este lançamento se repete" : "Excluir lançamento?"}
    >
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-ink-50 p-3.5">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-ink-100"
          >
            <MdWarningAmber />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {entry.title}
            </p>
            <p className="tnum text-xs text-ink-500">
              {formatDate(entry.date)} · R$ {formatMoney(entry.value)}
            </p>
          </div>
        </div>

        {isOccurrence ? (
          <p className="text-sm leading-relaxed text-ink-600">
            Ele é gerado automaticamente pelo lançamento fixo{" "}
            <strong className="text-ink-900">
              “{parent?.title ?? entry.title}”
            </strong>
            . Excluir só este mês não adianta: ele volta na próxima atualização
            da lista. Para parar de vez, exclua o lançamento fixo — isso remove
            todas as repetições dele.
          </p>
        ) : isTemplate ? (
          <p className="text-sm leading-relaxed text-ink-600">
            Este é um lançamento fixo.{" "}
            {occurrences > 0 ? (
              <>
                Excluir também remove as{" "}
                <strong className="text-ink-900">{occurrences}</strong>{" "}
                repetições já geradas por ele.
              </>
            ) : (
              "Ele deixará de gerar repetições nos próximos meses."
            )}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-ink-600">
            O lançamento sai do histórico e o saldo é recalculado. Não dá para
            desfazer.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>

          {isOccurrence ? (
            <button
              type="button"
              disabled={!parent}
              onClick={() =>
                parent &&
                onDelete(
                  parent.id,
                  "Lançamento fixo e suas repetições excluídos.",
                )
              }
              className="btn-danger flex-1"
            >
              Excluir o fixo
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onDelete(
                  entry.id,
                  isTemplate
                    ? "Lançamento fixo e suas repetições excluídos."
                    : "Lançamento excluído.",
                )
              }
              className="btn-danger flex-1"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default EntriesPage;
