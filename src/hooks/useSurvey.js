import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';
import { getLastSurveyAt, submitSurvey } from '../services/surveyService.js';

const SURVEY_INTERVAL_DAYS = 3;

export function useSurvey() {
  const { user } = useAuth();
  const [showSurvey, setShowSurvey] = useState(false);
  const [dismissed,  setDismissed]  = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;

    (async () => {
      try {
        const lastAt = await getLastSurveyAt(user.id);
        if (!lastAt) {
          // Never taken — show after 1 minute delay (first session)
          setTimeout(() => setShowSurvey(true), 60_000);
          return;
        }
        const daysSince = (Date.now() - new Date(lastAt).getTime()) / 86_400_000;
        if (daysSince >= SURVEY_INTERVAL_DAYS) {
          setTimeout(() => setShowSurvey(true), 5_000);
        }
      } catch { /* ignore */ }
    })();
  }, [user, dismissed]);

  const submit = async (score, comment) => {
    await submitSurvey({ score, comment });
    setShowSurvey(false);
    setDismissed(true);
  };

  const dismiss = () => {
    setShowSurvey(false);
    setDismissed(true);
  };

  return { showSurvey, submit, dismiss };
}
