import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  logActivity,
  onSnapshot,
  signInWithEmailAndPassword,
  signOut,
  updateDoc,
} from './firebase'
import { uploadProjectImage } from './lib/supabase'
import './App.css'

const GOLD = '#C9A227'
const SLATE = '#334155'
const PAPER = '#F8FAFC'

const services = [
  'Structural Design',
  'Project Management',
  'Construction Supervision',
]

const projectSeed = [
  {
    id: 1,
    title: 'Al Noor Business Center',
    description: 'A landmark mixed-use development planned for modern business operations.',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Green Valley Residences',
    description: 'Boutique residential housing designed for comfort, sustainability, and utility.',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Harbor Logistics Hub',
    description: 'A large-scale logistics and freight facility focused on efficiency and flow.',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    title: 'Civic Plaza',
    description: 'A central civic space with pedestrian circulation, shade, and public access.',
    image:
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    title: 'Metro Transit Terminal',
    description: 'Transit infrastructure designed to manage heavy public movement and flow.',
    image:
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    title: 'Riverside Offices',
    description: 'A contemporary office campus blending flexible workspaces and outdoor views.',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
]

const defaultProjectForm = {
  title: '',
  description: '',
  coverImage: '',
  subImages: [],
}

const sanitizeProjectData = (data = {}) => {
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const description = typeof data.description === 'string' ? data.description.trim() : ''
  const coverImage = typeof data.coverImage === 'string' && data.coverImage.trim()
    ? data.coverImage.trim()
    : typeof data.imageUrl === 'string' && data.imageUrl.trim()
      ? data.imageUrl.trim()
      : typeof data.image === 'string' && data.image.trim()
        ? data.image.trim()
        : ''
  const subImages = Array.isArray(data.subImages)
    ? data.subImages.filter((url) => typeof url === 'string' && url.trim())
    : []

  return {
    title,
    description,
    coverImage,
    subImages,
  }
}

const localizedProjects = {
  en: [
    {
      id: 1,
      title: 'Al Noor Business Center',
      description: 'A landmark mixed-use development planned for modern business operations.',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 2,
      title: 'Green Valley Residences',
      description: 'Boutique residential housing designed for comfort, sustainability, and utility.',
      image:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 3,
      title: 'Harbor Logistics Hub',
      description: 'A large-scale logistics and freight facility focused on efficiency and flow.',
      image:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 4,
      title: 'Civic Plaza',
      description: 'A central civic space with pedestrian circulation, shade, and public access.',
      image:
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 5,
      title: 'Metro Transit Terminal',
      description: 'Transit infrastructure designed to manage heavy public movement and flow.',
      image:
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 6,
      title: 'Riverside Offices',
      description: 'A contemporary office campus blending flexible workspaces and outdoor views.',
      image:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    },
  ],
  ar: [
    {
      id: 1,
      title: 'مركز النور للأعمال',
      description: 'مشروع متعدد الاستخدامات يمثل علامة بارزة للتشغيل التجاري الحديث.',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 2,
      title: 'إسكان وادي الخضراء',
      description: 'مساكن صغيرة مصممة للراحة والاستدامة والفعالية.',
      image:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 3,
      title: 'مركز الميناء اللوجستي',
      description: 'مرفق لوجستي واسع يركز على الكفاءة وسير العمليات.',
      image:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 4,
      title: 'ساحة المدينة',
      description: 'مساحة حضرية مركزية مع مسارات للمشاة والظل وإمكانية الوصول العام.',
      image:
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 5,
      title: 'محطة المترو',
      description: 'بنية تحتية للنقل مصممة لاستيعاب الحركة العامة الثقيلة.',
      image:
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 6,
      title: 'مكاتب النهر',
      description: 'مركز أعمال حديث يجمع بين المساحات المرنة وإطلالات الخارج.',
      image:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    },
  ],
}

const copy = {
  en: {
    navHome: 'Home',
    navProjects: 'Projects',
    adminLogin: 'Admin Login',
    adminSignedIn: 'Admin signed in',
    footerLabel: 'Marwan Engineering Office',
    whatsappContact: 'WhatsApp Contact',
    heroEyebrow: 'Engineering with vision',
    heroTitle: 'Building spaces that elevate everyday life.',
    heroLead: 'We design resilient, purposeful environments for homes, businesses, and public infrastructure.',
    heroPrimary: 'View Projects',
    heroSecondary: 'Talk to Us',
    whatWeDo: 'What we do',
    expertiseTitle: 'Comprehensive construction expertise',
    serviceDescriptions: [
      'Thoughtful planning, precise execution, and responsible delivery from concept to completion.',
      'Thoughtful planning, precise execution, and responsible delivery from concept to completion.',
      'Thoughtful planning, precise execution, and responsible delivery from concept to completion.',
    ],
    portfolio: 'Portfolio',
    selectedProjects: 'Selected projects',
    addProject: 'Add Project',
    viewProject: 'View project →',
    detailPrefix: 'project',
    detailButton: 'WhatsApp Inquiry',
    loginTitle: 'Admin Login',
    loginIntro: 'Sign in to manage projects and site content.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    rememberMe: 'Remember me',
    loginSubmit: 'Login',
    cancel: 'Cancel',
    deleteTitle: 'Delete Project',
    deleteMessage: 'Are you sure you want to delete',
    deleteFootnote: 'This action cannot be undone.',
    deleteButton: 'Delete',
    uploadLabel: 'Upload project cover image',
    uploadGalleryLabel: 'Upload gallery images',
    projectTitle: 'Project title',
    projectDescription: 'Description',
    saveProject: 'Save Project',
    saveChanges: 'Save Changes',
    editProject: 'Edit Project',
    addProjectTitle: 'Add Project',
    projectTabHome: 'Home',
    projectTabProjects: 'Projects',
  },
  ar: {
    navHome: 'الرئيسية',
    navProjects: 'المشاريع',
    adminLogin: 'تسجيل الدخول',
    adminSignedIn: 'تم تسجيل الدخول',
    footerLabel: 'مكتب مروان للهندسة',
    whatsappContact: 'تواصل عبر واتساب',
    heroEyebrow: 'هندسة برؤية',
    heroTitle: 'نبني مساحات ترفع مستوى الحياة اليومية.',
    heroLead: 'نصمم بيئات resilient وهادفة للمنازل، الأعمال، والبنية التحتية العامة.',
    heroPrimary: 'عرض المشاريع',
    heroSecondary: 'تواصل معنا',
    whatWeDo: 'ماذا نقدم',
    expertiseTitle: 'خبرة شاملة في البناء',
    serviceDescriptions: [
      'تخطيط مدروس، تنفيذ دقيق، وتسليم مسؤول من الفكرة إلى الإنجاز.',
      'إدارة مشاريع متقنة مع متابعة دقيقة لضمان الجودة والالتزام بالمواعيد.',
      'إشراف فني رفيع يضمن التنفيذ الدقيق ومعايير السلامة والتميز.',
    ],
    portfolio: 'المعرض',
    selectedProjects: 'المشاريع المختارة',
    addProject: 'إضافة مشروع',
    viewProject: 'عرض المشروع ←',
    detailPrefix: 'مشروع',
    detailButton: 'استفسار واتساب',
    loginTitle: 'تسجيل الدخول',
    loginIntro: 'سجل الدخول لإدارة المشاريع ومحتوى الموقع.',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    rememberMe: 'تذكرني',
    loginSubmit: 'دخول',
    cancel: 'إلغاء',
    deleteTitle: 'حذف المشروع',
    deleteMessage: 'هل أنت متأكد أنك تريد حذف',
    deleteFootnote: 'لا يمكن التراجع عن هذا الإجراء.',
    deleteButton: 'حذف',
    uploadLabel: 'تحميل صورة الغلاف',
    uploadGalleryLabel: 'تحميل صور المعرض',
    projectTitle: 'عنوان المشروع',
    projectDescription: 'الوصف',
    saveProject: 'حفظ المشروع',
    saveChanges: 'حفظ التغييرات',
    editProject: 'تعديل المشروع',
    addProjectTitle: 'إضافة مشروع',
    projectTabHome: 'الرئيسية',
    projectTabProjects: 'المشاريع',
  },
}

function Header({ admin, activePage, language, onHome, onProjects, onOpenLogin, onLogout, onToggleLanguage }) {
  const text = copy[language]

  return (
    <header className="topbar">
      <div className="container nav-row">
        <div className="brand-wrap">
          <div className="brand-mark">MEO</div>
          <div className="brand-copy">Marwan Engineering Office</div>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          <button
            type="button"
            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={onHome}
            aria-current={activePage === 'home' ? 'page' : undefined}
          >
            {text.navHome}
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === 'projects' ? 'active' : ''}`}
            onClick={onProjects}
            aria-current={activePage === 'projects' ? 'page' : undefined}
          >
            {text.navProjects}
          </button>
        </nav>

        <div className="language-toggle" aria-label="Language selection">
          <button
            type="button"
            className={`lang-button ${language === 'en' ? 'active' : ''}`}
            onClick={() => onToggleLanguage('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`lang-button ${language === 'ar' ? 'active' : ''}`}
            onClick={() => onToggleLanguage('ar')}
          >
            AR
          </button>
        </div>

        <button
          type="button"
          className="login-button"
          onClick={admin ? onLogout : onOpenLogin}
        >
          {admin ? text.adminSignedIn : text.adminLogin}
        </button>
      </div>
      <div className="gold-divider" />
    </header>
  )
}

function Footer({ language }) {
  const text = copy[language]

  return (
    <footer className="footer">
      <div className="container footer-row">
        <div>© 2026 {text.footerLabel}</div>
        <a
          href="https://wa.me/963938990054"
          target="_blank"
          rel="noreferrer"
          className="whatsapp-link"
        >
          <span className="whatsapp-icon">✆</span>
          <span>{text.whatsappContact}</span>
        </a>
      </div>
    </footer>
  )
}

function HomePage({ language, onNavigateHome, onNavigateProjects, onOpenWhatsApp, onOpenLogin, admin, onLogout, onToggleLanguage }) {
  const text = copy[language]
  const servicesByLanguage = language === 'ar'
    ? ['التصميم الإنشائي', 'إدارة المشاريع', 'الإشراف على التنفيذ']
    : services

  return (
    <div className={`page-shell ${language === 'ar' ? 'lang-ar' : ''}`}>
      <Header
        admin={admin}
        activePage="home"
        language={language}
        onHome={onNavigateHome}
        onProjects={onNavigateProjects}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
        onToggleLanguage={onToggleLanguage}
      />

      <main className={`home-content ${language === 'ar' ? 'lang-ar' : ''}`}>
        <section className="hero panel-main">
          <div className="hero-copy">
            <p className="eyebrow">{text.heroEyebrow}</p>
            <h1>{text.heroTitle}</h1>
            <p className="lead">
              {text.heroLead}
            </p>
            <div className="cta-row">
              <button type="button" className="primary-btn" onClick={onNavigateProjects}>{text.heroPrimary}</button>
              <button type="button" className="secondary-btn" onClick={onOpenWhatsApp}>{text.heroSecondary}</button>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80"
              alt="Construction planning"
            />
          </div>
        </section>

        <section className="services-card panel-main">
          <div className="section-head">
            <p className="eyebrow">{text.whatWeDo}</p>
            <h2>{text.expertiseTitle}</h2>
          </div>
          <div className="service-grid">
            {servicesByLanguage.map((service, index) => (
              <article className="service-item" key={service}>
                <div className="service-icon">{index + 1}</div>
                <h3>{service}</h3>
                <p>{text.serviceDescriptions[index] || text.serviceDescriptions[0]}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <button type="button" className="whatsapp-float" aria-label="WhatsApp contact" onClick={onOpenWhatsApp}>✆</button>
      <Footer language={language} />
    </div>
  )
}

function ProjectListPage({
  admin,
  projects,
  language,
  onOpenAddProject,
  onOpenEditProject,
  onOpenDeleteProject,
  onOpenProject,
  onNavigateHome,
  onNavigateProjects,
  onOpenLogin,
  onLogout,
  onOpenWhatsApp,
  onToggleLanguage,
}) {
  const text = copy[language]

  return (
    <div className={`page-shell ${language === 'ar' ? 'lang-ar' : ''}`}>
      <Header
        admin={admin}
        activePage="projects"
        language={language}
        onHome={onNavigateHome}
        onProjects={onNavigateProjects}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
        onToggleLanguage={onToggleLanguage}
      />

      <main className={`projects-page ${language === 'ar' ? 'lang-ar' : ''}`}>
        <div className="project-header container">
          <div>
            <p className="eyebrow">{text.portfolio}</p>
            <h2>{text.selectedProjects}</h2>
          </div>
          {admin ? (
            <button type="button" className="primary-btn small" onClick={onOpenAddProject}>{text.addProject}</button>
          ) : null}
        </div>

        <div className="projects-grid container">
          {projects.map((project) => {
            const galleryImages = Array.isArray(project.subImages) ? project.subImages.filter(Boolean) : []
            const coverImage = project.coverImage || project.image || project.imageUrl || galleryImages[0] || ''

            return (
              <article className="project-card" key={project.id}>
                <img src={coverImage} alt={project.title} />
                {admin ? (
                  <div className="admin-actions">
                    <button type="button" aria-label={`Edit ${project.title}`} onClick={() => onOpenEditProject(project)}>✎</button>
                    <button type="button" aria-label={`Delete ${project.title}`} onClick={() => onOpenDeleteProject(project)}>🗑</button>
                  </div>
                ) : null}
                {galleryImages.length ? (
                  <div className="project-gallery">
                    {galleryImages.slice(0, 3).map((image, index) => (
                      <img key={`${project.id}-sub-${index}`} src={image} alt={`${project.title} gallery ${index + 1}`} />
                    ))}
                  </div>
                ) : null}
                <div className="project-body">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <button type="button" className="text-link" onClick={() => onOpenProject(project)}>
                    {text.viewProject}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      <button type="button" className="whatsapp-float" aria-label="WhatsApp contact" onClick={onOpenWhatsApp}>✆</button>
      <Footer language={language} />
    </div>
  )
}

function ProjectDetailPage({ project, admin, language, onNavigateHome, onNavigateProjects, onOpenLogin, onLogout, onOpenWhatsApp, onToggleLanguage }) {
  const text = copy[language]

  if (!project) {
    return null
  }

  const galleryImages = Array.isArray(project.subImages) ? project.subImages.filter(Boolean) : []
  const coverImage = project.coverImage || project.image || project.imageUrl || galleryImages[0] || ''

  return (
    <div className={`page-shell detail-page ${language === 'ar' ? 'lang-ar' : ''}`}>
      <Header
        admin={admin}
        activePage="projects"
        language={language}
        onHome={onNavigateHome}
        onProjects={onNavigateProjects}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
        onToggleLanguage={onToggleLanguage}
      />

      <main className={`detail-content container ${language === 'ar' ? 'lang-ar' : ''}`}>
        <div className="breadcrumbs">{text.navHome} / {text.navProjects} / {project.title}</div>
        <div className="detail-layout">
          <div className="detail-image-block">
            <img src={coverImage} alt={project.title} />
            {galleryImages.length > 1 ? (
              <div className="detail-gallery">
                {galleryImages.slice(0, 4).map((image, index) => (
                  <img key={`${project.id}-detail-${index}`} src={image} alt={`${project.title} detail ${index + 1}`} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{text.detailPrefix}</p>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <button type="button" className="primary-btn" onClick={onOpenWhatsApp}>{text.detailButton}</button>
          </div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  )
}

function LoginModal({ open, onClose, onSubmit, language }) {
  if (!open) return null

  const text = copy[language]

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card login-modal">
        <button type="button" className="modal-close" aria-label="Close login modal" onClick={onClose}>×</button>
        <h3>{text.loginTitle}</h3>
        <p>{text.loginIntro}</p>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{text.emailLabel}</span>
            <input type="email" name="email" placeholder="admin@marwanengineering.com" defaultValue="admin@marwanengineering.com" />
          </label>
          <label>
            <span>{text.passwordLabel}</span>
            <input type="password" name="password" placeholder="••••••••" defaultValue="admin123" />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            <span>{text.rememberMe}</span>
          </label>
          <button type="submit" className="primary-btn full-width">{text.loginSubmit}</button>
          <button type="button" className="secondary-btn full-width" onClick={onClose}>{text.cancel}</button>
        </form>
      </div>
    </div>
  )
}

function AddProjectModal({ open, value, onClose, onChange, onSubmit, onImageUpload, onGalleryUpload, onRemoveGalleryImage, language, uploadingImage }) {
  if (!open) return null

  const text = copy[language]

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card add-project-modal">
        <button type="button" className="modal-close" aria-label="Close add project modal" onClick={onClose}>×</button>
        <h3>{value.id ? text.editProject : text.addProjectTitle}</h3>
        <div className="image-upload-wrap">
          <label className="upload-box">
            <span>{uploadingImage ? 'Uploading image...' : text.uploadLabel}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingImage}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                onImageUpload(file)
                event.target.value = ''
              }}
            />
          </label>
          {value.coverImage ? <img className="preview-image" src={value.coverImage} alt="Project preview" /> : null}

          <label className="upload-box">
            <span>{uploadingImage ? 'Uploading gallery...' : text.uploadGalleryLabel}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingImage}
              onChange={(event) => {
                const files = Array.from(event.target.files || [])
                if (!files.length) return
                onGalleryUpload(files)
                event.target.value = ''
              }}
            />
          </label>
          {value.subImages?.length ? (
            <>
              <div className="gallery-preview">
                {value.subImages.map((image, index) => (
                  <div key={`${image}-${index}`} className="gallery-preview-item">
                    <img className="preview-image small" src={image} alt={`Project gallery ${index + 1}`} />
                    <button
                      type="button"
                      className="gallery-remove-btn"
                      aria-label={`Remove gallery image ${index + 1}`}
                      onClick={() => onRemoveGalleryImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="secondary-btn small full-width"
                onClick={() => onChange({ ...value, subImages: [] })}
              >
                Clear gallery
              </button>
            </>
          ) : null}
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            <span>{text.projectTitle}</span>
            <input
              type="text"
              value={value.title}
              placeholder={text.projectTitle}
              onChange={(event) => onChange({ ...value, title: event.target.value })}
            />
          </label>
          <label>
            <span>{text.projectDescription}</span>
            <textarea
              rows="4"
              value={value.description}
              placeholder={text.projectDescription}
              onChange={(event) => onChange({ ...value, description: event.target.value })}
            />
          </label>
          <button type="submit" className="primary-btn full-width">{value.id ? text.saveChanges : text.saveProject}</button>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({ open, project, onClose, onConfirm, language }) {
  if (!open || !project) return null

  const text = copy[language]

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card delete-modal">
        <button type="button" className="modal-close" aria-label="Close delete modal" onClick={onClose}>×</button>
        <h3>{text.deleteTitle}</h3>
        <p>{text.deleteMessage} {project.title}? {text.deleteFootnote}</p>
        <div className="button-row">
          <button type="button" className="secondary-btn" onClick={onClose}>{text.cancel}</button>
          <button type="button" className="primary-btn" onClick={onConfirm}>{text.deleteButton}</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState('home')
  const [language, setLanguage] = useState('en')
  const [projects, setProjects] = useState([])
  const [admin, setAdmin] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectForm, setProjectForm] = useState(defaultProjectForm)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdmin(Boolean(user))
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const projectsRef = collection(db, 'projects')
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...sanitizeProjectData(docSnap.data()),
      }))

      setProjects(docs)
      setSelectedProject((current) => {
        if (!docs.length) {
          return null
        }

        if (current && docs.some((project) => project.id === current.id)) {
          return docs.find((project) => project.id === current.id) || docs[0]
        }

        return docs[0]
      })
    })

    return () => unsubscribe()
  }, [])

  const openWhatsApp = () => {
    window.open('https://wa.me/963938990054', '_blank', 'noopener,noreferrer')
  }

  const openHome = () => {
    setView('home')
  }

  const openProjects = () => {
    setView('projects')
  }

  const logoutAdmin = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
    setAdmin(false)
  }

  const openProject = (project) => {
    setSelectedProject(project)
    setView('detail')
  }

  const openAddProject = () => {
    setEditingProjectId(null)
    setProjectForm(defaultProjectForm)
    setProjectModalOpen(true)
  }

  const openEditProject = (project) => {
    const sanitized = sanitizeProjectData(project)

    setEditingProjectId(project.id)
    setProjectForm({
      id: project.id,
      title: sanitized.title,
      description: sanitized.description,
      coverImage: sanitized.coverImage,
      subImages: sanitized.subImages,
    })
    setProjectModalOpen(true)
  }

  const closeProjectModal = () => {
    setProjectModalOpen(false)
    setProjectForm(defaultProjectForm)
    setEditingProjectId(null)
  }

  const handleImageUpload = async (file) => {
    if (!file) return

    setUploadingImage(true)

    try {
      const publicUrl = await uploadProjectImage(file)
      setProjectForm((current) => ({
        ...current,
        coverImage: publicUrl || current.coverImage,
      }))
    } catch (error) {
      console.error('Failed to upload project image:', error)
      window.alert('Image upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleGalleryUpload = async (files) => {
    if (!files?.length) return

    setUploadingImage(true)

    try {
      const uploadedUrls = []

      for (const file of files) {
        const publicUrl = await uploadProjectImage(file)
        if (publicUrl) {
          uploadedUrls.push(publicUrl)
        }
      }

      if (!uploadedUrls.length) {
        return
      }

      setProjectForm((current) => ({
        ...current,
        subImages: [...(current.subImages || []), ...uploadedUrls],
      }))
    } catch (error) {
      console.error('Failed to upload project gallery images:', error)
      window.alert('Gallery upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const email = form.email.value.trim()
    const password = form.password.value.trim()

    if (!email || !password) return

    try {
      await signInWithEmailAndPassword(auth, email, password)
      setLoginOpen(false)
    } catch (error) {
      console.error('Firebase login failed:', error)
      window.alert('Admin login failed. Please verify the credentials.')
    }
  }

  const handleSaveProject = async (event) => {
    event.preventDefault()

    const title = projectForm.title.trim()
    const description = projectForm.description.trim()

    if (!title || !description) return

    const coverImage = projectForm.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80'
    const subImages = Array.isArray(projectForm.subImages)
      ? projectForm.subImages.filter((url) => typeof url === 'string' && url.trim())
      : []

    try {
      const projectData = {
        title,
        description,
        coverImage,
        subImages,
      }

      if (editingProjectId) {
        await updateDoc(doc(db, 'projects', editingProjectId), projectData)
        await logActivity('updated project', title)
      } else {
        await addDoc(collection(db, 'projects'), projectData)
        await logActivity('added project', title)
      }

      closeProjectModal()
      setView('projects')
    } catch (error) {
      console.error('Failed to save project:', error)
      window.alert('Could not save the project. Please try again.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      await deleteDoc(doc(db, 'projects', deleteTarget.id))
      await logActivity('deleted project', deleteTarget.title || 'Project')
      setDeleteTarget(null)
      setView('projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
      window.alert('Could not delete the project. Please try again.')
    }
  }

  const renderCurrentView = () => {
    if (view === 'home') {
      return (
        <HomePage
          admin={admin}
          language={language}
          onNavigateHome={openHome}
          onNavigateProjects={openProjects}
          onOpenWhatsApp={openWhatsApp}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={logoutAdmin}
          onToggleLanguage={setLanguage}
        />
      )
    }

    if (view === 'projects') {
      return (
        <ProjectListPage
          admin={admin}
          projects={projects}
          language={language}
          onOpenAddProject={openAddProject}
          onOpenEditProject={openEditProject}
          onOpenDeleteProject={setDeleteTarget}
          onOpenProject={openProject}
          onNavigateHome={openHome}
          onNavigateProjects={openProjects}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={logoutAdmin}
          onOpenWhatsApp={openWhatsApp}
          onToggleLanguage={setLanguage}
        />
      )
    }

    return (
      <ProjectDetailPage
        project={selectedProject}
        admin={admin}
        language={language}
        onNavigateHome={openHome}
        onNavigateProjects={openProjects}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={logoutAdmin}
        onOpenWhatsApp={openWhatsApp}
        onToggleLanguage={setLanguage}
      />
    )
  }

  return (
    <>
      {renderCurrentView()}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSubmit={handleLoginSubmit} language={language} />
      <AddProjectModal
        open={projectModalOpen}
        value={projectForm}
        onClose={closeProjectModal}
        onChange={setProjectForm}
        onSubmit={handleSaveProject}
        onImageUpload={handleImageUpload}
        onGalleryUpload={handleGalleryUpload}
        onRemoveGalleryImage={(index) => setProjectForm((current) => ({
          ...current,
          subImages: (current.subImages || []).filter((_, imageIndex) => imageIndex !== index),
        }))}
        language={language}
        uploadingImage={uploadingImage}
      />
      <DeleteModal
        open={Boolean(deleteTarget)}
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        language={language}
      />
    </>
  )
}

export default App
