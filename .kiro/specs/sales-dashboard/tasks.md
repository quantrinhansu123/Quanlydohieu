# Implementation Plan

- [ ] 1. Create mock data utilities and types
  - Create TypeScript interfaces for all dashboard data models
  - Implement mock data generator functions for statistics, lead sources, conversion rates, and orders
  - Create utility functions for currency formatting and date formatting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.2_

- [ ]* 1.1 Write property test for currency formatting
  - **Property 2: Currency formatting consistency**
  - **Validates: Requirements 1.5**

- [ ] 2. Implement StatisticsCards component
  - Create component to display four key metrics in card layout
  - Integrate Ant Design Card and Statistic components
  - Add icons for each metric type
  - Implement responsive grid layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.1 Write property test for statistics display
  - **Property 1: Statistics display completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 3. Implement LeadSourceChart component
  - Create component using Recharts PieChart or BarChart
  - Implement data grouping logic for lead sources
  - Add color palette and assign distinct colors to categories
  - Handle empty state with appropriate message
  - Add tooltips for data points
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write property test for lead source grouping
  - **Property 3: Lead source grouping accuracy**
  - **Validates: Requirements 2.2**

- [ ]* 3.2 Write property test for color assignment
  - **Property 4: Distinct color assignment**
  - **Validates: Requirements 2.3**

- [ ] 4. Implement OrderConversionChart component
  - Create component using Recharts LineChart or ComposedChart
  - Implement conversion rate calculation logic
  - Display dual-axis chart with rate percentage and absolute numbers
  - Add interactive tooltips with detailed information
  - Handle empty state
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.1 Write property test for conversion rate calculation
  - **Property 5: Conversion rate calculation accuracy**
  - **Validates: Requirements 3.2**

- [ ]* 4.2 Write property test for time series completeness
  - **Property 6: Time series data completeness**
  - **Validates: Requirements 3.3**

- [ ]* 4.3 Write property test for tooltip accuracy
  - **Property 7: Tooltip data accuracy**
  - **Validates: Requirements 3.4**

- [ ] 5. Implement RecentOrdersTable component
  - Create table component using Ant Design Table
  - Implement order sorting by date descending
  - Format all order fields appropriately
  - Limit display to most recent orders
  - Apply status-based styling with visual indicators
  - Handle empty state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Write property test for order sorting
  - **Property 8: Order sorting correctness**
  - **Validates: Requirements 4.1**

- [ ]* 5.2 Write property test for order field completeness
  - **Property 9: Order field completeness**
  - **Validates: Requirements 4.2**

- [ ]* 5.3 Write property test for order limit
  - **Property 10: Order limit enforcement**
  - **Validates: Requirements 4.3**

- [ ]* 5.4 Write property test for status differentiation
  - **Property 11: Status visual differentiation**
  - **Validates: Requirements 4.4**

- [ ] 6. Create main SalesDashboardPage component
  - Set up page component at `src/app/(root)/sales-dashboard/page.tsx`
  - Integrate all child components (StatisticsCards, charts, table)
  - Implement mock data fetching with loading states
  - Add error handling with error boundaries
  - Implement responsive layout with Tailwind CSS
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.4_

- [ ]* 6.1 Write property test for loading state
  - **Property 12: Loading state visibility**
  - **Validates: Requirements 5.2**

- [ ]* 6.2 Write property test for error handling
  - **Property 13: Error state handling**
  - **Validates: Requirements 5.3**

- [ ]* 6.3 Write property test for responsive layout
  - **Property 14: Responsive layout adaptation**
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ] 7. Add navigation menu item
  - Update menu configuration to include Sales Dashboard link
  - Add appropriate icon for the menu item
  - _Requirements: All_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
