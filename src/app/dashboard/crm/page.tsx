"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Button } from "@/components/ui";
import { Plus, User, Mail, Phone, Loader2 } from "lucide-react";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  value: number | null;
};

const COLUMNS = [
  { key: "new", label: "New", color: "text-accent" },
  { key: "contacted", label: "Contacted", color: "text-yellow-400" },
  { key: "won", label: "Won", color: "text-emerald-400" },
  { key: "lost", label: "Lost", color: "text-red-400" },
];

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border border-borderc bg-elev p-3 active:cursor-grabbing ${
        isDragging ? "opacity-70 shadow-xl" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <User className="h-3.5 w-3.5 text-muted" /> {lead.name || "Unnamed lead"}
      </div>
      {lead.email && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <Mail className="h-3 w-3" /> {lead.email}
        </div>
      )}
      {lead.phone && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <Phone className="h-3 w-3" /> {lead.phone}
        </div>
      )}
    </div>
  );
}

function Column({ col, leads }: { col: (typeof COLUMNS)[number]; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] w-full flex-col rounded-2xl border bg-card p-3 transition ${
        isOver ? "border-brand" : "border-borderc"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    const res = await fetch("/api/leads");
    const json = await res.json();
    setLeads(json.leads || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function onDragEnd(e: DragEndEvent) {
    const leadId = e.active.id as string;
    const newStatus = e.over?.id as string | undefined;
    if (!newStatus) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, status: newStatus }),
    });
  }

  async function addLead() {
    if (!form.name && !form.email) return;
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.lead) setLeads((prev) => [json.lead, ...prev]);
    setForm({ name: "", email: "", phone: "" });
    setAdding(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="mt-1 text-sm text-muted">Drag leads between stages to track your pipeline.</p>
        </div>
        <Button onClick={() => setAdding(!adding)}>
          <Plus className="h-4 w-4" /> Add lead
        </Button>
      </div>

      {adding && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-borderc bg-card p-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-borderc bg-elev px-3 py-2 text-sm outline-none focus:border-brand" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border border-borderc bg-elev px-3 py-2 text-sm outline-none focus:border-brand" />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border border-borderc bg-elev px-3 py-2 text-sm outline-none focus:border-brand" />
          <Button onClick={addLead}>Save</Button>
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} leads={leads.filter((l) => l.status === col.key)} />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
