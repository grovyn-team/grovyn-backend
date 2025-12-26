# Grovyn Backend

Backend services for the Grovyn website.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Required Variables

- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS configuration

### Email Configuration (Nodemailer)

For the contact form to send emails, configure these SMTP settings:

- `SMTP_HOST` - SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use secure connection (true for 465, false for 587)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password or app-specific password
- `SMTP_FROM_NAME` - Display name for sender (default: "Grovyn Website")
- `CONTACT_EMAIL` - Email address to receive contact inquiries (defaults to SMTP_USER if not set)

### Example .env file

```env
MONGODB_URI=mongodb://localhost:27017/grovyn
PORT=3000
FRONTEND_URL=http://localhost:8080

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Grovyn Website
CONTACT_EMAIL=contact@grovyn.com
```

### Gmail Setup

If using Gmail:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### Other Email Providers

For other email providers, adjust the SMTP settings accordingly:

**Outlook/Hotmail:**
- `SMTP_HOST=smtp-mail.outlook.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`

**SendGrid:**
- `SMTP_HOST=smtp.sendgrid.net`
- `SMTP_PORT=587`
- `SMTP_USER=apikey`
- `SMTP_PASS=your-sendgrid-api-key`

**Mailgun:**
- `SMTP_HOST=smtp.mailgun.org`
- `SMTP_PORT=587`
- `SMTP_USER=your-mailgun-username`
- `SMTP_PASS=your-mailgun-password`

## API Endpoints

### Contact Form

- **POST** `/contact` - Submit contact inquiry
  - Body: `{ name, email, company?, projectType?, budget?, timeline?, message }`
  - Returns: Success message and contact ID

### Career Applications

- **POST** `/careers/apply` - Submit job application
  - Body: Multipart form data with resume file
  - Returns: Success message and application ID

## Installation

```bash
npm install
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

