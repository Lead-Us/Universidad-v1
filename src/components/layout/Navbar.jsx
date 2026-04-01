import { NavLink } from 'react-router-dom';
import {
  RiHome4Line, RiBook2Line, RiCalendarLine, RiLightbulbLine,
  RiMenuFoldLine, RiMenuUnfoldLine, RiSettingsLine,
} from 'react-icons/ri';
import styles from './Navbar.module.css';

const NAV_ITEMS = [
  { to: '/',           icon: RiHome4Line,    label: 'Inicio'     },
  { to: '/ramos',      icon: RiBook2Line,    label: 'Ramos'      },
  { to: '/calendario', icon: RiCalendarLine, label: 'Calendario' },
  { to: '/aprender',   icon: RiLightbulbLine, label: 'Aprender'  },
];

export default function Navbar({ collapsed, onToggle }) {
  return (
    <>
      {/* ── Desktop sidebar ── */}
      <nav className={[styles.sidebar, collapsed ? styles.sidebarCollapsed : ''].join(' ')}>
        <div className={styles.logoArea}>
          {collapsed
            ? <span className={styles.logoInitial}>U</span>
            : <span className={styles.logoText}>Universidad</span>
          }
        </div>

        <ul className={styles.sidebarList}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [styles.sidebarItem, isActive ? styles.active : ''].join(' ')
                }
                title={collapsed ? label : undefined}
              >
                <Icon className={styles.icon} />
                {!collapsed && <span className={styles.label}>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Settings + toggle at bottom */}
        <div className={styles.bottomArea}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [styles.sidebarItem, isActive ? styles.active : ''].join(' ')
            }
            title={collapsed ? 'Configuración' : undefined}
          >
            <RiSettingsLine className={styles.icon} />
            {!collapsed && <span className={styles.label}>Configuración</span>}
          </NavLink>

          <button
            className={styles.toggleBtn}
            onClick={onToggle}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
          </button>
        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav className={styles.bottomBar}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [styles.tabItem, isActive ? styles.active : ''].join(' ')
            }
          >
            <Icon className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [styles.tabItem, isActive ? styles.active : ''].join(' ')
          }
        >
          <RiSettingsLine className={styles.tabIcon} />
          <span className={styles.tabLabel}>Config</span>
        </NavLink>
      </nav>
    </>
  );
}
