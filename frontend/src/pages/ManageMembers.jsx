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
  ChevronDown,
  Info,
  UserPlus,
  AlertTriangle
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
  
  // CSV Preview & Verification States
  const [csvPreview, setCsvPreview] = useState(null); // { rows: [], stats: { total, valid, duplicates, invalid } }
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
  }, [lcFilter]);

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

  // Handle CSV file selection and parsing (Preview before upload)
  const handleCsvSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus({ type: '', message: '' });
    setUploadResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split(/\r?\n/);
        
        const parsedRows = [];
        let headers = [];
        let startIndex = 0;

        if (rows.length > 0 && rows[0].trim()) {
          const firstRowCells = rows[0].split(',').map(c => c.trim().toLowerCase());
          if (firstRowCells.includes('mailid') || firstRowCells.includes('email') || firstRowCells.includes('name') || firstRowCells.includes('learnid')) {
            headers = firstRowCells;
            startIndex = 1;
          }
        }

        // Stats track
        let validCount = 0;
        let dupCount = 0;
        let invalidCount = 0;
        const emailSetInCsv = new Set();

        for (let i = startIndex; i < rows.length; i++) {
          const rowText = rows[i].trim();
          if (!rowText) continue;

          const cells = rowText.split(',').map(c => c.trim());

          let learnId = '';
          let email = '';
          let name = '';
          let yearsLeft = 0;
          let lc = '';

          if (headers.length > 0) {
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
            learnId = cells[0] || '';
            email = cells[1] || '';
            name = cells[2] || '';
            yearsLeft = cells[3] || 0;
            lc = cells[4] || '';
          }

          if (!email && !name) continue;

          // Inline validation
          let rowStatus = 'Valid';
          let rowReason = '';

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const targetLc = (lc || defaultLc || '').trim().toUpperCase();

          if (!name.trim()) {
            rowStatus = 'Invalid';
            rowReason = 'Missing Name';
            invalidCount++;
          } else if (!email.trim()) {
            rowStatus = 'Invalid';
            rowReason = 'Missing Email';
            invalidCount++;
          } else if (!emailRegex.test(email.trim().toLowerCase())) {
            rowStatus = 'Invalid';
            rowReason = 'Invalid Email Format';
            invalidCount++;
          } else if (lc && !['MU', 'MUJ', 'KU', 'JECRC'].includes(targetLc)) {
            rowStatus = 'Invalid';
            rowReason = `Invalid LC: ${targetLc}`;
            invalidCount++;
          } else if (emailSetInCsv.has(email.trim().toLowerCase())) {
            rowStatus = 'Duplicate';
            rowReason = 'Duplicate in CSV file';
            dupCount++;
          } else {
            // Check if email already exists in system database
            const dbMatch = members.find(m => m.email.toLowerCase() === email.trim().toLowerCase());
            if (dbMatch) {
              rowStatus = 'Duplicate';
              rowReason = 'Email exists in Database';
              dupCount++;
            } else {
              validCount++;
              emailSetInCsv.add(email.trim().toLowerCase());
            }
          }

          parsedRows.push({
            learnId: learnId ? learnId.trim() : '',
            email: email ? email.trim() : '',
            name: name ? name.trim() : '',
            yearsLeftForMembership: Number(yearsLeft) || 0,
            lc: targetLc,
            status: rowStatus,
            reason: rowReason
          });
        }

        if (parsedRows.length === 0) {
          throw new Error('No valid records found in the CSV. Make sure you have name and email columns.');
        }

        setCsvPreview({
          rows: parsedRows,
          stats: {
            total: parsedRows.length,
            valid: validCount,
            duplicates: dupCount,
            invalid: invalidCount
          }
        });
      } catch (err) {
        console.error('CSV parse failed:', err);
        setStatus({ type: 'error', message: err.message || 'Failed to parse CSV file.' });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Submit parsed valid rows to backend
  const handleConfirmImport = async () => {
    if (!csvPreview || csvPreview.stats.valid === 0) return;

    setUploading(true);
    setStatus({ type: '', message: '' });

    try {
      // Filter out invalid/duplicate rows
      const recordsToImport = csvPreview.rows.filter(r => r.status === 'Valid');

      const response = await authFetch('/api/members/bulk-upload', {
        method: 'POST',
        body: JSON.stringify({
          members: recordsToImport,
          defaultLc
        })
      });

      setUploadResults(response);
      setStatus({ 
        type: 'success', 
        message: `Import Completed! Registered ${response.success.length} student accounts, encountered ${response.errors.length} database conflicts.` 
      });
      
      setCsvPreview(null);
      fetchMembers();
    } catch (err) {
      console.error('Import failed:', err);
      setStatus({ type: 'error', message: err.message || 'Bulk import failed.' });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Temporary password copied to clipboard!');
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidate Directory</h1>
          <p style={{ color: 'var(--text-muted)' }}>View, edit, search, and bulk-import student accounts across Local Committees</p>
        </div>
        <button 
          onClick={() => {
            setShowBulkPanel(!showBulkPanel);
            setCsvPreview(null);
            setUploadResults(null);
          }} 
          className="btn btn-primary"
        >
          {showBulkPanel ? <ChevronDown size={18} /> : <Upload size={18} />}
          {showBulkPanel ? 'Hide Importer' : 'Bulk Import (CSV)'}
        </button>
      </div>

      {/* Status Alert */}
      {status.message && (
        <div style={status.type === 'success' ? styles.successAlert : styles.errorAlert}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* CSV Bulk Importer Panel */}
      {showBulkPanel && (
        <div className="glass-card animate-slide-up" style={styles.bulkPanel}>
          <div style={styles.bulkHeader}>
            <FileSpreadsheet size={24} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Smart CSV Student Importer</h3>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '8px 0 20px 0' }}>
            Upload student rosters. The system validates formatting, flags database duplicates, and provides a full import preview. Generated passwords will be simulated on console logs.
          </p>

          <div style={styles.instructionsBox}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} /> Column Formatting Instructions
            </h4>
            <code style={styles.codeSample}>learnid, mailid, name, years left for membership, lc</code>
            <ul style={styles.bulletList}>
              <li>Columns can be ordered arbitrarily if headers (like <code>mailid</code>, <code>name</code>, <code>lc</code>) are provided on the first line.</li>
              <li>Missing <code>lc</code> values will fallback to the default selection chosen below.</li>
              <li>Only valid rows are imported. Duplicates and rows with validation issues will be skipped.</li>
            </ul>
          </div>

          {!csvPreview && !uploadResults && (
            <div style={styles.uploadControls}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Default Committee (LC)</label>
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
                  <Upload size={16} /> Select CSV File
                </label>
                <input 
                  id="csv-file-upload"
                  type="file" 
                  accept=".csv"
                  onChange={handleCsvSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Render CSV validation preview */}
          {csvPreview && (
            <div style={styles.resultsContainer} className="animate-slide-up">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>CSV Import Preview & Validation</h3>
              
              {/* Stat overview cards */}
              <div style={styles.previewStatsGrid}>
                <div style={styles.statBox}>
                  <span style={styles.statBoxLabel}>Total Found</span>
                  <span style={styles.statBoxValue}>{csvPreview.stats.total}</span>
                </div>
                <div style={{ ...styles.statBox, borderLeftColor: 'var(--success)' }}>
                  <span style={styles.statBoxLabel}>Ready to Import</span>
                  <span style={styles.statBoxValue}>{csvPreview.stats.valid}</span>
                </div>
                <div style={{ ...styles.statBox, borderLeftColor: 'var(--warning)' }}>
                  <span style={styles.statBoxLabel}>Duplicates flagged</span>
                  <span style={styles.statBoxValue}>{csvPreview.stats.duplicates}</span>
                </div>
                <div style={{ ...styles.statBox, borderLeftColor: 'var(--danger)' }}>
                  <span style={styles.statBoxLabel}>Errors / Warnings</span>
                  <span style={styles.statBoxValue}>{csvPreview.stats.invalid}</span>
                </div>
              </div>

              {/* Preview Table */}
              <div style={styles.resultsScroll}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email ID</th>
                      <th>Committee</th>
                      <th>Learn ID</th>
                      <th>Validation Status</th>
                      <th>Reason / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, idx) => (
                      <tr key={idx} style={row.status === 'Invalid' ? { backgroundColor: 'rgba(239, 68, 68, 0.02)' } : row.status === 'Duplicate' ? { backgroundColor: 'rgba(245, 158, 11, 0.02)' } : {}}>
                        <td style={{ fontWeight: '600' }}>{row.name || <span style={{ color: 'var(--danger)' }}>None</span>}</td>
                        <td>{row.email || <span style={{ color: 'var(--danger)' }}>None</span>}</td>
                        <td><span className="badge badge-specific">{row.lc}</span></td>
                        <td>{row.learnId || '-'}</td>
                        <td>
                          <span className={row.status === 'Valid' ? 'badge badge-success' : row.status === 'Duplicate' ? 'badge badge-warning' : 'badge badge-danger'}>
                            {row.status}
                          </span>
                        </td>
                        <td style={row.status === 'Valid' ? { color: 'var(--success)' } : { color: 'var(--text-muted)' }}>
                          {row.status === 'Valid' ? 'Valid' : row.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.actionImportRow}>
                <button 
                  onClick={() => setCsvPreview(null)} 
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel & Reselect File
                </button>
                <button 
                  onClick={handleConfirmImport} 
                  className="btn btn-primary"
                  disabled={uploading || csvPreview.stats.valid === 0}
                  style={{ background: 'var(--success)', boxShadow: 'none' }}
                >
                  <UserPlus size={16} /> Confirm & Import {csvPreview.stats.valid} Students
                </button>
              </div>
            </div>
          )}

          {/* Render Import Results report */}
          {uploadResults && (
            <div style={styles.resultsContainer} className="animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Import Summary & Credentials</h3>
                <button onClick={() => setUploadResults(null)} className="btn btn-secondary">Close Summary</button>
              </div>
              
              {uploadResults.success.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CheckCircle size={18} color="var(--success)" />
                    <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Registered Accounts ({uploadResults.success.length})</h4>
                  </div>
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
                                title="Copy Password"
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <AlertTriangle size={18} color="var(--danger)" />
                    <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Failed / Skipped Records ({uploadResults.errors.length})</h4>
                  </div>
                  <div style={styles.resultsScroll}>
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResults.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '500' }}>{err.email}</td>
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
          <Filter size={18} color="var(--text-muted)" />
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
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading candidate profiles...</p>
      ) : members.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No student profiles found matching the search/filter criteria.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Learn ID</th>
                <th>Name</th>
                <th>Email ID</th>
                <th>Committee</th>
                <th>Years Left</th>
                <th>Joined Date</th>
                <th>Profile Status</th>
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
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{member.name}</span>
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
                        <span className="badge badge-warning">Temp Pass</span>
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
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
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
    border: '1px solid var(--primary-glow)',
    color: 'var(--primary)',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--secondary)',
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
  },
  bulkPanel: {
    padding: '30px',
    marginBottom: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  bulkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    backgroundColor: '#fff',
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
  previewStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statBox: {
    padding: '14px 18px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '4px solid var(--primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  statBoxLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statBoxValue: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '4px',
  },
  resultsScroll: {
    maxHeight: '280px',
    overflowY: 'auto',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: '#fff',
  },
  actionImportRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    gap: '16px',
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
