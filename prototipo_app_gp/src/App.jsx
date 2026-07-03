import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Plus, ChevronLeft, ChevronRight, LayoutGrid, Receipt, Tags, X,
  Trash2, Pencil, Repeat, CreditCard, Check, ArrowUpRight, ArrowDownRight,
  AlertTriangle
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */
const INK = "#1B2B22";
const PAPER = "#F6F3EC";
const SURFACE = "#FFFFFF";
const LINE = "#E4DFD1";
const GREEN = "#2F6F4E";
const RED = "#B5533C";
const AMBER = "#C9A227";
const MUTED = "#7C7A6E";

const CATEGORY_PALETTE = ["#C1622E", "#4A6670", "#9C6B9E", "#7A8B4F", "#C9A227", "#5B7B9A", "#8C8C7A"];

const uid = () => Math.random().toString(36).slice(2, 10);

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const fmtBRL = (n) => (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDateShort = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
};
const monthKey = (iso) => iso.slice(0, 7);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addMonths = (isoYYYYMM, delta) => {
  const [y, m] = isoYYYYMM.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const shiftDateByMonths = (iso, delta) => {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + delta);
  // handle month-length overflow (e.g. 31 -> Feb)
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */
const seedCategories = () => ([
  { id: "cat-salario", name: "Salário", color: GREEN, kind: "receita" },
  { id: "cat-alimentacao", name: "Alimentação", color: CATEGORY_PALETTE[0], kind: "despesa" },
  { id: "cat-moradia", name: "Moradia", color: CATEGORY_PALETTE[1], kind: "despesa" },
  { id: "cat-lazer", name: "Lazer", color: CATEGORY_PALETTE[2], kind: "despesa" },
  { id: "cat-transporte", name: "Transporte", color: CATEGORY_PALETTE[3], kind: "despesa" },
  { id: "cat-saude", name: "Saúde", color: CATEGORY_PALETTE[4], kind: "despesa" },
  { id: "cat-assinaturas", name: "Assinaturas", color: CATEGORY_PALETTE[5], kind: "despesa" },
  { id: "cat-outros", name: "Outros", color: CATEGORY_PALETTE[6], kind: "despesa" },
]);

function seedTransactions() {
  const t0 = new Date();
  const ym = (delta) => addMonths(`${t0.getFullYear()}-${String(t0.getMonth() + 1).padStart(2, "0")}`, delta);
  const dateIn = (delta, day) => `${ym(delta)}-${String(day).padStart(2, "0")}`;

  const list = [
    { id: uid(), type: "receita", amount: 6200, date: dateIn(0, 5), description: "Salário", status: "recebido", categoryId: "cat-salario" },
    { id: uid(), type: "receita", amount: 6200, date: dateIn(-1, 5), description: "Salário", status: "recebido", categoryId: "cat-salario" },
    { id: uid(), type: "despesa", amount: 1450, date: dateIn(0, 8), description: "Aluguel", status: "pago", categoryId: "cat-moradia" },
    { id: uid(), type: "despesa", amount: 1450, date: dateIn(-1, 8), description: "Aluguel", status: "pago", categoryId: "cat-moradia" },
    { id: uid(), type: "despesa", amount: 89.9, date: dateIn(0, 10), description: "Internet", status: "pago", categoryId: "cat-moradia" },
    { id: uid(), type: "despesa", amount: 640, date: dateIn(0, 14), description: "Supermercado", status: "pago", categoryId: "cat-alimentacao" },
    { id: uid(), type: "despesa", amount: 210, date: dateIn(0, 22), description: "Restaurantes", status: "pendente", categoryId: "cat-alimentacao" },
    { id: uid(), type: "despesa", amount: 39.9, date: dateIn(0, 3), description: "Streaming de filmes", status: "pago", categoryId: "cat-assinaturas" },
    { id: uid(), type: "despesa", amount: 19.9, date: dateIn(0, 3), description: "Streaming de música", status: "pago", categoryId: "cat-assinaturas" },
    { id: uid(), type: "despesa", amount: 180, date: dateIn(0, 16), description: "Cinema e saídas", status: "pendente", categoryId: "cat-lazer" },
    { id: uid(), type: "despesa", amount: 260, date: dateIn(0, 9), description: "Combustível", status: "pago", categoryId: "cat-transporte" },
    { id: uid(), type: "despesa", amount: 150, date: dateIn(0, 20), description: "Farmácia", status: "pendente", categoryId: "cat-saude" },
  ];

  // Compra parcelada de exemplo: Notebook em 6x
  const groupId = uid();
  const total = 3600;
  const n = 6;
  const parcela = +(total / n).toFixed(2);
  for (let i = 0; i < n; i++) {
    list.push({
      id: uid(),
      type: "despesa",
      amount: parcela,
      date: dateIn(-2 + i, 18),
      description: "Notebook novo",
      status: i < 2 ? "pago" : "pendente",
      categoryId: "cat-outros",
      installment: { groupId, index: i + 1, total: n },
    });
  }

  return list;
}

/* ------------------------------------------------------------------ */
/* Small UI primitives                                                 */
/* ------------------------------------------------------------------ */
function StatusPill({ status }) {
  const isDone = status === "pago" || status === "recebido";
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10.5,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        padding: "3px 7px",
        borderRadius: 4,
        color: isDone ? GREEN : AMBER,
        background: isDone ? "rgba(47,111,78,0.1)" : "rgba(201,162,39,0.14)",
        border: `1px solid ${isDone ? "rgba(47,111,78,0.35)" : "rgba(201,162,39,0.4)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function IconButton({ onClick, children, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, borderRadius: 8, border: `1px solid ${LINE}`,
        background: SURFACE, cursor: "pointer", color: INK,
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */
function Dashboard({ transactions, categories, month, setMonth, onEdit }) {
  const [viewMode, setViewMode] = useState("mes"); // "mes" | "total"
  const [selectedCat, setSelectedCat] = useState(null);
  const monthTx = transactions.filter((t) => monthKey(t.date) === month);

  const receitasMes = monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesasMes = monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);

  // Saldo total acumulado (desde sempre, só o que já foi pago/recebido)
  const saldoTotalAtual = transactions
    .filter((t) => (t.status === "pago" || t.status === "recebido") && t.date <= todayISO())
    .reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);
  const saldoTotalProjetado = transactions
    .filter((t) => monthKey(t.date) <= month)
    .reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);

  // Saldo somente do mês selecionado
  const saldoMesAtual = monthTx
    .filter((t) => t.status === "pago" || t.status === "recebido")
    .reduce((s, t) => s + (t.type === "receita" ? t.amount : -t.amount), 0);
  const saldoMesProjetado = receitasMes - despesasMes;

  const saldoAtual = viewMode === "mes" ? saldoMesAtual : saldoTotalAtual;
  const saldoProjetado = viewMode === "mes" ? saldoMesProjetado : saldoTotalProjetado;

  const byCategory = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([catId, value]) => ({
        catId, value,
        name: categories.find((c) => c.id === catId)?.name || "Outros",
        color: categories.find((c) => c.id === catId)?.color || MUTED,
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx, categories]);

  const [y, m] = month.split("-").map(Number);
  const label = `${MONTH_NAMES[m - 1]} de ${y}`;

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Ledger header */}
      <div style={{
        background: SURFACE, margin: "14px 16px 0", borderRadius: 14,
        border: `1px solid ${LINE}`, padding: "18px 18px 14px",
        backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 27px, #EFEAD ..0)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <IconButton onClick={() => setMonth(addMonths(month, -1))} label="Mês anterior"><ChevronLeft size={18} /></IconButton>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>
            {label}
          </span>
          <IconButton onClick={() => setMonth(addMonths(month, 1))} label="Próximo mês"><ChevronRight size={18} /></IconButton>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 4 }}>
          {[{ id: "mes", label: "Somente este mês" }, { id: "total", label: "Saldo total (todos os meses)" }].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setViewMode(opt.id)}
              style={{
                padding: "5px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                border: `1px solid ${viewMode === opt.id ? GREEN : LINE}`,
                background: viewMode === opt.id ? "rgba(47,111,78,0.1)" : "transparent",
                color: viewMode === opt.id ? GREEN : MUTED,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
          <div style={{ fontSize: 12, color: MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
            {viewMode === "mes" ? "Saldo do mês" : "Saldo total"}
          </div>
          <div style={{
            fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 600,
            color: saldoAtual >= 0 ? INK : RED, lineHeight: 1,
          }}>
            {fmtBRL(saldoAtual)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px dashed ${LINE}`, paddingTop: 12, gap: 8 }}>
          <div>
            <div style={{ fontSize: 10.5, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Receitas</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14.5, color: GREEN, marginTop: 2 }}>
              {fmtBRL(receitasMes)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Despesas</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14.5, color: RED, marginTop: 2 }}>
              {fmtBRL(despesasMes)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {viewMode === "mes" ? "Saldo do mês" : "Saldo projetado"}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14.5, color: INK, marginTop: 2 }}>
              {fmtBRL(saldoProjetado)}
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ margin: "14px 16px 0", background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, marginBottom: 12, color: INK }}>
          Gastos por categoria
        </div>

        {byCategory.length === 0 ? (
          <div style={{ color: MUTED, fontSize: 13.5, padding: "18px 0", textAlign: "center" }}>
            Nenhuma despesa lançada neste mês ainda.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 128, height: 128, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                      {byCategory.map((c) => <Cell key={c.catId} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtBRL(v)} contentStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total do mês</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: INK }}>{fmtBRL(despesasMes)}</div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {byCategory.map((c) => {
                const pct = despesasMes ? (c.value / despesasMes) * 100 : 0;
                return (
                  <button
                    key={c.catId}
                    onClick={() => setSelectedCat(c)}
                    style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: INK }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                        {c.name}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: MUTED }}>
                        {fmtBRL(c.value)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: PAPER, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: MUTED, marginTop: 12 }}>
              Toque em uma categoria para ver os lançamentos do mês
            </div>
          </>
        )}
      </div>

      {selectedCat && (
        <CategoryDetailModal
          category={selectedCat}
          transactions={monthTx.filter((t) => t.categoryId === selectedCat.catId)}
          monthLabel={label}
          onClose={() => setSelectedCat(null)}
          onEdit={(t) => { setSelectedCat(null); onEdit && onEdit(t); }}
        />
      )}
    </div>
  );
}

