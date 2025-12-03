# Sales Dashboard Design Document

## Overview

The Sales Dashboard is a comprehensive analytics interface that provides real-time insights into sales performance. It displays key metrics through statistics cards, visualizes data trends through charts, and presents recent order activity in a tabular format. The dashboard is built using Next.js 16, React 19, Ant Design 6, and Recharts for data visualization.

## Architecture

The Sales Dashboard follows a component-based architecture with clear separation of concerns:

### Component Hierarchy
```
SalesDashboardPage
├── StatisticsCards (Revenue, New Customers, Processing Orders, Completed Orders)
├── ChartsSection
│   ├── LeadSourceChart
│   └── OrderConversionChart
└── RecentOrdersTable
```

### Data Flow
1. Page component fetches aggregated data from the backend API
2. Data is distributed to child components via props
3. Each component handles its own rendering and local state
4. Loading and error states are managed at the page level

### Technology Stack
- **Frontend Framework**: Next.js 16 with App Router
- **UI Library**: Ant Design 6 (Card, Table, Statistic, Spin, Alert)
- **Charts**: Recharts 3.5 (BarChart, LineChart, PieChart)
- **Styling**: Tailwind CSS 4 with custom theme tokens
- **State Management**: React hooks for local state
- **Data Fetching**: React Server Components with async/await

## Components and Interfaces

### 1. SalesDashboardPage Component
**Location**: `src/app/(root)/sales-dashboard/page.tsx`

**Responsibilities**:
- Fetch dashboard data from API
- Handle loading and error states
- Coordinate layout and responsive behavior
- Pass data to child components

**Interface**:
```typescript
interface DashboardData {
  statistics: {
    revenue: number;
    newCustomers: number;
    processingOrders: number;
    completedOrders: number;
  };
  leadSources: Array<{
    source: string;
    count: number;
  }>;
  conversionRates: Array<{
    period: string;
    rate: number;
    leads: number;
    orders: number;
  }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    orderDate: string;
    status: OrderStatus;
    totalAmount: number;
  }>;
}
```

### 2. StatisticsCards Component
**Location**: `src/components/SalesDashboard/StatisticsCards.tsx`

**Responsibilities**:
- Display four key metrics in card format
- Format currency and numbers appropriately
- Provide visual hierarchy with icons

**Props**:
```typescript
interface StatisticsCardsProps {
  revenue: number;
  newCustomers: number;
  processingOrders: number;
  completedOrders: number;
}
```

### 3. LeadSourceChart Component
**Location**: `src/components/SalesDashboard/LeadSourceChart.tsx`

**Responsibilities**:
- Visualize lead sources using a pie or bar chart
- Handle empty state
- Provide interactive tooltips

**Props**:
```typescript
interface LeadSourceChartProps {
  data: Array<{
    source: string;
    count: number;
  }>;
}
```

### 4. OrderConversionChart Component
**Location**: `src/components/SalesDashboard/OrderConversionChart.tsx`

**Responsibilities**:
- Display conversion rate trends over time
- Show dual-axis chart (rate percentage and absolute numbers)
- Provide hover interactions

**Props**:
```typescript
interface OrderConversionChartProps {
  data: Array<{
    period: string;
    rate: number;
    leads: number;
    orders: number;
  }>;
}
```

### 5. RecentOrdersTable Component
**Location**: `src/components/SalesDashboard/RecentOrdersTable.tsx`

**Responsibilities**:
- Display recent orders in tabular format
- Format dates and currency
- Apply status-based styling
- Handle empty state

**Props**:
```typescript
interface RecentOrdersTableProps {
  orders: Array<{
    id: string;
    customerName: string;
    orderDate: string;
    status: OrderStatus;
    totalAmount: number;
  }>;
  loading?: boolean;
}
```

## Data Models

