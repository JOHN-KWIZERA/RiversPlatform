const AuditLog = require('../models/AuditLog');

/**
 * Record an audit event. Fire-and-forget — never throws.
 */
async function audit({ actorId, actorName, action, targetType, targetId, targetLabel, metadata, req }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '';
    await AuditLog.create({ actorId, actorName, action, targetType, targetId, targetLabel, metadata, ip });
  } catch (err) {
    console.error('audit error:', err.message);
  }
}

module.exports = { audit };
