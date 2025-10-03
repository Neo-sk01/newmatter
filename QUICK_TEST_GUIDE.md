# Quick Test Guide - AI-Powered CSV Import

## ⚡ Quick Start (5 minutes)

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Test CSV Import
Navigate to one of these pages:
- `http://localhost:3000/salesmatter` (main app)
- `http://localhost:3000/csv-demo` (demo page)

### 3. Prepare Test CSV
Use the included `/test-leads.csv` or create this file:

**test-import.csv:**
```csv
First Name,Last Name,Email,Company,Title
John,Doe,john.doe@acme.com,Acme Corp,CEO
Jane,Smith,jane@example.com,Example Inc,CTO
Bob,Johnson,bob@test.io,Test LLC,Developer
Alice,Williams,alice@sample.com,Sample Co,Manager
Sarah,Brown,sarah@demo.com,Demo Inc,Designer
```

### 4. Upload & Watch Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload your CSV
4. Look for these emojis:

```
🚀 Sending CSV data to /api/parse-csv-ai
📥 API response status: 200 OK
🤖 AI Parse result: {...}
✅ Leads parsed: 5
📋 Formatted result with 5 leads
📊 Imported 5 leads ready for email generation
```

### 5. Verify in UI
- [ ] Lead Preview table shows your 5 leads
- [ ] Stats show: 5 Valid Leads, 5 Valid Emails, etc.
- [ ] Click "Import 5 Leads" button
- [ ] Leads appear in the main lead list
- [ ] You can select a lead and generate an email

## ✅ Success Checklist

### Phase 1: CSV Upload
- [ ] File uploads without errors
- [ ] Console shows "🚀 Sending CSV data..."
- [ ] No error messages in console

### Phase 2: AI Processing
- [ ] Console shows "✅ Leads parsed: X" where X > 0
- [ ] Processing completes in < 5 seconds
- [ ] No "❌" emoji errors in console

### Phase 3: UI Display
- [ ] Results screen appears
- [ ] Lead Preview table shows actual lead data
- [ ] Quality metrics are accurate
- [ ] Import button shows correct count

### Phase 4: Lead Storage
- [ ] Click "Import X Leads" works
- [ ] Console shows "Calling onImportComplete with X leads"
- [ ] Leads appear in lead list/table
- [ ] Can view lead details

### Phase 5: Email Generation
- [ ] Select a lead from the list
- [ ] Click "Generate Email" or similar
- [ ] Email generates successfully
- [ ] Email includes lead details (name, company)

## 🐛 Troubleshooting

### ❌ "AI service not configured"
**Fix:** Add `OPENAI_API_KEY` to `.env.local`:
```bash
OPENAI_API_KEY=sk-your-key-here
```
Then restart dev server.

### ❌ "Leads parsed: 0"
**Check:**
1. CSV has headers in first row
2. CSV has at least these columns: name/email/company
3. Data rows are not empty
4. Email format is valid (user@domain.com)

**Try:** Use the sample CSV above

### ❌ Leads parse but don't show in UI
**Check Console:**
```javascript
// Should see all of these:
✅ Leads parsed: 5
📋 Formatted result with 5 leads  
📊 Imported 5 leads ready for email generation
Calling onImportComplete with 5 leads
```

**If missing last line:**
- Parent component state issue
- Check that `onImportComplete` callback is wired correctly

### ❌ Network error / timeout
**Check:**
1. Dev server is running
2. No firewall blocking localhost
3. Network tab shows `/api/parse-csv-ai` request
4. Check response status and body

## 📊 What Should Happen

### Visual Flow
```
1. [Upload CSV File] 
        ↓
2. [Processing... screen with progress]
        ↓
3. [Results Screen with:]
   - Summary stats (Valid Leads: 5, Valid Emails: 5, etc.)
   - Lead Preview table showing first 5 leads
   - Quality metrics
   - Import button
        ↓
4. [Click "Import 5 Leads"]
        ↓
5. [Lead List/Table shows imported leads]
        ↓
6. [Select lead → Generate Email]
        ↓
7. [Email generated with lead details]
```

### Console Flow
```javascript
// Upload
🚀 Sending CSV data to /api/parse-csv-ai
   {columnCount: 5, rowCount: 5, columns: [...]}

// Processing
📥 API response status: 200 OK

// Results
🤖 AI Parse result: {success: true, leads: [...]}
✅ Leads parsed: 5
📊 Success status: true
📋 Formatted result with 5 leads

// Display
Rendering results step
result object: {success: true, totalRows: 5, ...}
result.leads array: Array(5)
result.leads.length: 5

// Import
handleImport called
result.leads.length: 5
Calling onImportComplete with 5 leads
First 3 leads: [{id: "...", firstName: "John", ...}, ...]

// Email Generation
📊 Imported 5 leads ready for email generation
```

## 🎯 Test Cases

### Test 1: Standard CSV
**Input:** CSV with First Name, Last Name, Email, Company, Title
**Expected:** All 5 fields mapped correctly
**Pass:** ✅ All leads imported with complete data

### Test 2: Full Name Column
**Input:** CSV with "Name" column containing "John Doe"
**Expected:** Split into firstName: "John", lastName: "Doe"
**Pass:** ✅ Names split correctly

### Test 3: Varied Column Names
**Input:** CSV with "Email Address", "Organisation", "Job Title"
**Expected:** AI maps to email, company, title
**Pass:** ✅ Intelligent mapping works

### Test 4: Missing Emails
**Input:** CSV with 5 rows, 2 have empty emails
**Expected:** 3 leads imported, 2 skipped
**Pass:** ✅ Only valid leads imported

### Test 5: Large File
**Input:** CSV with 500 rows
**Expected:** All parsed within 10 seconds
**Pass:** ✅ Performance acceptable

## 📞 Still Having Issues?

Share these details:

1. **Console logs** (copy all text with emojis)
2. **Network tab**: Screenshot of `/api/parse-csv-ai` request
3. **Sample CSV** (first 3 rows)
4. **Environment**: 
   - `OPENAI_API_KEY` configured? (yes/no)
   - Browser? (Chrome/Firefox/Safari)
   - Dev server running? (yes/no)

## 🎉 Expected Success

After following this guide, you should be able to:
- ✅ Upload any CSV with lead data
- ✅ See leads parsed by AI
- ✅ View leads in preview table
- ✅ Import leads to your system
- ✅ Generate personalized emails for each lead

**Total time:** < 2 minutes from upload to email generation! 🚀

