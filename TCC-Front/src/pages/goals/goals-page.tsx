// Tela de metas financeiras: criação, acompanhamento do progresso, edição e
// exclusão. Além do quanto já foi guardado, cada meta calcula o que ainda falta
// e o ritmo mensal necessário para chegar lá dentro do prazo.

import { useEffect, useMemo, useState } from "react";
import {
  MdFlag,
  MdSavings,
  MdEmojiEvents,
  MdEdit,
  MdDeleteOutline,
  MdEventAvailable,
  MdWarningAmber,
  MdLightbulbOutline,
  MdTrendingUp,
} from "react-icons/md";
import API_URL from "../../services/api";
import { formatCurrency, parseCurrency } from "../../utils/currencyMask";
import {
  formatMoney,
  formatDate,
  daysUntil,
  deadlineLabel,
  monthsUntil,
  todayInputValue,
} from "../../utils/format";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Highlight from "../../components/Highlight";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import { SkeletonLine } from "../../components/Skeleton";
import { useToast } from "../../components/toast-context";
import { errorMessage } from "../../utils/errors";
import {
  getGoalCompletionDetails,
  isGoalCompleted,
  sumSavedEntries,
} from "../../utils/goals";
import type { Goal } from "../../utils/goals";

const EMPTY_FORM = { title: "", displayValue: "", limitDate: "", description: "" };
type FormState = typeof EMPTY_FORM;

