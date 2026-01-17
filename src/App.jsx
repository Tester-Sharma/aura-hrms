import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import LeaveApplication from './pages/LeaveApplication';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import HRApp from './HRApp';
import WorkerApp from './WorkerApp';

function App() {
    return (
      <Router>
        <Routes>
          {/* HR Portal Route - Loads the HR Sub-App */}
          <Route path="/hr/*" element={<HRApp />} />
          
          {/* Worker/Default Portal Route - Loads Worker Sub-App */}
          <Route path="/*" element={<WorkerApp />} />
        </Routes>
      </Router>
    );
}

export default App;
