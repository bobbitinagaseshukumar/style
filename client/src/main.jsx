import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store, persistor } from './redux/store';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './config/firebase'; // Initialize Firebase on app startup
import './styles/index.css';

const InitialLoader = () => (
  <div className="min-h-screen w-full bg-slate-950 text-amber-400 flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-4" />
    <h1 className="text-xl font-black tracking-widest text-white uppercase">StyleVerse</h1>
    <p className="text-xs text-slate-400 mt-1">Loading Luxury Storefront...</p>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<InitialLoader />} persistor={persistor}>
          <BrowserRouter>
            <HelmetProvider>
              <App />
              <ToastContainer 
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </HelmetProvider>
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
