import { env } from '@/env';
import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: env.FIREBASE_PROJECT_ID,
    private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
    private_key: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: env.FIREBASE_CLIENT_EMAIL,
    client_id: env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Helper function to generate code
function genCode(prefix: string = ""): string {
  const length = 6;
  const charset = "abcdefghijklmnopqrstuvwxyz123456789";
  let randomPart = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * charset.length);
    randomPart += charset[idx];
  }
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const dateString = `${day}${month}${year}`;
  const datePrefix3 = dateString.slice(0, 3);
  return `${prefix}${datePrefix3}${randomPart}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const db = admin.database();
    const now = Date.now();
    const code = genCode("PROC_");
    const id = code;

    // Lấy phòng ban đầu tiên có sẵn hoặc sử dụng mặc định
    const departmentsRef = db.ref('xoxo/departments');
    const departmentsSnapshot = await departmentsRef.once('value');
    const departmentsData = departmentsSnapshot.val() || {};
    const departments = Object.entries(departmentsData).map(([code, dept]: [string, any]) => ({
      code,
      name: dept.name || code,
    }));
    
    const defaultDept = departments.length > 0 
      ? departments[0] 
      : { code: "DEPT_001", name: "Phòng Sản xuất" };

    // Tạo quy trình mẫu với 3 tầng: Quy trình xi mạ vàng 18k
    const sampleProcess = {
      code,
      name: "Quy trình xi mạ vàng 18k",
      description: "Quy trình hoàn chỉnh để xi mạ vàng 18k cho sản phẩm kim loại. Bao gồm các bước từ chuẩn bị đến hoàn thiện.",
      stages: [
        {
          id: genCode("STAGE_"),
          stageOrder: 1,
          name: "Loại bỏ lớp mạ cũ",
          description: "Giai đoạn loại bỏ hoàn toàn lớp mạ cũ trên bề mặt sản phẩm",
          departmentCode: defaultDept.code,
          departmentName: defaultDept.name,
          expectedDurationHours: 3,
          tasks: [
            {
              id: genCode("TASK_"),
              taskOrder: 1,
              name: "Ngâm sản phẩm trong nước bóc Au chuyên dụng (50–60°C)",
              description: "Ngâm sản phẩm trong dung dịch bóc vàng chuyên dụng ở nhiệt độ 50-60°C trong 15-20 phút để làm bong lớp mạ cũ",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 2,
              name: "Rửa sạch bằng nước cất",
              description: "Rửa kỹ sản phẩm bằng nước cất để loại bỏ hoàn toàn dung dịch bóc vàng",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 3,
              name: "Kiểm tra bề mặt đã sạch",
              description: "Kiểm tra bằng mắt thường và kính lúp để đảm bảo không còn vết mạ cũ",
              required: true,
            },
          ],
        },
        {
          id: genCode("STAGE_"),
          stageOrder: 2,
          name: "Đánh bóng cơ & bù kim loại",
          description: "Giai đoạn đánh bóng và bù đắp các khuyết điểm trên bề mặt kim loại",
          departmentCode: defaultDept.code,
          departmentName: defaultDept.name,
          expectedDurationHours: 4,
          tasks: [
            {
              id: genCode("TASK_"),
              taskOrder: 1,
              name: "Đánh bóng bằng giấy nhám từ #400 đến #2000",
              description: "Đánh bóng tuần tự từ giấy nhám thô đến mịn để tạo bề mặt nhẵn mịn",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 2,
              name: "Bù kim loại tại các vết lõm, xước",
              description: "Sử dụng kim loại bù chuyên dụng để lấp đầy các vết lõm và xước sâu",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 3,
              name: "Đánh bóng lại sau khi bù",
              description: "Đánh bóng lại khu vực đã bù kim loại để đảm bảo bề mặt đồng đều",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 4,
              name: "Làm sạch bằng dung môi",
              description: "Làm sạch bề mặt bằng dung môi chuyên dụng để loại bỏ dầu mỡ và bụi bẩn",
              required: true,
            },
          ],
        },
        {
          id: genCode("STAGE_"),
          stageOrder: 3,
          name: "Xi mạ vàng 18k",
          description: "Giai đoạn xi mạ vàng 18k lên bề mặt sản phẩm",
          departmentCode: defaultDept.code,
          departmentName: defaultDept.name,
          expectedDurationHours: 2,
          tasks: [
            {
              id: genCode("TASK_"),
              taskOrder: 1,
              name: "Chuẩn bị dung dịch mạ vàng 18k",
              description: "Pha chế dung dịch mạ vàng 18k theo tỷ lệ chuẩn, kiểm tra nhiệt độ và pH",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 2,
              name: "Xi mạ điện hóa",
              description: "Tiến hành xi mạ vàng 18k bằng phương pháp điện hóa với dòng điện phù hợp",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 3,
              name: "Kiểm tra độ dày lớp mạ",
              description: "Sử dụng thiết bị đo độ dày để đảm bảo lớp mạ đạt tiêu chuẩn (tối thiểu 0.5 micron)",
              required: true,
            },
          ],
        },
        {
          id: genCode("STAGE_"),
          stageOrder: 4,
          name: "Hoàn thiện và kiểm tra",
          description: "Giai đoạn kiểm tra chất lượng và hoàn thiện sản phẩm",
          departmentCode: defaultDept.code,
          departmentName: defaultDept.name,
          expectedDurationHours: 1,
          tasks: [
            {
              id: genCode("TASK_"),
              taskOrder: 1,
              name: "Rửa sạch và sấy khô",
              description: "Rửa sạch sản phẩm bằng nước cất và sấy khô bằng khí nén",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 2,
              name: "Kiểm tra màu sắc và độ bóng",
              description: "Kiểm tra màu sắc vàng 18k và độ bóng bề mặt đạt yêu cầu",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 3,
              name: "Kiểm tra độ bám dính",
              description: "Thực hiện test độ bám dính lớp mạ bằng phương pháp tape test",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 4,
              name: "Đóng gói và bảo quản",
              description: "Đóng gói sản phẩm trong túi chống ẩm và bảo quản nơi khô ráo",
              required: true,
            },
            {
              id: genCode("TASK_"),
              taskOrder: 5,
              name: "Ghi chép thông tin quy trình",
              description: "Ghi lại các thông số kỹ thuật và kết quả kiểm tra vào phiếu theo dõi",
              required: false,
            },
          ],
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Lưu vào Firebase Realtime Database
    const ref = db.ref(`xoxo/process_templates/${id}`);
    await ref.set(sampleProcess);

    return NextResponse.json({
      success: true,
      message: "Đã tạo quy trình mẫu thành công!",
      data: { id, ...sampleProcess },
    });
  } catch (error: any) {
    console.error("Error creating sample process:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Có lỗi xảy ra khi tạo quy trình mẫu",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

