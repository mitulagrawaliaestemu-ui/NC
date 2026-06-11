/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ResumePreview from '../components/ResumePreview';
import { Plus, Trash2, Save, Edit3, Eye, CheckCircle, AlertCircle } from 'lucide-react';

const BuildResume = () => {
  const { user, updateResume } = useAuth();
  
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  // Resume states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    bio: ''
  });
  
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [languages, setLanguages] = useState([]);
  const [langInput, setLangInput] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [certInput, setCertInput] = useState('');

  // Load user data on mount
  useEffect(() => {
    if (user && user.resume) {
      const res = user.resume;
      setPersonalInfo({
        fullName: res.personalInfo?.fullName || user.name || '',
        email: res.personalInfo?.email || user.email || '',
        phone: res.personalInfo?.phone || '',
        college: res.personalInfo?.college || '',
        bio: res.personalInfo?.bio || ''
      });
      setEducation(res.education || []);
      setExperience(res.experience || []);
      setProjects(res.projects || []);
      setSkills(res.skills || []);
      setLanguages(res.languages || []);
      setCertifications(res.certifications || []);
    }
  }, [user]);

  // Actions for Education
  const addEducation = () => {
    setEducation([...education, { degree: '', school: '', startYear: '', endYear: '', gpa: '' }]);
  };
  
  const handleEduChange = (idx, field, val) => {
    const updated = [...education];
    updated[idx][field] = val;
    setEducation(updated);
  };
  
  const removeEducation = (idx) => {
    setEducation(education.filter((_, i) => i !== idx));
  };

  // Actions for Experience
  const addExperience = () => {
    setExperience([...experience, { role: '', company: '', location: '', startDate: '', endDate: '', description: '' }]);
  };

  const handleExpChange = (idx, field, val) => {
    const updated = [...experience];
    updated[idx][field] = val;
    setExperience(updated);
  };

  const removeExperience = (idx) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };

  // Actions for Projects
  const addProject = () => {
    setProjects([...projects, { title: '', description: '', link: '' }]);
  };

  const handleProjChange = (idx, field, val) => {
    const updated = [...projects];
    updated[idx][field] = val;
    setProjects(updated);
  };

  const removeProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  // Tag Adders
  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (tag) => {
    setSkills(skills.filter(s => s !== tag));
  };

  const addLanguage = (e) => {
    e.preventDefault();
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      setLanguages([...languages, langInput.trim()]);
      setLangInput('');
    }
  };

  const removeLanguage = (tag) => {
    setLanguages(languages.filter(l => l !== tag));
  };

  const addCertification = (e) => {
    e.preventDefault();
    if (certInput.trim() && !certifications.includes(certInput.trim())) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput('');
    }
  };

  const removeCertification = (tag) => {
    setCertifications(certifications.filter(c => c !== tag));
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });

    const resumeData = {
      personalInfo,
      education,
      experience,
      projects,
      skills,
      languages,
      certifications
    };

    const result = await updateResume(resumeData);
    setSaving(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Resume profile saved and updated successfully!' });
      window.scrollTo(0, 0);
    } else {
      setStatus({ type: 'error', message: result.message || 'Failed to save resume profile' });
    }
  };

  const assembledResume = {
    personalInfo: { ...personalInfo, lc: user?.lc },
    education,
    experience,
    projects,
    skills,
    languages,
    certifications
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Resume Builder</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create a professional resume to apply for global opportunities</p>
        </div>
        <button 
          onClick={handleSave} 
          className="btn btn-primary" 
          disabled={saving}
          style={{ height: 'fit-content' }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Status Alert */}
      {status.message && (
        <div style={status.type === 'success' ? styles.successAlert : styles.errorAlert}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('edit')} 
          style={activeTab === 'edit' ? styles.activeTabBtn : styles.tabBtn}
        >
          <Edit3 size={16} />
          Edit Resume Details
        </button>
        <button 
          onClick={() => setActiveTab('preview')} 
          style={activeTab === 'preview' ? styles.activeTabBtn : styles.tabBtn}
        >
          <Eye size={16} />
          Visual Preview
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div style={styles.formGrid}>
          {/* Main Edit Column */}
          <div style={styles.formColumn}>
            {/* Personal Info */}
            <div className="glass-card" style={styles.cardSection}>
              <h3 style={styles.cardTitle}>Personal Information</h3>
              <div style={styles.inputGrid}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={personalInfo.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={personalInfo.phone}
                    placeholder="+91 XXXXX XXXXX"
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">College/University</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={personalInfo.college}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, college: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brief Bio</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  value={personalInfo.bio}
                  placeholder="Describe your fields of interest and aspirations..."
                  onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                ></textarea>
              </div>
            </div>

            {/* Education */}
            <div className="glass-card" style={styles.cardSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={styles.cardTitle}>Education History</h3>
                <button onClick={addEducation} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Add Education
                </button>
              </div>
              
              {education.length === 0 ? (
                <p style={styles.emptyText}>No education items added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {education.map((edu, idx) => (
                    <div key={idx} style={styles.repeaterCard}>
                      <div style={styles.repeaterHeader}>
                        <span>Education #{idx + 1}</span>
                        <button onClick={() => removeEducation(idx)} style={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={styles.inputGrid}>
                        <div className="form-group">
                          <label className="form-label">Degree / Field of Study</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={edu.degree} 
                            placeholder="e.g. B.Tech Computer Science"
                            onChange={(e) => handleEduChange(idx, 'degree', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">School / University</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={edu.school} 
                            placeholder="e.g. Manipal University"
                            onChange={(e) => handleEduChange(idx, 'school', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Start Year</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={edu.startYear} 
                            placeholder="e.g. 2022"
                            onChange={(e) => handleEduChange(idx, 'startYear', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Year (or Expected)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={edu.endYear} 
                            placeholder="e.g. 2026"
                            onChange={(e) => handleEduChange(idx, 'endYear', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">GPA / Percentage</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={edu.gpa} 
                            placeholder="e.g. 9.1/10"
                            onChange={(e) => handleEduChange(idx, 'gpa', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="glass-card" style={styles.cardSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={styles.cardTitle}>Professional Experience</h3>
                <button onClick={addExperience} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Add Experience
                </button>
              </div>

              {experience.length === 0 ? (
                <p style={styles.emptyText}>No work experiences added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {experience.map((exp, idx) => (
                    <div key={idx} style={styles.repeaterCard}>
                      <div style={styles.repeaterHeader}>
                        <span>Experience #{idx + 1}</span>
                        <button onClick={() => removeExperience(idx)} style={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={styles.inputGrid}>
                        <div className="form-group">
                          <label className="form-label">Role / Job Title</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={exp.role} 
                            placeholder="e.g. Software Engineer Intern"
                            onChange={(e) => handleExpChange(idx, 'role', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Company Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={exp.company} 
                            placeholder="e.g. TechCorp"
                            onChange={(e) => handleExpChange(idx, 'company', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Location</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={exp.location} 
                            placeholder="e.g. Bangalore"
                            onChange={(e) => handleExpChange(idx, 'location', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Start Date</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={exp.startDate} 
                            placeholder="e.g. June 2025"
                            onChange={(e) => handleExpChange(idx, 'startDate', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Date (or Present)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={exp.endDate} 
                            placeholder="e.g. August 2025"
                            onChange={(e) => handleExpChange(idx, 'endDate', e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description of duties & impact</label>
                        <textarea 
                          className="form-textarea" 
                          rows="3" 
                          value={exp.description} 
                          placeholder="Describe your responsibilities, technologies used, and key accomplishments..."
                          onChange={(e) => handleExpChange(idx, 'description', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="glass-card" style={styles.cardSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={styles.cardTitle}>Academic & Side Projects</h3>
                <button onClick={addProject} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Add Project
                </button>
              </div>

              {projects.length === 0 ? (
                <p style={styles.emptyText}>No projects added yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {projects.map((proj, idx) => (
                    <div key={idx} style={styles.repeaterCard}>
                      <div style={styles.repeaterHeader}>
                        <span>Project #{idx + 1}</span>
                        <button onClick={() => removeProject(idx)} style={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={styles.inputGrid}>
                        <div className="form-group">
                          <label className="form-label">Project Title</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={proj.title} 
                            placeholder="e.g. E-Commerce Backend API"
                            onChange={(e) => handleProjChange(idx, 'title', e.target.value)} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Project Link (e.g. GitHub)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={proj.link} 
                            placeholder="e.g. https://github.com/username/project"
                            onChange={(e) => handleProjChange(idx, 'link', e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Project Description</label>
                        <textarea 
                          className="form-textarea" 
                          rows="3" 
                          value={proj.description} 
                          placeholder="What did you build? What tools did you use?"
                          onChange={(e) => handleProjChange(idx, 'description', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column (Skills, Languages, Certs) */}
          <div style={styles.sidebarColumn}>
            {/* Skills */}
            <div className="glass-card" style={styles.cardSection}>
              <h3 style={styles.cardTitle}>Skills</h3>
              <form onSubmit={addSkill} style={styles.tagForm}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. React.js"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }}>
                  <Plus size={16} />
                </button>
              </form>
              <div style={styles.tagCloud}>
                {skills.map((skill, idx) => (
                  <span key={idx} style={styles.tagBadge}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} style={styles.tagRemoveBtn}>×</button>
                  </span>
                ))}
                {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added.</span>}
              </div>
            </div>

            {/* Languages */}
            <div className="glass-card" style={styles.cardSection}>
              <h3 style={styles.cardTitle}>Languages</h3>
              <form onSubmit={addLanguage} style={styles.tagForm}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. English"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }}>
                  <Plus size={16} />
                </button>
              </form>
              <div style={styles.tagCloud}>
                {languages.map((lang, idx) => (
                  <span key={idx} style={styles.tagBadge}>
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} style={styles.tagRemoveBtn}>×</button>
                  </span>
                ))}
                {languages.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No languages added.</span>}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass-card" style={styles.cardSection}>
              <h3 style={styles.cardTitle}>Certifications</h3>
              <form onSubmit={addCertification} style={styles.tagForm}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. AWS Cloud Practitioner"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }}>
                  <Plus size={16} />
                </button>
              </form>
              <div style={styles.tagCloud}>
                {certifications.map((cert, idx) => (
                  <span key={idx} style={styles.tagBadge}>
                    {cert}
                    <button type="button" onClick={() => removeCertification(cert)} style={styles.tagRemoveBtn}>×</button>
                  </span>
                ))}
                {certifications.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No certifications added.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: '50px' }}>
          <ResumePreview resume={assembledResume} />
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
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '30px',
    gap: '16px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'var(--transition-fast)',
  },
  activeTabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid var(--primary)',
    color: '#fff',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'var(--transition-fast)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    alignItems: 'flex-start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sidebarColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  cardSection: {
    padding: '24px',
    transition: 'none', // Disable floating on builder form cards
  },
  cardTitle: {
    fontSize: '1.2rem',
    marginBottom: '16px',
    color: '#fff',
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  repeaterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
  },
  repeaterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    }
  },
  tagForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  tagCloud: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    lineHeight: '1',
    cursor: 'pointer',
    '&:hover': {
      color: 'var(--danger)',
    }
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '20px 0',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    padding: '16px',
    marginBottom: '24px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '16px',
    marginBottom: '24px',
  }
};

export default BuildResume;
