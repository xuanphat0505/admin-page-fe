import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import AuthContext from "../../context/AuthProvider";
import { FiCheckCircle } from "react-icons/fi";
import "./LoginSuccess.scss";

function LoginSuccess() {
  const navigate = useNavigate();
  const { auth, logout, hydrated } = useContext(AuthContext);
  const user = auth?.user;

  // Nếu chưa "hydrated" hoặc chưa có user, chuyển hướng về /login
  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate("/login", { replace: true });
  }, [hydrated, user, navigate]);

  // Chưa "hydrated" hoặc chưa có user thì không render gì
  if (!hydrated || !user) return null;

  return (
    // Form đăng nhập thành công
    <div className="success-container">
      <div className="success-card">
        <div className="success-header">
          <FiCheckCircle size={40} className="success-icon" />
          <h2>Đăng nhập thành công</h2>
          <p>Chào mừng bạn trở lại!</p>
        </div>

        <div className="user-info">
          <div className="row"><span className="label">Họ tên</span><span className="value">{user.name || '—'}</span></div>
          <div className="row"><span className="label">Username</span><span className="value">{user.username}</span></div>
          <div className="row"><span className="label">Email</span><span className="value">{user.email}</span></div>
        </div>

        <div className="actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-primary">Vào dashboard</button>
          <button onClick={() => navigate("/news")} className="btn btn-outline">Xem tin tức</button>
          <button
            onClick={async () => { await logout(); navigate("/login", { replace: true }) }}
            className="btn btn-danger"
          >Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}

export default LoginSuccess;