function CategoryDetailModal({ category, transactions, monthLabel, onClose, onEdit }) {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(27,43,34,0.4)", display: "flex",
      alignItems: "flex-end", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PAPER, width: "100%", maxWidth: 480, borderTopLeftRadius: 18, borderTopRightRadius: 18,
          maxHeight: "82vh", overflowY: "auto", padding: "16px 18px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: category.color }} />
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: INK }}>{category.name}</span>
            </div>
            <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{monthLabel}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total no mês</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: INK }}>{fmtBRL(total)}</span>
        </div>

        <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {sorted.length === 0 && (
            <div style={{ padding: "18px 12px", textAlign: "center", color: MUTED, fontSize: 12.5 }}>
              Nenhum lançamento nesta categoria no mês.
            </div>
          )}
          {sorted.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => onEdit(t)}
              style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px", background: "transparent", border: "none", cursor: "pointer",
                borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.description}
                </div>
                <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{fmtDateShort(t.date)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: RED }}>
                  {fmtBRL(t.amount)}
                </div>
                <div style={{ marginTop: 3 }}><StatusPill status={t.status} /></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transações                                                          */
/* ------------------------------------------------------------------ */
function Transacoes({ transactions, categories, month, setMonth, onEdit, onDelete }) {
  const [statusFilter, setStatusFilter] = useState("todos"); // todos | concluido | pendente
  const [typeFilter, setTypeFilter] = useState("todos"); // todos | receita | despesa

  const monthTxAll = transactions.filter((t) => monthKey(t.date) === month).sort((a, b) => a.date < b.date ? 1 : -1);
  const monthTx = monthTxAll.filter((t) => {
    const statusOk =
      statusFilter === "todos" ||
      (statusFilter === "concluido" && (t.status === "pago" || t.status === "recebido")) ||
      (statusFilter === "pendente" && t.status === "pendente");
    const typeOk = typeFilter === "todos" || t.type === typeFilter;
    return statusOk && typeOk;
  });
  const [y, m] = month.split("-").map(Number);
  const label = `${MONTH_NAMES[m - 1]} de ${y}`;

  const byDay = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => { (map[t.date] = map[t.date] || []).push(t); });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [monthTx]);

  const catOf = (id) => categories.find((c) => c.id === id);

  const FilterPill = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap",
        border: `1px solid ${active ? INK : LINE}`,
        background: active ? INK : SURFACE,
        color: active ? PAPER : MUTED,
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ paddingBottom: 96 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
      }}>
        <IconButton onClick={() => setMonth(addMonths(month, -1))} label="Mês anterior"><ChevronLeft size={18} /></IconButton>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: INK }}>{label}</span>
        <IconButton onClick={() => setMonth(addMonths(month, 1))} label="Próximo mês"><ChevronRight size={18} /></IconButton>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "0 16px 6px", flexWrap: "wrap" }}>
        <FilterPill active={statusFilter === "todos"} onClick={() => setStatusFilter("todos")}>Todos</FilterPill>
        <FilterPill active={statusFilter === "concluido"} onClick={() => setStatusFilter("concluido")}>Pago / recebido</FilterPill>
        <FilterPill active={statusFilter === "pendente"} onClick={() => setStatusFilter("pendente")}>Pendente</FilterPill>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px", flexWrap: "wrap" }}>
        <FilterPill active={typeFilter === "todos"} onClick={() => setTypeFilter("todos")}>Receitas e despesas</FilterPill>
        <FilterPill active={typeFilter === "receita"} onClick={() => setTypeFilter("receita")}>Só receitas</FilterPill>
        <FilterPill active={typeFilter === "despesa"} onClick={() => setTypeFilter("despesa")}>Só despesas</FilterPill>
      </div>

      {monthTxAll.length === 0 && (
        <div style={{ textAlign: "center", color: MUTED, fontSize: 13.5, padding: "40px 20px" }}>
          Nenhum lançamento neste mês. Toque em “+” para adicionar o primeiro.
        </div>
      )}
      {monthTxAll.length > 0 && monthTx.length === 0 && (
        <div style={{ textAlign: "center", color: MUTED, fontSize: 13.5, padding: "40px 20px" }}>
          Nenhum lançamento encontrado para esse filtro.
        </div>
      )}

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 18 }}>
        {byDay.map(([date, items]) => {
          const d = new Date(date + "T00:00:00");
          return (
            <div key={date}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: MUTED,
                textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6,
              }}>
                {fmtDateShort(date)} · {WEEKDAY_SHORT[d.getDay()]}
              </div>
              <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
                {items.map((t, idx) => {
                  const cat = catOf(t.categoryId);
                  return (
                    <button
                      key={t.id}
                      onClick={() => onEdit(t)}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                        padding: "11px 12px", background: "transparent", border: "none", cursor: "pointer",
                        borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", background: cat?.color || MUTED, flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, color: INK, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                          {t.installment && (
                            <span style={{ fontSize: 10.5, color: MUTED, fontFamily: "'IBM Plex Mono', monospace" }}>
                              {t.installment.index}/{t.installment.total}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{cat?.name || "Sem categoria"}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 14,
                          color: t.type === "receita" ? GREEN : RED,
                        }}>
                          {t.type === "receita" ? "+" : "−"} {fmtBRL(t.amount)}
                        </div>
                        <div style={{ marginTop: 3 }}><StatusPill status={t.status} /></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */
function Categorias({ categories, transactions, onAdd, onRename, onDeleteRequest }) {
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("despesa");

  const countFor = (id) => transactions.filter((t) => t.categoryId === id).length;

  return (
    <div style={{ padding: "14px 16px 96px" }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: INK, marginBottom: 4 }}>Categorias</div>
      <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 16 }}>
        Organize receitas e despesas do seu jeito. Excluir uma categoria com lançamentos exige realocação.
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", marginBottom: 18 }}>
        {categories.map((c, idx) => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
            borderTop: idx === 0 ? "none" : `1px solid ${LINE}`,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <input
              value={c.name}
              onChange={(e) => onRename(c.id, e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: INK,
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 11, color: MUTED, fontFamily: "'IBM Plex Mono', monospace" }}>
              {countFor(c.id)} lanç.
            </span>
            <button
              onClick={() => onDeleteRequest(c)}
              aria-label={`Excluir ${c.name}`}
              style={{ border: "none", background: "transparent", cursor: "pointer", color: MUTED, padding: 4 }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Nova categoria
        </div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da categoria"
          style={{
            width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 8,
            padding: "9px 10px", fontSize: 13.5, marginBottom: 10, fontFamily: "inherit", color: INK,
          }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["despesa", "receita"].map((k) => (
            <button
              key={k}
              onClick={() => setNewKind(k)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12.5, cursor: "pointer",
                border: `1px solid ${newKind === k ? INK : LINE}`,
                background: newKind === k ? INK : "transparent",
                color: newKind === k ? PAPER : MUTED, textTransform: "capitalize",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (newName.trim()) { onAdd(newName.trim(), newKind); setNewName(""); } }}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: GREEN, color: "#fff", fontSize: 13.5, cursor: "pointer", fontWeight: 600,
          }}
        >
          Adicionar categoria
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: Nova / Editar transação                                      */
/* ------------------------------------------------------------------ */
function TransactionModal({ initial, categories, onClose, onSave, onDelete }) {
  const isEdit = !!initial;
  const isInstallment = !!initial?.installment;

  const [type, setType] = useState(initial?.type || "despesa");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || (type === "receita" ? "pendente" : "pendente"));
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [mode, setMode] = useState("unico"); // unico | repetir | parcelar
  const [installTotal, setInstallTotal] = useState(2);
  const [splitMethod, setSplitMethod] = useState("dividir"); // dividir total | multiplicar parcela

  const [confirmScope, setConfirmScope] = useState(null); // 'save' | 'delete' -> shows scope picker
  const [error, setError] = useState("");

  const relevantCategories = categories.filter((c) => c.kind === type);

  function validate() {
    if (!description.trim()) return "Informe uma descrição.";
    if (!amount || isNaN(parseFloat(amount.replace(",", "."))) || parseFloat(amount.replace(",", ".")) <= 0) return "Informe um valor válido.";
    if (!categoryId) return "Selecione uma categoria.";
    if (!date) return "Informe uma data.";
    return "";
  }

  function handleSaveClick() {
    const err = validate();
    if (err) { setError(err); return; }
    if (isEdit && isInstallment) { setConfirmScope("save"); return; }
    commitSave("only");
  }

  function commitSave(scope) {
    const val = parseFloat(amount.replace(",", "."));
    onSave({
      base: {
        type, amount: val, date, description: description.trim(), status, categoryId,
      },
      mode,
      installTotal: Number(installTotal),
      splitMethod,
      scope, // only | future | all (used only when editing an installment)
    });
    setConfirmScope(null);
  }

  function handleDeleteClick() {
    if (isInstallment) { setConfirmScope("delete"); return; }
    onDelete("only");
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(27,43,34,0.4)", display: "flex",
      alignItems: "flex-end", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PAPER, width: "100%", maxWidth: 480, borderTopLeftRadius: 18, borderTopRightRadius: 18,
          maxHeight: "88vh", overflowY: "auto", padding: "16px 18px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: INK }}>
            {isEdit ? "Editar lançamento" : "Novo lançamento"}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: MUTED }}>
            <X size={20} />
          </button>
        </div>

        {!confirmScope && (
          <>
            {/* Tipo */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["despesa", "receita"].map((k) => (
                <button
                  key={k}
                  onClick={() => { setType(k); setCategoryId(""); }}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: `1px solid ${type === k ? (k === "receita" ? GREEN : RED) : LINE}`,
                    background: type === k ? (k === "receita" ? "rgba(47,111,78,0.1)" : "rgba(181,83,60,0.1)") : SURFACE,
                    color: type === k ? (k === "receita" ? GREEN : RED) : MUTED, textTransform: "capitalize",
                  }}
                >
                  {k}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Supermercado" style={inputStyle} list="desc-history" />
            <datalist id="desc-history">
              <option value="Supermercado" /><option value="Aluguel" /><option value="Salário" /><option value="Internet" />
            </datalist>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Valor {isEdit && isInstallment ? "(da parcela)" : ""}</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <label style={labelStyle}>Categoria</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
              {relevantCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 20,
                    fontSize: 12.5, cursor: "pointer",
                    border: `1px solid ${categoryId === c.id ? c.color : LINE}`,
                    background: categoryId === c.id ? `${c.color}22` : SURFACE,
                    color: categoryId === c.id ? INK : MUTED,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(type === "receita" ? ["recebido", "pendente"] : ["pago", "pendente"]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12.5, cursor: "pointer", textTransform: "capitalize",
                    border: `1px solid ${status === s ? INK : LINE}`,
                    background: status === s ? INK : SURFACE,
                    color: status === s ? PAPER : MUTED,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Cadastro inteligente: apenas para despesas novas (não parceladas já existentes) */}
            {type === "despesa" && !isEdit && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Cadastro inteligente</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <ModeButton active={mode === "unico"} onClick={() => setMode("unico")} icon={<Check size={14} />} text="Único" />
                  <ModeButton active={mode === "repetir"} onClick={() => setMode("repetir")} icon={<Repeat size={14} />} text="Repetir" />
                  <ModeButton active={mode === "parcelar"} onClick={() => setMode("parcelar")} icon={<CreditCard size={14} />} text="Parcelar" />
                </div>

                {mode === "repetir" && (
                  <div style={{ marginTop: 10, fontSize: 12, color: MUTED, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 8, padding: 10 }}>
                    Este lançamento será repetido automaticamente todo mês, no mesmo dia, com o mesmo valor.
                  </div>
                )}

                {mode === "parcelar" && (
                  <div style={{ marginTop: 10, background: SURFACE, border: `1px solid ${LINE}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ ...labelStyle, marginTop: 0 }}>Nº de parcelas</label>
                        <input type="number" min={2} max={48} value={installTotal} onChange={(e) => setInstallTotal(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                    <label style={{ ...labelStyle, marginTop: 0 }}>O valor informado é</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setSplitMethod("dividir")} style={pillToggle(splitMethod === "dividir")}>
                        Total a dividir
                      </button>
                      <button onClick={() => setSplitMethod("multiplicar")} style={pillToggle(splitMethod === "multiplicar")}>
                        Valor de cada parcela
                      </button>
                    </div>
                    {amount && !isNaN(parseFloat(amount.replace(",", "."))) && (
                      <div style={{ marginTop: 10, fontSize: 12, color: MUTED, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {splitMethod === "dividir"
                          ? `${installTotal}x de ${fmtBRL(parseFloat(amount.replace(",", ".")) / Number(installTotal || 1))}`
                          : `${installTotal}x de ${fmtBRL(parseFloat(amount.replace(",", ".")))} = ${fmtBRL(parseFloat(amount.replace(",", ".")) * Number(installTotal || 1))}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ color: RED, fontSize: 12.5, marginBottom: 10 }}>{error}</div>
            )}

            <button onClick={handleSaveClick} style={primaryBtn}>
              {isEdit ? "Salvar alterações" : "Adicionar lançamento"}
            </button>

            {isEdit && (
              <button onClick={handleDeleteClick} style={dangerBtn}>
                <Trash2 size={14} /> Excluir lançamento
              </button>
            )}
          </>
        )}

        {confirmScope && (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(201,162,39,0.12)", border: `1px solid rgba(201,162,39,0.4)`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <AlertTriangle size={16} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: INK }}>
                Este lançamento faz parte de uma compra parcelada ({initial.installment.index}/{initial.installment.total}).
                {confirmScope === "save" ? " Aplicar a alteração a:" : " Excluir:"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={scopeBtn} onClick={() => confirmScope === "save" ? commitSave("only") : onDelete("only")}>
                Somente esta parcela
              </button>
              <button style={scopeBtn} onClick={() => confirmScope === "save" ? commitSave("future") : onDelete("future")}>
                Esta e as parcelas futuras
              </button>
              <button style={scopeBtn} onClick={() => confirmScope === "save" ? commitSave("all") : onDelete("all")}>
                Todas as parcelas
              </button>
              <button style={{ ...scopeBtn, border: "none", color: MUTED }} onClick={() => setConfirmScope(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, text }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 0",
        borderRadius: 9, cursor: "pointer", fontSize: 11.5,
        border: `1px solid ${active ? INK : LINE}`,
        background: active ? INK : SURFACE,
        color: active ? PAPER : MUTED,
      }}
    >
      {icon}{text}
    </button>
  );
}

const labelStyle = { display: "block", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5, marginTop: 12 };
const inputStyle = { width: "100%", boxSizing: "border-box", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 10px", fontSize: 13.5, color: INK, background: SURFACE, fontFamily: "inherit", marginBottom: 2 };
const primaryBtn = { width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: GREEN, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16 };
const dangerBtn = { width: "100%", padding: "11px 0", borderRadius: 10, border: `1px solid rgba(181,83,60,0.4)`, background: "transparent", color: RED, fontSize: 13, cursor: "pointer", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };
const scopeBtn = { width: "100%", padding: "11px 0", borderRadius: 9, border: `1px solid ${LINE}`, background: SURFACE, color: INK, fontSize: 13, cursor: "pointer" };
const pillToggle = (active) => ({
  flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 11.5, cursor: "pointer",
  border: `1px solid ${active ? INK : LINE}`, background: active ? INK : SURFACE, color: active ? PAPER : MUTED,
});

/* ------------------------------------------------------------------ */
/* Modal: realocação de categoria excluída                             */
/* ------------------------------------------------------------------ */
function ReallocateModal({ category, categories, onCancel, onConfirm }) {
  const options = categories.filter((c) => c.id !== category.id && c.kind === category.kind);
  const [target, setTarget] = useState("cat-outros");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,43,34,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 14, padding: 20, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <AlertTriangle size={18} color={AMBER} />
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: INK }}>Excluir “{category.name}”</div>
        </div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>
          Essa categoria possui lançamentos. Escolha para onde eles serão movidos antes de excluir.
        </div>
        <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
          {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, ...scopeBtn }}>Cancelar</button>
          <button onClick={() => onConfirm(target)} style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "none", background: RED, color: "#fff", fontSize: 13, cursor: "pointer" }}>
            Realocar e excluir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App shell                                                            */
/* ------------------------------------------------------------------ */
export default function App() {
  const [categories, setCategories] = useState(seedCategories);
  const [transactions, setTransactions] = useState(seedTransactions);
  const [view, setView] = useState("painel");
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reallocTarget, setReallocTarget] = useState(null);

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(t) { setEditing(t); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  function handleSave({ base, mode, installTotal, splitMethod, scope }) {
    if (!editing) {
      // Novo lançamento
      if (base.type === "despesa" && mode === "parcelar" && installTotal > 1) {
        const groupId = uid();
        const perInstallment = splitMethod === "dividir" ? +(base.amount / installTotal).toFixed(2) : base.amount;
        const newOnes = Array.from({ length: installTotal }, (_, i) => ({
          ...base,
          id: uid(),
          amount: perInstallment,
          date: shiftDateByMonths(base.date, i),
          status: i === 0 ? base.status : "pendente",
          installment: { groupId, index: i + 1, total: installTotal },
        }));
        setTransactions((prev) => [...prev, ...newOnes]);
      } else if (base.type === "despesa" && mode === "repetir") {
        // Cria a atual + 11 futuras repetições mensais (prototype: horizonte de 1 ano)
        const groupId = uid();
        const newOnes = Array.from({ length: 12 }, (_, i) => ({
          ...base, id: uid(), date: shiftDateByMonths(base.date, i),
          status: i === 0 ? base.status : "pendente",
          installment: { groupId, index: i + 1, total: 12, recurring: true },
        }));
        setTransactions((prev) => [...prev, ...newOnes]);
      } else {
        setTransactions((prev) => [...prev, { ...base, id: uid() }]);
      }
    } else {
      // Edição
      if (!editing.installment || scope === "only") {
        setTransactions((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...base, installment: editing.installment } : t)));
      } else {
        const { groupId, index: editIndex } = editing.installment;
        setTransactions((prev) => prev.map((t) => {
          if (t.installment?.groupId !== groupId) return t;
          if (scope === "all" || (scope === "future" && t.installment.index >= editIndex)) {
            const amountDelta = t.installment.index - editing.installment.index;
            return {
              ...t,
              description: base.description,
              categoryId: base.categoryId,
              amount: base.amount,
              status: t.id === editing.id ? base.status : t.status,
            };
          }
          return t;
        }));
      }
    }
    closeModal();
  }

  function handleDelete(scope) {
    if (!editing) return;
    if (!editing.installment || scope === "only") {
      setTransactions((prev) => prev.filter((t) => t.id !== editing.id));
    } else {
      const { groupId, index: editIndex } = editing.installment;
      setTransactions((prev) => prev.filter((t) => {
        if (t.installment?.groupId !== groupId) return true;
        if (scope === "all") return false;
        if (scope === "future") return t.installment.index < editIndex;
        return true;
      }));
    }
    closeModal();
  }

  function addCategory(name, kind) {
    setCategories((prev) => [...prev, { id: uid(), name, kind, color: CATEGORY_PALETTE[prev.length % CATEGORY_PALETTE.length] }]);
  }
  function renameCategory(id, name) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }
  function requestDeleteCategory(cat) {
    const hasTx = transactions.some((t) => t.categoryId === cat.id);
    if (hasTx) setReallocTarget(cat);
    else setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }
  function confirmReallocate(targetId) {
    setTransactions((prev) => prev.map((t) => (t.categoryId === reallocTarget.id ? { ...t, categoryId: targetId } : t)));
    setCategories((prev) => prev.filter((c) => c.id !== reallocTarget.id));
    setReallocTarget(null);
  }

  const NAV = [
    { id: "painel", label: "Painel", icon: LayoutGrid },
    { id: "transacoes", label: "Transações", icon: Receipt },
    { id: "categorias", label: "Categorias", icon: Tags },
  ];

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif", background: PAPER, minHeight: "100vh", color: INK,
      maxWidth: 480, margin: "0 auto", position: "relative", boxShadow: "0 0 0 1px rgba(0,0,0,0.03)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input, select { outline: none; }
        input:focus, select:focus, button:focus-visible { outline: 2px solid ${GREEN}; outline-offset: 1px; }
        button { font-family: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "18px 16px 2px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, color: INK }}>Meu Orçamento</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>Controle manual · sem conexão bancária</div>
        </div>
      </div>

      {view === "painel" && (
        <Dashboard transactions={transactions} categories={categories} month={month} setMonth={setMonth} onEdit={openEdit} />
      )}
      {view === "transacoes" && (
        <Transacoes
          transactions={transactions} categories={categories} month={month} setMonth={setMonth}
          onEdit={openEdit} onDelete={handleDelete}
        />
      )}
      {view === "categorias" && (
        <Categorias
          categories={categories} transactions={transactions}
          onAdd={addCategory} onRename={renameCategory} onDeleteRequest={requestDeleteCategory}
        />
      )}

      {/* Bottom nav + FAB */}
      <div style={{
        position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, width: "100%", maxWidth: 480,
        background: SURFACE, borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center",
        justifyContent: "space-around", padding: "10px 8px 14px", zIndex: 10,
      }}>
        {NAV.slice(0, 2).map(({ id, label, icon: Icon }) => (
          <NavBtn key={id} active={view === id} onClick={() => setView(id)} icon={Icon} label={label} />
        ))}

        <button
          onClick={openNew}
          aria-label="Adicionar lançamento"
          style={{
            width: 54, height: 54, borderRadius: "50%", background: GREEN, border: `3px solid ${PAPER}`,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            marginTop: -30, boxShadow: "0 4px 10px rgba(47,111,78,0.35)",
          }}
        >
          <Plus size={24} color="#fff" />
        </button>

        {NAV.slice(2).map(({ id, label, icon: Icon }) => (
          <NavBtn key={id} active={view === id} onClick={() => setView(id)} icon={Icon} label={label} />
        ))}
      </div>

      {modalOpen && (
        <TransactionModal
          initial={editing}
          categories={categories}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {reallocTarget && (
        <ReallocateModal
          category={reallocTarget}
          categories={categories}
          onCancel={() => setReallocTarget(null)}
          onConfirm={confirmReallocate}
        />
      )}
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent",
        border: "none", cursor: "pointer", color: active ? GREEN : MUTED, padding: "2px 10px",
      }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  );
}
