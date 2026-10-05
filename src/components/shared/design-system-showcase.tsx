"use client";

import { useState } from "react";
import { Activity, ArrowRight, ClipboardList, Database, Plus, ShieldCheck, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, EmptyStateAction } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState, PageSkeleton } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { RoleBadge } from "@/components/shared/role-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto grid max-w-[1360px] gap-8">
        <PageHeader
          breadcrumb="Desarrollo / Design System"
          description="Catálogo temporal de patrones visuales para validar la base del sistema antes de implementar módulos funcionales."
          title="Design System FCQI"
          actions={<Badge tone="warning"><TriangleAlert aria-hidden="true" size={14} />Solo desarrollo</Badge>}
        />

        <Tabs defaultValue="foundations">
          <TabsList aria-label="Secciones del design system">
            <TabsTrigger value="foundations">Fundamentos</TabsTrigger>
            <TabsTrigger value="components">Componentes</TabsTrigger>
            <TabsTrigger value="states">Estados</TabsTrigger>
          </TabsList>

          <TabsContent value="foundations">
            <div className="grid gap-8">
              <section className="grid gap-4" aria-labelledby="colors-heading">
                <div><h2 className="text-xl font-semibold" id="colors-heading">Tokens de color</h2><p className="text-sm text-muted-foreground">La interfaz consume nombres semánticos; los valores institucionales viven en el tema global.</p></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TokenSwatch className="bg-primary" label="Primary · UABC Green" textClassName="text-primary-foreground" />
                  <TokenSwatch className="bg-accent" label="Accent · Ochre" textClassName="text-accent-foreground" />
                  <TokenSwatch className="bg-info" label="Info · Reflex Blue" textClassName="text-white" />
                  <TokenSwatch className="bg-surface border" label="Surface · White" textClassName="text-foreground" />
                  <TokenSwatch className="bg-success" label="Success" textClassName="text-success-foreground" />
                  <TokenSwatch className="bg-warning" label="Warning" textClassName="text-warning-foreground" />
                  <TokenSwatch className="bg-danger" label="Danger" textClassName="text-white" />
                  <TokenSwatch className="bg-muted" label="Muted" textClassName="text-muted-foreground" />
                </div>
              </section>

              <section className="grid gap-4" aria-labelledby="type-heading">
                <div><h2 className="text-xl font-semibold" id="type-heading">Tipografía y ritmo</h2><p className="text-sm text-muted-foreground">Inter del sistema como fallback libre; Proxima Nova podrá resolverse si está disponible en el entorno.</p></div>
                <Card><CardContent className="grid gap-5 p-6"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Display / 36</p><p className="text-4xl font-semibold tracking-tight">Soporte que fluye</p></div><Separator /><div className="grid gap-3 sm:grid-cols-3"><TypeSample label="H1 / 30" className="text-3xl font-semibold" text="Sistema de soporte" /><TypeSample label="H2 / 24" className="text-2xl font-semibold" text="Actividad reciente" /><TypeSample label="Body / 16" className="text-base" text="Información clara y accionable." /></div></CardContent></Card>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="components">
            <div className="grid gap-8">
              <section className="grid gap-4" aria-labelledby="actions-heading"><div><h2 className="text-xl font-semibold" id="actions-heading">Acciones</h2><p className="text-sm text-muted-foreground">Controles de 44px con estados de foco, hover y disabled.</p></div><Card><CardContent className="flex flex-wrap gap-3 p-6"><Button><Plus aria-hidden="true" size={18} />Acción primaria</Button><Button variant="secondary">Secundaria</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Destructiva</Button><Button aria-label="Abrir acciones" size="icon" variant="outline"><ArrowRight aria-hidden="true" size={18} /></Button><Button disabled>Deshabilitado</Button></CardContent></Card></section>

              <section className="grid gap-4" aria-labelledby="form-heading"><div><h2 className="text-xl font-semibold" id="form-heading">Controles de formulario</h2><p className="text-sm text-muted-foreground">Labels visibles, ayuda contextual y errores que no dependen únicamente del color.</p></div><Card><CardContent className="grid gap-6 p-6 md:grid-cols-2"><div className="grid gap-2"><Label htmlFor="showcase-name">Nombre del control</Label><Input id="showcase-name" placeholder="Escribe un valor" /><p className="text-xs text-muted-foreground">Texto de ayuda opcional.</p></div><div className="grid gap-2"><Label htmlFor="showcase-select">Categoría</Label><Select defaultValue=""><option disabled value="">Selecciona una opción</option><option value="general">General</option><option value="technical">Técnica</option></Select></div><div className="grid gap-2"><Label htmlFor="showcase-description">Descripción</Label><Textarea id="showcase-description" placeholder="Cuéntanos más detalles" /></div><div className="grid content-start gap-4"><div className="grid gap-2"><Label htmlFor="showcase-invalid">Campo con error</Label><Input aria-describedby="showcase-error" aria-invalid="true" defaultValue="Valor no válido" id="showcase-invalid" /><p className="text-xs text-danger-foreground" id="showcase-error">El valor requiere revisión.</p></div><label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked />Acepto la condición de muestra</label><RadioGroup aria-label="Prioridad de ejemplo" className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm"><RadioGroupItem defaultChecked name="priority" value="low" />Baja</label><label className="flex items-center gap-2 text-sm"><RadioGroupItem name="priority" value="high" />Alta</label></RadioGroup></div></CardContent></Card></section>

              <section className="grid gap-4" aria-labelledby="badges-heading"><div><h2 className="text-xl font-semibold" id="badges-heading">Badges y roles</h2><p className="text-sm text-muted-foreground">Cada estado muestra texto e iconografía además de color.</p></div><Card><CardContent className="flex flex-wrap gap-3 p-6"><StatusBadge status="OPEN" /><StatusBadge status="IN_REVIEW" /><StatusBadge status="IN_PROGRESS" /><StatusBadge status="COMPLETED" /><StatusBadge status="CANCELLED" /><PriorityBadge priority="LOW" /><PriorityBadge priority="MEDIUM" /><PriorityBadge priority="HIGH" /><RoleBadge role="ADMIN" /></CardContent></Card></section>

              <section className="grid gap-4" aria-labelledby="metrics-heading"><div><h2 className="text-xl font-semibold" id="metrics-heading">Cards y métricas</h2><p className="text-sm text-muted-foreground">Superficies sobrias, borde sutil y sombra mínima.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard description="respecto al periodo anterior" icon={ClipboardList} title="Solicitudes" trend="+12%" value="128" /><MetricCard description="requieren seguimiento" icon={Activity} title="En proceso" value="24" /><MetricCard description="inventario actualizado" icon={Database} title="Activos" value="486" /><MetricCard description="equipo con permisos" icon={ShieldCheck} title="Soporte" value="18" /></div></section>

              <section className="grid gap-4" aria-labelledby="table-heading"><div><h2 className="text-xl font-semibold" id="table-heading">Tabla base</h2><p className="text-sm text-muted-foreground">Ejemplo visual temporal; no representa datos del backend.</p></div><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Referencia</TableHead><TableHead>Estado</TableHead><TableHead>Prioridad</TableHead><TableHead className="hidden md:table-cell">Área</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">Ejemplo 001</TableCell><TableCell><StatusBadge status="OPEN" /></TableCell><TableCell><PriorityBadge priority="HIGH" /></TableCell><TableCell className="hidden text-muted-foreground md:table-cell">Hardware</TableCell></TableRow><TableRow><TableCell className="font-medium">Ejemplo 002</TableCell><TableCell><StatusBadge status="COMPLETED" /></TableCell><TableCell><PriorityBadge priority="LOW" /></TableCell><TableCell className="hidden text-muted-foreground md:table-cell">Software</TableCell></TableRow></TableBody></Table></CardContent></Card></section>

              <section className="grid gap-4" aria-labelledby="dialog-heading"><div><h2 className="text-xl font-semibold" id="dialog-heading">Dialogs y confirmaciones</h2><p className="text-sm text-muted-foreground">Acciones de muestra con foco y confirmación explícita.</p></div><Card><CardContent className="flex flex-wrap gap-3 p-6"><Button onClick={() => setDialogOpen(true)} variant="outline">Abrir dialog</Button><Button onClick={() => setConfirmOpen(true)} variant="danger">Probar confirmación</Button></CardContent></Card></section>
            </div>
          </TabsContent>

          <TabsContent value="states">
            <div className="grid gap-8"><section className="grid gap-4" aria-labelledby="loading-heading"><div><h2 className="text-xl font-semibold" id="loading-heading">Loading</h2><p className="text-sm text-muted-foreground">Skeletons para conservar la estructura percibida.</p></div><Card><CardContent className="p-6"><LoadingState /></CardContent></Card><PageSkeleton /></section><section className="grid gap-4" aria-labelledby="feedback-heading"><div><h2 className="text-xl font-semibold" id="feedback-heading">Empty y error</h2><p className="text-sm text-muted-foreground">Mensajes accionables y respetuosos con el contexto.</p></div><div className="grid gap-4 lg:grid-cols-2"><EmptyState action={<EmptyStateAction><Plus aria-hidden="true" size={16} />Crear ejemplo</EmptyStateAction>} description="Cuando exista información, aparecerá aquí para continuar el trabajo." title="No hay elementos todavía" /><ErrorState message="Ocurrió un problema al cargar la vista de ejemplo." onRetry={() => undefined} requestId="demo-0001" /></div></section></div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent onOpenChange={setDialogOpen} open={dialogOpen}><DialogHeader><DialogTitle>Dialog de ejemplo</DialogTitle><DialogDescription>Patrón de diálogo preparado para contenido futuro.</DialogDescription></DialogHeader><div className="px-6 pb-6 text-sm text-muted-foreground">El contenido real se implementará junto con los flujos de negocio correspondientes.</div><DialogFooter><Button onClick={() => setDialogOpen(false)} variant="outline">Cerrar</Button></DialogFooter></DialogContent>
      </Dialog>
      <ConfirmDialog description="Esta acción es únicamente demostrativa y no modificará información." onConfirm={() => setConfirmOpen(false)} onOpenChange={setConfirmOpen} open={confirmOpen} />
    </AppShell>
  );
}

function TokenSwatch({ className, label, textClassName }: { className: string; label: string; textClassName: string }) {
  return <div className={`grid min-h-24 content-end rounded-xl p-4 ${className}`}><span className={`text-sm font-medium ${textClassName}`}>{label}</span></div>;
}

function TypeSample({ label, className, text }: { label: string; className: string; text: string }) {
  return <div className="grid gap-1"><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span><span className={className}>{text}</span></div>;
}
