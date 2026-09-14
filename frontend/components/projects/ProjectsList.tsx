"use client";

import { Button } from "@/components/ui/button";

import { ProjectCollection } from "@/components/projects/ProjectCollection";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { FolderOpen } from "lucide-react";
import { useState } from "react";

export function ProjectsList() {
    const [open, setOpen] = useState(false);
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="icon" aria-label="Open your projects">
                    <FolderOpen size={18} />
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-card text-foreground border-border overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Your projects</SheetTitle>
                    <SheetDescription>Pick up where you left off.</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                    {open && <ProjectCollection compact onOpen={() => setOpen(false)} />}
                </div>
            </SheetContent>
        </Sheet>
    );
}
