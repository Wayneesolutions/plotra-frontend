import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// Shared chrome for every authenticated (dashboard-side) page. Previously
// each page was an island with no way to navigate to any other feature —
// DashboardListings.jsx had its own header with no links elsewhere, so
// Leads/Ops/Settings/Admin were unreachable through the UI even once built.
// Nav items are role-gated: 'admin' items only render for super_admin;
// everything else is available to both 'owner' and 'agent'.
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Listings', roles: ['owner', 'agent', 'super_admin'] },
  { to: '/dashboard/leads', label: 'Leads', roles: ['owner', 'agent', 'super_admin'] },
  { to: '/dashboard/ops', label: 'Ops', roles: ['owner', 'agent', 'super_admin'] },
  { to: '/dashboard/analytics', label: 'Analytics', roles: ['owner', 'agent', 'super_admin'] },
  { to: '/dashboard/billing', label: 'Billing', roles: ['owner'] },
  { to: '/dashboard/settings', label: 'Settings', roles: ['owner', 'agent', 'super_admin'] },
  { to: '/admin', label: 'Admin', roles: ['super_admin'] },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');
  const role = storedUser?.role;

  const handleLogout = () => {
    localStorage.removeItem('pve_token');
    localStorage.removeItem('pve_user');
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.brand}>Plotra</div>
          <div style={styles.navLinks}>
            {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div style={styles.navRight}>
            {storedUser && <span style={styles.userLabel}>{storedUser.name} · {storedUser.businessName}</span>}
            <button onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
          </div>
        </div>
      </nav>
      <main style={styles.content}>{children}</main>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
  nav: { backgroundColor: 'oklch(0.219 0.032 264.2)', borderBottom: '1px solid oklch(0.219 0.032 264.2)' },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '28px', height: '56px' },
  brand: { color: '#fff', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' },
  navLinks: { display: 'flex', gap: '4px', flex: 1 },
  navLink: { color: '#9ca3af', textDecoration: 'none', fontSize: '13px', fontWeight: '600', padding: '8px 12px', borderRadius: '6px' },
  navLinkActive: { color: '#fff', backgroundColor: 'oklch(0.219 0.032 264.2)' },
  navRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  userLabel: { fontSize: '12px', color: '#9ca3af' },
  logoutBtn: { backgroundColor: 'transparent', color: '#e5e7eb', border: '1px solid #374151', padding: '7px 14px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '12px' },
  content: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
};
