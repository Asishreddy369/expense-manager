import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ExpenseList from './pages/ExpenseList'
import PeopleList from './pages/PeopleList'
import PersonDetail from './pages/PersonDetail'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/people" element={<PeopleList />} />
            <Route path="/people/:id" element={<PersonDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
