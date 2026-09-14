"use client";

import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { useParams } from "next/navigation";
export default function Page() {
    const { id } = useParams<{ id: string }>();
    return <ChatWorkspace key={id} chatId={id} />;
}
