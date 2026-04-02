import { useState } from 'react';
import { Users, X, Check, Clock, MessageCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import type { ClubProject, ProjectApplication } from './ProjectBubble';

// Extended type dynamically assigned by the parent query
export interface PopulatedApplication extends ProjectApplication {
  user?: { first_name: string; last_name: string; avatar_url: string };
  role_title?: string; // injected mapped
}

export function ProjectApplicantsDashboard({
  project,
  onClose,
  onUpdateStatus,
}: {
  project: ClubProject;
  onClose: () => void;
  onUpdateStatus: (applicationId: string, status: 'accepted' | 'waitlisted' | 'rejected') => Promise<void>;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Map role titles directly into applications for easy rendering
  const mappedApps: PopulatedApplication[] = (project.applications || []).map(a => ({
    ...a,
    role_title: project.roles?.find(r => r.id === a.role_id)?.title || 'Unknown Role'
  }));

  const pending = mappedApps.filter(a => a.status === 'pending');
  const accepted = mappedApps.filter(a => a.status === 'accepted');
  const waitlisted = mappedApps.filter(a => a.status === 'waitlisted');

  const handleAction = async (id: string, status: 'accepted' | 'waitlisted') => {
    setProcessingId(id);
    await onUpdateStatus(id, status);
    setProcessingId(null);
  };

  const renderCard = (app: PopulatedApplication, actions: boolean) => (
    <div key={app.id} className={`p-4 border rounded-xl mb-3 flex flex-col gap-3 ${actions ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={app.user?.avatar_url || 'https://images.unsplash.com/photo-1549068106-b024baf5062d'} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm bg-white" />
          <div>
            <div className="font-bold text-[14px] text-navy flex items-center gap-2">
              {app.user?.first_name} {app.user?.last_name}
            </div>
            <div className="text-[12px] font-semibold text-blue-600">
              Applying for: {app.role_title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
          <Clock className="w-3.5 h-3.5" /> {app.availability_hours}h/wk
        </div>
      </div>
      
      <p className="text-[13px] text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 whitespace-pre-wrap">
        "{app.experience}"
      </p>

      {actions && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-1">
          <button 
            disabled={!!processingId}
            onClick={() => handleAction(app.id, 'accepted')}
            className="flex-1 py-2 text-[12px] font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            {processingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
          </button>
          <button 
            disabled={!!processingId}
            onClick={() => handleAction(app.id, 'waitlisted')}
            className="flex-1 py-2 text-[12px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
           Waitlist
          </button>
          <button className="flex-none px-3 py-2 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4 sm:p-0">
      <div className="bg-white w-full sm:max-w-2xl rounded-2xl shadow-xl animate-in zoom-in-95 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-heading font-bold text-navy text-[18px] flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Applicants
            </h3>
            <p className="text-[13px] text-gray-500 font-medium mt-1">{project.title} • {mappedApps.length} interested</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* List Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          {mappedApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-[14px] font-semibold text-gray-500">No applications yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Section */}
              {pending.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Needs Review <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">{pending.length}</span>
                  </h4>
                  <div>{pending.map(a => renderCard(a, true))}</div>
                </div>
              )}

              {/* Accepted Section */}
              {accepted.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Accepted <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-[10px]">{accepted.length}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accepted.map(a => renderCard(a, false))}
                  </div>
                </div>
              )}

              {/* Waitlisted Section */}
              {waitlisted.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    Waitlisted <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[10px]">{waitlisted.length}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-70">
                    {waitlisted.map(a => renderCard(a, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
