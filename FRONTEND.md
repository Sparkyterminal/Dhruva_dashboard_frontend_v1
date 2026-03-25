# Daybook API — Frontend integration

Single read-only endpoint that returns **cash movement for one calendar day (UTC)**: money **in** from event advance receipts and money **out** from paid requests, plus a simple profit/loss line.

---

## Base URL

Mount path: **`/api/daybook`** (same origin as your other APIs).

Full example:

```text
https://<your-api-host>/api/daybook?date=2026-02-07
```

---

## Authentication

| Requirement | Value |
|-------------|--------|
| Header | `Authorization: <JWT>` |
| Format | **Raw JWT string** (same as other protected routes — no `Bearer ` prefix required by backend; send whatever your app already uses for `isAuth` routes). |
| Token payload | Must include a **`role`** field (used again inside the handler). |

**Allowed roles** (others get `401`):

`OWNER`, `ADMIN`, `CA`, `ACCOUNTS`, `APPROVER`, `DEPARTMENT`

---

## HTTP method & route

| Method | Path |
|--------|------|
| `GET` | `/api/daybook` |

There is **no** request body. Everything is query string.

---

## Query parameters

| Parameter | Required | Description |
|-----------|----------|----------------|
| **`date`** | **Yes** | Day to report on. Use **`YYYY-MM-DD`** (e.g. `2026-02-07`). Parsed as a date; the server builds a **UTC** window: that day `00:00:00.000Z` → `23:59:59.999Z`. |
| **`limit`** | No | Max rows returned in each of **`inflow.data`** and **`outflow.data`**. Default **200**, min **1**, max **1000**. **Totals** (`inflow.total`, `outflow.total`, counts) are still **full-day aggregates**, not limited by this cap. |

### Example query strings

```text
/api/daybook?date=2026-02-07
/api/daybook?date=2026-02-07&limit=500
```

---

## What the backend counts (business rules)

### Inflow (money in)

- Source: **Events** → `eventTypes[].advances[]`
- Included when:
  - `receivedAmount > 0`, and  
  - `receivedDate` falls inside the **UTC** day window for `date`.

### Outflow (money out)

- Source: **Requests** (vendor / payment requests)
- Included when:
  - `is_archived` is not `true`,
  - `amount_paid > 0`,
  - `updatedAt` falls inside the **UTC** day window for `date`.

### Profit / loss

```text
profitAndLoss.value = inflow.total - outflow.total
```

- If `value >= 0` → `profitAndLoss.type === "PROFIT"`
- Else → `"LOSS"`

---

## Success response — `200 OK`

Content-Type: `application/json`

### Top-level shape

```typescript
type DaybookResponse = {
  date: string;              // echo of query date, e.g. "2026-02-07"
  range: {
    start: string;           // ISO date-time, UTC start of day
    end: string;             // ISO date-time, UTC end of day
  };
  inflow: {
    total: number;           // sum of all matching advance receivedAmount (full day)
    count: number;           // number of matching advance rows (full day)
    data: InflowRow[];       // up to `meta.dataLimit` rows, newest receivedDate first
  };
  outflow: {
    total: number;           // sum of amount_paid for matching requests (full day)
    count: number;           // number of matching requests (full day)
    data: OutflowRow[];      // up to `meta.dataLimit` rows, newest updatedAt first
  };
  profitAndLoss: {
    value: number;
    type: "PROFIT" | "LOSS";
  };
  meta: {
    dataLimit: number;       // effective limit used for data arrays
  };
};
```

### `inflow.data[]` — `InflowRow`

| Field | Type | Notes |
|-------|------|--------|
| `eventId` | string | Event (booking) `_id` |
| `eventName` | string \| object | Stored **EventName** ref on event; often serialized as **ObjectId string** unless backend adds `$lookup` later |
| `eventType` | string \| null | **ObjectId** of sub-event type (e.g. Reception) or null |
| `clientName` | string | Client name on the event |
| `advanceNumber` | number | Advance slot number |
| `receivedAmount` | number | Amount received |
| `receivedDate` | string \| null | ISO datetime |
| `remarks` | string | Advance remarks |
| `modeOfPayment` | string \| null | e.g. `cash`, `account` |
| `givenBy` | string \| null | |
| `collectedBy` | string \| null | |

### `outflow.data[]` — `OutflowRow`

| Field | Type | Notes |
|-------|------|--------|
| `requestId` | string | Request `_id` |
| `purpose` | string | |
| `amountPaid` | number | Maps from `amount_paid` |
| `amountPaidTo` | string | |
| `entityAccount` | string | |
| `status` | string | e.g. `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` |
| `requiredDate` | string \| null | ISO |
| `paidAt` | string \| null | `updatedAt` or fallback `createdAt` |
| `vendor` | object \| null | `{ id, name, vendor_code }` if populated |
| `eventReference` | object \| null | Linked event summary `{ id, clientName }` if populated |

---

## Full example payload (`200`)

