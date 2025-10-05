// Intro functionality - Always plays on refresh
document.addEventListener('DOMContentLoaded', function() {
  // Reset scroll position to top
  window.scrollTo(0, 0);
  
  // Initialize intro
  initIntro();
});

function initIntro() {
  const introContainer = document.getElementById('intro-container');
  const panels = document.querySelectorAll('.intro-panel');
  const mainContent = document.getElementById('main-content');
  
  // Show the intro container and ensure it's at top
  introContainer.style.display = 'block';
  window.scrollTo(0, 0);
  
  // Intersection Observer for panel animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // If this is the last panel, set a timeout to transition to main site
        if (entry.target.id === 'panel-5') {
          setTimeout(() => {
            completeIntro();
          }, 2000);
        }
      }
    });
  }, {
    threshold: 0.5
  });

  // Observe each panel
  panels.forEach(panel => {
    observer.observe(panel);
  });

  // Handle scroll events for manual progression
  let lastScrollTop = 0;
  window.addEventListener('scroll', function() {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if we're at the bottom of the last panel
    if (st > lastScrollTop && isAtBottom()) {
      completeIntro();
    }
    
    lastScrollTop = st <= 0 ? 0 : st;
  }, false);
}

function isAtBottom() {
  const introContainer = document.getElementById('intro-container');
  return (window.innerHeight + window.scrollY) >= introContainer.scrollHeight;
}

function completeIntro() {
  const introContainer = document.getElementById('intro-container');
  const mainContent = document.getElementById('main-content');
  
  // Fade out intro
  introContainer.classList.add('fade-out');
  
  // Fade in main content
  setTimeout(() => {
    mainContent.classList.add('fade-in');
    introContainer.style.display = 'none';
    
    // Reset scroll position for main content
    window.scrollTo(0, 0);
  }, 1500);
}

// Additional safety: Reset scroll on page load
window.addEventListener('load', function() {
  window.scrollTo(0, 0);
});

// Reset scroll when navigating back to page
window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});