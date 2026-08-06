import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MdLogout,
  MdSpaceDashboard,
  MdReceiptLong,
  MdFlag,
  MdPerson,
  MdMenu,
  MdClose,
} from "react-icons/md";
import API_URL from "../services/api";
import Logo from "./Logo";

const navItems = [
  { to: "/", label: "Início", icon: MdSpaceDashboard, end: true },
  { to: "/entries", label: "Lançamentos", icon: MdReceiptLong, end: false },
  { to: "/goals", label: "Metas", icon: MdFlag, end: false },
  { to: "/profile", label: "Perfil", icon: MdPerson, end: false },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(error);
    } finally {
      navigate("/login");
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-white text-ink-900 shadow-sm"
        : "text-ink-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-40 w-full bg-ink-950">
      {/* Fio do gradiente da marca — o azul e o verde do logotipo. */}
      <span aria-hidden className="block h-0.5 w-full bg-brand-gradient" />

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* Placa branca: sobre fundo escuro, o "Grana" azul do logo sumia. */}
        <Logo size="sm" plate />

        <div className="ml-2 hidden flex-1 items-center gap-1.5 md:flex">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="text-base" />
              {label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto hidden items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-ink-100 transition hover:bg-rose-600 hover:text-white md:flex"
        >
          <MdLogout />
          Sair
        </button>

        {/* Menu compacto */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          className="ml-auto rounded-xl bg-white/10 p-2.5 text-white transition hover:bg-white/20 md:hidden"
        >
          {menuOpen ? <MdClose className="text-xl" /> : <MdMenu className="text-xl" />}
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade-in border-t border-white/10 px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={linkClass}
              >
                <Icon className="text-base" />
                {label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1.5 flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-sm font-semibold text-ink-100 transition hover:bg-rose-600 hover:text-white"
            >
              <MdLogout />
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
