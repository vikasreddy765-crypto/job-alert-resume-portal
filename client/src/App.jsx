import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon.jsx';

async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(isForm ? {} : options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    body: options.body && !isForm && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

const prettyDate = (value) => {
  if (!value) return 'Recently';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
};

function Brand({ onClick, light = false }) {
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={onClick} aria-label="Pathway home"><span className="brand-mark"><span /></span><span>pathway</span></button>;
}

function CompanyMark({ job, small = false }) {
  const initials = job.company.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <span className={`company-mark ${small ? 'company-mark-small' : ''}`} style={{ '--brand': job.companyColor || '#4555f6' }}>{initials}</span>;
}

function JobCard({ job, user, onSelect, onSave, compact = false }) {
  const saved = user?.savedJobs?.includes(job.id);
  return <article className={`job-card ${compact ? 'job-card-compact' : ''}`}>
    <div className="job-card-top"><CompanyMark job={job} /><button className={`icon-button bookmark-button ${saved ? 'is-saved' : ''}`} onClick={() => onSave(job.id)} aria-label={saved ? 'Remove saved job' : 'Save job'} title={saved ? 'Saved' : 'Save job'}><Icon name="bookmark" size={18} /></button></div>
    <button className="job-title-button" onClick={() => onSelect(job)}><h3>{job.title}</h3><span className="company-name">{job.company}</span></button>
    <div className="job-meta"><span><Icon name="location" size={15} />{job.location}</span><span><Icon name="briefcase" size={15} />{job.type}</span></div>
    {!compact && <div className="job-skill-row">{job.skills.slice(0, 3).map((skill) => <span className="skill-pill" key={skill}>{skill}</span>)}</div>}
    <div className="job-card-bottom"><span className="salary-label">{job.salary}</span><button className="text-link" onClick={() => onSelect(job)}>View role <Icon name="arrow" size={15} /></button></div>
  </article>;
}

function Toast({ message, onClose }) {
  useEffect(() => { if (!message) return; const timer = setTimeout(onClose, 3600); return () => clearTimeout(timer); }, [message, onClose]);
  return message ? <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={15} /></span>{message}<button onClick={onClose} aria-label="Dismiss"><Icon name="close" size={15} /></button></div> : null;
}

function AuthDialog({ mode, onMode, onClose, onAuth, busy, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (event) => { event.preventDefault(); onAuth({ name, email, password }); };
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="dialog-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <div className="auth-icon"><Icon name="spark" size={24} /></div>
      <p className="eyebrow">YOUR NEXT CHAPTER</p>
      <h2 id="auth-title">{mode === 'signup' ? 'Make room for what’s next.' : 'Welcome back.'}</h2>
      <p className="dialog-subtitle">{mode === 'signup' ? 'Create an account to save roles and keep every application in one place.' : 'Pick up where your job search left off.'}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <form className="stack-form" onSubmit={submit}>
        {mode === 'signup' && <label>Full name<input autoFocus required minLength="2" maxLength="80" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aanya Sharma" /></label>}
        <label>Email address<input autoFocus={mode === 'login'} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /></label>
        <button className="button button-primary button-full" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create your account' : 'Sign in'}<Icon name="arrow" /></button>
      </form>
      <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to Pathway?'} <button onClick={() => onMode(mode === 'signup' ? 'login' : 'signup')}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
      <p className="auth-footnote"><Icon name="shield" size={14} /> Your details stay private and secure.</p>
    </section>
  </div>;
}

function JobDialog({ job, user, onClose, onAuthNeeded, onApply, busy }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  if (!job) return null;
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="job-dialog" role="dialog" aria-modal="true" aria-labelledby="role-title">
      <button className="dialog-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      <CompanyMark job={job} />
      {job.featured && <span className="featured-tag"><Icon name="spark" size={13} /> Featured</span>}
      <h2 id="role-title">{job.title}</h2><p className="company-name job-dialog-company">{job.company}</p>
      <div className="job-meta job-dialog-meta"><span><Icon name="location" />{job.location}</span><span><Icon name="briefcase" />{job.type}</span><span><Icon name="clock" />{job.experience}</span></div>
      <div className="salary-row"><strong>{job.salary}</strong><span>{job.category}</span></div>
      <h3>About the role</h3><p className="role-description">{job.description}</p>
      <h3>What you’ll bring</h3><div className="job-skill-row">{job.skills.map((skill) => <span className="skill-pill" key={skill}>{skill}</span>)}</div>
      <div className="apply-box">
        {user ? <>
          <label className="cover-label">A short note <span>Optional</span><textarea maxLength="2000" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Share what interests you about this role…" rows="3" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary button-full" disabled={busy} onClick={async () => { try { await onApply(job.id, coverLetter); } catch (e) { setError(e.message); } }}>{busy ? 'Sending application…' : 'Apply for this role'}<Icon name="arrow" /></button>
          <p className="resume-hint"><Icon name="file" size={15} /> Application uses the resume saved on your profile.</p>
        </> : <><p>Sign in to apply, save this role, and keep track of your search.</p><button className="button button-primary button-full" onClick={onAuthNeeded}>Sign in or create an account<Icon name="arrow" /></button></>}
      </div>
    </section>
  </div>;
}

function Landing({ jobs, user, onAuth, onWorkspace, onLogout, onSelectJob, onSave, onBrowse }) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const categories = [
    { icon: 'grid', label: 'Engineering', count: 'Build what’s next', tone: 'lavender' },
    { icon: 'chart', label: 'Data & Analytics', count: 'Make sense of it all', tone: 'mint' },
    { icon: 'spark', label: 'Design', count: 'Shape better experiences', tone: 'peach' },
    { icon: 'people', label: 'Marketing', count: 'Tell a good story', tone: 'blue' },
  ];
  return <div className="landing">
     <header className="site-header"><div className="header-inner"><Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /><nav className="main-nav"><a href="#opportunities">Explore jobs</a><a href="#how-it-works">How it works</a><a href="#about">About Pathway</a></nav><div className="header-actions">{user ? <><button className="header-profile" onClick={onWorkspace}><span className="mini-avatar">{user.name[0]}</span><span>My workspace</span><Icon name="arrowUp" size={14} /></button><button className="button button-outline header-sign-in" onClick={onLogout}>Sign out</button></> : <><button className="button button-quiet" onClick={() => onAuth('login')}>Sign in</button><button className="button button-primary header-create" onClick={() => onAuth('signup')}>Create account<Icon name="arrow" size={15} /></button></>}</div><a className="mobile-workspace" href="#opportunities" aria-label="Explore jobs"><Icon name="search" /></a></div></header>
    <main>
      <section className="hero-section">
        <div className="hero-grid"><div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-dot" />A brighter start to your career</div>
          <h1>Your next step<br />starts <span>somewhere.</span></h1>
          <p className="hero-intro">Find work that fits who you are and who you’re becoming. Thoughtful opportunities, all in one place.</p>
          <form className="hero-search" onSubmit={(e) => { e.preventDefault(); onBrowse({ q: search, location }); }}>
            <label className="hero-search-field"><Icon name="search" size={19} /><span className="sr-only">Job title or skill</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job title or skill" /></label>
            <span className="search-divider" />
            <label className="hero-search-field"><Icon name="location" size={19} /><span className="sr-only">City or remote</span><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" /></label>
            <button className="button button-primary search-submit" type="submit" aria-label="Search jobs"><Icon name="arrow" size={19} /></button>
          </form>
          <p className="popular-searches">Popular: <button onClick={() => onBrowse({ q: 'design' })}>Design</button><button onClick={() => onBrowse({ q: 'intern' })}>Internships</button><button onClick={() => onBrowse({ q: 'remote' })}>Remote</button></p>
        </div>
        <div className="hero-art" aria-label="A preview of the Pathway job search dashboard">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-sun" />
          <div className="hero-dashboard-card"><div className="mock-topline"><span className="mock-logo"><span className="brand-mark"><span /></span>pathway</span><span className="mock-date">YOUR WEEK, AT A GLANCE</span></div><div className="mock-greeting">Good things are<br /><span>in motion.</span></div><div className="mock-stats"><div><span className="mock-stat-num">08</span><span>fresh roles</span></div><div><span className="mock-stat-num">03</span><span>strong matches</span></div><div><span className="mock-stat-num">02</span><span>applications</span></div></div><div className="mock-chart"><span className="chart-label">YOUR SEARCH MOMENTUM</span><div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></div><span className="chart-line" /></div></div>
          <div className="floating-match-card"><div className="floating-match-icon"><Icon name="spark" size={18} /></div><div><span className="floating-caption">A GOOD MATCH</span><strong>Frontend developer</strong><span className="floating-company">Northstar Labs · Bengaluru</span></div><span className="match-score">92%</span></div>
          <div className="floating-note"><span className="note-star">✳</span><span>Your next chapter<br /><strong>looks good on you.</strong></span></div>
        </div></div>
        <div className="hero-proof"><div className="proof-avatars"><span>AS</span><span>RK</span><span>MP</span><span>+</span></div><p>Made for the <strong>very beginning</strong><br />of something good.</p><a href="#opportunities">See what’s out there <Icon name="arrow" size={16} /></a></div>
      </section>
      <section className="category-section" id="opportunities"><div className="section-heading"><div><p className="eyebrow">ROOM TO FIND YOUR THING</p><h2>A little of everything.<br /><span>Something for you.</span></h2></div><button className="text-link section-more" onClick={() => onBrowse({})}>Explore all roles <Icon name="arrow" size={16} /></button></div><div className="category-grid">{categories.map((item, index) => <button key={item.label} className={`category-card category-${item.tone} reveal`} style={{ '--delay': `${index * 60}ms` }} onClick={() => onBrowse({ category: item.label })}><span className="category-icon"><Icon name={item.icon} size={20} /></span><span className="category-label">{item.label}</span><span className="category-count">{item.count}</span><span className="category-arrow"><Icon name="arrowUp" size={17} /></span></button>)}</div></section>
      <section className="featured-section"><div className="section-heading"><div><p className="eyebrow">GOOD PLACES TO BEGIN</p><h2>Fresh roles, <span>fresh starts.</span></h2></div><button className="text-link section-more" onClick={() => onBrowse({})}>View all openings <Icon name="arrow" size={16} /></button></div><div className="job-grid">{jobs.slice(0, 3).map((job, index) => <div className="reveal" key={job.id} style={{ '--delay': `${index * 70}ms` }}><JobCard job={job} user={user} onSelect={onSelectJob} onSave={onSave} /></div>)}</div><div className="featured-footer"><span><Icon name="spark" size={17} /> A few of our latest picks for you</span><button className="button button-outline" onClick={() => onBrowse({})}>Browse all opportunities<Icon name="arrow" size={16} /></button></div></section>
      <section className="how-section" id="how-it-works"><div className="how-intro"><p className="eyebrow">A SEARCH THAT FEELS LIKE YOURS</p><h2>Less noise.<br /><span>More next steps.</span></h2><p>A job search can feel like a lot. We make the small, steady steps feel a little easier.</p><button className="button button-primary" onClick={() => user ? onWorkspace() : onAuth('signup')}>{user ? 'Open your workspace' : 'Find your next step'}<Icon name="arrow" /></button></div><div className="how-steps"><div className="how-step"><span className="step-number">01</span><div><h3>Make it yours</h3><p>Build your profile once. Keep your skills and resume ready whenever the right role appears.</p></div><span className="step-icon tone-purple"><Icon name="user" /></span></div><div className="how-step"><span className="step-number">02</span><div><h3>Find your fit</h3><p>Explore early-career roles by what you care about, where you want to be, and how you like to work.</p></div><span className="step-icon tone-yellow"><Icon name="search" /></span></div><div className="how-step"><span className="step-number">03</span><div><h3>Keep your momentum</h3><p>Save interesting jobs, set an alert, and track your applications in one calm little corner.</p></div><span className="step-icon tone-mint"><Icon name="chart" /></span></div></div></section>
      <section className="cta-section" id="about"><div className="cta-flower">✳</div><div><p className="eyebrow">START WHERE YOU ARE</p><h2>The next step doesn’t<br />have to be a big leap.</h2><p>Just a good place to begin.</p></div><button className="button button-light" onClick={() => user ? onWorkspace() : onAuth('signup')}>Let’s find yours<Icon name="arrow" /></button></section>
    </main>
    <footer className="site-footer"><Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /><span>For wherever you’re headed next.</span><span>© {new Date().getFullYear()} Pathway</span></footer>
  </div>;
}

function Sidebar({ user, section, setSection, onLogout }) {
  const groups = [
    { title: 'YOUR SPACE', items: [{ id: 'overview', icon: 'dashboard', label: 'Overview' }, { id: 'explore', icon: 'search', label: 'Explore jobs' }, { id: 'saved', icon: 'bookmark', label: 'Saved jobs', count: user.savedJobs?.length }, { id: 'applications', icon: 'file', label: 'Applications' }, { id: 'alerts', icon: 'bell', label: 'Job alerts' }] },
    { title: 'ACCOUNT', items: [{ id: 'profile', icon: 'user', label: 'My profile' }] },
  ];
  if (user.role === 'admin') groups.push({ title: 'MANAGEMENT', items: [{ id: 'admin', icon: 'shield', label: 'Admin dashboard' }] });
  return <aside className="workspace-sidebar"><Brand onClick={() => { window.location.href = '/'; }} /><div className="sidebar-welcome"><span className="mini-avatar sidebar-avatar">{user.name[0]}</span><div><span>YOUR WORKSPACE</span><strong>{user.name.split(' ')[0]}'s space</strong></div></div>{groups.map((group) => <div className="sidebar-group" key={group.title}><p>{group.title}</p>{group.items.map((item) => <button key={item.id} className={`sidebar-link ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.count > 0 && <b>{item.count}</b>}</button>)}</div>)}<div className="sidebar-bottom"><div className="sidebar-help"><span className="help-spark"><Icon name="spark" size={18} /></span><strong>Small steps add up.</strong><p>Keep showing up for the future you want.</p></div><button className="sidebar-link" onClick={onLogout}><Icon name="logout" /><span>Sign out</span></button></div></aside>;
}

function PublicExplore({ initialFilters, onHome, onAuth, onSelectJob, onSave }) {
  return <div className="public-browse"><header className="public-browse-header"><Brand onClick={onHome} /><div><span className="public-browse-note">A good place to begin</span><button className="button button-quiet" onClick={() => onAuth('login')}>Sign in</button><button className="button button-primary" onClick={() => onAuth('signup')}>Create account<Icon name="arrow" size={15} /></button></div></header><ExplorePanel initialFilters={initialFilters} onSelectJob={onSelectJob} onSave={onSave} /><footer className="site-footer"><Brand onClick={onHome} /><span>For wherever you’re headed next.</span><button className="text-link" onClick={onHome}>Back to home<Icon name="arrow" size={15} /></button></footer></div>;
}

function Workspace({ user, section, setSection, onLogout, onSelectJob, onSave, refresh, onRefresh, initialFilters }) {
  const titleBySection = { overview: 'Your overview', explore: 'Find your next role', saved: 'Saved for later', applications: 'Your applications', alerts: 'A little heads-up', profile: 'Your profile', admin: 'The big picture' };
  return <div className="workspace-layout"><Sidebar user={user} section={section} setSection={setSection} onLogout={onLogout} />
    <main className="workspace-main"><header className="workspace-topbar"><div><span className="breadcrumb">PATHWAY <Icon name="chevron" size={12} /> MY SPACE</span><h1>{titleBySection[section] || 'Your workspace'}</h1></div><div className="topbar-actions"><span className="topbar-date"><Icon name="clock" size={15} />Your search, your pace</span><button className="mini-avatar topbar-avatar" onClick={() => setSection('profile')} title="Open your profile">{user.name[0]}</button></div></header>
      {section === 'overview' && <OverviewPanel user={user} setSection={setSection} onSelectJob={onSelectJob} onSave={onSave} refresh={refresh} />}
       {section === 'explore' && <ExplorePanel user={user} onSelectJob={onSelectJob} onSave={onSave} initialFilters={initialFilters} />}
      {section === 'saved' && <SavedPanel user={user} onSelectJob={onSelectJob} onSave={onSave} refresh={refresh} />}
      {section === 'applications' && <ApplicationsPanel refresh={refresh} />}
      {section === 'alerts' && <AlertsPanel onToast={onToast} />}
      {section === 'profile' && <ProfilePanel user={user} setUser={setUser} onToast={onToast} />}
      {section === 'admin' && user.role === 'admin' && <AdminPanel onToast={onToast} refresh={refresh} onRefresh={onRefresh} />}
    </main>
  </div>;
}

function PanelHeading({ kicker, title, text, action }) {
  return <div className="panel-heading"><div><p className="eyebrow">{kicker}</p><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>;
}

function EmptyState({ icon = 'spark', title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={24} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function OverviewPanel({ user, setSection, onSelectJob, onSave, refresh }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { Promise.all([api('/jobs'), api('/applications/mine'), api('/alerts')]).then(([j, a, r]) => { setJobs(j.jobs); setApplications(a.applications); setAlerts(r.alerts); }).catch(() => {}); }, [refresh]);
  const missing = [!user.headline, !user.location, !user.skills?.length, !user.resume].filter(Boolean).length;
  const completeness = Math.max(25, Math.round(((4 - missing) / 4) * 100));
  return <div className="workspace-content">
    <section className="welcome-banner"><div><p className="eyebrow">A FRESH START, {new Date().toLocaleDateString('en', { weekday: 'long' }).toUpperCase()}</p><h2>Good to have you here, <span>{user.name.split(' ')[0]}.</span></h2><p>Your next step might be smaller than you think. Let’s find it.</p></div><div className="welcome-illustration"><span className="welcome-orbit" /><span className="welcome-asterisk">✳</span><span className="welcome-plant">↗</span></div></section>
    <div className="metric-grid"><Metric icon="bookmark" label="Saved roles" value={user.savedJobs?.length || 0} tone="lavender" onClick={() => setSection('saved')} /><Metric icon="file" label="Applications" value={applications.length} tone="peach" onClick={() => setSection('applications')} /><Metric icon="bell" label="Job alerts" value={alerts.length} tone="mint" onClick={() => setSection('alerts')} /></div>
    <section className="profile-progress-card"><div className="progress-copy"><span className="progress-icon"><Icon name="user" /></span><div><strong>Make your profile work for you</strong><p>{completeness === 100 ? 'Looking good — your profile is ready to go.' : `A few details help the right opportunities find you. ${missing} ${missing === 1 ? 'step' : 'steps'} to go.`}</p></div></div><div className="progress-track"><span style={{ width: `${completeness}%` }} /></div><strong className="progress-percent">{completeness}%</strong><button className="text-link" onClick={() => setSection('profile')}>{completeness === 100 ? 'View profile' : 'Complete profile'}<Icon name="arrow" size={15} /></button></section>
    <div className="panel-heading dashboard-section-heading"><div><p className="eyebrow">PICKED FOR YOUR SEARCH</p><h2>A few roles to get you going.</h2></div><button className="text-link" onClick={() => setSection('explore')}>Explore all <Icon name="arrow" size={15} /></button></div>
    {jobs.length ? <div className="job-grid dashboard-job-grid">{jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} user={user} onSelect={onSelectJob} onSave={onSave} compact />)}</div> : <EmptyState title="Your next role is around the corner." text="Check back soon for new opportunities." />}
  </div>;
}

function Metric({ icon, label, value, tone, onClick }) {
  return <button className="metric-card" onClick={onClick}><span className={`metric-icon tone-${tone}`}><Icon name={icon} size={19} /></span><span className="metric-label">{label}</span><span className="metric-value">{value}</span><span className="metric-go"><Icon name="arrowUp" size={15} /></span></button>;
}

function ExplorePanel({ user, onSelectJob, onSave, initialFilters = {} }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialFilters.q || '');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [type, setType] = useState(initialFilters.type || '');
  const [filters, setFilters] = useState(initialFilters);
  useEffect(() => { setLoading(true); api(`/jobs?${new URLSearchParams(filters)}`).then((data) => setJobs(data.jobs)).catch(() => setJobs([])).finally(() => setLoading(false)); }, [filters]);
  const submit = (e) => { e.preventDefault(); setFilters({ q, location, category, type }); };
  return <div className="workspace-content"><PanelHeading kicker="MADE FOR YOUR NEXT CHAPTER" title="The right fit is out there." text="Search at your own pace. Save what catches your eye." />
    <form className="filter-bar" onSubmit={submit}><label><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Role, company, or skill" /></label><label><Icon name="location" /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" /></label><label className="select-filter"><Icon name="filter" /><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{['Engineering', 'Data & Analytics', 'Design', 'Marketing', 'Business', 'People & Community'].map((c) => <option key={c}>{c}</option>)}</select></label><label className="select-filter"><Icon name="briefcase" /><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Any type</option>{['Full-time', 'Part-time', 'Internship', 'Contract'].map((c) => <option key={c}>{c}</option>)}</select></label><button className="button button-primary filter-submit">Search roles</button></form>
    <div className="result-summary"><span>{loading ? 'Finding roles…' : `${jobs.length} ${jobs.length === 1 ? 'opportunity' : 'opportunities'} to explore`}</span><span>Thoughtful picks for early careers</span></div>
    {loading ? <div className="loading-grid">{[1, 2, 3].map((i) => <div className="skeleton-card" key={i} />)}</div> : jobs.length ? <div className="job-grid">{jobs.map((job) => <JobCard job={job} user={user} onSelect={onSelectJob} onSave={onSave} key={job.id} />)}</div> : <EmptyState icon="search" title="No roles match those filters yet." text="Try a broader search or clear a filter to see more." action={<button className="button button-outline" onClick={() => { setQ(''); setLocation(''); setCategory(''); setType(''); setFilters({}); }}>Clear filters</button>} />}
  </div>;
}

