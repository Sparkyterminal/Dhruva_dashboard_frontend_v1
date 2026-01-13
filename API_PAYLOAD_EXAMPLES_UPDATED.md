# API Payload Examples - Event Booking with Advance Payment Types

This document shows 3 complete payload examples for different event scenarios after the latest updates.

---

## Payload 1: Wedding + Common Package (Shared Amounts)

**Scenario**: Wedding event with both Groom Haldi and Bride Haldi. User selected "Complete Package" mode, so same amounts are shared across both event types.

**Key Fields**:

- `advancePaymentType: "complete"` - Indicates common/shared package mode
- `eventConfirmation: "Confirmed Event"` - Booking is confirmed
- All 6 amount fields are **IDENTICAL** across both event types

```json
{
  "eventId": "evt_wedding_001",
  "eventTypes": [
    {
      "eventTypeId": "groomhaldi_001",
      "startDate": "2024-06-15T09:00:00.000Z",
      "endDate": "2024-06-15T14:00:00.000Z",
      "venueLocation": "Grand Hotel",
      "subVenueLocation": "Main Hall A",
      "agreedAmount": 500000,
      "accountAmount": 450000,
      "accountGst": 81000,
      "accountAmountWithGst": 531000,
      "cashAmount": 50000,
      "totalPayable": 581000,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 290500,
          "advanceDate": "2024-05-15",
          "status": "Pending"
        },
        {
          "advanceNumber": 2,
          "expectedAmount": 290500,
          "advanceDate": "2024-06-01",
          "status": "Pending"
        }
      ]
    },
    {
      "eventTypeId": "bridehaldi_001",
      "startDate": "2024-06-14T10:00:00.000Z",
      "endDate": "2024-06-14T15:00:00.000Z",
      "venueLocation": "Grand Hotel",
      "subVenueLocation": "Main Hall B",
      "agreedAmount": 500000,
      "accountAmount": 450000,
      "accountGst": 81000,
      "accountAmountWithGst": 531000,
      "cashAmount": 50000,
      "totalPayable": 581000,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 290500,
          "advanceDate": "2024-05-15",
          "status": "Pending"
        },
        {
          "advanceNumber": 2,
          "expectedAmount": 290500,
          "advanceDate": "2024-06-01",
          "status": "Pending"
        }
      ]
    }
  ],
  "clientName": "Sharma Family",
  "brideName": "Priya Sharma",
  "groomName": "Rajesh Kumar",
  "contactNumber": "+91-98765-43210",
  "altContactNumber": "+91-87654-32109",
  "altContactName": "Meera Sharma",
  "lead1": "Friend Referral",
  "lead2": "Social Media",
  "note": "Premium wedding package with exclusive decorations",
  "eventConfirmation": "Confirmed Event",
  "advancePaymentType": "complete"
}
```

**How to identify in ViewInflow.jsx**:

- Check `payload.advancePaymentType === "complete"` → Display as Common Package
- OR check if all 6 amount fields are identical across event types
- Shows 6 fields ONCE with "Total Amount" and "Per-Event" breakdown
- All advances are shared (same for each event)

---

## Payload 2: Wedding + Event-Specific Package (Different Amounts)

**Scenario**: Wedding with Mehendi and Reception. User selected "Separate Package" mode, so each event type has its own distinct amounts and advances.

**Key Fields**:

- `advancePaymentType: "separate"` - Indicates event-specific/separate mode
- `eventConfirmation: "InProgress"` - Booking is still being finalized
- All 6 amount fields are **DIFFERENT** across event types
- Each event type has its own separate advances

```json
{
  "eventId": "evt_wedding_002",
  "eventTypes": [
    {
      "eventTypeId": "mehendi_001",
      "startDate": "2024-06-12T18:00:00.000Z",
      "endDate": "2024-06-12T23:00:00.000Z",
      "venueLocation": "Taj Palace",
      "subVenueLocation": "Garden Area",
      "agreedAmount": 300000,
      "accountAmount": 270000,
      "accountGst": 48600,
      "accountAmountWithGst": 318600,
      "cashAmount": 30000,
      "totalPayable": 348600,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 174300,
          "advanceDate": "2024-05-12",
          "status": "Pending"
        },
        {
          "advanceNumber": 2,
          "expectedAmount": 174300,
          "advanceDate": "2024-05-27",
          "status": "Pending"
        }
      ]
    },
    {
      "eventTypeId": "reception_001",
      "startDate": "2024-06-16T20:00:00.000Z",
      "endDate": "2024-06-17T02:00:00.000Z",
      "venueLocation": "Taj Palace",
      "subVenueLocation": "Grand Ballroom",
      "agreedAmount": 800000,
      "accountAmount": 720000,
      "accountGst": 129600,
      "accountAmountWithGst": 849600,
      "cashAmount": 80000,
      "totalPayable": 929600,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 464800,
          "advanceDate": "2024-05-16",
          "status": "Pending"
        },
        {
          "advanceNumber": 2,
          "expectedAmount": 464800,
          "advanceDate": "2024-06-01",
          "status": "Pending"
        }
      ]
    }
  ],
  "clientName": "Kapoor Family",
  "brideName": "Anjali Kapoor",
  "groomName": "Vikram Singh",
  "contactNumber": "+91-99999-88888",
  "altContactNumber": "+91-77777-66666",
  "altContactName": "Vikram Singh (Groom)",
  "lead1": null,
  "lead2": "Wedding Consultant",
  "note": "Separate pricing for mehendi and reception. Special lighting requirements.",
  "eventConfirmation": "InProgress",
  "advancePaymentType": "separate"
}
```

