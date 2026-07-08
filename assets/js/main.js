(function () {
  const works = window.WORKS || [];
  const caseDetails = window.WORK_CASE_DETAILS || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let lightboxItems = [];
  let lightboxIndex = 0;

  const categories = {
    all: "全部",
    mapping: "3D Mapping",
    "naked-eye": "裸眼3D",
    aigc: "AIGC 视觉",
    "media-installation": "新媒体装置",
    installation: "落地项目"
  };

  const practiceLines = {
    mapping: "Spatial Projection",
    "naked-eye": "Public Screen",
    aigc: "Image System",
    "media-installation": "New Media Installation",
    installation: "Public Installation"
  };

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function archiveCode(work, index) {
    return `JKY-${String(index + 1).padStart(2, "0")}`;
  }

  function getWorkIndex(work) {
    return works.findIndex((item) => item.id === work.id);
  }

  function mediaItems(work) {
    const items = [];
    if (work.video) {
      items.push({
        type: "video",
        src: work.video,
        poster: work.cover,
        title: `${work.title} / Video Record`
      });
    }
    (work.images || []).forEach((src, index) => {
      items.push({
        type: "image",
        src,
        title: `${work.title} / Image ${String(index + 1).padStart(2, "0")}`
      });
    });
    return items;
  }

  function compactTags(work) {
    return (work.roleKeywords || work.tags || []).slice(0, 3);
  }

  function caseInfo(work) {
    return caseDetails[work.id] || {};
  }

  function initHero() {
    const hero = $("[data-hero-media]");
    const face = works.find((work) => work.id === "face-id") || works[0];
    const redo = works.find((work) => work.id === "redo-id");
    const weiqunan = works.find((work) => work.id === "weiqunan");
    if (!hero || !face) return;
    const heroVideo = "assets/media/video/face-id-hero.mp4";

    hero.innerHTML = `
      <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="${escapeHTML(face.cover)}">
        <source src="${escapeHTML(heroVideo)}" type="video/mp4">
      </video>
      <div class="hero-slices" aria-hidden="true">
        <img src="${escapeHTML(redo?.cover || face.cover)}" alt="">
        <img src="${escapeHTML(weiqunan?.cover || face.cover)}" alt="">
        <img src="${escapeHTML(face.images?.[2] || face.cover)}" alt="">
      </div>
      <div class="hero-signal" aria-hidden="true">
        <span>FACE ID / Spatial Interface</span>
        <i></i><i></i><i></i>
        <span>Public media image system</span>
      </div>
    `;
  }

  function cardMarkup(work, featured = false) {
    const index = getWorkIndex(work);
    const info = caseInfo(work);
    const tags = compactTags(work).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
    const line = work.practiceLine || practiceLines[work.category] || work.categoryLabel;
    const summaryHTML = featured
      ? `<p class="work-card-summary">${escapeHTML(info.goal || work.summary || "")}</p>`
      : `
        <p class="work-card-summary work-card-context">
          <span>${escapeHTML(work.location || "Archive")}</span>
          ${work.status ? `<span>${escapeHTML(work.status)}</span>` : ""}
        </p>
      `;

    return `
      <article class="work-card ${featured ? "featured-card" : ""}" data-work-id="${escapeHTML(work.id)}">
        <img src="${escapeHTML(work.cover)}" alt="${escapeHTML(work.title)} 作品封面" loading="lazy">
        <span class="scan-pass" aria-hidden="true"></span>
        <div class="work-card-top">
          <span class="archive-code">${archiveCode(work, index)}</span>
          <span>${escapeHTML(work.year)} / ${escapeHTML(work.categoryLabel)}</span>
        </div>
        <div class="work-card-content">
          <h3>${escapeHTML(work.title)}</h3>
          ${summaryHTML}
          <div class="work-card-meta">
            <span>${escapeHTML(line)}</span>
            ${tags}
          </div>
          <p class="media-count">
            <span>${mediaItems(work).length} media records</span>
            <span>${escapeHTML(work.location || "archive")}</span>
          </p>
          <div class="work-card-actions">
            <button class="button ghost magnetic" type="button" data-card-preview="${escapeHTML(work.id)}">Preview</button>
            <a class="button primary magnetic" href="project.html?id=${encodeURIComponent(work.id)}">Case Study</a>
          </div>
        </div>
      </article>
    `;
  }

  function initFeatured() {
    const grid = $("[data-featured-grid]");
    if (!grid) return;
    const featured = works.filter((work) => work.featured).slice(0, 6);
    grid.innerHTML = featured.map((work) => cardMarkup(work, true)).join("");
    bindCardPreview(grid);
    initMagnetic(grid);
    initCardField(grid);
  }

  function initWorksGrid() {
    const grid = $("[data-work-grid]");
    if (!grid) return;
    const count = $("[data-work-count]");

    function paint(filter = "all") {
      const visible = filter === "all" ? works : works.filter((work) => work.category === filter);
      grid.classList.add("is-switching");
      window.setTimeout(() => {
        grid.dataset.count = String(visible.length);
        grid.innerHTML = visible.map((work) => cardMarkup(work)).join("");
        if (count) {
          count.textContent = `${categories[filter] || "全部"} / ${visible.length} of ${works.length}`;
        }
        bindCardPreview(grid);
        initMagnetic(grid);
        initCardField(grid);
        grid.classList.remove("is-switching");
      }, reduceMotion ? 0 : 60);
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

  function bindCardPreview(root = document) {
    $$("[data-card-preview]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const work = works.find((item) => item.id === button.dataset.cardPreview);
        if (!work) return;
        openLightbox(mediaItems(work), 0);
      });
    });
  }

  function initProjectPage() {
    const root = $("[data-project-root]");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const work = works.find((item) => item.id === id);

    if (!work) {
      root.innerHTML = `
        <section class="not-found">
          <p class="eyebrow">Archive Missing</p>
          <h1>未找到项目档案</h1>
          <p>请返回项目档案索引查看当前可浏览的作品。</p>
          <a class="button primary magnetic" href="works.html">返回项目档案</a>
        </section>
      `;
      initMagnetic(root);
      initCardField(root);
      return;
    }

    document.title = `${work.title} | Ji Keyu Case Study`;
    const index = getWorkIndex(work);
    const items = mediaItems(work);
    const gallery = (work.images || []).map((src, imageIndex) => {
      const lightboxOffset = work.video ? imageIndex + 1 : imageIndex;
      const wide = imageIndex % 5 === 0 || imageIndex % 5 === 3 ? "wide" : "";
      const loading = imageIndex < 6 ? "eager" : "lazy";
      return `
        <button class="project-thumb ${wide}" type="button" data-lightbox-index="${lightboxOffset}" aria-label="查看 ${escapeHTML(work.title)} 影像记录 ${imageIndex + 1}">
          <img src="${escapeHTML(src)}" alt="${escapeHTML(work.title)} 影像记录 ${imageIndex + 1}" loading="${loading}" decoding="async">
        </button>
      `;
    }).join("");
    const tags = (work.tags || []).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
    const info = caseInfo(work);
    const documentLink = work.document
      ? `<a class="text-link project-document-link magnetic" href="${escapeHTML(work.document)}" target="_blank" rel="noreferrer">项目文档 / PDF</a>`
      : "";
    const line = work.practiceLine || practiceLines[work.category] || work.categoryLabel;

    root.innerHTML = `
      <section class="project-hero reveal">
        <div class="project-hero-media">
          <img src="${escapeHTML(work.cover)}" alt="${escapeHTML(work.title)} 主视觉">
        </div>
        <div class="project-hero-copy">
          <div>
            <p class="eyebrow">${archiveCode(work, index)} / ${escapeHTML(line)}</p>
            <h1>${escapeHTML(work.title)}</h1>
            <p class="lead">${escapeHTML(work.summary)}</p>
          </div>
          <div class="project-meta">
            <span>${escapeHTML(work.year)}</span>
            <span>${escapeHTML(work.categoryLabel)}</span>
            <span>${escapeHTML(work.location || "Project Site")}</span>
            <span>${escapeHTML(work.status || "Portfolio Archive")}</span>
          </div>
        </div>
      </section>

      <section class="section case-study reveal">
        <div class="case-rail">
          <p class="eyebrow">Case Study</p>
          <span>${archiveCode(work, index)}</span>
          <h2>项目说明</h2>
          <p>${escapeHTML(line)} / ${escapeHTML(work.categoryLabel)}</p>
        </div>
        <div class="project-copy">
          <article>
            <h3>项目背景</h3>
            <p>${escapeHTML(info.background || work.status || work.summary)}</p>
          </article>
          <article>
            <h3>创作目标</h3>
            <p>${escapeHTML(info.goal || work.summary)}</p>
          </article>
          <article>
            <h3>我的职责</h3>
            <p>${escapeHTML(work.role || "参与项目视觉、资料整理与现场记录。")}</p>
          </article>
          <article>
            <h3>制作方法</h3>
            <p>${escapeHTML(info.method || work.detail || work.summary)}</p>
          </article>
          <article>
            <h3>输出成果</h3>
            <p>${escapeHTML(work.output || "完成项目影像、图像与作品集展示资料整理。")}</p>
          </article>
          <article>
            <h3>项目价值</h3>
            <p>${escapeHTML(info.value || "展示项目从概念、视觉、执行到资料归档的综合能力。")}</p>
          </article>
          <div class="project-tags">${tags}</div>
          ${documentLink}
        </div>
      </section>

      ${work.video ? `
        <section class="section reveal">
          <div class="section-heading">
            <p class="eyebrow">Video Record</p>
            <h2>影像记录</h2>
          </div>
          <div class="video-frame">
            <video controls playsinline preload="metadata" poster="${escapeHTML(work.cover)}">
              <source src="${escapeHTML(work.video)}" type="video/mp4">
            </video>
          </div>
        </section>
      ` : ""}

      <section class="section project-media-section">
        <div class="section-heading reveal">
          <p class="eyebrow">Media Archive</p>
          <h2>图像记录</h2>
        </div>
        <div class="project-gallery">${gallery}</div>
      </section>
    `;

    $$("[data-lightbox-index]", root).forEach((button) => {
      button.addEventListener("click", () => {
        openLightbox(items, Number(button.dataset.lightboxIndex || 0));
      });
    });

    initReveal(root);
    initMagnetic(root);
    initCardField(root);
  }

  function openLightbox(items, index = 0) {
    const lightbox = $("[data-lightbox]");
    if (!lightbox || !items.length) return;
    lightboxItems = items;
    lightboxIndex = Math.max(0, Math.min(index, items.length - 1));
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    renderLightbox();
    document.body.style.overflow = "hidden";
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
        <div class="lightbox-meta">
          <span class="eyebrow">${escapeHTML(item.title)}</span>
          <span class="eyebrow">${lightboxIndex + 1} / ${lightboxItems.length}</span>
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

  function initReveal(root = document) {
    const reveals = $$(".reveal", root);
    if (!reveals.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    reveals.forEach((item) => observer.observe(item));
  }

  function initMagnetic(root = document) {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    $$(".magnetic", root).forEach((item) => {
      if (item.matches(".button, .filter-button, .icon-button, .text-link, address a")) return;
      if (item.dataset.magneticReady) return;
      item.dataset.magneticReady = "true";
      item.addEventListener("mousemove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      item.addEventListener("mouseleave", () => {
        item.style.transform = "";
      });
    });
  }

  function initPointerField() {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    window.addEventListener("pointermove", (event) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--pointer-x", x.toFixed(4));
      document.documentElement.style.setProperty("--pointer-y", y.toFixed(4));
      document.documentElement.style.setProperty("--pointer-px", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-py", `${event.clientY}px`);
    }, { passive: true });
  }

  function initCardField(root = document) {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    $$(".work-card, .project-thumb", root).forEach((card) => {
      if (card.dataset.fieldReady) return;
      card.dataset.fieldReady = "true";
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--card-x", x.toFixed(3));
        card.style.setProperty("--card-y", y.toFixed(3));
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--card-x");
        card.style.removeProperty("--card-y");
      });
    });
  }

  function initCursorOrbit() {
    const cursor = $("[data-cursor-orbit]");
    if (!cursor || reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("has-pointer");
    window.addEventListener("pointermove", (event) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate3d(-50%, -50%, 0)`;
    }, { passive: true });
  }

  function initBackToTop() {
    const button = $(".back-to-top");
    if (!button) return;
    window.addEventListener("scroll", () => {
      button.classList.toggle("is-visible", window.scrollY > 680);
    }, { passive: true });
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  }

  function initKeyboard() {
    window.addEventListener("keydown", (event) => {
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

  function initMotionField() {
    const canvas = $("[data-motion-field]");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    const lines = Array.from({ length: 18 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      length: 90 + Math.random() * 260,
      speed: 0.00045 + Math.random() * 0.0014,
      angle: index % 3 === 0 ? -0.7 : 0.18 + Math.random() * 0.44,
      alpha: 0.14 + Math.random() * 0.34
    }));
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let lastDraw = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time = 0) {
      if (time - lastDraw < 40) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastDraw = time;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      lines.forEach((line) => {
        line.x += line.speed;
        if (line.x > 1.18) line.x = -0.18;
        const x = line.x * width;
        const y = line.y * height;
        const dx = Math.cos(line.angle) * line.length;
        const dy = Math.sin(line.angle) * line.length;
        const gradient = ctx.createLinearGradient(x, y, x + dx, y + dy);
        gradient.addColorStop(0, `rgba(255,255,255,0)`);
        gradient.addColorStop(0.45, `rgba(255,255,255,${line.alpha})`);
        gradient.addColorStop(1, `rgba(51,92,255,0)`);
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHero();
    initFeatured();
    initWorksGrid();
    initProjectPage();
    initReveal();
    initMagnetic();
    initCursorOrbit();
    initPointerField();
    initCardField();
    initBackToTop();
    initKeyboard();
    initMotionField();
  });
})();
