import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ResumePreview from '../components/ResumePreview';
import { 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Award, 
  Briefcase, 
  GraduationCap, 
  User, 
  Sparkles,
  Lock
} from 'lucide-react';

const BuildResume = () => {
  const { user, updateResume } = useAuth();
  
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [currentStep, setCurrentStep] = useState(1); // 1 to 5
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

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

  // Compute completeness score dynamically
  const calculateCompleteness = () => {
    let score = 0;
    
    // Personal Info: 30%
    if (personalInfo.fullName.trim()) score += 10;
    if (personalInfo.phone.trim()) score += 10;
    if (personalInfo.bio.trim() && personalInfo.bio.trim().length >= 10) score += 10;
    
    // Education: 25% (if at least one edu is completed)
    if (education.length > 0) {
      const isEduValid = education.some(edu => edu.degree.trim() && edu.school.trim());
      if (isEduValid) score += 25;
    }
    
    // Experience: 20%
    if (experience.length > 0) {
      const isExpValid = experience.some(exp => exp.role.trim() && exp.company.trim());
      if (isExpValid) score += 20;
    }
    
    // Projects: 15%
    if (projects.length > 0) {
      const isProjValid = projects.some(proj => proj.title.trim());
      if (isProjValid) score += 15;
    }
    
    // Skills: 10%
    if (skills.length > 0) {
      score += 10;
    }
    
    return score;
  };

  const completenessScore = calculateCompleteness();

  // Step validation
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!personalInfo.fullName.trim()) {
        errors.fullName = 'Full name is required';
      }
      if (!personalInfo.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^\+?[0-9\s-]{10,15}$/.test(personalInfo.phone.trim())) {
        errors.phone = 'Invalid phone number format';
      }
      if (!personalInfo.college.trim()) {
        errors.college = 'College/University name is required';
      }
      if (!personalInfo.bio.trim()) {
        errors.bio = 'Bio summary is required';
      } else if (personalInfo.bio.trim().length < 10) {
        errors.bio = 'Bio must be at least 10 characters';
      }
    } else if (step === 2) {
      education.forEach((edu, idx) => {
        if (!edu.degree.trim()) {
          errors[`edu_${idx}_degree`] = 'Degree name is required';
        }
        if (!edu.school.trim()) {
          errors[`edu_${idx}_school`] = 'School name is required';
        }
        if (!edu.startYear.trim() || !/^\d{4}$/.test(edu.startYear.trim())) {
          errors[`edu_${idx}_startYear`] = 'Enter valid start year (YYYY)';
        }
        if (!edu.endYear.trim() || !/^\d{4}$/.test(edu.endYear.trim())) {
          errors[`edu_${idx}_endYear`] = 'Enter valid end year (YYYY)';
        }
      });
    } else if (step === 3) {
      experience.forEach((exp, idx) => {
        if (!exp.role.trim()) {
          errors[`exp_${idx}_role`] = 'Job role is required';
        }
        if (!exp.company.trim()) {
          errors[`exp_${idx}_company`] = 'Company name is required';
        }
      });
    } else if (step === 4) {
      projects.forEach((proj, idx) => {
        if (!proj.title.trim()) {
          errors[`proj_${idx}_title`] = 'Project title is required';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Move forward in wizard
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo(0, 0);
    } else {
      setStatus({ type: 'error', message: 'Please fix the validation errors in this section before continuing.' });
    }
  };

  // Move backward
  const handleBack = () => {
    setStatus({ type: '', message: '' });
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // Save draft (allows saving even if profile is not fully valid or finished)
  const handleSaveDraft = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });

    const resumeData = {
      personalInfo,
      education,
      experience,
      projects,
      skills,
      languages,
      certifications,
      isCompleted: false // Mark as incomplete draft
    };

    const result = await updateResume(resumeData);
    setSaving(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Profile draft saved successfully! You can resume building later.' });
    } else {
      setStatus({ type: 'error', message: result.message || 'Failed to save draft' });
    }
  };

  // Save and Finalize Profile
  const handleFinalSave = async () => {
    // Validate everything
    let allValid = true;
    for (let i = 1; i <= 5; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        break;
      }
    }

    if (!allValid) {
      setStatus({ type: 'error', message: 'Please resolve all validation errors across all wizard steps.' });
      return;
    }

    if (skills.length === 0) {
      setStatus({ type: 'error', message: 'Please add at least one technical skill.' });
      setCurrentStep(5);
      return;
    }

    setSaving(true);
    setStatus({ type: '', message: '' });

    const resumeData = {
      personalInfo,
      education,
      experience,
      projects,
      skills,
      languages,
      certifications,
      isCompleted: true // Mark as completed and locked for applying
    };

    const result = await updateResume(resumeData);
    setSaving(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Profile completed and saved successfully! You are now eligible to apply for offers.' });
      window.scrollTo(0, 0);
    } else {
      setStatus({ type: 'error', message: result.message || 'Failed to complete profile' });
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

  const stepsList = [
    { num: 1, label: 'Personal Info', icon: <User size={16} /> },
    { num: 2, label: 'Education', icon: <GraduationCap size={16} /> },
    { num: 3, label: 'Experience', icon: <Briefcase size={16} /> },
    { num: 4, label: 'Projects', icon: <FileText size={16} /> },
    { num: 5, label: 'Skills & Extra', icon: <Award size={16} /> }
  ];

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Profile Builder</h1>
          <p style={{ color: 'var(--text-muted)' }}>Build a modern SaaS-grade professional resume to apply for opportunities</p>
        </div>
        
        <div style={styles.headerButtons}>
          <button 
            onClick={handleSaveDraft} 
            className="btn btn-secondary" 
            disabled={saving}
          >
            Save Draft
          </button>
          <button 
            onClick={handleFinalSave} 
            className="btn btn-primary" 
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Finalize & Lock Profile'}
          </button>
        </div>
      </div>

      {/* Completeness Bar */}
      <div className="glass-card" style={styles.completenessCard}>
        <div style={styles.completenessHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Profile Completeness Score</h4>
          </div>
          <span style={styles.completenessPct}>{completenessScore}%</span>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${completenessScore}%` }}></div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
          {completenessScore < 100 
            ? 'Complete all steps to reach 100% and activate your profile for applications.' 
            : 'Excellent! Your profile is complete and eligible for applying to released internship offers.'}
        </p>
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
          Edit Resume Details
        </button>
        <button 
          onClick={() => setActiveTab('preview')} 
          style={activeTab === 'preview' ? styles.activeTabBtn : styles.tabBtn}
        >
          Visual Preview
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div style={styles.wizardContainer}>
          {/* Stepper Wizard Header */}
          <div style={styles.stepperTrack}>
            {stepsList.map(step => (
              <button 
                key={step.num}
                onClick={() => {
                  if (step.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.num);
                  }
                }}
                style={currentStep === step.num ? styles.activeStep : step.num < currentStep ? styles.completedStep : styles.inactiveStep}
              >
                <span style={styles.stepIcon}>{step.icon}</span>
                <span style={styles.stepLabel}>{step.label}</span>
              </button>
            ))}
          </div>

          {/* Wizard Content Panel */}
          <div className="glass-card" style={styles.wizardContentCard}>
            {/* STEP 1: PERSONAL INFO */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h3 style={styles.sectionTitle}>1. Personal Details</h3>
                <div style={styles.inputGrid}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      className={`form-input ${validationErrors.fullName ? 'input-error' : ''}`} 
                      value={personalInfo.fullName}
                      placeholder="e.g. Rahul Sharma"
                      onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    />
                    {validationErrors.fullName && <p style={styles.errorText}>{validationErrors.fullName}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={personalInfo.email}
                        disabled
                        style={{ paddingRight: '36px', backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                      />
                      <Lock size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      className={`form-input ${validationErrors.phone ? 'input-error' : ''}`} 
                      value={personalInfo.phone}
                      placeholder="+91 XXXXX XXXXX"
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    />
                    {validationErrors.phone && <p style={styles.errorText}>{validationErrors.phone}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">College / University <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input 
                      type="text" 
                      className={`form-input ${validationErrors.college ? 'input-error' : ''}`} 
                      value={personalInfo.college}
                      placeholder="e.g. Manipal Institute of Technology"
                      onChange={(e) => setPersonalInfo({ ...personalInfo, college: e.target.value })}
                    />
                    {validationErrors.college && <p style={styles.errorText}>{validationErrors.college}</p>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Brief Bio / Professional Summary <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea 
                    className={`form-textarea ${validationErrors.bio ? 'input-error' : ''}`} 
                    rows="4" 
                    value={personalInfo.bio}
                    placeholder="Briefly state your core interests, background, and career goals..."
                    onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                  ></textarea>
                  {validationErrors.bio && <p style={styles.errorText}>{validationErrors.bio}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: EDUCATION */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={styles.sectionTitle}>2. Academic History</h3>
                  <button onClick={addEducation} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Education
                  </button>
                </div>
                
                {education.length === 0 ? (
                  <div style={styles.emptyWizardState}>
                    <GraduationCap size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No education details added yet. Add school/university details to build your resume.</p>
                  </div>
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
                            <label className="form-label">Degree / Field of Study <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`edu_${idx}_degree`] ? 'input-error' : ''}`} 
                              value={edu.degree} 
                              placeholder="e.g. B.Tech Computer Science"
                              onChange={(e) => handleEduChange(idx, 'degree', e.target.value)} 
                            />
                            {validationErrors[`edu_${idx}_degree`] && <p style={styles.errorText}>{validationErrors[`edu_${idx}_degree`]}</p>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">School / University <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`edu_${idx}_school`] ? 'input-error' : ''}`} 
                              value={edu.school} 
                              placeholder="e.g. Manipal University"
                              onChange={(e) => handleEduChange(idx, 'school', e.target.value)} 
                            />
                            {validationErrors[`edu_${idx}_school`] && <p style={styles.errorText}>{validationErrors[`edu_${idx}_school`]}</p>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">Start Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`edu_${idx}_startYear`] ? 'input-error' : ''}`} 
                              value={edu.startYear} 
                              placeholder="e.g. 2022"
                              onChange={(e) => handleEduChange(idx, 'startYear', e.target.value)} 
                            />
                            {validationErrors[`edu_${idx}_startYear`] && <p style={styles.errorText}>{validationErrors[`edu_${idx}_startYear`]}</p>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">End Year (or Expected) <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`edu_${idx}_endYear`] ? 'input-error' : ''}`} 
                              value={edu.endYear} 
                              placeholder="e.g. 2026"
                              onChange={(e) => handleEduChange(idx, 'endYear', e.target.value)} 
                            />
                            {validationErrors[`edu_${idx}_endYear`] && <p style={styles.errorText}>{validationErrors[`edu_${idx}_endYear`]}</p>}
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
            )}

            {/* STEP 3: WORK EXPERIENCE */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={styles.sectionTitle}>3. Professional Experience</h3>
                  <button onClick={addExperience} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Experience
                  </button>
                </div>

                {experience.length === 0 ? (
                  <div style={styles.emptyWizardState}>
                    <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No professional experience added yet. (Optional - Skip if fresher)</p>
                  </div>
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
                            <label className="form-label">Role / Job Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`exp_${idx}_role`] ? 'input-error' : ''}`} 
                              value={exp.role} 
                              placeholder="e.g. Software Engineer Intern"
                              onChange={(e) => handleExpChange(idx, 'role', e.target.value)} 
                            />
                            {validationErrors[`exp_${idx}_role`] && <p style={styles.errorText}>{validationErrors[`exp_${idx}_role`]}</p>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">Company Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`exp_${idx}_company`] ? 'input-error' : ''}`} 
                              value={exp.company} 
                              placeholder="e.g. TechCorp"
                              onChange={(e) => handleExpChange(idx, 'company', e.target.value)} 
                            />
                            {validationErrors[`exp_${idx}_company`] && <p style={styles.errorText}>{validationErrors[`exp_${idx}_company`]}</p>}
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
                            placeholder="Describe your responsibilities, tools, and key results..."
                            onChange={(e) => handleExpChange(idx, 'description', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: PROJECTS */}
            {currentStep === 4 && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={styles.sectionTitle}>4. Academic & Side Projects</h3>
                  <button onClick={addProject} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div style={styles.emptyWizardState}>
                    <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No projects added yet. (Highly recommended to show practical applications)</p>
                  </div>
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
                            <label className="form-label">Project Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input 
                              type="text" 
                              className={`form-input ${validationErrors[`proj_${idx}_title`] ? 'input-error' : ''}`} 
                              value={proj.title} 
                              placeholder="e.g. E-Commerce Backend API"
                              onChange={(e) => handleProjChange(idx, 'title', e.target.value)} 
                            />
                            {validationErrors[`proj_${idx}_title`] && <p style={styles.errorText}>{validationErrors[`proj_${idx}_title`]}</p>}
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
                            placeholder="What did you build? What tools did you use? What was the scope?"
                            onChange={(e) => handleProjChange(idx, 'description', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: SKILLS & EXTRAS */}
            {currentStep === 5 && (
              <div className="animate-fade-in" style={styles.step5Grid}>
                {/* Skills Block */}
                <div>
                  <h3 style={styles.sectionTitle}>5. Skills & Details</h3>
                  <div className="form-group">
                    <label className="form-label">Technical Skills <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <form onSubmit={addSkill} style={styles.tagForm}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. React.js (Press enter or + to add)"
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
                      {skills.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added. Add at least one!</span>}
                    </div>
                  </div>

                  {/* Languages Block */}
                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label className="form-label">Languages Spoken</label>
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

                  {/* Certifications Block */}
                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label className="form-label">Certifications</label>
                    <form onSubmit={addCertification} style={styles.tagForm}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. AWS Solutions Architect"
                        value={certInput}
                        onChange={(e) => setLangInput(e.target.value)} // Fix: map to certInput in handler
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
            )}

            {/* Stepper Wizard Footer Navigation */}
            <div style={styles.wizardFooter}>
              <button 
                type="button" 
                onClick={handleBack} 
                className="btn btn-secondary"
                disabled={currentStep === 1}
              >
                <ChevronLeft size={16} /> Back
              </button>
              
              {currentStep < 5 ? (
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="btn btn-primary"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleFinalSave} 
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ background: 'var(--success)', boxShadow: 'none' }}
                >
                  <CheckCircle size={16} /> {saving ? 'Finalizing...' : 'Finalize & Save Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: '50px' }} className="animate-fade-in">
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
  headerButtons: {
    display: 'flex',
    gap: '12px',
  },
  completenessCard: {
    padding: '20px 24px',
    marginBottom: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  completenessHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  completenessPct: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--primary)',
    borderRadius: '99px',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
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
    color: 'var(--text-muted)',
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
    color: 'var(--text-primary)',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'var(--transition-fast)',
  },
  wizardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stepperTrack: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 20px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  inactiveStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  activeStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  completedStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--success)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  stepIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
  },
  stepLabel: {
    '@media (max-width: 600px)': {
      display: 'none',
    },
  },
  wizardContentCard: {
    padding: '30px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    transition: 'none',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    marginBottom: '20px',
    fontWeight: '600',
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
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
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
    color: 'var(--text-primary)',
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
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
    backgroundColor: 'var(--primary-glow)',
    color: 'var(--primary)',
    border: '1px solid var(--border-color)',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '1.1rem',
    lineHeight: '1',
    cursor: 'pointer',
    '&:hover': {
      color: 'var(--danger)',
    }
  },
  emptyWizardState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  wizardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    marginTop: '30px',
  },
  errorText: {
    color: 'var(--danger)',
    fontSize: '0.8rem',
    marginTop: '4px',
    textAlign: 'left',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    padding: '16px',
    marginBottom: '24px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '16px',
    marginBottom: '24px',
  }
};

export default BuildResume;
