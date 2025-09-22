import React, { useState } from "react";
import { Layout, Button, Typography, Row, Col, Pagination } from "antd";
import { PlusOutlined, BgColorsOutlined } from "@ant-design/icons";
import "./App.css";

// Import your components
import TodoFilters from "./components/TodoFilters";
import TodoList from "./components/TodoList";
import TodoSummary from "./components/TodoSummary";
import CategoryManagement from "./components/CategoryManagement";
import TodoFormModal from "./components/TodoFormModal";

// Import your context providers
import { TodoProvider, useTodos } from "./contexts/TodoContext";
import { CategoryProvider } from "./contexts/CategoryContext";

const { Header, Content } = Layout;
const { Title } = Typography;

// Create an inner component that can use the TodoContext
const TodoApp: React.FC = () => {
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Use the TodoContext to get modal states and control functions
  const {
    ui,
    pagination,
    setPage,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
  } = useTodos();

  return (
    <div className="todo-app">
      <Layout style={{ minHeight: "100vh", background: "transparent" }}>
        {/* Header */}
        <Header className="ant-layout-header">
          <Title
            level={1}
            style={{
              background: "black",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 500,
              fontSize: "32px",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Todo App
          </Title>

          <div className="header-actions">
            <Button
              className="ant-btn-default"
              icon={<BgColorsOutlined />}
              onClick={() => setCategoryModalVisible(true)}
              style={{
                height: "44px",
                padding: "0 24px",
                fontWeight: 600,
                fontSize: "15px",
                borderRadius: "12px",
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "white",
                border: "1px solid #e2e8f0",
                color: "#4a5568",
              }}
            >
              Categories
            </Button>
            <Button
              className="ant-btn-primary"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal} // Use context function instead of local state
              style={{
                height: "44px",
                padding: "0 24px",
                fontWeight: 600,
                fontSize: "15px",
                borderRadius: "12px",
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                color: "white",
              }}
            >
              New Todo
            </Button>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            background: "transparent",
            padding: "24px",
          }}
        >
          <Row gutter={[24, 24]}>
            {/* Left Column: Filters + Todo List + Pagination */}
            <Col xs={24} lg={16}>
              <div>
                {/* Filters */}
                <TodoFilters className="mb-4" />

                {/* Todo List */}
                <TodoList className="mb-4" />

                {/* Pagination */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "32px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {/* Pagination info */}
                  <div
                    style={{
                      marginBottom: "16px",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    {pagination ? (
                      <>
                        {pagination.current_page * pagination.per_page -
                          pagination.per_page +
                          1}
                        -
                        {Math.min(
                          pagination.current_page * pagination.per_page,
                          pagination.total
                        )}{" "}
                        of {pagination.total} items
                      </>
                    ) : (
                      "Loading..."
                    )}
                  </div>

                  {/* Pagination component */}
                  {pagination && (
                    <Pagination
                      current={pagination.current_page}
                      total={pagination.total}
                      pageSize={pagination.per_page}
                      showSizeChanger={false}
                      showQuickJumper
                      onChange={setPage}
                      showTotal={(total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`
                      }
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    />
                  )}
                </div>
              </div>
            </Col>

            {/* Right Column: Summary */}
            <Col xs={24} lg={8}>
              <TodoSummary />
            </Col>
          </Row>
        </Content>
      </Layout>

      {/* Modals */}
      <CategoryManagement
        visible={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
      />

      {/* CREATE TODO MODAL */}
      <TodoFormModal
        visible={ui.isCreateModalOpen}
        onCancel={closeCreateModal}
        isEdit={false}
      />

      {/* EDIT TODO MODAL - This was missing! */}
      <TodoFormModal
        visible={ui.isEditModalOpen}
        onCancel={closeEditModal}
        isEdit={true}
      />
    </div>
  );
};

// Main App component with providers
const App: React.FC = () => {
  return (
    <TodoProvider>
      <CategoryProvider>
        <TodoApp />
      </CategoryProvider>
    </TodoProvider>
  );
};

export default App;
