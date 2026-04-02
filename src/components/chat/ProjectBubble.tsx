import { format } from 'date-fns';
import { Users, Clock, Calendar, Rocket, Eye, ChevronRight } from 'lucide-react';

export interface ProjectRole { id: string; title: string; slots_needed: number; }
export interface ProjectSkill { id: string; skill_name: string; }
export interface ProjectApplication { id: string; user_id: string; role_id: string; experience: string; availability_hours: number; status: string; }
export interface ProjectMeeting { id: string; scheduled_at: string; agenda: string; meeting_url: string; notes: string; status: string; }

export interface ClubProject {
  id: string;
  club_id: string;
  title: string;
  pitch: string;
  description: string;
  start_date?: string;
  duration_weeks?: number;
  hours_per_week?: number;
  visibility: string;
  status: string;
  creator_id: string;
  roles?: ProjectRole[];
  skills?: ProjectSkill[];
  applications?: ProjectApplication[];
  meetings?: ProjectMeeting[];
}

export function ProjectBubble({
  project,
  onApply,
  onViewDetails,
  currentUserId,
}: {
  project: ClubProject;
  onApply: () => void;
  onViewDetails: () => void;
  currentUserId?: string;
}) {
  const applicantsCount = project.applications?.length || 0;
  const isCreator = currentUserId === project.creator_id;
  const userApplication = project.applications?.find(a => a.user_id === currentUserId);
  const hasApplied = !!userApplication;

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden font-body text-left">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-1.5">
            <Rocket className="w-3.5 h-3.5" /> Project
          </div>
          <h3 className="font-heading font-semibold text-lg text-navy leading-tight">{project.title}</h3>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">{project.pitch}</p>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Description Snippet */}
        {project.description && (
          <p className="text-[14px] text-gray-600 leading-relaxed italic bg-gray-50 p-3 rounded-xl border border-gray-100 border-l-4 border-l-blue-400">
            &ldquo;{project.description}&rdquo;
          </p>
        )}

        {/* Meta Stats */}
        <div className="grid grid-cols-2 gap-3 text-[13px] text-gray-600">
          {project.duration_weeks && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{project.duration_weeks} weeks</span>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Starts {format(new Date(project.start_date), 'MMM d')}</span>
            </div>
          )}
          {project.hours_per_week && (
            <div className="col-span-2 flex items-center gap-2 text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg w-max">
              <span className="text-sm">&#9889;</span>
              <span className="font-semibold text-amber-700">
                {project.hours_per_week}&ndash;{project.hours_per_week + 2} hrs/week
              </span>
            </div>
          )}
        </div>

        {/* Roles Needed */}
        {project.roles && project.roles.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Roles Needed</div>
            <div className="flex flex-wrap gap-2">
              {project.roles.map(r => {
                const filled = project.applications?.filter(a => a.role_id === r.id && a.status === 'accepted').length || 0;
                const isFull = filled >= r.slots_needed;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border ${
                      isFull ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}
                  >
                    {r.title}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${isFull ? 'bg-gray-200' : 'bg-blue-100'}`}>
                      {filled}/{r.slots_needed}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stack / Skills */}
        {project.skills && project.skills.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Stack / Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {project.skills.map(s => (
                <span key={s.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md">
                  {s.skill_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interest Footer */}
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-500 pt-2 border-t border-gray-100">
          <Eye className="w-3.5 h-3.5" />
          {applicantsCount} {applicantsCount === 1 ? 'person' : 'people'} interested
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-gray-200 bg-gray-50">
        {isCreator ? (
          <button
            onClick={onViewDetails}
            className="flex-1 py-3 text-[14px] font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Users className="w-4 h-4" /> View Applicants
          </button>
        ) : hasApplied ? (
          <>
            <div
              className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-1.5 border-r border-gray-200 ${
                userApplication!.status === 'accepted'
                  ? 'text-green-600 bg-green-50'
                  : userApplication!.status === 'waitlisted'
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-500 bg-gray-100'
              }`}
            >
              {userApplication!.status === 'accepted'
                ? '✓ Accepted'
                : userApplication!.status === 'waitlisted'
                ? '⏳ Waitlisted'
                : '⏱ Pending Review'}
            </div>
            <button
              onClick={onViewDetails}
              className="flex-1 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
            >
              Details <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onApply}
              className="flex-1 py-3 text-[14px] font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors border-r border-gray-200 flex items-center justify-center gap-1.5"
            >
              Sign Me Up
            </button>
            <button
              onClick={onViewDetails}
              className="flex-1 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
            >
              Details <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
