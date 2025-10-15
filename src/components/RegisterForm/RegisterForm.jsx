import React, { useEffect, useRef, useState } from 'react'
import { MdOutlineMail, MdLockOutline } from 'react-icons/md'
import { FaRegUserCircle } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../../api'
import { toast } from 'react-toastify'

import './RegisterForm.scss'

const REGISTER_URL = '/api/v1/auth/register'
const TOAST_ID_SUCCESS = 'register-success'
const TOAST_ID_ERROR = 'register-error'

const RegisterForm = () => {
  const navigate = useNavigate()
  const usernameRef = useRef(null)
  const errRef = useRef(null)

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { usernameRef.current?.focus() }, [])
  useEffect(() => { setErrMsg('') }, [username, fullName, email, pwd, confirmPwd])

  const validate = () => {
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()
    if (!username.trim() || !trimmedName || !normalizedEmail || !pwd.trim() || !confirmPwd.trim()) {
      setErrMsg('Vui lòng nhập đầy đủ thông tin.')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      setErrMsg('Email không hợp lệ.')
      return false
    }
    if (trimmedName.length > 64) {
      setErrMsg('Họ tên không được vượt quá 64 ký tự.')
      return false
    }
    if (pwd.length < 6) {
      setErrMsg('Mật khẩu phải có ít nhất 6 ký tự.')
      return false
    }
    if (pwd !== confirmPwd) {
      setErrMsg('Mật khẩu nhập lại không khớp.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrMsg('')
    if (!validate()) { errRef.current?.focus(); return }
    setIsSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const trimmedName = fullName.trim()
      await axios.post(
        REGISTER_URL,
        JSON.stringify({ name: trimmedName, username: username.trim(), email: normalizedEmail, password: pwd }),
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true },
      )
      toast.success('Đăng ký thành công', { toastId: TOAST_ID_SUCCESS })
      setTimeout(() => navigate('/login'), 600)
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      if (apiMsg) toast.error(apiMsg, { toastId: TOAST_ID_ERROR })
      else if (!err?.response)
        toast.error('Không có phản hồi từ máy chủ', { toastId: TOAST_ID_ERROR })
      else if (err.response?.status === 409)
        toast.error('Email đã tồn tại', { toastId: TOAST_ID_ERROR })
      else if (err.response?.status === 400)
        toast.error('Thiếu thông tin hoặc dữ liệu không hợp lệ', { toastId: TOAST_ID_ERROR })
      else
        toast.error('Đăng ký thất bại', { toastId: TOAST_ID_ERROR })
      errRef.current?.focus()
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Đăng ký</h2>
        <form className="login-form" noValidate onSubmit={handleSubmit}>
          <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>

          <div className="input-group">
            <span className="icon"><FaRegUserCircle /></span>
            <input type="text" id="username" ref={usernameRef} autoComplete="username"
                   onChange={(e) => setUsername(e.target.value)} value={username}
                   placeholder="Tên đăng nhập" required />
          </div>

          <div className="input-group">
            <span className="icon"><FaRegUserCircle /></span>
            <input type="text" id="fullName" autoComplete="name"
                   onChange={(e) => setFullName(e.target.value)} value={fullName}
                   placeholder="Họ tên" required />
          </div>

          <div className="input-group">
            <span className="icon"><MdOutlineMail /></span>
            <input type="email" id="email" autoComplete="email"
                   onChange={(e) => setEmail(e.target.value)} value={email}
                   placeholder="Email" required />
          </div>

          <div className="input-group">
            <span className="icon"><MdLockOutline /></span>
            <input type="password" id="password" autoComplete="new-password"
                   onChange={(e) => setPwd(e.target.value)} value={pwd}
                   placeholder="Mật khẩu" required />
          </div>

          <div className="input-group">
            <span className="icon"><MdLockOutline /></span>
            <input type="password" id="confirmPassword" autoComplete="new-password"
                   onChange={(e) => setConfirmPwd(e.target.value)} value={confirmPwd}
                   placeholder="Nhập lại mật khẩu" required />
          </div>

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <div className="login-footer">
          <span>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></span>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
