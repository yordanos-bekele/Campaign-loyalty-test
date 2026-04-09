# Campaign Loyalty System Stakeholder Documentation

## 1. Executive Summary

The `Campaign Loyalty System` supports a `Marathon Klassics` hotel-based loyalty campaign where guests scan a hotel QR code to build progress toward a free beer reward.

The platform is designed to:

- increase repeat guest engagement
- make participation simple for guests
- give hotels a lightweight operational flow
- give Marathon Klassics visibility into campaign performance and suspicious activity

The reward model is straightforward: a guest earns `1 free beer after 10 valid scans at the same hotel`.

## 2. Campaign Goal

The campaign turns repeat guest visits into a measurable loyalty journey.

For the business, this means:

- encouraging repeat purchases
- creating a visible in-venue promotion through QR codes
- collecting campaign activity data by hotel
- reducing abuse through automated scan controls and fraud monitoring

## 3. Who This Is For

### Marathon Klassics Admin Team

The admin team oversees the full campaign and uses the system to:

- register hotels
- import hotel data in bulk
- import loyal customer data in bulk
- generate and manage hotel QR codes
- monitor overall campaign activity
- review suspicious scan behavior
- review customer-level engagement and rewards

### Hotel Staff

Hotel users access only their own hotel dashboard to:

- log in securely
- view hotel performance for the day
- see suspicious scan activity linked to their location
- support local campaign execution without needing manual reward approval

### Loyal Customers / Guests

Guests interact with the simplest part of the system. They can:

- register as loyal customers
- scan a hotel QR code
- immediately see whether the scan counted
- track progress toward the free beer reward

## 4. End-to-End Experience

### Guest Journey

1. The guest visits a participating hotel.
2. The hotel displays a QR code tied to that hotel.
3. The guest scans the code on their phone.
4. The system automatically checks whether the scan is valid.
5. The guest sees an instant result:
   - valid progress update
   - rejection reason if the scan does not qualify
   - reward confirmation when the 10th valid scan is reached

This flow is intentionally friction-light:

- no OTP
- no staff approval
- no extra approval step at scan time

### Hotel Journey

1. Hotel staff log in to the hotel dashboard.
2. They view current daily campaign activity for their property.
3. They can monitor scans, rewards given, and suspicious activity.
4. They do not manage public campaign pages or system-wide settings.

### Admin Journey

1. Marathon Klassics admin logs in through a separate admin route.
2. Admin monitors total scans, rewards, registered hotels, and customers.
3. Admin generates hotel-specific QR codes.
4. Admin imports hotels and loyal customers when needed.
5. Admin reviews fraud and suspicious scan patterns.

## 5. Core Business Rules

The campaign fairness model depends on a few strict rules:

- A guest is identified by a device-based ID stored in the browser.
- The same device identity can also be passed in a request header for deployed cross-origin environments.
- A valid scan must happen at least `60 minutes` after the previous valid scan for the same guest at the same hotel.
- A guest can have at most `3 valid scans per hotel per day`.
- QR tokens rotate every `2 minutes` and expired tokens are rejected.
- Only scans at the same hotel count toward that hotel’s reward progress.
- Every valid and invalid scan is logged for reporting and fraud analysis.
- When a guest reaches `10 valid scans`, the system creates a reward record and resets the count for the next cycle.

## 6. Fraud and Misuse Protection

The system is built to discourage repeated invalid attempts and surface suspicious patterns early.

It does this by:

- rejecting invalid or expired QR tokens
- rejecting scans that happen too soon after a previous valid scan
- rejecting scans after the daily scan limit is reached
- storing IP address and user agent for scan analysis
- logging rejection reasons for invalid attempts
- flagging suspicious behavior when:
  - more than 2 rejected scans happen within 10 minutes
  - or the same violation repeats within 1 hour

This gives Marathon Klassics a clearer view of abuse risk without adding extra friction for normal guests.

## 7. What Stakeholders Can Expect in the Product

### Public Experience

- a campaign home page for Marathon Klassics
- a loyal customer signup entry point
- a hotel login entry point
- no public exposure of hotel QR management controls

### Loyal Customer Registration

- separate registration page
- simple registration form
- browser/device identity saved automatically
- confirmation after successful signup

### Scan Experience

- scan page opens directly from the QR code
- scan submission happens automatically on page load
- result is shown immediately
- next eligible scan time is shown when the time rule blocks the scan
- reward message is shown when the guest earns the reward

### Hotel Dashboard

- hotel-only access
- scans today
- rewards given
- suspicious scan count

### Admin Dashboard

- admin-only access
- overall campaign statistics
- hotel registration and hotel list
- hotel bulk import
- loyal customer bulk import
- registered customer count
- customer analytics
- fraud summary and suspicious activity monitoring
- QR generation management

## 8. Reporting Value for the Business

The platform gives Marathon Klassics operational and campaign insight in one place.

Expected reporting value includes:

- understanding hotel-by-hotel campaign performance
- measuring daily scan activity
- seeing how many rewards are actually earned
- identifying loyal customers with strong repeat engagement
- spotting unusual rejection patterns before they become a larger issue

## 9. Technology Summary

This solution is implemented with a modern web application stack:

- `Frontend:` React
- `Backend:` Spring Boot (Java)
- `Database:` PostgreSQL

Supporting delivery choices include:

- Flyway for schema migrations
- Docker-based deployment support
- frontend deployment readiness for Vercel
- backend deployment readiness for Render

## 10. Deployment View

The current project setup is intended for:

- `Frontend:` Vercel
- `Backend:` Render

This supports a cloud-hosted campaign model where:

- guests access the scan page from their own phones
- the frontend can communicate securely with the backend across domains
- device identity can still be preserved through cookie and header-based handling

## 11. Success Indicators

From a stakeholder perspective, the campaign can be considered successful when it delivers:

- smooth guest participation with minimal effort
- visible reward progression that encourages return visits
- reliable hotel-level and campaign-level reporting
- fraud controls that reduce misuse without slowing down valid users
- simple administration for rollout and monitoring

## 12. Scope Boundaries

This project is designed around an automated loyalty flow. It does not depend on:

- OTP verification
- manual staff approval for each scan
- publicly accessible QR admin controls

That makes the system faster to use and easier to operate during active promotions.

## 13. Recommended Stakeholder Message

If you need a short non-technical description for presentations or updates, use:

`The Campaign Loyalty System helps Marathon Klassics run a hotel-based QR loyalty promotion where guests earn a free beer after 10 valid scans, while hotels and admins get clear campaign reporting and built-in fraud monitoring.`
