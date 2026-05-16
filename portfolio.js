/* ============================================================
   PORTFOLIO — Immersive Scroll Gallery Controller
   Cinematic storytelling with architectural restraint
   ============================================================ */

class PortfolioGallery {
  constructor() {
    this.projects = [
      {
        id: 'kitchen-1',
        title: 'Anthracite Mat & Céramique',
        location: 'Réalisation Ecocina',
        materials: 'Façade gris anthracite mat Woodimp 22 mm · Caisson hydrofuge gris · Plan céramique Calacatta Grey',
        philosophy: 'Une cuisine épurée où le gris anthracite mat s\'impose avec caractère, adouci par les veines claires du Calacatta Grey.',
        optimization: 'Accessoires d\'angle optimisés pour un rangement maximal sans compromis esthétique.',
        details: 'Façade Woodimp 22 mm haute densité · Caisson hydrofuge gris · Plan céramique Calacatta Grey · Ferrures de coin intégrées.'
      },
      {
        id: 'kitchen-2',
        title: 'Noyer & Verre Fumé',
        location: 'Réalisation Ecocina',
        materials: 'Noyer américain Egger · Noir mat Egger 18 mm · Portes verre sécurit fumé · Plan Dekton Orinika',
        philosophy: 'Le mariage du noyer américain et du noir mat crée un contraste saisissant, sublimé par la transparence du verre fumé.',
        optimization: 'Portes en verre sécurit fumé pour alléger visuellement l\'ensemble tout en préservant l\'intimité du rangement.',
        details: 'Noyer américain Egger · Noir mat Egger 18 mm · Verre sécurit fumé · Plan Dekton Orinika ultra-résistant.'
      },
      {
        id: 'kitchen-3',
        title: 'Gris Clair Brillant & Lattes',
        location: 'Réalisation Ecocina',
        materials: 'Façade gris clair high-gloss Woodipro · Caisson en bois latté · Plan Coverlam grand format',
        philosophy: 'La brillance du gris clair s\'allie à la chaleur naturelle du caisson en bois latté pour une cuisine lumineuse et contemporaine.',
        optimization: 'Caisson en bois latté alliant robustesse structurelle et esthétique naturelle authentique.',
        details: 'Façade high-gloss Woodipro · Caisson bois latté 18 mm · Plan Coverlam grand format résistant à la chaleur.'
      },
      {
        id: 'kitchen-4',
        title: 'Bimatière Ice & Boisé',
        location: 'Réalisation Ecocina',
        materials: 'Façade Ice gris mat Woodimp 22 mm · Boisé Richmond 22 mm · Plan quartz Compac Luna',
        philosophy: 'Un dialogue élégant entre le gris glacé et le boisé Richmond — deux textures complémentaires qui réchauffent l\'espace.',
        optimization: 'Association bimatière étudiée pour délimiter les zones fonctionnelles tout en gardant une lecture visuelle cohérente.',
        details: 'Ice gris mat Woodimp 22 mm · Boisé Richmond 22 mm · Plan quartz Compac Luna · Finition haut de gamme.'
      },
      {
        id: 'kitchen-5',
        title: 'Chêne & Laqué Blanc Brillant',
        location: 'Réalisation Ecocina',
        materials: 'Façade Egger chêne poignée intégrée · Laqué blanc brillant 5 couches · Plan quartz Estatuario',
        philosophy: 'La douceur du chêne naturel face à l\'éclat du blanc laqué — un équilibre entre chaleur et sophistication pure.',
        optimization: 'Poignée intégrée sur façade chêne pour une ligne continue et un geste d\'ouverture intuitif.',
        details: 'Façade Egger chêne profil J · Laqué blanc brillant 5 couches · Plan quartz Estatuario veiné · Finition sans poignée apparente.'
      },
      {
        id: 'kitchen-6',
        title: 'Gris Luna & Boisé Walnut',
        location: 'Réalisation Ecocina',
        materials: 'Façade gris Luna · Accent boisé Walnut · Plan quartz Ice Grey Compac',
        philosophy: 'Le gris Luna posé comme base neutre, réveillé par une touche de boisé Walnut — une composition raffinée aux accents naturels.',
        optimization: 'L\'accent boisé positionné stratégiquement crée un point focal sans alourdir la composition.',
        details: 'Façade gris Luna · Boisé Walnut en touche d\'accent · Plan quartz Ice Grey Compac · Harmonie froide-chaude maîtrisée.'
      }
    ];

    this.currentIndex = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;

    this.init();
  }

