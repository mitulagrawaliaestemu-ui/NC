/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ResumePreview from '../components/ResumePreview';
import { 
  FileText, 
  Check, 
  X, 
  ArrowLeft,
  Search,
  BookOpen,
  Download
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const ApplicationsList = () => {
  const { user, authFetch } = useAuth();
  const location = useLocation();

  // Extract optional query param ?offerId=xxx
  const queryParams = new URLSearchParams(location.search);
  const initialOfferId = queryParams.get('offerId') || '';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  // Selection/View States
  const [selectedApp, setSelectedApp] = useState(null);
  const [offerIdFilter, setOfferIdFilter] = useState(initialOfferId);
  const [offers, setOffers] = useState([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch offers to populate the filter dropdown
      const offersData = await authFetch('/api/offers');
      setOffers(offersData);

      // 2. Fetch applications
      let url = '/api/applications/all';
      if (offerIdFilter) {
        url = `/api/applications/offer/${offerIdFilter}`;
      }
      
      const appsData = await authFetch(url);
      setApplications(appsData);

      // If we had a selected application, refresh its state
      if (selectedApp) {
        const refreshed = appsData.find(a => a._id === selectedApp._id);
        if (refreshed) {
          setSelectedApp(refreshed);
        }
      }
    } catch (err) {
      console.error('Error fetching admin applications:', err);
      setError('Failed to fetch applications. Make sure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [offerIdFilter]); // Refetch when filter changes

  // Update Status
  const handleUpdateStatus = async (appId, newStatus) => {
    setStatusMsg({ type: '', text: '' });
    try {
      const result = await authFetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      // Update state
      setApplications(applications.map(app => app._id === appId ? { ...app, status: result.application.status } : app));
      
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp({ ...selectedApp, status: result.application.status });
      }

      setStatusMsg({ type: 'success', text: `Application status updated to ${newStatus}` });
    } catch (err) {
      console.error('Status update failed:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update application status' });
    }
  };

  // Helper to draw a candidate's resume on a jsPDF document page
  const renderResumeToPdfPage = (doc, app, offerCode) => {
    const resume = app.resumeSnapshot || {};
    const personalInfo = resume.personalInfo || {};
    const education = resume.education || [];
    const experience = resume.experience || [];
    const projects = resume.projects || [];
    const skills = resume.skills || [];
    const languages = resume.languages || [];
    const certifications = resume.certifications || [];

    const applicantName = app.memberId?.name || personalInfo.fullName || 'Unknown Applicant';
    const email = app.memberId?.email || personalInfo.email || 'N/A';
    const phone = personalInfo.phone || 'N/A';
    const college = personalInfo.college || 'N/A';
    const lc = app.memberId?.lc || personalInfo.lc || 'N/A';

    let y = 40;

    // Header Background Header Bar - Deep Blue (#053c5e)
    doc.setFillColor(5, 60, 94);
    doc.rect(40, y, 515, 65, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(applicantName.toUpperCase(), 55, y + 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`IAESTE India Candidate Profile  |  LC: ${lc}`, 55, y + 48);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Offer: ${offerCode}`, 430, y + 38);

    y += 85;

    // Contact Details Table
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Email ID:", 40, y);
    doc.setFont('helvetica', 'normal');
    doc.text(email, 95, y);

    doc.setFont('helvetica', 'bold');
    doc.text("Phone No:", 240, y);
    doc.setFont('helvetica', 'normal');
    doc.text(phone, 300, y);

    doc.setFont('helvetica', 'bold');
    doc.text("College:", 420, y);
    doc.setFont('helvetica', 'normal');
    const collegeText = doc.splitTextToSize(college, 90);
    doc.text(collegeText, 465, y);

    y += 35;

    // Biography Section
    if (personalInfo.bio) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 60, 94); // #053c5e
      doc.text("PROFESSIONAL SUMMARY", 40, y);
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, 555, y);
      y += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const bioLines = doc.splitTextToSize(personalInfo.bio, 515);
      doc.text(bioLines, 40, y);
      y += (bioLines.length * 12) + 20;
    }

    // Education Section
    if (education.length > 0) {
      if (y > 740) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 60, 94);
      doc.text("EDUCATION HISTORY", 40, y);
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, 555, y);
      y += 14;

      education.forEach(edu => {
        if (y > 780) { doc.addPage(); y = 40; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(edu.degree || 'Degree', 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`${edu.startYear || ''} - ${edu.endYear || ''}`, 480, y);

        y += 12;
        doc.setTextColor(51, 65, 85);
        doc.text(`${edu.school || ''} ${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`, 40, y);
        y += 18;
      });
      y += 10;
    }

    // Work Experience Section
    if (experience.length > 0) {
      if (y > 720) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 60, 94);
      doc.text("PROFESSIONAL EXPERIENCE", 40, y);
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, 555, y);
      y += 14;

      experience.forEach(exp => {
        if (y > 720) { doc.addPage(); y = 40; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.role || 'Role', 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`${exp.startDate || ''} - ${exp.endDate || ''}`, 480, y);

        y += 12;
        doc.setTextColor(5, 60, 94);
        doc.text(`${exp.company || ''} | ${exp.location || ''}`, 40, y);
        
        if (exp.description) {
          y += 12;
          doc.setTextColor(51, 65, 85);
          const descLines = doc.splitTextToSize(exp.description, 515);
          doc.text(descLines, 40, y);
          y += descLines.length * 12;
        }
        y += 16;
      });
      y += 10;
    }

    // Projects Section
    if (projects.length > 0) {
      if (y > 720) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 60, 94);
      doc.text("ACADEMIC PROJECTS", 40, y);
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, 555, y);
      y += 14;

      projects.forEach(proj => {
        if (y > 720) { doc.addPage(); y = 40; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(proj.title || 'Project Title', 40, y);
        
        if (proj.link) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(59, 130, 246);
          doc.text(proj.link, 320, y);
        }

        if (proj.description) {
          y += 12;
          doc.setTextColor(51, 65, 85);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(proj.description, 515);
          doc.text(descLines, 40, y);
          y += descLines.length * 12;
        }
        y += 16;
      });
      y += 10;
    }

    // Skills, Languages & Certifications Summary
    if (skills.length > 0 || languages.length > 0 || certifications.length > 0) {
      if (y > 700) { doc.addPage(); y = 40; }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 60, 94);
      doc.text("SKILLS & ADDITIONAL DETAILS", 40, y);
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(40, y, 555, y);
      y += 14;

      if (skills.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Technical Skills:", 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const skillsText = skills.join(', ');
        const skillsLines = doc.splitTextToSize(skillsText, 400);
        doc.text(skillsLines, 130, y);
        y += (skillsLines.length * 12) + 6;
      }

      if (languages.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Languages spoken:", 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(languages.join(', '), 145, y);
        y += 18;
      }

      if (certifications.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Certifications:", 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const certText = certifications.join(', ');
        const certLines = doc.splitTextToSize(certText, 400);
        doc.text(certLines, 130, y);
      }
    }
  };

  // Generate and Download PDF
  const downloadAllResumesPdf = () => {
    if (applications.length === 0) {
      alert('There are no candidate resumes available to download for this offer.');
      return;
    }

    const selectedOffer = offers.find(o => o._id === offerIdFilter);
    const offerCode = selectedOffer ? selectedOffer.offerCode : 'ALL_OFFERS';
    const offerTitle = selectedOffer ? selectedOffer.title : 'Collected Resumes';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    applications.forEach((app, idx) => {
      if (idx > 0) {
        doc.addPage();
      }
      renderResumeToPdfPage(doc, app, offerCode, offerTitle);
    });

    doc.save(`Resumes_${offerCode}.pdf`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="badge badge-success">Accepted</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      case 'REVIEWING':
        return <span className="badge badge-warning">Reviewing</span>;
      case 'APPLIED':
      default:
        return <span className="badge badge-specific">Applied</span>;
    }
  };

  // If viewing a single student's resume
  if (selectedApp) {
    const offer = selectedApp.offerId || {};
    const applicant = selectedApp.memberId || {};
    
    return (
      <div style={styles.container} className="animate-fade-in">
        {/* Back navigation */}
        <button onClick={() => setSelectedApp(null)} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Applications List
        </button>

        <div style={styles.resumeHeaderPanel} className="glass-card">
          <div style={styles.resumeHeaderInfo}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>APPLICANT PROFILE</span>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', margin: '2px 0' }}>{applicant.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Applied for: <strong>{offer.title}</strong> ({offer.offerCode})
              </p>
            </div>
            
            <div style={styles.statusActionPanel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Status:</span>
                {getStatusBadge(selectedApp.status)}
              </div>

              <div style={styles.actionButtonGroup}>
                {selectedApp.status === 'APPLIED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedApp._id, 'REVIEWING')} 
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    Mark Reviewing
                  </button>
                )}
                {selectedApp.status !== 'ACCEPTED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedApp._id, 'ACCEPTED')} 
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', background: 'var(--success)', boxShadow: 'none' }}
                  >
                    <Check size={14} /> Accept Candidate
                  </button>
                )}
                {selectedApp.status !== 'REJECTED' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedApp._id, 'REJECTED')} 
                    className="btn btn-danger"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    <X size={14} /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {statusMsg.text && (
            <div style={statusMsg.type === 'success' ? styles.successToast : styles.errorToast}>
              {statusMsg.text}
            </div>
          )}
        </div>

        {/* Visual Resume Sheet Render */}
        <div style={{ marginTop: '24px' }}>
          <ResumePreview resume={selectedApp.resumeSnapshot} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collected Resumes & Applications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {user.role === 'NC_ADMIN' 
              ? 'Review candidate profiles and applications across all committees'
              : `Review candidate resumes for offers released under LC ${user.lc}`}
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="glass-card" style={styles.filterCard}>
        <div style={styles.filterLayout}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <Search size={18} color="var(--text-secondary)" />
            <select 
              className="form-select"
              value={offerIdFilter}
              onChange={(e) => setOfferIdFilter(e.target.value)}
              style={{ maxWidth: '400px' }}
            >
              <option value="">Show All Applications</option>
              {offers.map(o => (
                <option key={o._id} value={o._id}>
                  {o.offerCode} - {o.title} ({o.country})
                </option>
              ))}
            </select>
          </div>
          
          {offerIdFilter && (
            <button 
              onClick={downloadAllResumesPdf} 
              className="btn btn-primary"
              title="Generate single PDF file of all applicant resumes"
            >
              <Download size={16} />
              Download All Resumes (PDF)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Loading collected applications...</p>
      ) : applications.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FileText size={32} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
          <h3>No applications received</h3>
          <p style={{ marginTop: '6px', fontSize: '0.9rem' }}>
            {offerIdFilter ? 'No candidates have applied to this specific offer yet.' : 'No student applications exist at the moment.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>LC</th>
                <th>Applied For</th>
                <th>Country</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => {
                const applicant = app.memberId || { name: 'Unknown Student', email: '', lc: '' };
                const offer = app.offerId || { title: 'Unknown Offer', offerCode: 'N/A', country: '' };
                
                return (
                  <tr key={app._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{applicant.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{applicant.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-specific">LC {applicant.lc || 'N/A'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500' }}>{offer.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{offer.offerCode}</span>
                      </div>
                    </td>
                    <td>{offer.country}</td>
                    <td>
                      {new Date(app.appliedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <BookOpen size={14} /> Review Resume
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {app.status === 'APPLIED' && (
                          <button 
                            onClick={() => handleUpdateStatus(app._id, 'REVIEWING')} 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Mark Reviewing"
                          >
                            Review
                          </button>
                        )}
                        {app.status !== 'ACCEPTED' && (
                          <button 
                            onClick={() => handleUpdateStatus(app._id, 'ACCEPTED')} 
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                            title="Accept Candidate"
                          >
                            Accept
                          </button>
                        )}
                        {app.status !== 'REJECTED' && (
                          <button 
                            onClick={() => handleUpdateStatus(app._id, 'REJECTED')} 
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            title="Reject Candidate"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  filterCard: {
    padding: '16px 24px',
    marginBottom: '24px',
    backgroundColor: 'var(--bg-secondary)',
  },
  filterLayout: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '20px',
    padding: '4px 0',
  },
  resumeHeaderPanel: {
    padding: '24px 30px',
    backgroundColor: 'var(--bg-secondary)',
    marginBottom: '20px',
  },
  resumeHeaderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  statusActionPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
    '@media (max-width: 600px)': {
      alignItems: 'flex-start',
    },
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  successToast: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    color: 'var(--success)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginTop: '16px',
  },
  errorToast: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginTop: '16px',
  }
};

export default ApplicationsList;
