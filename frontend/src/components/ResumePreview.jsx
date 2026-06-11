import { Mail, Phone, MapPin, Award, Star, Globe as LinkIcon, BookOpen, Briefcase } from 'lucide-react';

const ResumePreview = ({ resume }) => {
  if (!resume) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No resume details available.</div>;
  }

  const { personalInfo = {}, education = [], experience = [], projects = [], skills = [], languages = [], certifications = [] } = resume;

  return (
    <div className="resume-sheet" style={styles.sheet}>
      {/* Resume Header */}
      <div style={styles.header}>
        <h2 style={styles.fullName}>{personalInfo.fullName || 'Full Name'}</h2>
        {personalInfo.bio && <p style={styles.bio}>{personalInfo.bio}</p>}
        
        <div style={styles.contactGrid}>
          {personalInfo.email && (
            <div style={styles.contactItem}>
              <Mail size={14} color="var(--primary)" />
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div style={styles.contactItem}>
              <Phone size={14} color="var(--primary)" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.college && (
            <div style={styles.contactItem}>
              <MapPin size={14} color="var(--primary)" />
              <span>{personalInfo.college} (LC {personalInfo.lc || 'N/A'})</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.bodyGrid}>
        {/* Main Column: Education, Experience, Projects */}
        <div style={styles.mainColumn}>
          {/* Education */}
          {education.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <BookOpen size={18} color="var(--primary)" />
                Education
              </h3>
              <div style={styles.timeline}>
                {education.map((edu, idx) => (
                  <div key={idx} style={styles.timelineItem}>
                    <div style={styles.timelineMarker}></div>
                    <div style={styles.timelineContent}>
                      <div style={styles.itemHeader}>
                        <h4 style={styles.itemTitle}>{edu.degree}</h4>
                        <span style={styles.itemDate}>{edu.startYear} - {edu.endYear}</span>
                      </div>
                      <p style={styles.itemSubtitle}>{edu.school}</p>
                      {edu.gpa && <span style={styles.gpaBadge}>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <Briefcase size={18} color="var(--primary)" />
                Work Experience
              </h3>
              <div style={styles.timeline}>
                {experience.map((exp, idx) => (
                  <div key={idx} style={styles.timelineItem}>
                    <div style={styles.timelineMarker}></div>
                    <div style={styles.timelineContent}>
                      <div style={styles.itemHeader}>
                        <h4 style={styles.itemTitle}>{exp.role}</h4>
                        <span style={styles.itemDate}>{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <p style={styles.itemSubtitle}>{exp.company} | {exp.location}</p>
                      {exp.description && <p style={styles.itemDesc}>{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <Award size={18} color="var(--primary)" />
                Projects
              </h3>
              <div style={styles.projectList}>
                {projects.map((proj, idx) => (
                  <div key={idx} style={styles.projectCard}>
                    <div style={styles.itemHeader}>
                      <h4 style={styles.itemTitle}>{proj.title}</h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" style={styles.projectLink}>
                          <LinkIcon size={14} /> Link
                        </a>
                      )}
                    </div>
                    {proj.description && <p style={styles.projectDesc}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column: Skills, Languages, Certifications */}
        <div style={styles.sidebarColumn}>
          {/* Skills */}
          {skills.length > 0 && (
            <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarSectionTitle}>Skills</h3>
              <div style={styles.skillsContainer}>
                {skills.map((skill, idx) => (
                  <span key={idx} style={styles.skillTag}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarSectionTitle}>Languages</h3>
              <div style={styles.languageList}>
                {languages.map((lang, idx) => (
                  <span key={idx} style={styles.langTag}>{lang}</span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarSectionTitle}>Certifications</h3>
              <div style={styles.certList}>
                {certifications.map((cert, idx) => (
                  <div key={idx} style={styles.certItem}>
                    <Star size={12} color="var(--secondary)" />
                    <span style={styles.certText}>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  sheet: {
    background: '#131926',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    color: '#e2e8f0',
    maxWidth: '850px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '24px',
    marginBottom: '24px',
  },
  fullName: {
    fontSize: '2.4rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  bio: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '16px',
    maxWidth: '600px',
  },
  contactGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  bodyGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  sidebarColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    paddingLeft: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    color: '#fff',
    borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
    paddingBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeline: {
    borderLeft: '2px solid rgba(255, 255, 255, 0.06)',
    paddingLeft: '16px',
    marginLeft: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  timelineItem: {
    position: 'relative',
  },
  timelineMarker: {
    position: 'absolute',
    left: '-23px',
    top: '6px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    border: '2px solid #131926',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  itemTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#f8fafc',
  },
  itemDate: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: '0.92rem',
    color: 'var(--primary)',
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginTop: '6px',
  },
  gpaBadge: {
    display: 'inline-block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--accent)',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
    width: 'fit-content',
    marginTop: '4px',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  projectLink: {
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  projectDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sidebarSectionTitle: {
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '0.9rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '4px',
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  skillTag: {
    fontSize: '0.8rem',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    color: '#fff',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '500',
  },
  languageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  langTag: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  certList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  certItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  certText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  }
};

export default ResumePreview;
