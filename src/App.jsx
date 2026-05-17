import React from 'react'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/layout/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Layout />
      </AppProvider>
    </ErrorBoundary>
  )
}
