import { useState } from 'react';
import { Layout, type Tab } from './components/Layout';
import { CalendarView } from './components/calendar/CalendarView';
import { ChoreList } from './components/chores/ChoreList';
import { MemberList } from './components/members/MemberList';
import { HistoryLog } from './components/history/HistoryLog';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  const { dark, toggle } = useDarkMode();

  return (
    <Layout activeTab={tab} onTabChange={setTab} dark={dark} onToggleDark={toggle}>
      {tab === 'calendar' && <CalendarView />}
      {tab === 'chores' && <ChoreList />}
      {tab === 'members' && <MemberList />}
      {tab === 'history' && <HistoryLog />}
    </Layout>
  );
}

export default App;
