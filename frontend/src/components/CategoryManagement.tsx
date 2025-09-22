import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  ColorPicker,
  Space,
  Typography,
  Popconfirm,
  Avatar,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";
import { useCategories } from "../contexts/CategoryContext";
import { CategoryCreate, CategoryUpdate, Category } from "../types";
import { generateRandomColor, getContrastColor } from "../utils";

const { Text, Title } = Typography;

interface CategoryManagementProps {
  visible: boolean;
  onCancel: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  visible,
  onCancel,
}) => {
  const {
    categoriesWithCounts,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategoryCounts,
    ui,
  } = useCategories();

  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // FIXED: Refresh category counts when modal opens
  useEffect(() => {
    if (visible) {
      fetchCategoryCounts();
    }
  }, [visible, fetchCategoryCounts]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({ color: generateRandomColor() });
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setIsCreating(false);
    form.setFieldsValue({
      name: category.name,
      color: category.color,
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCategory(null);
    form.resetFields();
  };

  // FIXED: Better form submission with validation
  const handleSubmit = async (values: any) => {
    try {
      // Validate color format
      const color =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.() || values.color;

      if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
        message.error("Please select a valid color");
        return;
      }

      const categoryData = {
        name: values.name.trim(),
        color: color,
      };

      if (editingCategory) {
        console.log("Updating category:", editingCategory.id, categoryData);
        await updateCategory(
          editingCategory.id,
          categoryData as CategoryUpdate
        );
      } else {
        console.log("Creating category:", categoryData);
        await createCategory(categoryData as CategoryCreate);
      }

      // Reset form and refresh data
      handleCancel();
      await fetchCategoryCounts(); // Refresh to get updated counts
    } catch (error) {
      console.error("Category form error:", error);
      // Error is already handled in context
    }
  };

  // FIXED: Better delete confirmation with loading state
  const handleDelete = async (categoryId: number) => {
    try {
      console.log("Deleting category:", categoryId);
      await deleteCategory(categoryId);
      await fetchCategoryCounts(); // Refresh after deletion
    } catch (error) {
      console.error("Delete category error:", error);
      // Error is already handled in context
    }
  };

  const renderCategoryForm = () => (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          color: "#2d3748",
        }}
      >
        <BgColorsOutlined style={{ color: "#667eea" }} />
        <span style={{ fontWeight: "600", fontSize: "16px" }}>
          {editingCategory ? "Edit Category" : "Create New Category"}
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={ui.loading.creating || ui.loading.updating}
      >
        <Form.Item
          name="name"
          label={
            <span
              style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
            >
              Category Name *
            </span>
          }
          rules={[
            { required: true, message: "Please enter category name" },
            { max: 100, message: "Name must be less than 100 characters" },
            { min: 1, message: "Name cannot be empty" },
            {
              validator: (_, value) => {
                if (value && value.trim().length === 0) {
                  return Promise.reject(
                    new Error("Name cannot be empty or just spaces")
                  );
                }
                // Check for duplicate names (excluding current editing category)
                const existingCategory = categoriesWithCounts.find(
                  (cat) =>
                    cat.name.toLowerCase() === value?.toLowerCase().trim() &&
                    cat.id !== editingCategory?.id
                );
                if (existingCategory) {
                  return Promise.reject(
                    new Error("Category name already exists")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="Enter category name..."
            showCount
            maxLength={100}
            style={{
              borderRadius: "8px",
              border: "2px solid #e2e8f0",
              transition: "all 0.2s ease",
            }}
          />
        </Form.Item>

        <Form.Item
          name="color"
          label={
            <span
              style={{ fontWeight: 600, color: "#2d3748", fontSize: "14px" }}
            >
              Category Color *
            </span>
          }
          rules={[
            { required: true, message: "Please select a color" },
            {
              validator: (_, value) => {
                const color =
                  typeof value === "string" ? value : value?.toHexString?.();
                if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
                  return Promise.reject(
                    new Error("Please select a valid color")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <ColorPicker
            showText
            style={{ width: "100%" }}
            presets={[
              {
                label: "Recommended Colors",
                colors: [
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#06B6D4",
                  "#F97316",
                  "#84CC16",
                  "#EC4899",
                  "#14B8A6",
                  "#6366F1",
                  "#E11D48",
                  "#7C3AED",
                  "#059669",
                  "#DC2626",
                ],
              },
            ]}
            onChangeComplete={(color) => {
              // Update form value when color changes
              form.setFieldValue("color", color.toHexString());
            }}
          />
        </Form.Item>

        <Form.Item
          className="mb-0"
          style={{ textAlign: "right", marginBottom: 0 }}
        >
          <Space>
            <Button
              onClick={handleCancel}
              disabled={ui.loading.creating || ui.loading.updating}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={ui.loading.creating || ui.loading.updating}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              {ui.loading.creating || ui.loading.updating
                ? editingCategory
                  ? "Updating..."
                  : "Creating..."
                : editingCategory
                ? "Update Category"
                : "Create Category"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );

  const renderCategoryList = () => (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Title
            level={5}
            style={{
              margin: 0,
              color: "#2d3748",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Categories
          </Title>
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            ({categoriesWithCounts.length} total)
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleStartCreate}
          disabled={isCreating || editingCategory !== null}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Add Category
        </Button>
      </div>

      {ui.loading.categories ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px", color: "#6b7280" }}>
            Loading categories...
          </div>
        </div>
      ) : categoriesWithCounts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {categoriesWithCounts.map((category) => (
            <div
              key={category.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                background: "white",
                border:
                  editingCategory?.id === category.id
                    ? "2px solid #667eea"
                    : "1px solid #e5e7eb",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                boxShadow:
                  editingCategory?.id === category.id
                    ? "0 4px 12px rgba(102, 126, 234, 0.2)"
                    : "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Avatar
                  size={40}
                  style={{
                    backgroundColor: category.color,
                    color: getContrastColor(category.color),
                    fontWeight: "600",
                    border: "2px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "14px",
                      color: "#1f2937",
                      display: "block",
                    }}
                  >
                    {category.name}
                  </Text>
                  <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                    {category.todo_count} todo
                    {category.todo_count !== 1 ? "s" : ""}
                    {category.todo_count > 0 && (
                      <span style={{ color: "#f59e0b", marginLeft: "4px" }}>
                        • Active
                      </span>
                    )}
                  </Text>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Tooltip title="Edit category">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleStartEdit(category)}
                    disabled={
                      isCreating ||
                      (editingCategory !== null &&
                        editingCategory.id !== category.id) ||
                      ui.loading.updating ||
                      ui.loading.deleting
                    }
                    size="small"
                    style={{
                      color:
                        editingCategory?.id === category.id
                          ? "#667eea"
                          : "#3b82f6",
                      borderRadius: "6px",
                      fontWeight:
                        editingCategory?.id === category.id ? "600" : "normal",
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title={
                    <span style={{ color: "#1f2937", fontWeight: 600 }}>
                      Delete Category
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ color: "#374151", margin: "4px 0" }}>
                        Are you sure you want to delete{" "}
                        <strong>"{category.name}"</strong>?
                      </p>
                      {category.todo_count > 0 ? (
                        <p
                          style={{
                            color: "#dc2626",
                            fontSize: "12px",
                            margin: "4px 0 0 0",
                            fontWeight: "500",
                          }}
                        >
                          ⚠️ This will also delete {category.todo_count} todo
                          {category.todo_count !== 1 ? "s" : ""} in this
                          category.
                        </p>
                      ) : (
                        <p
                          style={{
                            color: "#059669",
                            fontSize: "12px",
                            margin: "4px 0 0 0",
                          }}
                        >
                          ✓ This category has no todos and can be safely
                          deleted.
                        </p>
                      )}
                    </div>
                  }
                  onConfirm={() => handleDelete(category.id)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{
                    danger: true,
                    style: { borderRadius: "6px" },
                    loading: ui.loading.deleting,
                  }}
                  cancelButtonProps={{ style: { borderRadius: "6px" } }}
                  disabled={ui.loading.deleting}
                >
                  <Tooltip title="Delete category">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={
                        ui.loading.deleting ||
                        isCreating ||
                        editingCategory !== null
                      }
                      size="small"
                      style={{ color: "#dc2626", borderRadius: "6px" }}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <BgColorsOutlined
            style={{ fontSize: "48px", color: "#d1d5db", marginBottom: "16px" }}
          />
          <Text
            style={{
              color: "#6b7280",
              fontSize: "16px",
              display: "block",
              marginBottom: "8px",
            }}
          >
            No categories found
          </Text>
          <Text style={{ color: "#9ca3af", fontSize: "14px" }}>
            Create your first category to organize your todos
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      title={
        <Space style={{ color: "black" }}>
          <BgColorsOutlined />
          <span>Category Management</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
      maskClosable={
        !ui.loading.creating && !ui.loading.updating && !ui.loading.deleting
      }
      closable={
        !ui.loading.creating && !ui.loading.updating && !ui.loading.deleting
      }
      styles={{
        body: { padding: "24px" },
        header: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderBottom: "none",
        },
      }}
      closeIcon={<CloseOutlined style={{ color: "black", fontSize: "20px" }} />}
    >
      <div className="space-y-6">
        {(isCreating || editingCategory) && renderCategoryForm()}
        {renderCategoryList()}

        {/* Show loading overlay when performing operations */}
        {(ui.loading.creating ||
          ui.loading.updating ||
          ui.loading.deleting) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255, 255, 255, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              borderRadius: "8px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Spin size="large" />
              <div style={{ marginTop: "16px", color: "#6b7280" }}>
                {ui.loading.creating && "Creating category..."}
                {ui.loading.updating && "Updating category..."}
                {ui.loading.deleting && "Deleting category..."}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CategoryManagement;
