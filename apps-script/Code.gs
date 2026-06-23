function doGet(e) {
  e = e || { parameter: {} };

  const action = e.parameter.action || "albums";
  const publicReadActions = ["albums", "photos", "latest", "list"];

  try {
    if (!publicReadActions.includes(action)) {
      return jsonOutput_({ ok: false, error: "Unknown action" }, e);
    }

    if (action === "albums") {
      return jsonOutput_(getAlbumsData_(), e);
    }

    if (action === "photos") {
      return jsonOutput_(getPhotosByAlbumData_(e.parameter.albumId), e);
    }

    if (action === "latest" || action === "list") {
      return jsonOutput_(getLatestPhotosData_(e.parameter.limit || 24), e);
    }

    return jsonOutput_({ ok: false, error: "Unknown action" }, e);
  } catch (error) {
    return jsonOutput_({ ok: false, error: error.message }, e);
  }
}

function getAlbumsData_() {
  const albums = getPublishedAlbums_();

  const result = albums.map(function(album) {
    const photos = getImagesFromFolder_(album.folderId);
    const latestPhoto = photos[0] || null;

    return {
      id: album.albumId,
      albumId: album.albumId,
      title: album.title,
      folderId: album.folderId,
      category: album.category,
      dateText: album.dateText,
      description: album.description,
      coverFileId: album.coverFileId,
      coverUrl: album.coverFileId
        ? makeThumbnailUrl_(album.coverFileId)
        : latestPhoto
          ? latestPhoto.thumbnailUrl
          : "",
      photoCount: photos.length,
      latestUpdated: latestPhoto ? latestPhoto.updatedAt : "",
      eventDateValue: album.eventDateValue,
      featured: album.featured,
      remarks: album.remarks
    };
  });

  result.sort(sortAlbumsByDateDesc_);

  return { ok: true, count: result.length, albums: result };
}

function getPhotosByAlbumData_(albumId) {
  if (!albumId) {
    return { ok: false, error: "Missing albumId" };
  }

  const albums = getPublishedAlbums_();
  const album = albums.find(function(item) {
    return item.albumId === albumId;
  });

  if (!album) {
    return { ok: false, error: "Album not found" };
  }

  const photos = getImagesFromFolder_(album.folderId);

  return {
    ok: true,
    album: {
      id: album.albumId,
      albumId: album.albumId,
      title: album.title,
      category: album.category,
      dateText: album.dateText,
      description: album.description,
      coverFileId: album.coverFileId,
      coverUrl: album.coverFileId
        ? makeThumbnailUrl_(album.coverFileId)
        : photos[0]
          ? photos[0].thumbnailUrl
          : "",
      photoCount: photos.length,
      latestUpdated: photos[0] ? photos[0].updatedAt : "",
      eventDateValue: album.eventDateValue,
      featured: album.featured
    },
    count: photos.length,
    photos: photos
  };
}

function getLatestPhotosData_(limit) {
  const albums = getPublishedAlbums_();
  let allPhotos = [];

  albums.forEach(function(album) {
    const photos = getImagesFromFolder_(album.folderId).map(function(photo) {
      return Object.assign({}, photo, {
        albumId: album.albumId,
        albumTitle: album.title,
        category: album.category,
        albumDescription: album.description
      });
    });

    allPhotos = allPhotos.concat(photos);
  });

  allPhotos.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const max = Math.max(1, Number(limit) || 24);

  return {
    ok: true,
    count: allPhotos.length,
    photos: allPhotos.slice(0, max)
  };
}