**How to identify in ViewInflow.jsx**:

- Check `payload.advancePaymentType === "separate"` → Display as Event-Specific
- OR check if any 6 amount field differs between event types
- Shows each event type in separate card/drawer with its own amounts
- Each event type displays its own distinct advances
- Use different colors/styling to highlight per-event amounts

---

## Payload 3: Non-Wedding Event (Engagement + Single Event Type)

**Scenario**: Engagement event (not a wedding). Single event type with no separate/complete mode distinction.

**Key Fields**:

- `advancePaymentType` field is **NOT PRESENT** - Only weddings have this field
- `eventConfirmation: "Confirmed Event"` - Always included for all events
- Single event type with `eventTypeId: null` for non-specific bookings
- Generic event handling (not wedding, not haldi/mehendi/reception specific)

```json
{
  "eventId": "evt_engagement_001",
  "eventTypes": [
    {
      "eventTypeId": null,
      "startDate": "2024-07-20T18:00:00.000Z",
      "endDate": "2024-07-20T22:00:00.000Z",
      "venueLocation": "Royal Palace Hotel",
      "subVenueLocation": "Engagement Hall",
      "agreedAmount": 200000,
      "accountAmount": 180000,
      "accountGst": 32400,
      "accountAmountWithGst": 212400,
      "cashAmount": 20000,
      "totalPayable": 232400,
      "advances": [
        {
          "advanceNumber": 1,
          "expectedAmount": 116200,
          "advanceDate": "2024-07-01",
          "status": "Pending"
        },
        {
          "advanceNumber": 2,
          "expectedAmount": 116200,
          "advanceDate": "2024-07-10",
          "status": "Pending"
        }
      ]
    }
  ],
  "clientName": "Patel Family",
  "brideName": "Divya Patel",
  "groomName": "Arjun Nair",
  "contactNumber": "+91-94444-55555",
  "altContactNumber": null,
  "altContactName": null,
  "lead1": "Wedding Portal",
  "lead2": null,
  "note": "Engagement ceremony with light refreshments. Timing is flexible.",
  "eventConfirmation": "Confirmed Event"
}
```

**How to identify in ViewInflow.jsx**:

- `advancePaymentType` field is **ABSENT** → This is a non-wedding event
- Shows single event type display
- No mode distinction needed (not applicable)
- Display all 6 amounts for this single event
- Show event confirmation status at the top

---

## Key Differences Summary

| Feature                  | Payload 1 (Wedding-Common)      | Payload 2 (Wedding-Separate)        | Payload 3 (Non-Wedding) |
| ------------------------ | ------------------------------- | ----------------------------------- | ----------------------- |
| **advancePaymentType**   | `"complete"`                    | `"separate"`                        | NOT PRESENT             |
| **eventConfirmation**    | `"Confirmed Event"`             | `"InProgress"`                      | `"Confirmed Event"`     |
| **Amounts across types** | IDENTICAL                       | DIFFERENT                           | N/A (single type)       |
| **Advances**             | SHARED (same for all)           | SEPARATE (per event)                | Single set              |
| **Event Type ID**        | Specific (haldi, mehendi, etc.) | Specific (mehendi, reception, etc.) | `null`                  |
| **Display in View**      | 6 fields once + total           | 6 fields per event card             | 6 fields once           |

---

## Implementation Notes for ViewInflow.jsx

### Detection Logic:

```javascript
// Determine event mode
const isWeddingCommonPackage = payload.advancePaymentType === "complete";
const isWeddingEventSpecific = payload.advancePaymentType === "separate";
const isNonWeddingEvent = !payload.advancePaymentType;

// Alternative detection (if advancePaymentType is missing for legacy data):
const allAmountsSame = payload.eventTypes.every(
  (et) =>
    et.agreedAmount === payload.eventTypes[0].agreedAmount &&
    et.accountAmount === payload.eventTypes[0].accountAmount &&
    et.accountGst === payload.eventTypes[0].accountGst &&
    et.accountAmountWithGst === payload.eventTypes[0].accountAmountWithGst &&
    et.cashAmount === payload.eventTypes[0].cashAmount &&
    et.totalPayable === payload.eventTypes[0].totalPayable
);
const isSingleEventType =
  payload.eventTypes.length === 1 && !payload.eventTypes[0].eventTypeId;

const inferredMode = isWeddingCommonPackage
  ? "complete"
  : isWeddingEventSpecific
  ? "separate"
  : allAmountsSame
  ? "complete"
  : isSingleEventType
  ? "single"
  : "separate";
```

### Display Rendering:

```javascript
// For Wedding + Common Package
if (advancePaymentType === "complete") {
  // Show 6 amount fields ONCE
  // Show "Total Amount" and "Per Event" breakdown
  // Show shared advances
}

// For Wedding + Event-Specific
if (advancePaymentType === "separate") {
  // Show each event type in separate card/accordion
  // Each card shows 6 distinct amount fields
  // Each card shows its own advances
}

// For Non-Wedding Events
if (!advancePaymentType) {
  // Show single event display
  // Show 6 amount fields for that event
  // Show advances for that event
}
```

---

## API Integration Checklist

- ✅ Added `eventConfirmation` field to all payloads (already existed in form, now sent to API)
- ✅ Added `advancePaymentType` field for wedding events only (values: "separate" or "complete")
- ✅ Non-wedding events have NO `advancePaymentType` field in payload
- ✅ All 3 scenarios documented with complete example payloads
- ⏳ ViewInflow.jsx to use these fields for explicit mode detection instead of inferring from amounts
- ⏳ Update display logic to leverage advancePaymentType for cleaner rendering
