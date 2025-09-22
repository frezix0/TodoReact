import React, { useCallback, useEffect, useState } from "react";
import {
  Input,
  Select,
  Space,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Tag,
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { PriorityType } from "../types";
import { useTodos } from "../contexts/TodoContext";
import { useCategories } from "../contexts/CategoryContext";
import { getPriorityOptions, debounce } from "../utils";

const { Text } = Typography;
const { Option } = Select;

interface TodoFiltersProps {
  className?: string;
}

const TodoFilters: React.FC<TodoFiltersProps> = ({ className }) => {
  const { filters, setFilters, pagination } = useTodos();
  const { categories } = useCategories();

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // FIXED: Create stable debounced function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      console.log("Applying search filter:", value);
      setFilters({ search: value || undefined });
    }, 300),
    [setFilters]
  );

  // Sync local search with filters when filters change externally
  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  // FIXED: Real-time search with immediate local update
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value); // Immediate UI update
    debouncedSearch(value); // Debounced API call
  };

  // FIXED: Immediate filter updates (no debounce for dropdowns)
  const handleCategoryChange = (categoryId: number | undefined) => {
    console.log("Category filter changed:", categoryId);
    setFilters({ category_id: categoryId });
  };

  const handleCompletedChange = (completed: boolean | undefined) => {
    console.log("Completion status filter changed:", completed);
    setFilters({ completed });
  };

  const handlePriorityChange = (priority: PriorityType | undefined) => {
    console.log("Priority filter changed:", priority);
    setFilters({ priority });
  };

  const handleSortChange = (sortBy: string) => {
    console.log("Sort changed:", sortBy);
    setFilters({ sort_by: sortBy as any });
  };

  const handleSortOrderToggle = () => {
    const newOrder = filters.sort_order === "asc" ? "desc" : "asc";
    console.log("Sort order changed:", newOrder);
    setFilters({ sort_order: newOrder });
  };

  // FIXED: Clear filters also clears local search
  const handleClearFilters = () => {
    console.log("Clearing all filters");
    setLocalSearch(""); // Clear local search state
    setFilters({
      search: undefined,
      category_id: undefined,
      completed: undefined,
      priority: undefined,
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.category_id ||
    filters.completed !== undefined ||
    filters.priority ||
    filters.sort_by !== "created_at" ||
    filters.sort_order !== "desc"
  );

  const priorityOptions = getPriorityOptions();

  return (
    <Card
      className={`${className} filters-card`}
      size="small"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        marginBottom: "20px",
      }}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* Search - FIXED: Uses local state for immediate feedback */}
        <Col xs={24} sm={12} md={8}>
          <div className="filter-control">
            <Input
              placeholder="Search todos..."
              prefix={<SearchOutlined />}
              value={localSearch} // Use local state for immediate response
              onChange={handleSearchChange}
              allowClear={{
                clearIcon: <ClearOutlined />,
              }}
              onClear={() => {
                setLocalSearch("");
                setFilters({ search: undefined });
              }}
              style={{
                borderRadius: "8px",
                border: "2px solid #e2e8f0",
                transition: "all 0.2s ease",
              }}
            />
          </div>
        </Col>

        {/* Category Filter - FIXED: Safe rendering with null checks */}
        <Col xs={24} sm={12} md={4}>
          <div className="filter-control">
            <Select
              placeholder="Category"
              value={filters.category_id}
              onChange={handleCategoryChange}
              allowClear
              className="w-full"
              style={{ width: "100%" }}
              showSearch // Enable search in dropdown
              filterOption={(input, option) =>
                (option?.children as any)?.[1]
                  ?.toLowerCase?.()
                  .includes(input.toLowerCase())
              }
            >
              {categories?.map((category) => (
                <Option key={category.id} value={category.id}>
                  <Space>
                    <div
                      className="w-3 h-3 rounded-full inline-block"
                      style={{
                        backgroundColor: category.color || "#9ca3af", // FIXED: Safe color access
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                      }}
                    />
                    {category.name || "Unnamed Category"}{" "}
                    {/* FIXED: Safe name access */}
                  </Space>
                </Option>
              )) || []}
            </Select>
          </div>
        </Col>

        {/* Completion Status Filter */}
        <Col xs={24} sm={12} md={3}>
          <div className="filter-control">
            <Select
              placeholder="Status"
              value={filters.completed}
              onChange={handleCompletedChange}
              allowClear
              className="w-full"
              style={{ width: "100%" }}
            >
              <Option value={false}>
                <Tag color="orange">Pending</Tag>
              </Option>
              <Option value={true}>
                <Tag color="green">Completed</Tag>
              </Option>
            </Select>
          </div>
        </Col>

        {/* Priority Filter - FIXED: Safe options rendering */}
        <Col xs={24} sm={12} md={3}>
          <div className="filter-control">
            <Select
              placeholder="Priority"
              value={filters.priority}
              onChange={handlePriorityChange}
              allowClear
              className="w-full"
              style={{ width: "100%" }}
            >
              {priorityOptions?.map((option) => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color || "#6b7280"}>{option.label}</Tag>
                </Option>
              )) || []}
            </Select>
          </div>
        </Col>

        {/* Sort Controls */}
        <Col xs={24} sm={12} md={4}>
          <div className="filter-control">
            <Space.Compact className="w-full" style={{ width: "100%" }}>
              <Select
                value={filters.sort_by}
                onChange={handleSortChange}
                style={{ flex: 1 }}
              >
                <Option value="created_at">Created</Option>
                <Option value="updated_at">Updated</Option>
                <Option value="title">Title</Option>
                <Option value="priority">Priority</Option>
                <Option value="due_date">Due Date</Option>
              </Select>
              <Button
                icon={
                  filters.sort_order === "asc" ? (
                    <SortAscendingOutlined />
                  ) : (
                    <SortDescendingOutlined />
                  )
                }
                onClick={handleSortOrderToggle}
                title={`Sort ${
                  filters.sort_order === "asc" ? "ascending" : "descending"
                }`}
                style={{
                  borderRadius: "0 8px 8px 0",
                }}
              />
            </Space.Compact>
          </div>
        </Col>

        {/* Clear Filters */}
        <Col xs={24} sm={12} md={2}>
          <div className="filter-control">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
              style={{
                width: "100%",
                borderRadius: "8px",
              }}
            >
              Clear
            </Button>
          </div>
        </Col>
      </Row>

      {/* Active Filters Display - FIXED: Safe category name access */}
      {hasActiveFilters && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Space wrap>
            <Text style={{ fontSize: "12px", color: "#6b7280" }}>
              Active filters:
            </Text>

            {filters.search && (
              <Tag
                closable
                onClose={() => {
                  setLocalSearch("");
                  setFilters({ search: undefined });
                }}
                style={{ borderRadius: "12px" }}
              >
                Search: "{filters.search}"
              </Tag>
            )}

            {filters.category_id && (
              <Tag
                closable
                onClose={() => setFilters({ category_id: undefined })}
                style={{ borderRadius: "12px" }}
              >
                Category:{" "}
                {categories?.find((c) => c.id === filters.category_id)?.name ||
                  "Unknown"}
              </Tag>
            )}

            {filters.completed !== undefined && (
              <Tag
                color={filters.completed ? "green" : "orange"}
                closable
                onClose={() => setFilters({ completed: undefined })}
                style={{ borderRadius: "12px" }}
              >
                {filters.completed ? "Completed" : "Pending"}
              </Tag>
            )}

            {filters.priority && (
              <Tag
                color={
                  priorityOptions?.find((p) => p.value === filters.priority)
                    ?.color || "#6b7280"
                }
                closable
                onClose={() => setFilters({ priority: undefined })}
                style={{ borderRadius: "12px" }}
              >
                Priority:{" "}
                {priorityOptions?.find((p) => p.value === filters.priority)
                  ?.label || "Unknown"}
              </Tag>
            )}
          </Space>

          {/* Results Count - FIXED: Safe pagination access */}
          <div style={{ marginTop: "8px" }}>
            <Text style={{ fontSize: "11px", color: "#9ca3af" }}>
              {pagination
                ? `Found ${pagination.total} result${
                    pagination.total !== 1 ? "s" : ""
                  }${
                    pagination.total > pagination.per_page
                      ? ` (showing page ${pagination.current_page} of ${pagination.total_pages})`
                      : ""
                  }`
                : "Searching..."}
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TodoFilters;
