import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import Sidebar from './components/Sidebar/Sidebar';
import News from './pages/News';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LoginSuccess from './pages/LoginSuccess/LoginSuccess';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isLoginSuccessPage = location.pathname === '/login-success';
  const isAuthPage = isLoginPage || isRegisterPage || isLoginSuccessPage;

  return (
    <div className="App">
      {!isAuthPage && <Sidebar />}
      <main className={`main-content ${isAuthPage ? 'main-content--auth' : ''}`}>
        <div className={`container ${isAuthPage ? 'container--auth' : ''}`}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/login-success" element={<LoginSuccess />} />
              <Route path="/news" element={<News />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Route>
          </Routes>
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={1500} />
    </div>
  );
}

export default App;
