// Caixa de diálogo compartilhada.
//
// Antes cada modal repetia a mesma marcação e nenhum deles fechava com Esc nem
// clicando fora — a única saída era o "x". Aqui isso vem de graça, junto com o
// bloqueio da rolagem do fundo e o foco inicial dentro do diálogo.

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { MdClose } from "react-icons/md";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md";
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // onClose chega como uma arrow function nova a cada render do componente pai
  // (ex.: onClose={() => setEditing(null)}). Colocar `onClose` nas dependências
  // do efeito abaixo fazia o efeito rodar de novo a cada tecla digitada em
  // qualquer campo do modal — e panelRef.current?.focus() roubava o foco do
  // input de volta para o painel do modal. Guardar a função mais recente numa
  // ref deixa o efeito preso só ao ciclo de abrir/fechar.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`my-auto w-full animate-pop-in rounded-3xl bg-white shadow-pop focus:outline-none ${
          size === "sm" ? "max-w-sm" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1.5 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
