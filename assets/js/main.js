(function () {
  const works = window.WORKS || [];
  const categories = window.WORK_CATEGORIES || {};
  let lightboxItems = [];
  let lightboxIndex = 0;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const escapeHTML = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const projectUrl = (work) => `project.html?id=${encodeURIComponent(work.id)}`;
  const workNumber = (work) => String(works.findIndex((item) => item.id === work.id) + 1).padStart(2, "0");
  const roleLine = (work) => (work.role || work.summary || "").split("，")[0].replace(/[。；;]$/, "");
  const isHome = document.body.dataset.page === "home";

  function mediaItems(work) {
    const items = [];
    if (work.video) {
      items.push({
        type: "video",
        src: work.video,
        poster: work.cover,
        title: `${work.title} / Video`
      });
    }
    (work.images || []).forEach((src, index) => {
      items.push({
        type: "image",
        src,
        title: `${work.title} / ${String(index + 1).padStart(2, "0")}`
      });
    });
    return items;
  }

  function cardMarkup(work, compact = false) {
    const number = workNumber(work);
    return `
      <article class="work-card ${compact ? "compact" : ""}" data-category="${escapeHTML(work.category)}">
        <a class="card-image" href="${projectUrl(work)}" aria-label="查看 ${escapeHTML(work.title)} 详情">
          <img src="${escapeHTML(work.cover)}" alt="${escapeHTML(work.title)}" loading="lazy">
        </a>
        <div class="work-card-content">
          <div class="work-card-top">
            <span class="case-index">${number}</span>
            <span class="ui-badge">${escapeHTML(work.categoryLabel)}</span>
          </div>
          <div>
            <h2>${escapeHTML(work.title)}</h2>
            <p>${escapeHTML(work.summary)}</p>
          </div>
          <div class="case-meta">
            <span>${escapeHTML(work.year)}</span>
            <span>${escapeHTML(roleLine(work))}</span>
          </div>
          <div class="card-actions">
            <a class="mini-button magnetic" href="${projectUrl(work)}">详情</a>
            <button class="mini-button magnetic" type="button" data-preview="${escapeHTML(work.id)}">预览</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const hero = $("[data-hero-media]");
    const face = works.find((work) => work.id === "face-id") || works[0];
    if (hero && face) {
      hero.innerHTML = `
        <video class="hero-video" autoplay muted loop playsinline poster="${escapeHTML(face.cover)}">
          <source src="${escapeHTML(face.video || "")}" type="video/mp4">
        </video>
        <div class="hero-signal" aria-hidden="true">
          <div class="signal-grid"></div>
          <div class="signal-orbit"></div>
        </div>
      `;
    }

    const grid = $("[data-featured-grid]");
    if (!grid) return;
    const featured = works.filter((work) => work.featured).slice(0, 6);
    grid.innerHTML = featured.map((work) => cardMarkup(work, true)).join("");
    bindPreviewButtons(grid);
    initMagnetic(grid);
  }

  function renderWorks() {
    const grid = $("[data-work-grid]");
    const count = $("[data-work-count]");
    if (!grid) return;

    function paint(filter = "all") {
      const visible = filter === "all" ? works : works.filter((work) => work.category === filter);
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.dataset.count = String(visible.length);
        grid.innerHTML = visible.map((work) => cardMarkup(work)).join("");
        grid.classList.remove("is-switching");
        if (count) {
          count.textContent = `${categories[filter] || "全部"} · ${visible.length} / ${works.length} 个项目`;
        }
        bindPreviewButtons(grid);
        initMagnetic(grid);
      }, reduceMotion ? 0 : 140);
    }

    $$(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".filter-button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        paint(button.dataset.filter || "all");
      });
    });

    paint("all");
  }

  function renderProject() {
    const root = $("[data-project-root]");
    if (!root) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const work = works.find((item) => item.id === id);

    if (!work) {
      document.title = "Project Not Found | Ji Keyu";
      root.innerHTML = `
        <section class="not-found">
          <p class="eyebrow">Project</p>
          <h1>未找到项目</h1>
          <p class="lead">这个项目地址不存在，或项目数据尚未收录。</p>
          <p><a class="text-link magnetic" href="works.html">返回项目列表</a></p>
        </section>
      `;
      initMagnetic(root);
      return;
    }

    document.title = `${work.title} | 冀柯宇 Ji Keyu`;
    const gallery = (work.images || []).map((src, index) => {
      const offset = work.video ? index + 1 : index;
      const wide = index % 7 === 0 ? "wide" : "";
      return `
        <button class="project-thumb ${wide}" type="button" data-lightbox-index="${offset}">
          <img src="${escapeHTML(src)}" alt="${escapeHTML(work.title)} ${index + 1}" loading="lazy">
          <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
      `;
    }).join("");

    root.innerHTML = `
      <section class="project-hero reveal">
        <div class="project-cover">
          <img src="${escapeHTML(work.cover)}" alt="${escapeHTML(work.title)}">
        </div>
        <div class="project-title-block">
          <p class="eyebrow">${escapeHTML(work.categoryLabel)} / ${escapeHTML(work.year)}</p>
          <h1>${escapeHTML(work.title)}</h1>
          <p class="lead">${escapeHTML(work.summary)}</p>
          <div class="tags">${work.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
        </div>
      </section>

      <section class="section project-meta reveal">
        <div><span>Year</span><strong>${escapeHTML(work.year)}</strong></div>
        <div><span>Medium</span><strong>${escapeHTML(work.categoryLabel)}</strong></div>
        <div><span>Location</span><strong>${escapeHTML(work.location)}</strong></div>
        <div><span>Status</span><strong>${escapeHTML(work.status)}</strong></div>
      </section>

      <section class="section two-column case-study">
        <div class="section-heading reveal">
          <p class="eyebrow">Case Study</p>
          <h2>项目概览</h2>
        </div>
        <div class="project-copy reveal">
          <p>${escapeHTML(work.detail)}</p>
          ${work.role ? `<p><strong>我的职责：</strong>${escapeHTML(work.role)}</p>` : ""}
          ${work.output ? `<p><strong>输出成果：</strong>${escapeHTML(work.output)}</p>` : ""}
          ${work.document ? `<p><a class="text-link magnetic" href="${escapeHTML(work.document)}" target="_blank" rel="noreferrer">查看概念脚本 PDF</a></p>` : ""}
        </div>
      </section>

      ${work.video ? `
        <section class="section reveal">
          <div class="section-heading compact-heading">
            <p class="eyebrow">Moving Image</p>
            <h2>影像片段</h2>
          </div>
          <div class="video-frame">
            <video controls playsinline preload="metadata" poster="${escapeHTML(work.cover)}">
              <source src="${escapeHTML(work.video)}" type="video/mp4">
            </video>
          </div>
        </section>
      ` : ""}

      <section class="section">
        <div class="section-heading reveal">
          <p class="eyebrow">Gallery</p>
          <h2>影像记录</h2>
        </div>
        <div class="project-gallery reveal">${gallery}</div>
      </section>
    `;

    bindProjectLightbox(work);
    initReveal();
    initMagnetic(root);
  }

  function bindPreviewButtons(root = document) {
    $$("[data-preview]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const work = works.find((item) => item.id === button.dataset.preview);
        if (work) openLightbox(mediaItems(work), 0);
      });
    });
  }

  function bindProjectLightbox(work) {
    const items = mediaItems(work);
    $$("[data-lightbox-index]").forEach((button) => {
      button.addEventListener("click", () => {
        openLightbox(items, Number(button.dataset.lightboxIndex || 0));
      });
    });
  }

  function openLightbox(items, index) {
    const lightbox = $("[data-lightbox]");
    if (!lightbox || !items.length) return;
    lightboxItems = items;
    lightboxIndex = Math.max(0, Math.min(index, items.length - 1));
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    renderLightbox();
  }

  function closeLightbox() {
    const lightbox = $("[data-lightbox]");
    if (!lightbox) return;
    const video = $("video", lightbox);
    if (video) video.pause();
    lightbox.classList.remove("is-open");
    lightbox.hidden = true;
    lightbox.innerHTML = "";
    document.body.style.overflow = "";
  }

  function moveLightbox(delta) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
  }

  function renderLightbox() {
    const lightbox = $("[data-lightbox]");
    const item = lightboxItems[lightboxIndex];
    if (!lightbox || !item) return;

    const media = item.type === "video"
      ? `<video controls playsinline preload="metadata" poster="${escapeHTML(item.poster || "")}"><source src="${escapeHTML(item.src)}" type="video/mp4"></video>`
      : `<img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.title)}">`;

    lightbox.innerHTML = `
      <div class="lightbox-bar">
        <div>
          <span class="lightbox-title">${escapeHTML(item.title)}</span>
          <span> · ${lightboxIndex + 1} / ${lightboxItems.length}</span>
        </div>
        <button class="icon-button magnetic" type="button" data-lightbox-close aria-label="关闭">×</button>
      </div>
      <div class="lightbox-stage">${media}</div>
      <div class="lightbox-controls">
        <button class="icon-button magnetic" type="button" data-lightbox-prev aria-label="上一张">←</button>
        <button class="icon-button magnetic" type="button" data-lightbox-next aria-label="下一张">→</button>
      </div>
    `;

    $("[data-lightbox-close]", lightbox).addEventListener("click", closeLightbox);
    $("[data-lightbox-prev]", lightbox).addEventListener("click", () => moveLightbox(-1));
    $("[data-lightbox-next]", lightbox).addEventListener("click", () => moveLightbox(1));
    initMagnetic(lightbox);
  }

  function initReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px" });
    items.forEach((item, index) => {
      item.style.setProperty("--reveal-delay", `${Math.min(index * 38, 220)}ms`);
      observer.observe(item);
    });
  }

  function initBackToTop() {
    const button = $(".back-to-top");
    if (!button) return;
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    window.addEventListener("scroll", () => {
      button.classList.toggle("visible", window.scrollY > 520);
      const header = $("[data-header]");
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    }, { passive: true });
  }

  function initLightboxKeys() {
    document.addEventListener("keydown", (event) => {
      const lightbox = $("[data-lightbox]");
      if (!lightbox || lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    });
    const lightbox = $("[data-lightbox]");
    if (lightbox) {
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
      });
    }
  }

  function initPointerVars() {
    if (reduceMotion) return;
    let ticking = false;
    let nextX = 0;
    let nextY = 0;
    window.addEventListener("pointermove", (event) => {
      nextX = event.clientX;
      nextY = event.clientY;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mx", `${nextX}px`);
        document.documentElement.style.setProperty("--my", `${nextY}px`);
        ticking = false;
      });
    }, { passive: true });
  }

  function initMagnetic(root = document) {
    if (reduceMotion) return;
    $$(".magnetic", root).forEach((item) => {
      if (item.classList.contains("back-to-top") || item.classList.contains("icon-button")) return;
      if (item.dataset.magneticReady) return;
      item.dataset.magneticReady = "true";
      item.addEventListener("pointermove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
        item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      item.addEventListener("pointerleave", () => {
        item.style.transform = "";
      });
    });
  }

  function initMotionField() {
    if (isHome) return;
    const canvas = $("[data-motion-field]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lines = [];
    let raf = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(22, Math.floor(width / 42));
      lines = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 120 + Math.random() * 300,
        speed: 0.18 + Math.random() * 0.72,
        angle: -0.22 - Math.random() * 0.34,
        alpha: 0.05 + Math.random() * 0.14,
        hue: index % 4
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      lines.forEach((line) => {
        const dx = Math.cos(line.angle) * line.length;
        const dy = Math.sin(line.angle) * line.length;
        const gradient = ctx.createLinearGradient(line.x, line.y, line.x + dx, line.y + dy);
        const color = line.hue === 0 ? "255,255,255" : line.hue === 1 ? "205,208,204" : line.hue === 2 ? "155,160,158" : "90,96,98";
        gradient.addColorStop(0, `rgba(${color},0)`);
        gradient.addColorStop(0.5, `rgba(${color},${line.alpha})`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + dx, line.y + dy);
        ctx.stroke();
        if (!reduceMotion) {
          line.x += line.speed;
          line.y -= line.speed * 0.48;
          if (line.x > width + line.length || line.y < -line.length) {
            line.x = -line.length;
            line.y = Math.random() * (height + line.length);
          }
        }
      });
      ctx.globalCompositeOperation = "source-over";
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHome();
    renderWorks();
    renderProject();
    initReveal();
    initBackToTop();
    initLightboxKeys();
    initPointerVars();
    initMagnetic();
    initMotionField();
  });
})();
