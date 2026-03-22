import { getPlayers, getNextMatch, getCurrentPlayer } from './actions';
import CoachDashboard from './components/CoachDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import PublicDashboard from './components/PublicDashboard';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  // Check auth and roles Note: searchParams is a Promise in Next.js 15+
  const resolvedParams = await searchParams;
  const coachToken = resolvedParams?.coach;
  const isCoach = coachToken === 'secret-coach'; // Hardcoded for MVP simplicity
  
  // Fetch data concurrently
  const [players, nextMatch, currentPlayer] = await Promise.all([
    getPlayers(),
    getNextMatch(),
    getCurrentPlayer()
  ]);

  if (isCoach) {
    return (
      <CoachDashboard 
        players={players} 
        nextMatch={nextMatch} 
        coachToken={coachToken} 
      />
    );
  }

  // If not a coach and has a claimed player profile
  if (currentPlayer) {
    return (
      <PlayerDashboard 
        currentPlayer={currentPlayer} 
        nextMatch={nextMatch} 
        players={players} 
      />
    );
  }

  // Public/Visitor role
  return (
    <PublicDashboard 
      players={players} 
      nextMatch={nextMatch} 
    />
  );
}
