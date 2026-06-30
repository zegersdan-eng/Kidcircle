import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const VERIFICATION_CHECKS = [
  {
    key: 'identity_status',
    label: 'Identity Verification',
    provider: 'Stripe Identity',
    icon: '🪪',
    action: 'Verify Identity',
    apiEndpoint: 'identity',
    statusMap: { not_submitted: 'Not Started', submitted: 'Pending Review', verified: 'Verified' },
    statusColor: { not_submitted: 'text-gray-400', submitted: 'text-amber-500', verified: 'text-green-600' },
    statusBg: { not_submitted: 'bg-gray-50', submitted: 'bg-amber-50', verified: 'bg-green-50' },
    description: 'Multi-factor identity verification matching government-issued ID to biometric live selfie.',
  },
  {
    key: 'background_status',
    label: 'Criminal Background Check',
    provider: 'Checkr',
    icon: '🛡️',
    action: 'Run Check',
    apiEndpoint: 'background',
    statusMap: { not_submitted: 'Not Started', pending: 'In Progress', passed: 'Passed', failed: 'Failed' },
    statusColor: { not_submitted: 'text-gray-400', pending: 'text-amber-500', passed: 'text-green-600', failed: 'text-red-600' },
    statusBg: { not_submitted: 'bg-gray-50', pending: 'bg-amber-50', passed: 'bg-green-50', failed: 'bg-red-50' },
    description: 'National & state criminal search, sex offender registry, SSN trace, and global watchlist screening.',
  },
  {
    key: 'business_status',
    label: 'Texas SOS Registration',
    provider: 'Texas Secretary of State',
    icon: '🏛️',
    action: 'Verify Business',
    apiEndpoint: 'business',
    statusMap: { not_checked: 'Not Checked', verified: 'Verified' },
    statusColor: { not_checked: 'text-gray-400', verified: 'text-green-600' },
    statusBg: { not_checked: 'bg-gray-50', verified: 'bg-green-50' },
    description: 'Verification of active Texas Secretary of State business registration or equivalent.',
  },
  {
    key: 'licensing_status',
    label: 'HHSC License / Exemption',
    provider: 'Texas DFPS/HHSC',
    icon: '📋',
    action: 'Upload Document',
    apiEndpoint: 'license',
    statusMap: { not_submitted: 'Not Submitted', submitted: 'Under Review', approved: 'Approved', rejected: 'Rework Needed' },
    statusColor: { not_submitted: 'text-gray-400', submitted: 'text-amber-500', approved: 'text-green-600', rejected: 'text-red-600' },
    statusBg: { not_submitted: 'bg-gray-50', submitted: 'bg-amber-50', approved: 'bg-green-50', rejected: 'bg-red-50' },
    description: 'Texas DFPS/HHSC license for childcare or an exemption affidavit for enrichment-only programs.',
  },
  {
    key: 'insurance_status',
    label: 'General Liability Insurance',
    provider: 'COI Upload',
    icon: '✅',
    action: 'Upload COI',
    apiEndpoint: 'insurance',
    statusMap: { not_submitted: 'Not Submitted', submitted: 'Under Review', approved: 'Approved', rejected: 'Rework Needed' },
    statusColor: { not_submitted: 'text-gray-400', submitted: 'text-amber-500', approved: 'text-green-600', rejected: 'text-red-600' },
    statusBg: { not_submitted: 'bg-gray-50', submitted: 'bg-amber-50', approved: 'bg-green-50', rejected: 'bg-red-50' },
    description: 'Certificate of Insurance showing $1M+ general liability coverage for physical facilities.',
  },
  {
    key: 'review_status',
    label: 'Rating Requirement',
    provider: 'Parent Reviews',
    icon: '⭐',
    apiEndpoint: null,
    statusMap: { pending: 'In Progress', passed: 'Achieved', failed: 'Below Threshold' },
    statusColor: { pending: 'text-amber-500', passed: 'text-green-600', failed: 'text-red-600' },
    statusBg: { pending: 'bg-amber-50', passed: 'bg-green-50', failed: 'bg-red-50' },
    description: 'Minimum 4.5-star average rating from verified parent reviewers.',
  },
];

