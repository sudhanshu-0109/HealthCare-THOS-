/**
 * App.jsx — Root application component.
 * Wraps AppRouter in ErrorBoundary.
 */

import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
