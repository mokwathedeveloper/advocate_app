// Cases management page for LegalPro v1.0.1
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  MessageSquare,
  Tag,
  Flag,
  SortAsc,
  SortDesc,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { caseService, CaseFilters } from '../services/caseService';
import { Case } from '../types';
import toast from 'react-hot-toast';

interface CaseFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientId: string;
  assignedTo?: string;
  courtDate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CATEGORIES = [
  'Family Law',
  'Corporate Law',
  'Criminal Defense',
  'Property Law',
  'Employment Law',
  'Constitutional Law',
  'Tax Law',
  'Immigration Law',
  'Intellectual Property',
  'Environmental Law'
];

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

// Utility functions
const getStatusColor = (status: string): string => {
  const statusInfo = STATUSES.find(s => s.value === status);
  return statusInfo?.color || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority: string): string => {
  const priorityInfo = PRIORITIES.find(p => p.value === priority);
  return priorityInfo?.color || 'bg-gray-100 text-gray-800';
};



const Cases: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showFilters, setShowFilters] = useState(false);



  // Filter state
  const [filters, setFilters] = useState<CaseFilters>({
    search: '',
    status: '',
    category: '',
    priority: '',
    assignedTo: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaseFormData>();

  // Load cases from API
  const loadCases = useCallback(async (newFilters?: Partial<CaseFilters>) => {
    try {
      setLoading(true);
      const currentFilters = { ...filters, ...newFilters };
      const response = await caseService.getCases(currentFilters);

      setCases(response.data);

      if (newFilters) {
        setFilters(currentFilters);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh cases
  const refreshCases = async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
    toast.success('Cases refreshed');
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof CaseFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    loadCases(newFilters);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };



  // Handle sorting
  const handleSort = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    loadCases({ sortBy, sortOrder: newSortOrder });
  };

  // Load cases on component mount
  useEffect(() => {
    loadCases();
  }, []);



  // Case management functions
  const handleCreateCase = async (data: CaseFormData) => {
    try {
      await caseService.createCase(data);
      toast.success('Case created successfully');
      setShowCreateForm(false);
      reset();
      await loadCases();
    } catch (error: any) {
      console.error('Failed to create case:', error);
      toast.error(error.message || 'Failed to create case');
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!window.confirm('Are you sure you want to archive this case?')) {
      return;
    }

    try {
      await caseService.deleteCase(caseId);
      toast.success('Case archived successfully');
      await loadCases();
    } catch (error: any) {
      console.error('Failed to archive case:', error);
      toast.error(error.message || 'Failed to archive case');
    }
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      await caseService.updateCaseStatus(caseId, newStatus);
      toast.success('Case status updated successfully');
      await loadCases();
    } catch (error: any) {
      console.error('Failed to update case status:', error);
      toast.error(error.message || 'Failed to update case status');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <Flag className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      category: '',
      priority: '',
      assignedTo: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };
    loadCases(clearedFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy-800 mb-2">
              {user?.role === 'client' ? 'My Cases' : 'Case Management'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'client' 
                ? 'Track the progress of your legal cases and view important updates'
                : 'Manage all legal cases, track progress, and collaborate with clients'
              }
            </p>
          </div>
          {user?.role !== 'client' && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 md:mt-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cases..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
              >
                <option value="">All Status</option>
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
              >
                <option value="">All Priority</option>
                {PRIORITIES.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshCases}
                disabled={refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {(filters.search || filters.status || filters.category || filters.priority) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
                      >
                        <option value="createdAt">Created Date</option>
                        <option value="updatedAt">Updated Date</option>
                        <option value="title">Title</option>
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSort(filters.sortBy || 'createdAt')}
                        className="px-3"
                      >
                        {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Results Per Page</label>
                    <select
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.map((case_item: Case, index: number) => (
            <motion.div
              key={case_item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="p-6 h-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCase(case_item)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-mono text-gray-500">{case_item.caseNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_item.status)}`}>
                        {case_item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-navy-800 mb-2">{case_item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{case_item.description}</p>
                  </div>
                  <div className={`flex items-center space-x-1 ${getPriorityColor(case_item.priority)}`}>
                    {getPriorityIcon(case_item.priority)}
                    <span className="text-xs font-medium capitalize">{case_item.priority}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2" />
                    <span>{case_item.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      {case_item.assignedTo
                        ? typeof case_item.assignedTo === 'string'
                          ? case_item.assignedTo
                          : `${case_item.assignedTo.firstName} ${case_item.assignedTo.lastName}`
                        : 'Unassigned'
                      }
                    </span>
                  </div>
                  {case_item.courtDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Court: {new Date(case_item.courtDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {case_item.documents.length} docs
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {case_item.notes.length} notes
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated {new Date(case_item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {cases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600">
              {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                ? 'Try adjusting your search criteria'
                : 'No cases have been created yet'
              }
            </p>
          </div>
        )}

        {/* Case Details Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-800">{selectedCase.title}</h2>
                    <p className="text-gray-600">{selectedCase.caseNumber}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Case Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-3">Case Description</h3>
                      <p className="text-gray-600">{selectedCase.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-3">Documents</h3>
                      <div className="space-y-2">
                        {selectedCase.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{doc.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-3">Case Notes</h3>
                      <div className="space-y-3">
                        {selectedCase.notes.map((note) => (
                          <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{note.author}</span>
                              <span className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Case Info Sidebar */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-3">Case Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCase.status)}`}>
                            {selectedCase.status.replace('_', ' ')}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Priority</label>
                          <div className={`flex items-center space-x-1 ${getPriorityColor(selectedCase.priority)}`}>
                            {getPriorityIcon(selectedCase.priority)}
                            <span className="text-sm font-medium capitalize">{selectedCase.priority}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Category</label>
                          <p className="text-gray-900">{selectedCase.category}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Assigned To</label>
                          <p className="text-gray-900">
                            {selectedCase.assignedTo
                              ? typeof selectedCase.assignedTo === 'string'
                                ? selectedCase.assignedTo
                                : `${selectedCase.assignedTo.firstName} ${selectedCase.assignedTo.lastName}`
                              : 'Unassigned'
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Client</label>
                          <p className="text-gray-900">
                            {selectedCase.clientId
                              ? typeof selectedCase.clientId === 'string'
                                ? selectedCase.clientId
                                : `${selectedCase.clientId.firstName} ${selectedCase.clientId.lastName}`
                              : 'Unknown Client'
                            }
                          </p>
                        </div>
                        {selectedCase.courtDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Court Date</label>
                            <p className="text-gray-900">{new Date(selectedCase.courtDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy-800 mb-3">Timeline</h3>
                      <div className="space-y-3">
                        {selectedCase.timeline.map((event: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-navy-800 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-900">{event.description}</p>
                              <p className="text-sm text-gray-500">{new Date(event.date || event.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Case Modal */}
        {showCreateForm && user?.role !== 'client' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-800">Create New Case</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateCase)} className="space-y-6">
                <Input
                  label="Case Title"
                  error={errors.title?.message}
                  {...register('title', { required: 'Title is required' })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    placeholder="Describe the case details..."
                    {...register('description', { required: 'Description is required' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      {...register('category', { required: 'Category is required' })}
                    >
                      <option value="">Select category</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Corporate Law">Corporate Law</option>
                      <option value="Criminal Defense">Criminal Defense</option>
                      <option value="Property Law">Property Law</option>
                      <option value="Employment Law">Employment Law</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      {...register('priority', { required: 'Priority is required' })}
                    >
                      <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {errors.priority && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Case
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;