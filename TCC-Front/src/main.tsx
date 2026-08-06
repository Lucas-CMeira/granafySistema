import { createRoot } from 'react-dom/client'
import './index.css'
import routes from './routes/routes'
import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <RouterProvider router={routes} />
  </ToastProvider>
)
