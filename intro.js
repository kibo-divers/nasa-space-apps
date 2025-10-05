// Intro functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if user has already seen the intro
  if (localStorage.getItem('introSeen')) {
    skipIntro();
    return;
  }

  // Initialize intro
  initIntro();
});

function initIntro() {
  const introContainer = document.getElementById('intro-container');
  const panels = document.querySelectorAll('.intro-panel');
  const mainContent = document.getElementById('main-content');
  
  // Show the intro container
  introContainer.style.display = 'block';
  
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
  
  // Mark intro as seen
  localStorage.setItem('introSeen', 'true');
  
  // Fade out intro
  introContainer.classList.add('fade-out');
  
  // Fade in main content
  setTimeout(() => {
    mainContent.classList.add('fade-in');
    introContainer.style.display = 'none';
    
    // Reset scroll position
    window.scrollTo(0, 0);
  }, 1500);
}

function skipIntro() {
  const introContainer = document.getElementById('intro-container');
  const mainContent = document.getElementById('main-content');
  
  introContainer.style.display = 'none';
  mainContent.classList.add('fade-in');
}

// Add this function to intro.js
function addResetButton() {
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Intro';
  resetBtn.style.position = 'fixed';
  resetBtn.style.bottom = '10px';
  resetBtn.style.right = '10px';
  resetBtn.style.zIndex = '10000';
  resetBtn.style.padding = '5px 10px';
  resetBtn.style.background = '#333';
  resetBtn.style.color = 'white';
  resetBtn.style.border = 'none';
  resetBtn.style.borderRadius = '3px';
  resetBtn.style.cursor = 'pointer';
  
  resetBtn.addEventListener('click', function() {
    localStorage.removeItem('introSeen');
    alert('Intro has been reset. Refresh the page to see it again.');
  });
  
  document.body.appendChild(resetBtn);
}

// Call this function at the end of your intro.js file
addResetButton();