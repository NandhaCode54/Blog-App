import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "../adminServices";

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
  return {
    title: data?.["blog.title"] ?? "BlogHub",
    description: data?.["blog.description"] ?? "",
    logoUrl: data?.["blog.logo_url"] ?? "",
    registrationOpen: data?.["registration.open"] !== "false",
    commentsEnabled: data?.["comments.enabled"] !== "false",
    postsPerPage: Number(data?.["posts.per_page"] ?? 9),
  };
}
