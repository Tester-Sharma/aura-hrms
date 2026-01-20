import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, MapPin, Phone, Mail, Globe, Hash, Loader2, CheckCircle } from 'lucide-react';
import mockService from '../../services/mockService';

const HRCompanyProfile = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        logo: '' // Base64
    });

    useEffect(() => {
        fetchCompanyDetails();
    }, []);

    const fetchCompanyDetails = async () => {
        try {
            const data = await mockService.getCompanyDetails();
            if (data && data.id) {
                setFormData({
                    name: data.name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    taxId: data.taxId || '',
                    logo: data.logo || ''
                });
            }
        } catch (error) {
            console.error("Failed to fetch company details", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMsg('');
        try {
            await mockService.saveCompanyDetails(formData);
            setSuccessMsg('Company details updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert("Failed to save details");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)', height: '100vh', overflowY: 'auto' }}>
            <header style={{ padding: '40px', background: 'linear-gradient(135deg, #44337a 0%, #1e1b4b 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Company Master</h1>
                    <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '4px' }}>Manage organization identity and formal details.</p>
                </div>
            </header>

            <main style={{ flex: 1, padding: '40px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', borderRadius: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                    
                    <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
                        
                        {/* Header Section with Logo */}
                        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <div style={{ 
                                    width: '100%', height: '100%', borderRadius: '24px', 
                                    background: formData.logo ? `url(${formData.logo}) center/cover no-repeat` : '#f1f5f9',
                                    border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {!formData.logo && <Upload size={32} color="#94a3b8" />}
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                                <div style={{ marginTop: '8px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>Change Logo</div>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>Organization Identity</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Company Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input 
                                                type="text" 
                                                name="name"
                                                value={formData.name} 
                                                onChange={handleInputChange}
                                                placeholder="e.g. Acme Corp"
                                                style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Tax / Government ID</label>
                                        <div style={{ position: 'relative' }}>
                                            <Hash size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                            <input 
                                                type="text" 
                                                name="taxId"
                                                value={formData.taxId} 
                                                onChange={handleInputChange}
                                                placeholder="GSTIN / VAT / PAN"
                                                style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '32px 0' }} />

                        {/* Contact Details */}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>Contact Information</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Official Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email} 
                                        onChange={handleInputChange}
                                        placeholder="contact@company.com"
                                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone} 
                                        onChange={handleInputChange}
                                        placeholder="+91 0000 0000"
                                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Registered Address</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                                <textarea 
                                    name="address"
                                    value={formData.address} 
                                    onChange={handleInputChange}
                                    placeholder="Full street address..."
                                    rows={3}
                                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '40px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>Website</label>
                            <div style={{ position: 'relative' }}>
                                <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input 
                                    type="url" 
                                    name="website"
                                    value={formData.website} 
                                    onChange={handleInputChange}
                                    placeholder="https://www.company.com"
                                    style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                            {successMsg && (
                                <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                    <CheckCircle size={18} />
                                    <span>{successMsg}</span>
                                </div>
                            )}
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                style={{ 
                                    background: 'var(--primary)', color: 'white', padding: '14px 32px', borderRadius: '14px', border: 'none', 
                                    fontWeight: 800, fontSize: '1rem', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: isSaving ? 0.8 : 1
                                }}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default HRCompanyProfile;
