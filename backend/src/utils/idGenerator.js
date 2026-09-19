const Complaint = require('../models/Complaint');

/**
 * Generate a unique Complaint ID in the format: CMP-YYYY-XXXX
 * e.g., CMP-2026-0001
 */
const generateComplaintId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `CMP-${currentYear}-`;

  // Find the highest sequence number for the current year
  const latestComplaint = await Complaint.findOne({
    complaintId: new RegExp(`^${prefix}\\d{4,}$`),
  })
    .sort({ complaintId: -1 })
    .lean();

  let nextSequence = 1;

  if (latestComplaint && latestComplaint.complaintId) {
    const parts = latestComplaint.complaintId.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  // Double check uniqueness to prevent race collisions
  let uniqueId = `${prefix}${String(nextSequence).padStart(4, '0')}`;
  let exists = await Complaint.exists({ complaintId: uniqueId });

  while (exists) {
    nextSequence += 1;
    uniqueId = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    exists = await Complaint.exists({ complaintId: uniqueId });
  }

  return uniqueId;
};

module.exports = { generateComplaintId };
