import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  User,
  Phone,
  Calendar,
  IndianRupee,
  FileText,
  Loader2,
  CheckCircle2,
  Building2,
  Droplet,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { complaintApi } from '../../api/complaintApi';

export const CompleteComplaintModal = ({ isOpen, complaint, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    servicePersonName: '',
    servicePersonNumber: '',
    attendedDate: new Date().toISOString().split('T')[0],
    billAmount: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && complaint) {
      setFormData({
        servicePersonName: complaint.servicePersonName || '',
        servicePersonNumber: complaint.servicePersonNumber || '',
        attendedDate: complaint.attendedDate
          ? new Date(complaint.attendedDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        billAmount: complaint.billAmount !== null && complaint.billAmount !== undefined ? String(complaint.billAmount) : '',
        remarks: complaint.remarks || '',
      });
      setErrors({});
    }
  }, [isOpen, complaint]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !complaint) return null;

  const validatePhone = (phone) => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.servicePersonName.trim()) {
      newErrors.servicePersonName = 'Service Person Name is required.';
    }

    if (!formData.servicePersonNumber.trim()) {
      newErrors.servicePersonNumber = 'Service Person Number is required.';
    } else if (!validatePhone(formData.servicePersonNumber.trim())) {
      newErrors.servicePersonNumber = 'Please enter a valid phone number (7-15 digits).';
    }

    if (!formData.attendedDate) {
      newErrors.attendedDate = 'Attended Date is required.';
    }

    const bill = parseFloat(formData.billAmount);
    if (formData.billAmount === '' || isNaN(bill) || bill < 0) {
      newErrors.billAmount = 'Valid non-negative bill amount is required (e.g. 1500).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete all required service details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        servicePersonName: formData.servicePersonName.trim(),
        servicePersonNumber: formData.servicePersonNumber.trim(),
        attendedDate: formData.attendedDate,
        billAmount: parseFloat(formData.billAmount),
        remarks: formData.remarks.trim(),
      };

      await complaintApi.markCompleted(complaint._id, payload);
      toast.success('Complaint completed successfully.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Completion error:', err);
      toast.error(err.friendlyMessage || err.response?.data?.message || 'Failed to complete complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayComplaintName =
    complaint.complaintName === 'Other' && complaint.otherProductName
      ? `Other (${complaint.otherProductName})`
      : complaint.complaintName || 'N/A';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-xl animate-modal-enter flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Complete Complaint</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record service resolution and technician details
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Context Summary Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {complaint.complaintId}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Status: REGISTERED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Customer:</span>
                  <span className="font-semibold text-slate-800">{complaint.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shop:</span>
                  <span className="font-semibold text-slate-800">{complaint.shopName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Complaint Name:</span>
                  <span className="font-semibold text-brand-700">{displayComplaintName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Model Number:</span>
                  <span className="font-semibold text-slate-800">{complaint.modelNumber}</span>
                </div>
              </div>
            </div>

            {/* Service Details Heading */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <Wrench className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Service Details
              </h3>
            </div>

            {/* 1. Service Person Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Service Person Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="servicePersonName"
                  value={formData.servicePersonName}
                  onChange={handleChange}
                  placeholder="Enter service technician name"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.servicePersonName
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
              </div>
              {errors.servicePersonName && (
                <p className="mt-1 text-xs text-rose-500">{errors.servicePersonName}</p>
              )}
            </div>

            {/* 2. Service Person Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Service Person Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="servicePersonNumber"
                  value={formData.servicePersonNumber}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.servicePersonNumber
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
              </div>
              {errors.servicePersonNumber && (
                <p className="mt-1 text-xs text-rose-500">{errors.servicePersonNumber}</p>
              )}
            </div>

            {/* 3. Attended Date & 4. Bill Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Attended Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="attendedDate"
                    value={formData.attendedDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                      errors.attendedDate
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                </div>
                {errors.attendedDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.attendedDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bill Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-semibold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="billAmount"
                    value={formData.billAmount}
                    onChange={handleChange}
                    placeholder="e.g. 1500"
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                      errors.billAmount
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                </div>
                {errors.billAmount && (
                  <p className="mt-1 text-xs text-rose-500">{errors.billAmount}</p>
                )}
              </div>
            </div>

            {/* 5. Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remarks <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                placeholder="Add technician notes, work details, parts replaced, etc."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Complaint</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
