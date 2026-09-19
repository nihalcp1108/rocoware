import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Inbox,
  CheckCircle2,
  Layers,
  Eye,
  Trash2,
  ImageIcon,
  RefreshCw,
  Droplet,
  Clock,
  Calendar,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { complaintApi } from '../api/complaintApi';
import { StatsCard } from '../components/common/StatsCard';
import { SearchBar } from '../components/common/SearchBar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AddComplaintModal } from '../components/modals/AddComplaintModal';
import { ComplaintDetailsModal } from '../components/modals/ComplaintDetailsModal';
import { CompleteComplaintModal } from '../components/modals/CompleteComplaintModal';

export const RegisteredComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ registeredCount: 0, completedCount: 0, totalCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Complete Complaint Service Details Modal state
  const [complaintToComplete, setComplaintToComplete] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Delete Confirm dialog
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const res = await complaintApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Registered Complaints
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await complaintApi.getRegistered(params);
      if (res.success && res.data) {
        setComplaints(res.data);
      }
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to fetch complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [search, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const refreshAll = () => {
    fetchStats();
    fetchComplaints();
  };

  // Actions
  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleOpenCompleteModal = (complaint) => {
    setComplaintToComplete(complaint);
    setIsCompleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await complaintApi.delete(deleteTargetId);
      toast.success('Complaint deleted successfully.');
      setDeleteTargetId(null);
      refreshAll();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete complaint.');
    } finally {
      setIsDeleting(false);
    }
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
      {/* Page Heading & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registered Complaints
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track active sanitary ware complaints and record service resolution when work is completed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshAll}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Complaints"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Complaint</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Active Registered"
          value={stats.registeredCount}
          icon={Inbox}
          color="amber"
          description="Waiting for service completion"
          isLoading={isStatsLoading}
        />
        <StatsCard
          title="Completed Complaints"
          value={stats.completedCount}
          icon={CheckCircle2}
          color="emerald"
          description="Fully serviced and resolved"
          isLoading={isStatsLoading}
        />
        <StatsCard
          title="Total Lifetime"
          value={stats.totalCount}
          icon={Layers}
          color="blue"
          description="All recorded complaints"
          isLoading={isStatsLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by ID, customer, shop, model, sanitary product..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {(search || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints List Container */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner size="lg" text="Loading registered complaints..." />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          title="No active complaints found"
          description={
            search || startDate || endDate
              ? 'No registered complaints match your search and filter criteria.'
              : 'There are currently no active complaints waiting for resolution.'
          }
          action={
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register First Complaint
            </button>
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
                    <th className="px-4 py-3.5">Complaint ID</th>
                    <th className="px-4 py-3.5">Registered Date & Time</th>
                    <th className="px-4 py-3.5">Customer Name</th>
                    <th className="px-4 py-3.5">Shop Name</th>
                    <th className="px-4 py-3.5">Model Number</th>
                    <th className="px-4 py-3.5">Complaint Name</th>
                    <th className="px-4 py-3.5">Mobile Number</th>
                    <th className="px-4 py-3.5">Registered Person</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {complaints.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Complaint ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200">
                          {item.complaintId}
                        </span>
                      </td>

                      {/* 2. Registered Date & Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(item.registeredAt || item.createdAt)}</span>
                        </div>
                      </td>

                      {/* 3. Customer Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                          {item.customerName}
                        </div>
                      </td>

                      {/* 4. Shop Name */}
                      <td className="px-4 py-3.5">
                        <div className="text-slate-700 truncate max-w-[130px]">
                          {item.shopName}
                        </div>
                      </td>

                      {/* 5. Model Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-800">
                        {item.modelNumber}
                      </td>

                      {/* 6. Complaint Name (Sanitary ware product) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span>{item.complaintName || 'N/A'}</span>
                        </div>
                        {item.complaintName === 'Other' && item.otherProductName && (
                          <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 mt-0.5 inline-block">
                            {item.otherProductName}
                          </span>
                        )}
                      </td>

                      {/* 7. Mobile Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                        <div>{item.mobileNumber1}</div>
                        {item.mobileNumber2 && (
                          <div className="text-[10px] text-slate-400">{item.mobileNumber2}</div>
                        )}
                      </td>

                      {/* 8. Registered Person */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                        {item.registeredPersonName}
                      </td>

                      {/* 9. Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          REGISTERED
                        </span>
                      </td>

                      {/* 10. Actions: View, Complete Complaint, Delete */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => handleView(item)}
                            className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Complete Complaint Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Complete Complaint (Record Service Details)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item._id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Complaint"
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

          {/* Mobile & Tablet Card Layout */}
          <div className="xl:hidden space-y-3">
            {complaints.map((item) => (
              <div
                key={item._id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {item.complaintId}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(item.registeredAt || item.createdAt)}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    REGISTERED
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

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500 block text-[10px] uppercase mb-0.5">Complaint Details</span>
                  <p className="line-clamp-2">{item.complaintDetails}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">Mobile:</span> {item.mobileNumber1}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Registered By:</span> {item.registeredPersonName}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleView(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCompleteModal(item)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Complaint
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(item._id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Complaint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 1: Add Complaint Modal (Customer & Complaint form only) */}
      <AddComplaintModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refreshAll}
      />

      {/* View Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsModalOpen}
        complaint={selectedComplaint}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedComplaint(null);
        }}
        onCompleteClick={(complaint) => {
          setIsDetailsModalOpen(false);
          handleOpenCompleteModal(complaint);
        }}
      />

      {/* Stage 2: Complete Complaint Service Details Modal */}
      <CompleteComplaintModal
        isOpen={isCompleteModalOpen}
        complaint={complaintToComplete}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setComplaintToComplete(null);
        }}
        onSuccess={refreshAll}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Complaint"
        message="Are you sure you want to permanently delete this complaint? This action cannot be undone."
        confirmText="Delete Complaint"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default RegisteredComplaintsPage;
