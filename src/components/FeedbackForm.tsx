"use client";

import { useUser } from "@/firebase/provider";
import { FeedbackService } from "@/services/feedbackService";
import { MemberService } from "@/services/memberService";
import { IMembers } from "@/types/members";
import {
  FeedbackType,
  FeedbackTypeOptions,
  FeedbackStatus,
  FeedbackStatusOptions,
  type CustomerFeedback,
} from "@/types/feedback";
import { App, Button, Form, Input, Radio, Rate, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

interface FeedbackFormProps {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialFeedback?: CustomerFeedback;
}

export default function FeedbackForm({
  orderId,
  orderCode,
  customerName,
  customerPhone,
  customerId,
  onSuccess,
  onCancel,
  initialFeedback,
}: FeedbackFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<IMembers[]>([]);
  const { message } = App.useApp();
  const { user } = useUser();

  useEffect(() => {
    const unsubscribe = MemberService.onSnapshot((data) => {
      setMembers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialFeedback) {
      form.setFieldsValue({
        feedbackType: initialFeedback.feedbackType,
        rating: initialFeedback.rating,
        notes: initialFeedback.notes,
        content: initialFeedback.content,
        solution: initialFeedback.solution,
        saleId: initialFeedback.saleId,
        status: initialFeedback.status || 
          (initialFeedback.requiresReService ? FeedbackStatus.NEED_REPROCESS : FeedbackStatus.GOOD),
      });
    }
  }, [initialFeedback, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const selectedSale = members.find((m) => m.id === values.saleId);
      
      const feedbackData: Omit<
        CustomerFeedback,
        "id" | "createdAt" | "updatedAt"
      > = {
        orderId,
        orderCode,
        customerId,
        customerName,
        customerPhone,
        feedbackType: values.feedbackType,
        rating: values.rating,
        notes: values.notes,
        content: values.content,
        solution: values.solution,
        saleId: values.saleId,
        saleName: selectedSale?.name,
        collectedBy: user?.uid,
        collectedByName:
          user?.displayName || user?.email || "Người dùng hiện tại",
        collectedAt: initialFeedback?.collectedAt || new Date().getTime(),
        status: values.status || 
          (values.feedbackType === FeedbackType.COMPLAINT || values.feedbackType === FeedbackType.ANGRY
            ? FeedbackStatus.NEED_REPROCESS 
            : FeedbackStatus.GOOD),
        // Keep requiresReService for backward compatibility
        requiresReService: values.status === FeedbackStatus.NEED_REPROCESS ||
          values.feedbackType === FeedbackType.COMPLAINT ||
          values.feedbackType === FeedbackType.ANGRY,
      };

      if (initialFeedback) {
        await FeedbackService.update(initialFeedback.id, feedbackData);
        message.success("Cập nhật feedback thành công!");
      } else {
        await FeedbackService.create(feedbackData);
        message.success("Lưu feedback thành công!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving feedback:", error);
      message.error("Có lỗi xảy ra khi lưu feedback!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <div className="mb-4">
        <Text strong>Khách hàng: </Text>
        <Text>{customerName}</Text>
        <Text className="ml-2 text-gray-500">({customerPhone})</Text>
      </div>

      <Form.Item
        label="Loại feedback"
        name="feedbackType"
        rules={[{ required: true, message: "Vui lòng chọn loại feedback!" }]}
      >
        <Radio.Group options={FeedbackTypeOptions} />
      </Form.Item>

      <Form.Item label="Đánh giá (tùy chọn)" name="rating">
        <Rate allowHalf />
      </Form.Item>

      <Form.Item
        label="Nội dung"
        name="content"
        rules={[{ max: 2000, message: "Nội dung không được quá 2000 ký tự!" }]}
      >
        <TextArea
          rows={4}
          placeholder="Nhập nội dung feedback của khách hàng..."
          showCount
          maxLength={2000}
        />
      </Form.Item>

      <Form.Item
        label="Phương án giải quyết"
        name="solution"
        rules={[{ max: 2000, message: "Phương án giải quyết không được quá 2000 ký tự!" }]}
      >
        <TextArea
          rows={4}
          placeholder="Nhập phương án giải quyết..."
          showCount
          maxLength={2000}
        />
      </Form.Item>

      <Form.Item
        label="Trạng thái"
        name="status"
      >
        <Select
          placeholder="Chọn trạng thái"
          options={FeedbackStatusOptions}
        />
      </Form.Item>

      <Form.Item
        label="Sale phụ trách"
        name="saleId"
      >
        <Select
          placeholder="Chọn sale phụ trách"
          showSearch
          allowClear
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={members.map((member) => ({
            label: member.name,
            value: member.id,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Ghi chú"
        name="notes"
        rules={[{ max: 1000, message: "Ghi chú không được quá 1000 ký tự!" }]}
      >
        <TextArea
          rows={3}
          placeholder="Nhập ghi chú bổ sung..."
          showCount
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialFeedback ? "Cập nhật" : "Lưu"}
          </Button>
          {onCancel && <Button onClick={onCancel}>Hủy</Button>}
        </Space>
      </Form.Item>
    </Form>
  );
}


