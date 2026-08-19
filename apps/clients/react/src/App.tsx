import { AppShell } from "@mantine/core";
import { Header } from "./shell/header/header";

function App() {

  return (
    <AppShell
      padding="sm"
      header={{ height: 40 }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>Main</AppShell.Main>
    </AppShell>
  );
}

export default App