const GoalsPage = () => {
  const toast = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Goal | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setEditField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setEditForm((current) => ({ ...current, [key]: value }));

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_URL}/goals`, { credentials: "include" });
      if (response.ok) setGoals(await response.json());
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar suas metas. Verifique se a API está no ar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Metas concluídas vão para o fim: o topo da lista é o que ainda pede ação.
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const aDone = isGoalCompleted(a);
      const bDone = isGoalCompleted(b);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(a.limitDate).getTime() - new Date(b.limitDate).getTime();
    });
  }, [goals]);

  const summary = useMemo(() => {
    const saved = goals.reduce((total, goal) => total + Math.min(sumSavedEntries(goal.entries), goal.value), 0);
    const target = goals.reduce((total, goal) => total + goal.value, 0);
    const completed = goals.filter((goal) => sumSavedEntries(goal.entries) >= goal.value).length;

    return { saved, target, completed, active: goals.length - completed };
  }, [goals]);

  const validate = (state: FormState): string | null => {
    if (!state.title.trim()) return "Dê um nome à meta.";
    if (parseCurrency(state.displayValue) <= 0) return "Informe um valor objetivo maior que zero.";
    if (!state.limitDate) return "Escolha a data limite da meta.";
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
      const response = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          value: parseCurrency(form.displayValue),
          limitDate: form.limitDate,
          description: form.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível criar a meta.");
      }

      toast.success("Meta criada. Agora é só atrelar receitas a ela.");
      setForm(EMPTY_FORM);
      await fetchGoals();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível criar a meta."));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setEditForm({
      title: goal.title,
      displayValue: formatCurrency(String(Math.round(goal.value * 100))),
      limitDate: goal.limitDate.slice(0, 10),
      description: goal.description || "",
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
      const response = await fetch(`${API_URL}/goals/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editForm.title.trim(),
          value: parseCurrency(editForm.displayValue),
          limitDate: editForm.limitDate,
          description: editForm.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível salvar as alterações.");
      }

      toast.success("Meta atualizada.");
      setEditing(null);
      await fetchGoals();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goal: Goal) => {
    try {
      const response = await fetch(`${API_URL}/goals/${goal.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível excluir a meta.");
      }

      toast.success(`Meta “${goal.title}” excluída.`);
      setDeleting(null);
      setEditing(null);
      await fetchGoals();
    } catch (error) {
      toast.error(errorMessage(error, "Não foi possível excluir a meta."));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Planejamento"
        title={
          <>
            Metas que saem do <Highlight tone="plan">papel</Highlight>
          </>
        }
        subtitle="Defina um objetivo, atrele suas receitas a ele e acompanhe o quanto já foi guardado."
      />

      {/* ── Placar ────────────────────────────────────────────────────────── */}
      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Metas em andamento"
          value={summary.active}
          tone="plan"
          icon={<MdFlag />}
          hint={summary.completed > 0 ? `${summary.completed} já concluída${summary.completed === 1 ? "" : "s"}` : "Nenhuma concluída ainda"}
        />
        <StatCard
          label="Objetivo total"
          value={`R$ ${formatMoney(summary.target)}`}
          tone="neutral"
          icon={<MdTrendingUp />}
          hint="Somando todas as suas metas"
        />
        <StatCard
          label="Já guardado"
          value={`R$ ${formatMoney(summary.saved)}`}
          featured
          icon={<MdSavings />}
          hint={
            summary.target > 0
              ? `${((summary.saved / summary.target) * 100).toFixed(0)}% do objetivo total`
              : "Crie sua primeira meta para começar"
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        {/* ── Formulário ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-fit">
          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold text-ink-900">Nova meta</h2>
            <p className="mb-5 mt-0.5 text-sm text-ink-500">O que você quer conquistar?</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="goal-title" className="field-label">
                  Nome da meta
                </label>
                <input
                  id="goal-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                  placeholder="Ex: Viagem 2026, Reserva de emergência…"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="goal-value" className="field-label">
                  Quanto você precisa juntar
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-sm font-semibold text-ink-400">
                    R$
                  </span>
                  <input
                    id="goal-value"
                    type="text"
                    inputMode="numeric"
                    value={form.displayValue}
                    onChange={(e) => setField("displayValue", formatCurrency(e.target.value))}
                    required
                    placeholder="0,00"
                    className="field tnum py-3.5 pl-12 font-display text-xl font-bold text-ocean-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal-limit-date" className="field-label">
                  Até quando
                </label>
                <input
                  id="goal-limit-date"
                  type="date"
                  value={form.limitDate}
                  onChange={(e) => setField("limitDate", e.target.value)}
                  required
                  // Uma meta que já nasce vencida não tem como ser acompanhada.
                  min={todayInputValue()}
                  className="field"
                />
                {form.limitDate && parseCurrency(form.displayValue) > 0 && (
                  <p className="field-hint animate-fade-in text-ocean-700">
                    Dá{" "}
                    <strong className="tnum">
                      R$ {formatMoney(parseCurrency(form.displayValue) / monthsUntil(form.limitDate))}
                    </strong>{" "}
                    por mês até lá.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="goal-description" className="field-label">
                  Descrição <span className="font-normal normal-case tracking-normal text-ink-400">(opcional)</span>
                </label>
                <input
                  id="goal-description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Ex: Viagem para a Europa com a família"
                  className="field"
                />
              </div>

              <button type="submit" id="goal-submit" disabled={saving} className="btn-primary mt-1 py-3">
                {saving ? "Criando…" : "Criar meta"}
              </button>
            </form>
          </section>

          {/* Como funciona */}
          <aside className="rounded-2xl border border-ocean-100 bg-ocean-50/70 p-5">
            <p className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-ocean-900">
              <MdLightbulbOutline className="text-base" />
              Como uma meta enche
            </p>
            <p className="text-sm leading-relaxed text-ocean-900/80">
              Ao registrar uma <strong>receita</strong> em Lançamentos, escolha{" "}
              <em>“Guardar para uma meta”</em>. O valor sai do seu saldo disponível e vai para essa
              “caixinha” — como no Nubank, ele continua seu, só fica separado até a meta ser
              concluída ou desvinculada.
            </p>
          </aside>
        </div>

        {/* ── Lista de metas ─────────────────────────────────────────────── */}
        <section className="card p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink-900">Suas metas</h2>
            {goals.length > 0 && (
              <p className="text-sm text-ink-400">
                {goals.length} meta{goals.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-2xl border border-ink-100 p-5">
                  <SkeletonLine className="h-4 w-1/3" />
                  <SkeletonLine className="mt-3 h-2.5 w-full rounded-full" />
                  <SkeletonLine className="mt-3 h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <EmptyState
              tone="plan"
              icon={<MdFlag />}
              title="Nenhuma meta ainda"
              description="Comece por algo concreto: uma viagem, um curso, a reserva de emergência. Depois é só atrelar suas receitas."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {sortedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => setDeleting(goal)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modal de edição ─────────────────────────────────────────────── */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Editar meta">
        <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-6">
          <div>
            <label htmlFor="edit-goal-title" className="field-label">
              Nome da meta
            </label>
            <input
              id="edit-goal-title"
              type="text"
              value={editForm.title}
              onChange={(e) => setEditField("title", e.target.value)}
              required
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-goal-value" className="field-label">
                Valor objetivo
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
                  R$
                </span>
                <input
                  id="edit-goal-value"
                  type="text"
                  inputMode="numeric"
                  value={editForm.displayValue}
                  onChange={(e) => setEditField("displayValue", formatCurrency(e.target.value))}
                  required
                  className="field tnum pl-11 font-semibold"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-goal-limit-date" className="field-label">
                Data limite
              </label>
              <input
                id="edit-goal-limit-date"
                type="date"
                value={editForm.limitDate}
                onChange={(e) => setEditField("limitDate", e.target.value)}
                required
                className="field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-goal-description" className="field-label">
              Descrição <span className="font-normal normal-case tracking-normal text-ink-400">(opcional)</span>
            </label>
            <input
              id="edit-goal-description"
              type="text"
              value={editForm.description}
              onChange={(e) => setEditField("description", e.target.value)}
              placeholder="Ex: Viagem para a Europa com a família"
              className="field"
            />
          </div>

          <div className="mt-1 flex gap-3">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" id="edit-goal-submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal de exclusão ───────────────────────────────────────────── */}
      {/* Antes existiam dois caminhos diferentes para excluir a mesma meta (um
          dentro do modal de edição, outro na lista). Agora é só este. */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="sm"
        title={deleting ? `Excluir “${deleting.title}”?` : ""}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <MdWarningAmber aria-hidden className="mt-0.5 shrink-0 text-lg text-amber-600" />
            <p className="text-sm leading-relaxed text-amber-900">
              As receitas atreladas a esta meta{" "}
              <strong>continuam no seu histórico e voltam a contar no seu saldo disponível</strong>.
              Elas apenas deixam de contar como progresso da meta — nenhum valor é perdido.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setDeleting(null)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              type="button"
              id="confirm-delete-goal"
              onClick={() => deleting && handleDelete(deleting)}
              className="btn-danger flex-1"
            >
              Excluir meta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── Cartão de meta ─────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const saved = sumSavedEntries(goal.entries);
  const percent = goal.value > 0 ? Math.min(100, (saved / goal.value) * 100) : 0;
  const remaining = Math.max(0, goal.value - saved);
  const completion = getGoalCompletionDetails(goal);
  const isCompleted = completion.isCompleted || saved >= goal.value;

  const days = daysUntil(goal.limitDate);
  const overdue = !isCompleted && days < 0;
  const urgent = !isCompleted && days >= 0 && days <= 14;

  // Quanto guardar por mês para fechar a meta no prazo.
  const monthlyPace = remaining / monthsUntil(goal.limitDate);

  const frame = isCompleted
    ? "border-emerald-200 bg-emerald-50/50"
    : overdue
    ? "border-rose-200 bg-rose-50/40"
    : "border-ink-100 hover:border-ocean-200";

  return (
    <article className={`rounded-2xl border p-5 transition ${frame}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink-900">{goal.title}</h3>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <MdEmojiEvents /> Concluída
              </span>
            )}
          </div>
          {goal.description && <p className="mt-0.5 text-xs text-ink-500">{goal.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            title={`Editar ${goal.title}`}
            aria-label={`Editar ${goal.title}`}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <MdEdit />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title={`Excluir ${goal.title}`}
            aria-label={`Excluir ${goal.title}`}
            className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <MdDeleteOutline />
          </button>
        </div>
      </div>

      {/* Valor guardado + objetivo */}
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <p className="tnum font-display text-2xl font-bold leading-none text-ink-900">
          R$ {formatMoney(saved)}
        </p>
        <p className="tnum text-sm text-ink-400">
          de <span className="font-semibold text-ink-600">R$ {formatMoney(goal.value)}</span>
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isCompleted
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-ocean-500 to-emerald-500"
          }`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso de ${goal.title}`}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={`font-bold ${isCompleted ? "text-emerald-700" : "text-ocean-700"}`}>
          {percent.toFixed(0)}%
        </span>
        {!isCompleted && (
          <span className="tnum text-ink-500">
            faltam <strong className="text-ink-800">R$ {formatMoney(remaining)}</strong>
          </span>
        )}
      </div>

      {/* Rodapé: prazo e ritmo */}
      <div className="mt-4 border-t border-ink-100 pt-3.5">
        {isCompleted && completion.completedDate ? (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-emerald-800">
            <MdEmojiEvents aria-hidden className="mt-px shrink-0 text-sm" />
            <span>
              Concluída em <strong>{formatDate(completion.completedDate)}</strong>
              {completion.status === "early" && ` — ${completion.diffDays} dia${completion.diffDays === 1 ? "" : "s"} antes do prazo.`}
              {completion.status === "on_time" && " — exatamente no prazo."}
              {completion.status === "late" && ` — ${completion.diffDays} dia${completion.diffDays === 1 ? "" : "s"} depois do prazo.`}
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                overdue ? "text-rose-600" : urgent ? "text-amber-600" : "text-ink-500"
              }`}
            >
              {overdue ? <MdWarningAmber /> : <MdEventAvailable />}
              {formatDate(goal.limitDate)} · {deadlineLabel(goal.limitDate)}
            </p>

            {!overdue && (
              <p className="tnum text-xs text-ocean-700">
                guarde <strong>R$ {formatMoney(monthlyPace)}</strong>/mês
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default GoalsPage;
