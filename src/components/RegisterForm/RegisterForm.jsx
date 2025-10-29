import React, { useEffect, useRef, useState } from 'react'
import { MdOutlineMail, MdLockOutline } from 'react-icons/md'
import { FaRegUserCircle } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../../api'
import { toast } from 'react-toastify'

import './RegisterForm.scss'

const REGISTER_URL = '/auth/register'
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
      setErrMsg('Vui lòng nh?p d?y d? thông tin.')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      setErrMsg('Email không h?p l?.')
      return false
    }
    if (trimmedName.length > 64) {
      setErrMsg('H? tên không du?c vu?t quá 64 ký t?.')
      return false
    }
    if (pwd.length < 6) {
      setErrMsg('M?t kh?u ph?i có ít nh?t 6 ký t?.')
      return false
    }
    if (pwd !== confirmPwd) {
      setErrMsg('M?t kh?u nh?p l?i không kh?p.')
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
      toast.success('Ðang ký thành công', { toastId: TOAST_ID_SUCCESS })
      setTimeout(() => navigate('/login'), 600)
    } catch (err) {
      const apiMsg = err?.response?.data?.message
      if (apiMsg) toast.error(apiMsg, { toastId: TOAST_ID_ERROR })
      else if (!err?.response)
        toast.error('Không có ph?n h?i t? máy ch?', { toastId: TOAST_ID_ERROR })
      else if (err.response?.status === 409)
        toast.error('Email dã t?n t?i', { toastId: TOAST_ID_ERROR })
      else if (err.response?.status === 400)
        toast.error('Thi?u thông tin ho?c d? li?u không h?p l?', { toastId: TOAST_ID_ERROR })
      else
        toast.error('Ðang ký th?t b?i', { toastId: TOAST_ID_ERROR })
      errRef.current?.focus()
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Ðang ký</h2>
        <form className="login-form" noValidate onSubmit={handleSubmit}>
          <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>

          <div className="input-group">
            <span className="icon"><FaRegUserCircle /></span>
            <input type="text" id="username" ref={usernameRef} autoComplete="username"
                   onChange={(e) => setUsername(e.target.value)} value={username}
                   placeholder="Tên dang nh?p" required />
          </div>

          <div className="input-group">
            <span className="icon"><FaRegUserCircle /></span>
            <input type="text" id="fullName" autoComplete="name"
                   onChange={(e) => setFullName(e.target.value)} value={fullName}
                   placeholder="H? tên" required />
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
                   placeholder="M?t kh?u" required />
          </div>

          <div className="input-group">
            <span className="icon"><MdLockOutline /></span>
            <input type="password" id="confirmPassword" autoComplete="new-password"
                   onChange={(e) => setConfirmPwd(e.target.value)} value={confirmPwd}
                   placeholder="Nh?p l?i m?t kh?u" required />
          </div>

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ðang dang ký...' : 'Ðang ký'}
          </button>
        </form>
        <div className="login-footer">
          <span>Ðã có tài kho?n? <Link to="/login">Ðang nh?p</Link></span>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
