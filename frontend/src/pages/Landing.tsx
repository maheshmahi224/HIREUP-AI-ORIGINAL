import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo.js';

const resumeSections = [
  { title: 'Profile', lines: ['AIML student building practical products with React, Python, and ML workflows.'] },
  { title: 'Projects', lines: ['Campus interview tracker with role-based dashboards.', 'Resume parser using Python, FastAPI, and transformer embeddings.'] },
  { title: 'Education', lines: ['B.Tech in Artificial Intelligence and Machine Learning', 'Scient Institute of Technology'] },
  { title: 'Skills', lines: ['Python, React, TypeScript, SQL, TensorFlow, Git'] },
];

const templates = [
  { name: 'Steady Form', accent: '#315FEA', serif: false },
  { name: 'Classic Serif', accent: '#6F4E37', serif: true },
  { name: 'Executive Line', accent: '#161616', serif: true },
  { name: 'Modern Column', accent: '#D96C2C', serif: false },
];

const features = [
  ['AI extraction', 'Turns raw notes into sections, entries, skills, and missing detail prompts.'],
  ['Live editor', 'Edit content and document settings while the A4 resume stays visible.'],
  ['One-click templates', 'Switch the entire resume design without rebuilding your content.'],
  ['Pay on download', 'Build, preview, and refine first. Pay only for the final PDF.'],
];

