'use client';
import { Trash2 } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import { fmtDateTime } from '@/lib/utils';
import type { AuthUser } from '@/types';
import { ROLE_COLOR } from '../types';

const TABLE_HEADERS = ['User', 'Role', 'Status', 'Last Login', 'Created', ''];

interface UsersTableProps {
  users: AuthUser[];
  isLoading: boolean;
  currentUserId?: string;
  canManage: boolean;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDeleteRequest: (id: string) => void;
}

export default function UsersTable({
  users,
  isLoading,
  currentUserId,
  canManage,
  onToggleActive,
  onDeleteRequest,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th key={h} className="table-th first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u._id} className={i % 2 === 0 ? 'bg-bg' : 'bg-panel/40'}>
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-panel3 text-[11px] font-bold text-muted shrink-0">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text">{u.name}</div>
                    <div className="text-[10px] text-muted">{u.email}</div>
                  </div>
                </div>
              </td>
              <td className="table-td">
                <Badge variant={ROLE_COLOR[u.role]}>{u.role}</Badge>
              </td>
              <td className="table-td">
                <Badge variant={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="table-td text-[10px] text-muted">{u.lastLogin ? fmtDateTime(u.lastLogin) : '—'}</td>
              <td className="table-td text-[10px] text-muted">{fmtDateTime(u.createdAt)}</td>
              <td className="table-td">
                {canManage && u._id !== currentUserId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleActive(u._id, !u.isActive)}
                      className={`btn-ghost py-0.5 px-1.5 text-[10px] ${u.isActive ? 'hover:text-red' : 'hover:text-green'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => onDeleteRequest(u._id)} className="btn-ghost p-1 hover:text-red hover:border-red/30">
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
