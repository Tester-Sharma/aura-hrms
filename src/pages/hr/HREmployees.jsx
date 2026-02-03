import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit2, ShieldAlert, BadgeCheck, Download, Plus, SearchCheck, X, Check, Calculator, FileText } from 'lucide-react';
import mockService from '../../services/mockService';

const HREmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [editEmployee, setEditEmployee] = useState(null);

    // Add Form State
    const [addFormStep, setAddFormStep] = useState(1);
    const [newEmployee, setNewEmployee] = useState({
        name: '', email: '', phone: '', address: '', photo: '',
        type: 'Worker', department: 'Production', designation: 'Assembly Specialist',
        shift: '09:00 AM - 05:00 PM',
        salaryType: 'Hourly', // Hourly or Monthly
        baseRate: '', // Hourly Rate or CTC
        
        // Application Form Fields
        positionAppliedFor: '',
        educationInstitution: '',
        educationDegree: '',
        educationYearCompleted: '',
        previousCompany: '',
        previousPosition: '',
        previousEmploymentDates: '',
        skillsQualifications: '',
        referenceName: '',
        referenceRelationship: '',
        referencePhone: '',
        applicantSignature: ''
    });
    
    // Salary Calculation State
    const [salaryBreakdown, setSalaryBreakdown] = useState(null);
    const [salaryOptions, setSalaryOptions] = useState({
        includeHra: true,
        includePf: true,
        includePt: true
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const data = await mockService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-Calculate Salary Breakdown
    useEffect(() => {
        if (!newEmployee.baseRate) {
            setSalaryBreakdown(null);
            return;
        }

        const rate = parseFloat(newEmployee.baseRate);
        if (isNaN(rate)) return;

        if (newEmployee.type === 'Worker') {
            setSalaryBreakdown({
                hourlyRate: rate,
                dailyEstimate: rate * 8,
                monthlyEstimate: rate * 8 * 26
            });
        } else {
            // Employee Logic (CTC based)
            const annualCTC = rate;
            const monthlyCTC = annualCTC / 12;
            
            // Standard Indian Payroll Structure (Simplified)
            // Basic is usually 40-50% of CTC. Let's say 50%
            const basic = monthlyCTC * 0.5;
            const hra = salaryOptions.includeHra ? (basic * 0.5) : 0; // HRA is 50% of Basic
            
            // Allowances fill the gap
            // Gross = Basic + HRA + Allowances
            // Let's assume Gross is close to Monthly CTC for simplicity, minus employer contribs if deep detail needed.
            // For prototype: Gross = Monthly CTC.
            
            const specialAllowance = monthlyCTC - basic - hra;
            
            // Deductions
            const pf = salaryOptions.includePf ? (basic * 0.12) : 0;
            const pt = salaryOptions.includePt ? 200 : 0;
            
            const totalDeductions = pf + pt;
            const netPayable = monthlyCTC - totalDeductions;

            setSalaryBreakdown({
                annualCTC,
                monthlyCTC,
                basic,
                hra,
                specialAllowance,
                pf,
                pt,
                netPayable
            });
        }
    }, [newEmployee.baseRate, newEmployee.type, salaryOptions]);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewEmployee(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegister = async () => {
        try {
            const payload = { 
                ...newEmployee, 
                baseRate: parseFloat(newEmployee.baseRate),
                salaryBreakdown: JSON.stringify(salaryBreakdown), // Store as string for flexibility
                photo: newEmployee.photo
            };
            
            await mockService.registerEmployee(payload);
            
            setShowAddModal(false);
            fetchEmployees();
            setAddFormStep(1);
            setNewEmployee({ 
                name: '', email: '', phone: '', address: '', photo: '', type: 'Worker', department: 'Production', designation: '', shift: '09:00 AM - 05:00 PM', salaryType: 'Hourly', baseRate: '',
                positionAppliedFor: '', educationInstitution: '', educationDegree: '', educationYearCompleted: '',
                previousCompany: '', previousPosition: '', previousEmploymentDates: '',
                skillsQualifications: '', referenceName: '', referenceRelationship: '', referencePhone: '', applicantSignature: ''
            });
            alert('Employee registered successfully!');
        } catch (error) {
            console.error('Registration failed:', error);
            alert(`Failed to register: ${error.message || 'Unknown error'}`);
        }
    };

    const handleApplicationForm = async (userId) => {
        try {
            await mockService.downloadApplicationForm(userId);
        } catch (error) {
            alert("Failed to download application form");
        }
    };

    const handleEditEmployee = (employee) => {
        setEditEmployee({
            ...employee,
            baseRate: employee.role === 'worker' ? employee.hourlyRate : employee.ctc,
            esicNumber: employee.esicNumber || '',
            epfoNumber: employee.epfoNumber || '',
            esicEnabled: employee.esicEnabled || false,
            epfoEnabled: employee.epfoEnabled !== undefined ? employee.epfoEnabled : true,
            advanceAmount: employee.advanceAmount || 0,
            loanAmount: employee.loanAmount || 0,
            tdsEnabled: employee.tdsEnabled || false
        });
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async () => {
        try {
            await mockService.updateEmployee(editEmployee);
            setShowEditModal(false);
            fetchEmployees();
            alert('Employee updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            alert(`Failed to update: ${error.message || 'Unknown error'}`);
        }
    };

    const handleViewDetails = async (id) => {
        // Implementation for view details could go here
        // For now, simple console log or alert
        console.log("View details for", id);
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="employees-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>Employee Master</h1>
                    <p>Orchestrating professional growth and resource allocation.</p>
                </div>
                <div className="header-actions">
                    <div className="search-barrier">
                        <Search size={18} color="#94a3b8" />
                        <input 
                            type="text" 
                            placeholder="Search professionals..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="add-employee-btn" onClick={() => setShowAddModal(true)} title="Add New Employee">
                        <Plus size={18} />
                        <span>Add Employee</span>
                    </button>
                </div>
            </header>

            <main className="employees-content">
                <div className="content-wrapper">
                    
                    {/* Controls Row if needed, currently in header */}

                    <div className="table-wrapper glass">
                        <table className="aura-table">
                            <thead>
                                <tr>
                                    <th>Professional</th>
                                    <th>Identity</th>
                                    <th>Department</th>
                                    <th>Designation</th>
                                    <th>Classification</th>
                                    <th>Compensation</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="fadeIn">
                                            <td>
                                                <div className="prof-cell">
                                                    <div className="prof-avatar" style={emp.photo ? { background: `url(${emp.photo}) center/cover` } : {}}>
                                                        {!emp.photo && (emp.name?.[0] || 'U')}
                                                    </div>
                                                    <div className="prof-info">
                                                        <span className="prof-name">{emp.name}</span>
                                                        <span className="prof-email">{emp.email || 'user@aura.inc'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="id-chip">#{emp.id}</span></td>
                                            <td><span className="dept-label">{emp.department || 'N/A'}</span></td>
                                            <td><span className="desig-label">{emp.designation || 'N/A'}</span></td>
                                            <td>
                                            <span className={`class-tag ${emp.role || 'employee'}`}>
                                                    {emp.role === 'worker' ? <ShieldAlert size={12} /> : <BadgeCheck size={12} />}
                                                    {emp.role === 'worker' ? 'Worker' : emp.role === 'hr' ? 'HR' : 'Employee'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pay-cell">
                                                    <span className="pay-amount">
                                                        ₹{emp.role === 'worker' 
                                                            ? (emp.hourlyRate || 0).toLocaleString() 
                                                            : (emp.monthlySalary || (emp.ctc ? emp.ctc / 12 : 0)).toLocaleString()}
                                                    </span>
                                                    <span className="pay-freq">{emp.role === 'worker' ? '/hr' : '/mo'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-cluster" style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="icon-btn" onClick={() => handleEditEmployee(emp)} title="Edit Employee">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleApplicationForm(emp.id)} title="Download App Form">
                                                        <FileText size={16} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleViewDetails(emp.id)} title="View Details">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="text-center p-4">No results found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content large fadeIn">
                        <div className="modal-header">
                            <h2>Add New Employee</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="step-indicator">
                            <span className={`step ${addFormStep >= 1 ? 'active' : ''}`}>1. Identity</span>
                            <div className="step-line" />
                            <span className={`step ${addFormStep >= 2 ? 'active' : ''}`}>2. Position</span>
                            <div className="step-line" />
                            <span className={`step ${addFormStep >= 3 ? 'active' : ''}`}>3. Payroll</span>
                            <div className="step-line" />
                            <span className={`step ${addFormStep >= 4 ? 'active' : ''}`}>4. Application</span>
                        </div>

                        <div className="modal-body">
                            {addFormStep === 1 && (
                                <div className="form-grid">
                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: newEmployee.photo ? `url(${newEmployee.photo}) center/cover` : '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {!newEmployee.photo && <Users size={24} color="#94a3b8" />}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>Employee Photo</label>
                                            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ border: 'none', padding: 0 }} />
                                        </div>
                                    </div>
                                    <input placeholder="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                                    <input placeholder="Email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                                    <input placeholder="Phone" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
                                    <textarea placeholder="Address" value={newEmployee.address} onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })} />
                                </div>
                            )}

                            {addFormStep === 2 && (
                                <div className="form-grid">
                                    <select value={newEmployee.type} onChange={e => setNewEmployee({ ...newEmployee, type: e.target.value })}>
                                        <option value="Worker">Worker (Hourly)</option>
                                        <option value="Employee">Employee (Salaried)</option>
                                    </select>
                                    <input placeholder="Department" value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} />
                                    <input placeholder="Designation" value={newEmployee.designation} onChange={e => setNewEmployee({ ...newEmployee, designation: e.target.value })} />
                                    <input placeholder="Shift (e.g., 09:00 AM - 05:00 PM)" value={newEmployee.shift} onChange={e => setNewEmployee({ ...newEmployee, shift: e.target.value })} />
                                </div>
                            )}
                            {addFormStep === 3 && (
                                <div className="salary-calculator">
                                    <div className="input-group">
                                        <label>{newEmployee.type === 'Worker' ? 'Hourly Rate (₹)' : 'Annual CTC (₹)'}</label>
                                        <input
                                            type="number"
                                            value={newEmployee.baseRate}
                                            onChange={e => setNewEmployee({ ...newEmployee, baseRate: e.target.value })}
                                            placeholder="Enter amount"
                                        />
                                    </div>

                                    {newEmployee.type === 'Employee' && (
                                        <div className="calc-options">
                                            <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={salaryOptions.includeHra} onChange={e => setSalaryOptions({ ...salaryOptions, includeHra: e.target.checked })} /> Include HRA (50% Basic)</label>
                                            <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={salaryOptions.includePf} onChange={e => setSalaryOptions({ ...salaryOptions, includePf: e.target.checked })} /> PF Deduction</label>
                                            <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={salaryOptions.includePt} onChange={e => setSalaryOptions({ ...salaryOptions, includePt: e.target.checked })} /> Professional Tax</label>
                                        </div>
                                    )}

                                    {salaryBreakdown && (
                                        <div className="breakdown-preview">
                                            <h4>Estimated Breakdown</h4>
                                            {newEmployee.type === 'Worker' ? (
                                                <div className="row"><span>Hourly Rate:</span> <b>₹{salaryBreakdown.hourlyRate}</b></div>
                                            ) : (
                                                <>
                                                    <div className="row"><span>Monthly Gross:</span> <span>₹{Math.round(salaryBreakdown.monthlyCTC).toLocaleString()}</span></div>
                                                    <div className="row"><span>Basic:</span> <span>₹{Math.round(salaryBreakdown.basic).toLocaleString()}</span></div>
                                                    <div className="row"><span>HRA:</span> <span>₹{Math.round(salaryBreakdown.hra).toLocaleString()}</span></div>
                                                    <div className="row deduction"><span>PF:</span> <span>-₹{Math.round(salaryBreakdown.pf).toLocaleString()}</span></div>
                                                    <div className="row total"><span>Net Payable:</span> <b>₹{Math.round(salaryBreakdown.netPayable).toLocaleString()}</b></div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {addFormStep === 4 && (
                                <div className="form-grid">
                                    <div style={{ gridColumn: 'span 2' }}><h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Application Form Details</h3></div>
                                    <input placeholder="Position Applied For" value={newEmployee.positionAppliedFor} onChange={e => setNewEmployee({ ...newEmployee, positionAppliedFor: e.target.value })} />
                                    <input placeholder="Education Institution" value={newEmployee.educationInstitution} onChange={e => setNewEmployee({ ...newEmployee, educationInstitution: e.target.value })} />
                                    <input placeholder="Degree/Certification" value={newEmployee.educationDegree} onChange={e => setNewEmployee({ ...newEmployee, educationDegree: e.target.value })} />
                                    <input placeholder="Year Completed" value={newEmployee.educationYearCompleted} onChange={e => setNewEmployee({ ...newEmployee, educationYearCompleted: e.target.value })} />
                                    <input placeholder="Previous Company" value={newEmployee.previousCompany} onChange={e => setNewEmployee({ ...newEmployee, previousCompany: e.target.value })} />
                                    <input placeholder="Previous Position" value={newEmployee.previousPosition} onChange={e => setNewEmployee({ ...newEmployee, previousPosition: e.target.value })} />
                                    <input placeholder="Employment Dates (e.g., Jan 2020 - Dec 2022)" value={newEmployee.previousEmploymentDates} onChange={e => setNewEmployee({ ...newEmployee, previousEmploymentDates: e.target.value })} />
                                    <textarea placeholder="Skills & Qualifications" value={newEmployee.skillsQualifications} onChange={e => setNewEmployee({ ...newEmployee, skillsQualifications: e.target.value })} style={{ gridColumn: 'span 2', minHeight: '80px' }} />
                                    <input placeholder="Reference Name" value={newEmployee.referenceName} onChange={e => setNewEmployee({ ...newEmployee, referenceName: e.target.value })} />
                                    <input placeholder="Reference Relationship" value={newEmployee.referenceRelationship} onChange={e => setNewEmployee({ ...newEmployee, referenceRelationship: e.target.value })} />
                                    <input placeholder="Reference Phone" value={newEmployee.referencePhone} onChange={e => setNewEmployee({ ...newEmployee, referencePhone: e.target.value })} />
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-sec" disabled={addFormStep === 1} onClick={() => setAddFormStep(p => p - 1)}>Back</button>
                            {addFormStep < 4 ? (
                                <button className="btn-pri" onClick={() => setAddFormStep(p => p + 1)}>Next</button>
                            ) : (
                                <button className="btn-pri" onClick={handleRegister}>Register Employee</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && editEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content large fadeIn">
                        <div className="modal-header">
                            <h2>Edit Employee - {editEmployee.name}</h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div className="form-grid">
                                <div style={{ gridColumn: 'span 2' }}><h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Basic Information</h3></div>
                                <input placeholder="Full Name" value={editEmployee.name} onChange={e => setEditEmployee({ ...editEmployee, name: e.target.value })} />
                                <input placeholder="Email" value={editEmployee.email || ''} onChange={e => setEditEmployee({ ...editEmployee, email: e.target.value })} />
                                <input placeholder="Phone" value={editEmployee.phone || ''} onChange={e => setEditEmployee({ ...editEmployee, phone: e.target.value })} />
                                <input placeholder="Department" value={editEmployee.department || ''} onChange={e => setEditEmployee({ ...editEmployee, department: e.target.value })} />
                                <input placeholder="Designation" value={editEmployee.designation || ''} onChange={e => setEditEmployee({ ...editEmployee, designation: e.target.value })} />
                                <input placeholder="Shift" value={editEmployee.shift || ''} onChange={e => setEditEmployee({ ...editEmployee, shift: e.target.value })} />
                                <textarea placeholder="Address" value={editEmployee.address || ''} onChange={e => setEditEmployee({ ...editEmployee, address: e.target.value })} />
                                
                                <div style={{ gridColumn: 'span 2', marginTop: '20px' }}><h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Salary Information</h3></div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>{editEmployee.role === 'worker' ? 'Hourly Rate (₹)' : 'Annual CTC (₹)'}</label>
                                    <input type="number" value={editEmployee.baseRate || ''} onChange={e => setEditEmployee({ ...editEmployee, baseRate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>Monthly Salary (₹)</label>
                                    <input type="number" value={editEmployee.monthlySalary || ''} onChange={e => setEditEmployee({ ...editEmployee, monthlySalary: e.target.value })} />
                                </div>
                                
                                <div style={{ gridColumn: 'span 2', marginTop: '20px' }}><h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Financial Details (ESIC, EPFO, Loans, TDS)</h3></div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>ESIC Number</label>
                                    <input placeholder="ESIC Number" value={editEmployee.esicNumber || ''} onChange={e => setEditEmployee({ ...editEmployee, esicNumber: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                    <input type="checkbox" checked={editEmployee.esicEnabled} onChange={e => setEditEmployee({ ...editEmployee, esicEnabled: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <label style={{ fontWeight: 700, color: '#64748b' }}>ESIC Enabled</label>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>EPFO/UAN Number</label>
                                    <input placeholder="EPFO Number" value={editEmployee.epfoNumber || ''} onChange={e => setEditEmployee({ ...editEmployee, epfoNumber: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                    <input type="checkbox" checked={editEmployee.epfoEnabled} onChange={e => setEditEmployee({ ...editEmployee, epfoEnabled: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <label style={{ fontWeight: 700, color: '#64748b' }}>EPFO Enabled</label>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>Advance Amount (₹)</label>
                                    <input type="number" placeholder="0" value={editEmployee.advanceAmount || 0} onChange={e => setEditEmployee({ ...editEmployee, advanceAmount: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: '#64748b' }}>Loan Amount (₹)</label>
                                    <input type="number" placeholder="0" value={editEmployee.loanAmount || 0} onChange={e => setEditEmployee({ ...editEmployee, loanAmount: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                    <input type="checkbox" checked={editEmployee.tdsEnabled} onChange={e => setEditEmployee({ ...editEmployee, tdsEnabled: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                    <label style={{ fontWeight: 700, color: '#64748b' }}>TDS Deduction Enabled</label>
                                </div>
                                
                                <div style={{ gridColumn: 'span 2', marginTop: '20px' }}><h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>Application Form Details</h3></div>
                                <input placeholder="Position Applied For" value={editEmployee.positionAppliedFor || ''} onChange={e => setEditEmployee({ ...editEmployee, positionAppliedFor: e.target.value })} />
                                <input placeholder="Education Institution" value={editEmployee.educationInstitution || ''} onChange={e => setEditEmployee({ ...editEmployee, educationInstitution: e.target.value })} />
                                <input placeholder="Degree/Certification" value={editEmployee.educationDegree || ''} onChange={e => setEditEmployee({ ...editEmployee, educationDegree: e.target.value })} />
                                <input placeholder="Year Completed" value={editEmployee.educationYearCompleted || ''} onChange={e => setEditEmployee({ ...editEmployee, educationYearCompleted: e.target.value })} />
                                <input placeholder="Previous Company" value={editEmployee.previousCompany || ''} onChange={e => setEditEmployee({ ...editEmployee, previousCompany: e.target.value })} />
                                <input placeholder="Previous Position" value={editEmployee.previousPosition || ''} onChange={e => setEditEmployee({ ...editEmployee, previousPosition: e.target.value })} />
                                <input placeholder="Employment Dates" value={editEmployee.previousEmploymentDates || ''} onChange={e => setEditEmployee({ ...editEmployee, previousEmploymentDates: e.target.value })} />
                                <textarea placeholder="Skills & Qualifications" value={editEmployee.skillsQualifications || ''} onChange={e => setEditEmployee({ ...editEmployee, skillsQualifications: e.target.value })} style={{ gridColumn: 'span 2', minHeight: '80px' }} />
                                <input placeholder="Reference Name" value={editEmployee.referenceName || ''} onChange={e => setEditEmployee({ ...editEmployee, referenceName: e.target.value })} />
                                <input placeholder="Reference Relationship" value={editEmployee.referenceRelationship || ''} onChange={e => setEditEmployee({ ...editEmployee, referenceRelationship: e.target.value })} />
                                <input placeholder="Reference Phone" value={editEmployee.referencePhone || ''} onChange={e => setEditEmployee({ ...editEmployee, referencePhone: e.target.value })} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-sec" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="btn-pri" onClick={handleUpdateEmployee}>Update Employee</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .employees-container { flex: 1; display: flex; flex-direction: column; background-color: var(--background); }
                .hr-page-header { padding: 40px; background: linear-gradient(135deg, var(--primary-dark) 0%, #312e81 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-md); }
                .header-content h1 { font-size: 2.5rem; font-weight: 800; }
                .header-actions { display: flex; gap: 16px; align-items: center; }
                .add-employee-btn { background: white; color: var(--primary-dark); border: none; padding: 12px 24px; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: transform 0.2s; }
                .add-employee-btn:hover { transform: scale(1.05); }
                .employees-content { flex: 1; overflow-y: auto; padding-top: 40px; }
                .content-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 40px 60px; display: flex; flex-direction: column; gap: 32px; }
                .search-barrier { background: white; padding: 0 20px; border-radius: 16px; display: flex; align-items: center; gap: 14px; border: 1px solid rgba(255,255,255,0.2); width: 300px; height: 50px; }
                .search-barrier input { border: none; height: 100%; outline: none; width: 100%; font-size: 0.95rem; font-weight: 600; color: #475569; }
                .table-wrapper { background: white; border-radius: 32px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: var(--shadow-sm); }
                .aura-table { width: 100%; border-collapse: collapse; text-align: left; }
                .aura-table th { background: #f8fafc; padding: 20px 24px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                .aura-table td { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
                .prof-cell { display: flex; align-items: center; gap: 16px; }
                .prof-avatar { width: 44px; height: 44px; background: #ede9fe; color: var(--primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
                .prof-name { font-weight: 800; color: var(--text-main); }
                .class-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
                .class-tag.worker { background: #f0fdf4; color: #166534; } .class-tag.employee { background: #eff6ff; color: #1e40af; }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
                .modal-content { background: white; border-radius: 24px; padding: 32px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
                .modal-content.large { width: 700px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; }
                .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }
                .step-indicator { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .step { font-weight: 800; color: #cbd5e1; font-size: 0.9rem; } .step.active { color: var(--primary); }
                .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 16px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-grid input, .form-grid select, .form-grid textarea { padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; outline: none; font-family: inherit; }
                .form-grid textarea { grid-column: span 2; }
                
                .salary-calculator { background: #f8fafc; padding: 24px; border-radius: 16px; }
                .calc-options { margin: 16px 0; display: flex; gap: 16px; flex-wrap: wrap; }
                .breakdown-preview { background: white; padding: 16px; border-radius: 12px; margin-top: 16px; border: 1px solid #e2e8f0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
                .row.deduction { color: #ef4444; } .row.total { font-weight: 800; font-size: 1.1rem; border-top: 1px dashed #e2e8f0; padding-top: 8px; margin-top: 8px; }
                
                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .btn-pri { background: var(--primary); color: white; padding: 12px 24px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
                .btn-sec { background: #f1f5f9; color: #64748b; padding: 12px 24px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
                
                .fadeIn { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .icon-btn { background: #f8fafc; border: none; padding: 8px; border-radius: 8px; cursor: pointer; color: #64748b; transition: all 0.2s; }
                .icon-btn:hover { background: #e2e8f0; color: var(--primary); }
            `}</style>
        </div>
    );
};

export default HREmployees;
