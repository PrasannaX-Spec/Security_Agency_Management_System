"""Legal content served by the API.

IMPORTANT - Mentor review required:
This text was written for a student project from the real behavior described
in PRD.md. It is not legal advice. Have your mentor review it. If this system
is ever used in production, a lawyer must review it under the applicable data
protection law.

Change the text only together with a new LEGAL_VERSION and updated_on value,
so that users are prompted to accept again.
"""

LEGAL_VERSION = "1.0"

TERMS = {
    "title": "Terms and Conditions",
    "version": LEGAL_VERSION,
    "updated_on": "2026-10-03",
    "sections": [
        {
            "heading": "About This Service",
            "body": (
                "This system is used by the security agency to manage guard "
                "information, schedule duties, verify attendance, and monitor "
                "guards during active shifts. It is intended for use by the "
                "agency's staff: administrators, supervisors, and security guards."
            ),
        },
        {
            "heading": "Account Responsibility",
            "body": (
                "Your account is created by the agency administrator. You are "
                "responsible for keeping your login credentials confidential. "
                "Do not share your username or password with anyone. If you "
                "believe your account has been compromised, notify your "
                "administrator immediately."
            ),
        },
        {
            "heading": "Acceptable Use",
            "body": (
                "Use this system only for its intended purpose: managing and "
                "carrying out security duties. Do not attempt to access data or "
                "features outside your assigned role. Do not submit false "
                "incident reports, attendance records, or emergency alerts."
            ),
        },
        {
            "heading": "Location Tracking During Duty",
            "body": (
                "If you are a security guard, the mobile application collects "
                "your GPS location every 30 seconds from the time you check in "
                "to a shift until you check out. This data is used to verify "
                "your presence at the assigned location and to display your "
                "position on the supervisor's live map. Location tracking does "
                "not occur outside of active shifts. By accepting these terms, "
                "you consent to this location collection during duty."
            ),
        },
        {
            "heading": "Accuracy of Records and Reports",
            "body": (
                "Attendance records, incident reports, and performance data are "
                "generated from your interactions with the system. You are "
                "responsible for checking in and out of shifts accurately. The "
                "agency relies on this data for operational decisions."
            ),
        },
        {
            "heading": "Service Availability",
            "body": (
                "The agency aims to keep the system available during operational "
                "hours, but does not guarantee uninterrupted access. Maintenance "
                "or technical issues may cause temporary downtime. The agency is "
                "not liable for losses caused by system unavailability."
            ),
        },
        {
            "heading": "Changes to These Terms",
            "body": (
                "The agency may update these terms. When the terms change, you "
                "will be asked to review and accept the new version before "
                "continuing to use the system. The version number and date at "
                "the top of this page indicate the current version."
            ),
        },
        {
            "heading": "Contact",
            "body": (
                "For questions about these terms, contact your agency "
                "administrator."
            ),
        },
    ],
}

PRIVACY = {
    "title": "Privacy Policy",
    "version": LEGAL_VERSION,
    "updated_on": "2026-10-03",
    "sections": [
        {
            "heading": "What We Collect",
            "body": (
                "The system collects the following personal data: your full "
                "name, phone number, national ID number, date of birth, "
                "address, years of experience, and joining date. It also stores "
                "your login credentials (username and hashed password), "
                "attendance records, shift schedules, incident reports, "
                "emergency alerts, and quick request messages."
            ),
        },
        {
            "heading": "Location Data",
            "body": (
                "If you are a security guard, the mobile application collects "
                "your GPS coordinates every 30 seconds while you are checked in "
                "to an active shift. Location collection starts at check-in and "
                "stops at check-out. Location data older than 30 days is "
                "automatically deleted from the system."
            ),
        },
        {
            "heading": "Who Can See Your Data",
            "body": (
                "Your data is accessible to agency administrators, who have "
                "full access to all records. Supervisors can only see data for "
                "guards and locations assigned to them. Guards can see only "
                "their own records. No other parties have access to your data "
                "through this system."
            ),
        },
        {
            "heading": "Why We Collect This Data",
            "body": (
                "Personal and employment data is collected to manage guard "
                "assignments and maintain personnel records. Location data is "
                "collected to verify attendance at assigned sites and to provide "
                "supervisors with a live view of on-duty guards for safety "
                "purposes. Incident and emergency data is collected to support "
                "rapid response and record-keeping."
            ),
        },
        {
            "heading": "Data Protection",
            "body": (
                "Passwords are stored using one-way hashing and are never "
                "visible in plain text. All communication between the "
                "application and the server uses HTTPS encryption in "
                "production. Access to data is controlled by role-based "
                "permissions."
            ),
        },
        {
            "heading": "Third Parties",
            "body": (
                "The system does not sell, trade, or transfer your personal "
                "data to outside parties. The following third-party services "
                "are used: a hosting provider (for running the server and "
                "database), and OpenStreetMap (for map tiles displayed in the "
                "application). OpenStreetMap receives standard web requests "
                "when maps are loaded but does not receive your personal data."
            ),
        },
        {
            "heading": "Data Retention",
            "body": (
                "Location tracking data is kept for 30 days and then "
                "automatically deleted. Other records (attendance, incidents, "
                "shift schedules, personnel data) are retained for the duration "
                "of your employment and may be kept afterward for the agency's "
                "operational and legal needs."
            ),
        },
        {
            "heading": "Your Rights",
            "body": (
                "You may request to view, correct, or delete your personal "
                "data by contacting your agency administrator. Account "
                "deactivation is handled by the administrator. Deactivated "
                "accounts are soft-deleted: the data is retained but the "
                "account cannot be used to log in."
            ),
        },
        {
            "heading": "Contact",
            "body": (
                "For questions about this privacy policy or your data, contact "
                "your agency administrator."
            ),
        },
        {
            "heading": "Disclaimer",
            "body": (
                "This privacy policy was written for a student project and is "
                "not legal advice. Have your mentor or a qualified legal "
                "professional review it before any real-world use."
            ),
        },
    ],
}
