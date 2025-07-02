// Case Search Service - LegalPro v1.0.1
// Advanced search and filtering functionality for legal cases

const Case = require('../models/Case');
const CaseDocument = require('../models/CaseDocument');
const CaseNote = require('../models/CaseNote');
const User = require('../models/User');
const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
const { USER_ROLES } = require('../config/auth');

class CaseSearchService {
  /**
   * Advanced case search with multiple filters and full-text search
   * @param {Object} searchParams - Search parameters
   * @param {Object} user - User performing the search
   * @returns {Object} - Search results with pagination
   */
  static async searchCases(searchParams, user) {
    try {
      const {
        query,           // Text search query
        status,          // Case status filter
        caseType,        // Case type filter
        priority,        // Priority filter
        advocateId,      // Advocate filter
        clientId,        // Client filter
        dateFrom,        // Date range start
        dateTo,          // Date range end
        courtName,       // Court name filter
        tags,            // Tags filter
        isUrgent,        // Urgent cases filter
        progress,        // Progress range filter
        billing,         // Billing status filter
        sortBy,          // Sort field
        sortOrder,       // Sort direction
        page,            // Page number
        limit,           // Results per page
        includeArchived  // Include archived cases
      } = searchParams;

      // Build base query with user access control
      let baseQuery = this.buildUserAccessQuery(user);

      // Add archived filter
      if (!includeArchived) {
        baseQuery.isArchived = false;
        baseQuery.isActive = true;
      }

      // Build search filters
      const filters = this.buildSearchFilters({
        status,
        caseType,
        priority,
        advocateId,
        clientId,
        dateFrom,
        dateTo,
        courtName,
        tags,
        isUrgent,
        progress,
        billing
      });

      // Combine base query with filters
      const searchQuery = { ...baseQuery, ...filters };

      // Handle text search
      if (query && query.trim()) {
        const textSearchQuery = this.buildTextSearchQuery(query.trim());
        if (textSearchQuery.$or) {
          searchQuery.$and = [
            { $or: textSearchQuery.$or },
            ...(searchQuery.$and || [])
          ];
        } else {
          Object.assign(searchQuery, textSearchQuery);
        }
      }

      // Build sort options
      const sortOptions = this.buildSortOptions(sortBy, sortOrder);

      // Pagination
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      // Execute search
      const [cases, totalCount] = await Promise.all([
        Case.find(searchQuery)
          .populate('client.primary', 'firstName lastName email phone')
          .populate('client.additional', 'firstName lastName email')
          .populate('advocate.primary', 'firstName lastName email specialization')
          .populate('advocate.secondary', 'firstName lastName email')
          .populate('createdBy', 'firstName lastName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Case.countDocuments(searchQuery)
      ]);

      // Get search statistics
      const statistics = await this.getSearchStatistics(searchQuery);

      return {
        cases,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
          hasNext: pageNum < Math.ceil(totalCount / limitNum),
          hasPrev: pageNum > 1
        },
        statistics,
        query: searchQuery,
        appliedFilters: this.getAppliedFilters(searchParams)
      };

    } catch (error) {
      console.error('Case search error:', error);
      throw error;
    }
  }

  /**
   * Build user access control query
   * @param {Object} user - User object
   * @returns {Object} - Base query for user access
   */
  static buildUserAccessQuery(user) {
    if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
      return {}; // Admin can see all cases
    }

    if (user.role === USER_ROLES.ADVOCATE) {
      return {
        $or: [
          { 'advocate.primary': user._id },
          { 'advocate.secondary': user._id }
        ]
      };
    }

    if (user.role === USER_ROLES.CLIENT) {
      return {
        $or: [
          { 'client.primary': user._id },
          { 'client.additional': user._id }
        ]
      };
    }

