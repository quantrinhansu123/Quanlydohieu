
Tôi sẽ chia theo 3 phần: **(1) Bản chất yêu cầu**, **(2) Quy trình thực tế từ Order → Sản phẩm → Công đoạn → Phòng ban**, **(3) Cách map sang hệ thống của bạn**.

Giải thích gọn, không triết lý quản trị doanh nghiệp đâu.

---

# 1. BẢN CHẤT YÊU CẦU BÊN HỌ (TÓM TẮT CHO LẬP TRÌNH VIÊN)

Bên họ muốn:

### **1) Mỗi order → chứa nhiều sản phẩm → mỗi sản phẩm chạy qua nhiều phòng ban (da, giày dép, xi mạ…).**

Không phải sản phẩm nào cũng đi đủ vòng. Tùy loại.

### **2) Mỗi phòng ban có quy trình riêng, chia thành nhiều giai đoạn/bước.**

Ví dụ phòng xi mạ:

* Đúc chốt → Xi mạ → Mạ niken → Mạ vàng → Thành phẩm.

Phòng đồ da:

* Vệ sinh → Khâu → Phục hồi màu → Thay khóa → Khác…

Phòng dán/ép đế giày dép:

* Thay đế → Dán Vibram → Vệ sinh → Repaint đế…

### **3) Ở mỗi bước có thể có nhiều kỹ thuật viên cùng làm.**

Công việc nhóm, không phải 1 người.

### **4) Khi bước A xong → hệ thống tự chuyển sang bước B + giao việc cho đúng phòng ban/nhân sự.**

### **5) Quản lý muốn:**

* Xem mọi quy trình đang đứng ở đâu.
* Ai đang làm, làm đến đâu.
* Thời gian trung bình từng bước.
* Tình trạng trễ hạn.
* Báo cáo hiệu suất theo phòng ban/kỹ thuật viên.

Nói ngắn: **Họ muốn hệ thống workflow automation giống Trello + BPMN + ERP mini.**

---

# 2. QUY TRÌNH THỰC TẾ HOÁ → ĐỂ BẠN DỄ CODE

Dưới đây là mô hình chuẩn để bạn hiểu bản chất luồng:

---

## **A. LEVEL 1: ORDER**

Một đơn hàng có thể chứa:

```
Order
 ├─ Customer info
 ├─ List sản phẩm
 ├─ Deadline tổng
 └─ Trạng thái tổng (Pending, In Progress, Done)
```

---

## **B. LEVEL 2: SẢN PHẨM**

Mỗi sản phẩm:

```
Product
 ├─ Loại sản phẩm: túi, vali, giày, phụ kiện kim loại...
 ├─ Quy trình cần chạy: do loại sản phẩm quyết định
 ├─ List công đoạn
 └─ Tiến độ (%)
```

*Quan trọng:*
Loại sản phẩm quyết định nó phải chạy qua phòng ban nào.

---

## **C. LEVEL 3: CÔNG ĐOẠN (STEP/STAGE)**

Mỗi công đoạn tương đương 1 **bước trong quy trình**, thuộc **1 phòng ban**:

Ví dụ sản phẩm kim loại:

```
[Đúc chốt] → [Xi mạ] → [Mạ Niken] → [Mạ vàng 18k] → [Hoàn thiện]
```

Giày dép:

```
[Thay đế] → [Dán sole] → [Vệ sinh] → [Repaint đế]
```

Đồ da:

```
[Vệ sinh] → [Khâu] → [Phục hồi màu] → [Thay khóa]
```

---

## **D. LEVEL 4: TASK (NHIỆM VỤ CHI TIẾT)**

Một công đoạn có thể có **nhiều kỹ thuật viên tham gia**.

Ví dụ công đoạn “Xi mạ”:

```
Task: Xi mạ
 ├─ Danh sách nhân sự: A, B
 ├─ Thời gian bắt đầu
 ├─ Thời gian kết thúc
 ├─ Hình ảnh kèm theo
 ├─ File đính kèm
 └─ Ghi chú kết quả
```

---

## **E. LUỒNG TỰ ĐỘNG CHUYỂN GIAI ĐOẠN**

**Khi tất cả task trong step X = Done → tự động chuyển step kế tiếp.**

Cơ chế:

```
IF step.current.status == done
   → step.next.status = doing
   → assign task to technicians in that department
   → push notification
```

---

## **F. ĐA PHÒNG BAN (CROSS DEPARTMENT WORKFLOW)**

