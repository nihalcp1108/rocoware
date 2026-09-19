const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    // Identification
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'COMPLETED'],
      default: 'REGISTERED',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Customer details
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    mobileNumber1: {
      type: String,
      required: [true, 'Mobile number 1 is required'],
      trim: true,
    },
    mobileNumber2: {
      type: String,
      default: '',
      trim: true,
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },

    // Product details
    modelNumber: {
      type: String,
      required: [true, 'Model number is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },

    // Sanitary ware complaint details
    complaintName: {
      type: String,
      required: [true, 'Complaint name is required'],
      trim: true,
    },
    otherProductName: {
      type: String,
      default: '',
      trim: true,
    },
    complaintDetails: {
      type: String,
      required: [true, 'Complaint details are required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    registeredPersonName: {
      type: String,
      required: [true, 'Registered person name is required'],
      trim: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // Service details (populated upon complaint completion)
    servicePersonName: {
      type: String,
      default: '',
      trim: true,
    },
    servicePersonNumber: {
      type: String,
      default: '',
      trim: true,
    },
    attendedDate: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    billAmount: {
      type: Number,
      default: null,
      min: [0, 'Bill amount cannot be negative'],
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for complaintImage to match API naming seamlessly
complaintSchema.virtual('complaintImage').get(function () {
  return this.imageUrl;
});

// Text indexing for fast search
complaintSchema.index({
  complaintId: 'text',
  customerName: 'text',
  shopName: 'text',
  modelNumber: 'text',
  mobileNumber1: 'text',
  complaintName: 'text',
  otherProductName: 'text',
  complaintDetails: 'text',
  registeredPersonName: 'text',
  servicePersonName: 'text',
  servicePersonNumber: 'text',
});

module.exports = mongoose.model('Complaint', complaintSchema);
