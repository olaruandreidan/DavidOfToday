import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { UpdatePrompt } from './components/UpdatePrompt'
import { getApiKey } from './domain/storage'
import { useGameState } from './state/GameStateContext'
import { DashboardScreen } from './screens/DashboardScreen'
import { DailyScreen } from './screens/DailyScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { BaselineResultsScreen, DailyResultsScreen } from './screens/ResultsScreens'
import { SettingsScreen } from './screens/SettingsScreen'
import { SetupScreen } from './screens/SetupScreen'

function RequireKey() {
  return getApiKey() ? <Layout /> : <Navigate to="/setup" replace />
}

function RequireBaseline({ children }: { children: React.ReactNode }) {
  const { state } = useGameState()
  return state.baseline ? children : <Navigate to="/onboarding" replace />
}

function Home() {
  const { state } = useGameState()
  if (!getApiKey()) return <Navigate to="/setup" replace />
  return <Navigate to={state.baseline ? '/dashboard' : '/onboarding'} replace />
}

export function App() {
  return <><UpdatePrompt /><Routes>
    <Route path="/setup" element={<SetupScreen />} />
    <Route element={<RequireKey />}>
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/baseline" element={<RequireBaseline><BaselineResultsScreen /></RequireBaseline>} />
      <Route path="/dashboard" element={<RequireBaseline><DashboardScreen /></RequireBaseline>} />
      <Route path="/daily" element={<RequireBaseline><DailyScreen /></RequireBaseline>} />
      <Route path="/daily-result" element={<RequireBaseline><DailyResultsScreen /></RequireBaseline>} />
      <Route path="/history" element={<HistoryScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
    </Route>
    <Route path="*" element={<Home />} />
  </Routes></>
}
