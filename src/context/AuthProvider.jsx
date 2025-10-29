import { createContext, useEffect, useRef, useState } from "react";
import api from "../api";


const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    // Trạng thái đăng nhập hiện tại và cờ “đã khôi phục từ storage”
    const [auth, setAuth] = useState({});
    const [hydrated, setHydrated] = useState(false) // true khi đã đọc xong localStorage

    
    const logoutTimerRef = useRef(null)
    const activityBoundRef = useRef(false)

    // Cấu hình timeout: tự đăng xuất sau 10 phút không hoạt động
    const INACTIVITY_MS = 10 * 60 * 1000 // 10 phút không hoạt động => auto logout

    // Giới hạn tần suất làm mới (tránh cập nhật quá dày)
    const lastRefreshRef = useRef(0)
    const MIN_REFRESH_INTERVAL_MS = 60 * 1000 

    // Hủy timer đăng xuất nếu đang chạy
    const clearLogoutTimer = () => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current)
            logoutTimerRef.current = null
        }
    }

    // Tự đăng xuất tại thời điểm hết hạn
    const scheduleAutoLogout = (expiresAt) => {
        clearLogoutTimer()
        const ms = expiresAt - Date.now()
        if (ms > 0) {
            logoutTimerRef.current = setTimeout(() => {
                logout()
            }, ms)
        }
    }

    // Lưu trạng thái đăng nhập vào localStorage => khôi phục sau khi reload
    const persist = (next) => {
        try { localStorage.setItem('authState', JSON.stringify(next)) } catch {}
    }

    // Ghi nhận tương tác người dùng và gia hạn phiên đăng nhập
    // (tối thiểu 1 phút/lần để tránh cập nhật quá dày)
    const refreshActivity = () => {
        const now = Date.now()
        if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) return
        lastRefreshRef.current = now
        // Nếu đã đăng nhập thì gia hạn phiên
        setAuth(prev => {
            if (!prev?.user) return prev
            const expiresAt = Date.now() + INACTIVITY_MS
            const next = { ...prev, expiresAt } 
            persist(next)
            scheduleAutoLogout(expiresAt)
            return next
        })
    }

    // Các sự kiện người dùng được coi là hoạt động
    const activityEvents = ['mousemove', 
        'mousedown', 
        'keydown', 
        'touchstart', 
        'wheel', 
        'scroll']

    // Gắn listeners để theo dõi hoạt động và tab quay lại trạng thái visible
    const bindActivityListeners = () => {
        if (activityBoundRef.current) return
        const handler = () => refreshActivity()
        activityEvents.forEach(ev => window.addEventListener(
            ev, handler, { passive: true }))
        // Khi tab quay lại trạng thái visible thì cũng coi là hoạt động
        const visHandler = () => { 
            if (document.visibilityState === 'visible') 
                refreshActivity() 
        }
        document.addEventListener('visibilitychange', visHandler)
        activityBoundRef.current = { handler, visHandler } 
        
    }

    // Tháo listeners khi đăng xuất/cleanup
    const unbindActivityListeners = () => {
        if (!activityBoundRef.current) return
        const { handler, visHandler } = activityBoundRef.current
        activityEvents.forEach(ev => window.removeEventListener(ev, handler))
        document.removeEventListener('visibilitychange', visHandler)
        activityBoundRef.current = false
        
    }

    // Thiết lập phiên đăng nhập, lưu storage và bắt đầu theo dõi không hoạt động
    const login = (data, inactivityMs = INACTIVITY_MS) => {
        const expiresAt = Date.now() + inactivityMs
        const next = { ...data, expiresAt }
        setAuth(next)
        persist(next)
        scheduleAutoLogout(expiresAt)
        const username = data?.user?.username || data?.user?.email || 'unknown'
        bindActivityListeners()
    }

    // Đăng xuất: gọi API server, hủy timer, tháo listeners, xóa state và storage
    const logout = async () => {
        clearLogoutTimer()
        unbindActivityListeners()
        try {
            await api.post('/api/v1/auth/logout', null, { skipAuthRedirect: true })
        } catch {}
        setAuth({})
        try { localStorage.removeItem('authState') } catch {}
        lastRefreshRef.current = 0
    }

    // Khi component mount, khôi phục trạng thái đăng nhập từ localStorage (nếu còn hiệu lực)
    useEffect(() => {
        try {
            const raw = localStorage.getItem('authState')
            if (raw) {
                const saved = JSON.parse(raw)
                if (saved?.expiresAt && saved.expiresAt > Date.now()) {
                    // Khôi phục phiên còn hiệu lực
                    setAuth(saved)
                    scheduleAutoLogout(saved.expiresAt)
                    bindActivityListeners()
                } else {
                    // Hết hạn thì dọn dẹp storage
                    localStorage.removeItem('authState')
                }
            }
        } catch {}
        finally { setHydrated(true) } // báo cho UI biết đã đọc xong storage

        // Đồng bộ đăng nhập/đăng xuất giữa các tab qua sự kiện storage
        const onStorage = (e) => {
            if (e.key === 'authState') {
                try {
                    const saved = e.newValue ? JSON.parse(e.newValue) : null
                    if (!saved) {
                        // Xóa phiên đăng nhập
                        logout()
                    } else if (saved?.expiresAt && saved.expiresAt > Date.now()) {
                        setAuth(saved)
                        scheduleAutoLogout(saved.expiresAt)
                    }
                } catch {}
            }
        }
        window.addEventListener('storage', onStorage)
        // Cleanup khi component unmount
        return () => { clearLogoutTimer(); window.removeEventListener('storage', onStorage); unbindActivityListeners() }
    }, [])

    return (
        
        <AuthContext.Provider value={{ auth, setAuth, login, logout, hydrated }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;
