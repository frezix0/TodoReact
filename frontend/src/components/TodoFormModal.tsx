import React, { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, Button, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { TodoCreate, TodoUpdate, PriorityType } from "../types";
import { useTodos } from "../contexts/TodoContext";
import { useCategories } from "../contexts/CategoryContext";
import { getPriorityOptions } from "../utils";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

interface TodoFormModalProps {
  visible: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}

const TodoFormModal: React.FC<TodoFormModalProps> = ({
  visible,
  onCancel,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const {
    createTodo,
    updateTodo,
    ui: { selectedTodo, loading },
  } = useTodos();
  const { categories } = useCategories();

  const priorityOptions = getPriorityOptions();
  const isLoading = loading.creating || loading.updating;

  // Better form initialization with safe access
  useEffect(() => {
    if (visible) {
      if (isEdit && selectedTodo) {
        // Safe access to nested properties
        form.setFieldsValue({
          title: selectedTodo.title || "",
          description: selectedTodo.description || "",
          category_id: selectedTodo.category?.id || undefined,
          priority: selectedTodo.priority || "medium",
          due_date: selectedTodo.due_date ? dayjs(selectedTodo.due_date) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          priority: "medium" as PriorityType,
          // Set default category if available
          category_id: categories.length > 0 ? categories[0].id : undefined,
        });
      }
    }
  }, [visible, isEdit, selectedTodo, form, categories]);

  const handleSubmit = async (values: any) => {
    try {
      // Better validation and data preparation
      const todoData = {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        category_id: values.category_id,
        priority: values.priority || "medium",
        due_date: values.due_date ? values.due_date.toISOString() : null,
      };

      // Validate that category_id exists
      if (!todoData.category_id) {
        throw new Error("Please select a category");
      }

      if (isEdit && selectedTodo) {
        await updateTodo(selectedTodo.id, todoData as TodoUpdate);
      } else {
        await createTodo(todoData as TodoCreate);
      }

      form.resetFields();
      onCancel(); // Close modal on success
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Check if categories are available
  const hasCategoriesAvailable = categories && categories.length > 0;

  return (
    <Modal
      title={
        <span style={{ color: "black", fontWeight: 600, fontSize: "18px" }}>
          {isEdit ? "Edit Todo" : "Create New Todo"}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
      styles={{
        header: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderBottom: "none",
          padding: "20px 24px",
        },
        body: {
          padding: "24px",
          background: "white",
        },
      }}
      closeIcon={
        <CloseOutlined
          style={{
            color: "black",
            fontSize: "20px",
            padding: "4px",
            borderRadius: "4px",
          }}
        />
      }
    >
      {/* Show warning if no categories available */}
      {!hasCategoriesAvailable && (
        <div
          style={{
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            color: "#d46b08",
            fontSize: "14px",
          }}
        >
          <strong>No categories available.</strong> Please create a category
          first before adding todos.
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={isLoading || !hasCategoriesAvailable}
      >
        <Form.Item
          name="title"
          label={
            <span
              style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
            >
              Title
            </span>
          }
          rules={[
            { required: true, message: "Please enter a title" },
            { max: 200, message: "Title must be less than 200 characters" },
            {
              validator: (_, value) => {
                if (value && value.trim().length === 0) {
                  return Promise.reject(
                    new Error("Title cannot be empty or just spaces")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="Enter todo title..."
            showCount
            maxLength={200}
            style={{
              borderRadius: "8px",
              border: "2px solid #e2e8f0",
              transition: "all 0.2s ease-in-out",
            }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={
            <span
              style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
            >
              Description
            </span>
          }
          rules={[
            {
              max: 1000,
              message: "Description must be less than 1000 characters",
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Enter description (optional)..."
            showCount
            maxLength={1000}
            style={{
              borderRadius: "8px",
              border: "2px solid #e2e8f0",
              transition: "all 0.2s ease-in-out",
            }}
          />
        </Form.Item>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Form.Item
            name="category_id"
            label={
              <span
                style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
              >
                Category
              </span>
            }
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder={
                hasCategoriesAvailable
                  ? "Select a category"
                  : "No categories available"
              }
              style={{
                borderRadius: "8px",
              }}
              disabled={!hasCategoriesAvailable}
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  <Space>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: category.color || "#9ca3af",
                      }}
                    />
                    {category.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label={
              <span
                style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
              >
                Priority
              </span>
            }
            rules={[{ required: true, message: "Please select a priority" }]}
          >
            <Select
              placeholder="Select priority"
              style={{
                borderRadius: "8px",
              }}
            >
              {priorityOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: option.color,
                      }}
                    />
                    {option.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="due_date"
          label={
            <span
              style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
            >
              Due Date (Optional)
            </span>
          }
        >
          <DatePicker
            showTime
            placeholder="Select due date and time"
            className="w-full"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "2px solid #e2e8f0",
            }}
            format="YYYY-MM-DD HH:mm"
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </Form.Item>

        <Form.Item
          className="mb-0"
          style={{ textAlign: "right", marginBottom: 0 }}
        >
          <Space>
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              style={{
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              disabled={!hasCategoriesAvailable}
              style={{
                background: hasCategoriesAvailable
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "#d1d5db",
                border: "none",
                borderRadius: "8px",
                fontWeight: 500,
                boxShadow: hasCategoriesAvailable
                  ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                  : "none",
              }}
            >
              {isEdit ? "Update Todo" : "Create Todo"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TodoFormModal;
