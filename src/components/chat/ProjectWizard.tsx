import { useState } from 'react';
import { Code2, X, Plus, Trash2, Calendar, Clock, Globe, Loader2, Rocket } from 'lucide-react';

export interface ProjectWizardPayload {
  title: string;
  pitch: string;
  description: string;
  start_date: string;
  duration_weeks: number;
  hours_per_week: number;
  visibility: 'club' | 'public';
  roles: { title: string; slots_needed: number }[];
  skills: string[];
}

export function ProjectWizard({
  onClose,
  onSubmit,
  isSaving
}: {
  onClose: () => void;
  onSubmit: (payload: ProjectWizardPayload) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState('');
  const [pitch, setPitch] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('6');
  const [hoursPerWeek, setHoursPerWeek] = useState('10');
  const [visibility, setVisibility] = useState<'club' | 'public'>('club');
  
  const [roles, setRoles] = useState<{ id: number; title: string; slots_needed: number }[]>([
    { id: 1, title: 'Developer', slots_needed: 1 }
  ]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addRole = () => setRoles([...roles, { id: Date.now(), title: '', slots_needed: 1 }]);
  const updateRole = (id: number, field: string, value: string | number) => {
    setRoles(roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeRole = (id: number) => {
    if (roles.length > 1) setRoles(roles.filter(r => r.id !== id));
  };

  const handleNext = () => {
    if (!title.trim() || !pitch.trim()) return;
    const validRoles = roles.filter(r => r.title.trim());
    if (validRoles.length === 0) return;

    onSubmit({
      title: title.trim(),
      pitch: pitch.trim(),
      description: description.trim(),
      start_date: startDate,
      duration_weeks: parseInt(durationWeeks) || 0,
      hours_per_week: parseInt(hoursPerWeek) || 0,
      visibility,
      roles: validRoles,
      skills
    });
  };

  const isValid = title.trim() && pitch.trim() && roles.some(r => r.title.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-navy text-[16px]">Pitch a Project</h3>
              <p className="text-[12px] text-gray-500 font-medium">Recruit collaborators natively in chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Basics */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Project Essentials</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Project Title *" className="w-full px-3.5 py-2.5 text-[14px] font-medium rounded-xl border border-gray-200 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all mb-3" />
              <input value={pitch} onChange={e => setPitch(e.target.value)} placeholder="Short pitch (e.g. Build a mobile version with offline support) *" className="w-full px-3.5 py-2.5 text-[14px] font-medium rounded-xl border border-gray-200 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all mb-3" />
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Detailed description (optional)" className="w-full px-3.5 py-2.5 text-[14px] font-medium rounded-xl border border-gray-200 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-none" />
            </div>
          </div>

          {/* Roles */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block flex items-center justify-between">
              Roles Needed *
              <button onClick={addRole} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-[10px] bg-blue-50 px-2 py-0.5 rounded-md"><Plus className="w-3 h-3"/> Add Role</button>
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <input value={role.title} onChange={e => updateRole(role.id, 'title', e.target.value)} placeholder="e.g. React Native Dev" className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    <span className="text-[11px] font-semibold text-gray-500">Slots:</span>
                    <input type="number" min="1" max="10" value={role.slots_needed} onChange={e => updateRole(role.id, 'slots_needed', parseInt(e.target.value)||1)} className="w-10 text-center bg-transparent outline-none font-bold text-[13px] text-navy" />
                  </div>
                  {roles.length > 1 && (
                    <button onClick={() => removeRole(role.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Stack & Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map(s => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg flex items-center gap-1.5">
                  {s} <button onClick={() => setSkills(skills.filter(x => x !== s))}><X className="w-3 h-3 hover:text-red-500"/></button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Add a skill/tool (e.g. TypeScript) and press Enter" className="flex-1 px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              <button onClick={addSkill} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold text-[13px] transition-colors">Add</button>
            </div>
          </div>

          {/* Timeline & Commitment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Duration (Weeks)</label>
              <input type="number" min="1" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)} className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500"/> Hrs/Week</label>
              <input type="number" min="1" value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-green-500"/> Visibility</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value as 'club'|'public')} className="w-full px-3 py-2 text-[13px] rounded-lg border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white">
                <option value="club">Club Only</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex-shrink-0 sm:rounded-b-2xl">
          <button disabled={isSaving || !isValid} onClick={handleNext} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[15px] hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            {isSaving ? 'Launching...' : 'Launch Project Card'}
          </button>
        </div>
      </div>
    </div>
  );
}
