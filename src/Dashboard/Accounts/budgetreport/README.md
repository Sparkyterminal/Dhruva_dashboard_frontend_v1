# Budget Report Module - Backend Integration Guide

## Overview

This document provides comprehensive information about the Budget Report module, including how to send data to the backend, data structure, storage recommendations, and API integration details.

---

## Table of Contents

1. [Data Structure](#data-structure)
2. [Backend API Integration](#backend-api-integration)
3. [Storage Options](#storage-options)
4. [Data Format Examples](#data-format-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## Data Structure

### Request Payload Format

When saving a budget report, the frontend sends the following structure to the backend:

```json
{
  "eventId": "string (MongoDB ObjectId)",
  "budgetData": {
    "groups": {
      "GroupName1": [
        {
          "slNo": "string or number",
          "particulars": "string",
          "size": "string",
          "qnty": 0,
          "unit": "string",
          "rate": 0,
          "totalCost": 0,
          "negotiatedAmount": 0,
          "vendorCode": "string (e.g., 'C-SBE-55')",
          "vendorName": "string",
          "vendorContactNumber": "string",
          "inhouseAmount": false,
          "assetsPurchase": false,
          "directPayment": false,
          "actualPaidAmount": 0
        }
      ],
      "GroupName2": [...]
    },
    "grandTotals": {
      "GroupName1": 0,
      "GroupName2": 0
    },
    "summary": {
      "totalCost": 0,
      "grandTotal": 0,
      "negotiatedAmount": 0,
      "actualPaidAmount": 0
    }
  },
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "totalRows": 0,
    "totalGroups": 0
  }
}
```

### Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `eventId` | String | MongoDB ObjectId of the selected confirmed event | Yes |
| `budgetData.groups` | Object | Key-value pairs where keys are group names and values are arrays of budget items | Yes |
| `budgetData.grandTotals` | Object | Key-value pairs mapping group names to their grand totals | Yes |
| `budgetData.summary` | Object | Overall summary totals across all groups | Yes |
| `metadata` | Object | Additional metadata about the report | Yes |

---

## Backend API Integration

### Endpoint: `POST /budget-reports`

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
See [Data Structure](#data-structure) above.

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "Budget report saved successfully",
  "data": {
    "id": "report_id",
    "eventId": "event_id",
    "createdAt": "2026-02-11T10:30:00.000Z",
    "updatedAt": "2026-02-11T10:30:00.000Z"
  }
}
```

**Error Response (400/401/500):**
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information"
}
```

### Example Backend Implementation (Node.js/Express)

```javascript
// POST /budget-reports
router.post('/budget-reports', authenticate, async (req, res) => {
  try {
    const { eventId, budgetData, metadata } = req.body;
    
    // Validate required fields
    if (!eventId || !budgetData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: eventId and budgetData'
      });
    }
    
    // Verify event exists and is confirmed
    const event = await Event.findById(eventId);
    if (!event || event.eventConfirmation !== 'Confirmed Event') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or unconfirmed event'
      });
    }
    
    // Create budget report document
    const budgetReport = new BudgetReport({
      eventId,
      budgetData,
      metadata: {
        ...metadata,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });
    
    await budgetReport.save();
    
    res.status(201).json({
      success: true,
      message: 'Budget report saved successfully',
      data: budgetReport
    });
  } catch (error) {
    console.error('Error saving budget report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save budget report',
      error: error.message
    });
  }
});
```

### MongoDB Schema Example

```javascript
const budgetReportSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  budgetData: {
    groups: {
      type: Map,
      of: [{
        slNo: { type: mongoose.Schema.Types.Mixed },
        particulars: String,
        size: String,
        qnty: Number,
        unit: String,
        rate: Number,
        totalCost: Number,
        negotiatedAmount: Number,
        vendorCode: String,
        vendorName: String,
        vendorContactNumber: String,
        inhouseAmount: Boolean,
        assetsPurchase: Boolean,
        directPayment: Boolean,
        actualPaidAmount: Number
      }],
      required: true
    },
    grandTotals: {
      type: Map,
      of: Number,
      required: true
    },
    summary: {
      totalCost: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      negotiatedAmount: { type: Number, default: 0 },
      actualPaidAmount: { type: Number, default: 0 }
    },
    required: true
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalRows: Number,
    totalGroups: Number
  }
}, {
  timestamps: true
});

// Indexes for better query performance
budgetReportSchema.index({ eventId: 1, createdAt: -1 });
budgetReportSchema.index({ 'metadata.createdBy': 1 });
```

---

## Storage Options

### Option 1: MongoDB (Recommended for Frequent Edits)

**Pros:**
- ✅ Fast read/write operations
- ✅ Easy to query and filter
- ✅ Supports complex data structures
- ✅ Built-in versioning and timestamps
- ✅ Best for frequent edits and updates
- ✅ Supports transactions for data consistency

**Cons:**
- ❌ Requires database server
- ❌ Additional infrastructure cost

**When to Use:**
- When you need to edit reports frequently
- When you need to query/filter reports
- When you need real-time updates
- When you need version history

**Implementation:**
```javascript
// Save to MongoDB
const budgetReport = await BudgetReport.create({
  eventId,
  budgetData,
  metadata
});

// Update existing report
await BudgetReport.findOneAndUpdate(
  { eventId },
  { budgetData, metadata: { ...metadata, updatedAt: new Date() } },
  { upsert: true, new: true }
);

// Retrieve report
const report = await BudgetReport.findOne({ eventId });
```

---

### Option 2: AWS S3 (Recommended for Archival/Backup)

**Pros:**
- ✅ Cost-effective for large files
- ✅ Scalable storage
- ✅ Versioning support
- ✅ Good for archival purposes
- ✅ Can serve as backup

**Cons:**
- ❌ Slower read/write (HTTP requests)
- ❌ Not ideal for frequent edits
- ❌ Requires AWS setup
- ❌ Additional complexity for updates

**When to Use:**
- For archival/backup purposes
- When reports are finalized and rarely edited
- When you need long-term storage
- As a secondary storage option

**Implementation:**

#### Frontend (Upload to S3 via Backend)

```javascript
// Frontend calls backend endpoint
const uploadToS3 = async (budgetData) => {
  const response = await axios.post(
    `${API_BASE_URL}budget-reports/upload-s3`,
    { eventId, budgetData },
    config
  );
  return response.data;
};
```

#### Backend (S3 Upload)

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

router.post('/budget-reports/upload-s3', authenticate, async (req, res) => {
  try {
    const { eventId, budgetData } = req.body;
    const jsonString = JSON.stringify(budgetData, null, 2);
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `budget-reports/${eventId}/${Date.now()}.json`,
      Body: jsonString,
      ContentType: 'application/json',
      Metadata: {
        eventId,
        createdAt: new Date().toISOString()
      }
    };
    
    const result = await s3.upload(params).promise();
    
    // Optionally save reference in MongoDB
    await BudgetReportReference.create({
      eventId,
      s3Key: result.Key,
      s3Url: result.Location,
      version: Date.now()
    });
    
    res.json({
      success: true,
      s3Url: result.Location,
      s3Key: result.Key
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload to S3',
      error: error.message
    });
  }
});
```

---

### Option 3: Hybrid Approach (Recommended)

**Best Practice:** Use MongoDB for active editing + S3 for archival

```javascript
// Save to MongoDB (primary storage)
const budgetReport = await BudgetReport.create({
  eventId,
  budgetData,
  metadata
});

// Archive to S3 (optional, for backup)
if (req.body.archive) {
  await archiveToS3(eventId, budgetData);
}
```

**Benefits:**
- Fast editing in MongoDB
- Backup/archival in S3
- Best of both worlds

---

## Data Format Examples

### Complete Example Payload

```json
{
  "eventId": "6980aee388aa42085ac82edc",
  "budgetData": {
    "groups": {
      "Infrastructure": [
        {
          "slNo": 1,
          "particulars": "Tables & Chairs",
          "size": "Medium",
          "qnty": 10,
          "unit": "Pcs",
          "rate": 1500,
          "totalCost": 15000,
          "negotiatedAmount": 14000,
          "vendorCode": "C-SBE-55",
          "vendorName": "Rajgopal Palace",
          "vendorContactNumber": "1234567890",
          "inhouseAmount": false,
          "assetsPurchase": false,
          "directPayment": true,
          "actualPaidAmount": 14000
        },
        {
          "slNo": 2,
          "particulars": "Cupboards",
          "size": "Large",
          "qnty": 5,
          "unit": "Pcs",
          "rate": 3000,
          "totalCost": 15000,
          "negotiatedAmount": 14500,
          "vendorCode": "C-SBE-56",
          "vendorName": "Another Vendor",
          "vendorContactNumber": "9876543210",
          "inhouseAmount": false,
          "assetsPurchase": true,
          "directPayment": false,
          "actualPaidAmount": 0
        }
      ],
      "Stationery": [
        {
          "slNo": 1,
          "particulars": "Notebooks",
          "size": "-",
          "qnty": 100,
          "unit": "Pcs",
          "rate": 40,
          "totalCost": 4000,
          "negotiatedAmount": 3800,
          "vendorCode": "C-SBE-57",
          "vendorName": "Stationery Vendor",
          "vendorContactNumber": "5555555555",
          "inhouseAmount": true,
          "assetsPurchase": false,
          "directPayment": false,
          "actualPaidAmount": 3800
        }
      ]
    },
    "grandTotals": {
      "Infrastructure": 30000,
      "Stationery": 4000
    },
    "summary": {
      "totalCost": 34000,
      "grandTotal": 34000,
      "negotiatedAmount": 32300,
      "actualPaidAmount": 17800
    }
  },
  "metadata": {
    "createdAt": "2026-02-11T10:30:00.000Z",
    "totalRows": 3,
    "totalGroups": 2
  }
}
```

---

## Error Handling

### Frontend Error Handling

The frontend handles errors gracefully:

```javascript
try {
  const result = await saveToBackend();
  if (result.success) {
    message.success("Budget report saved successfully!");
  } else {
    message.error(result.error || "Failed to save budget report");
  }
} catch (error) {
  message.error("Network error. Please check your connection.");
}
```

### Backend Error Handling

```javascript
// Validation errors
if (!eventId) {
  return res.status(400).json({
    success: false,
    message: 'eventId is required'
  });
}

// Database errors
try {
  await budgetReport.save();
} catch (error) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Budget report already exists for this event'
    });
  }
  throw error;
}
```

---

## Best Practices

### 1. Data Validation

**Backend should validate:**
- `eventId` exists and is a valid ObjectId
- Event is confirmed (`eventConfirmation === "Confirmed Event"`)
- All numeric fields are valid numbers
- `vendorCode` exists in vendors collection (optional validation)
- Required fields are present

```javascript
// Validation middleware
const validateBudgetReport = (req, res, next) => {
  const { eventId, budgetData } = req.body;
  
  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid eventId is required'
    });
  }
  
  if (!budgetData || !budgetData.groups) {
    return res.status(400).json({
      success: false,
      message: 'budgetData.groups is required'
    });
  }
  
  next();
};
```

### 2. Data Normalization

**Before saving, normalize:**
- Convert all amounts to numbers (remove commas)
- Ensure boolean fields are actual booleans
- Trim string fields
- Validate vendor codes exist

```javascript
const normalizeBudgetData = (budgetData) => {
  const normalized = { ...budgetData };
  
  Object.keys(normalized.groups).forEach(groupName => {
    normalized.groups[groupName] = normalized.groups[groupName].map(item => ({
      ...item,
      qnty: Number(item.qnty) || 0,
      rate: Number(item.rate) || 0,
      totalCost: Number(item.totalCost) || 0,
      negotiatedAmount: Number(item.negotiatedAmount) || 0,
      actualPaidAmount: Number(item.actualPaidAmount) || 0,
      inhouseAmount: Boolean(item.inhouseAmount),
      assetsPurchase: Boolean(item.assetsPurchase),
      directPayment: Boolean(item.directPayment),
      vendorCode: String(item.vendorCode || '').trim(),
      vendorName: String(item.vendorName || '').trim(),
      vendorContactNumber: String(item.vendorContactNumber || '').trim()
    }));
  });
  
  return normalized;
};
```

### 3. Version Control

**For frequent edits, implement versioning:**

```javascript
const budgetReportSchema = new mongoose.Schema({
  // ... existing fields
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    budgetData: mongoose.Schema.Types.Mixed,
    updatedAt: Date,
    updatedBy: mongoose.Schema.Types.ObjectId
  }]
});

