# 📋 Hướng Dẫn Sử Dụng Quản Lý Quy Trình

## 🎯 Tổng Quan

Trang **Quản lý quy trình** (`/technician/workflows`) cho phép bạn tạo, xem, chỉnh sửa và quản lý các quy trình sản xuất/kinh doanh trong hệ thống.

---

## 📍 Vị Trí Nút Thêm Quy Trình

Có **3 cách** để thêm quy trình mới:

### 1. Nút Floating (Góc phải dưới cùng) ⭐
- **Vị trí**: Góc phải dưới cùng của trang
- **Biểu tượng**: Nút tròn màu xanh với icon ➕
- **Tooltip**: "Thêm quy trình"
- **Cách dùng**: Click vào nút để mở form thêm quy trình

### 2. Nút trong Card "Quản lý quy trình" (Đầu trang)
- **Vị trí**: Card màu xám ở đầu trang, góc phải
- **Nút**: "Thêm quy trình" (màu xanh primary)
- **Cách dùng**: Click vào nút để mở form

### 3. Nút trong Header (Góc phải trên)
- **Vị trí**: Header của trang, cùng hàng với thanh tìm kiếm
- **Nút**: "Thêm quy trình" (nếu hiển thị)

---

## ➕ Cách Thêm Quy Trình Mới

### Bước 1: Mở Form
Click vào **nút "Thêm quy trình"** ở bất kỳ vị trí nào ở trên.

### Bước 2: Điền Thông Tin Cơ Bản

#### **Thông tin quy trình:**
- **Mã quy trình** (code): Tự động tạo, có thể chỉnh sửa
- **Tên quy trình** (name): ⚠️ **Bắt buộc** - Nhập tên quy trình (ví dụ: "Quy trình xi mạ vàng 18k")
- **Mô tả** (description): Mô tả chi tiết về quy trình (tùy chọn)
- **Phòng ban chính**: Chọn phòng ban chịu trách nhiệm

### Bước 3: Thêm Các Giai Đoạn (Stages)

Mỗi quy trình có thể có nhiều giai đoạn. Mỗi giai đoạn thuộc về một phòng ban cụ thể.

#### **Thông tin giai đoạn:**
- **Tên giai đoạn**: ⚠️ **Bắt buộc** - Ví dụ: "Chuẩn bị", "Xi mạ", "Hoàn thiện"
- **Mô tả**: Mô tả chi tiết về giai đoạn
- **Phòng ban**: Chọn phòng ban thực hiện giai đoạn này
- **Thời gian ước tính** (giờ): Thời gian dự kiến hoàn thành

#### **Thêm giai đoạn:**
1. Click nút **"Thêm giai đoạn"**
2. Điền thông tin giai đoạn
3. Thêm các công việc (tasks) cho giai đoạn (xem Bước 4)

### Bước 4: Thêm Công Việc (Tasks) Cho Mỗi Giai Đoạn

Mỗi giai đoạn có thể có nhiều công việc cụ thể.

#### **Thông tin công việc:**
- **Tên công việc**: ⚠️ **Bắt buộc** - Ví dụ: "Làm sạch bề mặt", "Kiểm tra chất lượng"
- **Mô tả**: Mô tả chi tiết công việc
- **Bắt buộc**: Có/không - Đánh dấu công việc này là bắt buộc hay tùy chọn
- **Ảnh hướng dẫn** (imageUrl): URL ảnh minh họa (tùy chọn)
- **Video hướng dẫn** (videoUrl): URL video hướng dẫn (tùy chọn)

#### **Thêm công việc:**
1. Trong phần giai đoạn, tìm mục **"Danh sách công việc"**
2. Click nút **"Thêm công việc"**
3. Điền thông tin công việc
4. Thêm nhiều công việc nếu cần

### Bước 5: Sắp Xếp Thứ Tự

- Bạn có thể **kéo thả** các giai đoạn để sắp xếp thứ tự
- Các công việc cũng có thể sắp xếp theo thứ tự thực hiện

### Bước 6: Lưu Quy Trình

1. Kiểm tra lại toàn bộ thông tin
2. Click nút **"Lưu"** hoặc **"Tạo"** ở cuối form
3. Hệ thống sẽ lưu quy trình và hiển thị thông báo thành công

