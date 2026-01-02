"use client";

import { App, Button, Card, Typography, Space, Alert, Modal, Progress, Input } from "antd";
import { useState, useEffect } from "react";
import { useFirebaseApp } from "@/firebase/provider";
import { getDatabase, ref, get, set } from "firebase/database";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// Mapping từ tiếng Việt có dấu sang không dấu
const fieldMapping: Record<string, string> = {
    // Common fields
    "customerName": "customerName", // Giữ nguyên vì đã là English
    "productName": "productName",
    "workflowName": "workflowName",
    "orderCode": "orderCode",
    "orderDate": "orderDate",
    "deliveryDate": "deliveryDate",
    "createdAt": "createdAt",
    "updatedAt": "updatedAt",
    
    // Vietnamese fields that might exist
    "tênKháchHàng": "tenKhachHang",
    "tênSảnPhẩm": "tenSanPham",
    "tênQuyTrình": "tenQuyTrinh",
    "mãĐơnHàng": "maDonHang",
    "ngàyĐặt": "ngayDat",
    "ngàyGiao": "ngayGiao",
    "ngàyTạo": "ngayTao",
    "ngàyCậpNhật": "ngayCapNhat",
};

// Function to remove Vietnamese accents and spaces
function removeAccentsAndSpaces(str: string): string {
    const accents: Record<string, string> = {
        'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
        'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
        'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
        'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
        'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
        'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
        'Đ': 'D',
    };
    
    // Remove accents
    let result = str.split('').map(char => accents[char] || char).join('');
    
    // Remove all spaces
    result = result.replace(/\s+/g, '');
    
    return result;
}

// Recursively convert object keys to no accent and no spaces
function convertKeysToNoAccent(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToNoAccent(item));
    }
    
    if (typeof obj !== 'object') {
        return obj;
    }
    
    const converted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
        // Convert key to no accent and no spaces
        const newKey = removeAccentsAndSpaces(key);
        
        // Recursively convert nested objects
        converted[newKey] = convertKeysToNoAccent(value);
    }
    
    return converted;
}

export default function MigrateToNoAccentPage() {
    const { message: antdMessage } = App.useApp();
    const firebaseApp = useFirebaseApp();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [autoRun, setAutoRun] = useState(false);

    // Handle migration
    const handleMigrate = async () => {
        if (confirmText !== "MIGRATE") {
            antdMessage.error("Vui lòng nhập chính xác 'MIGRATE' để xác nhận!");
            return;
        }

        try {
            setLoading(true);
            setProgress(0);
            
            // Call API route for migration
            const response = await fetch("/api/admin/migrate-database", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            
            setProgress(50);
            
            const result = await response.json();
            
            setProgress(100);
            
            if (result.success) {
                antdMessage.success(result.message || "Đã migrate toàn bộ database thành công!");
                console.log("Original keys:", result.originalKeys);
                console.log("Converted keys:", result.convertedKeys);
            } else {
                antdMessage.error(result.message || "Có lỗi xảy ra khi migrate!");
            }
            
            setConfirmVisible(false);
            setConfirmText("");
        } catch (error: any) {
            console.error("Error migrating database:", error);
            antdMessage.error(`Lỗi khi migrate: ${error.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => setProgress(0), 2000);
        }
    };

    // Auto run on mount
    useEffect(() => {
        if (!autoRun) {
            setAutoRun(true);
            // Auto open confirm modal after 1 second
            setTimeout(() => {
                setConfirmVisible(true);
            }, 1000);
        }
    }, [autoRun]);

    return (
        <div className="p-6">
            <Title level={2}>Migrate Database - Đổi sang Tiếng Việt Không Dấu</Title>

            <Alert
                message="Cảnh báo"
                description="Trang này sẽ đổi tất cả các key/field trong database từ có dấu sang không dấu. Hành động này sẽ thay đổi toàn bộ cấu trúc database!"
                type="warning"
                showIcon
                className="mb-6"
            />

            <Card>
                <Space direction="vertical" className="w-full" size="large">
                    <div>
                        <Text strong>Chức năng này sẽ:</Text>
                        <ul className="list-disc pl-5 mt-2">
                            <li>Đọc toàn bộ dữ liệu từ xoxo/</li>
                            <li>Đổi tất cả key/field có dấu thành không dấu</li>
                            <li>Loại bỏ tất cả dấu cách trong key/field</li>
                            <li>Ví dụ: "tên Khách Hàng" → "tenKhachHang"</li>
                            <li>Ví dụ: "ngày tạo" → "ngaytao"</li>
                            <li>Lưu lại toàn bộ dữ liệu đã convert</li>
                        </ul>
                    </div>

                    {progress > 0 && (
                        <Progress percent={progress} status={loading ? "active" : "success"} />
                    )}

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => setConfirmVisible(true)}
                        loading={loading}
                        block
                    >
                        Bắt đầu Migrate
                    </Button>
                    
                    <Alert
                        message="Tự động chạy"
                        description="Trang này sẽ tự động chạy migrate khi load. Bạn có thể tắt tự động chạy bằng cách đóng modal."
                        type="info"
                        showIcon
                        className="mt-4"
                    />
                </Space>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                title={
                    <span style={{ color: "#fa8c16" }}>
                        <ExclamationCircleOutlined /> Xác nhận Migrate
                    </span>
                }
                open={confirmVisible}
                onCancel={() => {
                    setConfirmVisible(false);
                    setConfirmText("");
                }}
                footer={null}
                width={600}
            >
                <Space direction="vertical" className="w-full" size="large">
                    <Alert
                        message="Cảnh báo"
                        description={
                            <div>
                                <p>Bạn đang chuẩn bị migrate toàn bộ database!</p>
                                <p className="mt-2">Điều này sẽ:</p>
                                <ul className="list-disc pl-5 mt-2">
                                    <li>Đổi tất cả key/field có dấu thành không dấu</li>
                                    <li>Ghi đè toàn bộ dữ liệu hiện tại</li>
                                    <li>Có thể mất dữ liệu nếu có lỗi xảy ra</li>
                                </ul>
                                <p className="mt-2 text-orange-500">
                                    <strong>Hãy backup database trước khi thực hiện!</strong>
                                </p>
                            </div>
                        }
                        type="warning"
                        showIcon
                    />

                    <div>
                        <Text strong>Để xác nhận, vui lòng nhập: </Text>
                        <Text code strong style={{ fontSize: "16px" }}>
                            MIGRATE
                        </Text>
                        <Input
                            placeholder="Nhập 'MIGRATE' để xác nhận"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="mt-2"
                            onPressEnter={handleMigrate}
                        />
                    </div>

                    <Space className="w-full justify-end">
                        <Button
                            onClick={() => {
                                setConfirmVisible(false);
                                setConfirmText("");
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            icon={<ExclamationCircleOutlined />}
                            onClick={handleMigrate}
                            loading={loading}
                            disabled={confirmText !== "MIGRATE"}
                        >
                            Migrate
                        </Button>
                    </Space>
                </Space>
            </Modal>
        </div>
    );
}

