import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { createNewsComment } from "@/server/directus-service";
import { buildError, formatZodError } from "@/types/api";

const BodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Commentaire requis")
    .max(5000, "Commentaire trop long"),
});

function sanitizeHtml(html: string) {
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ");
  return stripped.replace(/\s+/g, " ").trim();
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } },
) {
  const routeParams = await Promise.resolve(ctx.params);
  const newsId = Number(routeParams?.id ?? 0);
  if (!Number.isFinite(newsId) || newsId <= 0) {
    return NextResponse.json(buildError("Identifiant article invalide", { code: "INVALID_ID" }), {
      status: 400,
    });
  }

  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user;
  if (!user?.nick) {
    return NextResponse.json(buildError("Authentification requise", { code: "UNAUTHORIZED" }), {
      status: 401,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(buildError("Requete invalide", { code: "INVALID_JSON" }), {
      status: 400,
    });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      buildError("Corps invalide", { code: "INVALID_BODY", fields: formatZodError(parsed.error).fieldErrors }),
      { status: 400 },
    );
  }

  const htmlContent = parsed.data.content;
  const plain = sanitizeHtml(htmlContent);
  if (!plain) {
    return NextResponse.json(buildError("Commentaire vide", { code: "EMPTY_COMMENT" }), {
      status: 400 },
    );
  }

  try {
    const created = await createNewsComment({
      newsId,
      author: String(user.nick || user.email || "Anonyme"),
      content: htmlContent,
    });
    return NextResponse.json({ ok: true, data: created });
  } catch (error: any) {
    return NextResponse.json(buildError("Echec de publication", { code: "CREATE_FAILED" }), {
      status: 500 },
    );
  }
}
