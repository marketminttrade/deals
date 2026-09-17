import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ACCOUNT_ROUTES } from "../constants/accessConfig";
import { useBrokerAuth } from "../context/BrokerAuthContext";

// SVG icons — inline for zero-dependency approach
const WatchlistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const OrdersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PortfolioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const AccountIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const brokerNavItems = [
  { to: ACCOUNT_ROUTES.dashboard, label: "Watchlist", Icon: WatchlistIcon, id: "watchlist" },
  { to: ACCOUNT_ROUTES.trades, label: "Orders", Icon: OrdersIcon, id: "orders" },
  { to: "/account/customers", label: "Dashboard", Icon: DashboardIcon, id: "dashboard" },
  { to: ACCOUNT_ROUTES.portfolio, label: "Portfolio", Icon: PortfolioIcon, id: "portfolio" },
  { to: ACCOUNT_ROUTES.profile, label: null, Icon: AccountIcon, id: "account" },
];

export default function BrokerShell() {
  const location = useLocation();
  const { selectedClient } = useBrokerAuth();

  const accountTabLabel = selectedClient?.clientCode || selectedClient?.idCode || "Account";

  return (
    <div className="shell-bg broker-shell-bg">
      <div className="broker-shell">
        <main className="page-body">
          <Outlet />
        </main>

        <nav className="bp-bottom-nav" aria-label="Broker navigation">
          {brokerNavItems.map(({ to, label, Icon, id }) => {
            const isActive =
              to === ACCOUNT_ROUTES.dashboard
                ? location.pathname === to
                : location.pathname.startsWith(to);

            return (
              <NavLink
                key={id}
                to={to}
                className={`bp-nav-item${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                id={`bp-nav-${id}`}
              >
                {id === "account" ? (
                  <div className="bp-nav-icon-wrap">
                    <Icon active={isActive} />
                  </div>
                ) : (
                  <Icon />
                )}
                {label && <span>{label}</span>}
                {id === "account" && <span>{accountTabLabel}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
