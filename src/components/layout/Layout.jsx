import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import styles from './Layout.module.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.root}>
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={[styles.main, collapsed ? styles.mainCollapsed : ''].join(' ')}>
        <Outlet />
      </main>
    </div>
  );
}
