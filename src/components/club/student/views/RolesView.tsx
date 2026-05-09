


export function RolesView() {
  const ROLES = [
    {
      emoji: '👑',
      name: 'Admin',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      permissions: ['Manage Members', 'Edit Club', 'Delete Posts', 'Assign Roles'],
      members: [{ img: 68, name: 'Oussama' }],
    },
    {
      emoji: '📚',
      name: 'Teacher',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      permissions: ['Post Courses', 'Create Quizzes', 'Host Live Classes', 'Manage Resources'],
      members: [{ img: 5, name: 'Amina' }, { img: 15, name: 'Layla' }],
    },
    {
      emoji: '🛡',
      name: 'Moderator',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      permissions: ['Pin Messages', 'Remove Members', 'Review Join Requests'],
      members: [{ img: 11, name: 'Youssef' }],
    },
    {
      emoji: '🎓',
      name: 'Student',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      dot: 'bg-green-500',
      permissions: ['View All Content', 'Post in Chat', 'Attend Events', 'Earn XP'],
      members: [{ img: 22, name: 'Reda' }, { img: 26, name: 'Nora' }, { img: 33, name: 'Ahmed' }, { img: 44, name: 'Karim' }],
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((role, i) => (
          <div key={i} className={`bg-white border ${role.border} rounded-2xl p-5 hover:shadow-sm transition-all`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className={`w-9 h-9 ${role.bg} rounded-xl flex items-center justify-center text-[18px]`}>{role.emoji}</span>
              <div>
                <div className={`text-[14px] font-black ${role.color}`}>{role.name}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{role.members.length} member{role.members.length !== 1 ? 's' : ''}</div>
              </div>
              <span className={`ml-auto w-2 h-2 rounded-full ${role.dot}`} />
            </div>

            {/* Permissions */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {role.permissions.map(p => (
                <span key={p} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${role.bg} ${role.color} border ${role.border}`}>{p}</span>
              ))}
            </div>

            {/* Members */}
            <div className="flex items-center gap-1.5">
              {role.members.map((m, j) => (
                <div key={j} className="flex items-center gap-1.5 bg-gray-50 border border-[var(--color-border)] rounded-full pl-0.5 pr-2.5 py-0.5">
                  <img src={`https://i.pravatar.cc/30?img=${m.img}`} className="w-5 h-5 rounded-full object-cover" alt={m.name} />
                  <span className="text-[10px] font-semibold text-navy">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
