import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge } from "@/components/StatusBadge";
import { vacationWeeks } from "@/lib/ferias-calendar";
import { formatDateBR } from "@/lib/dates";
import type { Colaborador, Ferias } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function VacationBar({ vacation, collaborator }: { vacation: Ferias; collaborator?: Colaborador }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function enter() { clearTimer(); setOpen(true); }
  function leave() {
    clearTimer();
    if (!pinned.current) timer.current = setTimeout(() => setOpen(false), 180);
  }
  const name = collaborator?.nome ?? "—";
  return (
    <Popover open={open} onOpenChange={(next) => { clearTimer(); pinned.current = next; setOpen(next); }}>
      <PopoverTrigger asChild>
        <Button
          variant="calendar"
          data-vinculo={collaborator?.vinculo}
          aria-label={`${name}: ${formatDateBR(vacation.inicio)} a ${formatDateBR(vacation.termino)}`}
          className="vacation-tone h-8 w-full min-w-0 justify-start rounded-md px-2.5 py-0 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          onMouseEnter={enter}
          onMouseLeave={leave}
          onClick={(event) => { event.preventDefault(); clearTimer(); pinned.current = true; setOpen(true); }}
        >
          <span className="block min-w-0 truncate">{name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start" sideOffset={6} className="w-80 max-w-[calc(100vw-2rem)] space-y-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={enter} onMouseLeave={leave}
        aria-label={`Férias de ${name}`}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground">{collaborator?.vinculo ?? "—"}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Detail label="Período" full>{formatDateBR(vacation.inicio)} — {formatDateBR(vacation.termino)}</Detail>
          <Detail label="Quantidade de dias">{vacation.dias ?? 0}</Detail>
          <Detail label="Status"><StatusBadge value={vacation.status} /></Detail>
          <Detail label="Nº do processo" full>{vacation.numeroProcesso || "—"}</Detail>
        </dl>
      </PopoverContent>
    </Popover>
  );
}

function Detail({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={cn("min-w-0 space-y-1", full && "col-span-2")}>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="break-words font-medium text-foreground">{children}</dd>
  </div>;
}

export function FeriasMonthGrid({ vacations, collaborators, year, month, today }: {
  vacations: Ferias[]; collaborators: Map<string, Colaborador>; year: number; month: number; today: Date;
}) {
  const weeks = useMemo(() => vacationWeeks(vacations, year, month), [vacations, year, month]);
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[700px]" aria-label="Calendário mensal de férias">
        <div className="grid grid-cols-7 border-b border-border bg-muted/60">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-foreground">{day}</div>
          ))}
        </div>
        {weeks.map((week, index) => (
          <div key={index} data-calendar-week className="relative isolate border-b border-border last:border-b-0">
            <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
              {Array.from({ length: 7 }, (_, column) => {
                const number = index * 7 + column - offset + 1;
                const inMonth = number >= 1 && number <= days;
                return <div key={column} className={cn("border-r border-border last:border-r-0", !inMonth ? "bg-calendar-outside" : column === 0 || column === 6 ? "bg-calendar-weekend" : "bg-calendar-weekday")} />;
              })}
            </div>
            <div className="relative grid h-11 grid-cols-7">
              {Array.from({ length: 7 }, (_, column) => {
                const number = index * 7 + column - offset + 1;
                const inMonth = number >= 1 && number <= days;
                const date = new Date(year, month, number);
                const isToday = inMonth && number === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return <div key={column} className="flex items-center px-2">
                  <time dateTime={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
                    aria-current={isToday ? "date" : undefined}
                    className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium tabular-nums", isToday ? "bg-primary text-primary-foreground shadow-sm" : inMonth ? "text-foreground" : "text-muted-foreground/50")}>
                    {date.getDate()}
                  </time>
                </div>;
              })}
            </div>
            <div className="relative grid min-h-6 grid-cols-7 auto-rows-[32px] gap-y-1.5 pb-3">
              {week.segments.map(({ vacation, startColumn, endColumn, lane }) => (
                <div key={vacation.id} className="min-w-0 px-1" style={{ gridColumn: `${startColumn + 1} / ${endColumn + 2}`, gridRow: lane + 1 }}>
                  <VacationBar vacation={vacation} collaborator={collaborators.get(vacation.colaboradorId)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}