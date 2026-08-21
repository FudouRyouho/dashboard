import { AppShell } from '@mantine/core';
import { Header } from './shell/header/Header';
import { MainBody } from './shell/MainBody';

function App() {
  return (
    <AppShell padding="sm" header={{ height: 40 }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <MainBody />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
