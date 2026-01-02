import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { env } from "@/env";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
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
        initializeApp({
            credential: cert(serviceAccount as any),
            databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

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

// Mapping English keys to Vietnamese no accent
const keyMapping: Record<string, string> = {
    // Main collections
    "appointments": "lichhen",
    "brands": "thuonghieu",
    "customerGroups": "nhomkhach",
    "customers": "khachhang",
    "departments": "phongban",
    "feedback": "phanhoi",
    "finance": "taichinh",
    "followUps": "theodoi",
    "inventory": "kho",
    "material_orders": "donnguyenlieu",
    "members": "nhanvien",
    "messenger": "tinnhan",
    "operational_workflows": "quytrinhvanhanh",
    "process_templates": "mauquytrinh",
    "products": "sanpham",
    "orders": "donhang",
    "workflows": "quytrinh",
    "staff": "nhanvien",
    "categories": "danhmuc",
    "service_items": "dichvu",
    "warranty_claims": "baohanh",
    "operational_workflow_items": "congviec",
    "purchase_requests": "yeucau",
    
    // Nested keys in orders
    "products": "sanpham",
    "workflows": "quytrinh",
    "checklist": "danhsachcongviec",
    
    // Common field names
    "customerName": "tenkhachhang",
    "productName": "tensanpham",
    "workflowName": "tenquytrinh",
    "orderCode": "madonhang",
    "orderDate": "ngaydat",
    "deliveryDate": "ngaygiao",
    "createdAt": "ngaytao",
    "updatedAt": "ngaycapnhat",
    "createdBy": "nguoitao",
    "createdByName": "tennguoitao",
    "consultantId": "idtuvan",
    "consultantName": "tentuvan",
    "customerSource": "nguongoc",
    "totalAmount": "tongtien",
    "discountAmount": "giamgia",
    "subtotal": "tongphu",
    "deposit": "datcoc",
    "depositType": "loaidatcoc",
    "depositAmount": "tiendatcoc",
    "isDepositPaid": "dadatcoc",
    "customerCode": "makhachhang",
    "phone": "sodienthoai",
    "email": "email",
    "address": "diachi",
    "notes": "ghichu",
    "discount": "giamgia",
    "discountType": "loaigiamgia",
    "shippingFee": "phivanchuyen",
    "status": "trangthai",
    "quantity": "soluong",
    "price": "gia",
    "images": "hinhanh",
    "imagesDone": "hinhanhxong",
    "name": "ten",
    "code": "ma",
    "description": "mota",
    "color": "mau",
    "parentCode": "macha",
    "departmentCode": "maphongban",
    "departmentName": "tenphongban",
    "workflowCode": "maquytrinh",
    "isDone": "hoanthanh",
    "note": "ghichu",
    "isApproved": "duyet",
    "approvedById": "idnguoiduyet",
    "approvedByName": "tennguoiduyet",
    "approvedAt": "ngayduyet",
    "deadline": "han",
    "task_name": "tencongviec",
    "task_order": "thutucongviec",
    "checked": "dakiemtra",
    "checked_by": "nguoikiemtra",
    "checkedByName": "tennguoikiemtra",
    "checked_at": "ngaykiemtra",
    "assignedTo": "nguoiphutrach",
    "assignedToName": "tennguoiphutrach",
    "estimatedDuration": "thoigianuoc",
    "durationUnit": "donvithoigian",
    "currentJobIndex": "chisocongviec",
    "kanbanStatus": "trangthaikanban",
};

// Function to translate English to Vietnamese (no accent, no spaces)
function translateEnglishToVietnamese(key: string): string {
    // First check mapping
    if (keyMapping[key]) {
        return keyMapping[key];
    }
    
    // Common English to Vietnamese translations
    const translations: Record<string, string> = {
        "appointment": "lichhen",
        "brand": "thuonghieu",
        "customer": "khachhang",
        "group": "nhom",
        "department": "phongban",
        "feedback": "phanhoi",
        "finance": "taichinh",
        "follow": "theodoi",
        "up": "len",
        "inventory": "kho",
        "material": "nguyenlieu",
        "order": "donhang",
        "member": "nhanvien",
        "messenger": "tinnhan",
        "operational": "vanhanh",
        "workflow": "quytrinh",
        "process": "quytrinh",
        "template": "mau",
        "product": "sanpham",
        "workflow": "quytrinh",
        "staff": "nhanvien",
        "category": "danhmuc",
        "service": "dichvu",
        "item": "muc",
        "warranty": "baohanh",
        "claim": "yeucau",
        "purchase": "muahang",
        "request": "yeucau",
        "checklist": "danhsachcongviec",
        "task": "congviec",
        "name": "ten",
        "code": "ma",
        "date": "ngay",
        "delivery": "giao",
        "create": "tao",
        "update": "capnhat",
        "total": "tong",
        "amount": "tien",
        "discount": "giamgia",
        "subtotal": "tongphu",
        "deposit": "datcoc",
        "paid": "dathanhtoan",
        "phone": "sodienthoai",
        "email": "email",
        "address": "diachi",
        "note": "ghichu",
        "shipping": "vanchuyen",
        "fee": "phi",
        "status": "trangthai",
        "quantity": "soluong",
        "price": "gia",
        "image": "hinhanh",
        "done": "xong",
        "description": "mota",
        "color": "mau",
        "parent": "cha",
        "approved": "duyet",
        "approve": "duyet",
        "by": "boi",
        "at": "tai",
        "check": "kiemtra",
        "checked": "dakiemtra",
        "assign": "phutrach",
        "assigned": "duocphutrach",
        "to": "den",
        "estimate": "uoc",
        "duration": "thoigian",
        "unit": "donvi",
        "current": "hientai",
        "job": "congviec",
        "index": "chiso",
        "kanban": "kanban",
    };
    
    // Split by underscore or camelCase
    const parts = key.split(/[_\s]|(?=[A-Z])/).filter(p => p);
    
    // Translate each part
    const translatedParts = parts.map(part => {
        const lowerPart = part.toLowerCase();
        return translations[lowerPart] || removeAccentsAndSpaces(part);
    });
    
    return translatedParts.join("");
}

// Recursively convert object keys to no accent and no spaces
function convertKeysToNoAccent(obj: any, isRootLevel: boolean = false): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToNoAccent(item, false));
    }
    
    if (typeof obj !== 'object') {
        return obj;
    }
    
    const converted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
        let newKey: string;
        
        // At root level (xoxo/), use mapping or translate English to Vietnamese
        if (isRootLevel) {
            if (keyMapping[key]) {
                newKey = keyMapping[key];
            } else {
                // Try to translate English to Vietnamese
                newKey = translateEnglishToVietnamese(key);
            }
        } else {
            // For nested keys, check mapping first, then translate, then remove accents
            if (keyMapping[key]) {
                newKey = keyMapping[key];
            } else {
                // Try to translate English to Vietnamese
                const translated = translateEnglishToVietnamese(key);
                // If translation didn't change much, just remove accents and spaces
                if (translated === key.toLowerCase()) {
                    newKey = removeAccentsAndSpaces(key);
                } else {
                    newKey = translated;
                }
            }
        }
        
        // Recursively convert nested objects
        converted[newKey] = convertKeysToNoAccent(value, false);
    }
    
    return converted;
}

