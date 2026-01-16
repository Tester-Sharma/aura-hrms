import React from 'react'
import ReactDOM from 'react-dom/client'
import WorkerApp from './WorkerApp.jsx'
import HRApp from './HRApp.jsx'
import './index.css'

// Check if we are running on the HR portal port
const isHRPort = window.location.port === '5174';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isHRPort ? <HRApp /> : <WorkerApp />}
    </React.StrictMode>,
)
