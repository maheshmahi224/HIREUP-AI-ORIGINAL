import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiBase, type PaymentOrderInfo, type Resume } from '../api/client.js';
import { Shell } from '../components/Shell.js';
import { ResumeRenderer, TEMPLATES_META, defaultCustomization, type HireUpCustomization } from '../../../templates/index.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Data = Record<string, any>;
type WorkspaceKey = 'overview' | 'content' | 'customize' | 'ai';
type MobileMode = 'edit' | 'preview';
type ZoomMode = 'fit' | 'width' | 'custom';
type SectionKey = 'personal' | 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'languages' | 'awards' | 'certifications';

const sections: Array<{ key: SectionKey; label: string; icon: string; list?: boolean }> = [
  { key: 'personal', label: 'Profile Details', icon: '👤' },
  { key: 'summary', label: 'Professional Summary', icon: '📝' },
  { key: 'experience', label: 'Work Experience', icon: '💼', list: true },
  { key: 'education', label: 'Education', icon: '🎓', list: true },
  { key: 'projects', label: 'Projects', icon: '📁', list: true },
  { key: 'skills', label: 'Skills', icon: '💡' },
  { key: 'languages', label: 'Languages', icon: '🌐' },
  { key: 'awards', label: 'Honors & Awards', icon: '🏆', list: true },
  { key: 'certifications', label: 'Certifications', icon: '📜', list: true },
];

const workspaceItems: Array<{ key: WorkspaceKey; label: string; icon: string }> = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'content', label: 'Content', icon: '📄' },
  { key: 'customize', label: 'Customize', icon: '🎨' },
  { key: 'ai', label: 'AI Tools', icon: '⚡' },
];

const ids = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const signature = (resume: Resume | null) => (resume ? JSON.stringify({ title: resume.title, templateId: resume.templateId, content: resume.content }) : '');

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}

function TrackStepper({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div>
      <div className="cz-label">
        <span>{label}</span>
        <span className="cz-val-badge">{value > 0 && label !== 'Base Font Size' && label !== 'Line Height' ? `+${value}${unit || ''}` : `${value}${unit || ''}`}</span>
      </div>
      <div className="cz-slider-stepper-row">
        <div
          className="cz-track-wrapper"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPercent = (e.clientX - rect.left) / rect.width;
            const rawVal = min + clickPercent * (max - min);
            const stepped = Math.round(rawVal / step) * step;
            onChange(Number(Math.min(max, Math.max(min, stepped)).toFixed(1)));
          }}
        >
          <div className="cz-track-ticks">
            {ticks.map((t) => (
              <span key={t} className="cz-tick" />
            ))}
          </div>
          <div className="cz-track-thumb" style={{ left: `calc(${percent}% - 12px)` }} />
        </div>
        <button type="button" className="cz-stepper-btn" onClick={() => onChange(Number(Math.max(min, value - step).toFixed(1)))}>-</button>
        <button type="button" className="cz-stepper-btn" onClick={() => onChange(Number(Math.min(max, value + step).toFixed(1)))}>+</button>
      </div>
    </div>
  );
}

