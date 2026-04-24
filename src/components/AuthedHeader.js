import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../api/auth";
import vertigoLogo from "../assets/vertigo-logo.png";

export function AuthedHeader() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? user?.Role;
  const isGerant = role === "Gerant" || role === "Commercant";
  const isAdmin = role === "Admin";

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-eco-green/10 bg-eco-green text-eco-beige shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/deals" className="inline-flex">
          <img src={vertigoLogo} alt="Vertigo" className="h-10 w-auto md:h-12" />
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
          <HeaderLink to="/deals">Deals</HeaderLink>
          <HeaderLink to="/orders">My orders</HeaderLink>
          {isGerant && <HeaderLink to="/my-restaurant">My restaurant</HeaderLink>}
          {!isGerant && !isAdmin && <HeaderLink to="/become-merchant">Become merchant</HeaderLink>}
          {isAdmin && <HeaderLink to="/admin/approvals">Approvals</HeaderLink>}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-eco-beige/70 sm:inline">{user?.nom ?? user?.Nom ?? ""}</span>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-eco-beige/35 bg-eco-beige/10 px-3 py-1.5 text-xs font-semibold text-eco-beige backdrop-blur-sm transition hover:border-eco-softYellow/50 hover:bg-eco-beige/20 sm:text-sm"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ to, children }) {
  return (
    <Link to={to} className="rounded-xl px-3 py-1.5 font-semibold text-eco-beige/85 hover:bg-eco-beige/10">
      {children}
    </Link>
  );
}