    return { _id: null }; // No access for other roles
  }

  /**
   * Build search filters from parameters
   * @param {Object} filterParams - Filter parameters
   * @returns {Object} - MongoDB query filters
   */
  static buildSearchFilters(filterParams) {
    const filters = {};

    // Status filter
    if (filterParams.status) {
      if (Array.isArray(filterParams.status)) {
        filters.status = { $in: filterParams.status };
      } else {
        filters.status = filterParams.status;
      }
    }

    // Case type filter
    if (filterParams.caseType) {
      if (Array.isArray(filterParams.caseType)) {
        filters.caseType = { $in: filterParams.caseType };
      } else {
        filters.caseType = filterParams.caseType;
      }
    }

    // Priority filter
    if (filterParams.priority) {
      if (Array.isArray(filterParams.priority)) {
        filters.priority = { $in: filterParams.priority };
      } else {
        filters.priority = filterParams.priority;
      }
    }

    // Advocate filter
    if (filterParams.advocateId) {
      filters.$or = [
        { 'advocate.primary': filterParams.advocateId },
        { 'advocate.secondary': filterParams.advocateId }
      ];
    }

    // Client filter
    if (filterParams.clientId) {
      if (!filters.$or) filters.$or = [];
      filters.$or.push(
        { 'client.primary': filterParams.clientId },
        { 'client.additional': filterParams.clientId }
      );
    }

    // Date range filter
    if (filterParams.dateFrom || filterParams.dateTo) {
      filters.dateCreated = {};
      if (filterParams.dateFrom) {
        filters.dateCreated.$gte = new Date(filterParams.dateFrom);
      }
      if (filterParams.dateTo) {
        filters.dateCreated.$lte = new Date(filterParams.dateTo);
      }
    }

    // Court name filter
    if (filterParams.courtName) {
      filters['courtDetails.courtName'] = {
        $regex: filterParams.courtName,
        $options: 'i'
      };
    }

    // Tags filter
    if (filterParams.tags) {
      const tagsArray = Array.isArray(filterParams.tags) 
        ? filterParams.tags 
        : filterParams.tags.split(',').map(tag => tag.trim());
      filters.tags = { $in: tagsArray };
    }

    // Urgent filter
    if (filterParams.isUrgent !== undefined) {
      filters.isUrgent = filterParams.isUrgent === 'true' || filterParams.isUrgent === true;
    }

    // Progress filter
    if (filterParams.progress) {
      const progressRange = filterParams.progress.split('-');
      if (progressRange.length === 2) {
        filters.progress = {
          $gte: parseInt(progressRange[0]),
          $lte: parseInt(progressRange[1])
        };
      }
    }

    // Billing status filter
    if (filterParams.billing) {
      filters['billing.paymentStatus'] = filterParams.billing;
    }

    return filters;
  }

  /**
   * Build text search query
   * @param {String} query - Search query
   * @returns {Object} - Text search query
   */
  static buildTextSearchQuery(query) {
    // Check if it's a case number search
    if (query.match(/^CASE-\d{4}-\d{4}$/i)) {
      return { caseNumber: { $regex: query, $options: 'i' } };
    }

    // Full-text search across multiple fields
    const searchRegex = { $regex: query, $options: 'i' };
    
    return {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { caseNumber: searchRegex },
        { notes: searchRegex },
        { outcome: searchRegex },
        { 'courtDetails.courtName': searchRegex },
        { 'courtDetails.judge': searchRegex },
        { 'courtDetails.courtCaseNumber': searchRegex },
        { tags: searchRegex }
      ]
    };
  }

  /**
   * Build sort options
   * @param {String} sortBy - Sort field
   * @param {String} sortOrder - Sort direction
   * @returns {Object} - Sort options
   */
  static buildSortOptions(sortBy, sortOrder) {
    const validSortFields = [
      'dateCreated', 'lastActivity', 'title', 'status', 'priority',
      'progress', 'expectedCompletion', 'caseNumber'
    ];

    const field = validSortFields.includes(sortBy) ? sortBy : 'lastActivity';
    const order = sortOrder === 'asc' ? 1 : -1;

    return { [field]: order };
  }

  /**
   * Get search statistics
   * @param {Object} query - Search query
   * @returns {Object} - Search statistics
   */
  static async getSearchStatistics(query) {
    try {
      const [statusStats, priorityStats, typeStats] = await Promise.all([
        Case.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Case.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Case.aggregate([
          { $match: query },
          { $group: { _id: '$caseType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      return {
        byStatus: statusStats,
        byPriority: priorityStats,
        byType: typeStats
      };
    } catch (error) {
      console.error('Search statistics error:', error);
      return { byStatus: [], byPriority: [], byType: [] };
    }
  }

  /**
   * Get applied filters summary
   * @param {Object} searchParams - Search parameters
   * @returns {Object} - Applied filters
   */
  static getAppliedFilters(searchParams) {
    const applied = {};

    if (searchParams.query) applied.textSearch = searchParams.query;
    if (searchParams.status) applied.status = searchParams.status;
    if (searchParams.caseType) applied.caseType = searchParams.caseType;
    if (searchParams.priority) applied.priority = searchParams.priority;
    if (searchParams.advocateId) applied.advocateId = searchParams.advocateId;
    if (searchParams.clientId) applied.clientId = searchParams.clientId;
    if (searchParams.dateFrom || searchParams.dateTo) {
      applied.dateRange = {
        from: searchParams.dateFrom,
        to: searchParams.dateTo
      };
    }
    if (searchParams.courtName) applied.courtName = searchParams.courtName;
    if (searchParams.tags) applied.tags = searchParams.tags;
    if (searchParams.isUrgent !== undefined) applied.isUrgent = searchParams.isUrgent;
    if (searchParams.progress) applied.progress = searchParams.progress;
    if (searchParams.billing) applied.billing = searchParams.billing;

    return applied;
  }

  /**
   * Search within case documents
   * @param {String} caseId - Case ID
   * @param {String} query - Search query
   * @param {Object} user - User object
   * @returns {Array} - Matching documents
   */
  static async searchCaseDocuments(caseId, query, user) {
    try {
      // Check case access
      const caseItem = await Case.findById(caseId);
      if (!caseItem || !caseItem.canUserAccess(user)) {
        throw new Error('Access denied to case');
      }

      const searchRegex = { $regex: query, $options: 'i' };
      
      const documents = await CaseDocument.find({
        caseId: caseId,
        isActive: true,
        isDeleted: false,
        $or: [
          { originalName: searchRegex },
          { description: searchRegex },
          { extractedText: searchRegex },
          { tags: searchRegex }
        ]
      })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ uploadedAt: -1 });

      // Filter by user access permissions
      const accessibleDocuments = [];
      for (const doc of documents) {
        if (await doc.canUserAccess(user)) {
          accessibleDocuments.push(doc);
        }
      }

      return accessibleDocuments;
    } catch (error) {
      console.error('Document search error:', error);
      throw error;
    }
  }

  /**
   * Search within case notes
   * @param {String} caseId - Case ID
   * @param {String} query - Search query
   * @param {Object} user - User object
   * @returns {Array} - Matching notes
   */
  static async searchCaseNotes(caseId, query, user) {
    try {
      // Check case access
      const caseItem = await Case.findById(caseId);
      if (!caseItem || !caseItem.canUserAccess(user)) {
        throw new Error('Access denied to case');
      }

      const searchRegex = { $regex: query, $options: 'i' };
      
      const notes = await CaseNote.find({
        caseId: caseId,
        status: 'active',
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex }
        ]
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

      // Filter by user access permissions
      const accessibleNotes = [];
      for (const note of notes) {
        if (await note.canUserView(user)) {
          accessibleNotes.push(note);
        }
      }

      return accessibleNotes;
    } catch (error) {
      console.error('Note search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions
   * @param {String} query - Partial query
   * @param {Object} user - User object
   * @returns {Object} - Search suggestions
   */
  static async getSearchSuggestions(query, user) {
    try {
      if (!query || query.length < 2) {
        return { suggestions: [] };
      }

      const searchRegex = { $regex: query, $options: 'i' };
      const userQuery = this.buildUserAccessQuery(user);

      // Get case suggestions
      const caseSuggestions = await Case.find({
        ...userQuery,
        isActive: true,
        $or: [
          { title: searchRegex },
          { caseNumber: searchRegex }
        ]
      })
      .select('title caseNumber status')
      .limit(5)
      .lean();

      // Get client suggestions
      const clientSuggestions = await User.find({
        role: USER_ROLES.CLIENT,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('firstName lastName email')
      .limit(5)
      .lean();

      // Get advocate suggestions
      const advocateSuggestions = await User.find({
        role: { $in: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN] },
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('firstName lastName email specialization')
      .limit(5)
      .lean();

      return {
        suggestions: {
          cases: caseSuggestions,
          clients: clientSuggestions,
          advocates: advocateSuggestions
        }
      };
    } catch (error) {
      console.error('Search suggestions error:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Save search query for user
   * @param {Object} user - User object
   * @param {String} name - Search name
   * @param {Object} searchParams - Search parameters
   * @returns {Object} - Saved search
   */
  static async saveSearch(user, name, searchParams) {
    try {
      // This would typically save to a SavedSearch model
      // For now, we'll return a mock response
      const savedSearch = {
        id: Date.now().toString(),
        name,
        searchParams,
        userId: user._id,
        createdAt: new Date()
      };

      return savedSearch;
    } catch (error) {
      console.error('Save search error:', error);
      throw error;
    }
  }
}

module.exports = CaseSearchService;
