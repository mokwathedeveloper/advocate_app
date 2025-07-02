// Search Controller - LegalPro v1.0.1
// API endpoints for advanced case search and filtering

const CaseSearchService = require('../services/caseSearchService');
const { validationResult } = require('express-validator');
const { USER_ROLES } = require('../config/auth');

/**
 * @desc    Advanced case search
 * @route   GET /api/search/cases
 * @access  Private
 */
const searchCases = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract search parameters from query
    const searchParams = {
      query: req.query.q || req.query.query,
      status: req.query.status,
      caseType: req.query.caseType,
      priority: req.query.priority,
      advocateId: req.query.advocateId,
      clientId: req.query.clientId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      courtName: req.query.courtName,
      tags: req.query.tags,
      isUrgent: req.query.isUrgent,
      progress: req.query.progress,
      billing: req.query.billing,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page,
      limit: req.query.limit,
      includeArchived: req.query.includeArchived
    };

    // Perform search
    const results = await CaseSearchService.searchCases(searchParams, req.user);

    res.status(200).json({
      success: true,
      message: `Found ${results.pagination.total} cases`,
      data: results.cases,
      pagination: results.pagination,
      statistics: results.statistics,
      appliedFilters: results.appliedFilters
    });

  } catch (error) {
    console.error('Search cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search case documents
 * @route   GET /api/search/cases/:caseId/documents
 * @access  Private
 */
const searchCaseDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const documents = await CaseSearchService.searchCaseDocuments(caseId, query.trim(), req.user);

    res.status(200).json({
      success: true,
      message: `Found ${documents.length} documents`,
      data: documents
    });

  } catch (error) {
    console.error('Search documents error:', error);
    
    if (error.message === 'Access denied to case') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search case notes
 * @route   GET /api/search/cases/:caseId/notes
 * @access  Private
 */
const searchCaseNotes = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const notes = await CaseSearchService.searchCaseNotes(caseId, query.trim(), req.user);

    res.status(200).json({
      success: true,
      message: `Found ${notes.length} notes`,
      data: notes
    });

  } catch (error) {
    console.error('Search notes error:', error);
    
    if (error.message === 'Access denied to case') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching notes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get search suggestions
 * @route   GET /api/search/suggestions
 * @access  Private
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const suggestions = await CaseSearchService.getSearchSuggestions(query.trim(), req.user);

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get search filters configuration
 * @route   GET /api/search/filters
 * @access  Private
 */
const getSearchFilters = async (req, res) => {
  try {
    const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
    const User = require('../models/User');

    // Get available filter options
    const filters = {
      status: Object.values(CASE_STATUS).map(status => ({
        value: status,
        label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })),
      caseType: Object.values(CASE_TYPE).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })),
      priority: Object.values(CASE_PRIORITY).map(priority => ({
        value: priority,
        label: priority.charAt(0).toUpperCase() + priority.slice(1)
      })),
      billing: [
        { value: 'pending', label: 'Pending' },
        { value: 'partial', label: 'Partial' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'waived', label: 'Waived' }
      ]
    };

    // Get advocates for filter (if user has permission)
    if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      const advocates = await User.find({
        role: { $in: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN] },
        isActive: true
      })
      .select('firstName lastName email specialization')
      .sort({ firstName: 1 })
      .limit(100);

      filters.advocates = advocates.map(advocate => ({
        value: advocate._id,
        label: `${advocate.firstName} ${advocate.lastName}`,
        email: advocate.email,
        specialization: advocate.specialization
      }));
    }

    // Get clients for filter (if user has permission)
    if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADVOCATE].includes(req.user.role)) {
      const clients = await User.find({
        role: USER_ROLES.CLIENT,
        isActive: true
      })
      .select('firstName lastName email')
      .sort({ firstName: 1 })
      .limit(100);

      filters.clients = clients.map(client => ({
        value: client._id,
        label: `${client.firstName} ${client.lastName}`,
        email: client.email
      }));
    }

    res.status(200).json({
      success: true,
      data: filters
    });

  } catch (error) {
    console.error('Get search filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving search filters',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Save search query
 * @route   POST /api/search/save
 * @access  Private
 */
const saveSearch = async (req, res) => {
  try {
    const { name, searchParams } = req.body;

    if (!name || !searchParams) {
      return res.status(400).json({
        success: false,
        message: 'Search name and parameters are required'
      });
    }

    const savedSearch = await CaseSearchService.saveSearch(req.user, name, searchParams);

    res.status(201).json({
      success: true,
      message: 'Search saved successfully',
      data: savedSearch
    });

  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Global search across all entities
 * @route   GET /api/search/global
 * @access  Private
 */
const globalSearch = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search across cases, documents, and notes
    const [caseResults, suggestions] = await Promise.all([
      CaseSearchService.searchCases({ query: query.trim(), limit: 10 }, req.user),
      CaseSearchService.getSearchSuggestions(query.trim(), req.user)
    ]);

    const results = {
      cases: caseResults.cases,
      suggestions: suggestions.suggestions,
      totalCases: caseResults.pagination.total
    };

    res.status(200).json({
      success: true,
      message: `Global search completed for "${query}"`,
      data: results
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing global search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Export search results
 * @route   POST /api/search/export
 * @access  Private
 */
const exportSearchResults = async (req, res) => {
  try {
    const { searchParams, format = 'csv' } = req.body;

    if (!searchParams) {
      return res.status(400).json({
        success: false,
        message: 'Search parameters are required'
      });
    }

    // Get all results (no pagination for export)
    const results = await CaseSearchService.searchCases({
      ...searchParams,
      limit: 10000 // Large limit for export
    }, req.user);

    // For now, return the data (would implement actual file export)
    res.status(200).json({
      success: true,
      message: `Export prepared with ${results.cases.length} cases`,
      data: {
        cases: results.cases,
        format,
        exportedAt: new Date(),
        totalRecords: results.cases.length
      }
    });

  } catch (error) {
    console.error('Export search results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting search results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  searchCases,
  searchCaseDocuments,
  searchCaseNotes,
  getSearchSuggestions,
  getSearchFilters,
  saveSearch,
  globalSearch,
  exportSearchResults
};
