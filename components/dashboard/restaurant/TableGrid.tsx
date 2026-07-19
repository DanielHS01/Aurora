'use client'

import { useState } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import type { BusinessArea } from '@/lib/types';
import type { RestaurantTableWithArea } from '@/lib/queries/tables';
import type { Database } from '@/lib/types/database.types';
import CreateTableModal from './CreateTableModal';
import EditTableModal from './EditTableModal';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

export type TableWithOrder = RestaurantTableWithArea & {
  activeOrder: (Order & { order_items: OrderItem[] | null }) | null;
};

interface TableGridProps {
  businessId: string;
  tables: TableWithOrder[];
  areas: BusinessArea[];
}

function getStatusDotClass(status: string | null): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500';
    case 'occupied':
      return 'bg-red-500';
    case 'reserved':
      return 'bg-orange-500';
    case 'inactive':
      return 'bg-gray-300';
    default:
      return 'bg-gray-300';
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'available':
      return 'Libre';
    case 'occupied':
      return 'Ocupada';
    case 'reserved':
      return 'Reservada';
    case 'inactive':
      return 'Inactiva';
    default:
      return 'Sin estado';
  }
}

export default function TableGrid({
  businessId,
  tables,
  areas,
}: TableGridProps) {
  const [selectedTable, setSelectedTable] = useState<TableWithOrder | null>(
    null
  );
  const [editingTable, setEditingTable] = useState<TableWithOrder | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-medium">Estado de Mesas</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90"
        >
          <FiPlus size={16} />
          Agregar mesa
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10 rounded-3xl bg-gray-50/50">
          <p className="text-black/60 font-medium mb-4">
            No hay mesas registradas actualmente.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--brand-primary)] text-[var(--brand-secondary)] text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            + Crear primera mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`text-left p-6 rounded-2xl border transition-all duration-200 ${
                table.status === 'occupied'
                  ? 'bg-black text-white border-transparent shadow-lg'
                  : 'bg-white border-black/10 text-black hover:border-black/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-lg">
                  Mesa {table.table_number}
                </h4>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(
                    table.status
                  )}`}
                  aria-hidden
                />
              </div>
              <p className="text-xs opacity-60 uppercase mt-1 tracking-wider">
                {getStatusLabel(table.status)}
              </p>
              <p className="text-xs opacity-50 mt-2">
                {table.capacity} personas
                {table.area && ` · ${table.area.name}`}
              </p>
              {table.activeOrder && (
                <p className="text-xs opacity-50 mt-1">
                  {(table.activeOrder.order_items ?? []).length} ítem(s) · $
                  {(table.activeOrder.total ?? 0).toLocaleString('es-CO')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onEdit={() => {
            setEditingTable(selectedTable);
            setSelectedTable(null);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTableModal
          businessId={businessId}
          areas={areas}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTable && (
        <EditTableModal
          businessId={businessId}
          table={editingTable}
          areas={areas}
          onClose={() => setEditingTable(null)}
        />
      )}
    </section>
  );
}

function TableDetailModal({
  table,
  onClose,
  onEdit,
}: {
  table: TableWithOrder;
  onClose: () => void;
  onEdit: () => void;
}) {
  const orderItems = table.activeOrder?.order_items ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Mesa {table.table_number}</h3>
          <span
            className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(
              table.status
            )}`}
          />
        </div>

        <p className="mb-4 text-xs text-black/40">
          {table.capacity} personas
          {table.area && ` · ${table.area.name}`}
        </p>

        {table.activeOrder ? (
          <div className="space-y-3">
            <p className="text-sm text-black/50">
              Pedido activo · {table.activeOrder.status}
            </p>
            <ul className="divide-y divide-black/5">
              {orderItems.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between py-2 text-sm"
                >
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-black/60">
                    ${(item.total_price ?? 0).toLocaleString('es-CO')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-black/10 pt-3 font-medium">
              <span>Total</span>
              <span>
                ${(table.activeOrder.total ?? 0).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-black/50">
            Esta mesa está libre. No tiene pedidos activos.
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            <FiEdit2 size={14} />
            Editar
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-[var(--brand-secondary)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}