function MiniResume({ variant = 'full', accent = '#6F4E37', serif = false }: { variant?: 'full' | 'compact' | 'editor'; accent?: string; serif?: boolean }) {
  return (
    <div className={`lp-resume lp-resume-${variant} ${serif ? 'serif' : ''}`} style={{ '--resume-accent': accent } as React.CSSProperties}>
      <header>
        <h3>Ananya Sharma</h3>
        <p>AI/ML Student & Frontend Developer</p>
        <div>Hyderabad | ananya@email.com | github.com/ananya</div>
      </header>
      {resumeSections.map((section) => (
        <section key={section.title}>
          <h4>{section.title}</h4>
          {section.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ))}
    </div>
  );
}

function AnimatedTransformFlow() {
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [visibleChecks, setVisibleChecks] = useState<number>(0);
  const [visibleBlocks, setVisibleBlocks] = useState<number>(0);

  const fullText = "I am a BTech AIML student. Built a face attendance app with Python & OpenCV, worked on React dashboards, know SQL, TensorFlow...";
  const extractionItems = ['Education', 'Projects', 'Skills', 'Experience', 'Achievements'];
  const profileBlocks = ['Profile', 'Projects', 'Skills', 'Gaps'];

  useEffect(() => {
    if (isPaused) return;

    let timer: any;
    if (activeStep === 1) {
      if (typedText.length < fullText.length) {
        timer = setTimeout(() => {
          setTypedText(fullText.slice(0, typedText.length + 2));
        }, 30);
      } else {
        timer = setTimeout(() => {
          setActiveStep(2);
        }, 1200);
      }
    } else if (activeStep === 2) {
      if (visibleChecks < extractionItems.length) {
        timer = setTimeout(() => {
          setVisibleChecks((prev) => prev + 1);
        }, 350);
      } else {
        timer = setTimeout(() => {
          setActiveStep(3);
        }, 1200);
      }
    } else if (activeStep === 3) {
      if (visibleBlocks < profileBlocks.length) {
        timer = setTimeout(() => {
          setVisibleBlocks((prev) => prev + 1);
        }, 300);
      } else {
        timer = setTimeout(() => {
          setActiveStep(4);
        }, 1200);
      }
    } else if (activeStep === 4) {
      timer = setTimeout(() => {
        setTypedText('');
        setVisibleChecks(0);
        setVisibleBlocks(0);
        setActiveStep(1);
      }, 3500);
    }

    return () => clearTimeout(timer);
  }, [activeStep, typedText, visibleChecks, visibleBlocks, isPaused]);

  const handleStepClick = (stepNum: number) => {
    setIsPaused(true);
    setActiveStep(stepNum);
    if (stepNum >= 1) setTypedText(fullText);
    if (stepNum >= 2) setVisibleChecks(extractionItems.length);
    if (stepNum >= 3) setVisibleBlocks(profileBlocks.length);
  };

  const stepsInfo = [
    { num: 1, label: 'Raw Notes' },
    { num: 2, label: 'AI Extraction' },
    { num: 3, label: 'Structured' },
    { num: 4, label: 'Finished Resume' },
  ];

  return (
    <div className="transform-flow-container">
      <div className="transform-progress-header">
        <div className="transform-progress-bar">
          <div className="progress-line-track">
            <div className="progress-line-fill" style={{ width: `${((activeStep - 1) / 3) * 100}%` }} />
          </div>
          {stepsInfo.map((s) => (
            <button
              key={s.num}
              type="button"
              className={`step-indicator ${activeStep === s.num ? 'active' : ''} ${activeStep > s.num ? 'completed' : ''}`}
              onClick={() => handleStepClick(s.num)}
              title={`Click to inspect step ${s.num}: ${s.label}`}
            >
              <div className="step-number">{activeStep > s.num ? '✓' : s.num}</div>
              <span className="step-label">{s.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="loop-control-badge" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? '▶ Resume Loop' : '⏸ Pause Loop'}
        </button>
      </div>

      <div className="transform-flow-grid">
        {/* Card 1: Raw Notes */}
        <article className={`transform-card ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
          <div className="card-header-badge">
            <span className="card-title">Raw Notes</span>
            <span className="card-step-tag">{activeStep === 1 ? '⚡ Typing...' : 'Step 1'}</span>
          </div>
          <div className="typing-box">
            {typedText}
            {activeStep === 1 && <span className="blinking-cursor" />}
          </div>
        </article>

        {/* Card 2: AI Extraction */}
        <article className={`transform-card ${activeStep === 2 ? 'active' : ''} ${activeStep > 2 ? 'completed' : ''}`}>
          <div className="card-header-badge">
            <span className="card-title">AI Extraction</span>
            <span className="card-step-tag">{activeStep === 2 ? '🔍 Parsing...' : 'Step 2'}</span>
          </div>
          <ul className="animated-check-list">
            {extractionItems.map((item, idx) => (
              <li key={item} className={`animated-check-item ${visibleChecks > idx || activeStep > 2 ? 'visible' : ''}`}>
                <span className="check-icon">{visibleChecks > idx || activeStep > 2 ? '✓' : '•'}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* Card 3: Structured Profile */}
        <article className={`transform-card ${activeStep === 3 ? 'active' : ''} ${activeStep > 3 ? 'completed' : ''}`}>
          <div className="card-header-badge">
            <span className="card-title">Structured Profile</span>
            <span className="card-step-tag">{activeStep === 3 ? '📐 Mapping...' : 'Step 3'}</span>
          </div>
          <div className="profile-grid-blocks">
            {profileBlocks.map((block, idx) => (
              <div key={block} className={`profile-block ${visibleBlocks > idx || activeStep > 3 ? 'visible' : ''}`}>
                {block}
              </div>
            ))}
          </div>
        </article>

        {/* Card 4: Professional Resume */}
        <article className={`transform-card transform-final ${activeStep === 4 ? 'active' : ''}`}>
          <div className="card-header-badge">
            <span className="card-title">Professional Resume</span>
            <span className="card-step-tag">{activeStep === 4 ? '✨ Complete' : 'Step 4'}</span>
          </div>
          <div className="transform-final-wrap">
            <MiniResume variant="compact" />
          </div>
        </article>
      </div>
    </div>
  );
}

export function Landing() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    { q: 'Is there a subscription?', a: 'No. Build and preview freely, then pay only when you download the final PDF.' },
    { q: 'Will AI make up experience?', a: 'No. HireUp.AI extracts and structures what you provide, then flags missing information for review.' },
    { q: 'Can I change templates later?', a: 'Yes. Your content stays intact while the resume design updates with one click.' },
  ];

  return (
    <div className="landing-page">
      <header className="nav landing-nav">
        <BrandLogo to="/" size="md" />
        <nav>
          <a href="#transform">How it works</a>
          <a href="#demo">Video Demo</a>
          <a href="#editor">Editor</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="nav-actions">
          <Link to="/login" className="landing-login">
            Log in
          </Link>
          <Link className="button" to="/signup">
            Build with AI
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="eyebrow">AI resume builder for serious job seekers</p>
            <h1>
              Dump everything you know.
              <span>Get a professional resume.</span>
            </h1>
            <p className="lead">
              Paste messy notes about your education, projects, internships, and skills. HireUp.AI extracts the career signal, lets you edit it live, and downloads a polished PDF for one clear price.
            </p>
            <div className="price-badge" aria-label="Rupees 30, less than a coffee">
              <span className="coffee-mark" aria-hidden="true" />
              <strong>&#8377;30</strong>
              <span>less than a coffee</span>
            </div>
            <div className="actions">
              <Link className="button" to="/signup">
                Build with AI &rarr;
              </Link>
              <a className="button secondary" href="#demo">
                ▶ Watch Video Demo
              </a>
            </div>
          </div>

          <div className="lp-hero-visual" aria-label="Professional Resume Mockup">
            <div className="hero-image-frame">
              <img
                src="/hero-resume.jpg"
                alt="HireUp.AI Resume Mockup - Big dreams, better resume"
                className="hero-mockup-img"
              />
              <div className="hero-image-badge">
                <span className="coffee-icon">☕</span>
                <div>
                  <strong>Big dreams. Better resume.</strong>
                  <small>AI-Powered Professional Formatting</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Showcase Section */}
        <section id="demo" className="lp-section lp-video-showcase">
          <div className="lp-section-head">
            <p className="eyebrow">Product Showcase</p>
            <h2>Watch HireUp.AI in Action 🎬</h2>
            <p>See how fast you can turn raw career notes into a polished, job-ready resume PDF.</p>
          </div>

          <div className="video-showcase-container">
            <div className="video-glow-effect" />
            <div className="video-player-card">
              <div className="video-header-bar">
                <div className="window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="video-title-badge">🎥 HireUp.AI — Premium Resume Demo</span>
                <span className="live-status-pill"><i className="pulse-dot" /> HD Preview</span>
              </div>

              <div className="video-wrapper">
                <video
                  className="landing-pro-video"
                  src="/Create_a_premium_second_pro.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  Your browser does not support the video element.
                </video>
              </div>

              <div className="video-caption-bar">
                <div className="caption-text">
                  <strong>Instant Resume Builder & Live Customization</strong>
                  <span>Real-time column layout, color isolation, typography controls, and ATS optimization</span>
                </div>
                <Link className="button download-pink-btn" to="/signup">
                  Build Your Resume &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="transform" className="lp-section lp-transform">
          <div className="lp-section-head">
            <p className="eyebrow">From messy notes to finished PDF</p>
            <h2>One clear transformation.</h2>
          </div>
          <AnimatedTransformFlow />
        </section>

        <section className="lp-section">
          <div className="feature-strip">
            {features.map(([title, text]) => (
              <article key={title}>
                <span aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="editor" className="lp-section lp-editor-showcase">
          <div className="lp-section-head">
            <p className="eyebrow">Actual editor workflow</p>
            <h2>This is the tool you use.</h2>
            <p>Controls on the left. A4 resume on the right. Templates, spacing, typography, and colors stay one click away.</p>
          </div>
          <div className="editor-showcase-frame">
            <aside>
              <div className="showcase-tabs">
                <b>Content</b>
                <span>Customize</span>
                <span>AI Tools</span>
              </div>
              {['Profile', 'Professional Experience', 'Education', 'Projects', 'Skills'].map((item, index) => (
                <div className="showcase-row" key={item}>
                  <span>{item}</span>
                  <small>{index < 3 ? 'Open' : 'Collapsed'}</small>
                </div>
              ))}
              <div className="showcase-controls">
                <label>Base font size <b>9pt</b></label>
                <label>Margins <b>10mm</b></label>
                <label>Columns <b>One</b></label>
              </div>
            </aside>
            <div className="showcase-canvas">
              <MiniResume variant="editor" accent="#315FEA" />
            </div>
          </div>
        </section>

        <section id="templates" className="lp-section lp-templates">
          <div className="lp-section-head">
            <p className="eyebrow">Design templates</p>
            <h2>Update your entire resume design with one click.</h2>
          </div>
          <div className="template-gallery">
            {templates.map((template) => (
              <article key={template.name}>
                <MiniResume variant="compact" accent={template.accent} serif={template.serif} />
                <h3>{template.name}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="lp-section lp-pricing">
          <div>
            <p className="eyebrow">Transparent pricing</p>
            <h2>&#8377;30 should be impossible to miss.</h2>
            <p className="lead">No subscription. No hidden fees. Pay only when you are ready to download.</p>
          </div>
          <article className="pricing-card">
            <div className="price-compare">
              <span>Coffee</span>
              <b>&#8377;30-&#8377;50</b>
            </div>
            <div className="price-compare strong">
              <span>Your resume</span>
              <b>&#8377;30</b>
            </div>
            <ul>
              <li>No subscription</li>
              <li>No hidden fees</li>
              <li>Pay only when ready to download</li>
            </ul>
            <Link className="button" to="/signup">
              Start building for free
            </Link>
          </article>
        </section>

        <section id="faq" className="lp-section lp-faq">
          <div className="lp-section-head">
            <p className="eyebrow">Questions</p>
            <h2>Clear answers before you start.</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <button
                key={faq.q}
                className="faq-item"
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                aria-expanded={activeFaq === index}
              >
                <span>{faq.q}</span>
                <i>{activeFaq === index ? '-' : '+'}</i>
                {activeFaq === index && <p>{faq.a}</p>}
              </button>
            ))}
          </div>
        </section>

        <section className="lp-final-cta">
          <h2>
            Your next resume.
            <span>Less than a coffee.</span>
          </h2>
          <p>Build it in minutes. Download it for &#8377;30.</p>
          <Link className="button" to="/signup">
            Build with AI &rarr;
          </Link>
        </section>
      </main>

      <footer className="landing-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px' }}>
        <BrandLogo to="/" size="sm" />
        <span>HireUp.AI &copy; 2026. Professional resumes, human pricing.</span>
      </footer>
    </div>
  );
}
