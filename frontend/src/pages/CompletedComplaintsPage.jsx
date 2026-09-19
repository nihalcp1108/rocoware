import React, { useState, useEffect, useCallback } from 'react';
import {
  FileDown,
  CheckCircle2,
  Eye,
  Trash2,
  Calendar,
  User,
  Store,
  Clock,
  Wrench,
  IndianRupee,
  RefreshCw,
  Loader2,
  Droplet,
} from 'lucide-react';
import { toast } from 'sonner';
import { complaintApi } from '../api/complaintApi';
import { SearchBar } from '../components/common/SearchBar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ComplaintDetailsModal } from '../components/modals/ComplaintDetailsModal';

export const CompletedComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Details Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Delete Confirm Dialog
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompletedComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await complaintApi.getCompleted(params);
      if (res.success && res.data) {
        setComplaints(res.data);
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load completed complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [search, startDate, endDate]);

  useEffect(() => {
    fetchCompletedComplaints();
  }, [fetchCompletedComplaints]);

  // PDF Export
  const handleExportPDF = async () => {
    if (complaints.length === 0) {
      toast.error('No completed complaints available to export.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await complaintApi.exportPDF();

      // Create a Blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;

      const todayStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `completed-complaints-report-${todayStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);

      toast.success('PDF report generated successfully.');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to export PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await complaintApi.delete(deleteTargetId);
      toast.success('Complaint record deleted successfully.');
      setDeleteTargetId(null);
      fetchCompletedComplaints();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete complaint record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    return new Date(dateVal).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Completed Complaints
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Archived record of all successfully serviced sanitary ware complaints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCompletedComplaints}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs shadow-emerald-600/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by ID, customer, shop, model, product, technician..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start Date"
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                title="Start Date"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End Date"
                className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                title="End Date"
              />
              {(startDate || endDate || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completed Complaints Table/Cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-xs">
          <LoadingSpinner size="lg" text="Loading completed records..." />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No completed complaints yet"
          description={
            search || startDate || endDate
              ? 'No resolved complaints match your active filter.'
              : 'Complaints marked as completed will be permanently listed and exportable here.'
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden xl:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3.5 py-3.5">Complaint ID</th>
                    <th className="px-3.5 py-3.5">Registered At</th>
                    <th className="px-3.5 py-3.5">Customer Name</th>
                    <th className="px-3.5 py-3.5">Shop Name</th>
                    <th className="px-3.5 py-3.5">Model Number</th>
                    <th className="px-3.5 py-3.5">Complaint Name</th>
                    <th className="px-3.5 py-3.5">Service Person Name</th>
                    <th className="px-3.5 py-3.5">Service Person Number</th>
                    <th className="px-3.5 py-3.5">Attended Date</th>
                    <th className="px-3.5 py-3.5">Bill Amount</th>
                    <th className="px-3.5 py-3.5">Completed Date & Time</th>
                    <th className="px-3.5 py-3.5">Status</th>
                    <th className="px-3.5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {complaints.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Complaint ID */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200">
                          {item.complaintId}
                        </span>
                      </td>

                      {/* Registered Date & Time */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDateTime(item.registeredAt || item.createdAt)}
                      </td>

                      {/* Customer Name */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                          {item.customerName}
                        </div>
                      </td>

                      {/* Shop Name */}
                      <td className="px-3.5 py-3.5">
                        <div className="text-slate-600 truncate max-w-[120px]">
                          {item.shopName}
                        </div>
                      </td>

                      {/* Model Number */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-800">
                        {item.modelNumber}
                      </td>

                      {/* Complaint Name & Other */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Droplet className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span>{item.complaintName || 'N/A'}</span>
                        </div>
                        {item.complaintName === 'Other' && item.otherProductName && (
                          <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200 mt-0.5 inline-block">
                            {item.otherProductName}
                          </span>
                        )}
                      </td>

                      {/* Service Person Name */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-medium text-slate-800">
                        {item.servicePersonName || 'N/A'}
                      </td>

                      {/* Service Person Number */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                        {item.servicePersonNumber || 'N/A'}
                      </td>

                      {/* Attended Date */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDate(item.attendedDate)}
                      </td>

                      {/* Bill Amount */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap font-bold text-emerald-700">
                        ₹{typeof item.billAmount === 'number' ? item.billAmount.toFixed(2) : '0.00'}
                      </td>

                      {/* Completed Date & Time */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-emerald-700 font-medium">
                        {formatDateTime(item.completedAt)}
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED
                        </span>
                      </td>

                      {/* Actions: View */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(item)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item._id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="xl:hidden space-y-3">
            {complaints.map((item) => (
              <div
                key={item._id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {item.complaintId}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      Reg: {formatDateTime(item.registeredAt || item.createdAt)}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    COMPLETED
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {item.complaintName}
                    </span>
                    {item.complaintName === 'Other' && item.otherProductName && (
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {item.otherProductName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <span className="font-semibold text-slate-800">{item.customerName}</span> • Shop: {item.shopName} • Model: <span className="font-semibold text-slate-700">{item.modelNumber}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-medium text-slate-400 block text-[10px] uppercase">Service Person</span>
                    <span className="font-semibold text-slate-800">{item.servicePersonName}</span>
                    {item.servicePersonNumber && (
                      <span className="block text-[11px] text-slate-500">{item.servicePersonNumber}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[10px] uppercase">Attended Date</span>
                    <span>{formatDate(item.attendedDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[10px] uppercase">Bill Amount</span>
                    <span className="font-bold text-emerald-700">
                      ₹{typeof item.billAmount === 'number' ? item.billAmount.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[10px] uppercase">Completed Date</span>
                    <span className="text-emerald-700 font-medium">
                      {formatDateTime(item.completedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleView(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item._id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsModalOpen}
        complaint={selectedComplaint}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedComplaint(null);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Completed Complaint"
        message="Are you sure you want to permanently delete this completed complaint record? This action cannot be undone."
        confirmText="Delete Complaint"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default CompletedComplaintsPage;