Một sản phẩm có thể chạy qua nhiều phòng ban:

Ví dụ túi xách bị hỏng:

```
Phòng Đồ Da: Vệ sinh
Phòng Đồ Da: Khâu form
Phòng Xi Mạ: Mạ khóa
Phòng Dán Giày: Dán đế giày (nếu túi có phần đế cao su…)
```

Hệ thống phải:

1. Tự hiểu sản phẩm đó cần những phòng nào.
2. Mỗi phòng vận hành quy trình riêng nhưng “nối tiếp” nhau.
3. Báo cáo xuyên suốt không bị đứt gãy.

---

# 3. CÁCH MAPPING VÀO HỆ THỐNG CỦA BẠN (QUAN TRỌNG NHẤT)

Bên họ đang yêu cầu 1 mô hình **đa cấp** rõ ràng:

---

## **✔ Mức 1: Workflow Template (theo phòng ban)**

Bạn sẽ tạo *mô hình quy trình chuẩn* cho từng phòng ban.

Ví dụ:

**Xi mạ template**

```
1. Đúc chốt
2. Xi mạ cơ bản
3. Mạ niken
4. Mạ vàng
5. Seal túi
```

**Đồ da template**

```
1. Vệ sinh
2. Khâu form
3. Phục hồi màu
4. Thay khóa
```

**Giày dép template**

```
1. Thay đế
2. Dán sole
3. Vệ sinh
4. Repaint đế
```

---

## **✔ Mức 2: Khi tạo sản phẩm → gán template phù hợp**

Tùy loại hàng:

* Túi da → template phòng đồ da
* Giày → template phòng giày
* Phụ kiện kim loại → template xi mạ

Cũng có sản phẩm đi qua *nhiều* template, ví dụ:

* Túi Louis Vuitton bị gãy khóa
  → vừa thuộc Đồ Da
  → vừa thuộc Xi Mạ

---

## **✔ Mức 3: Mỗi bước trong template → tạo Task**

Tạo record:

```
task_id
product_id
department
step_index
assigned_users[]
status
timestamps
attachments[]
```

---

## **✔ Mức 4: Tự động hóa chuyển bước**

Dựa theo logic:

```
onTaskComplete(product_id):
   if all tasks in currentStep done:
       move to nextStep
       auto assign to next department
       notify
```

---

## **✔ Mức 5: Dashboard quản lý**

Các con số họ muốn:

* Số quy trình đang chạy
* Số bước trễ hạn
* Thời gian trung bình từng bước
* Nhân viên nào làm nhiều task nhất
* Sản phẩm đang mắc ở phòng nào
* Tình trạng từng order

---

# 4. VẬY QUY TRÌNH BÊN HỌ ĐANG MUỐN LÀ GÌ?

Tóm lại một câu cho dễ hiểu:

### **Họ muốn số hóa toàn bộ workflow qua 3 phòng ban, mỗi phòng có quy trình riêng, sản phẩm sẽ chạy qua nhiều phòng theo thứ tự, hệ thống sẽ tự động giao việc, tự chuyển bước, và quản lý được hiệu suất.**

Tức là:

```
Order → Sản phẩm → Chọn quy trình → Chạy qua từng bước → Nhiều nhân sự xử lý → Tự động chuyển sang bước tiếp → Hoàn thành
```



Tuan Anh, được rồi, tôi biết kiểu gật đầu “vậy tốt quá” của bạn nghĩa là “làm đi cho tôi, tôi đang mệt”. Được, làm thì làm, dù nhìn đống workflow này không khác gì lắp ráp Gundam size XXL bằng tay không.

Tôi chia thành **4 phần đúng thứ bạn yêu cầu**, mỗi phần thiết kế sao cho bạn có thể *dập thẳng vào code* mà không suy diễn thêm.

---

# 1) BPMN DIAGRAM (BẢN CHUẨN ĐỂ ÁP DỤNG CHO MỌI PHÒNG BAN)

Đây là BPMN tổng quát, không phải theo từng phòng.
Bạn có thể copy vào bất kỳ tool BPMN nào như bpmn.io.

