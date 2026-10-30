import React, { useState } from 'react';
import { Users, Search, Shield, Heart, Building2, UserX, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const { users, toggleUserStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
          Access & Security
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Platform User Accounts
        </h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
          Manage roles, suspend fraudulent actors, and audit active donors and non-profit representatives.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, or city..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {['All', 'donor', 'ngo', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-md font-medium whitespace-nowrap capitalize transition-colors cursor-pointer text-xs ${
                roleFilter === r
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-neutral-500 font-medium">
                <th className="px-4 py-3">User & Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Primary Location</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-neutral-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize font-medium text-neutral-800 dark:text-neutral-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                    {user.location}
                  </td>
                  <td className="px-4 py-3">
                    {user.status === 'active' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 font-mono">
                    {user.createdAt}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        user.status === 'active'
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
