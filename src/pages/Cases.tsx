// Enhanced Cases management page for LegalPro v1.0.1 - With Loading & Error Handling
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Edit,
  Trash2,
  Eye,
  Tag,
  Flag,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi, useFormSubmission } from '../hooks/useApi';
import { apiService } from '../services/apiService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { LoadingOverlay, SkeletonCard, SkeletonTable } from '../components/ui/LoadingStates';
import { ErrorBoundary, InlineError } from '../components/ui/ErrorHandling';
import toast from 'react-hot-toast';

interface CaseFormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientId?: string;
}

const Cases: React.FC = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // API hooks for cases data
  const {
    data: cases,
    loading: casesLoading,
    error: casesError,
    retry: retryCases
  } = useApi(
    () => apiService.getCases({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined
    }),
    [searchTerm, statusFilter, priorityFilter]
  );

  // Form submission hook
  const {
    loading: submitting,
    error: submitError,
    submit: submitCase
  } = useFormSubmission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CaseFormData>();

  // Mock cases data - replace with API call
  const mockCases = [
    {
      id: '1',
      caseNumber: 'CASE-2024-001',
      title: 'Property Dispute Resolution',
      description: 'Boundary dispute between neighboring properties requiring legal intervention and mediation.',
      category: 'Property Law',
      status: 'in_progress',
      priority: 'high',
      clientId: user?.id,
      clientName: user ? `${user.firstName} ${user.lastName}` : 'John Doe',
      assignedTo: 'John Kamau',
      courtDate: '2024-04-15',
      createdAt: '2024-03-01',
      updatedAt: '2024-03-10',
      documents: [
        { id: '1', name: 'Property_Deed.pdf', type: 'pdf', size: 2048000, uploadedAt: '2024-03-05' },
        { id: '2', name: 'Survey_Report.pdf', type: 'pdf', size: 1536000, uploadedAt: '2024-03-08' }
      ],
      notes: [
        { id: '1', content: 'Initial consultation completed. Client provided all necessary documents.', author: 'John Kamau', createdAt: '2024-03-02' },
        { id: '2', content: 'Site visit scheduled for next week to assess the boundary dispute.', author: 'John Kamau', createdAt: '2024-03-05' }
      ],
      timeline: [
        { event: 'case_created', description: 'Case opened', date: '2024-03-01' },
        { event: 'documents_uploaded', description: 'Property documents uploaded', date: '2024-03-05' },
        { event: 'court_date_set', description: 'Court hearing scheduled', date: '2024-03-10' }
      ]
    },
    {
      id: '2',
      caseNumber: 'CASE-2024-002',
      title: 'Employment Contract Review',
      description: 'Review and negotiation of employment contract terms and conditions.',
      category: 'Employment Law',
      status: 'pending',
      priority: 'medium',
      clientId: user?.id,
      clientName: user ? `${user.firstName} ${user.lastName}` : 'Jane Smith',
      assignedTo: 'Sarah Wanjiku',
      courtDate: null,
      createdAt: '2024-03-05',
      updatedAt: '2024-03-08',
      documents: [
        { id: '3', name: 'Employment_Contract.pdf', type: 'pdf', size: 1024000, uploadedAt: '2024-03-06' }
      ],
      notes: [
        { id: '3', content: 'Contract terms reviewed. Several clauses need modification.', author: 'Sarah Wanjiku', createdAt: '2024-03-07' }
      ],
      timeline: [
        { event: 'case_created', description: 'Case opened', date: '2024-03-05' },
        { event: 'documents_uploaded', description: 'Contract uploaded for review', date: '2024-03-06' }
      ]
    },
    {
      id: '3',
      caseNumber: 'CASE-2024-003',
      title: 'Family Custody Agreement',
      description: 'Child custody arrangement and support agreement negotiation.',
      category: 'Family Law',
      status: 'completed',
      priority: 'high',
      clientId: user?.id,
      clientName: user ? `${user.firstName} ${user.lastName}` : 'Mike Johnson',
      assignedTo: 'Sarah Wanjiku',
      courtDate: '2024-02-20',
      createdAt: '2024-01-15',
      updatedAt: '2024-02-25',
      documents: [
        { id: '4', name: 'Custody_Agreement.pdf', type: 'pdf', size: 1800000, uploadedAt: '2024-02-18' },
        { id: '5', name: 'Financial_Statement.pdf', type: 'pdf', size: 900000, uploadedAt: '2024-02-10' }
      ],
      notes: [
        { id: '4', content: 'Custody agreement finalized and approved by court.', author: 'Sarah Wanjiku', createdAt: '2024-02-22' }
      ],
      timeline: [
        { event: 'case_created', description: 'Case opened', date: '2024-01-15' },
        { event: 'court_hearing', description: 'Court hearing attended', date: '2024-02-20' },
        { event: 'case_closed', description: 'Case successfully resolved', date: '2024-02-25' }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCases(mockCases);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
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

  const onSubmit = async (data: CaseFormData) => {
    try {
      // API call to create case
      console.log('Creating case:', data);
      toast.success('Case created successfully!');
      reset();
      setShowCreateForm(false);
    } catch (error) {
      toast.error('Failed to create case');
    }
  };

  const filteredCases = cases.filter(case_item => {
    const matchesSearch = case_item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || case_item.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <Button variant="outline" className="flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map((case_item, index) => (
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
                    <span>{case_item.assignedTo}</span>
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

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
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
                          <p className="text-gray-900">{selectedCase.assignedTo}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Client</label>
                          <p className="text-gray-900">{selectedCase.clientName}</p>
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
                        {selectedCase.timeline.map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-navy-800 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-900">{event.description}</p>
                              <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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