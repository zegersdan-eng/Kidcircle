import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notifications.js';

const router = Router();

/**
 * Helper: Get the provider's user_id (owner) for notification targeting
 */
async function getProviderUserId(providerId) {
  const result = await db.execute({
    sql: 'SELECT user_id, name FROM providers WHERE id = ?',
    args: [providerId],
  });
  return result.rows[0] || null;
}

/**
 * Helper: Update overall_status based on individual check statuses
 */
async function updateOverallStatus(verificationId) {
  const v = await db.execute({
    sql: 'SELECT * FROM verifications WHERE id = ?',
    args: [verificationId],
  });
  if (v.rows.length === 0) return;

  const ver = v.rows[0];
  const checks = [
    ver.identity_status,
    ver.background_status,
    ver.business_status,
    ver.licensing_status,
    ver.insurance_status,
    ver.review_status,
  ];

  // Any failed = denied
  if (checks.some(s => s === 'failed' || s === 'rejected')) {
    await db.execute({
      sql: "UPDATE verifications SET overall_status = 'denied', updated_at = datetime('now') WHERE id = ?",
      args: [verificationId],
    });
    return 'denied';
  }

  // All must be verified/passed/approved
  const allPassed =
    ver.identity_status === 'verified' &&
    ver.background_status === 'passed' &&
    ver.business_status === 'verified' &&
    ver.licensing_status === 'approved' &&
    ver.insurance_status === 'approved' &&
    ver.review_status === 'passed';

  if (allPassed) {
    await db.execute({
      sql: "UPDATE verifications SET overall_status = 'gold_standard', updated_at = datetime('now') WHERE id = ?",
      args: [verificationId],
    });
    return 'gold_standard';
  }

  // Some submitted but not all = in_progress
  const anySubmitted = checks.some(s =>
    s === 'submitted' || s === 'pending' || s === 'verified' || s === 'passed' || s === 'approved'
  );
  if (anySubmitted) {
    await db.execute({
      sql: "UPDATE verifications SET overall_status = 'in_progress', updated_at = datetime('now') WHERE id = ?",
      args: [verificationId],
    });
    return 'in_progress';
  }

  return 'incomplete';
}