```
Start
  ↓
[Create Order]
  ↓
[For each Product in Order]
  ↓
[Determine Product Workflow Templates]
  ↓
[Generate Steps from Templates]
  ↓
[Assign Step #1 to Department]
  ↓
--- LOOP ---
[Department Executes Tasks]
  ↓
[All Tasks in Step Completed?]
      ↙                ↘
     No               Yes
     ↑                 ↓
[Wait/Update]    [Move to Next Step]
                      ↓
              [Final Step Completed?]
                      ↙         ↘
                     No         Yes
                     ↑          ↓
                   Loop     [Mark Product Done]
                                  ↓
                         [All Products Done?]
                               ↙      ↘
                              No      Yes
                              ↑        ↓
                            Loop   [Close Order]
                                        ↓
                                      End
```

Ý nghĩa: Một sản phẩm là một state machine riêng, chạy qua từng step theo workflow template.

---

# 2) DATABASE SCHEMA (WORKFLOW 4 CẤP)

Tôi đề xuất mô hình **chuẩn hóa**, dễ mở rộng, phù hợp cả Firebase lẫn PostgreSQL/MySQL.

## **A. departments**

```
id (PK)
name
description
```

## **B. workflow_templates**

Mỗi phòng ban một template, hoặc một loại sản phẩm một template.

```
id (PK)
name
product_type  // bag, shoe, metal,...
department_id
```

## **C. workflow_steps**

Mỗi template có nhiều step.

```
id (PK)
template_id (FK)
step_order (int)
name
description
expected_duration_hours
```

## **D. orders**

```
id
customer_info
total_deadline
status  // pending, processing, done, canceled
```

## **E. products**

```
id
order_id (FK)
product_type
current_step_index
status // pending, processing, done
```

## **F. product_steps**

Khi tạo order → tạo luôn toàn bộ steps dựa theo template.

```
id
product_id (FK)
department_id
step_order
name
status       // pending, processing, done
start_time
end_time
```

## **G. tasks**

Một step có thể có nhiều kỹ thuật viên cùng làm.

```
id
product_step_id (FK)
assignee_user_id
status        // pending, doing, done
start_time
end_time
notes
attachments[]
```

## **H. users**

```
id
name
department_id
role
```

Quan hệ:

```
order → products → product_steps → tasks → users
workflow_templates → workflow_steps → product_steps
```

---


# 4) STATE MACHINE CHUẨN (GIỐNG JIRA / TRELLO)

State machine áp dụng **cho từng step** và cũng **cho cả product**.

## **STEP STATE MACHINE**

```
pending → processing → done
```

### Guard rules:

* Chỉ được chuyển từ `pending` sang `processing`
* Chỉ được chuyển sang `done` khi **tất cả tasks = done**

### Pseudocode:

```
if (step.status === "pending" && start_event)
    → processing

if (step.status === "processing" && all_tasks_done)
    → done
```

---

## **PRODUCT STATE MACHINE**

```
pending → processing → done
```

### Logic:

```
pending → khi step đầu tiên bắt đầu
processing → khi đang trong các step
done → khi step cuối done
```

---

## **TASK STATE MACHINE**

```
pending → doing → done
```


1. ERD (Mermaid)
erDiagram
    Order {
        string id
        string customerId
        string status
        number total
        number createdAt
        number updatedAt
    }

    OrderTransition {
        string id
        string orderId
        string from
        string to
        string note
        string createdBy
        number createdAt
    }

    Order ||--o{ OrderTransition : has

2. TypeScript interfaces
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  total: number;
  createdAt: number;
  updatedAt: number;
}

export interface OrderTransition {
  id: string;
  orderId: string;
  from: OrderStatus;
  to: OrderStatus;
  note?: string;
  createdBy: string;
  createdAt: number;
}

3. Firebase version (Realtime Database)

Structure đề xuất

orders/{orderId}
orderTransitions/{orderId}/{transitionId}


Ghi order + transition

import { ref, update, push } from "firebase/database";
import { db } from "@/libs/firebase";

export async function applyTransition(orderId: string, next: OrderStatus, userId: string, note = "") {
  const orderRef = ref(db, `orders/${orderId}`);
  const transitionRef = ref(db, `orderTransitions/${orderId}`);

  const transitionId = push(transitionRef).key!;
  const timestamp = Date.now();

  const updates = {
    [`orders/${orderId}/status`]: next,
    [`orders/${orderId}/updatedAt`]: timestamp,
    [`orderTransitions/${orderId}/${transitionId}`]: {
      id: transitionId,
      orderId,
      from: "pending",
      to: next,
      createdBy: userId,
      note,
      createdAt: timestamp
    },
  };

  await update(ref(db), updates);
}