// Update with versioning
const updateBudgetReport = async (eventId, newBudgetData, userId) => {
  const existing = await BudgetReport.findOne({ eventId });
  
  if (existing) {
    // Save previous version
    existing.previousVersions.push({
      version: existing.version,
      budgetData: existing.budgetData,
      updatedAt: existing.updatedAt,
      updatedBy: existing.updatedBy
    });
    
    // Update current version
    existing.budgetData = newBudgetData;
    existing.version += 1;
    existing.updatedBy = userId;
    existing.updatedAt = new Date();
    
    await existing.save();
    return existing;
  } else {
    // Create new
    return await BudgetReport.create({
      eventId,
      budgetData: newBudgetData,
      version: 1
    });
  }
};
```

### 4. Caching Strategy

**For frequently accessed reports:**

```javascript
const redis = require('redis');
const client = redis.createClient();

const getBudgetReport = async (eventId) => {
  // Check cache first
  const cached = await client.get(`budget:${eventId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const report = await BudgetReport.findOne({ eventId });
  
  // Cache for 1 hour
  if (report) {
    await client.setex(`budget:${eventId}`, 3600, JSON.stringify(report));
  }
  
  return report;
};
```

---

## Storage Recommendation

### **Recommended: MongoDB (Primary) + S3 (Backup)**

**Why MongoDB for Primary Storage:**
1. ✅ **Frequent Edits**: Budget reports are edited multiple times
2. ✅ **Fast Access**: Sub-second query times
3. ✅ **Query Capabilities**: Easy to filter, search, and aggregate
4. ✅ **Real-time Updates**: Supports concurrent editing with proper locking
5. ✅ **Version History**: Easy to implement version tracking
6. ✅ **Relationships**: Can easily link to events, vendors, users

**Why S3 for Backup:**
1. ✅ **Cost-Effective**: Cheaper for long-term storage
2. ✅ **Disaster Recovery**: Off-site backup
3. ✅ **Compliance**: Can meet archival requirements
4. ✅ **Versioning**: S3 supports object versioning

**Implementation Strategy:**

```javascript
// Primary: Save to MongoDB
const saveBudgetReport = async (eventId, budgetData, userId) => {
  // Save to MongoDB (fast, editable)
  const report = await BudgetReport.findOneAndUpdate(
    { eventId },
    {
      eventId,
      budgetData,
      metadata: {
        updatedAt: new Date(),
        updatedBy: userId
      }
    },
    { upsert: true, new: true }
  );
  
  // Backup to S3 (async, non-blocking)
  archiveToS3(eventId, budgetData).catch(err => {
    console.error('S3 backup failed (non-critical):', err);
  });
  
  return report;
};

// Backup: Archive to S3
const archiveToS3 = async (eventId, budgetData) => {
  const jsonString = JSON.stringify(budgetData, null, 2);
  const key = `budget-reports/${eventId}/${Date.now()}.json`;
  
  await s3.putObject({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: jsonString,
    ContentType: 'application/json'
  }).promise();
  
  // Update MongoDB with S3 reference
  await BudgetReport.findOneAndUpdate(
    { eventId },
    { 
      $push: {
        s3Archives: {
          key,
          archivedAt: new Date()
        }
      }
    }
  );
};
```

---

## API Endpoints Summary

### Create/Update Budget Report
```
POST /budget-reports
Body: { eventId, budgetData, metadata }
Response: { success, data: { id, eventId, createdAt } }
```

### Get Budget Report by Event
```
GET /budget-reports/event/:eventId
Response: { success, data: BudgetReport }
```

### Get Budget Report by ID
```
GET /budget-reports/:id
Response: { success, data: BudgetReport }
```

### List Budget Reports
```
GET /budget-reports?page=1&limit=10&eventId=xxx
Response: { success, data: [BudgetReport], pagination }
```

### Delete Budget Report
```
DELETE /budget-reports/:id
Response: { success, message }
```

### Export to S3
```
POST /budget-reports/:id/export-s3
Response: { success, s3Url, s3Key }
```

---

## Frontend Usage

### Save to Backend
```javascript
// Automatically called when user clicks "Save to Backend" button
// Requires: selectedEventId to be set
// Sends: prepareDataForBackend() output
```

### Export to JSON
```javascript
// Click "Export JSON" button
// Downloads: budget-report-{eventId}-{timestamp}.json
// Format: Same as backend payload
```

### Load from JSON
```javascript
// Click "Load JSON" button
// Select: Previously exported JSON file
// Restores: All groups and rows
```

---

## Testing

### Test Payload Example

```json
{
  "eventId": "507f1f77bcf86cd799439011",
  "budgetData": {
    "groups": {
      "Test Group": [
        {
          "slNo": 1,
          "particulars": "Test Item",
          "size": "Test",
          "qnty": 1,
          "unit": "Pcs",
          "rate": 1000,
          "totalCost": 1000,
          "negotiatedAmount": 950,
          "vendorCode": "TEST-001",
          "vendorName": "Test Vendor",
          "vendorContactNumber": "1234567890",
          "inhouseAmount": false,
          "assetsPurchase": false,
          "directPayment": true,
          "actualPaidAmount": 950
        }
      ]
    },
    "grandTotals": {
      "Test Group": 1000
    },
    "summary": {
      "totalCost": 1000,
      "grandTotal": 1000,
      "negotiatedAmount": 950,
      "actualPaidAmount": 950
    }
  },
  "metadata": {
    "createdAt": "2026-02-11T10:30:00.000Z",
    "totalRows": 1,
    "totalGroups": 1
  }
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Verify user has permission to access event
3. **Validation**: Validate all input data server-side
4. **Sanitization**: Sanitize string inputs to prevent injection
5. **Rate Limiting**: Implement rate limiting for save operations

---

## Performance Optimization

1. **Indexing**: Create indexes on `eventId` and `metadata.createdAt`
2. **Pagination**: Implement pagination for list endpoints
3. **Caching**: Cache frequently accessed reports
4. **Compression**: Compress large JSON payloads if needed
5. **Batch Operations**: Support bulk updates if needed

---

## Support & Maintenance

For issues or questions:
- Check browser console for errors
- Verify API endpoint is correct
- Ensure authentication token is valid
- Validate data format matches schema

---

**Last Updated**: February 11, 2026
**Version**: 1.0.0
