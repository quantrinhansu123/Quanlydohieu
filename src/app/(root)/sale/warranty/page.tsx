"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WarrantyClaimForm from "@/components/WarrantyClaimForm";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { WarrantyClaimService } from "@/services/warrantyClaimService";
import { WarrantyService } from "@/services/warrantyService";
import type { WarrantyRecord } from "@/types/warranty";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Modal, Tabs, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const { Text } = Typography;

// Warranty Details Component
const WarrantyDetails: React.FC<PropRowDetails<WarrantyRecord>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const isExpired = data.endDate < Date.now();
  const isExpiringSoon =
    data.endDate > Date.now() &&
    data.endDate <= Date.now() + 30 * 24 * 60 * 60 * 1000;
  const isValid = WarrantyService.isWarrantyValid(data);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết bảo hành</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã đơn hàng:</span>
            <p className="text-gray-600">{data.orderCode}</p>
          </div>
          <div>
            <span className="font-medium">Sản phẩm:</span>
            <p className="text-gray-600">{data.productName}</p>
          </div>
          <div>
            <span className="font-medium">Khách hàng:</span>
            <p className="text-gray-600">{data.customerName}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.customerPhone}</p>
          </div>
          <div>
            <span className="font-medium">Thời hạn bảo hành:</span>
            <p className="text-gray-600">{data.warrantyPeriod} tháng</p>
          </div>
          <div>
            <span className="font-medium">Ngày bắt đầu:</span>
            <p className="text-gray-600">
              {dayjs(data.startDate).format("DD/MM/YYYY")}
            </p>
          </div>
          <div>
            <span className="font-medium">Ngày kết thúc:</span>
            <p className="text-gray-600">
              {dayjs(data.endDate).format("DD/MM/YYYY")}
            </p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="mt-1">
              {isExpired ? (
                <Tag color="red">Đã hết hạn</Tag>
              ) : isExpiringSoon ? (
                <Tag color="orange">Sắp hết hạn</Tag>
              ) : isValid ? (
                <Tag color="green">Còn hiệu lực</Tag>
              ) : (
                <Tag color="default">Chưa bắt đầu</Tag>
              )}
            </p>
          </div>
          <div>
            <span className="font-medium">Điều khoản:</span>
            <p className="text-gray-600">{data.terms}</p>
          </div>
          {data.notes && (
            <div>
              <span className="font-medium">Ghi chú:</span>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Warranty Claim Details Component
const WarrantyClaimDetails: React.FC<PropRowDetails<WarrantyClaim>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getStatusInfo = (status: WarrantyClaimStatus) => {
    const statusMap: Record<
      WarrantyClaimStatus,
      { color: string; text: string }
    > = {
      [WarrantyClaimStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
      [WarrantyClaimStatus.CONFIRMED]: {
        color: "warning",
        text: "Đã xác nhận",
      },
      [WarrantyClaimStatus.IN_PROGRESS]: {
        color: "processing",
        text: "Đang thực hiện",
      },
      [WarrantyClaimStatus.ON_HOLD]: { color: "orange", text: "Tạm giữ" },
      [WarrantyClaimStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
      [WarrantyClaimStatus.CANCELLED]: { color: "error", text: "Đã hủy" },
    };
    return statusMap[status] || statusMap[WarrantyClaimStatus.PENDING];
  };

  const statusInfo = getStatusInfo(data.status);
  const products = data.products ? Object.entries(data.products) : [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Chi tiết phiếu nhập bảo hành
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã phiếu:</span>
            <p className="text-gray-600">{data.code}</p>
          </div>
          <div>
            <span className="font-medium">Đơn hàng gốc:</span>
            <p className="text-gray-600">{data.originalOrderCode}</p>
          </div>
          <div>
            <span className="font-medium">Khách hàng:</span>
            <p className="text-gray-600">{data.customerName}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.phone}</p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="mt-1">
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            </p>
          </div>

          <div>
            <span className="font-medium">Số sản phẩm:</span>
            <p className="text-gray-600">{products.length}</p>
          </div>
          {data.notes && (
            <div>
              <span className="font-medium">Ghi chú:</span>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("warranties");
  const [formVisible, setFormVisible] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const formRef = useRef<{ onResetForm: () => void }>(null);
  const filteredWarranties = applyFilter(warranties);
  const filteredClaims = applyFilter(warrantyClaims);

  useEffect(() => {
    const unsubscribe = WarrantyService.onSnapshot((data) => {
      setWarranties(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = WarrantyClaimService.onSnapshot((data) => {
      setWarrantyClaims(data);
      setClaimsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getWarrantyStatus = (warranty: WarrantyRecord) => {
    const isExpired = warranty.endDate < Date.now();
    const isExpiringSoon =
      warranty.endDate > Date.now() &&
      warranty.endDate <= Date.now() + 30 * 24 * 60 * 60 * 1000;
    const isValid = WarrantyService.isWarrantyValid(warranty);

    if (isExpired) {
      return { color: "red", text: "Đã hết hạn" };
    } else if (isExpiringSoon) {
      return { color: "orange", text: "Sắp hết hạn" };
    } else if (isValid) {
      return { color: "green", text: "Còn hiệu lực" };
    } else {
      return { color: "default", text: "Chưa bắt đầu" };
    }
  };

  const columns: TableColumnsType<WarrantyRecord> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 140,
      sorter: true,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 120,
      key: "productName",
      sorter: true,
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      width: 120,
      key: "customerName",
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "customerPhone",
      width: 120,
      key: "customerPhone",
    },
    {
      title: "Thời hạn",
      dataIndex: "warrantyPeriod",
      key: "warrantyPeriod",
      width: 120,
      render: (period: number) => `${period} tháng`,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 120,
      key: "createdAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY"),
      sorter: true,
    },

    {
      title: "Trạng thái",
      width: 120,
      key: "status",
      render: (_, record) => {
        const status = getWarrantyStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              router.push(`/sale/orders/${record.orderCode}`);
            }}
          ></Button>
        </div>
      ),
    },
  ];

  const getClaimStatusInfo = (status: WarrantyClaimStatus) => {
    const statusMap: Record<
      WarrantyClaimStatus,
      { color: string; text: string }
    > = {
      [WarrantyClaimStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
      [WarrantyClaimStatus.CONFIRMED]: {
        color: "warning",
        text: "Đã xác nhận",
      },
      [WarrantyClaimStatus.IN_PROGRESS]: {
        color: "processing",
        text: "Đang thực hiện",
      },
      [WarrantyClaimStatus.ON_HOLD]: { color: "orange", text: "Tạm giữ" },
      [WarrantyClaimStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
      [WarrantyClaimStatus.CANCELLED]: { color: "error", text: "Đã hủy" },
    };
    return statusMap[status] || statusMap[WarrantyClaimStatus.PENDING];
  };

  const claimColumns: TableColumnsType<WarrantyClaim> = [
    {
      title: "Mã phiếu",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (code: string) => (
        <Button
          type="link"
          onClick={() => router.push(`/sale/warranty/${code}`)}
        >
          {code}
        </Button>
      ),
    },
    {
      title: "Đơn hàng gốc",
      dataIndex: "originalOrderCode",
      width: 140,
      key: "originalOrderCode",
      render: (code: string) => (
        <Button type="link" onClick={() => router.push(`/sale/orders/${code}`)}>
          {code}
        </Button>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 120,
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 120,
      key: "phone",
    },
    {
      title: "Số lượng",
      key: "products",
      width: 120,
      render: (_, record) => {
        if (!record.products) return 0;
        return Object.values(record.products).reduce(
          (total, product) => total + (product.quantity || 0),
          0
        );
      },
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      key: "status",
      render: (status: WarrantyClaimStatus) => {
        const statusInfo = getClaimStatusInfo(status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 120,
      key: "createdAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/sale/warranty/${record.code}`)}
        >
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: "warranties",
      label: "Bảo hành",
      children: (
        <CommonTable
          dataSource={filteredWarranties.sort(
            (a, b) => b.createdAt - a.createdAt
          )}
          columns={columns}
          loading={loading}
          DrawerDetails={WarrantyDetails}
          paging={true}
          rank={true}
        />
      ),
    },
    {
      key: "claims",
      label: "Phiếu nhập bảo hành",
      children: (
        <CommonTable
          dataSource={filteredClaims.sort((a, b) => b.createdAt - a.createdAt)}
          columns={claimColumns}
          loading={claimsLoading}
          DrawerDetails={WarrantyClaimDetails}
          paging={true}
          rank={true}
        />
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder:
            activeTab === "warranties"
              ? "Tìm kiếm bảo hành..."
              : "Tìm kiếm phiếu nhập bảo hành...",
          filterKeys:
            activeTab === "warranties"
              ? ["orderCode", "productName", "customerName", "customerPhone"]
              : ["code", "originalOrderCode", "customerName", "phone"],
        },
        filters: {
          fields: [],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            can: activeTab === "claims",
            type: "primary",
            name: "Tạo phiếu bảo hành",
            icon: <PlusOutlined />,
            onClick: () => setFormVisible(true),
          },
        ],
      }}
      isLoading={loading || claimsLoading}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* Warranty Claim Form Modal */}
      <Modal
        title="Tạo phiếu bảo hành"
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          formRef.current?.onResetForm();
        }}
        footer={null}
        width={1200}
        destroyOnHidden
      >
        <WarrantyClaimForm
          ref={formRef}
          mode="create"
          onSuccess={(claimCode) => {
            setFormVisible(false);
            formRef.current?.onResetForm();
          }}
          onCancel={() => {
            setFormVisible(false);
            formRef.current?.onResetForm();
          }}
        />
      </Modal>
    </WrapperContent>
  );
}
