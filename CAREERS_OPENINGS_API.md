# Job Openings API

Base URL: `http://localhost:3000` (or your backend URL). Replace `BASE` in the examples below.

## Schema (JobOpening)

Root-level fields are the default (e.g. English). Optional `translations` stores per-locale overrides.

| Field          | Type     | Required | Description                                                                 |
|----------------|----------|----------|-----------------------------------------------------------------------------|
| `slug`         | string   | Yes      | URL-friendly id (e.g. `senior-full-stack-engineer`)                         |
| `title`        | string   | Yes      | Job title (default locale)                                                  |
| `type`         | string   | Yes      | e.g. "Full-time", "Part-time"                                               |
| `team`         | string   | Yes      | e.g. "Product", "Mobile", "Infrastructure"                                  |
| `location`     | string   | No       | e.g. "Remote", "Mumbai, India"                                               |
| `description`  | string   | No       | Job description                                                             |
| `requirements` | string[] | No       | List of requirement strings                                                 |
| `order`        | number   | No       | Sort order (default 0)                                                      |
| `translations` | object   | No       | `{ [locale]: { title?, type?, team?, location?, description?, requirements? } }` (e.g. `ar`, `fr`) |

**Locale:** For `GET` requests, use query `?locale=ar` (or `en`, `es`, `fr`, `de`, `zh`, `hi`, `pt`). The API returns `title`, `type`, `team`, `location`, `description`, and `requirements` from `translations[locale]` when present, otherwise from the root fields.

---

## cURL examples

### 1. List all openings (GET)

```bash
curl -X GET "BASE/careers/openings"
# With locale (localized titles/descriptions):
curl -X GET "BASE/careers/openings?locale=ar"
```

Example with local backend:

```bash
curl -X GET "http://localhost:3000/careers/openings"
curl -X GET "http://localhost:3000/careers/openings?locale=ar"
```

---

### 2. Get one opening by slug (GET)

```bash
curl -X GET "BASE/careers/openings/SLUG"
curl -X GET "BASE/careers/openings/SLUG?locale=ar"
```

Example:

```bash
curl -X GET "http://localhost:3000/careers/openings/senior-full-stack-engineer"
curl -X GET "http://localhost:3000/careers/openings/senior-full-stack-engineer?locale=ar"
```

---

### 3. Add a new job opening (POST)

Body may include optional `translations`: `{ "ar": { "title": "...", "description": "..." }, "fr": { ... } }`.

```bash
curl -X POST "BASE/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "senior-full-stack-engineer",
    "title": "Senior Full-Stack Engineer",
    "type": "Full-time",
    "team": "Product",
    "location": "Remote",
    "description": "We need someone who can build web applications end-to-end.",
    "requirements": [
      "5+ years building web applications",
      "Experience with React and Node.js",
      "Comfortable with databases and APIs"
    ],
    "order": 0,
    "translations": {
      "ar": {
        "title": "مهندس full-stack أول",
        "description": "نبحث عن شخص يبني تطبيقات ويب من البداية للنهاية."
      }
    }
  }'
```

Minimal body (required fields only):

```bash
curl -X POST "http://localhost:3000/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{"slug": "backend-engineer","title": "Backend Engineer","type": "Full-time","team": "Product"}'
```

---

### 4. Update a job opening (PUT)

Use the MongoDB `_id` of the opening (returned when you create or list openings). You can send optional `translations` to set or replace per-locale fields.

```bash
curl -X PUT "BASE/careers/openings/OPENING_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Full-Stack Engineer (Updated)",
    "location": "Mumbai, India"
  }'
```

Example (replace `OPENING_ID` with actual `_id` from GET response):

```bash
curl -X PUT "http://localhost:3000/careers/openings/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{"title": "Senior Full-Stack Engineer","description": "Updated description."}'
```

You can send only the fields you want to update; others stay unchanged.

---

### 5. Delete a job opening (DELETE)

```bash
curl -X DELETE "BASE/careers/openings/OPENING_ID"
```

Example:

```bash
curl -X DELETE "http://localhost:3000/careers/openings/507f1f77bcf86cd799439011"
```

---

## Seeding initial openings

Run these after starting the backend and ensuring MongoDB is connected:

```bash
# Senior Full-Stack Engineer
curl -X POST "http://localhost:3000/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{"slug":"senior-full-stack-engineer","title":"Senior Full-Stack Engineer","type":"Full-time","team":"Product","location":"Remote","description":"We need someone who can build web applications end-to-end. You will work with React, Node.js, and cloud infrastructure.","requirements":["5+ years building web applications","Experience with React and Node.js","Comfortable with databases and APIs","Have shipped products that people use"]}'

# Mobile Developer
curl -X POST "http://localhost:3000/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{"slug":"lead-mobile-architect","title":"Mobile Developer (Flutter)","type":"Full-time","team":"Mobile","location":"Mumbai, India","description":"Help us build mobile apps for iOS and Android using Flutter.","requirements":["Experience with Flutter and Dart","Understanding of native iOS and Android","Have shipped apps to the App Store and Play Store","Can write code that other people can maintain"]}'

# DevOps Engineer
curl -X POST "http://localhost:3000/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{"slug":"devops-sre-specialist","title":"DevOps Engineer","type":"Full-time","team":"Infrastructure","location":"Remote","description":"Help us keep our systems running reliably. You will work with cloud infrastructure, deployment automation, and monitoring.","requirements":["Experience with cloud platforms (AWS, GCP, or Azure)","Know how to work with Kubernetes and containers","Comfortable writing scripts and automation","Understand monitoring and incident response"]}'

# Product Designer
curl -X POST "http://localhost:3000/careers/openings" \
  -H "Content-Type: application/json" \
  -d '{"slug":"product-designer","title":"Product Designer","type":"Full-time","team":"Design","location":"Remote","description":"Design interfaces and experiences for web and mobile products. Work closely with engineers and clients.","requirements":["4+ years designing digital products","Portfolio showing your design process","Experience with Figma or similar tools","Comfortable working with engineers"]}'
```
