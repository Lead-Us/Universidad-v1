import WeeklySchedule from '../components/dashboard/WeeklySchedule.jsx';
import UpcomingTasks  from '../components/dashboard/UpcomingTasks.jsx';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-content">

        <section className={styles.section}>
          <div className="section-header">
            <h1 className="section-title">Horario</h1>
          </div>
          <WeeklySchedule />
        </section>

        <hr className="divider" />

        <section className={styles.section}>
          <div className="section-header">
            <h2 className="section-title">Próximas tareas</h2>
          </div>
          <UpcomingTasks />
        </section>

      </div>
    </div>
  );
}