```json
{
  "date": "2026-02-07",
  "range": {
    "start": "2026-02-07T00:00:00.000Z",
    "end": "2026-02-07T23:59:59.999Z"
  },
  "inflow": {
    "total": 1500000,
    "count": 4,
    "data": [
      {
        "eventId": "698af8e659cde61c1a5a1d23",
        "eventName": "695b664050abcca5388d10ba",
        "eventType": "695cbe7638fd4b333765b77f",
        "clientName": "Kushal",
        "advanceNumber": 1,
        "receivedAmount": 300000,
        "receivedDate": "2026-02-07T18:30:00.000Z",
        "remarks": "",
        "modeOfPayment": "cash",
        "givenBy": "Kushal",
        "collectedBy": "Venkatesh"
      }
    ]
  },
  "outflow": {
    "total": 850000,
    "count": 2,
    "data": [
      {
        "requestId": "67a1b2c3d4e5f6789012345",
        "purpose": "Vendor payment — decor",
        "amountPaid": 500000,
        "amountPaidTo": "Vendor ABC",
        "entityAccount": "",
        "status": "COMPLETED",
        "requiredDate": "2026-02-05T00:00:00.000Z",
        "paidAt": "2026-02-07T10:15:00.000Z",
        "vendor": {
          "_id": "678901234567890123456789",
          "name": "ABC Decor",
          "vendor_code": "V-001"
        },
        "eventReference": {
          "_id": "698af8e659cde61c1a5a1d23",
          "clientName": "Kushal"
        }
      }
    ]
  },
  "profitAndLoss": {
    "value": 650000,
    "type": "PROFIT"
  },
  "meta": {
    "dataLimit": 200
  }
}
```

---

## Error responses

| Status | When | Example body |
|--------|------|----------------|
| **401** | Missing/invalid/expired token, or role not allowed | `{ "message": "..." }` (see `utils/messages`) |
| **400** | Missing `date` | `{ "message": "date query is required", "example": "/api/daybook?date=2026-02-07" }` |
| **400** | Bad date | `{ "message": "Invalid date format", "example": "YYYY-MM-DD" }` |
| **500** | Server / DB error | `{ "message": "...", "error": "<detail>" }` |

---

## Frontend integration examples

### Vanilla `fetch`

```javascript
const API_BASE = import.meta.env.VITE_API_URL; // or your config
const token = getToken(); // your auth helper

async function fetchDaybook(yyyyMmDd, limit = 200) {
  const params = new URLSearchParams({ date: yyyyMmDd });
  if (limit) params.set('limit', String(limit));

  const res = await fetch(`${API_BASE}/daybook?${params}`, {
    method: 'GET',
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`);
  return body;
}

// usage
const daybook = await fetchDaybook('2026-02-07', 200);
console.log(daybook.inflow.total, daybook.outflow.total, daybook.profitAndLoss);
```

### Axios

```javascript
import axios from 'axios';

export async function getDaybook(date, limit) {
  const { data } = await axios.get(`${API_BASE}/daybook`, {
    params: { date, ...(limit != null && { limit }) },
    headers: { Authorization: token },
  });
  return data;
}
```

### React (example pattern)

```tsx
const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
const [data, setData] = useState(null);
const [err, setErr] = useState(null);

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      setErr(null);
      const json = await fetchDaybook(date);
      if (!cancelled) setData(json);
    } catch (e) {
      if (!cancelled) setErr(e.message);
    }
  })();
  return () => { cancelled = true; };
}, [date]);
```

### UI hints

1. **Date picker** → format as **`YYYY-MM-DD`** for the query (use a library or manual pad).
2. **Totals vs tables**: Show **`inflow.total` / `outflow.total`** and **`profitAndLoss`** for summary cards; bind tables to **`inflow.data`** / **`outflow.data`**.
3. **Timezone**: Backend uses **UTC** for the day boundary. If product owners work in **IST**, align expectations (same calendar date in IST can split across two UTC days). For IST-specific days, a future API change would be needed.
4. **IDs in inflow**: `eventName` / `eventType` may be **ObjectId strings** — resolve names via your event-name / event-type caches or a separate API if the UI needs labels.
5. **Large days**: Increase **`limit`** (max 1000) for longer lists; totals still reflect the full day.
6. **Daybook page**: Render under `/user/daybook` using `inflow`, `outflow`, and `profitAndLoss` from the API response.

---

## Checklist for integration

- [ ] `GET /api/daybook?date=YYYY-MM-DD`
- [ ] `limit` is optional. Frontend UI defaults to `limit=200`.
- [ ] Send **`Authorization`** JWT (verified by `isAuth`)
- [ ] User **`role`** is one of the allowed roles
- [ ] Handle **401 / 400 / 500**
- [ ] Render **inflow** / **outflow** sections + **profitAndLoss**
- [ ] Remember **data arrays are capped** by `limit`; **totals are not**

---

## Related backend files

| File | Role |
|------|------|
| `Routes/daybook/index.js` | Route + `isAuth` |
| `Controlers/daybook/index.js` | Aggregation & response mapping |
| `app.js` | `app.use('/api/daybook', daybookRoutes)` |
