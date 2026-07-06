'use client';
import { Search, ShieldCheck, UserPlus } from 'lucide-react';

interface UsersToolbarProps {
  search: string;
  canManage: boolean;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export default function UsersToolbar({ search, canManage, onSearchChange, onAddClick }: UsersToolbarProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex items-center gap-2 mr-auto">
        <ShieldCheck size={16} className="text-gold" />
        <h2 className="text-sm font-bold text-text">User Management</h2>
      </div>
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users…"
          className="h-7 w-44 rounded-lg border border-line bg-panel2 pl-7 pr-3 text-xs
                     text-text placeholder:text-muted2 outline-none focus:border-gold transition-all"
        />
      </div>
      {canManage && (
        <button onClick={onAddClick} className="btn-primary text-xs">
          <UserPlus size={12} /> Add User
        </button>
      )}
    </div>
  );
}
