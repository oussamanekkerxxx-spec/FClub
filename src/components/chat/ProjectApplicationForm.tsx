import { useState } from 'react';
import { Briefcase, Send, Loader2, X, ChevronRight } from 'lucide-react';
import type { ClubProject } from './ProjectBubble';

export interface ProjectApplicationPayload {
  role_id: string;
  experience: string;
  availability_hours: number;
}

export function ProjectApplicationForm({
  project,
  onClose,
  onSubmit,
  isSubmitting
}: {
  project: ClubProject;
  onClose: () => void;
  onSubmit: (payload: ProjectApplicationPayload) => void;
  isSubmitting: boolean;
}) {
  const [roleId, setRoleId] = useState(project.roles?.[0]?.id || '');
  const [experience, setExperience] = useState('');
  const [hours, setHours] = useState(project.hours_per_week || 10);

  const handleSubmit = () => {
    if (!roleId || !experience.trim()) return;
    onSubmit({ role_id: roleId, experience: experience.trim(), availability_hours: hours });
  };

  const selectedRoleName = project.roles?.find(r => r.id === roleId)?.title;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl p-6 sm:p-7 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-navy text-[18px] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Apply to Project
            </h3>
            <p className="text-[13px] text-gray-500 font-medium mt-1">Join "{project.title}"</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Which role?</label>
            <div className="relative">
              <select value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full pl-3 pr-10 py-3 text-[14px] font-semibold text-navy bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 appearance-none transition-all cursor-pointer">
                <option value="" disabled>Select a role...</option>
                {project.roles?.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.slots_needed} slots)</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Your Experience</label>
            <textarea 
              value={experience} 
              onChange={e => setExperience(e.target.value)} 
              rows={3} 
              placeholder={`e.g. "3 yrs as ${selectedRoleName || 'developer'}, built similar projects..."`} 
              className="w-full px-4 py-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm" 
            />
          </div>

          {/* Availability */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-navy uppercase tracking-widest">Availability</label>
              <span className="text-[14px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded shadow-sm border border-blue-50">{hours} hrs/week</span>
            </div>
            <input 
              type="range" 
              min="1" max="40" 
              value={hours} 
              onChange={e => setHours(parseInt(e.target.value))} 
              className="w-full accent-blue-500" 
            />
            <div className="flex justify-between text-[10px] font-semibold text-blue-400 mt-2 px-1">
              <span>1h</span>
              <span>20h</span>
              <span>40h</span>
            </div>
          </div>
        </div>

        <button 
          disabled={isSubmitting || !roleId || !experience.trim()} 
          onClick={handleSubmit} 
          className="mt-6 w-full py-3.5 rounded-xl bg-navy text-white text-[14px] font-bold hover:shadow-lg hover:shadow-navy/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSubmitting ? 'Sending...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
