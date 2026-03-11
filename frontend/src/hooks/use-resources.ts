import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ResourceWithRelations {
  id: number;
  title: string;
  slug: string;
  description: string;
  type: string;
  author: string | null;
  publicationYear: number | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  fileId: number | null;
  categoryId: number | null;
  careerId: number | null;
  uploadedBy: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  careerName: string | null;
  careerCode: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  uploaderUsername: string | null;
  uploaderFirstName: string | null;
}

export interface ResourcesResponse {
  resources: ResourceWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export function useResources(filters?: {
  type?: string;
  categoryId?: number;
  careerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.type && filters.type !== "all") params.append("type", filters.type);
  if (filters?.categoryId) params.append("categoryId", String(filters.categoryId));
  if (filters?.careerId) params.append("careerId", String(filters.careerId));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString();
  const url = `/api/resources${queryString ? `?${queryString}` : ""}`;

  return useQuery<ResourcesResponse>({
    queryKey: ["resources", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
  });
}

export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  color: string | null;
  sortOrder: number;
  resourceCount: number;
}

export function useCategoriesWithCounts() {
  return useQuery<CategoryWithCount[]>({
    queryKey: ["categories-with-counts"],
    queryFn: async () => {
      const res = await fetch("/api/categories/with-counts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });
}

export interface CareerWithCount {
  id: number;
  name: string;
  code: string;
  description: string | null;
  resourceCount: number;
}

export function useCareersWithCounts() {
  return useQuery<CareerWithCount[]>({
    queryKey: ["careers-with-counts"],
    queryFn: async () => {
      const res = await fetch("/api/careers/with-counts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch careers");
      return res.json();
    },
  });
}

export interface ResourceTypeCount {
  type: string;
  count: number;
}

export function useResourceTypeCounts() {
  return useQuery<ResourceTypeCount[]>({
    queryKey: ["resource-type-counts"],
    queryFn: async () => {
      const res = await fetch("/api/resource-types/with-counts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch type counts");
      return res.json();
    },
  });
}

// User stats interface
export interface UserStats {
  stats: {
    totalResources: number;
    totalViews: number;
    totalDownloads: number;
    totalFavorites: number;
  };
  recentResources: {
    id: number;
    title: string;
    slug: string;
    type: string;
    viewCount: number;
    downloadCount: number;
    createdAt: string;
  }[];
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return res.json();
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/resources", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create resource");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-counts"] });
      queryClient.invalidateQueries({ queryKey: ["careers-with-counts"] });
      queryClient.invalidateQueries({ queryKey: ["resource-type-counts"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });
}
