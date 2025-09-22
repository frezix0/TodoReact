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
  axiosInstance: any;

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

    // IMPROVED: Better response interceptor with more detailed error handling
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
            case 405:
              apiError.message =
                "Method Not Allowed - The API endpoint might not be configured properly";
              apiError.error_code = "METHOD_NOT_ALLOWED";
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

  // ADD: Health check method to test backend connectivity
  async healthCheck(): Promise<{ status: string; version: string }> {
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
      if (filters.search) queryParams.search = filters.search;
      if (filters.category_id !== undefined)
        queryParams.category_id = filters.category_id.toString();
      if (filters.completed !== undefined)
        queryParams.completed = filters.completed.toString();
      if (filters.priority) queryParams.priority = filters.priority;
      if (filters.sort_by) queryParams.sort_by = filters.sort_by;
      if (filters.sort_order) queryParams.sort_order = filters.sort_order;

      // Create URLSearchParams from clean object
      const params = new URLSearchParams(queryParams);

      // Debug logging
      console.log("Request URL:", `/todos?${params.toString()}`);

      const response = await this.axiosInstance.get(
        `/todos?${params.toString()}`
      );
      console.log("Response data:", response.data);

      // Validate response structure
      if (!response.data || !response.data.data || !response.data.pagination) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }
  }

  async getTodo(id: number): Promise<Todo> {
    const response = await this.client.get<Todo>(`/todos/${id}`);
    return response.data;
  }

  async createTodo(todo: TodoCreate): Promise<Todo> {
    const response = await this.client.post<Todo>("/todos", todo);
    return response.data;
  }

  async updateTodo(id: number, todo: TodoUpdate): Promise<Todo> {
    const response = await this.client.put<Todo>(`/todos/${id}`, todo);
    return response.data;
  }

  async deleteTodo(id: number): Promise<void> {
    await this.client.delete(`/todos/${id}`);
  }

  async toggleTodoComplete(id: number, completed: boolean): Promise<Todo> {
    const response = await this.client.patch<Todo>(`/todos/${id}/complete`, {
      completed,
    });
    return response.data;
  }

  async getTodoSummary(): Promise<TodoSummary> {
    const response = await this.client.get<TodoSummary>("/todos/summary");
    return response.data;
  }

  // Category API methods
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<Category[]>("/categories");
    return response.data;
  }

  async getCategoriesWithCount(): Promise<CategoryWithTodoCount[]> {
    const response = await this.client.get<CategoryWithTodoCount[]>(
      "/categories/with-counts"
    );
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await this.client.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(category: CategoryCreate): Promise<Category> {
    const response = await this.client.post<Category>("/categories", category);
    return response.data;
  }

  async updateCategory(
    id: number,
    category: CategoryUpdate
  ): Promise<Category> {
    const response = await this.client.put<Category>(
      `/categories/${id}`,
      category
    );
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.client.delete(`/categories/${id}`);
  }

  // ADD: Method to test all endpoints
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
      console.error("Health check failed");
    }

    try {
      await this.getCategories();
      results.categories = true;
    } catch (error) {
      console.error("Categories endpoint failed");
    }

    try {
      await this.getTodos(1, 5);
      results.todos = true;
    } catch (error) {
      console.error("Todos endpoint failed");
    }

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
