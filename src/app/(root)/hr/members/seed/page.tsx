"use client";

import { MemberService } from "@/services/memberService";
import { ROLES } from "@/types/enum";
import { IMembers } from "@/types/members";
import { SalaryType } from "@/types/salary";
import { genCode } from "@/utils/genCode";
import { App, Button, Card, Space, Typography } from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

// Sample members data
const sampleMembers: Array<
    Omit<IMembers, "id" | "createdAt" | "updatedAt"> & { password: string }
> = [
    // Admin members
    {
        code: "MEM_ADMIN_001",
        name: "Nguyễn Văn Admin",
        phone: "0901234567",
        email: "admin1@xoxo.com",
        role: ROLES.admin,
        date_of_birth: "1985-05-15",
        gender: "male",
        isActive: true,
        idCard: "123456789012",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 1",
        timesheetCode: "TS001",
        position: "Giám đốc",
        startDate: "2020-01-01",
        salaryType: SalaryType.FIXED,
        salaryAmount: 20000000,
        password: "Admin123!",
    },
    {
        code: "MEM_ADMIN_002",
        name: "Trần Thị Quản Lý",
        phone: "0901234568",
        email: "admin2@xoxo.com",
        role: ROLES.admin,
        date_of_birth: "1990-08-20",
        gender: "female",
        isActive: true,
        idCard: "123456789013",
        address: "456 Đường XYZ, Quận 3, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 5",
        timesheetCode: "TS002",
        position: "Phó Giám đốc",
        startDate: "2021-03-01",
        salaryType: SalaryType.FIXED,
        salaryAmount: 15000000,
        password: "Admin123!",
    },
    // Sales members
    {
        code: "MEM_SALES_001",
        name: "Lê Văn Bán Hàng",
        phone: "0901234569",
        email: "sales1@xoxo.com",
        role: ROLES.sales,
        date_of_birth: "1992-12-10",
        gender: "male",
        isActive: true,
        idCard: "123456789014",
        address: "789 Đường DEF, Quận 7, TP.HCM",
        province: "TP.HCM",
        ward: "Phường Tân Phú",
        timesheetCode: "TS003",
        position: "Nhân viên bán hàng",
        startDate: "2022-01-15",
        salaryType: SalaryType.FIXED,
        salaryAmount: 8000000,
        bonusPercentage: 5,
        password: "Sales123!",
    },
    {
        code: "MEM_SALES_002",
        name: "Phạm Thị Tư Vấn",
        phone: "0901234570",
        email: "sales2@xoxo.com",
        role: ROLES.sales,
        date_of_birth: "1995-03-25",
        gender: "female",
        isActive: true,
        idCard: "123456789015",
        address: "321 Đường GHI, Quận 10, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 12",
        timesheetCode: "TS004",
        position: "Nhân viên tư vấn",
        startDate: "2022-06-01",
        salaryType: SalaryType.FIXED,
        salaryAmount: 7000000,
        bonusPercentage: 3,
        password: "Sales123!",
    },
    {
        code: "MEM_SALES_003",
        name: "Hoàng Văn Chăm Sóc",
        phone: "0901234571",
        email: "sales3@xoxo.com",
        role: ROLES.sales,
        date_of_birth: "1993-07-18",
        gender: "male",
        isActive: true,
        idCard: "123456789016",
        address: "654 Đường JKL, Quận Bình Thạnh, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 25",
        timesheetCode: "TS005",
        position: "Nhân viên CSKH",
        startDate: "2023-01-10",
        salaryType: SalaryType.FIXED,
        salaryAmount: 9000000,
        password: "Sales123!",
    },
    // Development members
    {
        code: "MEM_DEV_001",
        name: "Vũ Văn Developer",
        phone: "0901234572",
        email: "dev1@xoxo.com",
        role: ROLES.development,
        date_of_birth: "1991-11-05",
        gender: "male",
        isActive: true,
        idCard: "123456789017",
        address: "987 Đường MNO, Quận 2, TP.HCM",
        province: "TP.HCM",
        ward: "Phường An Phú",
        timesheetCode: "TS006",
        position: "Lập trình viên",
        startDate: "2021-09-01",
        salaryType: SalaryType.FIXED,
        salaryAmount: 12000000,
        password: "Dev123!",
    },
    {
        code: "MEM_DEV_002",
        name: "Đỗ Thị Designer",
        phone: "0901234573",
        email: "dev2@xoxo.com",
        role: ROLES.development,
        date_of_birth: "1994-04-30",
        gender: "female",
        isActive: true,
        idCard: "123456789018",
        address: "147 Đường PQR, Quận Tân Bình, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 4",
        timesheetCode: "TS007",
        position: "Thiết kế đồ họa",
        startDate: "2022-05-15",
        salaryType: SalaryType.FIXED,
        salaryAmount: 10000000,
        password: "Dev123!",
    },
    // Worker members
    {
        code: "MEM_WORKER_001",
        name: "Nguyễn Văn Công Nhân",
        phone: "0901234574",
        email: "worker1@xoxo.com",
        role: ROLES.worker,
        date_of_birth: "1988-09-12",
        gender: "male",
        isActive: true,
        idCard: "123456789019",
        address: "258 Đường STU, Quận 8, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 16",
        timesheetCode: "TS008",
        position: "Công nhân may",
        startDate: "2020-06-01",
        departments: ["DEPT_001", "DEPT_002"],
        salaryType: SalaryType.FIXED,
        salaryAmount: 6000000,
        password: "Worker123!",
    },
    {
        code: "MEM_WORKER_002",
        name: "Trần Thị Thợ Là",
        phone: "0901234575",
        email: "worker2@xoxo.com",
        role: ROLES.worker,
        date_of_birth: "1990-02-22",
        gender: "female",
        isActive: true,
        idCard: "123456789020",
        address: "369 Đường VWX, Quận 11, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 15",
        timesheetCode: "TS009",
        position: "Công nhân là ủi",
        startDate: "2021-02-01",
        departments: ["DEPT_003"],
        salaryType: SalaryType.FIXED,
        salaryAmount: 5500000,
        password: "Worker123!",
    },
    {
        code: "MEM_WORKER_003",
        name: "Lê Văn Kiểm Tra",
        phone: "0901234576",
        email: "worker3@xoxo.com",
        role: ROLES.worker,
        date_of_birth: "1989-06-08",
        gender: "male",
        isActive: true,
        idCard: "123456789021",
        address: "741 Đường YZA, Quận 6, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 11",
        timesheetCode: "TS010",
        position: "Nhân viên QC",
        startDate: "2021-08-15",
        departments: ["DEPT_004"],
        salaryType: SalaryType.FIXED,
        salaryAmount: 6500000,
        password: "Worker123!",
    },
    {
        code: "MEM_WORKER_004",
        name: "Phạm Thị Đóng Gói",
        phone: "0901234577",
        email: "worker4@xoxo.com",
        role: ROLES.worker,
        date_of_birth: "1992-10-14",
        gender: "female",
        isActive: true,
        idCard: "123456789022",
        address: "852 Đường BCD, Quận 5, TP.HCM",
        province: "TP.HCM",
        ward: "Phường 8",
        timesheetCode: "TS011",
        position: "Công nhân đóng gói",
        startDate: "2022-03-01",
        departments: ["DEPT_005"],
        salaryType: SalaryType.FIXED,
        salaryAmount: 5800000,
        password: "Worker123!",
    },
    {
        code: "MEM_WORKER_005",
        name: "Hoàng Văn Cắt",
        phone: "0901234578",
        email: "worker5@xoxo.com",
        role: ROLES.worker,
        date_of_birth: "1987-01-28",
        gender: "male",
        isActive: true,
        idCard: "123456789023",
        address: "963 Đường EFG, Quận 12, TP.HCM",
        province: "TP.HCM",
        ward: "Phường Tân Chánh Hiệp",
        timesheetCode: "TS012",
        position: "Công nhân cắt",
        startDate: "2020-09-01",
        departments: ["DEPT_001"],
        salaryType: SalaryType.FIXED,
        salaryAmount: 6200000,
        password: "Worker123!",
    },
];

