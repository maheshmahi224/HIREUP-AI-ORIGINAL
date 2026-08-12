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
type ContextPanel = 'settings' | 'ai' | 'ats' | 'templates';
type SectionKey = 'personal' | 'summary' | 'experience' | 'education' | 'projects' | 'skills' | 'languages' | 'awards' | 'certifications' | 'customSections';

const sections: Array<{ key: SectionKey; label: string; icon: string; list?: boolean }> = [
  { key: 'personal', label: 'Profile', icon: '👤' },
  { key: 'summary', label: 'Professional Summary', icon: '📝' },
  { key: 'experience', label: 'Professional Experience', icon: '💼', list: true },
  { key: 'education', label: 'Education', icon: '🎓', list: true },
  { key: 'projects', label: 'Projects', icon: '📁', list: true },
  { key: 'skills', label: 'Skills', icon: '💡' },
  { key: 'languages', label: 'Languages', icon: '🌐' },
  { key: 'awards', label: 'Awards', icon: '🏆', list: true },
  { key: 'certifications', label: 'Certifications', icon: '📜', list: true },
  { key: 'customSections', label: 'Custom Sections', icon: '✨', list: true },
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
    } catch {
      // Non-critical preferences
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function IconButton({ label, children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: React.ReactNode }) {
  return (
    <button type="button" className={`editor-icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

function Toggle({ label, value, onChange, helpText }: { label: string; value: boolean; onChange: (value: boolean) => void; helpText?: string }) {
  return (
    <label className="settings-toggle">
      <div className="toggle-info">
        <span>{label}</span>
        {helpText && <small>{helpText}</small>}
      </div>
      <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function StepperControl({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (val: number) => void }) {
  const dec = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div className="stepper-control">
      <span className="stepper-label">{label}</span>
      <div className="stepper-actions">
        <button type="button" className="stepper-btn" onClick={dec} disabled={value <= min} aria-label={`Decrease ${label}`}>–</button>
        <span className="stepper-value">{value}{unit}</span>
        <button type="button" className="stepper-btn" onClick={inc} disabled={value >= max} aria-label={`Increase ${label}`}>+</button>
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
    <div className="tag-field">
      <label>{label}</label>
      <div className="tag-container">
        {tags.map((tag, idx) => (
          <span className="tag-chip" key={idx}>
            {tag}
            <button type="button" onClick={() => removeTag(idx)} aria-label={`Remove ${tag}`}>✕</button>
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

function SettingsGroup({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const id = `settings-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section className="settings-group">
      <button type="button" className="settings-group-title" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span>{title}</span>
        <i className="accordion-chevron">{open ? '▲' : '▼'}</i>
      </button>
      {open && (
        <div id={id} className="settings-group-body">
          {children}
        </div>
      )}
    </section>
  );
}

function labelFor(item: Data, key: SectionKey, index: number) {
  return item.name || item.title || item.role || item.degree || item.institution || item.company || `${sections.find((section) => section.key === key)?.label} ${index + 1}`;
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

function sentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildSummary(data: Data) {
  const personal = data.personal || {};
  const role = personal.jobTitle || personal.headline || 'career professional';
  const education = listNames(data.education, ['degree', 'institution', 'school']).slice(0, 1).join(' at ');
  const skills = asTextList(data.skills).slice(0, 6);
  const projects = listNames(data.projects, ['name', 'title']).slice(0, 2);
  const parts = [
    `${role} with a practical background in ${skills.length ? skills.join(', ') : 'project execution, communication, and problem solving'}`,
    education ? `trained through ${education}` : '',
    projects.length ? `with project experience including ${projects.join(' and ')}` : '',
  ].filter(Boolean);
  return sentence(parts.join(', '));
}

function listNames(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      const record = item as Data;
      return keys.map((key) => record[key]).filter(Boolean).join(' ');
    })
    .filter(Boolean);
}

function findMissingDetails(data: Data) {
  const missing = [];
  if (!data.personal?.name) missing.push('Add your full name.');
  if (!data.personal?.email) missing.push('Add a professional email address.');
  if (!data.personal?.phone) missing.push('Add a phone number.');
  if (!data.personal?.jobTitle) missing.push('Add a target professional title.');
  if (!data.summary) missing.push('Add a concise professional summary.');
  if (!Array.isArray(data.education) || data.education.length === 0) missing.push('Add at least one education entry.');
  if (!Array.isArray(data.projects) || data.projects.length === 0) missing.push('Add one strong project with technologies and impact.');
  if (!Array.isArray(data.skills) || data.skills.length === 0) missing.push('Add a skills list.');
  return missing;
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
  onFit: (zoom: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoomMode === 'custom') return;
    const measure = () => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const widthZoom = (box.width - 56) / 794;
      const heightZoom = (box.height - 48) / 1123;
      const next = zoomMode === 'width' ? widthZoom : Math.min(widthZoom, heightZoom);
      onFit(Math.max(0.28, Math.min(1.25, next)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [zoomMode, onFit]);

  return (
    <div ref={ref} className="resume-preview-workspace">
      <div className="resume-paper-slot" style={{ width: 794 * zoom, height: 1123 * zoom }}>
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
  const [rightPanel, setRightPanel] = useState<ContextPanel | null>(null);
  const [mobileMode, setMobileMode] = useState<MobileMode>('edit');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openSectionKeys, setOpenSectionKeys] = usePersistentState<SectionKey[]>('hireup.editor.openSections', ['personal', 'summary', 'experience', 'education']);
  const [openSettingGroups, setOpenSettingGroups] = usePersistentState<string[]>('hireup.editor.openSettings', ['Document Settings', 'Design Templates', 'Layout', 'Font Size', 'Spacing', 'Colors']);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [browseTemplatesModal, setBrowseTemplatesModal] = useState(false);
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
  // Tool-specific inputs
  const [aiJobTitle, setAiJobTitle] = useState('');
  const [aiCompany, setAiCompany] = useState('');
  const [aiJobDesc, setAiJobDesc] = useState('');
  const [aiGrammarText, setAiGrammarText] = useState('');
  const [aiTargetLang, setAiTargetLang] = useState('French');
  const [aiCoverTone, setAiCoverTone] = useState<'professional'|'enthusiastic'|'concise'>('professional');
  const [editingProfile, setEditingProfile] = useState(false);

  const history = useRef<Resume[]>([]);
  const future = useRef<Resume[]>([]);
  const hydrated = useRef(false);
  const lastSavedSignature = useRef('');
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), photoUrl: base64 } }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (resumeQuery.data?.resume && !hydrated.current) {
      setDraft(resumeQuery.data.resume);
      lastSavedSignature.current = signature(resumeQuery.data.resume);
      hydrated.current = true;
    }
  }, [resumeQuery.data]);

  const commit = useCallback((next: Resume) => {
    setDraft((current) => {
      if (current && JSON.stringify(current) !== JSON.stringify(next)) {
        history.current.push(clone(current));
        if (history.current.length > 50) history.current.shift();
        future.current = [];
      }
      return next;
    });
  }, []);

  const update = useCallback((change: (current: Resume) => Resume) => {
    setDraft((current) => {
      if (!current) return current;
      const next = change(current);
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        history.current.push(clone(current));
        if (history.current.length > 50) history.current.shift();
        future.current = [];
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setDraft((current) => {
      const previous = history.current.pop();
      if (!current || !previous) return current;
      future.current.push(clone(current));
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setDraft((current) => {
      const next = future.current.pop();
      if (!current || !next) return current;
      history.current.push(clone(current));
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        setRightPanel(null);
        setBrowseTemplatesModal(false);
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [redo, undo]);

  useEffect(() => {
    if (!draft || !hydrated.current) return;
    const currentSignature = signature(draft);
    if (currentSignature === lastSavedSignature.current) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      api<{ resume: Resume }>(`/resumes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: draft.title, templateId: draft.templateId, content: draft.content }),
      })
        .then((response) => {
          queryClient.setQueryData(['resume', id], response);
          lastSavedSignature.current = signature(response.resume);
          setSaveState('saved');
        })
        .catch(() => setSaveState('error'));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, id, queryClient]);

  const data = (draft?.content || {}) as Data;
  const customization = useMemo(() => ({ ...defaultCustomization, ...(data.documentSettings || {}) }) as HireUpCustomization, [data.documentSettings]);
  const completion = calculateCompletion(data);

  const selectWorkspace = (next: WorkspaceKey) => {
    setWorkspace(next);
    if (next === 'ai') setRightPanel('ai');
    setMobileNavOpen(false);
  };

  const updateContent = (mutate: (content: Data) => Data) => update((resume) => ({ ...resume, content: mutate((resume.content || {}) as Data) }));
  const updateSettings = (patch: Partial<HireUpCustomization>) => updateContent((content) => ({ ...content, documentSettings: { ...(content.documentSettings || {}), ...patch } }));
  const list = (key: SectionKey) => (Array.isArray(data[key]) ? (data[key] as Data[]) : []);
  const updateList = (key: SectionKey, items: Data[]) => updateContent((content) => ({ ...content, [key]: items }));
  const isSectionOpen = (key: SectionKey) => openSectionKeys.includes(key);
  const toggleSection = (key: SectionKey) => setOpenSectionKeys((keys) => (keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]));
  const toggleSetting = (title: string) => setOpenSettingGroups((groups) => (groups.includes(title) ? groups.filter((item) => item !== title) : [...groups, title]));

  const addSection = (key: SectionKey) => {
    const base: Data =
      key === 'education'
        ? { id: ids(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }
        : key === 'experience'
          ? { id: ids(), company: '', role: '', startDate: '', endDate: '', description: '', bullets: [] }
          : key === 'projects'
            ? { id: ids(), name: '', description: '', technologies: [] }
            : key === 'certifications'
              ? { id: ids(), name: '', issuer: '', date: '' }
              : key === 'awards'
                ? { id: ids(), title: '', issuer: '', date: '' }
                : { id: ids(), title: 'Custom Section', items: [] };
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

    // Temporarily reset inline zoom transform for high-res capture
    const slot = document.querySelector<HTMLElement>('.resume-paper-slot');
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

  const download = async () => {
    if (!draft) return;
    if (draft.paymentState === 'paid') {
      await exportPdf();
      return;
    }
    setPaying(true);
    setPaymentNotice(null);
    try {
      const order = await api<PaymentOrderInfo>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ resumeId: id }),
      });

      if (order.alreadyPaid) {
        commit({ ...draft, paymentState: 'paid' });
        setPaying(false);
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
        description: 'Resume Premium Export Fee',
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
            commit({ ...draft, paymentState: 'paid' });
            setPaying(false);
            setPaymentNotice({
              type: 'success',
              title: 'Payment Successful! 🎉',
              message: 'Your resume download has been unlocked.',
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
            <div className="coffee-progress-bar">
              <div className="coffee-progress-fill" />
            </div>
            <div className="coffee-tip-badge">
              <span>☕ Recruiter Tip: Resumes with structured bullet points get 40% more callbacks</span>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  const input = (label: string, value: string, change: (value: string) => void, placeholder?: string) => (
    <label className="field">
      <span>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={(event) => change(event.target.value)} />
    </label>
  );

  const selectSetting = <T extends string,>(label: string, value: T, options: { label: string; value: T }[], onChange: (value: T) => void) => (
    <label className="settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );

  const rangeSetting = (label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (value: number) => void) => (
    <label className="settings-range">
      <div className="range-label">
        <span>{label}</span>
        <b>{value}{unit}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );

  const entryFields = (key: SectionKey, item: Data, index: number) => {
    const patch = (field: string, value: any) => {
      const items = [...list(key)];
      items[index] = { ...item, [field]: value };
      updateList(key, items);
    };

    if (key === 'education') {
      return (
        <div className="entry-fields">
          {input('Institution / School', item.institution || item.school || '', (value) => patch('institution', value))}
          {input('Degree', item.degree || '', (value) => patch('degree', value))}
          {input('Field of Study', item.fieldOfStudy || '', (value) => patch('fieldOfStudy', value))}
          {input('Start Date', item.startDate || '', (value) => patch('startDate', value), 'e.g. 2024')}
          {input('End Date', item.endDate || item.year || '', (value) => patch('endDate', value), 'e.g. Present')}
          {input('Location', item.location || '', (value) => patch('location', value))}
          {input('GPA / Grade', item.gpa || item.grade || '', (value) => patch('gpa', value))}
        </div>
      );
    }

    if (key === 'experience') {
      const bullets = Array.isArray(item.bullets) ? item.bullets : [];
      return (
        <div className="entry-fields">
          {input('Company / Employer', item.company || item.employer || '', (value) => patch('company', value))}
          {input('Role / Title', item.role || item.title || '', (value) => patch('role', value))}
          {input('Start Date', item.startDate || '', (value) => patch('startDate', value), 'e.g. 10/2025')}
          {input('End Date', item.endDate || '', (value) => patch('endDate', value), 'e.g. Present')}
          {input('Location', item.location || '', (value) => patch('location', value))}
          <label className="field field-full">
            <span>Summary Description</span>
            <textarea rows={3} value={item.description || ''} onChange={(event) => patch('description', event.target.value)} />
          </label>
          <div className="bullets-editor field-full">
            <label>Key Bullet Highlights</label>
            {bullets.map((bullet: string, bIdx: number) => (
              <div className="bullet-row" key={bIdx}>
                <input
                  value={bullet}
                  onChange={(e) => {
                    const nextBullets = [...bullets];
                    nextBullets[bIdx] = e.target.value;
                    patch('bullets', nextBullets);
                  }}
                  placeholder="Achievement or responsibility..."
                />
                <button
                  type="button"
                  className="bullet-delete-btn"
                  onClick={() => patch('bullets', bullets.filter((_: any, i: number) => i !== bIdx))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-bullet-btn"
              onClick={() => patch('bullets', [...bullets, ''])}
            >
              + Add Bullet Highlight
            </button>
          </div>
        </div>
      );
    }

    if (key === 'projects') {
      const techTags = Array.isArray(item.technologies) ? item.technologies : [];
      return (
        <div className="entry-fields">
          {input('Project Name', item.name || item.title || '', (value) => patch('name', value))}
          {input('Project Link', item.link || '', (value) => patch('link', value), 'https://...')}
          <label className="field field-full">
            <span>Project Description</span>
            <textarea rows={3} value={item.description || ''} onChange={(event) => patch('description', event.target.value)} />
          </label>
          <div className="field-full">
            <TagInput
              label="Technologies Used"
              tags={techTags}
              onChange={(nextTags) => patch('technologies', nextTags)}
            />
          </div>
        </div>
      );
    }

    if (key === 'customSections') {
      return (
        <div className="entry-fields">
          {input('Section Title', item.title || item.name || '', (value) => patch('title', value))}
          <label className="field field-full">
            <span>Items (one per line)</span>
            <textarea rows={4} value={(item.items || []).join('\n')} onChange={(event) => {
              patch('items', event.target.value.split('\n').map((part) => part.trim()).filter(Boolean));
            }} />
          </label>
        </div>
      );
    }

    return (
      <div className="entry-fields">
        {input(key === 'certifications' ? 'Certification Name' : 'Award Title', item.title || item.name || '', (value) => patch(key === 'certifications' ? 'name' : 'title', value))}
        {input('Issuer / Organization', item.issuer || '', (value) => patch('issuer', value))}
        {input('Date', item.date || '', (value) => patch('date', value))}
      </div>
    );
  };

  const renderListSection = (section: (typeof sections)[number]) => {
    const items = list(section.key);
    const opened = isSectionOpen(section.key);
    const bodyId = `section-${section.key}`;
    return (
      <section className="editor-section" key={section.key}>
        <button type="button" className="section-heading" onClick={() => toggleSection(section.key)} aria-expanded={opened} aria-controls={bodyId}>
          <span className="section-icon">{section.icon}</span>
          <span className="section-title-text">{section.label}</span>
          {items.length > 0 && <span className="section-count-badge">{items.length}</span>}
          <i className="section-arrow">{opened ? '▲' : '▼'}</i>
        </button>
        {opened && (
          <div id={bodyId} className="section-body">
            {items.length === 0 && (
              <div className="empty-state">
                <p>No {section.label.toLowerCase()} added yet.</p>
              </div>
            )}
            {items.map((item, index) => {
              const entryId = item.id || `${section.key}-${index}`;
              const expanded = expandedEntry === entryId;
              return (
                <article
                  className="entry-card"
                  key={entryId}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('entry', `${section.key}:${index}`)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    const [source, position] = event.dataTransfer.getData('entry').split(':');
                    if (source === section.key) moveEntry(section.key, Number(position), index);
                  }}
                >
                  <div className="entry-card-header">
                    <button type="button" className="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
                      ⋮⋮
                    </button>
                    <button type="button" className="entry-title-summary" onClick={() => setExpandedEntry(expanded ? null : entryId)} aria-expanded={expanded}>
                      <strong>{labelFor(item, section.key, index)}</strong>
                      <small>{item.company || item.institution || item.issuer || item.location || 'Click to edit'}</small>
                    </button>
                    <div className="entry-card-actions">
                      <IconButton label="Move up" onClick={() => moveEntry(section.key, index, index - 1)} disabled={index === 0}>
                        ↑
                      </IconButton>
                      <IconButton label="Move down" onClick={() => moveEntry(section.key, index, index + 1)} disabled={index === items.length - 1}>
                        ↓
                      </IconButton>
                      <IconButton label="Duplicate entry" onClick={() => duplicateEntry(section.key, item, index)}>
                        ❐
                      </IconButton>
                      <IconButton label="Delete entry" className="delete-action" onClick={() => updateList(section.key, items.filter((_: Data, itemIndex: number) => itemIndex !== index))}>
                        ✕
                      </IconButton>
                      <button type="button" className="expand-chevron" onClick={() => setExpandedEntry(expanded ? null : entryId)}>
                        {expanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>
                  {expanded && <div className="entry-editor-body">{entryFields(section.key, item, index)}</div>}
                </article>
              );
            })}
            <button type="button" className="add-entry-row-btn" onClick={() => addSection(section.key)}>
              + Add Entry
            </button>
          </div>
        )}
      </section>
    );
  };

  const renderOverview = () => (
    <div className="workspace-panel-body">
      <div className="overview-card strong">
        <span>Resume Completion</span>
        <b>{completion}%</b>
        <div className="progress-track">
          <i style={{ width: `${completion}%` }} />
        </div>
      </div>
      <div className="overview-grid">
        <article>
          <span>Profile</span>
          <b>{data.personal?.name ? 'Ready' : 'Incomplete'}</b>
        </article>
        <article>
          <span>Template</span>
          <b>{TEMPLATES_META.find((template) => template.id === draft.templateId)?.name || draft.templateId}</b>
        </article>
        <article>
          <span>Status</span>
          <b>{saveState === 'saved' ? 'Saved' : saveState}</b>
        </article>
      </div>
      <div className="quick-actions">
        <button type="button" className="button" onClick={() => selectWorkspace('content')}>
          Continue Editing
        </button>
        <button type="button" className="button secondary" onClick={() => selectWorkspace('customize')}>
          Customize Design
        </button>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="workspace-panel-body">
      {/* Profile & Photo Header Card */}
      <section className="profile-header-card">
        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoFileChange}
        />
        <div className="profile-card-top">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-preview">
              {data.personal?.photoUrl ? (
                <img src={data.personal.photoUrl} alt="Profile headshot" />
              ) : (
                <span className="avatar-placeholder-icon">👤</span>
              )}
            </div>
            <div className="profile-photo-controls">
              <button
                type="button"
                className="photo-action-btn primary"
                onClick={() => photoInputRef.current?.click()}
                title="Upload photo file from computer"
              >
                📷 Upload Photo
              </button>
              {data.personal?.photoUrl && (
                <button
                  type="button"
                  className="photo-action-btn danger"
                  onClick={() => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), photoUrl: '' } }))}
                  title="Remove photo"
                >
                  ✕ Remove
                </button>
              )}
            </div>
          </div>

          <div className="profile-info-main">
            <div className="profile-name-row">
              <h3>{data.personal?.name || 'Your Full Name'}</h3>
              <button
                type="button"
                className={`profile-toggle-edit-btn ${editingProfile ? 'active' : ''}`}
                onClick={() => setEditingProfile(!editingProfile)}
              >
                {editingProfile ? '✓ Done Editing' : '✏️ Edit Profile'}
              </button>
            </div>
            <p className="profile-job-title">{data.personal?.jobTitle || 'Your Job Title / Headline'}</p>
            <div className="profile-contact-meta">
              {data.personal?.email && <span>✉ {data.personal.email}</span>}
              {data.personal?.phone && <span>📞 {data.personal.phone}</span>}
              {data.personal?.location && <span>📍 {data.personal.location}</span>}
            </div>
          </div>
        </div>

        {editingProfile && (
          <div className="profile-edit-drawer active">
            <div className="drawer-section-title">Personal Details</div>
            {input('Full Name', data.personal?.name || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), name: value } })), 'e.g. Maheshwar Chary')}
            {input('Professional Title', data.personal?.jobTitle || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), jobTitle: value } })), 'e.g. Senior Software Engineer')}
            {input('Email Address', data.personal?.email || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), email: value } })), 'you@example.com')}
            {input('Phone Number', data.personal?.phone || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), phone: value } })), '+91 9876543210')}
            {input('Location / City', data.personal?.location || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), location: value } })), 'Hyderabad, India')}
            {input('Website URL', data.personal?.website || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), website: value } })), 'https://yourwebsite.com')}
            {input('LinkedIn URL', data.personal?.linkedin || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), linkedin: value } })), 'linkedin.com/in/username')}
            {input('GitHub URL', data.personal?.github || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), github: value } })), 'github.com/username')}
            {input('Direct Photo Image URL (Optional)', data.personal?.photoUrl || '', (value) => updateContent((c) => ({ ...c, personal: { ...(c.personal || {}), photoUrl: value } })), 'https://... or upload above')}
          </div>
        )}
      </section>

      {/* Professional Summary Section */}
      <section className="editor-section">
        <button type="button" className="section-heading" onClick={() => toggleSection('summary')} aria-expanded={isSectionOpen('summary')}>
          <span className="section-icon">📝</span>
          <span className="section-title-text">Professional Summary</span>
          <i className="section-arrow">{isSectionOpen('summary') ? '▲' : '▼'}</i>
        </button>
        {isSectionOpen('summary') && (
          <div className="section-body">
            <label className="field">
              <textarea rows={4} value={data.summary || ''} placeholder="Write a summary about your experience and skills..." onChange={(event) => updateContent((content) => ({ ...content, summary: event.target.value }))} />
            </label>
          </div>
        )}
      </section>

      {/* List Sections */}
      {sections.slice(2).map((section) =>
        section.list ? (
          renderListSection(section)
        ) : (
          <section key={section.key} className="editor-section">
            <button type="button" className="section-heading" onClick={() => toggleSection(section.key)} aria-expanded={isSectionOpen(section.key)}>
              <span className="section-icon">{section.icon}</span>
              <span className="section-title-text">{section.label}</span>
              <i className="section-arrow">{isSectionOpen(section.key) ? '▲' : '▼'}</i>
            </button>
            {isSectionOpen(section.key) && (
              <div className="section-body">
                {section.key === 'skills' && (
                  <TagInput
                    label="Skills List"
                    tags={asTextList(data.skills)}
                    onChange={(nextSkills) => updateContent((c) => ({ ...c, skills: nextSkills }))}
                  />
                )}
                {section.key === 'languages' && (
                  <TagInput
                    label="Languages Spoken"
                    tags={asTextList(data.languages)}
                    onChange={(nextLangs) => updateContent((c) => ({ ...c, languages: nextLangs }))}
                  />
                )}
              </div>
            )}
          </section>
        ),
      )}

      {/* Centered Pink Add Content Button */}
      <div className="add-content-container">
        <button type="button" className="add-content-main-btn" onClick={() => setAddMenuOpen(!addMenuOpen)}>
          + Add Content
        </button>
        {addMenuOpen && (
          <div className="add-content-popover">
            {sections
              .filter((section) => section.key !== 'personal' && section.key !== 'summary')
              .map((section) => (
                <button
                  type="button"
                  key={section.key}
                  onClick={() => {
                    if (section.list) addSection(section.key);
                    else if (!isSectionOpen(section.key)) toggleSection(section.key);
                    setAddMenuOpen(false);
                  }}
                >
                  <span className="menu-icon">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomize = () => (
    <div className="workspace-panel-body customize-panel-container">
      {/* 1. Document Settings */}
      <SettingsGroup title="Document Settings" open={openSettingGroups.includes('Document Settings')} onToggle={() => toggleSetting('Document Settings')}>
        {selectSetting('Language', customization.language || 'en-GB', [
          { label: 'English (UK)', value: 'en-GB' },
          { label: 'English (US)', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Hindi', value: 'hi' },
        ], (value) => updateSettings({ language: value }))}

        {selectSetting('Date Format', customization.dateFormat || 'DD/MM/YYYY', [
          { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
          { label: 'MM/YYYY', value: 'MM/YYYY' },
          { label: 'MMM YYYY', value: 'MMM YYYY' },
          { label: 'YYYY', value: 'YYYY' },
        ], (value) => updateSettings({ dateFormat: value }))}

        {selectSetting<'A4' | 'Letter'>('Page Format', customization.pageFormat || 'A4', [
          { label: 'A4', value: 'A4' },
          { label: 'Letter', value: 'Letter' },
        ], (value) => updateSettings({ pageFormat: value }))}
      </SettingsGroup>

      {/* 2. Design Templates */}
      <SettingsGroup title="Design Templates" open={openSettingGroups.includes('Design Templates')} onToggle={() => toggleSetting('Design Templates')}>
        <div className="template-one-click-banner">
          <span>Update your entire resume design with one click 🔄</span>
        </div>
        <div className="template-card-grid">
          {TEMPLATES_META.slice(0, 5).map((template) => (
            <button
              type="button"
              key={template.id}
              className={`template-preset-card ${draft.templateId === template.id ? 'active' : ''}`}
              onClick={() => update((resume) => ({ ...resume, templateId: template.id }))}
            >
              <div className="template-preview-badge">FlowCV Resume Template</div>
              <strong className="template-title">{template.name}</strong>
              <span className="template-id-sub">{template.id}</span>
            </button>
          ))}
        </div>
        <button type="button" className="browse-templates-btn" onClick={() => setBrowseTemplatesModal(true)}>
          Browse templates
        </button>
      </SettingsGroup>

      {/* 3. Layout */}
      <SettingsGroup title="Layout" open={openSettingGroups.includes('Layout')} onToggle={() => toggleSetting('Layout')}>
        <div className="radio-group-field">
          <label>Columns</label>
          <div className="segmented-control">
            {(['one', 'two', 'mix'] as const).map((col) => (
              <button
                type="button"
                key={col}
                className={customization.columns === col ? 'active' : ''}
                onClick={() => updateSettings({ columns: col })}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>

      {/* 4. Font Size */}
      <SettingsGroup title="Font Size" open={openSettingGroups.includes('Font Size')} onToggle={() => toggleSetting('Font Size')}>
        <StepperControl
          label="Base Font Size"
          value={customization.fontSize || 9}
          min={7}
          max={14}
          step={0.5}
          unit="pt"
          onChange={(val) => updateSettings({ fontSize: val })}
        />
        <StepperControl
          label="Full Name"
          value={customization.nameFontSizeOffset ?? 14}
          min={8}
          max={24}
          step={0.5}
          unit="pt"
          onChange={(val) => updateSettings({ nameFontSizeOffset: val })}
        />
        <StepperControl
          label="Professional Title"
          value={customization.titleFontSizeOffset ?? 6.5}
          min={2}
          max={14}
          step={0.5}
          unit="pt"
          onChange={(val) => updateSettings({ titleFontSizeOffset: val })}
        />
        <StepperControl
          label="Section Headings"
          value={customization.headingFontSizeOffset ?? 1}
          min={0}
          max={8}
          step={0.5}
          unit="pt"
          onChange={(val) => updateSettings({ headingFontSizeOffset: val })}
        />
        <StepperControl
          label="Entry Header"
          value={customization.entryHeaderFontSizeOffset ?? 0}
          min={-2}
          max={6}
          step={0.5}
          unit="pt"
          onChange={(val) => updateSettings({ entryHeaderFontSizeOffset: val })}
        />
      </SettingsGroup>

      {/* 5. Spacing */}
      <SettingsGroup title="Spacing" open={openSettingGroups.includes('Spacing')} onToggle={() => toggleSetting('Spacing')}>
        {rangeSetting('Line Height', customization.lineHeight || 1.1, 0.9, 1.8, 0.05, '', (value) => updateSettings({ lineHeight: value }))}
        <StepperControl
          label="Space Between Elements"
          value={customization.spaceEntries || 4}
          min={0}
          max={12}
          step={1}
          onChange={(val) => updateSettings({ spaceEntries: val })}
        />
        <StepperControl
          label="Left & Right Margin"
          value={customization.marginLR || 10}
          min={4}
          max={25}
          step={1}
          unit="mm"
          onChange={(val) => updateSettings({ marginLR: val })}
        />
        <StepperControl
          label="Top & Bottom Margin"
          value={customization.marginTB || 10}
          min={4}
          max={25}
          step={1}
          unit="mm"
          onChange={(val) => updateSettings({ marginTB: val })}
        />
      </SettingsGroup>

      {/* 6. Entry Layout */}
      <SettingsGroup title="Entry Layout" open={openSettingGroups.includes('Entry Layout')} onToggle={() => toggleSetting('Entry Layout')}>
        <div className="radio-group-field">
          <label>Structure</label>
          <div className="segmented-control">
            <button type="button" className={(customization.entryStructure || 'full') === 'full' ? 'active' : ''} onClick={() => updateSettings({ entryStructure: 'full' })}>
              Full Width
            </button>
            <button type="button" className={customization.entryStructure === 'columns' ? 'active' : ''} onClick={() => updateSettings({ entryStructure: 'columns' })}>
              Columns
            </button>
          </div>
        </div>

        <div className="radio-group-field">
          <label>Date & Location Position</label>
          <div className="segmented-control">
            <button type="button" className={(customization.dateLocationPosition || 'right') === 'right' ? 'active' : ''} onClick={() => updateSettings({ dateLocationPosition: 'right' })}>
              Right
            </button>
            <button type="button" className={customization.dateLocationPosition === 'below' ? 'active' : ''} onClick={() => updateSettings({ dateLocationPosition: 'below' })}>
              Below Title
            </button>
          </div>
        </div>

        <div className="radio-group-field">
          <label>Entry Header Split</label>
          <div className="segmented-control">
            <button type="button" className={(customization.subtitlePlacement || 'same') === 'same' ? 'active' : ''} onClick={() => updateSettings({ subtitlePlacement: 'same' })}>
              Auto
            </button>
            <button type="button" className={customization.subtitlePlacement === 'next' ? 'active' : ''} onClick={() => updateSettings({ subtitlePlacement: 'next' })}>
              Manual
            </button>
          </div>
        </div>
      </SettingsGroup>

      {/* 7. Section Headings */}
      <SettingsGroup title="Section Headings" open={openSettingGroups.includes('Section Headings')} onToggle={() => toggleSetting('Section Headings')}>
        <div className="radio-group-field">
          <label>Capitalization</label>
          <div className="segmented-control">
            <button type="button" className={(customization.sectionHeadingCapitalization || 'capitalize') === 'capitalize' ? 'active' : ''} onClick={() => updateSettings({ sectionHeadingCapitalization: 'capitalize' })}>
              Capitalize
            </button>
            <button type="button" className={customization.sectionHeadingCapitalization === 'uppercase' ? 'active' : ''} onClick={() => updateSettings({ sectionHeadingCapitalization: 'uppercase' })}>
              Uppercase
            </button>
          </div>
        </div>

        <div className="radio-group-field">
          <label>Icons</label>
          <div className="segmented-control">
            {(['none', 'outline', 'filled'] as const).map((style) => (
              <button
                type="button"
                key={style}
                className={(customization.sectionIconStyle || 'none') === style ? 'active' : ''}
                onClick={() => updateSettings({ sectionIconStyle: style })}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {selectSetting('Font', customization.sectionHeadingFont || 'body', [
          { label: 'Body Font', value: 'body' },
          { label: 'Name Font', value: 'name' },
        ], (val) => updateSettings({ sectionHeadingFont: val }))}
      </SettingsGroup>

      {/* 8. Font */}
      <SettingsGroup title="Font" open={openSettingGroups.includes('Font')} onToggle={() => toggleSetting('Font')}>
        {selectSetting('Body Font', customization.fontFamily || 'Source Sans Pro', [
          { label: 'Source Sans Pro', value: 'Source Sans Pro' },
          { label: 'Inter', value: 'Inter' },
          { label: 'Arial', value: 'Arial' },
          { label: 'Georgia', value: 'Georgia' },
          { label: 'Garamond', value: 'Garamond' },
        ], (value) => updateSettings({ fontFamily: value }))}

        {selectSetting('Name Font', customization.nameFont || 'Same as body font', [
          { label: 'Same as body font', value: 'Same as body font' },
          { label: 'Playfair Display', value: 'Playfair Display' },
        ], (value) => updateSettings({ nameFont: value }))}
      </SettingsGroup>

      {/* 9. Colors (Interacts with Resume ONLY) */}
      <SettingsGroup title="Colors" open={openSettingGroups.includes('Colors')} onToggle={() => toggleSetting('Colors')}>
        <div className="radio-group-field">
          <label>Color Area</label>
          <div className="segmented-control">
            {(['full', 'header', 'border'] as const).map((area) => (
              <button
                type="button"
                key={area}
                className={(customization.colorArea || 'full') === area ? 'active' : ''}
                onClick={() => updateSettings({ colorArea: area })}
              >
                {area === 'full' ? 'Full Page' : area.charAt(0).toUpperCase() + area.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="color-mode-help-banner">
          Select between single color, multi color or image. Basic colors mode covers the full resume.
        </div>

        <div className="radio-group-field">
          <label>Color Mode</label>
          <div className="segmented-control">
            <button type="button" className={(customization.colorType || 'single') === 'single' ? 'active' : ''} onClick={() => updateSettings({ colorType: 'single' })}>
              Single
            </button>
            <button type="button" className={customization.colorType === 'multi' ? 'active' : ''} onClick={() => updateSettings({ colorType: 'multi' })}>
              Multi
            </button>
            <button type="button" className={customization.colorType === 'image' ? 'active' : ''} onClick={() => updateSettings({ colorType: 'image' })}>
              Image
            </button>
          </div>
        </div>

        <div className="color-mode-description">
          {customization.colorType === 'multi' ? (
            <p>Multi color allows you to choose a combination accent, text and background color.</p>
          ) : customization.colorType === 'image' ? (
            <p>Set the background image. It will have a dark overlay and text will be white.</p>
          ) : (
            <p>Single color enables you to choose a single accent color with black text color on white background.</p>
          )}
        </div>

        <div className="color-pickers-row">
          <label className="color-picker-box">
            <span>Accent Color</span>
            <input type="color" value={customization.accentColor || '#2563EB'} onChange={(event) => updateSettings({ accentColor: event.target.value })} />
          </label>
          {customization.colorType === 'multi' && (
            <>
              <label className="color-picker-box">
                <span>Text Color</span>
                <input type="color" value={customization.colorText || '#111827'} onChange={(event) => updateSettings({ colorText: event.target.value })} />
              </label>
              <label className="color-picker-box">
                <span>Background</span>
                <input type="color" value={customization.colorBackground || '#FFFFFF'} onChange={(event) => updateSettings({ colorBackground: event.target.value })} />
              </label>
            </>
          )}
        </div>

        {customization.colorType === 'image' && (
          {...input('Background Image URL', customization.backgroundImage || '', (value) => updateSettings({ backgroundImage: value }), 'https://...')}
        )}

        <div className="apply-accent-section">
          <strong>Apply Accent Color</strong>
          <div className="toggle-list-grid">
            <Toggle label="Name" value={customization.applyAccentTo?.name ?? true} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, name: v } })} />
            <Toggle label="Job title" value={customization.applyAccentTo?.jobTitle ?? true} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, jobTitle: v } })} />
            <Toggle label="Headings" value={customization.applyAccentTo?.headings ?? true} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, headings: v } })} />
            <Toggle label="Headings line" value={customization.applyAccentTo?.headingsLine ?? true} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, headingsLine: v } })} />
            <Toggle label="Header icons" value={customization.applyAccentTo?.headerIcons ?? false} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, headerIcons: v } })} />
            <Toggle label="Dots/bars/bubbles" value={customization.applyAccentTo?.dotsBars ?? false} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, dotsBars: v } })} />
            <Toggle label="Dates" value={customization.applyAccentTo?.dates ?? false} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, dates: v } })} />
            <Toggle label="Entry subtitle" value={customization.applyAccentTo?.entrySubtitle ?? false} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, entrySubtitle: v } })} />
            <Toggle label="Link icons" value={customization.applyAccentTo?.linkIcons ?? false} onChange={(v) => updateSettings({ applyAccentTo: { ...customization.applyAccentTo, linkIcons: v } })} />
          </div>
        </div>
      </SettingsGroup>

      {/* 10. Header */}
      <SettingsGroup title="Header" open={openSettingGroups.includes('Header')} onToggle={() => toggleSetting('Header')}>
        <div className="radio-group-field">
          <label>Text Alignment</label>
          <div className="segmented-control">
            <button type="button" className={(customization.headerAlignment || 'center') === 'left' ? 'active' : ''} onClick={() => updateSettings({ headerAlignment: 'left' })}>
              Left
            </button>
            <button type="button" className={(customization.headerAlignment || 'center') === 'center' ? 'active' : ''} onClick={() => updateSettings({ headerAlignment: 'center' })}>
              Center
            </button>
          </div>
        </div>

        <div className="radio-group-field">
          <label>Details Arrangement</label>
          <div className="segmented-control">
            {(['icon', 'bullet', 'pipe', 'bar'] as const).map((arr) => (
              <button
                type="button"
                key={arr}
                className={(customization.headerDetailsArrangement || 'pipe') === arr ? 'active' : ''}
                onClick={() => updateSettings({ headerDetailsArrangement: arr })}
              >
                {arr === 'pipe' ? '|' : arr.charAt(0).toUpperCase() + arr.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SettingsGroup>

      {/* 11. Photo */}
      <SettingsGroup title="Photo" open={openSettingGroups.includes('Photo')} onToggle={() => toggleSetting('Photo')}>
        <div className="photo-settings-note">
          Photo design options will appear here once you add a photo in Content → Personal Details 📸
        </div>
      </SettingsGroup>

      {/* 12. Link Styling */}
      <SettingsGroup title="Link Styling" open={openSettingGroups.includes('Link Styling')} onToggle={() => toggleSetting('Link Styling')}>
        <Toggle label="Underline" value={customization.linkUnderline ?? false} onChange={(value) => updateSettings({ linkUnderline: value })} />
        <Toggle label="Blue color" value={customization.linkBlue ?? true} onChange={(value) => updateSettings({ linkBlue: value })} />
        <Toggle label="Link icon" value={customization.linkIcon ?? false} onChange={(value) => updateSettings({ linkIcon: value })} />
      </SettingsGroup>

      {/* 13. Footer */}
      <SettingsGroup title="Footer" open={openSettingGroups.includes('Footer')} onToggle={() => toggleSetting('Footer')}>
        <Toggle label="Page numbers" value={customization.showPageNumbers ?? false} onChange={(value) => updateSettings({ showPageNumbers: value })} />
        <Toggle label="Email" value={customization.showFooterEmail ?? false} onChange={(value) => updateSettings({ showFooterEmail: value })} />
        <Toggle label="Name" value={customization.showFooterName ?? false} onChange={(value) => updateSettings({ showFooterName: value })} />
      </SettingsGroup>
    </div>
  );

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

  const applyGeneratedSummary = () => {
    if (aiResult?.data?.summary) {
      updateContent((c) => ({ ...c, summary: aiResult.data.summary }));
      setAiResult(null);
    }
  };

  const applyTranslation = () => {
    if (aiResult?.data?.translatedResume) {
      commit({ ...draft!, content: aiResult.data.translatedResume });
      setAiResult(null);
    }
  };

  const aiToolsMeta = [
    { key: 'summary' as const, icon: '📝', label: 'Generate Summary', badge: '', desc: 'Turn your resume content into a professional summary.' },
    { key: 'grammar' as const, icon: 'AB', label: 'Check Spelling & Grammar', badge: '', desc: 'Scan for spelling and grammar issues with AI suggestions.' },
    { key: 'translate' as const, icon: '🌐', label: 'Translate Resume', badge: '', desc: 'Create a translated version of your resume.' },
    { key: 'cover-letter' as const, icon: '📄', label: 'Draft Cover Letter', badge: 'Beta', desc: 'Draft a tailored cover letter based on your resume and target job.' },
  ];

  const renderAi = () => (
    <div className="workspace-panel-body">
      <div className="ai-intro-header">
        <span className="ai-intro-icon">⚡</span>
        <div>
          <h3>AI Tools</h3>
          <p>Powered by Groq · Llama 3.3 70B</p>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="ai-tool-cards">
        {aiToolsMeta.map((tool) => (
          <div
            key={tool.key}
            className={`ai-tool-card ${aiTool === tool.key ? 'active' : ''}`}
            onClick={() => { setAiTool(tool.key); setAiResult(null); setAiError(null); }}
          >
            <div className="ai-tool-card-left">
              <span className="ai-tool-icon">{tool.icon}</span>
              <div>
                <span className="ai-tool-label">
                  {tool.label}
                  {tool.badge && <span className="ai-badge">{tool.badge}</span>}
                </span>
                <small className="ai-tool-desc">{tool.desc}</small>
              </div>
            </div>
            <button
              type="button"
              className="ai-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setAiTool(tool.key);
                setAiResult(null);
                setAiError(null);
              }}
            >
              {aiTool === tool.key ? 'Selected ✓' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {/* Active Tool Configuration */}
      <div className="ai-tool-config">
        {aiTool === 'summary' && (
          <div className="ai-config-section">
            <label className="ai-field">
              <span>Target Job Title <small>(optional)</small></span>
              <input
                value={aiJobTitle}
                onChange={(e) => setAiJobTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer, ML Engineer..."
              />
            </label>
            <button
              type="button"
              className="ai-run-btn"
              disabled={aiRunning}
              onClick={() => runAiAction('generate-summary', { resumeData: data, jobTitle: aiJobTitle })}
            >
              {aiRunning ? <><span className="ai-spinner" />Generating...</> : '📝 Generate Summary'}
            </button>
          </div>
        )}

        {aiTool === 'grammar' && (
          <div className="ai-config-section">
            <label className="ai-field">
              <span>Text to Check</span>
              <textarea
                rows={5}
                value={aiGrammarText}
                onChange={(e) => setAiGrammarText(e.target.value)}
                placeholder="Paste any text from your resume to check spelling, grammar, and style..."
              />
            </label>
            <button
              type="button"
              className="ai-run-btn"
              disabled={aiRunning || aiGrammarText.trim().length < 10}
              onClick={() => runAiAction('check-grammar', { text: aiGrammarText, section: 'resume' })}
            >
              {aiRunning ? <><span className="ai-spinner" />Checking...</> : 'AB Check Now'}
            </button>
          </div>
        )}

        {aiTool === 'translate' && (
          <div className="ai-config-section">
            <label className="ai-field">
              <span>Target Language</span>
              <select value={aiTargetLang} onChange={(e) => setAiTargetLang(e.target.value)}>
                {['French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Russian'].map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="ai-run-btn"
              disabled={aiRunning}
              onClick={() => runAiAction('translate', { resumeData: data, targetLanguage: aiTargetLang })}
            >
              {aiRunning ? <><span className="ai-spinner" />Translating...</> : `🌐 Translate to ${aiTargetLang}`}
            </button>
          </div>
        )}

        {aiTool === 'cover-letter' && (
          <div className="ai-config-section">
            <label className="ai-field">
              <span>Job Title <span className="ai-required">*</span></span>
              <input
                value={aiJobTitle}
                onChange={(e) => setAiJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Data Analyst..."
              />
            </label>
            <label className="ai-field">
              <span>Company Name <span className="ai-required">*</span></span>
              <input
                value={aiCompany}
                onChange={(e) => setAiCompany(e.target.value)}
                placeholder="e.g. Google, TCS, Infosys..."
              />
            </label>
            <label className="ai-field">
              <span>Job Description <small>(optional but recommended)</small></span>
              <textarea
                rows={4}
                value={aiJobDesc}
                onChange={(e) => setAiJobDesc(e.target.value)}
                placeholder="Paste the job description here for a more tailored cover letter..."
              />
            </label>
            <label className="ai-field">
              <span>Tone</span>
              <div className="ai-tone-select">
                {(['professional', 'enthusiastic', 'concise'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={aiCoverTone === t ? 'active' : ''}
                    onClick={() => setAiCoverTone(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </label>
            <button
              type="button"
              className="ai-run-btn"
              disabled={aiRunning || !aiJobTitle.trim() || !aiCompany.trim()}
              onClick={() => runAiAction('cover-letter', {
                resumeData: data,
                jobTitle: aiJobTitle,
                companyName: aiCompany,
                jobDescription: aiJobDesc,
                tone: aiCoverTone,
              })}
            >
              {aiRunning ? <><span className="ai-spinner" />Drafting...</> : '📄 Draft Cover Letter'}
            </button>
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className="ai-error-box">
            <span>⚠️ {aiError}</span>
          </div>
        )}

        {/* Results */}
        {aiResult && aiResult.tool === 'generate-summary' && (
          <div className="ai-result-box">
            <div className="ai-result-header">
              <span>✨ Generated Summary</span>
            </div>
            <p className="ai-result-text">{aiResult.data.summary}</p>
            <div className="ai-result-actions">
              <button type="button" className="ai-apply-btn" onClick={applyGeneratedSummary}>
                ✓ Apply to Resume
              </button>
              <button type="button" className="ai-dismiss-btn" onClick={() => setAiResult(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {aiResult && aiResult.tool === 'check-grammar' && (
          <div className="ai-result-box">
            <div className="ai-result-header">
              <span>Grammar Report — Score: <strong>{aiResult.data.score}/100</strong></span>
            </div>
            {aiResult.data.issues?.length > 0 ? (
              <div className="ai-grammar-issues">
                {aiResult.data.issues.map((issue: any, i: number) => (
                  <div key={i} className={`ai-issue ai-issue-${issue.severity}`}>
                    <span className="ai-issue-type">{issue.type}</span>
                    <p><s>{issue.original}</s> → <strong>{issue.suggestion}</strong></p>
                    <small>{issue.explanation}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ai-result-text">✅ No issues found! Your text looks great.</p>
            )}
            {aiResult.data.corrected && (
              <div className="ai-corrected-block">
                <label>Corrected Version:</label>
                <p>{aiResult.data.corrected}</p>
              </div>
            )}
            {aiResult.data.tips?.map((tip: string, i: number) => (
              <p key={i} className="ai-tip">💡 {tip}</p>
            ))}
            <button type="button" className="ai-dismiss-btn" onClick={() => setAiResult(null)}>Dismiss</button>
          </div>
        )}

        {aiResult && aiResult.tool === 'translate' && (
          <div className="ai-result-box">
            <div className="ai-result-header">
              <span>🌐 Translated to {aiResult.data.targetLanguage}</span>
            </div>
            <p className="ai-result-text">Resume content has been translated. Preview first, then apply to your resume.</p>
            <div className="ai-result-actions">
              <button type="button" className="ai-apply-btn" onClick={applyTranslation}>
                ✓ Apply Translation
              </button>
              <button type="button" className="ai-dismiss-btn" onClick={() => setAiResult(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {aiResult && aiResult.tool === 'cover-letter' && (
          <div className="ai-result-box">
            <div className="ai-result-header">
              <span>📄 Cover Letter Draft</span>
            </div>
            <pre className="ai-cover-letter-text">{aiResult.data.coverLetter}</pre>
            <div className="ai-result-actions">
              <button
                type="button"
                className="ai-apply-btn"
                onClick={() => {
                  const el = document.createElement('textarea');
                  el.value = aiResult.data.coverLetter;
                  document.body.appendChild(el);
                  el.select();
                  document.execCommand('copy');
                  document.body.removeChild(el);
                  alert('Cover letter copied to clipboard!');
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button type="button" className="ai-dismiss-btn" onClick={() => setAiResult(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPanelContent = () => {
    if (workspace === 'overview') return renderOverview();
    if (workspace === 'customize') return renderCustomize();
    if (workspace === 'ai') return renderAi();
    return renderContent();
  };

  const renderRightPanel = () => {
    if (!rightPanel) return null;
    return (
      <aside className="right-context-panel" aria-label={`${rightPanel} panel`}>
        <div className="context-header">
          <strong>{rightPanel === 'ats' ? 'ATS Feedback' : 'Document Settings'}</strong>
          <IconButton label="Close right panel" onClick={() => setRightPanel(null)}>
            ✕
          </IconButton>
        </div>
        <div className="context-body">
          {rightPanel === 'settings' && (
            <div className="settings-drawer-content">
              {renderCustomize()}
            </div>
          )}
          {rightPanel === 'ats' && (
            <div className="ats-list">
              <b>{completion}% Complete</b>
              <p>Strong sections: {['Education', 'Projects', 'Skills'].filter((name) => data[name.toLowerCase()]?.length).join(', ') || 'Add content to begin'}.</p>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <Shell fullBleed>
      <div className={`resume-editor premium-editor ${controlPanelCollapsed ? 'panel-collapsed' : ''} ${rightPanel ? 'has-right-panel' : ''} mobile-${mobileMode}`}>
        {/* Rebuilt Top Toolbar */}
        <header className="document-toolbar">
          <div className="toolbar-left">
            <IconButton label="Open mobile navigation" className="mobile-menu-button" onClick={() => setMobileNavOpen(true)}>
              ☰
            </IconButton>
            <Link className="editor-back-nav" to="/dashboard" title="Back to dashboard">
              <span className="back-arrow">←</span>
              <span className="back-text">Dashboard</span>
            </Link>
            <div className="toolbar-divider" />
            <IconButton
              label={controlPanelCollapsed ? 'Show editor panel' : 'Hide editor panel'}
              className="panel-toggle-btn"
              onClick={() => setControlPanelCollapsed(!controlPanelCollapsed)}
            >
              {controlPanelCollapsed ? '▶ Panel' : '◀ Panel'}
            </IconButton>
            <div className="undo-redo-group">
              <IconButton label="Undo (Ctrl+Z)" disabled={!history.current.length} onClick={undo}>
                ↩
              </IconButton>
              <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!future.current.length} onClick={redo}>
                ↪
              </IconButton>
            </div>
          </div>

          <div className="toolbar-center">
            <div className="title-edit-container">
              <input
                className="resume-title-input"
                aria-label="Resume title"
                value={draft.title}
                onChange={(event) => update((resume) => ({ ...resume, title: event.target.value }))}
              />
              <span className="title-pencil">✏️</span>
            </div>
            <span className={`save-status-pill ${saveState}`}>
              {saveState === 'saving' ? '⏳ Saving...' : saveState === 'error' ? '⚠️ Save failed' : '✓ Saved to cloud'}
            </span>
          </div>

          <div className="toolbar-actions">
            <div className="template-select-pill">
              <span className="template-icon">📄</span>
              <select
                aria-label="Resume template"
                value={draft.templateId}
                onChange={(event) => update((resume) => ({ ...resume, templateId: event.target.value }))}
              >
                {TEMPLATES_META.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="zoom-controls-group">
              <button
                type="button"
                className="zoom-btn"
                title="Zoom out"
                onClick={() => { setZoomMode('custom'); setZoom((value) => Math.max(0.28, value - 0.08)); }}
              >
                –
              </button>
              <button type="button" className="zoom-value-badge" onClick={() => setZoomMode('fit')}>
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="zoom-btn"
                title="Zoom in"
                onClick={() => { setZoomMode('custom'); setZoom((value) => Math.min(1.5, value + 0.08)); }}
              >
                +
              </button>
              <button
                type="button"
                className={`zoom-preset-btn ${zoomMode === 'fit' ? 'active' : ''}`}
                onClick={() => setZoomMode('fit')}
              >
                Fit Page
              </button>
              <button
                type="button"
                className={`zoom-preset-btn ${zoomMode === 'width' ? 'active' : ''}`}
                onClick={() => setZoomMode('width')}
              >
                Fit Width
              </button>
            </div>

            <button type="button" className="button ai-panel-trigger-btn" onClick={() => selectWorkspace('ai')}>
              ⚡ AI Assistant
            </button>

            <button type="button" className="button download-premium-btn" onClick={download} disabled={paying}>
              <span>Download PDF 📥</span>
              <span className="price-tag-badge">₹30</span>
            </button>
          </div>
        </header>

        {/* Tab Header Navigation Bar */}
        <nav className="editor-workspace-tabs" aria-label="Editor workspace navigation">
          <div className="workspace-tab-group">
            {workspaceItems.map((item) => (
              <button type="button" key={item.key} className={workspace === item.key ? 'active' : ''} onClick={() => selectWorkspace(item.key)}>
                <span className="workspace-tab-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="workspace-tab-meta">
            <span className="completion-pill">{completion}% complete</span>
          </div>
        </nav>

        {/* Mobile View Toggle Bar */}
        <div className="mobile-editor-tabs">
          <button type="button" className={mobileMode === 'edit' ? 'active' : ''} onClick={() => setMobileMode('edit')}>
            ✏️ Edit
          </button>
          <button type="button" className={mobileMode === 'preview' ? 'active' : ''} onClick={() => setMobileMode('preview')}>
            👁️ Preview
          </button>
        </div>

        {/* Editor Main Content Area */}
        <div className="editor-workspace">
          <aside className="workspace-panel" aria-label={`${workspace} workspace controls`}>
            {renderPanelContent()}
          </aside>

          <main className="preview-panel">
            <A4Preview draft={draft} customization={customization} zoomMode={zoomMode} zoom={zoom} onFit={setZoom} />
          </main>

          {renderRightPanel()}
        </div>

        {/* Browse Templates Modal */}
        {browseTemplatesModal && (
          <div className="modal-backdrop" role="presentation" onClick={() => setBrowseTemplatesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select a Resume Template</h3>
                <IconButton label="Close" onClick={() => setBrowseTemplatesModal(false)}>✕</IconButton>
              </div>
              <div className="modal-body grid-2">
                {TEMPLATES_META.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className={`template-modal-card ${draft.templateId === tmpl.id ? 'active' : ''}`}
                    onClick={() => {
                      update((r) => ({ ...r, templateId: tmpl.id }));
                      setBrowseTemplatesModal(false);
                    }}
                  >
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.description}</p>
                    <span className="badge">{tmpl.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="mobile-nav-backdrop" role="presentation" onMouseDown={() => setMobileNavOpen(false)}>
            <div
              ref={mobileDrawerRef}
              className="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Editor navigation"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="mobile-drawer-head">
                <strong>HireUp.AI</strong>
                <IconButton label="Close menu" onClick={() => setMobileNavOpen(false)}>
                  ✕
                </IconButton>
              </div>
              {workspaceItems.map((item) => (
                <button type="button" key={item.key} className={workspace === item.key ? 'active' : ''} onClick={() => selectWorkspace(item.key)}>
                  <span style={{ marginRight: 8 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Result Notification Modal */}
        {paymentNotice && (
          <div className="modal-backdrop" role="presentation" onClick={() => setPaymentNotice(null)}>
            <div className="modal-content text-center" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>
                {paymentNotice.type === 'success' ? '🎉' : '⚠️'}
              </div>
              <h3 style={{ fontSize: 20, margin: '0 0 8px', color: paymentNotice.type === 'success' ? '#059669' : '#DC2626' }}>
                {paymentNotice.title}
              </h3>
              <p style={{ fontSize: 14, color: '#4B5563', margin: '0 0 20px', lineHeight: 1.5 }}>
                {paymentNotice.message}
              </p>
              <button type="button" className="button" style={{ width: '100%' }} onClick={() => setPaymentNotice(null)}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