export default function VerificationPortal() {
  const [providerId, setProviderId] = useState('');
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [uploadModal, setUploadModal] = useState(null); // For license/insurance uploads
  const [uploadData, setUploadData] = useState({ file_name: '', notes: '', license_type: 'hhsc', coverage_amount: 1000000 });
  const [activating, setActivating] = useState(null);

  const loadVerification = async (id) => {
    if (!id) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const data = await api.getVerificationStatus(id);
      setVerification(data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load verification status: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) loadVerification(providerId);
  }, [providerId]);

  const handleAction = async (check) => {
    setActivating(check.key);
    setStatusMessage(null);
    try {
      let data;
      switch (check.apiEndpoint) {
        case 'identity':
          data = await api.verifyIdentity(providerId);
          break;
        case 'background':
          data = await api.runBackgroundCheck(providerId);
          break;
        case 'business':
          data = await api.verifyBusiness(providerId, { business_name: 'My Austin Business' });
          break;
        default:
          return;
      }
      setStatusMessage({ type: 'success', text: data.message || `${check.label} completed!` });
      await loadVerification(providerId);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActivating(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadModal) return;
    setActivating('uploading');
    setStatusMessage(null);
    try {
      let data;
      if (uploadModal === 'license') {
        data = await api.submitLicense(providerId, {
          license_type: uploadData.license_type,
          file_name: uploadData.file_name || 'license_document.pdf',
          notes: uploadData.notes,
        });
      } else if (uploadModal === 'insurance') {
        data = await api.submitInsurance(providerId, {
          file_name: uploadData.file_name || 'certificate_of_insurance.pdf',
          coverage_amount: uploadData.coverage_amount,
        });
      }
      setStatusMessage({ type: 'success', text: data.message || 'Document uploaded!' });
      setUploadModal(null);
      setUploadData({ file_name: '', notes: '', license_type: 'hhsc', coverage_amount: 1000000 });
      await loadVerification(providerId);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setActivating(null);
    }
  };

  const getStatusValue = (key) => {
    if (!verification) return 'not_submitted';
    return verification[key] || 'not_submitted';
  };

  const overallColor = () => {
    if (!verification) return 'text-gray-400';
    const s = verification.overall_status;
    if (s === 'gold_standard') return 'text-green-600';
    if (s === 'in_progress') return 'text-amber-500';
    if (s === 'denied') return 'text-red-600';
    return 'text-gray-400';
  };

  const overallBg = () => {
    if (!verification) return 'bg-gray-50';
    const s = verification.overall_status;
    if (s === 'gold_standard') return 'bg-green-50 border-green-200';
    if (s === 'in_progress') return 'bg-amber-50 border-amber-200';
    if (s === 'denied') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-100';
  };

  const overallLabel = () => {
    if (!verification) return 'Incomplete';
    const s = verification.overall_status;
    if (s === 'gold_standard') return '🏆 Pro Gold Standard';
    if (s === 'in_progress') return '🔄 In Progress';
    if (s === 'denied') return '❌ Denied';
    return '⚪ Not Started';
  };

  const completedCount = VERIFICATION_CHECKS.filter(c => {
    const v = getStatusValue(c.key);
    return v === 'verified' || v === 'passed' || v === 'approved';
  }).length;

  return (
    <div className="px-4 pb-32">
      {/* Header */}
      <div className="pt-2 mb-5">
        <h1 className="text-xl font-bold text-text mb-0">Verified Background Portal</h1>
        <p className="text-xs text-text-light">Manage your "Pro Gold Standard" verification</p>
      </div>

      {/* Provider ID entry */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
        <label className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2 block">
          Provider / Business ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., b09bda77-b622-..."
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="input-field flex-1 text-xs"
          />
          <button
            onClick={() => loadVerification(providerId)}
            disabled={!providerId || loading}
            className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg text-sm disabled:opacity-60"
          >
            {loading ? '...' : 'Load'}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Enter your provider ID to check status. Try: <button onClick={() => setProviderId('b09bda77-b622-4be9-acb9-b540d0dc5b20')} className="text-primary underline">Girlstart (demo)</button>
        </p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`p-3 rounded-xl mb-4 text-sm flex items-center justify-between ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="underline text-xs ml-2">Dismiss</button>
        </div>
      )}

      {/* Overall status banner */}
      {verification && (
        <div className={`rounded-2xl border p-5 mb-5 ${overallBg()}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-light mb-1">Overall Status</p>
              <h2 className={`text-lg font-bold ${overallColor()}`}>{overallLabel()}</h2>
              <p className="text-xs text-text-light mt-1">
                {completedCount} of {VERIFICATION_CHECKS.length} requirements met
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-text">{Math.round((completedCount / VERIFICATION_CHECKS.length) * 100)}%</div>
              <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / VERIFICATION_CHECKS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification checks list */}
      {!verification && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🛡️</span>
          </div>
          <h3 className="text-base font-semibold text-text mb-1">Enter a Provider ID</h3>
          <p className="text-sm text-text-light">
            Enter your provider ID above to view and manage your verification status.
          </p>
        </div>
      )}

      {loading && !verification && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      )}

      {verification && (
        <div className="space-y-2">
          {VERIFICATION_CHECKS.map((check) => {
            const status = getStatusValue(check.key);
            const statusLabel = check.statusMap[status] || status;
            const colorClass = check.statusColor[status] || 'text-gray-400';
            const bgClass = check.statusBg[status] || 'bg-gray-50';
            const isDone = status === 'verified' || status === 'passed' || status === 'approved';
            const canAct = check.apiEndpoint && !isDone;
            const needsUpload = check.apiEndpoint === 'license' || check.apiEndpoint === 'insurance';

            return (
              <div key={check.key} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{check.icon}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text">{check.label}</h3>
                      <p className="text-xs text-text-light">{check.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isDone && <span className="text-green-500 text-sm">✓</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bgClass} ${colorClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-text-light mb-3">{check.description}</p>

                {/* Documents */}
                {verification.documents?.length > 0 && (
                  <div className="mb-3">
                    {verification.documents
                      .filter(d => d.doc_type === check.apiEndpoint || d.doc_type === 'business_filing')
                      .slice(0, 2)
                      .map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs text-text-muted mb-1">
                          <span>📎</span>
                          <span className="truncate">{doc.file_name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            doc.status === 'approved' ? 'bg-green-50 text-green-600' :
                            doc.status === 'rejected' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Action button */}
                {canAct && !needsUpload && (
                  <button
                    onClick={() => handleAction(check)}
                    disabled={activating === check.key}
                    className="w-full py-2 bg-primary/5 text-primary font-medium rounded-lg text-xs hover:bg-primary/10 transition-colors disabled:opacity-60"
                  >
                    {activating === check.key ? 'Processing...' : `🔹 ${check.action}`}
                  </button>
                )}

                {canAct && needsUpload && (
                  <button
                    onClick={() => setUploadModal(check.apiEndpoint)}
                    className="w-full py-2 bg-primary/5 text-primary font-medium rounded-lg text-xs hover:bg-primary/10 transition-colors"
                  >
                    🔹 Upload Document
                  </button>
                )}

                {isDone && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal for License/Insurance */}
      {uploadModal && (
        <>
          <div className="sheet-overlay" onClick={() => setUploadModal(null)} />
          <div className="sheet-panel">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-bold text-text mb-4">
              {uploadModal === 'license' ? '📋 Upload HHSC License / Exemption' : '✅ Upload Certificate of Insurance'}
            </h3>

            <div className="space-y-3">
              {uploadModal === 'license' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-text mb-1 block">License Type</label>
                    <select
                      value={uploadData.license_type}
                      onChange={(e) => setUploadData(prev => ({ ...prev, license_type: e.target.value }))}
                      className="input-field"
                    >
                      <option value="hhsc">HHSC Childcare License</option>
                      <option value="exemption">Exemption Affidavit (Enrichment Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text mb-1 block">File Name</label>
                    <input
                      type="text"
                      placeholder="e.g., hhsc_license_2026.pdf"
                      value={uploadData.file_name}
                      onChange={(e) => setUploadData(prev => ({ ...prev, file_name: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text mb-1 block">Notes (optional)</label>
                    <textarea
                      placeholder="Any additional context..."
                      value={uploadData.notes}
                      onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                      className="input-field min-h-[60px]"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-text-muted">
                      📎 File upload simulation: In production, this would open a file picker for PDF/PNG upload.
                      The document will be reviewed by our team within 4 hours.
                    </p>
                  </div>
                </>
              )}

              {uploadModal === 'insurance' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-text mb-1 block">File Name</label>
                    <input
                      type="text"
                      placeholder="e.g., certificate_of_insurance.pdf"
                      value={uploadData.file_name}
                      onChange={(e) => setUploadData(prev => ({ ...prev, file_name: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text mb-1 block">Coverage Amount</label>
                    <select
                      value={uploadData.coverage_amount}
                      onChange={(e) => setUploadData(prev => ({ ...prev, coverage_amount: parseInt(e.target.value) }))}
                      className="input-field"
                    >
                      <option value={1000000}>$1,000,000 (Minimum)</option>
                      <option value={2000000}>$2,000,000</option>
                      <option value={5000000}>$5,000,000+</option>
                    </select>
                    <p className="text-xs text-text-muted mt-1">$1M minimum required for Pro Gold Standard.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-text-muted">
                      ✅ Coverage ${(uploadData.coverage_amount / 1000000).toFixed(0)}M — auto-approved upon submission.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                <button onClick={() => setUploadModal(null)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={activating === 'uploading'}
                  className="btn-primary flex-1 text-sm"
                >
                  {activating === 'uploading' ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Summary Info */}
      {verification && (
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 p-5 mt-5">
          <h3 className="text-sm font-bold text-text mb-3">About Pro Gold Standard</h3>
          <div className="space-y-2 text-xs text-text-light">
            <p>✅ All 6 checks must pass to earn the "Pro Gold Standard" badge</p>
            <p>🔄 Background checks re-run quarterly for ongoing compliance</p>
            <p>⏱ Document reviews completed within 4 hours during business days</p>
            <p>🏆 Once awarded, your provider profile gets the premium badge and search boost</p>
          </div>
          <Link
            to="/analytics-dashboard"
            className="mt-4 w-full py-3 bg-primary/5 text-primary font-semibold rounded-xl text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Analytics Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}