// ============================================================
// GET /api/verification/:providerId — Get verification status
// ============================================================
router.get('/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;

    let result = await db.execute({
      sql: 'SELECT * FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    if (result.rows.length === 0) {
      // Create initial record
      const id = uuidv4();
      await db.execute({
        sql: 'INSERT INTO verifications (id, provider_id) VALUES (?, ?)',
        args: [id, providerId],
      });
      result = await db.execute({
        sql: 'SELECT * FROM verifications WHERE id = ?',
        args: [id],
      });
    }

    // Get documents
    const docs = await db.execute({
      sql: 'SELECT * FROM verification_docs WHERE verification_id = ? ORDER BY created_at DESC',
      args: [result.rows[0].id],
    });

    res.json({
      ...result.rows[0],
      documents: docs.rows,
    });
  } catch (err) {
    console.error('Get verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/verification/:providerId/identity — Mock Stripe Identity
// ============================================================
router.post('/:providerId/identity', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { document_type = 'drivers_license' } = req.body;

    // Find or create verification record
    let result = await db.execute({
      sql: 'SELECT id FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    let verId;
    if (result.rows.length === 0) {
      verId = uuidv4();
      await db.execute({
        sql: "INSERT INTO verifications (id, provider_id, identity_status, identity_submitted_at) VALUES (?, ?, 'submitted', datetime('now'))",
        args: [verId, providerId],
      });
    } else {
      verId = result.rows[0].id;
      await db.execute({
        sql: "UPDATE verifications SET identity_status = 'submitted', identity_submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        args: [verId],
      });
    }

    // Mock verification — auto-verify after "processing"
    // In production, this would call Stripe Identity API
    const mockVerified = true;
    await db.execute({
      sql: "UPDATE verifications SET identity_status = 'verified', identity_verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [verId],
    });

    await updateOverallStatus(verId);

    // Log mock document
    const docId = uuidv4();
    await db.execute({
      sql: "INSERT INTO verification_docs (id, verification_id, doc_type, file_name, file_url, status) VALUES (?, ?, 'business_filing', ?, ?, 'approved')",
      args: [docId, verId, `${document_type}_mock.pdf`, `https://verify.kidcircle.io/docs/${uuidv4()}`],
    });

    res.json({
      message: 'Identity verified successfully',
      status: 'verified',
      verification_id: verId,
      provider_id: providerId,
    });
  } catch (err) {
    console.error('Identity verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/verification/:providerId/background — Mock Checkr
// ============================================================
router.post('/:providerId/background', async (req, res) => {
  try {
    const { providerId } = req.params;

    let result = await db.execute({
      sql: 'SELECT id FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    let verId;
    if (result.rows.length === 0) {
      verId = uuidv4();
      await db.execute({
        sql: "INSERT INTO verifications (id, provider_id, background_status, background_submitted_at) VALUES (?, ?, 'pending', datetime('now'))",
        args: [verId, providerId],
      });
    } else {
      verId = result.rows[0].id;
      await db.execute({
        sql: "UPDATE verifications SET background_status = 'pending', background_submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        args: [verId],
      });
    }

    // Mock Checkr — auto-pass background check
    await db.execute({
      sql: "UPDATE verifications SET background_status = 'passed', background_completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [verId],
    });

    await updateOverallStatus(verId);

    // Record mock report
    const reportId = uuidv4();
    await db.execute({
      sql: "INSERT INTO verification_docs (id, verification_id, doc_type, file_name, file_url, status) VALUES (?, ?, 'business_filing', ?, ?, 'approved')",
      args: [reportId, verId, 'checkr_report_mock.pdf', `https://verify.kidcircle.io/checks/${uuidv4()}`],
    });

    res.json({
      message: 'Background check passed',
      status: 'passed',
      verification_id: verId,
      checkr_candidate_id: `mock-candidate-${uuidv4().substring(0, 8)}`,
    });
  } catch (err) {
    console.error('Background check error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/verification/:providerId/business — Mock Texas SOS Check
// ============================================================
router.post('/:providerId/business', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { business_name, ein } = req.body;

    let result = await db.execute({
      sql: 'SELECT id FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    let verId;
    if (result.rows.length === 0) {
      verId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO verifications (id, provider_id) VALUES (?, ?)',
        args: [verId, providerId],
      });
    } else {
      verId = result.rows[0].id;
    }

    // Mock SOS check — verify business filing
    await db.execute({
      sql: "UPDATE verifications SET business_status = 'verified', business_checked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [verId],
    });

    await updateOverallStatus(verId);

    res.json({
      message: 'Texas SOS registration verified',
      status: 'verified',
      business_name: business_name || 'Mock Business LLC',
      sos_filing_number: `SO${uuidv4().substring(0, 10).toUpperCase()}`,
      verification_id: verId,
    });
  } catch (err) {
    console.error('Business verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/verification/:providerId/license — Submit HHSC/Exemption
// ============================================================
router.post('/:providerId/license', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { license_type, license_number, file_name, notes } = req.body;

    let result = await db.execute({
      sql: 'SELECT id FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    let verId;
    if (result.rows.length === 0) {
      verId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO verifications (id, provider_id, licensing_status, licensing_submitted_at) VALUES (?, ?, ?, datetime(\'now\'))',
        args: [verId, providerId, license_type === 'exemption' ? 'submitted' : 'submitted'],
      });
    } else {
      verId = result.rows[0].id;
      await db.execute({
        sql: "UPDATE verifications SET licensing_status = 'submitted', licensing_submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        args: [verId],
      });
    }

    const docType = license_type === 'exemption' ? 'exemption_affidavit' : 'hhsc_license';
    const docId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO verification_docs (id, verification_id, doc_type, file_name, file_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      args: [docId, verId, docType, file_name || 'license_document.pdf',
             `https://verify.kidcircle.io/uploads/${docId}`, 'pending'],
    });

    await updateOverallStatus(verId);

    res.status(201).json({
      message: license_type === 'exemption' ? 'Exemption affidavit submitted' : 'HHSC license submitted',
      status: 'pending_review',
      document_id: docId,
      verification_id: verId,
    });
  } catch (err) {
    console.error('License submission error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// POST /api/verification/:providerId/insurance — Submit COI
// ============================================================
router.post('/:providerId/insurance', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { file_name, coverage_amount = 1000000 } = req.body;

    let result = await db.execute({
      sql: 'SELECT id FROM verifications WHERE provider_id = ?',
      args: [providerId],
    });

    let verId;
    if (result.rows.length === 0) {
      verId = uuidv4();
      await db.execute({
        sql: 'INSERT INTO verifications (id, provider_id) VALUES (?, ?)',
        args: [verId, providerId],
      });
    } else {
      verId = result.rows[0].id;
    }

    await db.execute({
      sql: "UPDATE verifications SET insurance_status = 'submitted', insurance_submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [verId],
    });

    const docId = uuidv4();
    await db.execute({
      sql: "INSERT INTO verification_docs (id, verification_id, doc_type, file_name, file_url, status) VALUES (?, ?, 'insurance_coi', ?, ?, 'pending')",
      args: [docId, verId, file_name || 'certificate_of_insurance.pdf',
             `https://verify.kidcircle.io/uploads/${docId}`],
    });

    // Auto-approve if coverage >= $1M
    if (coverage_amount >= 1000000) {
      await db.execute({
        sql: "UPDATE verifications SET insurance_status = 'approved', insurance_approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        args: [verId],
      });
      await db.execute({
        sql: "UPDATE verification_docs SET status = 'approved' WHERE id = ?",
        args: [docId],
      });
    }

    await updateOverallStatus(verId);

    res.status(201).json({
      message: 'Insurance COI submitted',
      status: coverage_amount >= 1000000 ? 'approved' : 'pending_review',
      coverage_amount,
      document_id: docId,
      verification_id: verId,
    });
  } catch (err) {
    console.error('Insurance submission error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// Admin: Approve/Reject a verification document
// ============================================================
router.patch('/admin/docs/:docId', async (req, res) => {
  try {
    const { docId } = req.params;
    const { status, reviewed_by, notes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    // Get the document
    const docResult = await db.execute({
      sql: 'SELECT * FROM verification_docs WHERE id = ?',
      args: [docId],
    });

    if (docResult.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = docResult.rows[0];

    await db.execute({
      sql: 'UPDATE verification_docs SET status = ?, reviewed_by = ?, notes = ? WHERE id = ?',
      args: [status, reviewed_by || 'admin@kidcircle.io', notes || null, docId],
    });

    // Update the parent verification
    if (doc.doc_type === 'hhsc_license' || doc.doc_type === 'exemption_affidavit') {
      await db.execute({
        sql: status === 'approved'
          ? "UPDATE verifications SET licensing_status = 'approved', licensing_approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
          : "UPDATE verifications SET licensing_status = 'rejected', updated_at = datetime('now') WHERE id = ?",
        args: [doc.verification_id],
      });
    }

    if (doc.doc_type === 'insurance_coi') {
      await db.execute({
        sql: status === 'approved'
          ? "UPDATE verifications SET insurance_status = 'approved', insurance_approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
          : "UPDATE verifications SET insurance_status = 'rejected', updated_at = datetime('now') WHERE id = ?",
        args: [doc.verification_id],
      });
    }

    const overall = await updateOverallStatus(doc.verification_id);

    // Get provider info for notification
    const verResult = await db.execute({
      sql: 'SELECT v.provider_id, p.name as provider_name FROM verifications v JOIN providers p ON v.provider_id = p.id WHERE v.id = ?',
      args: [doc.verification_id],
    });

    if (verResult.rows.length > 0) {
      const { provider_id, provider_name } = verResult.rows[0];
      const providerInfo = await getProviderUserId(provider_id);

      if (providerInfo && providerInfo.user_id) {
        const docLabel = doc.doc_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (status === 'approved') {
          await createNotification({
            userId: providerInfo.user_id,
            type: NOTIFICATION_TYPES.DOCUMENT_APPROVED,
            category: 'verification',
            title: 'Document Approved',
            message: `Your "${docLabel}" has been approved for ${provider_name}. ${overall === 'gold_standard' ? 'All checks passed — Pro Gold Standard badge awarded!' : 'Continue submitting remaining documents to earn your badge.'}`,
            data: {
              provider_id,
              provider_name,
              doc_type: doc.doc_type,
              doc_id: docId,
              overall_status: overall,
            },
          });

          // If this pushes to gold_standard, also send the badge notification
          if (overall === 'gold_standard') {
            await createNotification({
              userId: providerInfo.user_id,
              type: NOTIFICATION_TYPES.BADGE_AWARDED,
              category: 'verification',
              title: '🏆 Pro Gold Standard Badge Awarded!',
              message: `Congratulations! ${provider_name} has earned the Pro Gold Standard badge — the highest trust level on KidCircle. Your provider listing will now appear with the verified badge and priority visibility.`,
              data: {
                provider_id,
                provider_name,
                badge: 'Pro Gold Standard',
                overall_status: 'gold_standard',
              },
            });
          }
        } else {
          await createNotification({
            userId: providerInfo.user_id,
            type: NOTIFICATION_TYPES.DOCUMENT_REJECTED,
            category: 'verification',
            title: 'Document Needs Attention',
            message: `Your "${docLabel}" for ${provider_name} was not approved. Please review and resubmit. ${notes ? `Notes: ${notes}` : ''}`,
            data: {
              provider_id,
              provider_name,
              doc_type: doc.doc_type,
              doc_id: docId,
              review_notes: notes || null,
            },
          });
        }
      }
    }

    res.json({
      message: `Document ${status}`,
      document_status: status,
      verification_id: doc.verification_id,
      overall_status: overall,
    });
  } catch (err) {
    console.error('Admin document review error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// Admin: Finalize Pro Gold Standard badge
// ============================================================
router.post('/admin/:verificationId/finalize', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { admin_notes } = req.body;

    const result = await db.execute({
      sql: 'SELECT * FROM verifications WHERE id = ?',
      args: [verificationId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    const ver = result.rows[0];
    const overall = await updateOverallStatus(verificationId);

    if (overall === 'gold_standard') {
      // Update admin notes
      await db.execute({
        sql: 'UPDATE verifications SET admin_notes = ?, updated_at = datetime(\'now\') WHERE id = ?',
        args: [admin_notes || 'Pro Gold Standard badge awarded', verificationId],
      });

      // Update the provider's tier to premium
      await db.execute({
        sql: "UPDATE providers SET tier = 'premium', updated_at = datetime('now') WHERE id = ?",
        args: [ver.provider_id],
      });

      // Notify the provider about their badge
      const providerInfo = await getProviderUserId(ver.provider_id);
      if (providerInfo && providerInfo.user_id) {
        await createNotification({
          userId: providerInfo.user_id,
          type: NOTIFICATION_TYPES.BADGE_AWARDED,
          category: 'verification',
          title: '🏆 Pro Gold Standard Badge Awarded!',
          message: `Congratulations! ${providerInfo.name} has earned the Pro Gold Standard badge — the highest trust level on KidCircle. Your provider listing now has priority visibility and the verified badge.`,
          data: {
            provider_id: ver.provider_id,
            provider_name: providerInfo.name,
            badge: 'Pro Gold Standard',
            overall_status: 'gold_standard',
            admin_notes: admin_notes || null,
          },
        });
      }

      return res.json({
        message: 'Pro Gold Standard badge awarded!',
        overall_status: 'gold_standard',
        provider_id: ver.provider_id,
        badge: 'Pro Gold Standard',
      });
    }

    const missing = [];
    if (ver.identity_status !== 'verified') missing.push('Identity');
    if (ver.background_status !== 'passed') missing.push('Background Check');
    if (ver.business_status !== 'verified') missing.push('Business Registration');
    if (ver.licensing_status !== 'approved') missing.push('HHSC License/Exemption');
    if (ver.insurance_status !== 'approved') missing.push('Insurance (COI)');
    if (ver.review_status !== 'passed') missing.push('Minimum 4.5★ Rating');

    res.status(400).json({
      message: 'Cannot award badge — missing requirements',
      overall_status: overall,
      missing_requirements: missing,
    });
  } catch (err) {
    console.error('Admin finalize error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================================
// GET /api/verification/admin/providers — Admin list
// ============================================================
router.get('/admin/providers', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT v.*, p.name as provider_name, p.category_id, p.avg_rating
            FROM verifications v
            JOIN providers p ON v.provider_id = p.id
            ORDER BY v.updated_at DESC
            LIMIT 50`,
    });
    res.json(result.rows);
  } catch (err) {
    console.error('Admin list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router };