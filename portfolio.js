/* ============================================================
   PORTFOLIO — Immersive Scroll Gallery Controller
   Cinematic storytelling with architectural restraint
   ============================================================ */

class PortfolioGallery {
  constructor() {
    this.projects = [
      {
        id: 'kitchen-1',
        title: 'Terracotta Minimalism',
        location: 'Marrakech',
        materials: 'Natural oak, quartz, ceramic tile',
        philosophy: 'Embracing earth tones and minimal forms to create a serene cooking sanctuary.',
        optimization: 'Custom cabinetry maximizes vertical storage while maintaining visual lightness.',
        details: 'Hand-finished hardware, integrated lighting, space-optimized corner solutions.'
      },
      {
        id: 'kitchen-2',
        title: 'Alpine Monochrome',
        location: 'Casablanca',
        materials: 'Lacquered white, stainless steel, light oak',
        philosophy: 'Clean lines and neutral palette that elevates the art of the everyday.',
        optimization: 'Seamless integration of appliances into monolithic cabinetry design.',
        details: 'Soft-close mechanisms, hidden handles, bespoke worktop transitions.'
      },
      {
        id: 'kitchen-3',
        title: 'Forest Sanctuary',
        location: 'Fez',
        materials: 'Walnut veneer, black granite, bronze hardware',
        philosophy: 'Dark, rich materials balanced with abundant natural light and open shelving.',
        optimization: 'Floating shelves and open design create breathing room in intimate spaces.',
        details: 'Sculptural handles, integrated spice storage, concealed electrical outlets.'
      },
      {
        id: 'kitchen-4',
        title: 'Coastal Serenity',
        location: 'Essaouira',
        materials: 'Washed grey oak, white quartz, brushed brass',
        philosophy: 'Inspired by nearby ocean—soft grays with warm metallic accents.',
        optimization: 'Island-centric layout maximizes workflow efficiency and social space.',
        details: 'Custom island seating, integrated wine cooler, architectural toe-kick design.'
      },
      {
        id: 'kitchen-5',
        title: 'Luxury Restraint',
        location: 'Rabat',
        materials: 'Matte black lacquer, Calacatta marble, satin nickel',
        philosophy: 'Luxury through subtraction—every element serves purpose and beauty.',
        optimization: 'Under-cabinet lighting and organizational systems ensure clutter-free aesthetics.',
        details: 'Integrated range hood, marble waterfall edge, luxury hardware sourcing.'
      },
      {
        id: 'kitchen-6',
        title: 'Warm Geometries',
        location: 'Tangier',
        materials: 'Terracotta-toned lacquer, engineered marble, natural brass',
        philosophy: 'Architectural geometry meets warmth—contemporary design with soul.',
        optimization: 'Custom modular cabinetry adapts to complex space constraints.',
        details: 'Hand-crafted tile work, bespoke corner solutions, integrated herb garden.'
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
          <video class="portfolio-item-video" muted playsinline>
            <source src="./videos/kitchen-${idx + 1}.mp4" type="video/mp4">
          </video>
        </div>
        <div class="portfolio-item-overlay">
          <div class="portfolio-item-content">
            <div class="portfolio-item-location">${project.location}</div>
            <h3 class="portfolio-item-title">${project.title}</h3>
            <div class="portfolio-item-divider"></div>
            <div class="portfolio-item-details">
              <div class="detail-item">
                <div class="detail-label">Materials</div>
                <div class="detail-value">${project.materials}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Philosophy</div>
                <div class="detail-value">${project.philosophy}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Space Optimization</div>
                <div class="detail-value">${project.optimization}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Details</div>
                <div class="detail-value">${project.details}</div>
              </div>
            </div>
            <button class="portfolio-cta" onclick="portfolioGallery.scrollToCloser()">
              Discover My Process
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
