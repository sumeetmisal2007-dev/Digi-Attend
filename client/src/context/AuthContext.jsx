import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const mockUsers = {
  student: {
    id: 1,
    name: 'Aarav Mehta',
    email: 'aarav@campus.edu',
    role: 'student',
    rollNumber: 'TU4F2526035',
    department: 'Information Technology',
    year: 2,
    semester: 3,
  },
  faculty: {
    id: 2,
    name: 'Dr. Nisha Rao',
    email: 'nisha.rao@campus.edu',
    role: 'faculty',
    department: 'Information Technology',
  },
  hod: {
    id: 3,
    name: 'Prof. Vikram Shah',
    email: 'vikram.shah@campus.edu',
    role: 'hod',
    department: 'Information Technology',
  },
  admin: {
    id: 4,
    name: 'Admin User',
    email: 'admin@campus.edu',
    role: 'admin',
    department: 'Information Technology',
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (role) => setUser(mockUsers[role])
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
