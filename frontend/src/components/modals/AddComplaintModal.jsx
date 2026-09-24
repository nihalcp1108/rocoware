import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Calendar,
  User,
  Phone,
  Store,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  Droplet,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { complaintApi } from '../../api/complaintApi';
import {
  SANITARY_WARE_PRODUCTS,
  DEFAULT_COMPLAINT_NAME_PLACEHOLDER,
} from '../../constants/sanitaryProducts';

export const AddComplaintModal = ({ isOpen, onClose, onSuccess }) => {
  const initialFormState = {
    customerName: '',
    address: '',
    mobileNumber1: '',
    mobileNumber2: '',
    shopName: '',
    modelNumber: '',
    purchaseDate: '',
    complaintName: '',
    otherProductName: '',
    complaintDetails: '',
    registeredPersonName: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDisplayTime, setCurrentDisplayTime] = useState('');
  const [shopSuggestions, setShopSuggestions] = useState([]);
  const [isSearchingShops, setIsSearchingShops] = useState(false);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);
  const fileInputRef = useRef(null);
  const shopContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Update current live time whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentDisplayTime(
        now.toLocaleString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    }
  }, [isOpen]);

  // Handle click outside to close shop suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shopContainerRef.current && !shopContainerRef.current.contains(e.target)) {
        setShowShopSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

  const handleClose = () => {
    setFormData(initialFormState);
    setSelectedFile(null);
    setShopSuggestions([]);
    setShowShopSuggestions(false);
    setIsSearchingShops(false);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrors({});
    onClose();
  };

  const validatePhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleComplaintNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      complaintName: value,
      // When changed from "Other" to another product, hide and clear the Other Product Name field
      otherProductName: value === 'Other' ? prev.otherProductName : '',
    }));
    if (errors.complaintName) {
      setErrors((prev) => ({ ...prev, complaintName: '' }));
    }
    if (value !== 'Other' && errors.otherProductName) {
      setErrors((prev) => ({ ...prev, otherProductName: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleShopNameChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, shopName: value }));
    if (errors.shopName) {
      setErrors((prev) => ({ ...prev, shopName: '' }));
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      setIsSearchingShops(true);
      setShowShopSuggestions(true);
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const res = await complaintApi.searchShops(trimmed);
          if (res.success && Array.isArray(res.data)) {
            setShopSuggestions(res.data);
          } else {
            setShopSuggestions([]);
          }
        } catch (err) {
          console.error('Shop search error:', err);
          setShopSuggestions([]);
        } finally {
          setIsSearchingShops(false);
        }
      }, 300);
    } else {
      setShopSuggestions([]);
      setShowShopSuggestions(false);
      setIsSearchingShops(false);
    }
  };

  const handleSelectShop = (shop) => {
    setFormData((prev) => ({
      ...prev,
      shopName: shop.shopName || '',
      address: shop.address || prev.address,
      mobileNumber1: shop.mobileNumber1 || prev.mobileNumber1,
      mobileNumber2: shop.mobileNumber2 || prev.mobileNumber2,
    }));
    setShowShopSuggestions(false);
    setErrors((prev) => ({
      ...prev,
      shopName: '',
      ...(shop.address && { address: '' }),
      ...(shop.mobileNumber1 && { mobileNumber1: '' }),
      ...(shop.mobileNumber2 && { mobileNumber2: '' }),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image size must be less than 5MB.' }));
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Only JPG, PNG, and WEBP image formats are supported.',
      }));
      return;
    }

    setSelectedFile(file);
    setErrors((prev) => ({ ...prev, image: '' }));

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate Registration Form
  const validateForm = () => {
    const newErrors = {};

    // 1. Customer Name
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer Name is required.';
    }

    // 2. Address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required.';
    }

    // 3. Mobile Number 1
    if (!formData.mobileNumber1.trim()) {
      newErrors.mobileNumber1 = 'Mobile Number 1 is required.';
    } else if (!validatePhone(formData.mobileNumber1.trim())) {
      newErrors.mobileNumber1 = 'Please enter a valid phone number (7-15 digits).';
    }

    // 4. Mobile Number 2 (Optional)
    if (formData.mobileNumber2.trim() && !validatePhone(formData.mobileNumber2.trim())) {
      newErrors.mobileNumber2 = 'Please enter a valid alternate phone number.';
    }

    // 5. Shop Name
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop Name is required.';
    }

    // 6. Model Number
    if (!formData.modelNumber.trim()) {
      newErrors.modelNumber = 'Model Number is required.';
    }

    // 7. Purchase Date (Optional - no validation error)

    // 8. Complaint Name (Dropdown)
    if (
      !formData.complaintName ||
      formData.complaintName === DEFAULT_COMPLAINT_NAME_PLACEHOLDER
    ) {
      newErrors.complaintName = 'Please select a sanitary ware product.';
    }

    // 9. Other Product Name (Required if Other)
    if (formData.complaintName === 'Other' && !formData.otherProductName.trim()) {
      newErrors.otherProductName = 'Other Product Name is required when "Other" is selected.';
    }

    // 10. Complaint Details
    if (!formData.complaintDetails.trim()) {
      newErrors.complaintDetails = 'Complaint Details are required.';
    }

    // 11. Registered Person Name
    if (!formData.registeredPersonName.trim()) {
      newErrors.registeredPersonName = 'Registered Person Name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all highlighted errors in the form.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();

      // Customer Information
      data.append('customerName', formData.customerName.trim());
      data.append('address', formData.address.trim());
      data.append('mobileNumber1', formData.mobileNumber1.trim());
      if (formData.mobileNumber2.trim()) {
        data.append('mobileNumber2', formData.mobileNumber2.trim());
      }
      data.append('shopName', formData.shopName.trim());

      // Product Information
      data.append('modelNumber', formData.modelNumber.trim());
      if (formData.purchaseDate) {
        data.append('purchaseDate', formData.purchaseDate);
      }

      // Complaint Information
      data.append('complaintName', formData.complaintName);
      if (formData.complaintName === 'Other' && formData.otherProductName.trim()) {
        data.append('otherProductName', formData.otherProductName.trim());
      }
      data.append('complaintDetails', formData.complaintDetails.trim());
      data.append('registeredPersonName', formData.registeredPersonName.trim());

      // Optional Complaint Image
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      await complaintApi.create(data);

      toast.success('Complaint registered successfully.');
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Registration error:', err);
      // Keep modal open, preserve entered values, show error toast
      toast.error(
        err.friendlyMessage ||
          err.response?.data?.message ||
          'Failed to register complaint. Please check your inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && handleClose()}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-2xl animate-modal-enter flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Register New Complaint
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter customer and sanitary ware product complaint information
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* 1. Registered Date & Time — AUTOMATIC / READ ONLY */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                    Registered Date & Time
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentDisplayTime || 'Current System Date & Time'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200/70 px-2.5 py-1 rounded-md self-start sm:self-center">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Automatic / Read-Only</span>
              </div>
            </div>

            {/* Customer Information Header */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Customer Information
              </h3>
            </div>

            {/* 2. Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer full name"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                  errors.customerName
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                }`}
              />
              {errors.customerName && (
                <p className="mt-1 text-xs text-rose-500">{errors.customerName}</p>
              )}
            </div>

            {/* 3. Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                placeholder="Enter complete customer address"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all resize-none ${
                  errors.address
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                }`}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-rose-500">{errors.address}</p>
              )}
            </div>

            {/* 4. Mobile Number 1 & 5. Mobile Number 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number 1 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="mobileNumber1"
                    value={formData.mobileNumber1}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                      errors.mobileNumber1
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                </div>
                {errors.mobileNumber1 && (
                  <p className="mt-1 text-xs text-rose-500">{errors.mobileNumber1}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number 2 <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="mobileNumber2"
                    value={formData.mobileNumber2}
                    onChange={handleInputChange}
                    placeholder="Alternate contact number"
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                      errors.mobileNumber2
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                </div>
                {errors.mobileNumber2 && (
                  <p className="mt-1 text-xs text-rose-500">{errors.mobileNumber2}</p>
                )}
              </div>
            </div>

            {/* 6. Shop Name with Autocomplete */}
            <div ref={shopContainerRef} className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Shop Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleShopNameChange}
                  onFocus={() => {
                    if (formData.shopName.trim().length >= 2) {
                      setShowShopSuggestions(true);
                    }
                  }}
                  autoComplete="off"
                  placeholder="Dealer / Store name where purchased"
                  className={`w-full pl-9 pr-9 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.shopName
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
                {isSearchingShops && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  </div>
                )}
              </div>
              {errors.shopName && (
                <p className="mt-1 text-xs text-rose-500">{errors.shopName}</p>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showShopSuggestions && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-52 overflow-y-auto">
                  {isSearchingShops ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                      <span>Searching existing shops...</span>
                    </div>
                  ) : shopSuggestions.length > 0 ? (
                    <ul className="divide-y divide-slate-100 text-left">
                      {shopSuggestions.map((shop, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleSelectShop(shop)}
                          className="p-2.5 hover:bg-brand-50/60 cursor-pointer transition-colors"
                        >
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {shop.shopName}
                          </p>
                          {(shop.address || shop.mobileNumber1) && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {shop.address}{shop.address && shop.mobileNumber1 ? ' • ' : ''}{shop.mobileNumber1}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No existing shop found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product & Complaint Information Header */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Droplet className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product & Complaint Details
              </h3>
            </div>

            {/* 7. Model Number & 8. Purchase Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Model Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="modelNumber"
                  value={formData.modelNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. WHC-102"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.modelNumber
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
                {errors.modelNumber && (
                  <p className="mt-1 text-xs text-rose-500">{errors.modelNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purchase Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                      errors.purchaseDate
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                  />
                </div>
                {errors.purchaseDate && (
                  <p className="mt-1 text-xs text-rose-500">{errors.purchaseDate}</p>
                )}
              </div>
            </div>

            {/* 9. Complaint Name (Sanitary Ware Dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complaint Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="complaintName"
                  value={formData.complaintName}
                  onChange={handleComplaintNameChange}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 transition-all cursor-pointer ${
                    errors.complaintName
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                >
                  <option value="" disabled>
                    {DEFAULT_COMPLAINT_NAME_PLACEHOLDER}
                  </option>
                  {SANITARY_WARE_PRODUCTS.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </div>
              {errors.complaintName && (
                <p className="mt-1 text-xs text-rose-500">{errors.complaintName}</p>
              )}
            </div>

            {/* 10. Other Product Name (Only when Other selected) */}
            {formData.complaintName === 'Other' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Other Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="otherProductName"
                  value={formData.otherProductName}
                  onChange={handleInputChange}
                  placeholder="Specify sanitary ware product name"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.otherProductName
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
                {errors.otherProductName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.otherProductName}</p>
                )}
              </div>
            )}

            {/* 11. Complaint Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complaint Details <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="complaintDetails"
                value={formData.complaintDetails}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe the issue with the sanitary ware product (e.g. Water leakage from bottom portion)"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none ${
                  errors.complaintDetails
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200'
                }`}
              />
              {errors.complaintDetails && (
                <p className="mt-1 text-xs text-rose-500">{errors.complaintDetails}</p>
              )}
            </div>

            {/* 12. Registered Person Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Person Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="registeredPersonName"
                  value={formData.registeredPersonName}
                  onChange={handleInputChange}
                  placeholder="Enter your name / portal operator name"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 transition-all ${
                    errors.registeredPersonName
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  }`}
                />
              </div>
              {errors.registeredPersonName && (
                <p className="mt-1 text-xs text-rose-500">{errors.registeredPersonName}</p>
              )}
            </div>

            {/* 13. Complaint Image (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complaint Image <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-brand-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to upload product image
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Complaint Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                        {selectedFile?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-brand-600 hover:text-brand-700 font-semibold px-2.5 py-1 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 transition-colors cursor-pointer"
                    >
                      Replace
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {errors.image && (
                <p className="mt-1 text-xs text-rose-500">{errors.image}</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Complaint</span>
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
