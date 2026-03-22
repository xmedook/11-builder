import { getPlayers, getNextMatch } from './actions';
import AuthGate from './components/AuthGate';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [players, nextMatch] = await Promise.all([
    getPlayers(),
    getNextMatch(),
  ]);

  return <AuthGate players={players} nextMatch={nextMatch} />;
}
