/**
 * App.jsx — Root application component.
 * Wraps AppRouter in ErrorBoundary.
 */

import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthBootstrap from './components/auth/AuthBootstrap';
import AppRouter from './router/AppRouter';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const content = (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthBootstrap>
          <AppRouter />
        </AuthBootstrap>
      </ErrorBoundary>
    </BrowserRouter>
  );

  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

export default App;