function SavedPanel({ user, onSelectJob, onSave, refresh, setSection }) {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { api('/saved/jobs').then((data) => setJobs(data.jobs)).catch(() => setJobs([])); }, [refresh]);
  return <div className="workspace-content"><PanelHeading kicker="GOOD ONES TO COME BACK TO" title="Saved for later." text="Keep the roles you’re thinking about close at hand." />{jobs.length ? <div className="job-grid">{jobs.map((job) => <JobCard key={job.id} job={job} user={user} onSelect={onSelectJob} onSave={onSave} />)}</div> : <EmptyState icon="bookmark" title="Your shortlist starts here." text="Save a role that feels promising and it’ll be waiting here when you’re ready." action={<button className="button button-primary" onClick={() => setSection('explore')}>Explore roles<Icon name="arrow" /></button>} />}</div>;
}

function ApplicationsPanel({ refresh }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api('/applications/mine').then((data) => setItems(data.applications)).catch(() => setItems([])); }, [refresh]);
  return <div className="workspace-content"><PanelHeading kicker="EVERY STEP COUNTS" title="Your applications." text="The roles you’ve taken a chance on, all in one place." />{items.length ? <div className="application-list">{items.map((item) => <article className="application-row" key={item.id}><CompanyMark job={item.job} /><div className="application-main"><strong>{item.job.title}</strong><span>{item.job.company} · {item.job.location}</span></div><span className={`status-pill status-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span><span className="application-date">Applied {prettyDate(item.createdAt)}</span></article>)}</div> : <EmptyState icon="file" title="Every application starts somewhere." text="When you apply for a role, we’ll keep its status here." />}</div>;
}

function AlertsPanel({ onToast }) {
  const [alerts, setAlerts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { const [a, m] = await Promise.all([api('/alerts'), api('/alerts/matches')]); setAlerts(a.alerts); setMatches(m.matches); }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const create = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await api('/alerts', { method: 'POST', body: { title, keywords, location, category } }); setTitle(''); setKeywords(''); setLocation(''); setCategory(''); await load(); onToast('Your new job alert is ready.'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const remove = async (id) => { try { await api(`/alerts/${id}`, { method: 'DELETE' }); await load(); onToast('Alert removed.'); } catch (e) { setError(e.message); } };
  return <div className="workspace-content"><PanelHeading kicker="THE RIGHT THING, AT THE RIGHT TIME" title="A little heads-up." text="Set a search once. We’ll surface matching openings here when you visit." />
    <section className="alert-create-card"><div className="alert-form-intro"><span className="alert-bell"><Icon name="bell" size={20} /></span><div><strong>Set up a job alert</strong><p>Choose what you’re looking for. Update or remove it whenever you like.</p></div></div>{error && <p className="form-error">{error}</p>}<form className="alert-form" onSubmit={create}><label>Alert name<input required maxLength="100" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Junior design roles" /></label><label>Keywords<input maxLength="120" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="React, design, analyst…" /></label><label>Location<input maxLength="100" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" /></label><label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Any category</option>{['Engineering', 'Data & Analytics', 'Design', 'Marketing', 'Business', 'People & Community'].map((c) => <option key={c}>{c}</option>)}</select></label><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Create alert'}<Icon name="plus" /></button></form></section>
    {alerts.length === 0 ? <EmptyState icon="bell" title="No alerts just yet." text="Create an alert and matching roles will be gathered in one place for you." /> : matches.map((item) => <section className="alert-match-section" key={item.id}><div className="alert-list-title"><div><span className="alert-active-dot" /><h3>{item.title}</h3><span className="match-count">{item.matches.length} {item.matches.length === 1 ? 'match' : 'matches'}</span></div><button className="text-link delete-link" onClick={() => remove(item.id)}>Remove alert</button></div>{item.matches.length ? <div className="alert-match-list">{item.matches.slice(0, 3).map((job) => <article className="alert-match-row" key={job.id}><CompanyMark job={job} small /><div><strong>{job.title}</strong><span>{job.company} · {job.location}</span></div><span className="alert-match-salary">{job.salary}</span></article>)}</div> : <p className="no-matches">No roles match this search at the moment. We’ll check again when you return.</p>}</section>)}
  </div>;
}

function ProfilePanel({ user, setUser, onToast }) {
  const [form, setForm] = useState({ name: user.name, headline: user.headline || '', location: user.location || '', about: user.about || '', skills: user.skills?.join(', ') || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resumeBusy, setResumeBusy] = useState(false);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const save = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { const data = await api('/profile', { method: 'PATCH', body: form }); setUser(data.user); onToast('Your profile has been updated.'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const upload = async (e) => { const file = e.target.files?.[0]; if (!file) return; setResumeBusy(true); setError(''); const body = new FormData(); body.append('resume', file); try { const data = await api('/profile/resume', { method: 'POST', body }); setUser(data.user); onToast('Your resume is ready to use.'); } catch (e) { setError(e.message); } finally { setResumeBusy(false); e.target.value = ''; } };
  const removeResume = async () => { try { const data = await api('/profile/resume', { method: 'DELETE' }); setUser(data.user); onToast('Your resume has been removed.'); } catch (e) { setError(e.message); } };
  const downloadResume = async () => { try { const response = await fetch('/api/profile/resume', { credentials: 'include' }); if (!response.ok) throw new Error('Your resume could not be downloaded.'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = user.resume.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (e) { setError(e.message); } };
  return <div className="workspace-content"><PanelHeading kicker="THE PERSON BEHIND THE PROFILE" title="Tell us a little about you." text="A few details make it easier for the right role to find you." />
    <div className="profile-layout"><form className="profile-form-card" onSubmit={save}><div className="profile-form-top"><span className="profile-big-avatar">{form.name?.[0] || '?'}</span><div><strong>Your profile</strong><span>Only shared when you apply</span></div></div>{error && <p className="form-error">{error}</p>}<div className="profile-fields"><label>Full name<input required minLength="2" maxLength="80" value={form.name} onChange={(e) => update('name', e.target.value)} /></label><label>Email address<input value={user.email} readOnly /></label><label className="field-full">Headline<input maxLength="120" value={form.headline} onChange={(e) => update('headline', e.target.value)} placeholder="e.g. Computer science student · Frontend developer" /></label><label className="field-full">Location<input maxLength="100" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="City, country, or open to remote" /></label><label className="field-full">About you<textarea maxLength="1000" rows="4" value={form.about} onChange={(e) => update('about', e.target.value)} placeholder="A little about what you enjoy learning or building…" /></label><label className="field-full">Skills <span className="label-hint">Separate with commas</span><input value={form.skills} onChange={(e) => update('skills', e.target.value)} placeholder="React, writing, research…" /></label></div><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}<Icon name="check" /></button></form>
      <aside className="resume-card"><span className="resume-card-icon"><Icon name="file" size={21} /></span><p className="eyebrow">READY WHEN YOU ARE</p><h3>Your resume.</h3><p>Upload a PDF or Word document up to 5 MB. We attach it when you apply.</p>{user.resume ? <div className="uploaded-resume"><span className="file-mini"><Icon name="file" size={19} /></span><div><strong>{user.resume.name}</strong><span>Uploaded {prettyDate(user.resume.uploadedAt)}</span></div></div> : <div className="resume-drop"><Icon name="upload" size={20} /><strong>PDF, DOC, or DOCX</strong><span>Up to 5 MB</span></div>}<label className="button button-outline resume-upload-button">{resumeBusy ? 'Uploading…' : user.resume ? 'Replace resume' : 'Upload your resume'}<Icon name="upload" size={16} /><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={resumeBusy} onChange={upload} /></label>{user.resume && <div className="resume-actions"><button className="text-link" onClick={downloadResume}><Icon name="download" size={15} />Download</button><button className="text-link delete-link" onClick={removeResume}>Remove</button></div>}<p className="privacy-note"><Icon name="shield" size={15} /> Your resume is private until you apply.</p></aside></div>
  </div>;
}

const emptyJob = { title: '', company: '', location: '', type: 'Full-time', category: 'Engineering', experience: 'Entry level', salary: '', description: '', skills: '', featured: false, companyColor: '#2854dc' };
function AdminPanel({ onToast, refresh, onRefresh }) {
  const [stats, setStats] = useState({ jobs: 0, students: 0, applications: 0, alerts: 0 });
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => { const [o, j] = await Promise.all([api('/admin/overview'), api('/admin/jobs')]); setStats(o.stats); setApplications(o.applications); setJobs(j.jobs); }, [refresh]);
  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { setForm(emptyJob); setEditing(''); setError(''); };
  const save = async (e) => { e.preventDefault(); setBusy(true); setError(''); const body = { ...form, skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) }; try { await api(editing ? `/admin/jobs/${editing}` : '/admin/jobs', { method: editing ? 'PATCH' : 'POST', body }); reset(); await load(); onRefresh(); onToast(editing ? 'Role details updated.' : 'New role published.'); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const edit = (job) => { setEditing(job.id); setForm({ ...job, skills: job.skills.join(', ') }); document.querySelector('.admin-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const remove = async (job) => { if (!window.confirm(`Remove “${job.title}” from the listings?`)) return; try { await api(`/admin/jobs/${job.id}`, { method: 'DELETE' }); await load(); onRefresh(); onToast('Role removed.'); } catch (e) { setError(e.message); } };
  const updateApplication = async (application, status) => { setStatusBusy(application.id); setError(''); try { await api(`/admin/applications/${application.id}`, { method: 'PATCH', body: { status } }); await load(); onToast('Application status updated.'); } catch (e) { setError(e.message); } finally { setStatusBusy(''); } };
  const downloadApplicationResume = async (application) => { try { const response = await fetch(`/api/admin/applications/${application.id}/resume`, { credentials: 'include' }); if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || 'This resume could not be downloaded.'); } const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = application.resumeName || 'resume'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (e) { setError(e.message); } };
  return <div className="workspace-content"><PanelHeading kicker="A HEALTHY LITTLE MARKETPLACE" title="The big picture." text="Keep roles fresh and see how students are moving forward." />
    <div className="admin-metrics"><Metric icon="briefcase" label="Open roles" value={stats.jobs} tone="lavender" /><Metric icon="users" label="Student accounts" value={stats.students} tone="mint" /><Metric icon="file" label="Applications" value={stats.applications} tone="peach" /><Metric icon="bell" label="Active alerts" value={stats.alerts} tone="blue" /></div>
    {error && <p className="form-error">{error}</p>}<div className="admin-columns"><section className="admin-form-card"><div className="admin-card-heading"><div><p className="eyebrow">{editing ? 'MAKE A QUICK UPDATE' : 'ADD SOMETHING NEW'}</p><h3>{editing ? 'Edit this role' : 'Post a new role'}</h3></div>{editing && <button className="icon-button" onClick={reset} aria-label="Cancel editing"><Icon name="close" /></button>}</div><form className="admin-job-form" onSubmit={save}><div className="form-two"><label>Job title<input required maxLength="120" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Frontend developer" /></label><label>Company<input required maxLength="100" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Company name" /></label></div><div className="form-two"><label>Location<input required maxLength="100" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru or Remote" /></label><label>Job type<select value={form.type} onChange={(e) => set('type', e.target.value)}>{['Full-time', 'Part-time', 'Internship', 'Contract'].map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="form-two"><label>Category<input maxLength="60" value={form.category} onChange={(e) => set('category', e.target.value)} /></label><label>Experience<input maxLength="60" value={form.experience} onChange={(e) => set('experience', e.target.value)} /></label></div><div className="form-two"><label>Salary<input maxLength="60" value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="₹6–9 LPA" /></label><label>Skills <span className="label-hint">Comma-separated</span><input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="React, CSS, JavaScript" /></label></div><label>Description<textarea required maxLength="6000" rows="4" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell students what they’ll work on…" /></label><label className="checkbox-label"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Highlight this role as featured</label><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update role' : 'Publish role'}<Icon name={editing ? 'check' : 'plus'} /></button></form></section>
      <section className="admin-list-card"><div className="admin-card-heading"><div><p className="eyebrow">LIVE ON PATHWAY</p><h3>Your job listings <span>{jobs.length}</span></h3></div><span className="live-status"><i />Live</span></div><div className="admin-job-list">{jobs.map((job) => <article className="admin-job-row" key={job.id}><CompanyMark job={job} small /><div><strong>{job.title}</strong><span>{job.company} · {job.location}</span></div><button className="icon-button" onClick={() => edit(job)} aria-label={`Edit ${job.title}`}><Icon name="edit" size={16} /></button><button className="icon-button delete-button" onClick={() => remove(job)} aria-label={`Delete ${job.title}`}><Icon name="close" size={16} /></button></article>)}</div></section></div>
     <section className="recent-admin-apps"><div className="admin-card-heading"><div><p className="eyebrow">A FEW RECENT STEPS</p><h3>Latest applications</h3></div></div>{applications.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>Role</th><th>Resume</th><th>Status</th><th>Applied</th></tr></thead><tbody>{applications.map((app) => <tr key={app.id}><td><strong>{app.user?.name || 'Student'}</strong><span>{app.user?.email || ''}</span></td><td>{app.job?.title || 'Role removed'}</td><td><button className="text-link admin-download" disabled={!app.resumeName} onClick={() => downloadApplicationResume(app)} title={app.resumeName || 'No resume available'}>{app.resumeName ? 'Download' : 'Unavailable'}<Icon name="download" size={13} /></button></td><td><select className="admin-status-select" aria-label={`Update status for ${app.user?.name || 'student'}`} value={app.status} disabled={statusBusy === app.id} onChange={(event) => updateApplication(app, event.target.value)}>{['Submitted', 'In review', 'Interview', 'Declined'].map((status) => <option key={status}>{status}</option>)}</select></td><td>{prettyDate(app.createdAt)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Applications will show up here as students start applying.</p>}</section>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState('landing');
  const [section, setSection] = useState('overview');
  const [authMode, setAuthMode] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [homeJobs, setHomeJobs] = useState([]);
  const [exploreFilters, setExploreFilters] = useState({});
  useEffect(() => { api('/auth/me').then((data) => setUser(data.user)).catch(() => {}).finally(() => setAuthChecked(true)); api('/jobs').then((data) => setHomeJobs(data.jobs)).catch(() => {}); }, []);
  useEffect(() => { const nodes = document.querySelectorAll('.reveal:not(.will-reveal)'); if (!nodes.length) return; const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } }), { threshold: 0.1 }); nodes.forEach((node) => { node.classList.add('will-reveal'); observer.observe(node); }); return () => observer.disconnect(); }, [page, homeJobs.length]);
  const notify = useCallback((message) => setToast(message), []);
  const closeToast = useCallback(() => setToast(''), []);
  const workspace = () => { setPage('workspace'); setSection('overview'); setRefresh((value) => value + 1); window.scrollTo(0, 0); };
  const openAuth = (mode) => { if (mode === 'logout') return; setAuthError(''); setAuthMode(mode); };
  const submitAuth = async (details) => { setAuthBusy(true); setAuthError(''); try { const data = await api(`/auth/${authMode === 'signup' ? 'register' : 'login'}`, { method: 'POST', body: details }); setUser(data.user); setAuthMode(''); setPage('workspace'); setSection('overview'); setRefresh((value) => value + 1); notify(authMode === 'signup' ? 'Your account is ready. Welcome to Pathway.' : 'Welcome back.'); } catch (e) { setAuthError(e.message); } finally { setAuthBusy(false); } };
  const saveJob = async (id) => { if (!user) { openAuth('login'); return; } try { const data = await api(`/saved/jobs/${id}`, { method: 'PUT' }); setUser(data.user); setRefresh((value) => value + 1); notify(data.saved ? 'Saved for later.' : 'Removed from your saved roles.'); } catch (e) { notify(e.message); } };
  const browse = (filters) => { setExploreFilters(filters); setPage(user ? 'workspace' : 'browse'); setSection('explore'); setRefresh((value) => value + 1); setTimeout(() => window.scrollTo(0, 0), 0); };
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* Clear the local session even if the server is temporarily unavailable. */ } setUser(null); setAuthMode(''); setPage('landing'); setSection('overview'); notify('You’re signed out. See you again soon.'); };
  const selectJob = (job) => setSelectedJob(job);
  const apply = async (id, coverLetter) => { if (!user) { setSelectedJob(null); openAuth('login'); throw new Error('Please sign in to apply.'); } if (!user.resume) { setSelectedJob(null); setSection('profile'); setPage('workspace'); throw new Error('Upload a resume to your profile before applying.'); } setApplyBusy(true); try { await api(`/jobs/${id}/apply`, { method: 'POST', body: { coverLetter } }); setSelectedJob(null); setPage('workspace'); setSection('applications'); setRefresh((value) => value + 1); notify('Application sent. Here’s to a new beginning.'); } catch (e) { throw e; } finally { setApplyBusy(false); } };
  const onRefresh = () => setRefresh((value) => value + 1);

  return <>
    {!authChecked && <div className="boot-screen"><span className="brand-mark boot-mark"><span /></span><span>Getting things ready…</span></div>}
    {authChecked && page === 'landing' && <Landing jobs={homeJobs} user={user} onAuth={openAuth} onWorkspace={workspace} onLogout={logout} onSelectJob={selectJob} onSave={saveJob} onBrowse={browse} />}
    {authChecked && page === 'browse' && <PublicExplore initialFilters={exploreFilters} onHome={() => setPage('landing')} onAuth={openAuth} onSelectJob={selectJob} onSave={saveJob} />}
    {authChecked && page === 'workspace' && user && <Workspace key={user.id} user={user} section={section} setSection={(next) => { setSection(next); if (next === 'admin') setRefresh((value) => value + 1); }} onLogout={logout} onSelectJob={selectJob} onSave={saveJob} refresh={refresh} onRefresh={onRefresh} initialFilters={exploreFilters} />}
    {authChecked && page === 'workspace' && !user && <Landing jobs={homeJobs} user={user} onAuth={openAuth} onWorkspace={workspace} onLogout={logout} onSelectJob={selectJob} onSave={saveJob} onBrowse={browse} />}
    {authMode && <AuthDialog mode={authMode} onMode={(mode) => { setAuthError(''); setAuthMode(mode); }} onClose={() => setAuthMode('')} onAuth={submitAuth} busy={authBusy} error={authError} />}
    {selectedJob && <JobDialog job={selectedJob} user={user} onClose={() => setSelectedJob(null)} onAuthNeeded={() => { setSelectedJob(null); openAuth('login'); }} onApply={apply} busy={applyBusy} />}
    <Toast message={toast} onClose={closeToast} />
  </>;
}
