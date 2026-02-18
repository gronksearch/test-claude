import { useState } from 'react';
import { Layout, type Tab } from './components/Layout';
import { CalendarView } from './components/calendar/CalendarView';
import { ChoreList } from './components/chores/ChoreList';
import { MemberList } from './components/members/MemberList';
import { HistoryLog } from './components/history/HistoryLog';

function App() {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === 'calendar' && <CalendarView />}
      {tab === 'chores' && <ChoreList />}
      {tab === 'members' && <MemberList />}
      {tab === 'history' && <HistoryLog />}
    </Layout>
  );
}

export default App;