### OrderStatus Enum
```typescript
enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

### Dashboard Statistics
```typescript
interface DashboardStatistics {
  revenue: number;           // Total revenue in VND
  newCustomers: number;      // Count of new customers
  processingOrders: number;  // Count of orders in processing
  completedOrders: number;   // Count of completed orders
}
```

### Lead Source Data
```typescript
interface LeadSource {
  source: string;   // e.g., "Website", "Social Media", "Referral"
  count: number;    // Number of leads from this source
}
```

### Conversion Rate Data
```typescript
interface ConversionRate {
  period: string;   // Time period label (e.g., "Jan 2024")
  rate: number;     // Conversion percentage (0-100)
  leads: number;    // Total leads in period
  orders: number;   // Total orders in period
}
```

### Recent Order
```typescript
interface RecentOrder {
  id: string;
  customerName: string;
  orderDate: string;        // ISO date string
  status: OrderStatus;
  totalAmount: number;      // Amount in VND
}
```

##
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, several properties can be combined or are redundant:
- Properties 1.1-1.4 (displaying individual statistics) can be combined into a single property that verifies all statistics are displayed
- Properties 2.1 and 3.1 (chart rendering) are covered by more specific properties about their data
- Properties 6.1 and 6.2 (responsive layout) can be combined into a single responsive behavior property

### Property 1: Statistics display completeness
*For any* dashboard data with statistics, all four key metrics (revenue, new customers, processing orders, completed orders) should be rendered in the UI
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Currency formatting consistency
*For any* numeric currency value, the formatting function should produce a string with proper locale formatting (VND with thousand separators)
**Validates: Requirements 1.5**

### Property 3: Lead source grouping accuracy
*For any* collection of lead data, grouping by source should produce counts that sum to the total number of leads
**Validates: Requirements 2.2**

### Property 4: Distinct color assignment
*For any* set of lead source categories, each category should be assigned a unique color from the color palette
**Validates: Requirements 2.3**

### Property 5: Conversion rate calculation accuracy
*For any* pair of lead count and order count where leads > 0, the calculated conversion rate should equal (orders / leads) * 100
**Validates: Requirements 3.2**

### Property 6: Time series data completeness
*For any* array of conversion rate data points, the chart should render all provided data points in chronological order
**Validates: Requirements 3.3**

### Property 7: Tooltip data accuracy
*For any* chart data point, the tooltip should display all relevant fields from that data point
**Validates: Requirements 3.4**

### Property 8: Order sorting correctness
*For any* array of orders, sorting by date descending should place the most recent order first
**Validates: Requirements 4.1**

### Property 9: Order field completeness
*For any* order in the table, all required fields (ID, customer name, date, status, amount) should be present in the rendered row
**Validates: Requirements 4.2**

### Property 10: Order limit enforcement
*For any* array of orders larger than the display limit, only the specified number of most recent orders should be displayed
**Validates: Requirements 4.3**

### Property 11: Status visual differentiation
*For any* two orders with different statuses, their rendered status indicators should have different visual properties (color, icon, or text)
**Validates: Requirements 4.4**

### Property 12: Loading state visibility
*For any* component in loading state, a loading indicator should be visible in the UI
**Validates: Requirements 5.2**

### Property 13: Error state handling
*For any* error state, an error message and retry mechanism should be present in the UI
**Validates: Requirements 5.3**

### Property 14: Responsive layout adaptation
*For any* viewport width below the mobile breakpoint, the dashboard layout should switch to vertical stacking
**Validates: Requirements 6.1, 6.2, 6.4**

## Error Handling

### Data Fetching Errors
- **Network Failures**: Display user-friendly error message with retry button
- **Invalid Response**: Log error details and show generic error message
- **Timeout**: Show timeout message with option to retry

### Data Validation Errors
- **Missing Required Fields**: Use fallback values (0 for numbers, empty array for lists)
- **Invalid Data Types**: Log warning and skip invalid entries
- **Negative Values**: Display as 0 or show validation warning

### Chart Rendering Errors
- **Empty Data**: Display empty state message with helpful text
- **Invalid Data Format**: Log error and show fallback message
- **Rendering Failure**: Catch errors in error boundary and show fallback UI

### Component Error Boundaries
Each major section (statistics, charts, table) should have its own error boundary to prevent cascading failures.

## Testing Strategy

### Unit Testing
The testing approach will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** will cover:
- Specific examples of currency formatting (e.g., 1000000 → "1,000,000 ₫")
- Empty state rendering for charts and tables
- Error boundary behavior
- Specific status color mappings

**Property-Based Testing** will use **fast-check** library for JavaScript/TypeScript to verify universal properties:

### Property-Based Testing Configuration
- **Library**: fast-check (npm package)
- **Minimum Iterations**: 100 runs per property test
- **Test Location**: Co-located with components using `.test.tsx` suffix

### Property Test Specifications

Each property-based test must:
1. Be tagged with a comment referencing the design document property
2. Use the format: `// Feature: sales-dashboard, Property {number}: {property_text}`
3. Run at least 100 iterations with randomized inputs
4. Test one correctness property per test function

### Test Data Generators
Smart generators will be created for:
- **Dashboard Statistics**: Random positive integers within realistic ranges
- **Lead Sources**: Random source names with positive counts
- **Conversion Data**: Constrained so leads ≥ orders ≥ 0
- **Orders**: Valid order objects with realistic dates and statuses
- **Viewport Sizes**: Random widths covering mobile, tablet, and desktop ranges

### Integration Testing
- Test complete dashboard data flow from API to UI
- Verify responsive behavior at different breakpoints
- Test user interactions (hover, click, retry)

### Visual Regression Testing
- Capture screenshots of dashboard in different states
- Compare against baseline for visual changes
- Test across different viewport sizes

## Implementation Notes

### Performance Considerations
- Use React.memo for chart components to prevent unnecessary re-renders
- Implement virtual scrolling if order table grows large
- Lazy load chart library to reduce initial bundle size
- Cache formatted currency strings

### Accessibility
- Ensure all charts have proper ARIA labels
- Provide text alternatives for visual data
- Maintain keyboard navigation for interactive elements
- Use semantic HTML elements

### Internationalization
- Use locale-aware number and currency formatting
- Support date formatting based on user locale
- Prepare for multi-language support in labels

### Browser Compatibility
- Test on Chrome, Firefox, Safari, Edge
- Ensure chart interactions work on touch devices
- Provide fallbacks for older browsers if needed