function TagInput({ label, tags, onChange }: { label: string; tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (val: string) => {
    const trimmed = val.trim().replace(/^,/, '');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="v2-tag-field">
      <label>{label}</label>
      <div className="v2-tag-container">
        {tags.map((tag, idx) => (
          <span className="v2-tag-chip" key={idx}>
            {tag}
            <button type="button" onClick={() => removeTag(idx)}>✕</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
              setInputValue('');
            }
          }}
          placeholder="Type and press Enter..."
        />
      </div>
    </div>
  );
}

function StepperControl({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (val: number) => void }) {
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div className="v2-stepper-row">
      <span className="v2-stepper-label">{label}</span>
      <div className="v2-stepper-box">
        <button type="button" onClick={dec} disabled={value <= min}>–</button>
        <span className="v2-stepper-val">{value}{unit}</span>
        <button type="button" onClick={inc} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function calculateCompletion(data: Data) {
  const checks = [
    data.personal?.name,
    data.personal?.email,
    data.personal?.phone,
    data.personal?.jobTitle,
    data.summary,
    Array.isArray(data.education) && data.education.length,
    Array.isArray(data.projects) && data.projects.length,
    Array.isArray(data.skills) && data.skills.length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function asTextList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return (item as Data).name || (item as Data).title || (item as Data).category || '';
      return '';
    })
    .filter(Boolean) as string[];
}

const A4Preview = memo(function A4Preview({
  draft,
  customization,
  zoomMode,
  zoom,
  onFit,
}: {
  draft: Resume;
  customization: Partial<HireUpCustomization>;
  zoomMode: ZoomMode;
  zoom: number;
  onFit: (fittedZoom: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const recalculateZoom = useCallback(() => {
    if (!ref.current || zoomMode === 'custom') return;
    const containerWidth = ref.current.clientWidth - 56;
    const containerHeight = ref.current.clientHeight - 56;

    if (zoomMode === 'width') {
      onFit(Math.min(1.5, Math.max(0.3, containerWidth / 794)));
      return;
    }

    const scaleW = containerWidth / 794;
    const scaleH = containerHeight / 1123;
    onFit(Math.min(1.2, Math.max(0.3, Math.min(scaleW, scaleH))));
  }, [onFit, zoomMode]);

  useEffect(() => {
    recalculateZoom();
    window.addEventListener('resize', recalculateZoom);
    return () => window.removeEventListener('resize', recalculateZoom);
  }, [recalculateZoom]);

  return (
    <div ref={ref} className="v2-preview-workspace">
      <div className="v2-paper-slot" style={{ width: 794 * zoom, height: 1123 * zoom }}>
        <div className="resume-paper" style={{ transform: `scale(${zoom})` }}>
          <ResumeRenderer templateId={draft.templateId} data={draft.content as any} customization={customization} />
        </div>
      </div>
    </div>
  );
});

export function Editor() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const resumeQuery = useQuery({ queryKey: ['resume', id], queryFn: () => api<{ resume: Resume }>(`/resumes/${id}`) });

  const [draft, setDraft] = useState<Resume | null>(null);
  const [workspace, setWorkspace] = usePersistentState<WorkspaceKey>('hireup.editor.workspace', 'content');
  const [controlPanelCollapsed, setControlPanelCollapsed] = usePersistentState('hireup.editor.controlPanelCollapsed', false);
  const [mobileMode, setMobileMode] = useState<MobileMode>('edit');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openSectionKeys, setOpenSectionKeys] = usePersistentState<SectionKey[]>('hireup.editor.openSections', ['personal', 'summary', 'experience', 'education']);
  const [openSettingGroups, setOpenSettingGroups] = usePersistentState<string[]>('hireup.editor.openSettings', ['Document Settings', 'Design Templates', 'Layout', 'Font Size', 'Colors']);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [browseTemplatesModal, setBrowseTemplatesModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [paying, setPaying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [zoomMode, setZoomMode] = usePersistentState<ZoomMode>('hireup.editor.zoomMode', 'fit');
  const [zoom, setZoom] = usePersistentState('hireup.editor.zoom', 0.7);

  // AI Tools state
  type AiToolKey = 'summary' | 'grammar' | 'translate' | 'cover-letter';
  const [aiTool, setAiTool] = useState<AiToolKey>('summary');
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiJobTitle, setAiJobTitle] = useState('');
  const [aiCompany, setAiCompany] = useState('');
  const [aiJobDesc, setAiJobDesc] = useState('');
  const [aiGrammarText, setAiGrammarText] = useState('');
  const [aiTargetLang, setAiTargetLang] = useState('French');
  const [aiCoverTone, setAiCoverTone] = useState<'professional'|'enthusiastic'|'concise'>('professional');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const history = useRef<Resume[]>([]);
  const future = useRef<Resume[]>([]);
  const hydrated = useRef(false);
  const lastSavedSignature = useRef('');

  useEffect(() => {
    if (resumeQuery.data?.resume && !hydrated.current) {
      hydrated.current = true;
      setDraft(resumeQuery.data.resume);
      lastSavedSignature.current = signature(resumeQuery.data.resume);
    }
  }, [resumeQuery.data]);

  const commit = useCallback((next: Resume) => {
    setDraft((current) => {
      if (current) history.current.push(current);
      future.current = [];
      return next;
    });
  }, []);

  const undo = () => {
    if (!history.current.length || !draft) return;
    const previous = history.current.pop()!;
    future.current.push(draft);
    setDraft(previous);
  };

  const redo = () => {
    if (!future.current.length || !draft) return;
    const next = future.current.pop()!;
    history.current.push(draft);
    setDraft(next);
  };

  useEffect(() => {
    if (!draft || !hydrated.current) return;

    const activeSig = signature(draft);
    if (activeSig === lastSavedSignature.current) {
      setSaveState('saved');
      return;
    }

    setSaveState('saving');
    const timer = setTimeout(async () => {
      try {
        await api(`/resumes/${draft._id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: draft.title,
            templateId: draft.templateId,
            content: draft.content,
          }),
        });
        lastSavedSignature.current = activeSig;
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [draft, queryClient]);

  const update = (updater: (resume: Resume) => Resume) => {
    if (!draft) return;
    commit(updater(draft));
  };

  const updateContent = (updater: (content: Data) => Data) => {
    if (!draft) return;
    commit({ ...draft, content: updater((draft.content as Data) || {}) });
  };

  const data: Data = (draft?.content as Data) || {};
  const customization: Partial<HireUpCustomization> = { ...defaultCustomization, ...(data.customization || {}) };
  const completion = calculateCompletion(data);

  const updateSettings = (partial: Partial<HireUpCustomization>) => {
    updateContent((content) => ({
      ...content,
      customization: { ...(content.customization || {}), ...partial },
    }));
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSectionKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const isSectionOpen = (key: SectionKey) => openSectionKeys.includes(key);

  const toggleSetting = (title: string) => {
    setOpenSettingGroups((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  const selectWorkspace = (target: WorkspaceKey) => {
    setWorkspace(target);
    setControlPanelCollapsed(false);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        updateContent((c) => ({
          ...c,
          personal: { ...(c.personal || {}), photoUrl: base64 },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const list = (key: SectionKey) => (Array.isArray(data[key]) ? (data[key] as Data[]) : []);
  const updateList = (key: SectionKey, items: Data[]) => updateContent((c) => ({ ...c, [key]: items }));

  const addSection = (key: SectionKey) => {
    const base: Data = { id: ids() };
    if (key === 'experience') Object.assign(base, { company: '', role: '', startDate: '', endDate: 'Present', highlights: [''] });
    if (key === 'education') Object.assign(base, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
    if (key === 'projects') Object.assign(base, { name: '', description: '', technologies: [], link: '' });
    if (key === 'awards' || key === 'certifications') Object.assign(base, { title: '', issuer: '', date: '' });
    updateList(key, [...list(key), base]);
    if (!isSectionOpen(key)) toggleSection(key);
    setExpandedEntry(base.id);
  };

  const moveEntry = (key: SectionKey, from: number, to: number) => {
    const items = [...list(key)];
    if (to < 0 || to >= items.length) return;
    [items[from], items[to]] = [items[to], items[from]];
    updateList(key, items);
  };

  const duplicateEntry = (key: SectionKey, item: Data, index: number) => {
    const items = list(key);
    updateList(key, [...items.slice(0, index + 1), { ...clone(item), id: ids() }, ...items.slice(index + 1)]);
  };

  const exportPdf = async () => {
    const paper = document.querySelector<HTMLElement>('.resume-paper');
    if (!paper) {
      window.print();
      return;
    }

    const slot = document.querySelector<HTMLElement>('.v2-paper-slot');
    const origWidth = slot?.style.width ?? '';
    const origHeight = slot?.style.height ?? '';
    const origTransform = paper.style.transform;

    if (slot) {
      slot.style.width = '794px';
      slot.style.height = '1123px';
    }
    paper.style.transform = 'none';

    try {
      const canvas = await html2canvas(paper, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`${draft?.title || 'Resume'}.pdf`);
    } catch (err) {
      console.error('HTML5 PDF export error, falling back to window.print():', err);
      window.print();
    } finally {
      if (slot) {
        slot.style.width = origWidth;
        slot.style.height = origHeight;
      }
      paper.style.transform = origTransform;
    }
  };

  // Check server-side content fingerprint entitlement status
  const entitlementQuery = useQuery({
    queryKey: ['entitlement', id, draft?.templateId, draft?.content],
    queryFn: async () => {
      if (!draft) return { isCurrentStatePaid: false };
      try {
        return await api<{ isCurrentStatePaid: boolean; contentHash: string }>('/payments/check-entitlement', {
          method: 'POST',
          body: JSON.stringify({ resumeId: id }),
        });
      } catch {
        return { isCurrentStatePaid: false };
      }
    },
    enabled: Boolean(draft),
  });

  const isCurrentStatePaid = Boolean(entitlementQuery.data?.isCurrentStatePaid);

  const download = async () => {
    if (!draft) return;
    setPaying(true);
    setPaymentNotice(null);

    // 1. First attempt server-side download authorization
    try {
      const authRes = await api<{ authorized: boolean; contentHash: string }>('/payments/authorize-download', {
        method: 'POST',
        body: JSON.stringify({ resumeId: id }),
      });

      if (authRes.authorized) {
        setPaying(false);
        await exportPdf();
        return;
      }
    } catch (err: any) {
      // If payment required or unauthorized, fall through to Razorpay checkout
    }

    // 2. Trigger Razorpay checkout for ₹30 if unpaid content state
    try {
      const order = await api<PaymentOrderInfo>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ resumeId: id }),
      });

      if (order.alreadyPaid) {
        setPaying(false);
        queryClient.invalidateQueries({ queryKey: ['entitlement', id] });
        await exportPdf();
        return;
      }

      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
        });
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'HireUp AI',
        description: 'Resume Download Entitlement (₹30)',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                resumeId: id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            setPaying(false);
            queryClient.invalidateQueries({ queryKey: ['entitlement', id] });
            setPaymentNotice({
              type: 'success',
              title: 'Payment Successful! 🎉',
              message: 'Your resume download entitlement for this exact content state has been unlocked.',
            });
            await exportPdf();
          } catch {
            setPaying(false);
            setPaymentNotice({
              type: 'error',
              title: 'Verification Failed ⚠️',
              message: 'Payment verification failed. Download is locked until payment is verified.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setPaymentNotice({
              type: 'error',
              title: 'Payment Cancelled ⚠️',
              message: 'Payment window was closed. Download requires a ₹30 payment.',
            });
          },
        },
        theme: { color: '#FF2D55' },
      });

      rzp.open();
    } catch (err: any) {
      setPaying(false);
      setPaymentNotice({
        type: 'error',
        title: 'Payment Error ⚠️',
        message: err?.message || 'Unable to open payment gateway. Please try again.',
      });
    }
  };

  if (!draft) {
    return (
      <Shell fullBleed>
        <div className="editor-coffee-loading-container">
          <div className="editor-coffee-card">
            <div className="coffee-gif-wrapper">
              <img src="/coffee-cup.gif" alt="Brewing resume editor" className="coffee-loading-gif" />
              <div className="coffee-steam-glow" />
            </div>
            <h2 className="coffee-loading-title">Brewing Your Resume Editor</h2>
            <p className="coffee-loading-subtitle">Piping hot templates, AI formatting & recruiter styling...</p>
          </div>
        </div>
      </Shell>
    );
  }

  const input = (label: string, value: string, onChange: (val: string) => void, placeholder = '') => (
    <label className="v2-input-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );

  const entryFields = (key: SectionKey, item: Data, index: number) => {
    const patch = (field: string, val: any) => {
      const items = list(key);
      items[index] = { ...items[index], [field]: val };
      updateList(key, items);
    };

    if (key === 'education') {
      return (
        <div className="v2-entry-grid">
          {input('Institution / University', item.institution || '', (v) => patch('institution', v))}
          {input('Degree / Qualification', item.degree || '', (v) => patch('degree', v))}
          {input('Field of Study', item.fieldOfStudy || '', (v) => patch('fieldOfStudy', v))}
          {input('Start Date', item.startDate || '', (v) => patch('startDate', v), 'e.g. 2021')}
          {input('End Date', item.endDate || '', (v) => patch('endDate', v), 'e.g. 2025')}
          {input('GPA / Grade', item.gpa || '', (v) => patch('gpa', v))}
        </div>
      );
    }

    if (key === 'experience') {
      const bullets = Array.isArray(item.highlights) ? item.highlights : Array.isArray(item.bullets) ? item.bullets : [];
      return (
        <div className="v2-entry-grid">
          {input('Company Name', item.company || '', (v) => patch('company', v))}
          {input('Role / Title', item.role || item.title || '', (v) => patch('role', v))}
          {input('Start Date', item.startDate || '', (v) => patch('startDate', v), 'e.g. 10/2024')}
          {input('End Date', item.endDate || '', (v) => patch('endDate', v), 'e.g. Present')}
          {input('Location', item.location || '', (v) => patch('location', v))}
          <div className="v2-field-full">
            <label className="v2-input-field">
              <span>Summary Description</span>
              <textarea rows={2} value={item.description || ''} onChange={(e) => patch('description', e.target.value)} />
            </label>
          </div>
          <div className="v2-field-full v2-bullets-wrapper">
            <label className="v2-bullets-label">Bullet Highlights</label>
            {bullets.map((bullet: string, bIdx: number) => (
              <div className="v2-bullet-row" key={bIdx}>
                <input
                  value={bullet}
                  onChange={(e) => {
                    const next = [...bullets];
                    next[bIdx] = e.target.value;
                    patch('highlights', next);
                  }}
                  placeholder="Achievement or key responsibility..."
                />
                <button type="button" className="v2-bullet-del" onClick={() => patch('highlights', bullets.filter((_: any, i: number) => i !== bIdx))}>✕</button>
              </div>
            ))}
            <button type="button" className="v2-add-bullet-btn" onClick={() => patch('highlights', [...bullets, ''])}>+ Add Bullet</button>
          </div>
        </div>
      );
    }

    if (key === 'projects') {
      return (
        <div className="v2-entry-grid">
          {input('Project Name', item.name || item.title || '', (v) => patch('name', v))}
          {input('Project Link', item.link || '', (v) => patch('link', v), 'https://...')}
          <div className="v2-field-full">
            <label className="v2-input-field">
              <span>Description</span>
              <textarea rows={3} value={item.description || ''} onChange={(e) => patch('description', e.target.value)} />
            </label>
          </div>
        </div>
      );
    }

    return (
      <div className="v2-entry-grid">
        {input(key === 'certifications' ? 'Certificate Title' : 'Award Name', item.title || item.name || '', (v) => patch(key === 'certifications' ? 'name' : 'title', v))}
        {input('Issuer', item.issuer || '', (v) => patch('issuer', v))}
        {input('Date', item.date || '', (v) => patch('date', v))}
      </div>
    );
  };

  const renderListSection = (section: (typeof sections)[number]) => {
    const items = list(section.key);
    const opened = isSectionOpen(section.key);
    return (
      <div className="v2-section-card" key={section.key}>
        <div className="v2-section-header" onClick={() => toggleSection(section.key)}>
          <span className="v2-sec-icon">{section.icon}</span>
          <span className="v2-sec-title">{section.label}</span>
          {items.length > 0 && <span className="v2-sec-badge">{items.length}</span>}
          <span className="v2-sec-arrow">{opened ? '▲' : '▼'}</span>
        </div>
        {opened && (
          <div className="v2-section-body">
            {items.map((item, index) => {
              const entryId = item.id || `${section.key}-${index}`;
              const expanded = expandedEntry === entryId;
              return (
                <div className="v2-entry-box" key={entryId}>
                  <div className="v2-entry-head">
                    <button type="button" className="v2-entry-title-btn" onClick={() => setExpandedEntry(expanded ? null : entryId)}>
                      <strong>{item.name || item.title || item.company || item.institution || `${section.label} ${index + 1}`}</strong>
                      <small>{item.role || item.degree || item.issuer || 'Click to edit'}</small>
                    </button>
                    <div className="v2-entry-actions">
                      <button type="button" onClick={() => moveEntry(section.key, index, index - 1)} disabled={index === 0}>↑</button>
                      <button type="button" onClick={() => moveEntry(section.key, index, index + 1)} disabled={index === items.length - 1}>↓</button>
                      <button type="button" onClick={() => duplicateEntry(section.key, item, index)}>❐</button>
                      <button type="button" className="v2-del-btn" onClick={() => updateList(section.key, items.filter((_: Data, i: number) => i !== index))}>✕</button>
                      <button type="button" className="v2-expand-btn" onClick={() => setExpandedEntry(expanded ? null : entryId)}>{expanded ? '▲' : '▼'}</button>
                    </div>
                  </div>
                  {expanded && <div className="v2-entry-form">{entryFields(section.key, item, index)}</div>}
                </div>
              );
            })}
            <button type="button" className="v2-add-entry-btn" onClick={() => addSection(section.key)}>+ Add Position / Entry</button>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="v2-workspace-scroll">
      <div className="v2-overview-banner">
        <span>Resume Completion Score</span>
        <strong className="v2-score-val">{completion}%</strong>
        <div className="v2-score-track">
          <div className="v2-score-bar" style={{ width: `${completion}%` }} />
        </div>
      </div>
      <div className="v2-overview-cards-row">
        <div className="v2-stat-card">
          <span>Profile</span>
          <strong>{data.personal?.name ? 'Ready ✓' : 'Incomplete'}</strong>
        </div>
        <div className="v2-stat-card">
          <span>Template</span>
          <strong>{TEMPLATES_META.find((t) => t.id === draft.templateId)?.name || draft.templateId}</strong>
        </div>
        <div className="v2-stat-card">
          <span>Sync Status</span>
          <strong>{saveState === 'saved' ? 'Saved ✓' : 'Saving...'}</strong>
        </div>
      </div>
      <div className="v2-overview-actions">
        <button type="button" className="v2-btn-pink" onClick={() => selectWorkspace('content')}>Continue Editing ✏️</button>
        <button type="button" className="v2-btn-outline" onClick={() => selectWorkspace('customize')}>Customize Design 🎨</button>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="v2-workspace-scroll">
      {/* Sleek Compact Profile Card */}
      <div className="v2-profile-card">
        <input type="file" ref={photoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFileChange} />
        <div className="v2-profile-top" onClick={() => toggleSection('personal')}>
          <div className="v2-avatar-wrapper" onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}>
            {data.personal?.photoUrl ? (
              <img src={data.personal.photoUrl} alt="Profile" className="v2-avatar-img" />
            ) : (
              <div className="v2-avatar-placeholder">📷</div>
            )}
            <button type="button" className="v2-upload-photo-badge">Photo</button>
          </div>
          <div className="v2-profile-titles">
            <h3>{data.personal?.name || 'Your Full Name'}</h3>
            <p className="v2-headline-text">{data.personal?.jobTitle || 'Job Title / Headline'}</p>
            <div className="v2-profile-meta-row">
              {data.personal?.email && <span>✉ {data.personal.email}</span>}
              {data.personal?.phone && <span>📞 {data.personal.phone}</span>}
              {data.personal?.location && <span>📍 {data.personal.location}</span>}
            </div>
          </div>
          <button type="button" className="v2-edit-profile-btn">
            {isSectionOpen('personal') ? 'Done ▲' : 'Edit Profile ✏️'}
          </button>
        </div>

        {/* Collapsible Profile Inputs */}
        {isSectionOpen('personal') && (
          <div className="v2-entry-grid" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
            {input('Full Name', data.personal?.name || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), name: v } })))}
            {input('Job Title / Headline', data.personal?.jobTitle || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), jobTitle: v } })))}
            {input('Email Address', data.personal?.email || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), email: v } })))}
            {input('Phone Number', data.personal?.phone || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), phone: v } })))}
            {input('Location', data.personal?.location || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), location: v } })))}
            {input('LinkedIn URL', data.personal?.linkedin || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), linkedin: v } })))}
            {input('GitHub URL', data.personal?.github || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), github: v } })))}
            {input('Portfolio Website', data.personal?.website || '', (v) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), website: v } })))}
          </div>
        )}
      </div>

      {/* Professional Summary */}
      <div className="v2-section-card">
        <div className="v2-section-header" onClick={() => toggleSection('summary')}>
          <span className="v2-sec-icon">📝</span>
          <span className="v2-sec-title">Professional Summary</span>
          <span className="v2-sec-arrow">{isSectionOpen('summary') ? '▲' : '▼'}</span>
        </div>
        {isSectionOpen('summary') && (
          <div className="v2-section-body">
            <label className="v2-input-field">
              <span>Summary Text</span>
              <textarea
                rows={4}
                value={data.summary || ''}
                onChange={(e) => updateContent((c) => ({ ...c, summary: e.target.value }))}
                placeholder="Write a compelling 2-3 line career summary..."
              />
            </label>
          </div>
        )}
      </div>

      {/* Experience, Education, Projects */}
      {sections.slice(2).map((sec) =>
        sec.list ? (
          renderListSection(sec)
        ) : (
          <div className="v2-section-card" key={sec.key}>
            <div className="v2-section-header" onClick={() => toggleSection(sec.key)}>
              <span className="v2-sec-icon">{sec.icon}</span>
              <span className="v2-sec-title">{sec.label}</span>
              <span className="v2-sec-arrow">{isSectionOpen(sec.key) ? '▲' : '▼'}</span>
            </div>
            {isSectionOpen(sec.key) && (
              <div className="v2-section-body">
                {sec.key === 'skills' && (
                  <TagInput
                    label="Technical & Professional Skills"
                    tags={asTextList(data.skills)}
                    onChange={(skills) => updateContent((c) => ({ ...c, skills }))}
                  />
                )}
                {sec.key === 'languages' && (
                  <TagInput
                    label="Languages Spoken"
                    tags={asTextList(data.languages)}
                    onChange={(langs) => updateContent((c) => ({ ...c, languages: langs }))}
                  />
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* Add Content Button */}
      <div className="v2-add-content-box">
        <button type="button" className="v2-add-content-main" onClick={() => setAddMenuOpen(!addMenuOpen)}>+ Add Content Section</button>
        {addMenuOpen && (
          <div className="v2-add-content-popover">
            {sections.slice(2).map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => {
                  if (sec.list) addSection(sec.key);
                  else if (!isSectionOpen(sec.key)) toggleSection(sec.key);
                  setAddMenuOpen(false);
                }}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomize = () => {
    const curColor = customization.primaryColor || '#1E293B';
    const colorSwatches = [
      '#1E293B', '#475569', '#0D9488', '#0284C7', '#0EA5E9',
      '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#831843',
      '#E11D48', '#F43F5E', '#FF5722', '#2E7D32', '#6F4E37'
    ];

    return (
      <div className="v2-workspace-scroll" style={{ padding: '4px' }}>
        {/* 1. Design Templates */}
        <div className="cz-card">
          <div className="cz-card-header">
            <h3 className="cz-card-title">🎨 Design Templates</h3>
            <button type="button" className="v2-btn-outline" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => toggleSetting('Design Templates')}>
              {openSettingGroups.includes('Design Templates') ? 'Hide ▲' : 'Show ▼'}
            </button>
          </div>
          <p className="cz-card-subtitle">Update your entire resume design with one click ℹ️</p>

          <div className="v2-template-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {TEMPLATES_META.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cz-option-card ${draft.templateId === t.id ? 'active' : ''}`}
                style={{ padding: '10px 6px', textAlign: 'left', alignItems: 'flex-start' }}
                onClick={() => update((r) => ({ ...r, templateId: t.id }))}
              >
                <span className="label" style={{ fontSize: '12px', fontWeight: 800 }}>{t.name}</span>
                <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>{t.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Layout */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Layout</h3>

          <div className="cz-label">Columns</div>
          <div className="cz-option-grid cz-option-grid-3">
            {[
              { id: '1', label: 'One', icon: '☰' },
              { id: '2', label: 'Two', icon: '☷' },
              { id: 'mix', label: 'Mix', icon: '☶' },
            ].map((col) => (
              <div
                key={col.id}
                className={`cz-option-card ${customization.columns === col.id || (!customization.columns && col.id === '1') ? 'active' : ''}`}
                onClick={() => updateSettings({ columns: col.id as any })}
              >
                <span className="icon">{col.icon}</span>
                <span className="label">{col.label}</span>
              </div>
            ))}
          </div>

          <div className="cz-label" style={{ marginTop: '16px' }}>Change Section Layout</div>
          <div className="cz-reorder-list">
            {[
              { key: 'personal', label: 'Personal Details', icon: '👤' },
              { key: 'summary', label: 'Profile', icon: '📝' },
              { key: 'experience', label: 'Professional Experience', icon: '💼' },
              { key: 'education', label: 'Education', icon: '🎓' },
              { key: 'skills', label: 'Skills', icon: '💡' },
              { key: 'languages', label: 'Languages', icon: '🌐' },
              { key: 'projects', label: 'Projects', icon: '📂' },
              { key: 'page-break', label: 'Page break', icon: '📄' },
            ].map((sec) => (
              <div key={sec.key} className="cz-reorder-item">
                <div>
                  <span className="cz-reorder-handle">⋮⋮</span>
                  <span>{sec.icon}</span>
                  <span style={{ marginLeft: '8px' }}>{sec.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Font Size */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Font Size</h3>

          <TrackStepper
            label="Base Font Size"
            value={customization.fontSize || 9}
            min={7}
            max={14}
            step={0.5}
            unit="pt"
            onChange={(val) => updateSettings({ fontSize: val })}
          />
          <TrackStepper
            label="Full Name"
            value={customization.nameFontSizeOffset ?? 14}
            min={8}
            max={24}
            step={0.5}
            unit="pt"
            onChange={(val) => updateSettings({ nameFontSizeOffset: val })}
          />
          <TrackStepper
            label="Professional Title"
            value={customization.titleFontSizeOffset ?? 6.5}
            min={0}
            max={12}
            step={0.5}
            unit="pt"
            onChange={(val) => updateSettings({ titleFontSizeOffset: val })}
          />
          <TrackStepper
            label="Section Headings"
            value={customization.headingFontSizeOffset ?? 1}
            min={0}
            max={8}
            step={0.5}
            unit="pt"
            onChange={(val) => updateSettings({ headingFontSizeOffset: val })}
          />
          <TrackStepper
            label="Entry Header"
            value={customization.entryHeaderOffset ?? 0}
            min={0}
            max={6}
            step={0.5}
            unit="pt"
            onChange={(val) => updateSettings({ entryHeaderOffset: val })}
          />
        </div>

        {/* 4. Spacing */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Spacing</h3>

          <TrackStepper
            label="Line Height"
            value={customization.lineHeight || 1.1}
            min={0.9}
            max={1.8}
            step={0.05}
            onChange={(val) => updateSettings({ lineHeight: val })}
          />
          <TrackStepper
            label="Space Between Elements"
            value={customization.sectionSpacing || 12}
            min={4}
            max={24}
            step={1}
            unit="px"
            onChange={(val) => updateSettings({ sectionSpacing: val })}
          />
          <TrackStepper
            label="Left & Right Margin"
            value={customization.marginHorizontal || 10}
            min={4}
            max={24}
            step={1}
            unit="mm"
            onChange={(val) => updateSettings({ marginHorizontal: val })}
          />
          <TrackStepper
            label="Top & Bottom Margin"
            value={customization.marginVertical || 10}
            min={4}
            max={24}
            step={1}
            unit="mm"
            onChange={(val) => updateSettings({ marginVertical: val })}
          />
        </div>

        {/* 5. Entry Layout */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Entry Layout</h3>

          <div className="cz-label">Structure</div>
          <div className="cz-option-grid cz-option-grid-2">
            <div
              className={`cz-option-card ${customization.entryStructure !== 'columns' ? 'active' : ''}`}
              onClick={() => updateSettings({ entryStructure: 'full' })}
            >
              <span className="icon">☰</span>
              <span className="label">Full Width</span>
            </div>
            <div
              className={`cz-option-card ${customization.entryStructure === 'columns' ? 'active' : ''}`}
              onClick={() => updateSettings({ entryStructure: 'columns' })}
            >
              <span className="icon">☷</span>
              <span className="label">Columns</span>
            </div>
          </div>

          <div className="cz-label">Date & Location Position</div>
          <div className="cz-segmented-bar">
            <button
              type="button"
              className={`cz-seg-btn ${customization.datePosition !== 'below' ? 'active' : ''}`}
              onClick={() => updateSettings({ datePosition: 'right' })}
            >
              Right
            </button>
            <button
              type="button"
              className={`cz-seg-btn ${customization.datePosition === 'below' ? 'active' : ''}`}
              onClick={() => updateSettings({ datePosition: 'below' })}
            >
              Below Title
            </button>
          </div>

          <div className="cz-label">Entry Header Split</div>
          <div className="cz-segmented-bar">
            <button
              type="button"
              className={`cz-seg-btn ${customization.entryHeaderSplit !== 'manual' ? 'active' : ''}`}
              onClick={() => updateSettings({ entryHeaderSplit: 'auto' })}
            >
              Auto
            </button>
            <button
              type="button"
              className={`cz-seg-btn ${customization.entryHeaderSplit === 'manual' ? 'active' : ''}`}
              onClick={() => updateSettings({ entryHeaderSplit: 'manual' })}
            >
              Manual
            </button>
          </div>
        </div>

        {/* 6. Section Headings */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Section Headings</h3>

          <div className="cz-label">Style</div>
          <div className="cz-style-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div
                key={s}
                className={`cz-style-tile ${(customization.headingStyle || 1) === s ? 'active' : ''}`}
                onClick={() => updateSettings({ headingStyle: s as any })}
              >
                <div style={{
                  width: '80%',
                  height: s === 1 ? '2px' : s === 2 ? '100%' : '3px',
                  background: s === 2 ? '#EEF2FF' : '#6366F1',
                  borderBottom: s === 1 ? '2px solid #6366F1' : 'none',
                  borderRadius: s === 2 ? '4px' : '1px'
                }} />
              </div>
            ))}
          </div>

          <div className="cz-label">Capitalization</div>
          <div className="cz-segmented-bar">
            <button
              type="button"
              className={`cz-seg-btn ${customization.headingCase !== 'uppercase' ? 'active' : ''}`}
              onClick={() => updateSettings({ headingCase: 'capitalize' })}
            >
              Capitalize
            </button>
            <button
              type="button"
              className={`cz-seg-btn ${customization.headingCase === 'uppercase' ? 'active' : ''}`}
              onClick={() => updateSettings({ headingCase: 'uppercase' })}
            >
              Uppercase
            </button>
          </div>

          <div className="cz-label">Icons</div>
          <div className="cz-segmented-bar">
            <button
              type="button"
              className={`cz-seg-btn ${customization.headingIcons === 'none' || !customization.headingIcons ? 'active' : ''}`}
              onClick={() => updateSettings({ headingIcons: 'none' })}
            >
              None
            </button>
            <button
              type="button"
              className={`cz-seg-btn ${customization.headingIcons === 'outline' ? 'active' : ''}`}
              onClick={() => updateSettings({ headingIcons: 'outline' })}
            >
              Outline
            </button>
            <button
              type="button"
              className={`cz-seg-btn ${customization.headingIcons === 'filled' ? 'active' : ''}`}
              onClick={() => updateSettings({ headingIcons: 'filled' })}
            >
              Filled
            </button>
          </div>
        </div>

        {/* 7. Font Selection */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Font</h3>

          <label className="v2-input-field" style={{ marginBottom: '12px' }}>
            <span>Body Font</span>
            <select value={customization.fontFamily || 'Inter'} onChange={(e) => updateSettings({ fontFamily: e.target.value })}>
              <option value="Inter">Inter (Modern Clean)</option>
              <option value="Source Sans Pro">Source Sans Pro</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="Georgia">Georgia (Classic Serif)</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Playfair Display">Playfair Display</option>
            </select>
          </label>

          <label className="v2-input-field">
            <span>Name Font</span>
            <select value={customization.headerFontFamily || 'same'} onChange={(e) => updateSettings({ headerFontFamily: e.target.value })}>
              <option value="same">Same as body font</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Outfit">Outfit</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Georgia">Georgia</option>
            </select>
          </label>
        </div>

        {/* 8. Colors */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Colors</h3>

          <div className="cz-label">Palette Swatches</div>
          <div className="cz-color-grid">
            {colorSwatches.map((hex) => (
              <div
                key={hex}
                className={`cz-color-swatch ${curColor === hex ? 'active' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => updateSettings({ primaryColor: hex })}
              >
                {curColor === hex && <span className="check">✓</span>}
              </div>
            ))}
          </div>

          <div className="cz-label">Apply Accent Color</div>
          <div className="cz-checklist-grid">
            <label className="cz-checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Name</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Job title</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Headings</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Headings line</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Dots/bars/bubbles</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" />
              <span>Dates</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" />
              <span>Link icons</span>
            </label>
            <label className="cz-checkbox-label">
              <input type="checkbox" />
              <span>Header icons</span>
            </label>
          </div>
        </div>

        {/* 9. Header */}
        <div className="cz-card">
          <h3 className="cz-card-title" style={{ marginBottom: '14px' }}>Header</h3>

          <div className="cz-label">Text Alignment</div>
          <div className="cz-option-grid cz-option-grid-2">
            <div
              className={`cz-option-card ${customization.headerAlign !== 'center' ? 'active' : ''}`}
              onClick={() => updateSettings({ headerAlign: 'left' })}
            >
              <span className="icon">📄</span>
              <span className="label">Left</span>
            </div>
            <div
              className={`cz-option-card ${customization.headerAlign === 'center' ? 'active' : ''}`}
              onClick={() => updateSettings({ headerAlign: 'center' })}
            >
              <span className="icon">📄</span>
              <span className="label">Center</span>
            </div>
          </div>

          <div className="cz-label">Details Arrangement</div>
          <div className="cz-segmented-bar">
            <button type="button" className="cz-seg-btn active">Bar (|)</button>
            <button type="button" className="cz-seg-btn">Bullet (•)</button>
            <button type="button" className="cz-seg-btn">Icon</button>
          </div>
        </div>
      </div>
    );
  };

  const runAiAction = async (endpoint: string, body: Record<string, unknown>) => {
    setAiRunning(true);
    setAiResult(null);
    setAiError(null);
    try {
      const result = await api<any>(`/ai-tools/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setAiResult({ tool: endpoint, data: result });
    } catch (err: any) {
      setAiError(err?.message || 'AI request failed. Please try again.');
    } finally {
      setAiRunning(false);
    }
  };

  const renderAi = () => (
    <div className="v2-workspace-scroll">
      <div className="v2-ai-banner">
        <span className="v2-ai-badge-icon">⚡</span>
        <div>
          <h3>Groq AI Intelligence Engine</h3>
          <p>Powered by Llama 3.3 70B · ~300 tokens/sec</p>
        </div>
      </div>

      <div className="v2-ai-cards-grid">
        {[
          { key: 'summary' as const, label: 'Generate Summary', icon: '📝', desc: 'Create ATS summary from resume data' },
          { key: 'grammar' as const, label: 'Check Grammar', icon: 'AB', desc: 'Scan spelling & grammar with suggestions' },
          { key: 'translate' as const, label: 'Translate Resume', icon: '🌐', desc: 'Translate resume into 11 languages' },
          { key: 'cover-letter' as const, label: 'Draft Cover Letter', icon: '📄', desc: 'Write a tailored cover letter' },
        ].map((t) => (
          <div
            key={t.key}
            className={`v2-ai-tool-card ${aiTool === t.key ? 'active' : ''}`}
            onClick={() => { setAiTool(t.key); setAiResult(null); setAiError(null); }}
          >
            <div className="v2-ai-card-left">
              <span className="v2-ai-card-icon">{t.icon}</span>
              <div>
                <strong>{t.label}</strong>
                <small>{t.desc}</small>
              </div>
            </div>
            <button type="button" className="v2-ai-select-btn">{aiTool === t.key ? 'Selected ✓' : 'Select'}</button>
          </div>
        ))}
      </div>

      {/* Action Input Box */}
      <div className="v2-ai-action-box">
        {aiTool === 'summary' && (
          <div>
            <label className="v2-input-field">
              <span>Target Job Title (optional)</span>
              <input value={aiJobTitle} onChange={(e) => setAiJobTitle(e.target.value)} placeholder="e.g. Senior Full Stack Engineer" />
            </label>
            <button type="button" className="v2-btn-pink" disabled={aiRunning} onClick={() => runAiAction('generate-summary', { resumeData: data, jobTitle: aiJobTitle })}>
              {aiRunning ? 'Generating...' : '📝 Generate Summary'}
            </button>
          </div>
        )}

        {aiTool === 'grammar' && (
          <div>
            <label className="v2-input-field">
              <span>Text to Check</span>
              <textarea rows={4} value={aiGrammarText} onChange={(e) => setAiGrammarText(e.target.value)} placeholder="Paste text here..." />
            </label>
            <button type="button" className="v2-btn-pink" disabled={aiRunning || aiGrammarText.trim().length < 10} onClick={() => runAiAction('check-grammar', { text: aiGrammarText })}>
              {aiRunning ? 'Checking...' : 'AB Check Grammar'}
            </button>
          </div>
        )}

        {aiTool === 'translate' && (
          <div>
            <label className="v2-input-field">
              <span>Target Language</span>
              <select value={aiTargetLang} onChange={(e) => setAiTargetLang(e.target.value)}>
                {['French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Russian'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <button type="button" className="v2-btn-pink" disabled={aiRunning} onClick={() => runAiAction('translate', { resumeData: data, targetLanguage: aiTargetLang })}>
              {aiRunning ? 'Translating...' : `🌐 Translate to ${aiTargetLang}`}
            </button>
          </div>
        )}

        {aiTool === 'cover-letter' && (
          <div>
            {input('Job Title', aiJobTitle, setAiJobTitle, 'e.g. Software Engineer')}
            {input('Company Name', aiCompany, setAiCompany, 'e.g. Google')}
            <button type="button" className="v2-btn-pink" disabled={aiRunning || !aiJobTitle || !aiCompany} onClick={() => runAiAction('cover-letter', { resumeData: data, jobTitle: aiJobTitle, companyName: aiCompany, tone: aiCoverTone })}>
              {aiRunning ? 'Drafting...' : '📄 Draft Cover Letter'}
            </button>
          </div>
        )}

        {/* Results */}
        {aiError && <div className="v2-ai-error">⚠️ {aiError}</div>}
        {aiResult?.data?.summary && (
          <div className="v2-ai-result">
            <h4>✨ Generated Summary</h4>
            <p>{aiResult.data.summary}</p>
            <button type="button" className="v2-btn-pink" onClick={() => { updateContent((c) => ({ ...c, summary: aiResult.data.summary })); setAiResult(null); }}>✓ Apply to Resume</button>
          </div>
        )}
        {aiResult?.data?.coverLetter && (
          <div className="v2-ai-result">
            <h4>📄 Cover Letter</h4>
            <pre>{aiResult.data.coverLetter}</pre>
            <button type="button" className="v2-btn-pink" onClick={() => { navigator.clipboard.writeText(aiResult.data.coverLetter); alert('Copied to clipboard!'); }}>📋 Copy to Clipboard</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Shell fullBleed>
      <div className={`v2-editor-root ${mobileView === 'preview' ? 'v2-show-preview' : 'v2-show-editor'}`}>
        {/* Top Toolbar Header */}
        <header className="v2-toolbar">
          <div className="v2-toolbar-left">
            <Link to="/dashboard" className="v2-back-link">← Dashboard</Link>
            
            {/* Mobile View Segmented Switcher */}
            <div className="v2-mobile-view-toggle">
              <button
                type="button"
                className={mobileView === 'editor' ? 'active' : ''}
                onClick={() => setMobileView('editor')}
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                className={mobileView === 'preview' ? 'active' : ''}
                onClick={() => setMobileView('preview')}
              >
                📄 Preview
              </button>
            </div>

            <div className="v2-undo-redo">
              <button type="button" disabled={!history.current.length} onClick={undo}>↩</button>
              <button type="button" disabled={!future.current.length} onClick={redo}>↪</button>
            </div>
          </div>

          <div className="v2-toolbar-center">
            <input
              className="v2-title-input"
              value={draft.title}
              onChange={(e) => update((r) => ({ ...r, title: e.target.value }))}
            />
            <span className="v2-save-status">{saveState === 'saving' ? '⏳ Saving...' : '✓ Saved'}</span>
            {!isCurrentStatePaid && (
              <span className="v2-unpaid-notice-badge" title="Changes to resume text or design require a new ₹30 entitlement">
                Changes require new ₹30 download
              </span>
            )}
            {isCurrentStatePaid && (
              <span className="v2-paid-notice-badge">
                Paid State Unlocked ✓
              </span>
            )}
          </div>

          <div className="v2-toolbar-right">
            <select
              className="v2-template-select"
              value={draft.templateId}
              onChange={(e) => update((r) => ({ ...r, templateId: e.target.value }))}
            >
              {TEMPLATES_META.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <div className="v2-zoom-group">
              <button type="button" onClick={() => { setZoomMode('custom'); setZoom((z) => Math.max(0.3, z - 0.08)); }}>–</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => { setZoomMode('custom'); setZoom((z) => Math.min(1.5, z + 0.08)); }}>+</button>
              <button type="button" onClick={() => setZoomMode('fit')}>Fit</button>
            </div>

            <button type="button" className="v2-ai-trigger-btn" onClick={() => selectWorkspace('ai')}>⚡ AI Assistant</button>
            <button type="button" className="v2-download-btn" onClick={download} disabled={paying}>
              {isCurrentStatePaid ? (
                <>Download PDF 📥</>
              ) : (
                <>Download PDF 📥 <span className="v2-price-tag">₹30</span></>
              )}
            </button>
          </div>
        </header>

        {/* Main Body */}
        <div className="v2-editor-body">
          {/* Left Controls Rail */}
          <aside className="v2-left-panel">
            <nav className="v2-tabs-bar">
              {workspaceItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={workspace === item.key ? 'active' : ''}
                  onClick={() => selectWorkspace(item.key)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="v2-panel-content">
              {workspace === 'overview' && renderOverview()}
              {workspace === 'content' && renderContent()}
              {workspace === 'customize' && renderCustomize()}
              {workspace === 'ai' && renderAi()}
            </div>
          </aside>

          {/* Right A4 Preview */}
          <main className="v2-preview-panel">
            <A4Preview draft={draft} customization={customization} zoomMode={zoomMode} zoom={zoom} onFit={setZoom} />
          </main>
        </div>

        {/* Mobile Floating Download Bar */}
        <div className="v2-mobile-floating-bar">
          <button type="button" className="v2-btn-pink" style={{ flex: 1, height: '44px' }} onClick={download} disabled={paying}>
            {isCurrentStatePaid ? 'Download PDF 📥' : 'Download PDF 📥 (₹30)'}
          </button>
        </div>

        {/* Modal Notice */}
        {paymentNotice && (
          <div className="v2-modal-backdrop" onClick={() => setPaymentNotice(null)}>
            <div className="v2-modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>{paymentNotice.title}</h3>
              <p>{paymentNotice.message}</p>
              <button type="button" className="v2-btn-pink" onClick={() => setPaymentNotice(null)}>Got it</button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
