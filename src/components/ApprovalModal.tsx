import React, { useState } from 'react';
import { Script, UserProfile } from '../types';
import { ShieldCheck, Check, X, AlertCircle, FileCode } from 'lucide-react';

interface ApprovalModalProps {
  script: Script;
  currentUser: UserProfile;
  onClose: () => void;
  onSubmitDecision: (scriptId: string, approved: boolean, notes: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  script,
  currentUser,
  onClose,
  onSubmitDecision,
}) => {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitDecision(script.id, decision === 'approved', notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Review & Approve Test Script</h3>
              <p className="text-xs text-slate-400">{script.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Current Version:</span>
            <span className="font-mono text-slate-200 font-semibold">v{script.currentVersion.versionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Status:</span>
            <span className="capitalize font-semibold text-amber-400">{script.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reviewed By:</span>
            <span className="text-slate-200">{currentUser.name} ({currentUser.role.toUpperCase()})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Review Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  decision === 'approved'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Approve for Production</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  decision === 'rejected'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <X className="h-4 w-4" />
                <span>Reject & Request Changes</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reviewer Notes / Feedback
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified steps match latest sprint story criteria..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
