import { useEffect, useState } from 'react';
import { Layout, type Tab } from './components/Layout';
import { CalendarView } from './components/calendar/CalendarView';
import { ChoreList } from './components/chores/ChoreList';
import { MemberList } from './components/members/MemberList';
import { HistoryLog } from './components/history/HistoryLog';
import { useDarkMode } from './hooks/useDarkMode';
import { useStore } from './store';
import { AppLoader } from './components/shared/AppLoader';
import { ErrorBanner } from './components/shared/ErrorBanner';

function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const { dark, toggle } = useDarkMode();
  const { isLoading, error, initialize } = useStore();

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <AppLoader />;

  return (
    <Layout activeTab={tab} onTabChange={setTab} dark={dark} onToggleDark={toggle}>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => useStore.setState({ error: null })}
        />
      )}
      {tab === 'calendar' && <CalendarView />}
      {tab === 'chores' && <ChoreList />}
      {tab === 'members' && <MemberList />}
      {tab === 'history' && <HistoryLog />}
    </Layout>
  );
}

export default App;
