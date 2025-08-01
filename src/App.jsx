import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './utils/authContext'
import router from './router'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App
