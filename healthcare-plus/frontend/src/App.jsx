/**
 * App.jsx — Root application component.
 * Wraps AppRouter in ErrorBoundary.
 */

import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthBootstrap from './components/auth/AuthBootstrap';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthBootstrap>
          <AppRouter />
        </AuthBootstrap>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
