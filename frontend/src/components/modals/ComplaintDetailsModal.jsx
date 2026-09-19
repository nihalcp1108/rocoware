import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Store,
  Calendar,
  FileText,
  Wrench,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Droplet,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const ComplaintDetailsModal = ({
  isOpen,
  complaint,
  onClose,
  onCompleteClick,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (imageModalOpen) {
          setImageModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, imageModalOpen, onClose]);

  if (!isOpen || !complaint) return null;

  const isCompleted = complaint.status === 'COMPLETED';
  const imgUrl = complaint.imageUrl || complaint.complaintImage;

  // Format date helper
  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    return new Date(dateVal).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format date & time helper
  const formatDateTime = (dateVal) => {
    if (!dateVal) return 'N/A';
    return new Date(dateVal).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl p-5 sm:p-7 animate-modal-enter max-h-[92vh] flex flex-col">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer z-10"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-wrap items-center gap-3 pr-8 pb-4 border-b border-slate-100 flex-shrink-0">
            <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
              {complaint.complaintId}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  COMPLETED
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  REGISTERED
                </>
              )}
            </span>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="overflow-y-auto flex-1 pr-1 -mr-1 py-4 space-y-6">
            {/* 1. Registration Information */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registration Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Complaint ID</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    {complaint.complaintId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Registered Date & Time</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(complaint.registeredAt || complaint.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Registered Person Name</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.registeredPersonName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Customer Information */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <User className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Customer Name</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {complaint.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Shop Name</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.shopName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Number 1</span>
                  <a
                    href={`tel:${complaint.mobileNumber1}`}
                    className="font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    {complaint.mobileNumber1}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mobile Number 2</span>
                  {complaint.mobileNumber2 ? (
                    <a
                      href={`tel:${complaint.mobileNumber2}`}
                      className="font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      {complaint.mobileNumber2}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Address</span>
                  <p className="text-slate-700 whitespace-pre-line mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                    {complaint.address}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Product Information */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Store className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Product Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Model Number</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {complaint.modelNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Purchase Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(complaint.purchaseDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Complaint Information */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Droplet className="w-4 h-4 text-brand-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Complaint Information
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block font-medium">Complaint Name</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-brand-200 text-brand-700 font-semibold mt-1">
                      {complaint.complaintName || 'N/A'}
                    </span>
                  </div>
                  {complaint.complaintName === 'Other' && complaint.otherProductName && (
                    <div>
                      <span className="text-slate-400 block font-medium">Other Product Name</span>
                      <span className="font-semibold text-slate-800 mt-1 block">
                        {complaint.otherProductName}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Complaint Details</span>
                  <p className="text-slate-700 whitespace-pre-line mt-1 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                    {complaint.complaintDetails}
                  </p>
                </div>

                {/* Complaint Image */}
                <div>
                  <span className="text-slate-400 block font-medium mb-1.5">Complaint Image</span>
                  {imgUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={imgUrl}
                        alt="Complaint"
                        onClick={() => setImageModalOpen(true)}
                        className="h-28 w-28 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setImageModalOpen(true)}
                        className="absolute bottom-1.5 right-1.5 bg-black/60 text-white p-1 rounded-md hover:bg-black/80 transition-colors"
                        title="View full image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No image uploaded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Service Information */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 text-slate-800">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Service Information
                  </h3>
                </div>

                {/* Status indicator */}
                {!isCompleted && onCompleteClick && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCompleteClick(complaint);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete Complaint
                  </button>
                )}
              </div>

              {!isCompleted ? (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-900">Service Not Completed Yet</h4>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                    This complaint is currently REGISTERED. Technician service details will be recorded once service work is completed.
                  </p>
                  {onCompleteClick && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onCompleteClick(complaint);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete Complaint Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Service Person Name</span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {complaint.servicePersonName || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Service Person Number</span>
                    {complaint.servicePersonNumber ? (
                      <a
                        href={`tel:${complaint.servicePersonNumber}`}
                        className="font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {complaint.servicePersonNumber}
                      </a>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Attended Date</span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(complaint.attendedDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Bill Amount</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{typeof complaint.billAmount === 'number' ? complaint.billAmount.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Completed Date & Time</span>
                    <span className="font-semibold text-emerald-700">
                      {formatDateTime(complaint.completedAt)}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-medium">Remarks</span>
                    <p className="text-slate-700 whitespace-pre-line mt-0.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      {complaint.remarks || 'No remarks provided.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Full Image Preview Modal */}
      {imageModalOpen && imgUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imgUrl}
              alt="Complaint Full Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
