import React, { useEffect, useState, useRef, useContext } from 'react'
import './LoginForm.scss'
import { MdLockOutline } from 'react-icons/md'
import { FaRegUserCircle } from 'react-icons/fa'
import AuthContext from '../../context/AuthProvider'
import axios from '../../api'
import { Link, useNavigate } from 'react-router-dom'

const LOGIN_URL = '/api/v1/auth'

const LoginForm = () => {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  const userRef = useRef()
  const errRef = useRef()

  const [user, setUser] = useState('')         // username
  const [pwd, setPwd] = useState('')           // password
  const [errMsg, setErrMsg] = useState('')     // error message

  useEffect(() => { userRef.current?.focus() }, [])
  useEffect(() => { setErrMsg('') }, [user, pwd])

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrMsg('')
    try {
      // Gửi request đăng nhập
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ user, pwd }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          skipAuthRedirect: true,
        },
      ) // withCredentials: true để gửi cookie (nếu có)

      // Lấy thông tin user từ response
      const userInfo = response?.data?.data?.user
      login({ user: userInfo })
      setUser('')
      setPwd('')
      navigate('/login-success', { replace: true })
    } catch (err) {
      // Xử lý lỗi
      const apiMsg = err?.response?.data?.message
      if (apiMsg)
        setErrMsg(apiMsg)
      else if (!err?.response)
        setErrMsg('Không có phản hồi từ máy chủ')
      else if (err.response?.status === 400)
        setErrMsg('Thiếu tên đăng nhập hoặc mật khẩu')
      else if (err.response?.status === 401)
        setErrMsg('Không được phép')
      else
        setErrMsg('Đăng nhập thất bại')
      errRef.current?.focus()
    }
  }

  return (
    // Form đăng nhập
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Đăng nhập</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>
          <div className={`input-group${errMsg && (errMsg.includes('Thiếu') || errMsg.includes('Không được')) ? ' input-error' : ''}`}>
            <span className="icon"><FaRegUserCircle /></span>
            <input
              type="text"
              id="username"
              ref={userRef}
              autoComplete="username"
              onChange={(e) => setUser(e.target.value)}
              value={user}
              placeholder="Tên đăng nhập"
              required
            />
          </div>
          <div className="input-group">
            <span className="icon"><MdLockOutline /></span>
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={(e) => setPwd(e.target.value)}
              value={pwd}
              placeholder="Mật khẩu"
              required
            />
          </div>

          <button className="login-btn" type="submit">Đăng nhập</button>
        </form>
        <div className="login-footer">
          <span>Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link></span>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
