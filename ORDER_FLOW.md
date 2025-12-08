# System Specification: Order Workflow, Products, Members, and Tracking (Firebase Realtime Database)

## Overview

Build a production workflow management module using Firebase Realtime Database.
The system must support orders, multiple products per order, multiple workflow
steps per product, and the assignment of multiple members to each step. All data
must be synchronized in real time.

---

## Requirements

### 1. Orders

- Each order contains:

  - Order metadata (order code, createdBy, createdAt, customer info)
  - A list of products

- Each product inside an order contains:

  - Product metadata (name, quantity)
  - A list of workflow steps cloned from predefined workflow templates

### 2. Workflow Steps (Templates)

- Workflow steps are managed in a separate section (`/workflows`)
- Each workflow step template includes:

  - `name`
  - Optional default members

- When creating a new order, product steps are automatically populated based on
  these workflow templates.

### 3. Members

- Members are stored in `/members`
- Each member has `id`, `name`, and a `role` field.
- Workflow steps can have multiple assigned members.

### 4. Workflow Execution Tracking

For every workflow step inside an order:

- Track `status` (`pending`, `in_progress`, `completed`)
- Track `completedQuantity`
- Track list of assigned members
- Track `updatedAt` timestamp

### 5. Real-time Updates

- Any update to workflow steps must sync in real time.
- Typical updates include:

  - Updating `completedQuantity`
  - Changing `status`
  - Adding or removing members from a step

---

## Firebase Realtime Database Schema

### **Workflows (Step Templates)**

```json
{
  "workflows": {
    "workflowCode001": {
      "name": "Cutting",
      "defaultMembers": ["NV001", "NV002"],
      "createdAt": 1733392100
    },
    "workflowCode002": {
      "name": "Sewing",
      "defaultMembers": ["NV001"],
      "createdAt": 1733392100
    }
  }
}
```

---

### **Members**

```json
{
  "members": {
    "NV001": { "name": "Nguyen Van A", "role": "worker" },
    "NV002": { "name": "Tran Thi B", "role": "worker" },
    "NV003": { "name": "Le Van Sale", "role": "sale" }
  }
}
```

---

### **Orders**

```json
{
  "orders": {
    "orderId001": {
      "code": "ORD001",
      "customerName": "Linh",
      "createdBy": "NV003",
      "createdAt": 1733392300,
      "products": {
        "productId001": {
          "name": "Women's T-Shirt",
          "quantity": 100,
          "steps": {
            "step1": {
              "workflowCode": "workflowCode001",
              "name": "Cutting",
              "members": { "NV001": true, "NV002": true },
              "status": "pending",
              "completedQuantity": 0,
              "updatedAt": 1733392300
            },
            "step2": {
              "workflowCode": "workflowCode002",
              "name": "Sewing",
              "members": { "NV001": true },
              "status": "pending",
              "completedQuantity": 0,
              "updatedAt": 1733392300
            }
          }
        }
      }
    }
  }
}
```

---

## API / Actions Copilot Must Implement

### **1. Fetch Workflow Templates**

- Path: `/workflows`
- Used when creating new orders.

### **2. Create New Order**

- Generate a new order entry under `/orders/{orderId}`
- Clone workflow steps from `/workflows`
- Attach workflow steps to each product inside the order

### **3. Update Workflow Step Progress**

- Update path: `/orders/{orderId}/products/{productId}/steps/{stepId}`
- Support:

  - Updating `completedQuantity`
  - Updating `status`
  - Updating `members`

### **4. Assign or Remove Members**

- Update member list:

  ```
  members: { memberId: true }
  ```

---

## Additional Implementation Rules

- Use object maps instead of arrays for members, products, and steps to avoid
  array index issues in Firebase.
- Always update timestamps using server time.
- All reads and writes must be optimized for Realtime Database (no unnecessary
  deep listeners).
- Ensure structure is scalable for potentially thousands of workflow updates per
  day.
