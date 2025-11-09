import { getBoardDetailAction } from "@/features/board/application/actions/getBoardDetailAction";
import { BoardDetailView } from "@/features/board/ui/components/BoardDetailView";
import { notFound } from "next/navigation";

interface BoardDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardDetailPage({
  params,
}: BoardDetailPageProps) {
  const { id } = await params;
  const data = await getBoardDetailAction(id);

  if (!data) {
    notFound();
  }

  return <BoardDetailView data={data} />;
}