function getPublishedAlbums_() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("ALBUM_SHEET_ID");
  const sheetName = props.getProperty("ALBUM_SHEET_NAME") || "Albums";

  if (!sheetId) {
    throw new Error("Missing ALBUM_SHEET_ID");
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Cannot find sheet: " + sheetName);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function(h) {
    return String(h).trim();
  });

  function col(names) {
    for (let i = 0; i < names.length; i++) {
      const index = headers.indexOf(names[i]);
      if (index !== -1) return index;
    }
    return -1;
  }

  const cAlbumId = col(["相簿代號", "albumId"]);
  const cTitle = col(["相簿名稱", "title"]);
  const cFolderId = col(["資料夾ID", "folderId"]);
  const cCategory = col(["分類", "category"]);
  const cDateText = col(["活動日期", "dateText"]);
  const cDescription = col(["相簿簡介", "description"]);
  const cCoverFileId = col(["封面圖片ID", "coverFileId"]);
  const cPublished = col(["公開顯示", "published"]);
  const cFeatured = col(["精選活動", "featured"]);
  const cRemarks = col(["內部備註", "remarks"]);

  const required = [
    [cAlbumId, "相簿代號"],
    [cTitle, "相簿名稱"],
    [cFolderId, "資料夾ID"],
    [cCategory, "分類"],
    [cDateText, "活動日期"],
    [cDescription, "相簿簡介"],
    [cCoverFileId, "封面圖片ID"],
    [cPublished, "公開顯示"]
  ];

  required.forEach(function(item) {
    if (item[0] === -1) {
      throw new Error("Missing column: " + item[1]);
    }
  });

  return values.slice(1)
    .map(function(row) {
      const dateText = formatSheetDate_(row[cDateText]);

      return {
        albumId: String(row[cAlbumId] || "").trim(),
        title: String(row[cTitle] || "").trim(),
        folderId: String(row[cFolderId] || "").trim(),
        category: String(row[cCategory] || "").trim(),
        dateText: dateText,
        description: String(row[cDescription] || "").trim(),
        coverFileId: String(row[cCoverFileId] || "").trim(),
        published: normalizeBoolean_(row[cPublished]) ? "TRUE" : "FALSE",
        featured: cFeatured >= 0 && normalizeBoolean_(row[cFeatured]) ? "TRUE" : "FALSE",
        remarks: cRemarks >= 0 ? String(row[cRemarks] || "").trim() : "",
        eventDateValue: getDateValue_(row[cDateText])
      };
    })
    .filter(function(album) {
      return album.albumId && album.title && album.folderId && album.published === "TRUE";
    })
    .sort(sortAlbumsByDateDesc_);
}

function getImagesFromFolder_(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const photos = [];

  while (files.hasNext()) {
    const file = files.next();
    const mimeType = file.getMimeType();

    if (!mimeType.startsWith("image/")) continue;

    const fileId = file.getId();

    photos.push({
      id: fileId,
      name: file.getName(),
      mimeType: mimeType,
      createdAt: file.getDateCreated().toISOString(),
      updatedAt: file.getLastUpdated().toISOString(),
      thumbnailUrl: makeThumbnailUrl_(fileId),
      viewUrl: "https://drive.google.com/file/d/" + fileId + "/view"
    });
  }

  photos.sort(function(a, b) {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return photos;
}

function makeThumbnailUrl_(fileId) {
  return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";
}

function jsonOutput_(data, e) {
  const json = JSON.stringify(data);
  const callback = e && e.parameter ? String(e.parameter.callback || "") : "";

  if (callback && isValidCallbackName_(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidCallbackName_(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(name);
}

function normalizeBoolean_(value) {
  if (value === true) return true;
  const text = String(value || "").trim().toUpperCase();
  return text === "TRUE" || text === "是" || text === "YES" || text === "Y" || text === "1";
}

function getDateValue_(value) {
  if (value instanceof Date) return value.getTime();

  const raw = String(value || "").trim();
  if (!raw) return 0;

  const yyyyMmDd = raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (yyyyMmDd) return new Date(Number(yyyyMmDd[1]), Number(yyyyMmDd[2]) - 1, Number(yyyyMmDd[3])).getTime();

  const ddMmYyyy = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (ddMmYyyy) return new Date(Number(ddMmYyyy[3]), Number(ddMmYyyy[2]) - 1, Number(ddMmYyyy[1])).getTime();

  const zhDate = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (zhDate) return new Date(Number(zhDate[1]), Number(zhDate[2]) - 1, Number(zhDate[3])).getTime();

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatSheetDate_(value) {
  const timestamp = getDateValue_(value);
  if (!timestamp) return String(value || "").trim();
  const date = new Date(timestamp);
  return date.getFullYear() + "-" + pad_(date.getMonth() + 1) + "-" + pad_(date.getDate());
}

function pad_(value) {
  return String(value).padStart(2, "0");
}

function sortAlbumsByDateDesc_(a, b) {
  return Number(b.eventDateValue || 0) - Number(a.eventDateValue || 0);
}

function authorizeSetup() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty("ALBUM_SHEET_ID");
  const sheetName = props.getProperty("ALBUM_SHEET_NAME") || "Albums";

  if (!sheetId) {
    throw new Error("Missing ALBUM_SHEET_ID");
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Cannot find sheet: " + sheetName);
  }

  const values = sheet.getDataRange().getValues();
  const albums = getPublishedAlbums_();

  Logger.log("Sheet name: " + sheet.getName());
  Logger.log("Rows: " + values.length);
  Logger.log("Published albums: " + albums.length);

  if (albums.length > 0) {
    const folder = DriveApp.getFolderById(albums[0].folderId);
    Logger.log("First album folder: " + folder.getName());
    Logger.log("Drive files iterator ready: " + folder.getFiles().hasNext());
  }
}
