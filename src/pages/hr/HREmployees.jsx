import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit2, ShieldAlert, BadgeCheck, Download, Plus, SearchCheck, X, Check, Calculator } from 'lucide-react';
import mockService from '../../services/mockService';

const HREmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // Add Form State
    const [addFormStep, setAddFormStep] = useState(1);
    const [newEmployee, setNewEmployee] = useState({
        name: '', email: '', phone: '', address: '',
        type: 'Worker', department: 'Production', designation: 'Assembly Specialist',
        shift: '09:00 AM - 05:00 PM',
        salaryType: 'Hourly', // Hourly or Monthly
        baseRate: '' // Hourly Rate or CTC
    });

    // Salary Calculator State
    const [salaryBreakdown, setSalaryBreakdown] = useState(null);
    const [salaryOptions, setSalaryOptions] = useState({
        includeHra: true, includePf: true, includePt: true
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

    const handleViewDetails = async (id) => {
        try {
            const emp = await mockService.getEmployeeDetails(id);
            setSelectedEmployee(emp);
            setShowDetailModal(true);
        } catch (error) {
            alert("Could not fetch details");
        }
    };

    const calculateSalary = () => {
        const base = parseFloat(newEmployee.baseRate);
        if (!base) return;

        if (newEmployee.type === 'Worker') {
            setSalaryBreakdown({ type: 'Worker', hourlyRate: base });
        } else {
            // Simple logic for breakdown
            // Assume Base is CTC Per Year for Employee
            const monthlyCTC = base / 12;
            const basic = monthlyCTC * 0.5;
            const hra = salaryOptions.includeHra ? basic * 0.5 : 0;
            const pf = salaryOptions.includePf ? basic * 0.12 : 0;
            const pt = salaryOptions.includePt ? 200 : 0;
            const special = monthlyCTC - basic - hra - (salaryOptions.includePf ? basic * 0.12 : 0) // Just balancing

            setSalaryBreakdown({
                type: 'Employee',
                ctc: base,
                monthlyCTC: monthlyCTC,
                basic, hra, pf, pt,
                specialAllowance: special > 0 ? special : 0,
                netPayable: monthlyCTC - pf - pt
            });
        }
    };

    // Re-calc when options change
    useEffect(() => {
        if (addFormStep === 3) calculateSalary();
    }, [salaryOptions, newEmployee.baseRate, newEmployee.type]);

    const handleRegister = async () => {
        try {
            const payload = { ...newEmployee, salaryBreakdown };
            await mockService.registerEmployee(payload);
            setShowAddModal(false);
            fetchEmployees();
            setAddFormStep(1);
            setNewEmployee({ name: '', email: '', phone: '', address: '', type: 'Worker', department: 'Production', designation: '', shift: '09:00 AM - 05:00 PM', salaryType: 'Hourly', baseRate: '' });
        } catch (error) {
            alert("Failed to register");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading && !employees.length) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="employees-container">
            <header className="hr-page-header">
                <div className="header-content">
                    <h1>Talent Pool</h1>
                    <p>Orchestrating professional growth and resource allocation.</p>
                </div>
                <div className="header-actions">
                    <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        <span>Onboard Professional</span>
                    </button>
                    <button className="export-btn">
                        <Download size={18} />
                    </button>
                </div>
            </header>

            <main className="employees-content">
                <div className="content-wrapper">
                    <div className="directory-controls">
                        <div className="search-barrier glass">
                            <Search size={20} color="#94a3b8" />
                            <input
                                type="text"
                                placeholder="Query by name, ID, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className="clear-search">×</button>}
                        </div>
                    </div>

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
                                                    <div className="prof-avatar">{emp.name[0]}</div>
                                                    <div className="prof-info">
                                                        <span className="prof-name">{emp.name}</span>
                                                        <span className="prof-email">{emp.email || 'user@aura.inc'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="id-chip">#{emp.id}</span></td>
                                            <td><span className="dept-label">{emp.department}</span></td>
                                            <td><span className="desig-label">{emp.designation}</span></td>
                                            <td>
                                                <span className={`class-tag ${emp.type.toLowerCase()}`}>
                                                    {emp.type === 'Worker' ? <ShieldAlert size={12} /> : <BadgeCheck size={12} />}
                                                    {emp.type}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pay-cell">
                                                    <span className="pay-amount">
                                                        ₹{emp.type === 'Worker' ? emp.hourlyRate : (emp.monthlySalary || emp.ctc / 12)?.toLocaleString()}
                                                    </span>
                                                    <span className="pay-freq">{emp.type === 'Worker' ? '/hr' : '/mo'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-cluster">
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

            {/* View Details Modal */}
            {showDetailModal && selectedEmployee && (
                <div className="modal-overlay">
                    <div className="modal-content large fadeIn">
                        <div className="modal-header">
                            <h2>Employee Profile</h2>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
                        </div>
                        <div className="detail-grid">
                            <div className="detail-section">
                                <h3>Personal Info</h3>
                                <div className="info-row"><label>Name:</label> <span>{selectedEmployee.name}</span></div>
                                <div className="info-row"><label>Email:</label> <span>{selectedEmployee.email}</span></div>
                                <div className="info-row"><label>Phone:</label> <span>{selectedEmployee.phone}</span></div>
                                <div className="info-row"><label>Address:</label> <span>{selectedEmployee.address}</span></div>
                            </div>
                            <div className="detail-section">
                                <h3>Job Details</h3>
                                <div className="info-row"><label>Department:</label> <span>{selectedEmployee.department}</span></div>
                                <div className="info-row"><label>Designation:</label> <span>{selectedEmployee.designation}</span></div>
                                <div className="info-row"><label>Shift:</label> <span>{selectedEmployee.shift}</span></div>
                                <div className="info-row"><label>Joining Date:</label> <span>{selectedEmployee.joiningDate}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content large fadeIn">
                        <div className="modal-header">
                            <h2>Onboard Professional</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>

                        <div className="step-indicator">
                            <div className={`step ${addFormStep >= 1 ? 'active' : ''}`}>1. Personal</div>
                            <div className="step-line"></div>
                            <div className={`step ${addFormStep >= 2 ? 'active' : ''}`}>2. Job</div>
                            <div className="step-line"></div>
                            <div className={`step ${addFormStep >= 3 ? 'active' : ''}`}>3. Salary</div>
                        </div>

                        <div className="modal-body">
                            {addFormStep === 1 && (
                                <div className="form-grid">
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
                                            <label><input type="checkbox" checked={salaryOptions.includeHra} onChange={e => setSalaryOptions({ ...salaryOptions, includeHra: e.target.checked })} /> Include HRA (50% Basic)</label>
                                            <label><input type="checkbox" checked={salaryOptions.includePf} onChange={e => setSalaryOptions({ ...salaryOptions, includePf: e.target.checked })} /> PF Deduction</label>
                                            <label><input type="checkbox" checked={salaryOptions.includePt} onChange={e => setSalaryOptions({ ...salaryOptions, includePt: e.target.checked })} /> Professional Tax</label>
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
                        </div>

                        <div className="modal-footer">
                            <button className="btn-sec" disabled={addFormStep === 1} onClick={() => setAddFormStep(p => p - 1)}>Back</button>
                            {addFormStep < 3 ? (
                                <button className="btn-pri" onClick={() => setAddFormStep(p => p + 1)}>Next</button>
                            ) : (
                                <button className="btn-pri" onClick={handleRegister}>Register Employee</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .employees-container { flex: 1; display: flex; flex-direction: column; background-color: var(--background); }
                .hr-page-header { padding: 40px; background: linear-gradient(135deg, var(--primary-dark) 0%, #312e81 100%); color: white; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-md); }
                .header-content h1 { font-size: 2.5rem; font-weight: 800; }
                .add-employee-btn { background: white; color: var(--primary-dark); border: none; padding: 12px 24px; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 10px; cursor: pointer; }
                .employees-content { flex: 1; overflow-y: auto; padding-top: 40px; }
                .content-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 40px 60px; display: flex; flex-direction: column; gap: 32px; }
                .directory-controls { display: flex; gap: 24px; }
                .search-barrier { flex: 1; background: white; padding: 0 20px; border-radius: 20px; display: flex; align-items: center; gap: 14px; border: 1px solid #f1f5f9; }
                .search-barrier input { border: none; height: 56px; outline: none; width: 100%; font-size: 1rem; }
                .table-wrapper { background: white; border-radius: 32px; overflow: hidden; border: 1px solid #f1f5f9; }
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
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                .info-row label { font-weight: 700; color: #64748b; } .info-row span { font-weight: 600; color: var(--text-main); }
                
                .step-indicator { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .step { font-weight: 800; color: #cbd5e1; } .step.active { color: var(--primary); }
                .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 16px; }
                
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-grid input, .form-grid select, .form-grid textarea { padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; width: 100%; outline: none; }
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
            `}</style>
        </div>
    );
};

export default HREmployees;
