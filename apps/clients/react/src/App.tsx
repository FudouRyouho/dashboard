import { AppShell } from '@mantine/core';
import { Header } from './shell/header/Header';
import { MainBody } from './shell/MainBody';

function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppShell header={{ height: 40 }} padding="sm" style={{ flex: 1, minHeight: 0 }}>
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        <AppShell.Main>
          <MainBody />
        </AppShell.Main>
      </AppShell>
    </div>
  );
}

export default App;