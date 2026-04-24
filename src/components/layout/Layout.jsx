import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import FeedbackButton from '../shared/FeedbackButton.jsx';
import SurveyModal from '../shared/SurveyModal.jsx';
import { useSurvey } from '../../hooks/useSurvey.js';
import styles from './Layout.module.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { showSurvey, submit, dismiss } = useSurvey();

  return (
    <div className={styles.root}>
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={[styles.main, collapsed ? styles.mainCollapsed : ''].join(' ')}>
        <Outlet />
      </main>
      <FeedbackButton />
      {showSurvey && <SurveyModal onSubmit={submit} onDismiss={dismiss} />}
    </div>
  );
}
