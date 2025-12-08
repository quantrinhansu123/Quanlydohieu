# Firebase Admin SDK Setup for Password Updates

Để có thể cập nhật mật khẩu người dùng mà không cần mật khẩu cũ, hệ thống sử
dụng Firebase Admin SDK.

## Cách thiết lập:

### 1. Tạo Service Account Key

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Download file JSON

### 2. Cập nhật file .env

Thêm các biến môi trường sau vào file `.env`:

```env
# Firebase Admin SDK - Required for password updates
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project.iam.gserviceaccount.com
```

### 3. Lấy thông tin từ Service Account JSON

Copy các giá trị từ file JSON đã download:

- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY` (thay `\n` thành ký tự xuống dòng thực)
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `client_id` → `FIREBASE_CLIENT_ID`
- `client_x509_cert_url` → `FIREBASE_CLIENT_X509_CERT_URL`

### 4. Khởi động lại server

Sau khi cập nhật file `.env`, khởi động lại development server:

```bash
npm run dev
```

## Cách sử dụng:

- **Thêm nhân viên mới**: Nhập mật khẩu (bắt buộc)
- **Cập nhật nhân viên**: Mật khẩu là tùy chọn. Để trống nếu không muốn đổi mật
  khẩu.

Hệ thống sẽ tự động cập nhật mật khẩu trong Firebase Auth khi bạn lưu thay đổi.
