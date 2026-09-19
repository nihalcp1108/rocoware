const fs = require('fs');
const path = require('path');
const Complaint = require('../models/Complaint');
const { generateComplaintId } = require('../utils/idGenerator');
const { generateCompletedComplaintsPDF } = require('../utils/pdfGenerator');
const { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Phone validation helper
const isValidPhone = (phone) => {
  if (!phone) return false;
  // Allow numbers, spaces, plus, dashes, parentheses; minimum 7 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

// @desc    Register a new complaint (Customer & Complaint information only)
// @route   POST /api/complaints
// @access  Private
const createComplaint = async (req, res, next) => {
  try {
    const {
      // Customer & Complaint information
      customerName,
      address,
      mobileNumber1,
      mobileNumber2,
      shopName,
      modelNumber,
      purchaseDate,
      complaintName,
      otherProductName,
      complaintDetails,
      registeredPersonName,
    } = req.body;

    const cleanupUploadedFile = () => {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {}
      }
    };

    // Validate Customer Information Required Fields
    if (!customerName || !customerName.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Customer Name is required.' });
    }
    if (!address || !address.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Address is required.' });
    }
    if (!mobileNumber1 || !mobileNumber1.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Mobile Number 1 is required.' });
    }
    if (!isValidPhone(mobileNumber1.trim())) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Please provide a valid Mobile Number 1.' });
    }
    if (mobileNumber2 && mobileNumber2.trim() && !isValidPhone(mobileNumber2.trim())) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Mobile Number 2 format is invalid.' });
    }
    if (!shopName || !shopName.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Shop Name is required.' });
    }
    if (!modelNumber || !modelNumber.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Model Number is required.' });
    }
    if (!purchaseDate) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Purchase Date is required.' });
    }

    // Validate Sanitary Ware Complaint Name
    if (!complaintName || !complaintName.trim() || complaintName === 'Select Complaint Name') {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Please select a Complaint Name.' });
    }

    // If "Other" is selected, otherProductName is required
    if (complaintName.trim() === 'Other' && (!otherProductName || !otherProductName.trim())) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Other Product Name is required when "Other" is selected.' });
    }

    if (!complaintDetails || !complaintDetails.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Complaint Details are required.' });
    }
    if (!registeredPersonName || !registeredPersonName.trim()) {
      cleanupUploadedFile();
      return res.status(400).json({ success: false, message: 'Registered Person Name is required.' });
    }

    // Handle optional image upload
    let imageUrl = '';
    let imagePublicId = '';

    if (req.file) {
      if (isCloudinaryConfigured) {
        try {
          const uploadRes = await uploadToCloudinary(req.file.path);
          if (uploadRes) {
            imageUrl = uploadRes.url;
            imagePublicId = uploadRes.publicId;
          }
        } catch (uploadErr) {
          console.warn('[Upload Warning] Cloudinary upload failed, using local storage fallback:', uploadErr.message);
          imageUrl = `/uploads/${req.file.filename}`;
          imagePublicId = req.file.filename;
        }
      } else {
        // Fallback to local server upload URL
        imageUrl = `/uploads/${req.file.filename}`;
        imagePublicId = req.file.filename;
      }
    }

    // Generate unique complaint ID (e.g. CMP-2026-0001)
    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      status: 'REGISTERED',
      registeredAt: new Date(), // Authoritative backend registration timestamp

      // Customer details
      customerName: customerName.trim(),
      address: address.trim(),
      mobileNumber1: mobileNumber1.trim(),
      mobileNumber2: mobileNumber2 ? mobileNumber2.trim() : '',
      shopName: shopName.trim(),

      // Product details
      modelNumber: modelNumber.trim(),
      purchaseDate: new Date(purchaseDate),

      // Sanitary ware complaint details
      complaintName: complaintName.trim(),
      otherProductName: complaintName.trim() === 'Other' && otherProductName ? otherProductName.trim() : '',
      complaintDetails: complaintDetails.trim(),
      imageUrl,
      imagePublicId,
      registeredPersonName: registeredPersonName.trim(),

      // Service details initially null/empty
      servicePersonName: '',
      servicePersonNumber: '',
      attendedDate: null,
      name: '',
      billAmount: null,
      remarks: '',
      completedAt: null,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully.',
      data: complaint,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {}
    }
    next(error);
  }
};

