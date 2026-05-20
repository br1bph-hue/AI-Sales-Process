import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skill } from "@/lib/skills";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const isAvailable = skill.status === "available";

  return (
    <div
      className={cn(
        "dsg-card p-5 flex flex-col h-full",
        !isAvailable && "bg-dsg-gray-50 opacity-80"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3
          className={cn(
            "text-base font-semibold tracking-tight",
            isAvailable ? "text-dsg-gray-900" : "text-dsg-gray-500"
          )}
        >
          {skill.title}
        </h3>
        {!isAvailable && (
          <span className="text-[10px] uppercase tracking-wider text-dsg-gray-500 border border-dsg-gray-300 rounded px-1.5 py-0.5">
            Coming Soon
          </span>
        )}
      </div>
      <p
        className={cn(
          "text-sm leading-relaxed flex-1 mb-4",
          isAvailable ? "text-dsg-gray-700" : "text-dsg-gray-500"
        )}
      >
        {skill.description}
      </p>
      <div className="flex items-center gap-1.5 text-xs text-dsg-gray-500 mb-4">
        <Clock className="h-3 w-3" />
        <span>{skill.averageTime}</span>
      </div>
      {isAvailable && skill.href ? (
        <Button asChild block size="default">
          <Link href={skill.href}>Open</Link>
        </Button>
      ) : (
        <Button variant="disabled" block disabled aria-disabled>
          Open
        </Button>
      )}
    </div>
  );
}
