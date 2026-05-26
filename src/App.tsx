import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'
import './App.css'
import { AnimatePresence, motion } from 'framer-motion'
import MainPage from './pages/MainPage'
import Grades from './pages/addGrades'
import LoginPage from './pages/LoginPage'
import CustomDegreePage from './pages/CustomDegreePage'
import ModerationPage from './pages/ModerationPage'
import { Toaster } from 'react-hot-toast'
import { inject } from '@vercel/analytics'

inject()

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <>
      <Toaster position="top-right" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.6 }}
              >
                <MainPage />
              </motion.div>
            }
          />
          <Route
            path="/addGrades"
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.8 }}
              >
                <Grades />
              </motion.div>
            }
          />
          <Route
            path="/login"
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.5 }}
              >
                <LoginPage />
              </motion.div>
            }
          />
          <Route
            path="/custom-degree"
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.6 }}
              >
                <CustomDegreePage />
              </motion.div>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.6 }}
              >
                <ModerationPage />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  )
}

export default App
