import { useState, useEffect, useRef, useCallback } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, EmptyState, Spinner } from '../components/UI.jsx';

export default function Messages() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [active, setActive] = useState(null); // { interlocuteur, messages }
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadConvs = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConvs(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => openConv(active.interlocuteur, true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.interlocuteur?.id]);

  const openConv = async (inter, silent = false) => {
    try {
      const { data } = await api.get(`/messages/avec/${inter.id}`);
      setActive(data);
      if (!silent) loadConvs();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      if (!silent) alert(errMsg(e));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      await api.post('/messages', { destinataire_id: active.interlocuteur.id, contenu: text });
      setText('');
      await openConv(active.interlocuteur, true);
      loadConvs();
    } catch (e2) {
      alert(errMsg(e2));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h2 className="text-xl font-bold text-slate-800 mb-4">💬 Messagerie</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-3rem)]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-y-auto">
          {convs.length === 0 && (
            <EmptyState icon="💬" title="Aucune conversation" hint="Les conversations avec votre encadrant / étudiant apparaîtront ici." />
          )}
          {convs.map((c) => (
            <button
              key={c.interlocuteur.id}
              onClick={() => openConv(c.interlocuteur)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-center gap-3 ${
                active?.interlocuteur?.id === c.interlocuteur.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold text-sm shrink-0">
                {c.interlocuteur.prenom?.[0]}{c.interlocuteur.nom?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {c.interlocuteur.prenom} {c.interlocuteur.nom}
                </p>
                <p className="text-xs text-slate-400 truncate">{c.dernier?.contenu}</p>
              </div>
              {c.non_lus > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {c.non_lus}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {!active ? (
            <EmptyState icon="👈" title="Sélectionnez une conversation" />
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                  {active.interlocuteur?.prenom?.[0]}{active.interlocuteur?.nom?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-800">
                    {active.interlocuteur?.prenom} {active.interlocuteur?.nom}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">{active.interlocuteur?.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {active.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.expediteur_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.expediteur_id === user.id
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.contenu}</p>
                      <p className={`text-[10px] mt-1 ${m.expediteur_id === user.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {m.created_at}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Écrivez votre message…"
                  autoFocus
                />
                <Button type="submit" disabled={!text.trim()}>Envoyer</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