---

## 👁️ Xem Chi Tiết Quy Trình

### Cách 1: Click vào hàng trong bảng
- Click vào bất kỳ hàng nào trong bảng danh sách quy trình
- Drawer sẽ mở ở bên phải hiển thị thông tin chi tiết

### Cách 2: Click icon 👁️ (Eye)
- Click vào icon mắt ở cột "Thao tác"
- Drawer sẽ mở hiển thị:
  - Thông tin quy trình
  - Danh sách các giai đoạn
  - Các công việc trong mỗi giai đoạn
  - Ảnh/video hướng dẫn (nếu có)

---

## ✏️ Chỉnh Sửa Quy Trình

1. Click vào icon **✏️ (Edit)** ở cột "Thao tác"
2. Form sẽ mở với dữ liệu hiện tại
3. Chỉnh sửa thông tin cần thiết
4. Click **"Lưu"** để cập nhật

---

## 🗑️ Xóa Quy Trình

1. Click vào icon **🗑️ (Delete)** ở cột "Thao tác"
2. Xác nhận xóa trong popup
3. Quy trình sẽ bị xóa vĩnh viễn

⚠️ **Lưu ý**: Hãy cẩn thận khi xóa, hành động này không thể hoàn tác!

---

## 🔍 Tìm Kiếm Quy Trình

- Sử dụng **thanh tìm kiếm** ở đầu trang
- Tìm theo: mã, tên, mô tả quy trình
- Kết quả sẽ được lọc tự động khi bạn gõ

---

## 📊 Nhóm Quy Trình Theo Phòng Ban

Quy trình được tự động **nhóm theo phòng ban**:
- Mỗi phòng ban có một Card riêng
- Số lượng quy trình được hiển thị bằng Tag màu xanh
- Quy trình có thể xuất hiện ở nhiều phòng ban nếu có nhiều giai đoạn thuộc các phòng ban khác nhau

---

## 🎨 Tạo Quy Trình Mẫu

1. Click nút **"Tạo quy trình mẫu"** (màu xám, ở Card đầu trang hoặc header)
2. Hệ thống sẽ tự động tạo một quy trình mẫu với 3 giai đoạn:
   - **Giai đoạn 1**: Chuẩn bị
   - **Giai đoạn 2**: Xử lý
   - **Giai đoạn 3**: Hoàn thiện
3. Bạn có thể chỉnh sửa quy trình mẫu này theo nhu cầu

---

## 💡 Mẹo Sử Dụng

1. **Đặt tên rõ ràng**: Tên quy trình nên mô tả rõ ràng mục đích
2. **Thêm mô tả chi tiết**: Giúp người khác hiểu rõ quy trình
3. **Sử dụng ảnh/video**: Thêm ảnh hoặc video hướng dẫn cho các công việc phức tạp
4. **Thời gian ước tính**: Điền thời gian ước tính để lập kế hoạch tốt hơn
5. **Sắp xếp hợp lý**: Đảm bảo thứ tự các giai đoạn và công việc là logic

---

## ❓ Câu Hỏi Thường Gặp

### Q: Có thể thêm bao nhiêu giai đoạn cho một quy trình?
**A**: Không giới hạn, bạn có thể thêm bao nhiêu giai đoạn tùy ý.

### Q: Một giai đoạn có thể thuộc nhiều phòng ban không?
**A**: Không, mỗi giai đoạn chỉ thuộc về một phòng ban.

### Q: Có thể xóa một giai đoạn đã có công việc không?
**A**: Có, nhưng hãy cẩn thận vì tất cả công việc trong giai đoạn đó cũng sẽ bị xóa.

### Q: Làm sao để sắp xếp lại thứ tự các giai đoạn?
**A**: Sử dụng tính năng kéo thả (drag & drop) trong form.

### Q: Quy trình có thể chỉnh sửa sau khi tạo không?
**A**: Có, bạn có thể chỉnh sửa bất cứ lúc nào bằng nút Edit.

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề hoặc cần hỗ trợ, vui lòng liên hệ:
- Admin hệ thống
- Đội ngũ phát triển

---

**Chúc bạn sử dụng hệ thống hiệu quả! 🚀**