  init() {
    this.cacheElements();
    this.createProjectHTML();
    this.setupScrollListener();
    this.setupProgressDots();
    this.setupVideoPlayback();
    this.setupCloserBtn();
  }

  cacheElements() {
    this.gallery = document.querySelector('.portfolio-gallery');
    this.progressContainer = document.querySelector('.progress-dots');
    this.items = [];
  }

  createProjectHTML() {
    const html = this.projects
      .map(
        (project, idx) => `
      <div class="portfolio-item" data-index="${idx}" data-video="kitchen-${idx + 1}">
        <div class="portfolio-item-video-wrapper">
          <video class="portfolio-item-video" muted playsinline poster="./videos/kitchen-${idx + 1}-poster.jpg">
            <source src="./videos/kitchen-${idx + 1}.mp4" type="video/mp4">
          </video>
        </div>
        <div class="portfolio-item-overlay">
          <div class="portfolio-item-content">
            <h3 class="portfolio-item-title">${project.title}</h3>
            <div class="portfolio-item-divider"></div>
            <div class="portfolio-item-details">
              <div class="detail-item">
                <div class="detail-label">Matériaux</div>
                <div class="detail-value">${project.materials}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Concept</div>
                <div class="detail-value">${project.philosophy}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Optimisation</div>
                <div class="detail-value">${project.optimization}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Détails</div>
                <div class="detail-value">${project.details}</div>
              </div>
            </div>
            <button class="portfolio-cta" onclick="portfolioGallery.scrollToCloser()">
              Découvrir notre approche
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="opacity: 0.6;">
                <path d="M1 8h12m-3-3l3 3-3 3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    this.gallery.innerHTML = html;
    this.items = Array.from(this.gallery.querySelectorAll('.portfolio-item'));
  }

  setupScrollListener() {
    let scrollTimeout;
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = scrollY;

      this.items.forEach((item, idx) => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        const threshold = window.innerHeight * 0.35;

        if (distance < threshold) {
          item.classList.add('in-view');
          this.updateProgressDot(idx);
        } else {
          item.classList.remove('in-view');
        }
      });

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.playVisibleVideo();
      }, 100);
    });
  }

  setupProgressDots() {
    const dots = this.projects
      .map(
        (_, idx) => `
      <div class="progress-dot" data-index="${idx}" onclick="portfolioGallery.scrollToProject(${idx})"></div>
    `
      )
      .join('');

    if (this.progressContainer) {
      this.progressContainer.innerHTML = dots;
    }
  }

  updateProgressDot(index) {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
    this.currentIndex = index;
  }

  setupVideoPlayback() {
    window.addEventListener('scroll', () => {
      this.playVisibleVideo();
    });
    this.playVisibleVideo();
  }

  playVisibleVideo() {
    this.items.forEach((item, idx) => {
      const video = item.querySelector('.portfolio-item-video');
      if (!video) return;

      const rect = item.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        video.play().catch(() => {
          // Autoplay may be blocked, silent fail
        });
      } else {
        video.pause();
      }
    });
  }

  scrollToProject(index) {
    if (index >= 0 && index < this.items.length) {
      this.items[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  scrollToCloser() {
    const closer = document.querySelector('.portfolio-closer');
    if (closer) {
      closer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setupCloserBtn() {
    const btn = document.querySelector('.portfolio-closer-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          document.querySelector('.btn.wa').click();
        }
      });
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioGallery = new PortfolioGallery();
});
