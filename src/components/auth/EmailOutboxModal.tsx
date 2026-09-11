import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Mail,
  X,
  RotateCw,
  Search,
  CheckCircle,
  Clock,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  Send,
} from 'lucide-react';

interface EmailLogItem {
  id: string;
  to: string;
  subject: string;
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'WELCOME' | 'ENROLLMENT' | 'GRADE' | 'NOTIFICATION';
  code?: string;
  previewText?: string;
  sentAt: string;
  status: 'DELIVERED' | 'SIMULATED' | 'FAILED';
  error?: string;
}

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode?: (code: string, email: string) => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({
  isOpen,
  onClose,
  onSelectCode,
}) => {
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.getRecentEmails();
      setEmails(res.emails || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmails = emails.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.to.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      (item.code && item.code.includes(q)) ||
      item.type.toLowerCase().includes(q)
    );
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Institutional Email Outbox
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Live Feed
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect verification security codes and transactional notices sent to students.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student email, subject, or 6-digit code..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Email Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No email dispatches found matching your search.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Register a new student account or request a password reset to generate mail records.
              </p>
            </div>
          ) : (
            filteredEmails.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{item.to}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          item.type === 'VERIFICATION'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : item.type === 'PASSWORD_RESET'
                            ? 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                            : 'bg-sky-400/10 text-sky-400 border border-sky-400/20'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-slate-300 mt-1">{item.subject}</h4>
                  </div>

                  {item.status === 'DELIVERED' ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Sent
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Simulated
                    </span>
                  )}
                </div>

                {/* Preview text */}
                {item.previewText && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800/60">
                    {item.previewText}
                  </p>
                )}

                {/* 6-Digit Code Action Box */}
                {item.code && (
                  <div className="flex items-center justify-between bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-300">Security Code:</span>
                      <span className="text-sm font-extrabold font-mono text-amber-400 tracking-wider">
                        {item.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(item.id, item.code!)}
                        className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1"
                      >
                        {copiedCodeId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>

                      {onSelectCode && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCode(item.code!, item.to);
                            onClose();
                          }}
                          className="text-[11px] px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 flex items-center gap-1"
                        >
                          Use Code <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Transactional delivery via Resend API & institutional safe mock.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
