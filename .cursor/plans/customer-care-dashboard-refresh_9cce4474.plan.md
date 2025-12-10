---
name: customer-care-dashboard-refresh
overview: Refresh CustomerCareDashboard to align with workflow states and pull real data instead of mock leads.
todos:
  - id: scope-data
    content: Confirm care buckets and data sources
    status: completed
  - id: wire-data
    content: Wire dashboard to services and normalize care items
    status: completed
  - id: metrics-ui
    content: Replace mock stats with live counts
    status: completed
  - id: care-table
    content: Show care list with details & quick actions
    status: completed
  - id: navigation-actions
    content: Hook actions to follow-up/order/appointment/refund flows
    status: completed
---

# Customer Care Dashboard Refresh

## What we’ll build
- Replace mock CustomerCareDashboard with live data reflecting care states from the workflow (care follow-ups, appointments, order issues, refunds).

## Plan
1) Scope-data
- Decide which datasets drive the care statuses: follow-ups (pending/overdue/done), appointments (upcoming/missed), orders needing care (issues/status), refunds awaiting action.

2) Data-wiring
- Add service calls/listeners to fetch required data (FollowUpService, AppointmentService, Order realtime list with status/issues, RefundService if needed). Normalize into care items with timestamps/status.

3) UI-metrics
- Replace mock stats with real counts per care bucket (e.g., overdue follow-ups, today’s appointments, orders pending care/refund). Add date filters if needed.

4) Table/Details
- Render care list (CommonTable) showing customer, phone, type (follow-up/appointment/order/refund), due date, status. Drawer shows details + quick actions (mark follow-up done, view order, open appointment modal).

5) Actions
- Hook quick actions to services: complete follow-up, navigate to order, open appointment/refund views.

6) Menu/Page wiring
- Ensure `/customers/customer-care` uses updated dashboard and menu label matches.

7) QA
- Verify filters (date/status/customer) and counts update correctly; ensure no mock data remains.