// @desc    Get all registered complaints with search & filters
// @route   GET /api/complaints
// @access  Private
const getRegisteredComplaints = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;

    const query = { status: 'REGISTERED' };

    // Date range filter based on registeredAt / createdAt
    if (startDate || endDate) {
      query.registeredAt = {};
      if (startDate) {
        query.registeredAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.registeredAt.$lte = end;
      }
    }

    // Search filter across ID, customerName, shopName, modelNumber, mobileNumber1, complaintName, otherProductName, complaintDetails, registeredPersonName
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { complaintId: searchRegex },
        { customerName: searchRegex },
        { shopName: searchRegex },
        { modelNumber: searchRegex },
        { mobileNumber1: searchRegex },
        { complaintName: searchRegex },
        { otherProductName: searchRegex },
        { complaintDetails: searchRegex },
        { registeredPersonName: searchRegex },
      ];
    }

    const complaints = await Complaint.find(query)
      .sort({ registeredAt: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all completed complaints with search & filters
// @route   GET /api/complaints/completed
// @access  Private
const getCompletedComplaints = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;

    const query = { status: 'COMPLETED' };

    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) {
        query.completedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.completedAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { complaintId: searchRegex },
        { customerName: searchRegex },
        { shopName: searchRegex },
        { modelNumber: searchRegex },
        { mobileNumber1: searchRegex },
        { complaintName: searchRegex },
        { otherProductName: searchRegex },
        { complaintDetails: searchRegex },
        { servicePersonName: searchRegex },
        { servicePersonNumber: searchRegex },
      ];
    }

    const complaints = await Complaint.find(query)
      .sort({ completedAt: -1, updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint counts & statistics
// @route   GET /api/complaints/stats
// @access  Private
const getComplaintStats = async (req, res, next) => {
  try {
    const [registeredCount, completedCount] = await Promise.all([
      Complaint.countDocuments({ status: 'REGISTERED' }),
      Complaint.countDocuments({ status: 'COMPLETED' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        registeredCount,
        completedCount,
        totalCount: registeredCount + completedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint details
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete complaint with service details
// @route   PATCH /api/complaints/:id/complete
// @access  Private
const markComplaintCompleted = async (req, res, next) => {
  try {
    const {
      servicePersonName,
      servicePersonNumber,
      attendedDate,
      billAmount,
      remarks,
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Complaint is already marked as completed.',
      });
    }

    // Validate Required Service Fields
    if (!servicePersonName || !servicePersonName.trim()) {
      return res.status(400).json({ success: false, message: 'Service Person Name is required.' });
    }

    if (!servicePersonNumber || !servicePersonNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Service Person Number is required.' });
    }
    if (!isValidPhone(servicePersonNumber.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Service Person Number.' });
    }

    if (!attendedDate) {
      return res.status(400).json({ success: false, message: 'Attended Date is required.' });
    }

    const parsedBillAmount = parseFloat(billAmount);
    if (isNaN(parsedBillAmount) || parsedBillAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bill Amount is required and must be a valid non-negative number.',
      });
    }

    // Update Service Details and mark as COMPLETED
    complaint.servicePersonName = servicePersonName.trim();
    complaint.servicePersonNumber = servicePersonNumber.trim();
    complaint.attendedDate = new Date(attendedDate);
    complaint.billAmount = parsedBillAmount;
    complaint.remarks = remarks ? remarks.trim() : '';
    complaint.status = 'COMPLETED';
    complaint.completedAt = new Date(); // Authoritative automatic backend completion timestamp

    // Ensure registeredAt and complaintId remain untouched
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint completed successfully.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
// @access  Private
const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Clean up file if attached
    if (complaint.imagePublicId) {
      if (isCloudinaryConfigured && complaint.imageUrl.includes('cloudinary')) {
        await deleteFromCloudinary(complaint.imagePublicId);
      } else {
        const localPath = path.join(__dirname, '../../uploads', complaint.imagePublicId);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (err) {}
        }
      }
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all completed complaints as PDF
// @route   GET /api/complaints/export/pdf
// @access  Private
const exportCompletedComplaintsPDF = async (req, res, next) => {
  try {
    const completedComplaints = await Complaint.find({ status: 'COMPLETED' })
      .sort({ completedAt: -1 })
      .lean();

    if (!completedComplaints || completedComplaints.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No completed complaints available to export.',
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `completed-complaints-report-${todayStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateCompletedComplaintsPDF(completedComplaints, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getRegisteredComplaints,
  getCompletedComplaints,
  getComplaintStats,
  getComplaintById,
  markComplaintCompleted,
  deleteComplaint,
  exportCompletedComplaintsPDF,
};
