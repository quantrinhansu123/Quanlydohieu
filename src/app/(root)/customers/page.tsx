"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type { FilterField } from "@/types";
import { CustomerSource, CustomerSourceOptions } from "@/types/enum";
import { genCode } from "@/utils/genCode";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Customer {
  code: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  customerSource: CustomerSource;
  // New fields
  dateOfBirth?: number;
  province?: string;
  district?: string;
  ward?: string;
  customerType?: "individual" | "enterprise";
  gender?: "male" | "female";
  customerGroup?: string;
  taxCode?: string;
  facebook?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

interface FirebaseCustomers {
  [key: string]: Customer;
}

interface CustomerGroup {
  code: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface FirebaseCustomerGroups {
  [key: string]: CustomerGroup;
}

interface Province {
  code: string;
  name: string;
  districts?: District[];
}

interface District {
  code: string;
  name: string;
  wards?: Ward[];
}

interface Ward {
  code: string;
  name: string;
}

// Customer Detail Drawer Component Props
interface CustomerDetailProps extends PropRowDetails<Customer> {
  onEdit: (customerCode: string) => void;
  onDelete: (customerCode: string, onCloseDrawer?: () => void) => void;
  provinces?: Province[];
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  provinces = [],
}) => {

  // Early return must be after all hooks but before using data
  if (!data) return null;

  const getSourceColor = (source: CustomerSource) => {
    const colors: Record<CustomerSource, string> = {
      [CustomerSource.Facebook]: "blue",
      [CustomerSource.Zalo]: "cyan",
      [CustomerSource.Instagram]: "magenta",
      [CustomerSource.Tiktok]: "purple",
      [CustomerSource.Website]: "green",
      [CustomerSource.Referral]: "gold",
      [CustomerSource.WalkIn]: "orange",
      [CustomerSource.Phone]: "volcano",
      [CustomerSource.Other]: "default",
    };
    return colors[source] || "default";
  };

  const getSourceLabel = (source: CustomerSource) => {
    const option = CustomerSourceOptions.find((opt) => opt.value === source);
    return option?.label || source;
  };

  const getCustomerTypeLabel = (type?: "individual" | "enterprise") => {
    if (!type) return "-";
    return type === "individual" ? "Cá nhân" : "Doanh nghiệp";
  };

  const getGenderLabel = (gender?: "male" | "female") => {
    if (!gender) return "-";
    return gender === "male" ? "Nam" : "Nữ";
  };

  // Helper function to get location name from code
  const getLocationName = (
    code: string | undefined,
    type: "province" | "district" | "ward"
  ): string => {
    if (!code || provinces.length === 0) return code || "";

    if (type === "province") {
      const province = provinces.find((p) => p.code === code);
      return province?.name || code;
    }

    if (type === "district") {
      for (const province of provinces) {
        const district = province.districts?.find((d) => d.code === code);
        if (district) return district.name;
      }
      return code;
    }

    if (type === "ward") {
      for (const province of provinces) {
        for (const district of province.districts || []) {
          const ward = district.wards?.find((w) => w.code === code);
          if (ward) return ward.name;
        }
      }
      return code;
    }

    return code;
  };

  const getFullAddress = () => {
    const parts = [];
    // Thứ tự: Địa chỉ (Đường), Xã/Phường, Quận/Huyện, Tỉnh/Thành phố
    if (data.address) parts.push(data.address);
    if (data.ward) {
      const wardName = getLocationName(data.ward, "ward");
      parts.push(wardName);
    }
    if (data.district) {
      const districtName = getLocationName(data.district, "district");
      parts.push(districtName);
    }
    if (data.province) {
      const provinceName = getLocationName(data.province, "province");
      parts.push(provinceName);
    }
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  const handleEdit = () => {
    onEdit(data.code);
    onClose();
  };

  const handleDelete = () => {
    onDelete(data.code, onClose);
  };

  return (
    <div className="space-y-4">
      <Descriptions bordered column={1} title="Chi tiết khách hàng">
        <Descriptions.Item label="Mã KH">{data.code}</Descriptions.Item>
        <Descriptions.Item label="Tên khách hàng">
          {data.name}
        </Descriptions.Item>
        <Descriptions.Item label="Loại khách">
          {getCustomerTypeLabel(data.customerType)}
        </Descriptions.Item>
        <Descriptions.Item label="Giới tính">
          {getGenderLabel(data.gender)}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {data.phone || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{data.email || "-"}</Descriptions.Item>
        <Descriptions.Item label="Ngày sinh">
          {data.dateOfBirth
            ? dayjs(data.dateOfBirth).format("DD/MM/YYYY")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">
          {getFullAddress()}
        </Descriptions.Item>
        <Descriptions.Item label="Nguồn khách hàng">
          <Tag color={getSourceColor(data.customerSource)}>
            {getSourceLabel(data.customerSource)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mã số thuế">
          {data.taxCode || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Facebook">
          {data.facebook || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú">
          {data.notes || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {data.createdAt
            ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">
          {data.updatedAt
            ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
      <div className="flex justify-end gap-2">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          Sửa
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        >
          Xóa
        </Button>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<FirebaseCustomers>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();
  const { query, updateQuery, applyFilter, reset } = useFilter();

  // Customer Groups state
  const [customerGroups, setCustomerGroups] = useState<FirebaseCustomerGroups>({});
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupForm] = Form.useForm();

  // Location state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>();
  const [wards, setWards] = useState<Ward[]>([]);

  // Load customers from Firebase
  useEffect(() => {
    const database = getDatabase();
    const customersRef = ref(database, "xoxo/customers");

    const unsubscribe = onValue(
      customersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setCustomers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading customers:", error);
        message.error("Không thể tải danh sách khách hàng!");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [message]);

  // Load customer groups from Firebase
  useEffect(() => {
    const database = getDatabase();
    const groupsRef = ref(database, "xoxo/customerGroups");

    const unsubscribe = onValue(
      groupsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setCustomerGroups(data);
      },
      (error) => {
        console.error("Error loading customer groups:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load provinces data
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/?depth=3");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProvinces(data);
        } else {
          console.error("Unexpected API response format:", data);
        }
      } catch (error) {
        console.error("Error loading provinces:", error);
        // Only show error message if it's a network error, not for silent failures
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.warn("Provinces API unavailable, location names will show codes instead");
        } else {
          message.error("Không thể tải danh sách tỉnh/thành phố!");
        }
      }
    };

    loadProvinces();
  }, [message]);

  // Load districts when province is selected
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find((p) => p.code === selectedProvince);
      if (province) {
        setDistricts(province.districts || []);
        setSelectedDistrict(undefined);
        setWards([]);
        form.setFieldsValue({ ward: undefined });
      }
    } else {
      setDistricts([]);
      setSelectedDistrict(undefined);
      setWards([]);
    }
  }, [selectedProvince, provinces, form]);

  // Load wards when district is selected
  useEffect(() => {
    if (selectedDistrict && districts.length > 0) {
      const district = districts.find((d) => d.code === selectedDistrict);
      if (district) {
        setWards(district.wards || []);
        form.setFieldsValue({ ward: undefined });
      }
    } else {
      setWards([]);
    }
  }, [selectedDistrict, districts, form]);

  const handleOpenModal = (customerCode?: string) => {
    if (customerCode) {
      const customer = customers[customerCode];
      setEditingCustomer(customerCode);
      // Convert dateOfBirth from timestamp to dayjs for DatePicker
      const formValues = {
        ...customer,
        dateOfBirth: customer.dateOfBirth
          ? dayjs(customer.dateOfBirth)
          : undefined,
      };
      form.setFieldsValue(formValues);
      // Set province and district for cascading dropdown
      if (customer.province) {
        setSelectedProvince(customer.province);
        // Wait for provinces to load, then set district
        setTimeout(() => {
          const province = provinces.find((p) => p.code === customer.province);
          if (province && customer.district) {
            setSelectedDistrict(customer.district);
          } else if (province && customer.ward) {
            // Find district from ward if district not saved
            const district = province.districts?.find((d) =>
              d.wards?.some((w) => w.code === customer.ward)
            );
            if (district) {
              setSelectedDistrict(district.code);
              form.setFieldsValue({ district: district.code });
            }
          }
        }, 100);
      }
    } else {
      setEditingCustomer(null);
      form.resetFields();
      form.setFieldsValue({
        code: genCode("CUST_"),
        customerSource: CustomerSource.WalkIn,
        customerType: "individual",
      });
      setSelectedProvince(undefined);
      setSelectedDistrict(undefined);
      setWards([]);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
    setSelectedProvince(undefined);
    setSelectedDistrict(undefined);
    setWards([]);
  };

  // Handle create new customer group
  const handleCreateCustomerGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      const database = getDatabase();
      const now = new Date().getTime();

      const groupCode = genCode("GROUP_");
      const groupData: CustomerGroup = {
        code: groupCode,
        name: values.name,
        createdAt: now,
        updatedAt: now,
      };

      const groupRef = ref(database, `xoxo/customerGroups/${groupCode}`);
      await set(groupRef, groupData);

      message.success("Thêm nhóm khách hàng thành công!");
      setGroupModalVisible(false);
      groupForm.resetFields();

      // Auto-select the newly created group
      form.setFieldsValue({ customerGroup: groupCode });
    } catch (error) {
      console.error("Error creating customer group:", error);
      message.error("Có lỗi xảy ra khi tạo nhóm khách hàng!");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const database = getDatabase();
      const now = new Date().getTime();

      // Convert dateOfBirth from dayjs to timestamp if exists
      const customerData: Customer = {
        ...values,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).valueOf()
          : undefined,
        updatedAt: now,
        ...(editingCustomer ? {} : { createdAt: now }),
      };

      const customerRef = ref(database, `xoxo/customers/${values.code}`);

      if (editingCustomer) {
        await update(customerRef, customerData);
        message.success("Cập nhật khách hàng thành công!");
      } else {
        await set(customerRef, customerData);
        message.success("Thêm khách hàng thành công!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      message.error("Có lỗi xảy ra khi lưu khách hàng!");
    }
  };

  const handleDelete = (customerCode: string, onCloseDrawer?: () => void) => {
    const customer = customers[customerCode];
    modal.confirm({
      title: "Xác nhận xóa",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa khách hàng:</p>
          <p className="font-semibold">{customer.name}?</p>
          <p className="text-red-500 text-sm mt-2">
            Thao tác này không thể hoàn tác!
          </p>
        </div>
      ),
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const database = getDatabase();
          const customerRef = ref(database, `xoxo/customers/${customerCode}`);
          await remove(customerRef);
          message.success("Xóa khách hàng thành công!");
          // Close drawer after successful deletion
          if (onCloseDrawer) {
            onCloseDrawer();
          }
        } catch (error) {
          console.error("Error deleting customer:", error);
          message.error("Có lỗi xảy ra khi xóa khách hàng!");
        }
      },
    });
  };

  const getSourceColor = (source: CustomerSource) => {
    const colors: Record<CustomerSource, string> = {
      [CustomerSource.Facebook]: "blue",
      [CustomerSource.Zalo]: "cyan",
      [CustomerSource.Instagram]: "magenta",
      [CustomerSource.Tiktok]: "purple",
      [CustomerSource.Website]: "green",
      [CustomerSource.Referral]: "gold",
      [CustomerSource.WalkIn]: "orange",
      [CustomerSource.Phone]: "volcano",
      [CustomerSource.Other]: "default",
    };
    return colors[source] || "default";
  };

  const getSourceLabel = (source: CustomerSource) => {
    const option = CustomerSourceOptions.find((opt) => opt.value === source);
    return option?.label || source;
  };

  const dataSource = Object.entries(customers).map(([code, customer]) => ({
    ...customer,
    key: code,
  }));

  const columns = [
    {
      title: "Mã KH",
      dataIndex: "code",
      key: "code",
      width: 150,
      fixed: "left" as const,
      render: (code: string) => (
        <Text strong className="text-primary">
          {code}
        </Text>
      ),
    },
    {
      title: "Tên khách hàng",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <Text copyable>{phone}</Text>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 260,
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <Text copyable={email ? true : false}>{email || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <Text ellipsis={{ tooltip: address }}>{address}</Text>
        </div>
      ),
    },
    {
      title: "Nguồn khách",
      dataIndex: "customerSource",
      key: "customerSource",
      width: 150,
      filters: CustomerSourceOptions.map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value: any, record: Customer) =>
        record.customerSource === value,
      render: (source: CustomerSource) => (
        <Tag color={getSourceColor(source)}>{getSourceLabel(source)}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      sorter: (a: Customer, b: Customer) => a.createdAt - b.createdAt,
      render: (date: number) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
  ];

  // Filter data
  const filteredData = applyFilter(dataSource);

  // Filter fields for WrapperContent
  const filterFields: FilterField[] = [
    {
      name: "customerSource",
      label: "Nguồn khách hàng",
      type: "select",
      options: CustomerSourceOptions,
    },
  ];

  // Wrapper component for CustomerDetail with handlers
  const CustomerDetailWrapper: React.FC<PropRowDetails<Customer>> = (props) => {
    const handleDeleteWithClose = (customerCode: string) => {
      handleDelete(customerCode, props.onClose);
    };

    return (
      <CustomerDetail
        {...props}
        onEdit={handleOpenModal}
        onDelete={handleDeleteWithClose}
        provinces={provinces}
      />
    );
  };

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo tên, SĐT, email...",
          filterKeys: ["name", "phone", "email"],
        },
        filters: {
          fields: filterFields,
          query: query,
          onApplyFilter: (filters) => {
            filters.forEach(({ key, value }) => updateQuery(key, value));
          },
          onReset: reset,
        },
        buttonEnds: [
          {
            can: true,
            name: "Thêm khách hàng",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => handleOpenModal(),
          },
        ],
      }}
    >
      <CommonTable
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        DrawerDetails={CustomerDetailWrapper}
        rowKey="code"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <Text strong>
              {editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
            </Text>
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        width={1000}
        okText={editingCustomer ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Row gutter={24}>
            {/* Left Column */}
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã khách hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập mã khách hàng!" },
                ]}
              >
                <Input placeholder="Mã tự động" disabled size="large" />
              </Form.Item>

              <Form.Item
                name="name"
                label="Tên khách hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khách hàng!" },
                  { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
                ]}
              >
                <Input
                  placeholder="Nhập tên khách hàng"
                  prefix={<UserOutlined />}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ!",
                  },
                ]}
              >
                <Input
                  placeholder="0912345678"
                  prefix={<Phone className="w-4 h-4 text-gray-400" />}
                  size="large"
                  maxLength={11}
                />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Ngày sinh"
              >
                <DatePicker
                  placeholder="--/--/----"
                  format="DD/MM/YYYY"
                  className="w-full"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
              >
                <Input
                  placeholder="Vui lòng nhập địa chỉ"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="province"
                label="Tỉnh/Thành phố"
              >
                <Select
                  placeholder="Chọn Tỉnh/Thành phố"
                  size="large"
                  showSearch
                  allowClear
                  value={selectedProvince}
                  onChange={(value) => {
                    setSelectedProvince(value);
                    form.setFieldsValue({ 
                      province: value,
                      district: undefined,
                      ward: undefined 
                    });
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={provinces.map((p) => ({
                    value: p.code,
                    label: p.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="district"
                label="Quận/Huyện"
              >
                <Select
                  placeholder="Chọn Quận/Huyện"
                  size="large"
                  showSearch
                  allowClear
                  disabled={!selectedProvince || districts.length === 0}
                  value={selectedDistrict}
                  onChange={(value) => {
                    setSelectedDistrict(value);
                    form.setFieldsValue({ 
                      district: value,
                      ward: undefined 
                    });
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={districts.map((d) => ({
                    value: d.code,
                    label: d.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="ward"
                label="Xã/Phường"
              >
                <Select
                  placeholder="Chọn Xã/Phường"
                  size="large"
                  showSearch
                  allowClear
                  disabled={!selectedDistrict || wards.length === 0}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={wards.map((w) => ({
                    value: w.code,
                    label: w.name,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Right Column */}
            <Col span={12}>
              <Form.Item
                name="customerType"
                label="Loại khách"
                initialValue="individual"
              >
                <Radio.Group size="large">
                  <Radio value="individual">Cá nhân</Radio>
                  <Radio value="enterprise">Doanh nghiệp</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
              >
                <Radio.Group size="large">
                  <Radio value="male">Nam</Radio>
                  <Radio value="female">Nữ</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="customerSource"
                label="Nguồn khách hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn nguồn khách hàng!" },
                ]}
                initialValue={CustomerSource.WalkIn}
              >
                <Select
                  placeholder="Chọn nguồn khách hàng"
                  options={CustomerSourceOptions}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="customerGroup"
                label="Nhóm khách"
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Select
                    placeholder="Chọn nhóm khách"
                    size="large"
                    style={{ flex: 1 }}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={Object.values(customerGroups).map((group) => ({
                      value: group.code,
                      label: group.name,
                    }))}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setGroupModalVisible(true)}
                    title="Thêm nhanh"
                  >
                    +
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                name="taxCode"
                label="Mã số thuế"
              >
                <Input
                  placeholder="Nhập mã số thuế"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Email không hợp lệ!" }]}
              >
                <Input
                  placeholder="Nhập email"
                  prefix={<Mail className="w-4 h-4 text-gray-400" />}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="facebook"
                label="Facebook"
              >
                <Input
                  placeholder="Nhập Facebook"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="notes"
                label="Ghi chú"
              >
                <Input.TextArea
                  placeholder="Nhập ghi chú..."
                  rows={4}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal for creating new customer group */}
      <Modal
        title="Thêm nhóm khách hàng mới"
        open={groupModalVisible}
        onCancel={() => {
          setGroupModalVisible(false);
          groupForm.resetFields();
        }}
        onOk={handleCreateCustomerGroup}
        okText="Thêm mới"
        cancelText="Hủy"
        width={500}
      >
        <Form form={groupForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên nhóm khách hàng"
            rules={[
              { required: true, message: "Vui lòng nhập tên nhóm khách hàng!" },
              { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
            ]}
          >
            <Input
              placeholder="VD: Khách hàng VIP, Khách hàng thân thiết..."
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </WrapperContent>
  );
}
