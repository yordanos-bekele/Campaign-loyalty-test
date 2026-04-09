# Campaign Loyalty System App Guide

This guide explains how to use the app step by step for each role:

- Admin
- Hotel
- Customer

## 1. App Entry Points

Use these main pages in the app:

- `Home page:` `/`
- `Customer registration page:` `/register`
- `Admin page:` `/admin`

From the home page, hotel users can open the hotel login area.

## 2. Admin Guide

The admin role is for the Marathon Klassics team managing the campaign across all hotels.

### Step 1: Open the admin page

Go to:

- `/admin`

You will see the admin login form.

### Step 2: Log in as admin

Enter:

- admin username
- admin password

Click:

- `Open admin dashboard`

### Step 3: Review overall campaign performance

After login, the admin dashboard shows:

- total scans today
- total rewards given
- total suspicious scans
- registered customer count

Use this screen to get a quick picture of how the campaign is performing.

### Step 4: Register a hotel manually

In the `Register a hotel` section:

1. Enter the hotel name.
2. Enter the hotel location.
3. Enter a password for that hotel.
4. Click `Register hotel`.

Use this when onboarding one hotel at a time.

### Step 5: Import hotels in bulk

In the `Bulk import from Excel` section:

1. Prepare an Excel file for hotels.
2. Use the hotel import field.
3. Select the `.xlsx` file.
4. Wait for the import summary.

Expected hotel columns:

- `name`
- `password`
- optional `location`

### Step 6: Import loyal customers in bulk

In the same `Bulk import from Excel` section:

1. Prepare an Excel file for customers.
2. Use the customer import field.
3. Select the `.xlsx` file.
4. Wait for the import summary.

Expected customer columns:

- `full name`
- `phone number`
- optional `email`
- optional `device id`

### Step 7: Generate a hotel QR code

In the `Hotel QR display` section:

1. Enter the hotel ID.
2. Click `Generate QR`.
3. Confirm the hotel details displayed on screen.
4. Show the generated QR code on a tablet, monitor, or hotel phone.

Important behavior:

- the QR code is guest-facing
- it refreshes automatically every 2 minutes
- guests scan it with their own phones

### Step 8: Copy the guest scan link if needed

After a QR is generated:

1. Use the copy action in the QR section.
2. Share the scan link if you need a direct guest-access link.

### Step 9: Review the registered hotel list

In the `Registered hotels` section, admin can:

- confirm hotels are onboarded
- check hotel names and locations
- confirm the hotel ID used for QR generation

### Step 10: Review customer analytics

In the admin dashboard:

1. Click the `Registered customers` card or `Show list`.
2. Open the customer analytics view.
3. Review each customer’s:
   - name
   - phone number
   - email if available
   - reward count
   - valid scan count

This is useful for understanding repeat engagement and top participants.

### Step 11: Refresh or log out

Use:

- `Refresh` to reload dashboard data
- `Logout` to end the admin session

## 3. Hotel Guide

The hotel role is for hotel staff who need to view their hotel’s campaign performance.

### Step 1: Open the home page

Go to:

- `/`

### Step 2: Open the hotel login area

On the home page:

1. Click `Hotel login`.
2. The hotel login form will appear.

### Step 3: Log in with hotel credentials

Enter:

- hotel name
- hotel password

Click:

- `Open hotel dashboard`

### Step 4: Review the hotel dashboard

After login, the hotel dashboard shows:

- scans today
- rewards given
- suspicious scans

This gives hotel staff a quick operational view of the campaign at their location.

### Step 5: Refresh dashboard data

Use the `Refresh` button when you want the latest numbers.

### Step 6: Log out

Use the `Logout` button when finished.

### What hotel users do not manage

Hotel users do not use this app area to:

- create hotels
- import hotels
- import customers
- manage admin settings
- control campaign-wide reporting

Those actions belong to the admin role.

## 4. Customer Guide

The customer role is for guests joining the loyalty campaign and collecting valid scans.

### Step 1: Open the customer registration page

Go to:

- `/register`

### Step 2: Register as a loyal customer

Enter:

- username
- phone number

Then click the registration button.

The app will:

- save your profile
- keep your device identity in the browser
- connect future scans from that browser to your loyalty profile

### Step 3: Confirm your registration

After successful registration, the app shows:

- registration confirmation
- your saved profile details
- your browser device ID

### Step 4: Scan the hotel QR code

At the hotel:

1. Open your phone camera or QR scanner.
2. Scan the hotel QR code.
3. The scan page opens automatically.
4. The app submits the scan automatically.

No extra form is required on the scan page.

### Step 5: Read the scan result

The result page may show one of these outcomes:

- your scan counted successfully
- your scan was too soon after the last valid scan
- you reached the daily limit for that hotel
- the QR code was invalid or expired
- you earned a reward

### Step 6: Check your progress

After each valid scan, the page shows:

- current valid scan count
- remaining scans before reward

The campaign rule is:

- `10 valid scans at the same hotel = 1 free beer`

### Step 7: If your scan is rejected

If the scan is rejected:

- read the message shown on screen
- if it says you scanned too soon, wait until the next allowed time
- if it says daily limit reached, try again the next day
- if it says QR invalid or expired, ask hotel staff to refresh the QR code

### Step 8: If you earn the reward

When your 10th valid scan is accepted:

- the app shows a reward-earned message
- the reward is recorded in the system
- your progress resets for the next reward cycle

The screen may be shown to hotel staff if confirmation is needed.

## 5. Simple Operating Flow for the Whole Campaign

If you want the shortest possible operational flow, use this:

1. Admin creates or imports hotels.
2. Admin generates a QR code for a hotel.
3. Hotel displays that QR code for guests.
4. Customer registers once on their phone browser.
5. Customer scans the hotel QR during visits.
6. The app validates the scan automatically.
7. Admin and hotel users monitor results in their dashboards.

## 6. Important Rules to Remember

- A customer must use the same device/browser for consistent tracking.
- A valid scan must be at least 60 minutes after the previous valid scan at the same hotel.
- A customer can only get 3 valid scans per hotel per day.
- QR codes expire and refresh every 2 minutes.
- Rewards are earned after 10 valid scans at the same hotel.

## 7. Troubleshooting Tips

### For Admin

- If login fails, check the configured admin credentials.
- If import fails, confirm the Excel column names match the expected format.
- If QR generation fails, confirm the hotel exists and the backend is running.

### For Hotel

- If login fails, confirm the hotel name and password.
- If dashboard numbers do not look updated, use `Refresh`.

### For Customer

- If the QR does not work, scan again using a fresh code.
- If progress is missing, use the same browser/device used for earlier scans.
- If told to wait, return after the displayed next allowed scan time.
