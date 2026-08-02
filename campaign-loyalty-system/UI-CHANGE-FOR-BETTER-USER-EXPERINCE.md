# UI/UX Redesign & Visual Architecture Guidelines

**Project:** Marathon Klassics – Campaign Loyalty System

**Objective:** Complete visual and user experience revamp aligning strictly with official brand guidelines and bottle imagery integration.

**Target Audience:** UI/UX Designers & Front-End AI Agents / Developers

---

## 1. Brand Guidelines & Visual Identity System

### **Typography: Acumin System**

The entire interface strictly uses **Acumin** (or *Acumin Pro*). Express visual hierarchy and brand energy purely by varying Acumin's **weight, size, line-height, letter-spacing, and color**:

* **Headlines & Impact Text:** Acumin Black / Bold / Ultra-Condensed (Uppercase, tight tracking, large scale).
* **Subheadings & Section Labels:** Acumin Medium / Semibold (Uppercase or Title Case, subtle letter-spacing).
* **Body Copy & Form Inputs:** Acumin Regular / Book (Clean, high legibility, balanced line height).
* **Timers & Numerical Data:** Acumin Bold / Semibold with tabular figures for consistent alignment.

### **Core Brand Color Palette**

* **Black (`#000000` / `#09090B`):** Dominant dark canvas, card backgrounds, and ultra-high contrast headers.
* **White (`#FFFFFF`):** Primary text, crisp surfaces, and inverse CTA buttons.
* **Light Grey (`#F4F4F5` / `#E4E4E7`):** Background contrast layers, subtle borders, input field containers, and secondary text.
* **Gold (`#D4AF37` / `#F59E0B`):** Brand flagship accent — reserved exclusively for campaign rewards, progress bar fill, tier milestones, and primary highlight badges.

### **Product & Bottle Category Accent Palette**

The UI incorporates dedicated color accents paired directly with bottle imagery to distinguish product lines:

* **Vodka Accent — Red (`#DC2626` / `#EF4444`):** Frame cards, scan alerts, or badges showcasing Vodka bottle visuals.
* **Gin Accent — Bottle Green (`#064E3B` / `#10B981`) & Yellow (`#EAB308`):** Dual accents used to frame Gin bottle visuals, tags, and product-specific reward cards.

---

## 2. Page-by-Page UI/UX Specifications

---

### Page 1: Public Home Page (`/`)

#### **Visual Layout & Bottle Showcase**

* **Hero Section:**
* Large, bold header rendered in **Acumin Black** over a deep Black backdrop with Light Grey visual accents.
* Dynamic bottle showcase grid featuring high-resolution PNG imagery of the **Vodka (Red accent line)** and **Gin (Bottle Green & Yellow accent line)** bottles.


* **Campaign Rule Steps:**
* 3-card visual breakdown using subtle Light Grey border framing.
* Acumin Semibold step titles with Gold accent indicators for key steps (*"Collect 10 Scans -> Claim Free Bottle/Drink"*).


* **Primary CTAs:**
* `Register Device` (Solid White button with Acumin Bold Black text).
* `Hotel Staff Login` (Outline button with Light Grey border and Acumin Medium text).



---

### Page 2: Customer Registration Page (`/register`)

#### **Visual Layout & Micro-Interactions**

* **Card Container:** Centered card with Black/Light Grey backdrop, framed with high-contrast borders.
* **Form Elements:**
* `Username` & `Phone Number` inputs with Light Grey fill, clear Acumin Regular label typography, and Gold focus rings.


* **Action Area:**
* Solid CTA button in **Acumin Bold Uppercase**.


* **Success Card Transition:**
* Fades in upon completion, featuring product bottle graphics (Vodka/Gin) alongside a Gold confirmation badge welcoming the guest to start scanning.



---

### Page 3: Scan Result Page (`/scan`)

> **Design Goal:** Immediate, mobile-optimized visual reward experience anchored by bottle graphics and clear Acumin typographic feedback.

#### **Visual Components & Dynamic States**

1. **Product Imagery & Progress Display:**
* Displays the relevant product bottle image (Vodka with Red accents or Gin with Bottle Green & Yellow accents) corresponding to the venue/campaign tier.
* **Acumin Bold Scan Counter:** Segmented progress bar or gauge transitioning into Gold as progress reaches `10/10`.


2. **State Feedback Banners:**
* **Success Scan (+1):** Vibrant Green accent border, bold Acumin headline, micro-animation on progress bar fill.
* **Cooldown Notice:** Light Grey card with Red/Yellow subtle warnings and a live countdown timer in **Acumin Bold Monospace**.
* **Daily Limit Reached:** Crimson Red framed card highlighting max scans reached for the hotel.
* **Expired Token:** Red border alert card with clear instructional copy in Acumin Regular.


3. **Reward Unlocked Card (10/10 Scans):**
* Glowing Gold border surrounding high-impact bottle imagery.
* Large prominent CTA: **"CONFIRM & CLAIM FREE DRINK"** rendered in **Acumin Black Uppercase**.



---

### Page 4: Hotel Dashboard (`/hotel/dashboard`)

#### **Visual Hierarchy & Layout**

* **Header Bar:** Crisp hotel identifier in Acumin Semibold with Light Grey navigation tabs.
* **Key Metrics Cards:**
* `Today's Scans` — White card with bold Acumin Black metrics.
* `Rewards Claimed` — Gold accented metric card.
* `Suspicious Activity` — Crimson Red accented indicator card.


* **Activity Table:**
* Dark background with Light Grey table row dividers.
* Category badges distinguishing Vodka scans (Red tag) vs. Gin scans (Bottle Green / Yellow tag).



---

### Page 5: Admin Dashboard (`/admin/dashboard`)

#### **Visual Hierarchy & Layout**

* **Stat Summary Strip:** High-level metrics displayed in varying Acumin weights (Black numbers, Medium labels).
* **Product & Hotel Management Tabs:**
* Clean layout featuring Drag & Drop file import zones styled in Light Grey with dashed borders.
* Hotel & Customer tables with slide-over drawers showing detailed scan histories and product interactions.


* **Security & Fraud Panel:**
* Audit log featuring flagged scan attempts with high-contrast Red tag chips.



---

### Page 6: Admin Hotel QR Management (`/admin/qr-manager`)

#### **Visual Hierarchy & Layout**

* **Location & Product Line Selector:** Minimalist dropdown using Acumin Medium text to toggle hotels and associated bottle reward lines (Vodka/Gin).
* **Display Card (Kiosk Mode):**
* Large, high-contrast QR code container framed with brand elements and bottle graphics.
* **2-Minute Countdown Bar:** Animated progress bar auto-refreshing every 2 minutes with smooth transition effects.



---

## 3. UI/UX Refinement Checklist for Implementation

* [ ] Standardized typography strictly to **Acumin** (varying weights: Light, Regular, Medium, Semibold, Bold, Black).
* [ ] Applied core brand palette (**Black, White, Light Grey, Gold**).
* [ ] Integrated product-line bottle accents (**Red** for Vodka, **Bottle Green & Yellow** for Gin).
* [ ] Incorporated high-resolution bottle image containers across Home, Scan Result, and Dashboard views.
* [ ] Maintained mobile-first responsiveness and high-contrast touch targets (minimum 48px height).