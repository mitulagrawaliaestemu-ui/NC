/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ChevronUp
} from 'lucide-react';

const ManageMembers = () => {
  const { authFetch } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Filtering/Searching states
  const [search, setSearch] = useState('');
  const [lcFilter, setLcFilter] = useState('');
  
  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', lc: '' });

  // Bulk upload states
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [defaultLc, setDefaultLc] = useState('MUJ');
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = '/api/members';
      const params = [];
      if (lcFilter) params.push(`lc=${lcFilter}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const data = await authFetch(url);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setStatus({ type: 'error', message: 'Failed to retrieve members.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [lcFilter]); // Refetch on LC change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  // Delete Member
  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student account? This cannot be undone.')) {
      return;
    }

    try {
      await authFetch(`/api/members/${id}`, { method: 'DELETE' });
      setMembers(members.filter(m => m._id !== id));
      setStatus({ type: 'success', message: 'Member account deleted successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to delete member' });
    }
  };

  // Edit Member Setup
  const startEdit = (member) => {
    setEditingId(member._id);
    setEditForm({
      name: member.name,
      email: member.email,
      lc: member.lc
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditSubmit = async (id) => {
    try {
      const data = await authFetch(`/api/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      setMembers(members.map(m => m._id === id ? data.member : m));
      setEditingId(null);
      setStatus({ type: 'success', message: 'Member details updated successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to update member' });
    }
  };

  // Handle CSV Upload and Parse
  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus({ type: '', message: '' });
    setUploadResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/);
        
        const parsedMembers = [];
        let headers = [];
        let startIndex = 0;

        if (rows.length > 0 && rows[0].trim()) {
          const firstRowCells = rows[0].split(',').map(c => c.trim().toLowerCase());
          // Check if first row is a header
          if (firstRowCells.includes('mailid') || firstRowCells.includes('email') || firstRowCells.includes('name') || firstRowCells.includes('learnid')) {
            headers = firstRowCells;
            startIndex = 1;
          }
        }

        for (let i = startIndex; i < rows.length; i++) {
          const rowText = rows[i].trim();
          if (!rowText) continue;

          // Simple CSV line split supporting optional commas
          const cells = rowText.split(',').map(c => c.trim());

          let learnId = '';
          let email = '';
          let name = '';
          let yearsLeft = 0;
          let lc = '';

          if (headers.length > 0) {
            // Map cells according to header columns
            const mailIdx = headers.findIndex(h => h.includes('mail') || h.includes('email'));
            const nameIdx = headers.findIndex(h => h === 'name' || h.includes('fullname') || h.includes('full name'));
            const learnIdx = headers.findIndex(h => h.includes('learnid') || h.includes('learn_id') || h === 'id');
            const yearsIdx = headers.findIndex(h => h.includes('years') || h.includes('left') || h.includes('membership'));
            const lcIdx = headers.findIndex(h => h === 'lc' || h.includes('committee'));

            if (learnIdx !== -1 && cells[learnIdx]) learnId = cells[learnIdx];
            if (mailIdx !== -1 && cells[mailIdx]) email = cells[mailIdx];
            if (nameIdx !== -1 && cells[nameIdx]) name = cells[nameIdx];
            if (yearsIdx !== -1 && cells[yearsIdx]) yearsLeft = cells[yearsIdx];
            if (lcIdx !== -1 && cells[lcIdx]) lc = cells[lcIdx];
          } else {
            // Fallback order: learnid, mailid, name, years left for membership, lc
            learnId = cells[0] || '';
            email = cells[1] || '';
            name = cells[2] || '';
            yearsLeft = cells[3] || 0;
            lc = cells[4] || '';
          }

          if (email && name) {
            parsedMembers.push({
              learnId: learnId || undefined,
              email,
              name,
              yearsLeftForMembership: Number(yearsLeft) || 0,
              lc: lc || undefined
            });
          }
        }

        if (parsedMembers.length === 0) {
          throw new Error('No valid records found in the CSV. Make sure you have at least a Name and Email column.');
        }

        // Send parsed records to backend
        const response = await authFetch('/api/members/bulk-upload', {
          method: 'POST',
          body: JSON.stringify({
            members: parsedMembers,
            defaultLc
          })
        });

        setUploadResults(response);
        setStatus({ type: 'success', message: `CSV upload completed. ${response.success.length} members successfully created.` });
        
        // Refresh local student list
        fetchMembers();
      } catch (err) {
        console.error('CSV parse/upload failed:', err);
        setStatus({ type: 'error', message: err.message || 'Failed to process CSV file.' });
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Temporary password copied to clipboard!');
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Members</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View, search, edit, and bulk-import student accounts across all Local Committees</p>
        </div>
        <button 
          onClick={() => setShowBulkPanel(!showBulkPanel)} 
          className="btn btn-primary"
        >
          {showBulkPanel ? <ChevronUp size={18} /> : <Upload size={18} />}
          {showBulkPanel ? 'Hide Bulk Upload' : 'Bulk Import Students (CSV)'}
        </button>
      </div>

      {/* Alert Banner */}
      {status.message && (
        <div style={status.type === 'success' ? styles.successAlert : styles.errorAlert}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* CSV Bulk Upload Collapsible Panel */}
      {showBulkPanel && (
        <div className="glass-card animate-slide-up" style={styles.bulkPanel}>
          <div style={styles.bulkHeader}>
            <FileSpreadsheet size={24} color="var(--primary)" />
            <h3 style={{ color: 'var(--primary)' }}>Bulk Import Members via CSV</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Upload a CSV containing student records. The system will automatically register each student with a <strong>temporary password</strong>, simulate sending them a welcome email, and force them to choose a new password upon their first sign-in.
          </p>

          <div style={styles.instructionsBox}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '6px' }}>Supported CSV Format:</h4>
            <code style={styles.codeSample}>learnid, mailid, name, years left for membership, lc</code>
            <ul style={styles.bulletList}>
              <li>Headers are optional. If present, columns can be in any order (e.g. <code>learnId</code>, <code>mailId</code>, <code>name</code>).</li>
              <li><code>lc</code> is optional. If left blank, students will be registered under the default LC selected below.</li>
              <li><code>learnid</code> and <code>years left for membership</code> are optional.</li>
            </ul>
          </div>

          <div style={styles.uploadControls}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default LC (For records without an LC column)</label>
              <select 
                className="form-select"
                value={defaultLc}
                onChange={(e) => setDefaultLc(e.target.value)}
                style={{ width: '220px' }}
              >
                <option value="MU">LC MU</option>
                <option value="MUJ">LC MUJ</option>
                <option value="KU">LC KU</option>
                <option value="JECRC">LC JECRC</option>
              </select>
            </div>

            <div style={styles.fileInputWrapper}>
              <label htmlFor="csv-file-upload" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                <Upload size={16} />
                {uploading ? 'Processing CSV...' : 'Select & Upload CSV'}
              </label>
              <input 
                id="csv-file-upload"
                type="file" 
                accept=".csv"
                onChange={handleCsvChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Render generated passwords for NC Admin reference */}
          {uploadResults && (
            <div style={styles.resultsContainer} className="animate-slide-up">
              <h4 style={{ color: 'var(--primary)', marginBottom: '12px' }}>Generated Credentials:</h4>
              
              {uploadResults.success.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <span className="badge badge-success" style={{ marginBottom: '8px' }}>Created Accounts ({uploadResults.success.length})</span>
                  <div style={styles.resultsScroll}>
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Learn ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>LC</th>
                          <th>Temp Password</th>
                          <th>Copy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResults.success.map((res, idx) => (
                          <tr key={idx}>
                            <td>{res.learnId || '-'}</td>
                            <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{res.name}</td>
                            <td>{res.email}</td>
                            <td><span className="badge badge-specific">{res.lc}</span></td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: '600' }}>{res.tempPassword}</td>
                            <td>
                              <button 
                                onClick={() => copyToClipboard(res.tempPassword)}
                                style={styles.iconBtn}
                                title="Copy Temp Password"
                              >
                                <Copy size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {uploadResults.errors.length > 0 && (
                <div>
                  <span className="badge badge-danger" style={{ marginBottom: '8px' }}>Skipped Records ({uploadResults.errors.length})</span>
                  <div style={styles.resultsScroll}>
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Reason / Warning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResults.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td>{err.email}</td>
                            <td style={{ color: 'var(--danger)' }}>{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="glass-card" style={styles.controlsCard}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, email, or Learn ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <div style={styles.filterWrapper}>
          <Filter size={18} color="var(--text-secondary)" />
          <select 
            className="form-select"
            value={lcFilter}
            onChange={(e) => setLcFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Committees (LCs)</option>
            <option value="MU">LC MU</option>
            <option value="MUJ">LC MUJ</option>
            <option value="KU">LC KU</option>
            <option value="JECRC">LC JECRC</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Loading member data...</p>
      ) : members.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No members found matching the search/filter criteria.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Learn ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>LC</th>
                <th>Years Left</th>
                <th>Registered At</th>
                <th>Resume Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const isEditing = editingId === member._id;
                return (
                  <tr key={member._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {member.learnId || '-'}
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editForm.name} 
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={styles.avatar}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{member.name}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          type="email" 
                          className="form-input" 
                          value={editForm.email} 
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        member.email
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-select"
                          value={editForm.lc} 
                          onChange={(e) => setEditForm({ ...editForm, lc: e.target.value })}
                        >
                          <option value="MU">MU</option>
                          <option value="MUJ">MUJ</option>
                          <option value="KU">KU</option>
                          <option value="JECRC">JECRC</option>
                        </select>
                      ) : (
                        <span className="badge badge-specific">LC {member.lc}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{member.yearsLeftForMembership} years</span>
                    </td>
                    <td>
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      {member.isTempPassword ? (
                        <span className="badge badge-warning">Temp Password</span>
                      ) : member.resume?.isCompleted ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-danger">Incomplete</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleEditSubmit(member._id)}
                            style={styles.saveBtn}
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            style={styles.cancelBtn}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => startEdit(member)}
                            style={styles.editBtn}
                            title="Edit Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member._id)}
                            style={styles.deleteBtn}
                            title="Delete Member"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
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
  controlsCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '24px',
    backgroundColor: 'var(--bg-secondary)',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    flex: 1,
    maxWidth: '500px',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  filterWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-glow)',
    border: '1px solid rgba(5, 60, 94, 0.2)',
    color: 'var(--primary)',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'var(--primary-glow)',
    }
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    }
  },
  saveBtn: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: 'var(--success)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
  },
  cancelBtn: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--danger)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
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
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '16px',
    marginBottom: '24px',
  },
  bulkPanel: {
    padding: '30px',
    marginBottom: '24px',
    backgroundColor: 'var(--bg-secondary)',
  },
  bulkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  instructionsBox: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '20px',
    border: '1px solid var(--border-color)',
  },
  codeSample: {
    display: 'block',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    color: 'var(--primary)',
    marginBottom: '10px',
    border: '1px solid var(--border-color)',
  },
  bulletList: {
    paddingLeft: '20px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  uploadControls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  fileInputWrapper: {
    height: '45px',
    display: 'flex',
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  resultsScroll: {
    maxHeight: '280px',
    overflowY: 'auto',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'var(--transition-fast)',
    '&:hover': {
      color: 'var(--primary)',
      backgroundColor: 'var(--primary-glow)',
    }
  }
};

export default ManageMembers;
