document.addEventListener("DOMContentLoaded", () => {
  // Ensure a horizontal scroll container with the given id exists inside the section's .carousel-wrap
  function ensureScrollContainer(id, sectionSelector) {
    let el = document.getElementById(id);
    if (el) return el;
    const parent = document.querySelector(`${sectionSelector} .carousel-wrap`);
    if (!parent) return null;
    el = document.createElement('div');
    el.id = id;
    el.className = 'horizontal-scroll';
    // make sure styles allow horizontal overflow if CSS is missing
    el.style.display = el.style.display || 'flex';
    el.style.flexWrap = 'nowrap';
    el.style.gap = el.style.gap || '18px';
    parent.appendChild(el);
    return el;
  }

  // Create scroll containers if missing (index.html had empty .carousel-wrap divs)
  ensureScrollContainer('studiesScroll', '#studies');
  ensureScrollContainer('careerScroll', '#career');
  ensureScrollContainer('companiesScroll', '#companies');

  /* HERO SLIDER */
  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const indicators = Array.from(document.querySelectorAll(".slider-indicator"));
  const prevBtn = document.querySelector(".slider-prev");
  const nextBtn = document.querySelector(".slider-next");
  let activeIndex = slides.findIndex(s => s.classList.contains('active'));
  if (activeIndex < 0) activeIndex = 0;
  let sliderInterval = null;
  const SLIDE_DELAY = 5000;

  function showSlide(i) {
    if (!slides.length) return;
    slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    indicators.forEach((ind, idx) => ind.classList.toggle('active', idx === i));
    activeIndex = i;
  }
  function nextSlide() { showSlide((activeIndex + 1) % slides.length); }
  function prevSlide() { showSlide((activeIndex - 1 + slides.length) % slides.length); }

  function startAuto() {
    stopAuto();
    sliderInterval = setInterval(nextSlide, SLIDE_DELAY);
  }
  function stopAuto() {
    if (sliderInterval) {
      clearInterval(sliderInterval);
      sliderInterval = null;
    }
  }

  nextBtn?.addEventListener('click', () => { nextSlide(); startAuto(); });
  prevBtn?.addEventListener('click', () => { prevSlide(); startAuto(); });

  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => { showSlide(idx); startAuto(); });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });

  showSlide(activeIndex);
  startAuto();

   /* MOBILE MENU TOGGLE */
  const mobileToggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  mobileToggle?.addEventListener('click', () => {
    if (mobileMenu) mobileMenu.classList.toggle('hidden');
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));


  
  /* DATA SETS */
  const studyData = [
    { name:"Priti Bansal", detail:"Studying for JEE", image:"/people/st1.png" },
    { name:"Priya Singh", detail:"Studying for JEE", image:"/people/st2.png" },
    { name:"Arjun Thakur", detail:"Studying for JEE", image:"/people/st3.png" },
    { name:"Sneha Das", detail:"Studying for JEE", image:"/people/st4.png" },
    { name:"Karan Gupta", detail:"Studying for JEE", image:"/people/st5.png" },
    { name:"Sougata Sain", detail:"Studying for NEET & AIMS", image:"/people/st6.png" },
    { name:"Pooja Chowdhuri", detail:"Studying for JEE", image:"/people/st7.png" }
  ];

  const careerData = [
    { name:"Vipul", detail:"Zoho Intern", image:"https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80" },
    { name:"Riya", detail:"Microsoft DS", image:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80" },
    { name:"Samir", detail:"Amazon SDE", image:"https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80" },
    { name:"Anjali", detail:"Google UX", image:"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=871&q=80" },
    { name:"Rohan", detail:"Meta PM", image:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=870&q=80" }
  ];

  const companyData = [
    {name:"Google",image:"https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png"},
    {name:"Microsoft",image:"https://logos-world.net/wp-content/uploads/2020/07/Microsoft-Logo.png"},
    {name:"Apple",image:"https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png"},
    {name:"Amazon",image:"https://logos-world.net/wp-content/uploads/2020/07/Amazon-Logo.png"},
    {name:"Meta",image:"https://logos-world.net/wp-content/uploads/2021/10/Meta-Logo.png"},
    {name:"TCS",image:"https://logos-world.net/wp-content/uploads/2020/08/Tata-Consultancy-Services-TCS-Logo.png"},
    {name:"Infosys",image:"https://logos-world.net/wp-content/uploads/2020/12/Infosys-Logo.png"},
    {name:"Wipro",image:"https://logos-world.net/wp-content/uploads/2020/12/Wipro-Logo.png"},
    {name:"HCL",image:"https://logos-world.net/wp-content/uploads/2020/12/HCL-Logo.png"},
    {name:"Zoho",image:"https://logos-world.net/wp-content/uploads/2023/04/Zoho-Logo.png"},
    {name:"IBM",image:"https://logos-world.net/wp-content/uploads/2020/04/IBM-Logo.png"},
    {name:"Accenture",image:"https://logos-world.net/wp-content/uploads/2021/08/Accenture-Logo.png"}
  ];

  /* RENDER CARDS */
  function render(data, target, isCompany = false){
    const box = document.getElementById(target);
    if (!box) return;
    box.innerHTML = "";
    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      // prevent flex items from shrinking so horizontal overflow exists
      card.style.flex = "0 0 auto";

      if (isCompany) {
        card.innerHTML = `
          <div class="media">
            <img loading="lazy" class="logo-img" src="${item.image}" alt="${item.name} Logo">
          </div>
          <div class="body">
            <div class="title">${item.name}</div>
          </div>`;
      } else {
        card.innerHTML = `
          <div class="media">
            <img loading="lazy" class="student-img" src="${item.image}" alt="${item.name}">
          </div>
          <div class="body">
            <div class="title">${item.name}</div>
            <div class="meta">${item.detail || ""}</div>
          </div>`;
      }

      box.appendChild(card);
    });
  }

  // Render first, then initialize loop scrollers
  render(studyData, "studiesScroll");
  render(careerData, "careerScroll");
  render(companyData, "companiesScroll", true);

  // small delay to allow images/layout to settle before measuring (helps on slow devices)
  setTimeout(() => {
    // Activate loop on all three sections at visible speed
    enableLoopScroll('studiesScroll', 35, true);
    enableLoopScroll('careerScroll', 30, true);
    enableLoopScroll('companiesScroll', 30, true);
  }, 120);

  /* CONTINUOUS LOOP SCROLL (robust) */
  function enableLoopScroll(containerId, pxPerSec = 24, pauseOnHover = true) {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Prevent double-init
    if (el.dataset.loopInited) return;
    el.dataset.loopInited = '1';

    // Ensure proper layout for horizontal scrolling
    el.style.overflowX = 'auto';
    el.style.scrollBehavior = 'auto';
    el.style.display = 'flex';
    el.style.flexWrap = 'nowrap';
    el.style.alignItems = 'stretch';
    el.style.padding = el.style.padding || '0';

    // original children snapshot (before cloning)
    const originalChildren = Array.from(el.children);
    if (!originalChildren.length) return;

    // helper to compute width of a set of elements (includes flex gap)
    const computeWidth = (items) => {
      const cs = getComputedStyle(el);
      const gap = parseFloat(cs.gap) || 0;
      return items.reduce((sum, it, idx) => {
        const w = it.getBoundingClientRect().width || it.offsetWidth || 0;
        return sum + w + (idx < items.length - 1 ? gap : 0);
      }, 0);
    };

    // wait for images inside original children to load so measurements are correct
    const imgs = Array.from(el.querySelectorAll('img'));
    const imgsReady = Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => img.addEventListener('load', res, { once: true }));
    }));

    imgsReady.then(() => {
      // compute original content width
      let originalWidth = computeWidth(originalChildren) || 0;

      // If originalWidth is too small (e.g. images still not measured), fall back to scrollWidth/2
      if (!originalWidth) originalWidth = el.scrollWidth / 2 || 0;

      // Append clones repeatedly until we have at least two full sets and enough overflow
      // This avoids gaps when original content is smaller than container
      let attempts = 0;
      while ((el.scrollWidth < Math.max(originalWidth * 2, el.clientWidth * 1.5)) && attempts < 6) {
        const frag = document.createDocumentFragment();
        originalChildren.forEach(child => frag.appendChild(child.cloneNode(true)));
        el.appendChild(frag);
        attempts++;
      }

      // Recompute originalWidth if needed
      originalWidth = computeWidth(originalChildren) || originalWidth;
      if (!originalWidth) originalWidth = el.scrollWidth / 2 || 0;

      // start from beginning
      el.scrollLeft = 0;

      // RAF loop
      let running = true;
      let last = performance.now();
      let rafId = null;

      function step(now) {
        const dt = Math.max(0, now - last);
        last = now;
        if (running && originalWidth > 0) {
          el.scrollLeft += (pxPerSec * dt) / 1000;
          // Seamless wrap using measured originalWidth
          if (el.scrollLeft >= originalWidth) {
            // subtract multiples if jumped far
            el.scrollLeft = el.scrollLeft - originalWidth * Math.floor(el.scrollLeft / originalWidth);
          }
        }
        rafId = requestAnimationFrame(step);
      }
      rafId = requestAnimationFrame(step);

      // Pause/resume on interaction
      if (pauseOnHover) {
        let userTimer = null;
        const pause = () => { running = false; };
        const resume = () => { running = true; last = performance.now(); };

        el.addEventListener('mouseenter', pause, { passive: true });
        el.addEventListener('mouseleave', resume, { passive: true });
        el.addEventListener('touchstart', pause, { passive: true });
        el.addEventListener('touchend', () => { clearTimeout(userTimer); userTimer = setTimeout(resume, 400); }, { passive: true });

        el.addEventListener('wheel', () => {
          running = false;
          clearTimeout(userTimer);
          userTimer = setTimeout(() => { running = true; last = performance.now(); }, 800);
        }, { passive: true });
      }

      // Update sizes on resize
      window.addEventListener('resize', () => {
        setTimeout(() => {
          // recompute original width; we keep clones already appended
          originalWidth = computeWidth(originalChildren) || originalWidth;
        }, 120);
      });

      // stop helper
      el._stopLoop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      };
    }).catch(() => {
      // fallback: still try using simple half-width approach
      let halfWidth = el.scrollWidth / 2 || 0;
      el.scrollLeft = 0;
    });
  }

  /* Observe cards to animate when entering viewport (works despite the duplication) */
  function animateCardsOnView(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.card'));
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        if (entry.isIntersecting) {
          const idx = cards.indexOf(card);
          card.style.transitionDelay = `${(idx % 6) * 60}ms`;
          card.classList.add('in-view');
        } else {
          card.classList.remove('in-view');
          card.style.transitionDelay = '';
        }
      });
    }, { root: null, threshold: 0.25 });

    cards.forEach(c => observer.observe(c));
  }
  animateCardsOnView('studiesScroll');
  animateCardsOnView('careerScroll');
  animateCardsOnView('companiesScroll');

  /* CONTACT FORM (graceful) */
  document.getElementById("contact-form")?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const status = document.getElementById("contactStatus");

    const formData = {
      name: this.name.value,
      email: this.email.value,
      message: this.message.value,
    };

    try {
      const res = await fetch("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Show message below form
      status.textContent = data.message;
      status.classList.remove("hidden");
      status.style.background = "rgba(0,128,0,0.12)";
      status.style.color = "#e9f2eeff";
      status.style.padding = "12px";
      status.style.borderRadius = "8px";
      status.style.marginTop = "12px";

      this.reset();

      // Redirect after 1 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);

    } catch (err) {
      status.textContent = "Something went wrong. Please try again.";
      status.classList.remove("hidden");
      status.style.background = "rgba(255,0,0,0.12)";
      status.style.color = "#cc1c2bff";
    }
  });

  /* Header scroll styling */
  const header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });
});