export async function POST(request: NextRequest) {
    try {
        const db = getDatabase();
        const rootRef = db.ref("xoxo");
        
        // Get all data
        const snapshot = await rootRef.once("value");
        const data = snapshot.val() || {};
        
        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json(
                { success: false, message: "Database trống, không có gì để migrate!" },
                { status: 400 }
            );
        }
        
        console.log("📊 Starting migration...");
        console.log("📦 Original data keys:", Object.keys(data));
        
        // Convert all keys to no accent (root level = true)
        const convertedData = convertKeysToNoAccent(data, true);
        
        console.log("✅ Converted data keys:", Object.keys(convertedData));
        
        // Log mapping changes
        const mappingChanges: Record<string, string> = {};
        Object.keys(data).forEach(key => {
            if (keyMapping[key]) {
                mappingChanges[key] = keyMapping[key];
            } else {
                const converted = removeAccentsAndSpaces(key);
                if (key !== converted) {
                    mappingChanges[key] = converted;
                }
            }
        });
        console.log("🔄 Key mappings:", mappingChanges);
        
        // Save converted data back
        await rootRef.set(convertedData);
        
        console.log("✅ Migration completed successfully!");
        
        return NextResponse.json({
            success: true,
            message: "Đã migrate toàn bộ database thành công!",
            originalKeys: Object.keys(data),
            convertedKeys: Object.keys(convertedData),
        });
    } catch (error: any) {
        console.error("Error migrating database:", error);
        return NextResponse.json(
            { success: false, message: `Lỗi khi migrate: ${error.message}` },
            { status: 500 }
        );
    }
}

