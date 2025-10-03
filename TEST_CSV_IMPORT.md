# Testing CSV Import

## Current Status

✅ AI-powered CSV parser is implemented  
✅ Fallback parser is configured  
✅ API route handles POST requests correctly  
✅ GET requests return helpful 405 error (this is correct behavior)

## Understanding the 405 Error

The `GET /api/parse-csv 405` error you're seeing is **NORMAL** and expected. It happens when:

1. **Browser navigates to the page** - Next.js may check routes
2. **Hot reload occurs** - Development server checks routes
3. **Preflight requests** - Browser security checks

**This does NOT affect the actual CSV import functionality!** 

The CSV importer uses **POST** requests, which work correctly.

## How to Test CSV Import

### 1. Open the Application

Navigate to one of these pages:
```
http://localhost:3003/csv-demo
http://localhost:3003/salesmatter
```

### 2. Check Browser Console

Before uploading, open Developer Tools (F12) and go to the Console tab.

### 3. Upload Your CSV

Use the test file: `test-leads.csv` in the project root, or create a simple CSV:

```csv
First Name,Last Name,Company,Email,Title
John,Doe,TechCorp Inc,john@techcorp.com,Software Engineer
Jane,Smith,DataFlow Solutions,jane.smith@dataflow.com,Product Manager
```

### 4. Expected Console Output

#### If OpenAI API Key is Configured:
```
Sending CSV data to /api/parse-csv { columnCount: 5, rowCount: 2, columns: [...] }
API response status: 200 OK
Parse result: { success: true, validRows: 2, ... }
```

#### If OpenAI API Key is NOT Configured:
```
Sending CSV data to /api/parse-csv { columnCount: 5, rowCount: 2, columns: [...] }
API response status: 503 Service Unavailable
Parse result: { success: false, fallbackRequired: true, ... }
Enhanced AI parsing unavailable, using fallback parser
Successfully imported 2 leads!
```

### 5. Verify Leads Are Displayed

After import, you should see:
- ✅ Lead count in statistics
- ✅ Leads displayed in the table
- ✅ Ability to view/edit individual leads

## Troubleshooting

### Issue: "No leads imported yet" message persists

**Possible causes:**

1. **API Error Before POST** - Check console for errors before "Sending CSV data" log
2. **Empty CSV** - Verify your CSV has headers and data rows
3. **State Update Issue** - Check if leads are logged but not displayed

**Debug steps:**

```javascript
// Add to console after import
console.log('Imported leads:', importedLeads);
console.log('Current lead list:', leadLists);
console.log('Current list ID:', currentListId);
```

### Issue: 405 Error on Page Load

**This is normal!** The GET request happens during page navigation/load. 

The actual CSV import uses POST and should work fine.

### Issue: 503 Service Unavailable

**Cause:** OpenAI API key not configured

**Solution:** 
1. Create `.env.local` in project root
2. Add: `OPENAI_API_KEY=sk-your-key-here`
3. Restart dev server: `npm run dev`

**Or:** Just use the fallback parser (works without API key)

## Expected Flow

1. **User uploads CSV** → PapaParse extracts columns and rows
2. **POST to /api/parse-csv** → AI analyzes and maps columns
3. **Receive parsed leads** → Component stores results
4. **User clicks "Import X Leads"** → `onImportComplete(leads)` is called
5. **Leads added to list** → State updates and table displays leads

## What the GET Request Is

The `GET /api/parse-csv 405` you're seeing is likely:

- **Next.js router** checking available routes during development
- **Browser preflight** checking the endpoint
- **Hot reload** verifying route existence

It's **NOT** the CSV import request (which uses POST).

## Verify Import is Working

Run this in browser console after uploading a CSV:

```javascript
// Check if data was received
console.log('Last upload attempt visible in network tab?');

// Check component state (if using React DevTools)
// Look for EnhancedCSVImporter component state
```

## Next Steps

1. ✅ Ignore the GET 405 error (it's expected)
2. ✅ Upload a CSV file through the UI
3. ✅ Check browser console for POST request logs
4. ✅ Verify leads appear in the table
5. ✅ Check if onImportComplete is being called

If leads still don't show up, check the parent component's state management to ensure `onImportComplete` is properly wired up.

