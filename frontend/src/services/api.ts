import axios, { AxiosInstance, AxiosError } from "axios";
import {
  Todo,
  TodoCreate,
  TodoUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoryWithTodoCount,
  PaginatedResponse,
  TodoSummary,
  TodoFilters,
  ApiError,
} from "../types";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor with better error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error("API Error:", error);

        const apiError: ApiError = {
          success: false,
          message: "An unexpected error occurred",
          error_code: "NETWORK_ERROR",
        };

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const errorData = error.response.data as any;

          switch (status) {
            case 400:
              apiError.message =
                errorData?.detail || "Bad Request - Invalid data provided";
              apiError.error_code = "BAD_REQUEST";
              break;
            case 401:
              apiError.message = "Unauthorized - Please check your credentials";
              apiError.error_code = "UNAUTHORIZED";
              break;
            case 403:
              apiError.message =
                "Forbidden - You don't have permission to access this resource";
              apiError.error_code = "FORBIDDEN";
              break;
            case 404:
              apiError.message =
                "Not Found - The requested resource was not found";
              apiError.error_code = "NOT_FOUND";
              break;
            case 422:
              apiError.message =
                errorData?.detail ||
                "Validation Error - Please check your input";
              apiError.error_code = "VALIDATION_ERROR";
              break;
            case 500:
              apiError.message =
                "Internal Server Error - Please try again later";
              apiError.error_code = "SERVER_ERROR";
              break;
            default:
              apiError.message =
                errorData?.detail ||
                errorData?.message ||
                `Server Error: ${status}`;
              apiError.error_code = "API_ERROR";
          }

          apiError.errors = errorData?.errors;
        } else if (error.request) {
          // Request was made but no response received
          if (error.code === "ECONNREFUSED") {
            apiError.message =
              "Cannot connect to server - Make sure your backend is running on http://localhost:8000";
            apiError.error_code = "CONNECTION_REFUSED";
          } else if (error.code === "ETIMEDOUT") {
            apiError.message =
              "Request timeout - Server is taking too long to respond";
            apiError.error_code = "TIMEOUT";
          } else {
            apiError.message =
              "Network error - Please check your internet connection and try again";
            apiError.error_code = "NETWORK_ERROR";
          }
        } else {
          // Something else happened
          apiError.message = error.message || "An unexpected error occurred";
          apiError.error_code = "UNKNOWN_ERROR";
        }

        // Log detailed error info for debugging
        console.error("Detailed API Error:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: apiError.message,
        });

        throw apiError;
      }
    );
  }

  // Health check method to test backend connectivity
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.client.get("/health");
      console.log("Backend health check successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Backend health check failed:", error);
      throw error;
    }
  }

  async getTodos(
    page = 1,
    per_page = 10,
    filters: TodoFilters = {}
  ): Promise<PaginatedResponse<Todo>> {
    try {
      // Create clean params object
      const queryParams: Record<string, string> = {
        page: page.toString(),
        per_page: per_page.toString(),
      };

      // Add optional filters only if they have values
      if (filters.search?.trim()) queryParams.search = filters.search.trim();
      if (filters.category_id !== undefined)
        queryParams.category_id = filters.category_id.toString();
      if (filters.completed !== undefined)
        queryParams.completed = filters.completed.toString();
      if (filters.priority) queryParams.priority = filters.priority;
      if (filters.sort_by) queryParams.sort_by = filters.sort_by;
      if (filters.sort_order) queryParams.sort_order = filters.sort_order;

      // Create URLSearchParams from clean object
      const params = new URLSearchParams(queryParams);
      const url = `/todos?${params.toString()}`;

      console.log("Fetching todos with URL:", url);

      const response = await this.client.get(url);
      console.log("Todos API Response:", response.data);

      // Validate response structure
      if (!response.data) {
        throw new Error("No data received from server");
      }

      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.warn("Invalid data format, using empty array");
        response.data.data = [];
      }

      if (!response.data.pagination) {
        console.warn("Invalid pagination format, using default");
        response.data.pagination = {
          current_page: 1,
          per_page: per_page,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }
  }

  async getTodo(id: number): Promise<Todo> {
    try {
      const response = await this.client.get<Todo>(`/todos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching todo ${id}:`, error);
      throw error;
    }
  }

  async createTodo(todo: TodoCreate): Promise<Todo> {
    try {
      console.log("Creating todo:", todo);
      const response = await this.client.post<Todo>("/todos", todo);
      console.log("Todo created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  }

  async updateTodo(id: number, todo: TodoUpdate): Promise<Todo> {
    try {
      console.log(`Updating todo ${id}:`, todo);
      const response = await this.client.put<Todo>(`/todos/${id}`, todo);
      console.log("Todo updated:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating todo ${id}:`, error);
      throw error;
    }
  }

  async deleteTodo(id: number): Promise<void> {
    try {
      console.log(`Deleting todo ${id}`);
      await this.client.delete(`/todos/${id}`);
      console.log(`Todo ${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting todo ${id}:`, error);
      throw error;
    }
  }

  async toggleTodoComplete(id: number, completed: boolean): Promise<Todo> {
    try {
      console.log(`Toggling todo ${id} completion to:`, completed);
      const response = await this.client.patch<Todo>(`/todos/${id}/complete`, {
        completed,
      });
      console.log("Todo completion toggled:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error toggling todo ${id} completion:`, error);
      throw error;
    }
  }

  async getTodoSummary(): Promise<TodoSummary> {
    try {
      console.log("Fetching todo summary");
      const response = await this.client.get<TodoSummary>("/todos/summary");
      console.log("Todo summary fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching todo summary:", error);
      throw error;
    }
  }

  // Category API methods
  async getCategories(): Promise<Category[]> {
    try {
      console.log("Fetching categories");
      const response = await this.client.get<Category[]>("/categories");
      console.log("Categories fetched:", response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async getCategoriesWithCount(): Promise<CategoryWithTodoCount[]> {
    try {
      console.log("Fetching categories with counts");
      const response = await this.client.get<CategoryWithTodoCount[]>(
        "/categories/with-counts"
      );
      console.log("Categories with counts fetched:", response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching categories with counts:", error);
      throw error;
    }
  }

  async getCategory(id: number): Promise<Category> {
    try {
      const response = await this.client.get<Category>(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  }

  async createCategory(category: CategoryCreate): Promise<Category> {
    try {
      console.log("Creating category:", category);
      const response = await this.client.post<Category>(
        "/categories",
        category
      );
      console.log("Category created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(
    id: number,
    category: CategoryUpdate
  ): Promise<Category> {
    try {
      console.log(`Updating category ${id}:`, category);
      const response = await this.client.put<Category>(
        `/categories/${id}`,
        category
      );
      console.log("Category updated:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      console.log(`Deleting category ${id}`);
      await this.client.delete(`/categories/${id}`);
      console.log(`Category ${id} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  // Method to test all endpoints
  async testConnection(): Promise<{
    health: boolean;
    categories: boolean;
    todos: boolean;
  }> {
    const results = {
      health: false,
      categories: false,
      todos: false,
    };

    try {
      await this.healthCheck();
      results.health = true;
    } catch (error) {
      console.error("Health check failed:", error);
    }

    try {
      await this.getCategories();
      results.categories = true;
    } catch (error) {
      console.error("Categories endpoint failed:", error);
    }

    try {
      await this.getTodos(1, 5);
      results.todos = true;
    } catch (error) {
      console.error("Todos endpoint failed:", error);
    }

    console.log("Connection test results:", results);
    return results;
  }
}

// Export singleton instance
export const apiService = new ApiService();

export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  apiPrefix: "/api",
};

export default apiService;