export default function SeedMembersPage() {
    const { message } = App.useApp();
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const memberData of sampleMembers) {
                try {
                    // Generate code if not provided
                    const code = memberData.code || genCode("MEM_");

                    await MemberService.create({
                        ...memberData,
                        code,
                    });

                    successCount++;
                    console.log(`Created member: ${memberData.name}`);
                } catch (error: any) {
                    console.error(
                        `Error creating member ${memberData.name}:`,
                        error,
                    );
                    errorCount++;

                    // If email already exists, skip
                    if (
                        error.message?.includes("already-in-use") ||
                        error.message?.includes("email")
                    ) {
                        console.log(
                            `Skipping ${memberData.name} - email already exists`,
                        );
                    }
                }
            }

            if (successCount > 0) {
                message.success(
                    `Đã tạo thành công ${successCount} nhân viên mẫu!${
                        errorCount > 0
                            ? ` (${errorCount} lỗi do email đã tồn tại)`
                            : ""
                    }`,
                );
            } else {
                message.warning(
                    "Không thể tạo nhân viên mới. Có thể các email đã tồn tại trong hệ thống.",
                );
            }
        } catch (error) {
            console.error("Error seeding members:", error);
            message.error("Có lỗi xảy ra khi tạo dữ liệu mẫu!");
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="p-6">
            <Card>
                <Title level={3}>Tạo Dữ Liệu Mẫu - Nhân Sự</Title>
                <div className="mt-4 space-y-4">
                    <Text>
                        Script này sẽ tạo {sampleMembers.length} nhân viên mẫu với đầy đủ
                        thông tin vào Firebase. Mỗi nhân viên sẽ có tài khoản đăng nhập với
                        mật khẩu mặc định.
                    </Text>
                    <div className="mt-4">
                        <Title level={5}>
                            Danh sách nhân viên sẽ được tạo:
                        </Title>
                        <ul className="list-disc list-inside space-y-2 mt-2">
                            {sampleMembers.map((member, index) => (
                                <li key={index}>
                                    <Text strong>{member.name}</Text> -{" "}
                                    <Text type="secondary">{member.code}</Text> -{" "}
                                    <Text>{member.role}</Text> -{" "}
                                    <Text>{member.email}</Text> - Mật khẩu:{" "}
                                    <Text code>{member.password}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 rounded">
                        <Text strong type="warning">
                            Lưu ý:
                        </Text>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                            <li>
                                Các email trong dữ liệu mẫu sẽ được tạo tài khoản Firebase
                                Auth
                            </li>
                            <li>
                                Nếu email đã tồn tại, nhân viên đó sẽ bị bỏ qua
                            </li>
                            <li>
                                Mật khẩu mặc định được hiển thị ở trên (thay thế bằng ký tự
                                *)
                            </li>
                            <li>
                                Worker sẽ được gán vào phòng ban tương ứng nếu phòng ban tồn
                                tại
                            </li>
                        </ul>
                    </div>
                    <div className="mt-6">
                        <Button
                            type="primary"
                            size="large"
                            loading={seeding}
                            onClick={handleSeed}
                        >
                            {seeding ? "Đang tạo..." : "Tạo Dữ Liệu Mẫu"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

