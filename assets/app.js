(function () {
  "use strict";

  const CONFIG = window.GALLERY_CONFIG || {};

  const FOCUS_CATEGORY = CONFIG.focusCategory || "焦點活動";
  const REVIEW_CATEGORY = CONFIG.reviewCategory || "活動回顧";
  const LEGACY_REVIEW_CATEGORY = "尚回憶";

  const categories = Array.isArray(CONFIG.categories) && CONFIG.categories.length
    ? CONFIG.categories
    : [FOCUS_CATEGORY, REVIEW_CATEGORY];

  const state = {
    albums: [],
    photos: [],
    mode: "albums",
    activeCategory: FOCUS_CATEGORY,
    sortBy: "newest",
    currentAlbum: null,
    returnCategory: FOCUS_CATEGORY
  };

  let els = {};

  function init() {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = normalizeCategory(params.get("category") || "");
    const albumId = params.get("album");
    const fromCategory = normalizeCategory(params.get("from") || "");

    if (requestedCategory && categories.includes(requestedCategory)) {
      state.activeCategory = requestedCategory;
    }

    if (fromCategory && categories.includes(fromCategory)) {
      state.returnCategory = fromCategory;
    } else {
      state.returnCategory = state.activeCategory;
    }

    cacheElements();
    applyConfigText();
    renderBrandMark();
    renderNav();
    bindEvents();

    if (albumId) {
      loadAlbum(albumId);
    } else {
      loadAlbums();
    }
  }

  function cacheElements() {
    els = {
      brandMark: document.getElementById("brandMark"),
      schoolZh: document.getElementById("schoolZh"),
      schoolEn: document.getElementById("schoolEn"),
      siteSubtitle: document.getElementById("siteSubtitle"),
      footerSchool: document.getElementById("footerSchool"),
      footerText: document.getElementById("footerText"),
      siteNav: document.getElementById("siteNav"),

      searchInput: document.getElementById("searchInput"),
      sortSelect: document.getElementById("sortSelect"),
      metaLine: document.getElementById("metaLine"),
      status: document.getElementById("status"),

      featureSection: document.querySelector(".feature-section"),
      moreSection: document.querySelector(".more-section"),
      featuredArea: document.getElementById("featuredArea"),
      albumGrid: document.getElementById("albumGrid"),

      homeHero: document.getElementById("homeHero"),
      galleryControls: document.getElementById("galleryControls"),
      homeView: document.getElementById("homeView"),
      albumView: document.getElementById("albumView"),

      backBtn: document.getElementById("backBtn"),
      albumMasthead: document.getElementById("albumMasthead"),
      photoStatus: document.getElementById("photoStatus"),
      photoGrid: document.getElementById("photoGrid")
    };
  }

  function applyConfigText() {
    document.title = CONFIG.siteTitle || "尚片集";
    setText(els.schoolZh, CONFIG.schoolNameZh || "香海正覺蓮社佛教普光學校");
    setText(els.schoolEn, CONFIG.schoolNameEn || "HHCLKA Buddhist Po Kwong School");
    setText(els.siteSubtitle, CONFIG.siteSubtitle || "記錄學生的學習歷程，見證每一次參與、嘗試與進步。");
    setText(els.footerSchool, CONFIG.schoolNameZh || "香海正覺蓮社佛教普光學校");
    setText(els.footerText, CONFIG.footerText || CONFIG.schoolNameEn || "HHCLKA Buddhist Po Kwong School");
  }

  function renderBrandMark() {
    if (!els.brandMark) return;

    if (CONFIG.logoUrl) {
      els.brandMark.innerHTML = `<img src="${escapeAttr(CONFIG.logoUrl)}" alt="${escapeAttr(CONFIG.schoolNameZh || "學校標誌")}" />`;
      return;
    }

    els.brandMark.textContent = "尚";
  }

  function renderNav() {
    if (!els.siteNav) return;

    els.siteNav.innerHTML = categories.map(function (category) {
      const activeClass = category === state.activeCategory ? " is-active" : "";
      const href = `./?category=${encodeURIComponent(category)}`;

      return `<a class="nav-link${activeClass}" href="${escapeAttr(href)}" data-category="${escapeAttr(category)}"${category === state.activeCategory ? ' aria-current="page"' : ''}>${escapeHtml(category)}</a>`;
    }).join("");
  }

  function bindEvents() {
    if (els.siteNav) {
      els.siteNav.addEventListener("click", function (event) {
        const link = event.target.closest("[data-category]");
        if (!link) return;

        const nextCategory = normalizeCategory(link.dataset.category || FOCUS_CATEGORY);
        if (!categories.includes(nextCategory)) return;

        if (state.mode === "photos") {
          return;
        }

        event.preventDefault();
        state.activeCategory = nextCategory;
        state.returnCategory = nextCategory;
        syncNav();
        renderAlbums();
        updateUrlCategory(nextCategory);
      });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener("input", function () {
        if (state.mode === "albums" && state.activeCategory === REVIEW_CATEGORY) {
          renderAlbums();
        }
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", function () {
        state.sortBy = els.sortSelect.value || "newest";
        if (state.mode === "albums") {
          renderAlbums();
        }
      });
    }
  }

  function syncNav() {
    document.querySelectorAll("[data-category]").forEach(function (item) {
      const active = normalizeCategory(item.dataset.category || "") === state.activeCategory;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function updateUrlCategory(category) {
    const url = new URL(window.location.href);
    url.searchParams.set("category", category);
    url.searchParams.delete("album");
    url.searchParams.delete("from");
    window.history.replaceState({}, "", url.toString());
  }

  async function loadAlbums() {
    state.mode = "albums";
    state.currentAlbum = null;
    state.photos = [];
    showHomeView();
    renderInitialLoadingState();

    try {
      const data = await getJson("albums");
      if (!data || !data.ok) {
        throw new Error((data && data.error) || "Apps Script API 回傳錯誤");
      }

      state.albums = Array.isArray(data.albums)
        ? data.albums.map(normalizeAlbum).filter(isPublished)
        : [];

      renderAlbums();
    } catch (error) {
      showHomeError(error.message);
    }
  }

  async function loadAlbum(albumId) {
    state.mode = "photos";
    state.photos = [];
    showAlbumView();
    setLoadingStatus(els.photoStatus, "相片載入中", "正在整理相片牆，請稍候...");

    try {
      const data = await getJson("photos", { albumId: albumId });
      if (!data || !data.ok) {
        throw new Error((data && data.error) || "Apps Script API 回傳錯誤");
      }

      state.currentAlbum = normalizeAlbum(data.album || { id: albumId, title: "活動相簿" });
      state.returnCategory = state.currentAlbum.category || state.returnCategory || FOCUS_CATEGORY;
      state.photos = Array.isArray(data.photos) ? data.photos : [];

      renderAlbumMasthead(state.currentAlbum);
      renderPhotos();
      updateMetaLine([state.currentAlbum], state.photos.length);
    } catch (error) {
      renderAlbumMasthead({ title: "未能載入相簿", category: "相簿", description: "" });
      showPhotoError(error.message);
    }
  }

  function showHomeView() {
    if (els.homeHero) els.homeHero.hidden = false;
    if (els.homeView) els.homeView.hidden = false;
    if (els.albumView) els.albumView.hidden = true;
  }

  function showAlbumView() {
    if (els.homeHero) els.homeHero.hidden = true;
    if (els.galleryControls) els.galleryControls.hidden = true;
    if (els.homeView) els.homeView.hidden = true;
    if (els.albumView) els.albumView.hidden = false;
  }

  function renderInitialLoadingState() {
    const isFocus = state.activeCategory === FOCUS_CATEGORY;
    const isReview = state.activeCategory === REVIEW_CATEGORY;

    syncNav();

    if (els.galleryControls) {
      els.galleryControls.hidden = !isReview;
    }

    if (els.featureSection) {
      els.featureSection.hidden = !isFocus;
    }

    if (els.moreSection) {
      els.moreSection.hidden = !isReview;
    }

    const loadingHtml = renderLoadingState(
      "相簿資料載入中",
      "正在整理活動相簿，請稍候…"
    );

    if (isFocus && els.featuredArea) {
      els.featuredArea.innerHTML = loadingHtml;
    }

    if (isReview && els.albumGrid) {
      els.albumGrid.innerHTML = loadingHtml;
    }

    if (els.metaLine) {
      els.metaLine.hidden = true;
      setText(els.metaLine, "");
    }
  }

  function buildApiUrl(action, extra) {
    const params = new URLSearchParams(Object.assign({ action: action }, extra || {}));
    const baseUrl = CONFIG.apiBaseUrl || "./api";
    return baseUrl + (baseUrl.includes("?") ? "&" : "?") + params.toString();
  }

  function getJson(action, extra) {
    const url = buildApiUrl(action, extra);
    if ((CONFIG.apiMode || "jsonp") === "jsonp") return jsonp(url);

    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("API request failed: " + response.status);
      return response.json();
    });
  }

  function jsonp(url) {
    return new Promise(function (resolve, reject) {
      const callback = "jsonp_cb_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";
      const timer = window.setTimeout(function () {
        cleanup();
        reject(new Error("Apps Script JSONP 載入逾時"));
      }, 20000);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callback];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[callback] = function (data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("Apps Script JSONP 載入失敗"));
      };

      script.src = url + separator + "callback=" + encodeURIComponent(callback);
      document.body.appendChild(script);
    });
  }

  function normalizeAlbum(album) {
    const dateSource = album.dateText || album.activityDate || album.date || album.eventDateValue || "";
    const normalizedCategory = normalizeCategory(album.category || "");

    return {
      id: String(album.id || album.albumId || "").trim(),
      albumId: String(album.albumId || album.id || "").trim(),
      title: String(album.title || album.name || "未命名相簿").trim(),
      folderId: String(album.folderId || "").trim(),
      category: normalizedCategory || REVIEW_CATEGORY,
      dateText: formatDisplayDate(dateSource),
      rawDate: dateSource,
      description: String(album.description || "").trim(),
      coverUrl: String(album.coverUrl || album.thumbnailUrl || "").trim(),
      photoCount: Number(album.photoCount || album.count || 0),
      latestUpdated: album.latestUpdated || "",
      eventDateValue: Number(album.eventDateValue || 0),
      published: album.published
    };
  }

  function normalizeCategory(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (text === LEGACY_REVIEW_CATEGORY) return REVIEW_CATEGORY;
    return text;
  }

  function isPublished(album) {
    if (album.published === undefined || album.published === null || album.published === "") return true;
    return normalizeBoolean(album.published);
  }

  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false) return false;
    const text = String(value || "").trim().toUpperCase();
    return text === "TRUE" || text === "YES" || text === "Y" || text === "1" || text === "是";
  }

  function getVisibleAlbums() {
    const keyword = (els.searchInput ? els.searchInput.value : "").trim().toLowerCase();

    const filtered = state.albums.filter(function (album) {
      if (album.category !== state.activeCategory) return false;

      // 焦點活動是首頁主打，不需要搜尋。
      if (state.activeCategory === FOCUS_CATEGORY) return true;

      if (!keyword) return true;

      return [album.title, album.category, album.description, album.dateText]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return sortAlbums(filtered, state.sortBy);
  }

  function sortAlbums(list, sortBy) {
    const next = list.slice();

    if (sortBy === "oldest") {
      return next.sort(function (a, b) {
        return getAlbumDateValue(a) - getAlbumDateValue(b) || a.title.localeCompare(b.title, "zh-Hant");
      });
    }

    if (sortBy === "photoCount") {
      return next.sort(function (a, b) {
        return Number(b.photoCount || 0) - Number(a.photoCount || 0) || getAlbumDateValue(b) - getAlbumDateValue(a);
      });
    }

    return next.sort(function (a, b) {
      return getAlbumDateValue(b) - getAlbumDateValue(a) || a.title.localeCompare(b.title, "zh-Hant");
    });
  }

  function getAlbumDateValue(album) {
    if (Number(album.eventDateValue || 0)) return Number(album.eventDateValue);
    return parseDateValue(album.rawDate || album.dateText);
  }

  function renderAlbums() {
    const visible = getVisibleAlbums();
    const isFocus = state.activeCategory === FOCUS_CATEGORY;
    const isReview = state.activeCategory === REVIEW_CATEGORY;

    syncNav();

    if (els.galleryControls) {
      els.galleryControls.hidden = !isReview;
    }

    if (els.featureSection) {
      els.featureSection.hidden = !isFocus;
    }

    if (els.moreSection) {
      els.moreSection.hidden = !isReview;
    }

    if (isFocus) {
      // 「顯示 X 個相簿」狀態列已按 Jason 要求移除；焦點活動直接顯示相簿內容。
      if (els.featuredArea) {
        els.featuredArea.innerHTML = renderFocusAlbums(visible);
      }
    }

    if (isReview) {
      // 「顯示 X 個相簿」狀態列已移除；活動回顧以相簿 grid 及 meta-line 顯示資料。
      if (els.albumGrid) {
        els.albumGrid.innerHTML = visible.length
          ? visible.map(renderAlbumCard).join("")
          : renderEmptyState("未找到相簿", "請嘗試其他搜尋字眼，或稍後再來看看。");
      }
    }

    updateMetaLine(visible);
  }

  function renderFocusAlbums(albums) {
    if (!albums.length) {
      return renderEmptyState("更新中，密切留意", "精彩活動相片陸續整理中，歡迎稍後再來看看。");
    }

    const lead = albums[0];
    const others = albums.slice(1);

    return `
      ${renderFeaturedCard(lead)}
      ${others.length ? `
        <div class="focus-grid" aria-label="更多焦點活動">
          ${others.map(renderFocusMiniCard).join("")}
        </div>
      ` : ""}
    `;
  }

  function renderFeaturedCard(album) {
    const href = makeAlbumHref(album);

    return `
      <article class="featured-card">
        <div class="featured-copy">
          <span class="feature-label">${escapeHtml(album.category)}</span>
          <h3 class="featured-title">${escapeHtml(album.title)}</h3>
          <p class="featured-desc">${escapeHtml(album.description || "活動相片已整理成專題相簿，記錄學習與參與的精彩片段。")}</p>
          <div class="feature-meta">
            <span>${escapeHtml(album.dateText)}</span>
            <span>${Number(album.photoCount || 0)} 張相片</span>
          </div>
          <a class="feature-action" href="${escapeAttr(href)}">查看相簿</a>
        </div>

        <a class="featured-media" href="${escapeAttr(href)}" aria-label="查看 ${escapeAttr(album.title)}">
          ${renderCoverImage(album.coverUrl, album.title)}
        </a>
      </article>
    `;
  }

  function renderFocusMiniCard(album) {
    const href = makeAlbumHref(album);

    return `
      <article class="focus-card">
        <a class="focus-cover" href="${escapeAttr(href)}" aria-label="查看 ${escapeAttr(album.title)}">
          ${renderCoverImage(album.coverUrl, album.title)}
        </a>
        <div class="focus-body">
          <span class="focus-label">${escapeHtml(album.category)}</span>
          <h3>${escapeHtml(album.title)}</h3>
          <p>${escapeHtml(excerpt(album.description || "活動相片已整理成焦點相簿。", 78))}</p>
          <div class="focus-meta">
            <span>${escapeHtml(album.dateText)}</span>
            <span>${Number(album.photoCount || 0)} 張相片</span>
          </div>
          <a class="focus-action" href="${escapeAttr(href)}">查看相簿</a>
        </div>
      </article>
    `;
  }

  function renderAlbumCard(album) {
    const href = makeAlbumHref(album);

    return `
      <article class="album-card">
        <a class="album-cover" href="${escapeAttr(href)}" aria-label="查看 ${escapeAttr(album.title)}">
          ${renderCoverImage(album.coverUrl, album.title)}
          <span class="album-label">${escapeHtml(album.category)}</span>
        </a>

        <div class="album-body">
          <h3 class="album-title">${escapeHtml(album.title)}</h3>
          <p class="album-desc">${escapeHtml(excerpt(album.description || "活動相片已整理成相簿，歡迎瀏覽。", 76))}</p>
          <div class="album-meta">
            <span>${escapeHtml(album.dateText)}</span>
            <span>${Number(album.photoCount || 0)} 張相片</span>
          </div>
          <a class="album-action" href="${escapeAttr(href)}">查看相簿</a>
        </div>
      </article>
    `;
  }

  function renderAlbumMasthead(album) {
    if (!els.albumMasthead) return;

    const returnCategory = album.category || state.returnCategory || FOCUS_CATEGORY;
    if (els.backBtn) {
      els.backBtn.href = `./?category=${encodeURIComponent(returnCategory)}`;
      els.backBtn.textContent = `返回${returnCategory}`;
    }

    els.albumMasthead.innerHTML = `
      <div class="masthead-cover">
        ${renderCoverImage(album.coverUrl, album.title)}
      </div>
      <div class="masthead-content">
        <span class="masthead-label">${escapeHtml(album.category || "活動相簿")}</span>
        <h1 class="masthead-title">${escapeHtml(album.title || "活動相簿")}</h1>
        <p class="masthead-desc">${escapeHtml(album.description || "活動相片已整理成相片牆。")}</p>
        <div class="masthead-meta">
          <span>${escapeHtml(album.dateText || "日期待定")}</span>
          <span>${Number(album.photoCount || state.photos.length || 0)} 張相片</span>
        </div>
      </div>
    `;
  }

  function renderPhotos() {
    if (!els.photoGrid) return;

    setNormalStatus(els.photoStatus, state.photos.length
      ? `顯示 ${state.photos.length} 張相片`
      : "此相簿暫時未有可顯示相片");

    els.photoGrid.innerHTML = state.photos.length
      ? state.photos.map(renderPhotoTile).join("")
      : renderEmptyState("暫時未有相片", "相片整理中，歡迎稍後再來看看。");
  }

  function renderPhotoTile(photo) {
    const imageUrl = photo.thumbnailUrl || photo.imageUrl || "";
    const viewUrl = photo.viewUrl || photo.url || imageUrl || "#";

    return `
      <a class="photo-tile" href="${escapeAttr(viewUrl)}" target="_blank" rel="noopener" aria-label="開啟 Google Drive 原圖">
        <img src="${escapeAttr(imageUrl)}" alt="相簿相片" loading="lazy" onerror="this.style.opacity='0';" />
      </a>
    `;
  }

  function renderCoverImage(url, title) {
    if (!url) return renderCoverFallback();

    return `
      <img src="${escapeAttr(url)}" alt="${escapeAttr(title || "活動相簿封面")}" loading="lazy" onerror="this.remove();" />
    `;
  }

  function renderCoverFallback() {
    return `
      <span class="cover-art" aria-hidden="true"></span>
    `;
  }

  function renderLoadingState(title, detail) {
    return `<div class="loading-state" role="status" aria-live="polite"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;
  }

  function renderEmptyState(title, detail) {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;
  }

  function renderErrorState(title, detail) {
    return `<div class="error-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`;
  }

  function showHomeError(message) {
    const errorHtml = renderErrorState("載入失敗", message);

    if (state.activeCategory === FOCUS_CATEGORY && els.featuredArea) {
      els.featuredArea.innerHTML = errorHtml;
    }

    if (state.activeCategory === REVIEW_CATEGORY && els.albumGrid) {
      els.albumGrid.innerHTML = errorHtml;
    }

    updateMetaLine([]);
  }

  function showPhotoError(message) {
    setNormalStatus(els.photoStatus, "未能載入相片");
    if (els.photoGrid) els.photoGrid.innerHTML = renderErrorState("載入失敗", message);
    updateMetaLine([], 0);
  }

  function updateMetaLine(list, explicitPhotoCount) {
    const albumsForMeta = Array.isArray(list) ? list : [];

    if (!els.metaLine) return;

    if (state.mode === "albums" && state.activeCategory === FOCUS_CATEGORY) {
      els.metaLine.hidden = true;
      setText(els.metaLine, "");
      return;
    }

    els.metaLine.hidden = false;

    const albumCount = state.mode === "photos" ? 1 : albumsForMeta.length;
    const photoCount = Number.isFinite(explicitPhotoCount)
      ? explicitPhotoCount
      : albumsForMeta.reduce(function (sum, album) {
        return sum + Number(album.photoCount || 0);
      }, 0);

    const latest = sortAlbums(albumsForMeta, "newest")[0];
    const latestText = latest ? latest.dateText : "日期待定";

    setText(els.metaLine, `${albumCount} 個相簿　${photoCount} 張相片　最新活動：${latestText}`);
  }

  function makeAlbumHref(album) {
    const id = album.id || album.albumId;
    const from = album.category || state.activeCategory || FOCUS_CATEGORY;
    return `?album=${encodeURIComponent(id)}&from=${encodeURIComponent(from)}`;
  }

  function formatDisplayDate(value) {
    const timestamp = parseDateValue(value);
    if (!timestamp) return "日期待定";

    const date = new Date(timestamp);
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-");
  }

  function parseDateValue(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;

    const raw = String(value || "").trim();
    if (!raw) return 0;

    const yyyyMmDd = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (yyyyMmDd) return new Date(Number(yyyyMmDd[1]), Number(yyyyMmDd[2]) - 1, Number(yyyyMmDd[3])).getTime();

    const zhDate = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (zhDate) return new Date(Number(zhDate[1]), Number(zhDate[2]) - 1, Number(zhDate[3])).getTime();

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function excerpt(text, maxLength) {
    const value = String(text || "").trim();
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - 1).trim() + "…";
  }

  function setLoadingStatus(element, title, detail) {
    if (!element) return;
    element.classList.add("is-loading");
    element.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail || "")}</span>`;
  }

  function setNormalStatus(element, value) {
    if (!element) return;
    element.classList.remove("is-loading");
    element.textContent = value;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(text) {
    return escapeHtml(text).replaceAll("`", "&#096;");
  }

  window.GalleryAppTest = {
    excerpt,
    formatDisplayDate,
    normalizeAlbum,
    normalizeCategory,
    parseDateValue,
    renderPhotoTile,
    sortAlbums
  };

  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
