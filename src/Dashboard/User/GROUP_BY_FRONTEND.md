# Request `groupBy` — CRUD + linking on requirements (requests)

Base URL: **`${API_BASE_URL}request`** (e.g. `https://…/api/request`)

`groupBy` is stored in its **own MongoDB collection** with a single field **`name`** (unique, trimmed). Each **request** (requirement) can optionally reference one group via **`groupBy`** (ObjectId).

---

## 1) List groups — `GET /request/group-by`

### Auth
`Authorization`: JWT required.

### Roles
`OWNER`, `ADMIN`, `DEPARTMENT`, `APPROVER`, `CA`

### Response `200`
```json
{
  "items": [
    {
      "_id": "67fab…",
      "id": "67fab…",
      "name": "Catering",
      "createdAt": "2026-04-19T…",
      "updatedAt": "2026-04-19T…"
    }
  ]
}
```

Items are sorted by **`name`** ascending.

---

## 2) Create group — `POST /request/group-by`

### Auth
JWT required.

### Roles
`OWNER`, `ADMIN`, `DEPARTMENT`

### Body
```json
{
  "name": "Catering"
}
```

| Field | Type | Required | Notes |
|---|---|---:|---|
| `name` | string | Yes | Trimmed, length `1..200`, **unique** across all groups. |

### Success `201`
```json
{
  "message": "Group created",
  "item": {
    "_id": "67fab…",
    "id": "67fab…",
    "name": "Catering",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

### Errors
| Status | When |
|---:|---|
| `400` | Validation (`name` empty / too long) |
| `401` | Missing/invalid token or wrong role |
| `409` | Duplicate `name` (unique index) |

---

## 3) Delete group — `DELETE /request/group-by/:id`

### Auth
JWT required.

### Roles
`OWNER`, `ADMIN` only.

### Params
| Name | In | Notes |
|---|---|---|
| `id` | path | MongoDB ObjectId of the `RequestGroupBy` document |

### Success `200`
```json
{
  "message": "Group deleted",
  "id": "67fab…"
}
```

### Errors
| Status | When |
|---:|---|
| `400` | Invalid `id` |
| `401` | Missing/invalid token or wrong role |
| `404` | Group id not found |
| `409` | One or more **requests** still have `groupBy` pointing at this id (`requestsReferencing` in body) |

---

## 4) Requests (requirements) — `groupBy` field

### Create request — `POST /request/`

Optional body fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `groupBy` | string (ObjectId) | No | Also accepted as **`groupby`**. Must exist in `RequestGroupBy` or **`404`** / validation error. |

Persisted on the **request** document as `groupBy` (ref).

### Update request — `PATCH /request/:id`

You may set or clear the link:

- Set: `"groupBy": "<RequestGroupBy _id>"` (or `groupby`)
- Clear: `"groupBy": null` or `""`

Same validation as create (id must exist when non-empty).

### Read responses

List/detail endpoints populate:

```json
"groupBy": { "_id": "…", "name": "Catering" }
```

or `null` if unset.

Affected routes (non-exhaustive): `GET /request/`, `GET /request/all`, `GET /request/:id`, `GET /request/my-requests`, `GET /request/my-requests/:id`, `GET /request/department/:id`, `PATCH /request/:id`, archive response where populated.

### Filter lists by group

On **`GET /request/`** and **`GET /request/all`**, optional query:

| Param | Notes |
|---|---|
| `groupBy` or `groupby` | ObjectId — return only requests with that `groupBy`. |

---

## Example flow

1. `POST /request/group-by` `{ "name": "Venue" }` → keep `item._id`
2. `POST /request/` `{ …, "groupBy": "<that _id>" }`
3. `GET /request/?groupBy=<that _id>&page=1&size=20`
4. `DELETE /request/group-by/<that _id>` → fails with `409` until no requests reference it
