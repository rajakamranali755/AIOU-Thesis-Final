import { useState, lazy, Suspense } from 'react'
import LandingPage from './landing/LandingPage'
import AuthScreen from './components/AuthScreen'
import AdminConsole from './components/AdminConsole'
import * as store from './utils/scholarStore'

// Builder is code-split: only fetched once a signed-in user enters the app.
const ThesisBuilder = lazy(() => import('./components/ThesisBuilder'))

export default function App() {
  // view: 'landing' | 'auth' | 'app' | 'admin'
  const [view, setView] = useState('landing')

  const launch = () => {
    if (store.isAdmin()) setView('admin')
    else if (store.getCurrentUser()) setView('app')
    else setView('auth')
  }
  const onAuthed = () => setView(store.isAdmin() ? 'admin' : 'app')
  const signOut = () => { store.signOut(); setView('landing') }

  if (view === 'auth')  return <AuthScreen onAuthed={onAuthed} onBack={() => setView('landing')} />
  if (view === 'admin') return <AdminConsole onSignOut={signOut} />
  if (view === 'app') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">Loading the workspace…</div>}>
        <ThesisBuilder user={store.getCurrentUser()} onSignOut={signOut} />
      </Suspense>
    )
  }
  return <LandingPage onLaunch={launch} />
}
