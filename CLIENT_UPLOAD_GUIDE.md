# IC101 Food App — Upload Guide

This guide walks you through uploading the app to **TestFlight** (for testing)
and then to the **App Store** (for public release) using the `.ipa` file your
developer will send you.

> **Recommended order:** Upload to TestFlight first, test the app on your
> iPhone, then submit the same build for App Store review once you're happy
> with it. You do **not** rebuild between TestFlight and App Store.

---

## What you'll need before starting

- A **Mac** (Transporter is Mac-only; if you only have a PC, see "No Mac?" at the bottom)
- The **`.ipa` file** from your developer (download link or attached file)
- Your **Apple ID** that's tied to the Apple Developer account ("Interstitial Cystitis Network")
- Your Apple Developer account must be **active and compliance-cleared**
- About **30 minutes** for the upload + processing
- For App Store submission only: privacy policy URL, screenshots, app description (see Part 3)

---

## Part 1 — Upload the `.ipa` using Transporter

Transporter is Apple's free upload tool.

### Step 1: Install Transporter

1. Open the **Mac App Store** on your Mac
2. Search for **"Transporter"** (the icon is a cardboard box with the Apple logo, made by Apple)
3. Click **Get** / **Install**

### Step 2: Sign in

1. Open Transporter
2. Sign in with your **Apple ID** (the one connected to your developer account)
3. If prompted for a verification code, check your trusted Apple devices

### Step 3: Upload the .ipa

1. **Drag the `.ipa` file** into the Transporter window
   *(or click the `+` button → choose the file)*
2. Transporter will run automatic checks (~30 seconds). You may see warnings — these are usually safe to ignore. **Errors** (red) need to be sent back to your developer.
3. Click **Deliver** in the top-right corner
4. Wait for the upload to finish — usually **2–10 minutes** depending on your internet speed
5. You'll see a green checkmark when done

### Step 4: Wait for Apple to process the build

- Apple now processes the upload on their servers
- This takes **10 minutes to 1 hour** (sometimes longer)
- You'll get an email from Apple titled something like *"Your build has completed processing"* when ready
- You can also check progress at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **IC101 Food App** → **TestFlight** tab

---

## Part 2 — Set up TestFlight (test the app first)

Once the build finishes processing, it appears under the **TestFlight** tab.

### Step 1: Complete the build's test info

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **IC101 Food App** → **TestFlight**
2. Click on the new build
3. Fill in **"What to Test"** (e.g., "Initial test build — please try logging in and browsing the menu")
4. Apple may ask about **Export Compliance** — answer **"No"** (the developer has already declared the app uses no non-exempt encryption, so this should be auto-skipped)

### Step 2: Add yourself as an Internal Tester

Internal testers get the build instantly without Apple review.

1. In the **TestFlight** tab, click **Internal Testing** → **+** (next to "Testers")
2. Add your own Apple ID email address
3. Apple sends you an invitation email

### Step 3: Install on your iPhone

1. On your iPhone, install the **TestFlight app** from the App Store (free, made by Apple)
2. Open the invitation email **on your iPhone** and tap **"View in TestFlight"**
3. The app will install on your iPhone — you can now test it

### (Optional) Step 4: Add external testers — e.g., team members or your developer

External testers need a one-time **Beta App Review** by Apple (~24 hours, first build only).

1. **External Testing** → **+** → create a group (e.g., "Team")
2. Add testers by email, OR enable a **Public Link** (`https://testflight.apple.com/join/...`) you can share with anyone
3. Submit the build for Beta App Review
4. Once approved, testers receive an email / can use the public link

---

## Part 3 — Submit to App Store (public release)

When you're happy with the TestFlight build, you can submit the **same build** to the App Store.

### Step 1: Prepare the required materials

You'll need all of these ready before submitting:

- **App icon** — already in the build, no action needed
- **Screenshots** — at minimum:
  - iPhone 6.9" display (e.g., iPhone 16 Pro Max): 3–10 screenshots, 1290×2796 pixels
  - iPhone 6.5" display: 3–10 screenshots, 1242×2688 pixels
  - (iPad screenshots only if the app is intended for iPad)
- **App description** — what the app does, in plain language (~200–500 words)
- **Promotional text** — short tagline (max 170 characters), can be updated anytime
- **Keywords** — comma-separated, max 100 characters total (e.g., "food, recipes, ic101, diet")
- **Subtitle** — short summary under the app name (max 30 characters)
- **Support URL** — a public webpage where users can get help (required)
- **Privacy Policy URL** — a public webpage with your privacy policy (required)
- **Category** — primary category (probably **Food & Drink**)
- **Age rating** — answered via questionnaire in App Store Connect
- **Copyright** — e.g., "© 2026 Interstitial Cystitis Network"

### Step 2: Fill in the App Store listing

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **IC101 Food App** → **App Store** tab
2. Click **iOS App** → **1.0 Prepare for Submission**
3. Fill in every field marked with an asterisk (`*`) using the materials from Step 1
4. Upload screenshots
5. Under **Build**, click **+** and select the build you uploaded via Transporter
6. Complete the **App Privacy** section (declare what data the app collects)
7. Complete the **Age Rating** questionnaire
8. Set **Pricing and Availability** — choose **Free** (or a price tier) and the countries/regions

### Step 3: Submit for review

1. Click **Add for Review** → review all fields → **Submit for Review**
2. Apple reviews the app — usually **24–72 hours**
3. You'll get an email when it's approved (or rejected with reasons)

### Step 4: Release

- If you chose **"Automatically release"**, the app goes live on the App Store as soon as it's approved
- If you chose **"Manually release"**, you click a button when you're ready

---

## Common issues

### Transporter won't accept the .ipa
- File may be corrupted during transfer — ask the developer to re-share via a direct download link rather than email attachment
- Check your Mac is signed into the same Apple ID that owns the developer account

### "Invalid Bundle" or signing errors
- The build is signed for a different team / certificate — send the error to your developer to re-sign

### Build doesn't appear in TestFlight after upload
- Wait at least 30 minutes — Apple processing is slow
- Check your email for an Apple message about processing failure (usually icon size or missing Info.plist key)

### Submit button is greyed out
- A required field is empty — scroll up and look for red `!` markers
- Compliance / agreements not signed — go to **Business** tab and ensure all agreements are Active

### Beta App Review rejected
- Read the rejection reason in App Store Connect → **TestFlight** tab
- Most common: app crashes on launch, missing test instructions, demo account not provided

---

## No Mac? Alternatives

If you don't have a Mac, you can still upload via:

- **Transporter on a borrowed Mac** — any Mac running macOS 12+ works
- **Web upload via App Store Connect** — less reliable but Mac-free; from the build page, use the upload feature (slower and more error-prone than Transporter)
- Ask your developer to upload from their side once their account compliance clears

---

## Questions?

If anything is unclear or you hit an error not listed above, take a screenshot and send it to your developer along with which step you were on.
