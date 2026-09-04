import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveArticleBySlug, serializeArticle } from "@/lib/articles";
import { getSessionRole, hasAnyScope } from "@/lib/role-access";
import ArticleView from "./article-view";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  await connectToDatabase();

  const article = await resolveArticleBySlug(resolvedParams.slug);
  if (!article) notFound();

  // Drafts are only visible to editors/admins — everyone else gets a plain 404
  if (article.status === "draft") {
    const session = await getServerSession(authOptions);
    const role = await getSessionRole(session);
    // Drafts are only visible to users with article access — everyone else gets a plain 404
    if (!hasAnyScope(role, ["manage-articles", "add-article"])) notFound();
  }

  return <ArticleView article={serializeArticle(article)} />;
}
