const state = {
  files: {
    products: [],
    inventory: null,
    iw: null,
  },
  iwHeaders: [],
  result: null,
  view: 'actions',
  priceFilter: 'all',
  priceSelectionDirty: false,
  theme: 'auto',
};

const THEME_KEY = 'inventariosync-theme';
const THEME_MODES = ['auto', 'light', 'dark'];
const THEME_LABELS = {
  auto: 'Tema automático (sigue a Windows). Clic para tema claro.',
  light: 'Tema claro. Clic para tema oscuro.',
  dark: 'Tema oscuro. Clic para tema automático.',
};
const MOBILE_NAV_WIDTH = 1100;

const SEARCH_CACHE = Symbol('searchCache');
const FILE_FRESHNESS_LIMIT_MS = 12 * 60 * 60 * 1000;
const REQUIRED_PRODUCT_FIELDS = ['Variant SKU', 'SKU'];
const PRICE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'same-price', label: 'Coinciden' },
  { id: 'shopify-sale', label: 'Oferta Shopify' },
  { id: 'shopify-only-sale', label: 'Oferta: regular coincide' },
  { id: 'other-iw-price', label: 'Coincide con otra lista' },
  { id: 'price-difference', label: 'Diferencias' },
  { id: 'shopify-higher', label: 'Shopify más alto' },
  { id: 'shopify-lower', label: 'Shopify más bajo' },
  { id: 'iw-price-missing', label: 'Sin precio IW' },
  { id: 'invalid-price', label: 'Precio 0/inválido' },
  { id: 'compare-at-issue', label: 'Compare-at inconsistente' },
  { id: 'no-iw', label: 'Sin producto IW' },
];
const TARGET_LOCATION_DEFAULTS = [
  {
    label: 'Sucursal Chalchuapa',
    shopify: 'Sucursal Chalchuapa',
    iw: 'ALMACEN',
    selectId: 'mapChalchuapa',
  },
  {
    label: 'Sucursal Santa Ana Independencia',
    shopify: 'Sucursal Santa Ana Independencia',
    aliases: ['Sucursal Santa Ana'],
    iw: 'ALMACEN SANTA ANA',
    selectId: 'mapSantaAna',
  },
  {
    label: 'Sucursal Santa Ana Zarzamora',
    shopify: 'Sucursal Santa Ana Zarzamora',
    aliases: ['Sucursal Zarzamora', 'Sucursal Santa Ana Zarzamora'],
    iw: 'ALMACEN ZARZAMORA',
    selectId: 'mapZarzamora',
  },
];

const IW_FIELD_ALIASES = {
  barcode: ['Código de Barras', 'Codigo de Barras', 'Código Barras', 'Barcode', 'UPC'],
  code: ['Código', 'Codigo', 'SKU', 'Item'],
  title: ['Nombre Comercial', 'Producto', 'Descripción', 'Descripcion', 'Nombre'],
  price4: ['Precio 4', 'Price 4', 'Precio4'],
};

const PRODUCT_FIELD_ALIASES = {
  handle: ['Handle', 'URL handle'],
  sku: ['Variant SKU', 'SKU'],
  barcode: ['Variant Barcode', 'Variant Barcodes', 'Barcode', 'Barcodes'],
  title: ['Title'],
  status: ['Status'],
  published: ['Published', 'Published on online store'],
  inventoryTracker: ['Variant Inventory Tracker', 'Inventory tracker'],
  option1Name: ['Option1 Name', 'Option 1 Name'],
  option1Value: ['Option1 Value', 'Option 1 Value'],
  option2Name: ['Option2 Name', 'Option 2 Name'],
  option2Value: ['Option2 Value', 'Option 2 Value'],
  option3Name: ['Option3 Name', 'Option 3 Name'],
  option3Value: ['Option3 Value', 'Option 3 Value'],
};

const INVENTORY_FIELD_ALIASES = {
  handle: ['Handle', 'URL handle'],
  sku: ['SKU', 'Variant SKU'],
  location: ['Location'],
  option1Name: ['Option1 Name', 'Option 1 Name'],
  option1Value: ['Option1 Value', 'Option 1 Value'],
  option2Name: ['Option2 Name', 'Option 2 Name'],
  option2Value: ['Option2 Value', 'Option 2 Value'],
  option3Name: ['Option3 Name', 'Option 3 Name'],
  option3Value: ['Option3 Value', 'Option 3 Value'],
  available: ['Available (not editable)'],
  onHandCurrent: ['On hand (current)'],
  onHandNew: ['On hand (new)'],
};

const views = {
  all: {
    columns: [
      'Producto',
      'SKU',
      'UPC Shopify',
      'Handle',
      'Archivo Shopify',
      'Fila Shopify',
      'Estado Shopify',
      'Publicado',
      'En inventario Shopify',
      'Filas inventario Shopify',
      'Coincidencia IW',
      'CSV Shopify',
      'Tracking Shopify',
      'Existencia IW',
      'Shopify actual',
      'Precio Shopify actual',
      'Precio regular Shopify',
      'Oferta',
      'Detalle',
    ],
    getRows: () => state.result?.allProducts ?? [],
  },
  upload: {
    columns: [
      'Decision',
      'Motivo',
      'Estado producto',
      'SKU',
      'UPC Shopify',
      'Producto',
      'Opciones',
      'Sucursal',
      'Coincidencia IW',
      'Tracking Shopify',
      'Paso previo',
      'Shopify actual',
      'IW nuevo',
      'En CSV Shopify',
      'Detalle',
    ],
    getRows: () => state.result?.uploadAudit ?? [],
  },
  updated: {
    columns: [
      'Motivo',
      'Estado producto',
      'SKU',
      'UPC Shopify',
      'Producto',
      'Opciones',
      'Sucursal',
      'Shopify actual total',
      'IW nuevo total',
      'Diferencia total',
      'Detalle',
    ],
    getRows: () => state.result?.updatedProducts ?? [],
  },
  shopify: {
    columns: [
      'Accion',
      'Handle',
      'SKU',
      'UPC Shopify',
      'Producto',
      'Estado actual',
      'Estado recomendado',
      'Existencia IW',
      'Shopify actual',
      'En CSV estados',
      'En CSV inventario',
      'Tracking Shopify',
      'Detalle',
    ],
    getRows: () => state.result?.shopifyStatus ?? [],
  },
  actions: {
    columns: ['Acción', 'UPC Shopify', 'SKU', 'Producto', 'IW Total', 'Shopify actual', 'Detalle'],
    getRows: () => state.result?.actions ?? [],
  },
  prices: {
    columns: [
      'Estado',
      'Producto',
      'SKU',
      'UPC Shopify',
      'Precio Shopify actual',
      'Precio regular Shopify',
      'Precio oferta Shopify',
      'Lista de precio IW',
      'Precio IW seleccionado',
      'Diferencia actual vs IW',
      'Diferencia regular vs IW',
      'Coincide con otra lista IW',
      'Oferta',
      'Coincidencia IW',
      'Existencia IW',
      'Existencia Shopify',
      'Diferencia existencia',
      'CSV Shopify',
      'Tracking Shopify',
      'Detalle',
    ],
    getRows: () => state.result?.priceReport ?? [],
  },
  zero: {
    columns: ['UPC Shopify', 'SKU', 'Producto', 'Chalchuapa', 'Santa Ana', 'Zarzamora', 'Total IW'],
    getRows: () => state.result?.zeroStock ?? [],
  },
  missing: {
    columns: ['Código IW', 'Código de barras IW', 'Producto IW', 'Chalchuapa', 'Santa Ana', 'Zarzamora', 'Total IW'],
    getRows: () => state.result?.missingInShopify ?? [],
  },
  review: {
    columns: ['Tipo', 'UPC / SKU', 'Producto', 'Sucursal', 'Detalle'],
    getRows: () => state.result?.review ?? [],
  },
};

const els = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  applyTheme(readStoredTheme());
  bindEvents();
  updateFileLabels();
  renderMetrics();
  renderTabCounts();
  renderPriceFilterCounts();
  renderPriceFilterState();
});

function cacheElements() {
  [
    'productsInput',
    'inventoryInput',
    'iwInput',
    'productsFiles',
    'inventoryFiles',
    'iwFiles',
    'fileStatus',
    'processButton',
    'processMessage',
    'metricsGrid',
    'downloadInventory',
    'downloadStatus',
    'downloadReport',
    'downloadPriceReport',
    'downloadMissing',
    'resultsTable',
    'searchInput',
    'tableCount',
    'resetButton',
    'clampNegative',
    'skuFallback',
    'removeCurrentOnHand',
    'onlyUpdatedRows',
    'zeroMissingIw',
    'zeroNoUpc',
    'downloadUntracked',
    'downloadZeroed',
    'downloadUpcFix',
    'progressBar',
    'processButtonLabel',
    'processMessageText',
    'dropProducts',
    'dropInventory',
    'dropIw',
    'sidebarToggle',
    'configToggle',
    'themeToggle',
    'navBackdrop',
    'iwPriceColumn',
    'iwPriceStatus',
    'resultsTitle',
    'resultsSubtitle',
    'priceComparisonSummary',
    'priceReferenceText',
    'priceSummaryGrid',
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.productsInput.addEventListener('change', async (event) => {
    state.files.products = [...event.target.files];
    updateFileLabels();
  });

  els.inventoryInput.addEventListener('change', (event) => {
    state.files.inventory = event.target.files[0] ?? null;
    updateFileLabels();
  });

  els.iwInput.addEventListener('change', async (event) => {
    state.files.iw = event.target.files[0] ?? null;
    updateFileLabels();
    await previewIwHeaders();
  });

  if (els.iwPriceColumn) {
    els.iwPriceColumn.addEventListener('change', handlePriceColumnChange);
  }

  bindDropZones();

  els.processButton.addEventListener('click', processFiles);
  els.searchInput.addEventListener('input', renderTable);
  els.resetButton.addEventListener('click', resetApp);
  els.downloadInventory.addEventListener('click', () => {
    if (!state.result) return;
    const summary = state.result.metrics || {};
    const zeroedActive = summary.zeroedActiveVariants ?? 0;
    const zeroedRows = summary.zeroedRows ?? 0;
    if (zeroedActive > 0 || (summary.csvRows && zeroedRows > 0.15 * summary.csvRows)) {
      const ok = window.confirm(
        `Este CSV pone en 0 ${formatNumber(zeroedRows)} filas (${formatNumber(zeroedActive)} variantes de productos ACTIVOS) porque su UPC no existe en IW. Descarga "Puestos en 0" y revisa la pestaña Actualizados antes de subirlo. ¿Descargar de todas formas?`
      );
      if (!ok) return;
    }
    downloadText(
      state.result.inventoryCsv,
      `shopify_inventory_actualizado_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });
  els.downloadStatus.addEventListener('click', () => {
    if (!state.result) return;
    downloadText(
      state.result.productStatusCsv,
      `shopify_productos_estados_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });
  els.downloadReport.addEventListener('click', () => {
    if (!state.result) return;
    downloadText(
      csvFromObjects(state.result.reportRows),
      `reporte_completo_shopify_iw_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });
  els.downloadPriceReport.addEventListener('click', () => {
    if (!state.result) return;
    const priceColumn = state.result.priceColumn || 'precio_iw';
    downloadText(
      csvFromObjects(state.result.priceReportRows),
      `reporte_precios_shopify_iw_${fileSlug(priceColumn)}_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });
  els.downloadMissing.addEventListener('click', () => {
    if (!state.result) return;
    downloadText(
      csvFromObjects(state.result.missingInShopify),
      `productos_iw_no_creados_shopify_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });
  els.downloadUpcFix.addEventListener('click', () => {
    if (!state.result) return;
    const rows = state.result.upcFixRows ?? [];
    if (!rows.length) {
      setMessage('No hay UPC pendientes de corregir.');
      return;
    }
    downloadText(csvFromObjects(rows), `upc_por_corregir_shopify_${dateStamp()}.csv`, 'text/csv;charset=utf-8');
  });
  els.downloadZeroed.addEventListener('click', () => {
    if (!state.result) return;
    const rows = state.result.zeroedRows ?? [];
    if (!rows.length) {
      setMessage('No hay filas puestas en 0 en esta comparación.');
      return;
    }
    downloadText(csvFromObjects(rows), `se_pondran_en_0_${dateStamp()}.csv`, 'text/csv;charset=utf-8');
  });
  els.downloadUntracked.addEventListener('click', () => {
    if (!state.result) return;
    const rows = state.result.untrackedRows ?? [];
    if (!rows.length) {
      setMessage('No hay variantes activas sin seguimiento de inventario.');
      return;
    }
    downloadText(
      csvFromObjects(rows),
      `productos_sin_tracking_shopify_${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  });

  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveView(button.dataset.view);
      closeMobileNav();
    });
  });

  if (els.sidebarToggle) {
    els.sidebarToggle.addEventListener('click', toggleSidebar);
  }

  if (els.navBackdrop) {
    els.navBackdrop.addEventListener('click', closeMobileNav);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNav();
  });

  if (els.themeToggle) {
    els.themeToggle.addEventListener('click', () => {
      const index = THEME_MODES.indexOf(state.theme);
      applyTheme(THEME_MODES[(index + 1) % THEME_MODES.length]);
    });
  }

  if (els.configToggle) {
    els.configToggle.addEventListener('click', () => {
      const setup = document.getElementById('setup');
      if (setup && setup.scrollIntoView) setup.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileNav();
    });
  }

  document.querySelectorAll('[data-price-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.priceFilter = button.dataset.priceFilter || 'all';
      renderPriceFilterState();
      renderTable();
    });
  });
}

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch (error) {
    return 'auto';
  }
}

function applyTheme(mode) {
  const theme = THEME_MODES.includes(mode) ? mode : 'auto';
  state.theme = theme;

  const root = document.documentElement;
  if (root) {
    if (theme === 'auto') {
      if (root.removeAttribute) root.removeAttribute('data-theme');
    } else if (root.setAttribute) {
      root.setAttribute('data-theme', theme);
    }
  }

  try {
    if (theme === 'auto') window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* sin almacenamiento: el tema dura lo que la sesión */
  }

  if (els.themeToggle) {
    els.themeToggle.title = THEME_LABELS[theme];
    if (els.themeToggle.setAttribute) els.themeToggle.setAttribute('aria-label', THEME_LABELS[theme]);
  }
}

function isMobileNav() {
  return Number(window.innerWidth) > 0 && Number(window.innerWidth) <= MOBILE_NAV_WIDTH;
}

function toggleSidebar() {
  const body = document.body;
  const opened = isMobileNav() ? body.classList.toggle('nav-open') : !body.classList.toggle('nav-collapsed');
  if (els.sidebarToggle && els.sidebarToggle.setAttribute) {
    els.sidebarToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
  }
}

function closeMobileNav() {
  if (!isMobileNav()) return;
  document.body.classList.remove('nav-open');
  if (els.sidebarToggle && els.sidebarToggle.setAttribute) els.sidebarToggle.setAttribute('aria-expanded', 'false');
}

function bindDropZones() {
  [
    ['dropProducts', 'productsInput'],
    ['dropInventory', 'inventoryInput'],
    ['dropIw', 'iwInput'],
  ].forEach(([zoneId, inputId]) => {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;

    ['dragenter', 'dragover'].forEach((type) => {
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach((type) => {
      zone.addEventListener(type, () => zone.classList.remove('is-dragover'));
    });

    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      const dropped = event.dataTransfer && event.dataTransfer.files;
      if (!dropped || !dropped.length) return;
      try {
        input.files = dropped;
      } catch (error) {
        return;
      }
      input.dispatchEvent(new Event('change'));
    });
  });
}

function setDropState(node, loaded) {
  if (node) node.classList.toggle('is-loaded', Boolean(loaded));
}

function updateFileLabels() {
  els.productsFiles.textContent = describeFiles(state.files.products);
  els.inventoryFiles.textContent = state.files.inventory ? describeFile(state.files.inventory) : 'Sin archivo';
  els.iwFiles.textContent = state.files.iw ? describeFile(state.files.iw) : 'Sin archivo';

  setDropState(els.dropProducts, state.files.products.length);
  setDropState(els.dropInventory, state.files.inventory);
  setDropState(els.dropIw, state.files.iw);

  const ready = state.files.products.length && state.files.inventory && state.files.iw;
  els.fileStatus.textContent = ready ? 'Listo para comparar' : 'Esperando archivos';
  els.fileStatus.dataset.ready = ready ? 'true' : 'false';
  els.processButton.disabled = !ready;
}

function setActiveView(view) {
  state.view = views[view] ? view : 'actions';
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === state.view);
  });
  renderPriceFilterState();
  renderTable();
}

function describeFiles(files) {
  if (!files?.length) return 'Sin archivos';
  if (files.length === 1) return describeFile(files[0]);
  return `${files.length} archivos (${formatFileDate(newestModified(files))}): ${files.map((file) => file.name).join(', ')}`;
}

function describeFile(file) {
  return `${file.name} · ${formatFileDate(file.lastModified)}`;
}

function newestModified(files) {
  return Math.max(...files.map((file) => Number(file.lastModified) || 0));
}

function formatFileDate(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || !value) return 'fecha desconocida';
  return new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function filesSignature() {
  return [...state.files.products, state.files.inventory, state.files.iw]
    .filter(Boolean)
    .map((file) => `${file.name}:${file.lastModified}`)
    .join('|');
}

function freshnessGateReason() {
  const products = state.files.products.map((file) => Number(file.lastModified) || 0).filter(Boolean);
  const inventory = Number(state.files.inventory?.lastModified) || 0;
  const iwFile = Number(state.files.iw?.lastModified) || 0;
  const all = [...products, inventory, iwFile].filter(Boolean);
  if (!all.length) return '';
  const dayMs = 24 * 60 * 60 * 1000;
  const newestProducts = products.length ? Math.max(...products) : 0;
  if (newestProducts && inventory && inventory - newestProducts > dayMs) {
    return `el export de productos (${formatFileDate(newestProducts)}) es más de 24 horas más antiguo que el inventario (${formatFileDate(inventory)})`;
  }
  const spread = Math.max(...all) - Math.min(...all);
  if (spread > 2 * dayMs) {
    return `los archivos tienen más de 48 horas de diferencia entre sí (${formatFileDate(Math.min(...all))} a ${formatFileDate(Math.max(...all))})`;
  }
  return '';
}

function fileFreshnessWarning() {
  const entries = [
    ...state.files.products.map((file) => ({ label: 'productos', file })),
    { label: 'inventario', file: state.files.inventory },
    { label: 'IW', file: state.files.iw },
  ].filter((entry) => entry.file && Number.isFinite(Number(entry.file.lastModified)) && Number(entry.file.lastModified) > 0);
  if (entries.length < 2) return '';
  const newest = Math.max(...entries.map((entry) => Number(entry.file.lastModified)));
  const stale = entries.filter((entry) => newest - Number(entry.file.lastModified) > FILE_FRESHNESS_LIMIT_MS);
  if (!stale.length) return '';
  const names = [...new Set(stale.map((entry) => `${entry.label} (${formatFileDate(entry.file.lastModified)})`))].join(', ');
  return `Los archivos no son de la misma fecha: ${names} son más antiguos que el archivo más reciente (${formatFileDate(
    newest
  )}). Si Shopify cambió desde entonces (productos creados, eliminados o renombrados), el CSV tendrá filas rechazadas o productos sin actualizar. Exporta productos, inventario e IW juntos y justo antes de subir.`;
}

async function previewIwHeaders() {
  if (!state.files.iw) {
    state.iwHeaders = [];
    populateIwPriceSelect([]);
    return;
  }
  try {
    const headers = await readTabularHeaders(state.files.iw);
    state.iwHeaders = headers;
    populateIwSelects(headers);
    populateIwPriceSelect(headers);
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

function populateIwSelects(headers) {
  const warehouseHeaders = headers.filter(isIwWarehouseHeader);
  TARGET_LOCATION_DEFAULTS.forEach((target) => {
    const select = document.getElementById(target.selectId);
    const preferred = findHeader(headers, [target.iw]) ?? target.iw;
    select.innerHTML = '';
    (warehouseHeaders.length ? warehouseHeaders : headers).forEach((header) => {
      const option = document.createElement('option');
      option.value = header;
      option.textContent = header;
      option.selected = normalizeHeader(header) === normalizeHeader(preferred);
      select.append(option);
    });
  });
}

function populateIwPriceSelect(headers) {
  if (!els.iwPriceColumn) return;
  const priceHeaders = headers.filter(isIwPriceHeader).sort(compareIwPriceHeaders);
  const previous = els.iwPriceColumn.value;
  const preferred =
    findHeader(priceHeaders, previous ? [previous] : []) ||
    findHeader(priceHeaders, IW_FIELD_ALIASES.price4) ||
    priceHeaders[0] ||
    '';

  els.iwPriceColumn.innerHTML = '';
  if (!priceHeaders.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Sin columnas de precio';
    els.iwPriceColumn.append(option);
    els.iwPriceColumn.disabled = true;
    if (els.iwPriceStatus) {
      els.iwPriceStatus.textContent = 'Podrás generar el inventario, pero no habrá precios IW para comparar.';
      els.iwPriceStatus.dataset.tone = 'warn';
    }
    return;
  }

  priceHeaders.forEach((header) => {
    const option = document.createElement('option');
    option.value = header;
    option.textContent = header;
    option.selected = normalizeHeader(header) === normalizeHeader(preferred);
    els.iwPriceColumn.append(option);
  });
  els.iwPriceColumn.disabled = false;
  state.priceSelectionDirty = Boolean(
    state.result && normalizeHeader(state.result.priceColumn) !== normalizeHeader(els.iwPriceColumn.value)
  );
  updatePriceSelectionState();
}

function handlePriceColumnChange() {
  state.priceSelectionDirty = Boolean(
    state.result && normalizeHeader(state.result.priceColumn) !== normalizeHeader(els.iwPriceColumn.value)
  );
  updatePriceSelectionState();
  syncPriceDownloadState();
  renderPriceComparisonSummary();
  if (state.priceSelectionDirty) {
    setMessage(
      `Cambiaste la referencia a ${els.iwPriceColumn.value}. Ejecuta de nuevo la comparación para actualizar el reporte de precios.`,
      'warn'
    );
  }
}

function updatePriceSelectionState() {
  if (!els.iwPriceStatus) return;
  if (!els.iwPriceColumn?.value) return;
  if (state.priceSelectionDirty) {
    els.iwPriceStatus.textContent = `Referencia cambiada a ${els.iwPriceColumn.value}; vuelve a comparar para actualizar el reporte.`;
    els.iwPriceStatus.dataset.tone = 'warn';
    return;
  }
  els.iwPriceStatus.textContent = `${els.iwPriceColumn.value} será la referencia. El reporte no modifica Shopify ni IW.`;
  els.iwPriceStatus.dataset.tone = 'ok';
}

async function processFiles() {
  if (!state.files.products.length || !state.files.inventory || !state.files.iw) return;
  const startedAt = performance.now();
  setProgress(4);
  setBusy(true, 'Leyendo archivos y preparando coincidencias...');

  try {
    await idle();
    const freshnessBlock = freshnessGateReason();
    const filesKey = filesSignature();
    let zeroAutoOff = '';
    if (freshnessBlock && state.freshnessAcknowledged !== filesKey && els.zeroMissingIw && els.zeroMissingIw.value !== 'off') {
      els.zeroMissingIw.value = 'off';
      if (els.zeroNoUpc) els.zeroNoUpc.checked = false;
      state.freshnessAcknowledged = filesKey;
      zeroAutoOff = freshnessBlock;
    }
    const options = collectOptions();
    const comparison = await runComparison(options);
    comparison.metrics.zeroAutoOff = zeroAutoOff;
    comparison.metrics.elapsedMs = Math.round(performance.now() - startedAt);

    state.result = comparison;
    state.priceSelectionDirty = false;
    updatePriceSelectionState();
    renderMetrics(comparison.metrics);
    renderTabCounts();
    renderPriceFilterCounts();
    renderPriceComparisonSummary();
    setActiveView('shopify');
    enableDownloads(true);
    setProgress(100);
    const summary = comparison.metrics;
    const trackingMessage = summary.trackingBlocked
      ? ` ${formatNumber(summary.trackingBlocked)} productos tienen tracking apagado; activa el seguimiento en Shopify o esas filas serán rechazadas.`
      : '';
    const statusMessage = summary.statusCsvRows
      ? ` ${formatNumber(summary.statusToActivate)} para activar y ${formatNumber(summary.statusToDraft)} para dejar en draft.`
      : '';
    const csvMessage = ` El CSV de inventario lleva ${formatNumber(summary.csvRows ?? summary.updatedRows)} filas${
      summary.rowsOmittedFromCsv ? ` (se omitieron ${formatNumber(summary.rowsOmittedFromCsv)} filas sin cambios)` : ''
    }.`;
    const priceMessage = summary.priceColumn
      ? ` Precios: ${formatNumber(summary.priceComparables ?? 0)} comparables contra ${summary.priceColumn}, ${formatNumber(
          summary.priceDifferences ?? 0
        )} diferencias y ${formatNumber(summary.saleProducts ?? 0)} ofertas reales.`
      : ' El archivo IW no trae una lista de precios para comparar.';
    const warnings = [];
    if (summary.zeroedVariants) {
      warnings.push(
        `${formatNumber(summary.zeroedVariants)} variantes se ponen en 0 porque su UPC no existe en IW: ${formatNumber(
          summary.zeroedRows ?? 0
        )} filas (${formatNumber(summary.zeroedActiveRows ?? 0)} de productos activos, ${formatNumber(
          summary.zeroedDraftRows ?? 0
        )} en borrador, ${formatNumber(summary.zeroedArchivedRows ?? 0)} archivadas). Descarga "Puestos en 0" y revísalas antes de subir.`
      );
    }
    if (summary.zeroAutoOff) {
      warnings.push(
        `Se desactivó "Poner en 0" porque ${summary.zeroAutoOff}. Exporta productos, inventario e IW juntos; si estás seguro, vuelve a elegir la opción y compara de nuevo.`
      );
    }
    if (summary.zeroingSuppressed) {
      warnings.push(`No se puso en 0 ninguna variante porque ${summary.zeroingSuppressed}.`);
    }
    if (summary.upcFixRows) {
      warnings.push(
        `${formatNumber(summary.upcFixRows)} variantes necesitan que corrijas su UPC en Shopify (sin UPC, UPC no numérico o UPC que no existe en IW); descarga "UPC por corregir", que ya trae el UPC sugerido de IW.`
      );
    }
    if (summary.unmappedWarehouses) {
      warnings.push(
        `${formatNumber(summary.unmappedWarehouses)} bodegas de IW (${formatNumber(
          summary.unmappedWarehouseUnits ?? 0
        )} unidades) no están asignadas a ninguna sucursal, así que esas existencias no se suben; si alguna vende, agrégala en el mapeo con Ctrl+clic. Ver "Almacén IW sin mapear" en Revisión.`
      );
    }
    if (summary.iwConflicts) {
      warnings.push(`${formatNumber(summary.iwConflicts)} UPC están repetidos en IW con existencias distintas; corrige IW para que se actualicen.`);
    }
    if (summary.untrackedWithIwStock) {
      warnings.push(
        `${formatNumber(summary.untrackedWithIwStock)} variantes activas sin seguimiento de inventario tienen existencia en IW; el CSV solo actualiza variantes con seguimiento activo, así que actívalo en Shopify para esas (descarga "Sin seguimiento").`
      );
    }
    if (summary.suggestedProducts) {
      warnings.push(
        `${formatNumber(summary.suggestedProducts)} productos parecen existir en IW con otro UPC; revisa "UPC sugerido desde IW" y corrige el UPC en Shopify.`
      );
    }
    if (summary.invalidIwQuantityRows) {
      warnings.push(`${formatNumber(summary.invalidIwQuantityRows)} filas no se escribieron porque la cantidad en IW no es numérica.`);
    }
    if (summary.unmappedLocationRows) {
      warnings.push(`${formatNumber(summary.unmappedLocationRows)} filas pertenecen a ubicaciones que no están en el mapeo de sucursales.`);
    }
    if (summary.handlesNotInProducts) {
      warnings.push(
        `${formatNumber(summary.handlesNotInProducts)} productos del inventario no están en el export de productos: reexporta productos Shopify y vuelve a comparar.`
      );
    }
    if (summary.skuOnlyHandles) {
      warnings.push(
        `${formatNumber(summary.skuOnlyHandles)} productos se ubicaron solo por SKU porque su handle no está en el export de productos.`
      );
    }
    const freshness = fileFreshnessWarning();
    if (freshness) warnings.push(freshness);
    setMessage(
      `Comparación lista: ${formatNumber(summary.updatedRows)} filas preparadas para Shopify en ${formatDuration(
        summary.elapsedMs
      )}.${csvMessage}${priceMessage}${trackingMessage}${statusMessage}${warnings.length ? ` Atención: ${warnings.join(' ')}` : ''}`,
      warnings.length ? 'warn' : 'info'
    );
  } catch (error) {
    console.error(error);
    enableDownloads(false);
    setMessage(error.message || 'No se pudo procesar la información.', 'error');
  } finally {
    setBusy(false);
  }
}

async function runComparison(options) {
  if (canUseWorker()) {
    try {
      return await runComparisonInWorker(options);
    } catch (error) {
      setMessage(`Procesando sin worker: ${error.message}`);
      await idle();
    }
  }

  return runComparisonOnMainThread(options);
}

function canUseWorker() {
  return Boolean(window.Worker) && location.protocol !== 'file:';
}

function runComparisonInWorker(options) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('inventory-worker.js');
    worker.onmessage = (event) => {
      const { type, message, progress, result, error } = event.data;
      if (type === 'progress') {
        if (progress !== undefined) setProgress(progress);
        if (message) setMessage(message);
        return;
      }
      worker.terminate();
      if (type === 'complete') resolve(result);
      if (type === 'error') reject(new Error(error || 'No se pudo procesar en segundo plano.'));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'El worker de procesamiento no respondió.'));
    };
    worker.postMessage({
      type: 'process',
      files: {
        products: state.files.products,
        inventory: state.files.inventory,
        iw: state.files.iw,
      },
      options,
    });
  });
}

async function runComparisonOnMainThread(options) {
  setProgress(12);
  const productTables = [];
  for (let i = 0; i < state.files.products.length; i += 1) {
    setMessage(`Leyendo productos Shopify (${i + 1}/${state.files.products.length})...`);
    productTables.push(await readCsvFile(state.files.products[i]));
    setProgress(18 + Math.round(((i + 1) / state.files.products.length) * 18));
    await idle();
  }

  setMessage('Leyendo inventario Shopify...');
  const inventoryTable = await readCsvFile(state.files.inventory);
  setProgress(46);
  await idle();

  setMessage('Leyendo existencias IW...');
  const iwTable = await readTabularFile(state.files.iw);
  setProgress(62);
  await idle();

  setMessage('Mapeando SKU, UPC y existencias...');
  const products = buildProductIndex(productTables);
  setProgress(74);
  await idle();
  const iw = buildIwIndex(iwTable, options);
  setProgress(84);
  await idle();
  return compareInventory(inventoryTable, products, iw, options);
}

function collectOptions() {
  const targets = TARGET_LOCATION_DEFAULTS.map((target) => {
    const select = document.getElementById(target.selectId);
    const selected = select ? [...(select.selectedOptions || [])].map((option) => option.value).filter(Boolean) : [];
    const iwColumns = selected.length ? selected : [(select && select.value) || target.iw].filter(Boolean);
    return {
      ...target,
      iwColumns,
      iwColumn: iwColumns.join(' + '),
      locationKeys: [target.shopify, ...(target.aliases ?? [])].map(normalizeHeader),
    };
  });

  return {
    targets,
    clearExistingNew: true,
    clampNegative: els.clampNegative.checked,
    skuFallback: els.skuFallback.checked,
    removeCurrentOnHand: els.removeCurrentOnHand.checked,
    onlyUpdatedRows: els.onlyUpdatedRows ? els.onlyUpdatedRows.checked : true,
    zeroMissingIw: els.zeroMissingIw ? els.zeroMissingIw.value : 'all',
    zeroNoUpc: els.zeroNoUpc ? els.zeroNoUpc.checked : false,
    priceColumn: els.iwPriceColumn?.value || '',
  };
}

async function readCsvFile(file) {
  const text = await file.text();
  const table = parseCsv(text);
  table.fileName = file.name;
  return table;
}

async function readTabularHeaders(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    const preview = await file.slice(0, 128 * 1024).text();
    return parseCsv(preview, { limitRows: 1 }).headers;
  }

  if (!window.XLSX) {
    throw new Error('No se pudo cargar el lector XLSX. Revisa la conexión o exporta IW como CSV.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('El archivo IW no contiene hojas.');
  const sheet = workbook.Sheets[firstSheetName];
  const ref = sheet['!ref'];
  if (!ref) throw new Error('La primera hoja del archivo IW está vacía.');
  const range = XLSX.utils.decode_range(ref);
  range.e.r = range.s.r;
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: true,
    range,
  });
  return rowsToTable(rows, file.name).headers;
}

async function readTabularFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return readCsvFile(file);

  if (!window.XLSX) {
    throw new Error('No se pudo cargar el lector XLSX. Revisa la conexión o exporta IW como CSV.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('El archivo IW no contiene hojas.');
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
  return rowsToTable(rows, file.name);
}

function rowsToTable(rows, fileName = '') {
  const cleanRows = rows
    .map((row) => row.map((value) => stringifyCell(value)))
    .filter((row) => row.some((value) => value.trim() !== ''));
  if (!cleanRows.length) throw new Error(`El archivo ${fileName || 'cargado'} está vacío.`);
  const headers = cleanRows[0].map((header, index) => {
    const value = header.trim();
    return value || `Columna ${index + 1}`;
  });
  return {
    headers,
    rows: cleanRows.slice(1),
    fileName,
  };
}

function parseCsv(text, options = {}) {
  const delimiter = options.delimiter ?? detectCsvDelimiter(text);
  const limitRows = options.limitRows ?? Number.POSITIVE_INFINITY;
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      if (rows.length >= limitRows) return rowsToTable(rows);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rowsToTable(rows);
}

function detectCsvDelimiter(text) {
  const candidates = [',', ';', '\t'];
  const counts = new Map(candidates.map((candidate) => [candidate, 0]));
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') i += 1;
      else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (char === '\r' || char === '\n')) break;
    if (!inQuotes && counts.has(char)) counts.set(char, counts.get(char) + 1);
  }

  return candidates.reduce((best, candidate) => (counts.get(candidate) > counts.get(best) ? candidate : best), ',');
}

function buildProductIndex(tables) {
  const bySku = new Map();
  const byHandle = new Map();
  const barcodeKeys = new Map();
  const identifierKeys = new Map();
  const skuRecords = new Map();
  const barcodeOwners = new Map();
  const unsafeSkuKeys = new Set();
  const untrackedActive = [];
  const all = [];
  const review = [];
  let variants = 0;

  tables.forEach((table) => {
    const idx = indexHeaders(table.headers);
    validateAnyField(idx, ['Variant SKU', 'SKU'], table.fileName || 'productos Shopify');
    validateAnyField(idx, PRODUCT_FIELD_ALIASES.barcode, `${table.fileName || 'productos Shopify'} (UPC)`);
    validateAnyField(idx, PRODUCT_FIELD_ALIASES.handle, `${table.fileName || 'productos Shopify'} (Handle)`);

    let lastTitle = '';
    let lastHandle = '';
    let lastStatus = '';
    let lastPublished = '';
    let lastOptionNames = ['', '', ''];

    table.rows.forEach((row, rowIndex) => {
      const rawHandle = resolveField(row, idx, PRODUCT_FIELD_ALIASES.handle);
      if (rawHandle && lastHandle && keyHandle(rawHandle) !== keyHandle(lastHandle)) {
        lastTitle = '';
        lastStatus = '';
        lastPublished = '';
        lastOptionNames = ['', '', ''];
      }

      const rawTitle = resolveField(row, idx, PRODUCT_FIELD_ALIASES.title);
      const rawStatus = resolveField(row, idx, PRODUCT_FIELD_ALIASES.status);
      const rawPublished = resolveField(row, idx, PRODUCT_FIELD_ALIASES.published);
      const rawOptionNames = [
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option1Name),
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option2Name),
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option3Name),
      ];
      const optionNames = rawOptionNames.map((value, index) => value || lastOptionNames[index]);
      const optionValues = [
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option1Value),
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option2Value),
        resolveField(row, idx, PRODUCT_FIELD_ALIASES.option3Value),
      ];
      const title = rawTitle || lastTitle;
      const handle = rawHandle || lastHandle;
      const status = rawStatus || lastStatus;
      const published = rawPublished || lastPublished;
      const sku = normalizeSku(resolveField(row, idx, PRODUCT_FIELD_ALIASES.sku));
      const barcodeRaw = resolveField(row, idx, PRODUCT_FIELD_ALIASES.barcode);
      const barcode = cleanIdentifier(barcodeRaw);
      const priceRaw = get(row, idx, 'Variant Price') || get(row, idx, 'Price / El Salvador');
      const compareAtRaw = get(row, idx, 'Variant Compare At Price') || get(row, idx, 'Compare At Price / El Salvador');
      const inventoryTrackerRaw = resolveField(row, idx, PRODUCT_FIELD_ALIASES.inventoryTracker);

      if (rawTitle) lastTitle = rawTitle;
      if (rawHandle) lastHandle = rawHandle;
      if (rawStatus) lastStatus = rawStatus;
      if (rawPublished) lastPublished = rawPublished;
      rawOptionNames.forEach((value, index) => {
        if (value) lastOptionNames[index] = value;
      });

      if (!isShopifyVariantRow({ sku, barcode, priceRaw, compareAtRaw })) return;
      variants += 1;

      const product = {
        sku,
        barcode,
        barcodeRaw,
        title,
        handle,
        optionNames,
        optionValues,
        status,
        published,
        price: parseMoney(priceRaw),
        compareAtPrice: parseMoney(compareAtRaw),
        priceRaw,
        compareAtRaw,
        inventoryTracker: inventoryTrackerRaw,
        sourceFile: table.fileName,
        sourceRow: rowIndex + 2,
      };
      all.push(product);
      if (barcode && handle) trackBarcodeOwner(barcodeOwners, barcode, product);
      if (!isInventoryTracked(product) && isShopifyActive(product)) untrackedActive.push(product);

      if (!sku) {
        review.push({
          Tipo: 'SKU Shopify faltante',
          'UPC / SKU': barcode,
          Producto: title,
          Sucursal: '',
          Detalle: 'La variante aparece en productos Shopify sin SKU; se ubica por Handle + opciones y se incluye en precios.',
        });
        if (barcode) addBarcodeReference(barcodeKeys, barcode, product);
        if (barcode) addBarcodeReference(identifierKeys, barcode, product);
        if (handle) addHandleReference(byHandle, handle, product);
        return;
      }

      const skuKey = keySku(sku);
      if (!skuRecords.has(skuKey)) skuRecords.set(skuKey, []);
      skuRecords.get(skuKey).push(product);

      const existing = bySku.get(skuKey);
      if (!existing || (!existing.barcode && barcode)) {
        bySku.set(skuKey, product);
      }

      if (barcode) addBarcodeReference(barcodeKeys, barcode, product);
      if (handle) addHandleReference(byHandle, handle, product);
      addBarcodeReference(identifierKeys, barcode || sku, product);
      if (barcode && sku) addBarcodeReference(identifierKeys, sku, product);
    });
  });

  skuRecords.forEach((records, skuKey) => {
    const distinctVariants = uniqueProductRecords(records);
    if (distinctVariants.length <= 1) return;

    unsafeSkuKeys.add(skuKey);
    const identities = distinctVariants.map(formatProductIdentity).join(' | ');
    review.push({
      Tipo: 'SKU reutilizado',
      'UPC / SKU': records[0].sku,
      Producto: records.map((item) => item.title || item.handle).filter(Boolean).join(' | '),
      Sucursal: '',
      Detalle: `El SKU identifica varias variantes (${identities}). Cada fila del inventario se ubica por Handle + opciones, así que el SKU repetido no bloquea la actualización; solo se omite si el handle no está en el export de productos.`,
    });
  });

  barcodeOwners.forEach((entry) => {
    if (entry.variants.size <= 1) return;
    const owners = [...entry.variants.values()].slice(0, 8).map(formatProductIdentity).join(' | ');
    const sameProduct = entry.handles.size === 1;
    review.push({
      Tipo: sameProduct ? 'UPC compartido entre variantes' : 'UPC compartido en Shopify',
      'UPC / SKU': entry.barcode,
      Producto: owners,
      Sucursal: '',
      Detalle: sameProduct
        ? `El mismo UPC está en ${entry.variants.size} variantes del mismo producto; cada variante recibirá la existencia completa de IW (stock multiplicado en la tienda). Asigna un UPC distinto a cada variante o deja solo una.`
        : `El mismo UPC está en ${entry.variants.size} variantes de ${entry.handles.size} productos; todos recibirán la misma existencia de IW (stock duplicado en la tienda). Elimina o corrige el producto repetido.`,
    });
  });

  return { bySku, byHandle, barcodeKeys, identifierKeys, skuRecords, unsafeSkuKeys, barcodeOwners, untrackedActive, all, review, variants };
}


function optionValuesMatch(productOptions = [], rowOptions = []) {
  return [0, 1, 2].every(
    (index) => normalizeOptionValue(productOptions[index] ?? '') === normalizeOptionValue(rowOptions[index] ?? '')
  );
}

function variantIdentityKey(product) {
  const options = (product.optionValues || []).map(normalizeOptionValue);
  return `${keyHandle(product.handle)}|${options.join('|')}`;
}

function uniqueProductRecords(records) {
  const seen = new Map();
  records.forEach((record) => {
    const key = variantIdentityKey(record);
    if (!seen.has(key)) seen.set(key, record);
  });
  return [...seen.values()];
}

function formatProductIdentity(product) {
  const options = (product.optionValues || []).filter(Boolean).join(' / ');
  const parts = [product.handle || '(sin handle)'];
  if (options && normalizeOptionValue(options) !== 'default title') parts.push(options);
  parts.push(product.barcode ? `UPC ${product.barcode}` : 'sin UPC');
  return parts.join(' - ');
}

function barcodeOwnerKey(value) {
  const cleaned = cleanIdentifier(value).toUpperCase();
  return cleaned.replace(/[^A-Z0-9]/g, '').replace(/^0+/, '') || cleaned;
}

function trackBarcodeOwner(map, barcode, product) {
  const key = barcodeOwnerKey(barcode);
  if (!key) return;
  if (!map.has(key)) map.set(key, { barcode, handles: new Set(), variants: new Map() });
  const entry = map.get(key);
  entry.handles.add(keyHandle(product.handle));
  const variantKey = variantIdentityKey(product);
  if (!entry.variants.has(variantKey)) entry.variants.set(variantKey, product);
}

function normalizeOptionValue(value) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function isGtinLike(value) {
  const digits = cleanIdentifier(value).replace(/[\s-]+/g, '');
  return /^\d{8,14}$/.test(digits);
}

function gs1CheckDigit(digits) {
  let sum = 0;
  digits
    .split('')
    .reverse()
    .forEach((char, index) => {
      sum += Number(char) * (index % 2 === 0 ? 3 : 1);
    });
  return String((10 - (sum % 10)) % 10);
}

function hasValidGs1CheckDigit(value) {
  const digits = cleanIdentifier(value).replace(/[\s-]+/g, '');
  if (!/^\d{8}$|^\d{12,14}$/.test(digits)) return false;
  return gs1CheckDigit(digits.slice(0, -1)) === digits.slice(-1);
}

function barcodeCheckDigitCandidates(value) {
  const digits = cleanIdentifier(value).replace(/[\s-]+/g, '');
  if (!/^\d{7}$|^\d{11}$|^\d{12}$|^\d{13}$/.test(digits)) return [];
  return barcodeCandidateKeys(digits + gs1CheckDigit(digits));
}

function looksLikeSkuIdentifier(value) {
  const compact = cleanIdentifier(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return compact.length >= 5 && /[A-Z]/.test(compact) && /\d/.test(compact);
}

function isPlaceholderProduct(product) {
  const title = normalizeText(product?.title);
  if (!title) return true;
  return [product?.sku, product?.barcode, product?.handle].some((value) => value && normalizeText(value) === title);
}

function normalizeZeroScope(value) {
  const scope = normalizeText(value);
  if (scope === 'all' || scope === 'inactive' || scope === 'off') return scope;
  if (value === true) return 'inactive';
  return 'off';
}

function getZeroReason(product, match, zeroScope, zeroNoUpc, getSuggestions, matchSource = '') {
  if (!product || zeroScope === 'off') return '';
  if (!['handle_options', 'handle_sku', 'handle_only'].includes(matchSource)) return '';
  if (!isInventoryTracked(product)) return '';
  const active = isShopifyActive(product);
  if (active && zeroScope !== 'all') return '';
  const barcode = cleanIdentifier(product.barcode);
  const heldBySuggestion = () => active && getSuggestions().some((item) => item.hasStock);

  if (barcode && isGtinLike(barcode)) {
    if (match.status !== 'not_found') return '';
    if (heldBySuggestion()) return '';
    return 'Puesto en 0: el UPC no existe en IW (IW es la fuente de verdad).';
  }

  if (!zeroNoUpc) return '';
  if (match.status === 'matched' || match.status === 'ambiguous') return '';
  if (heldBySuggestion()) return '';
  return barcode
    ? 'Puesto en 0: el UPC de Shopify no es numérico y no existe en IW.'
    : 'Puesto en 0: variante sin UPC en Shopify.';
}

function evaluateZeroGate(inventoryTable, idx, products, iw, inventoryHandleKeys) {
  const minRows = 3000;
  const minRatio = 0.5;
  if (iw.rows.length < minRows) {
    return { ok: false, reason: `el archivo IW solo tiene ${iw.rows.length} filas (se esperan al menos ${minRows})`, checked: 0, matched: 0 };
  }
  let checked = 0;
  let matched = 0;
  inventoryTable.rows.forEach((row) => {
    const currentRaw =
      resolveField(row, idx, INVENTORY_FIELD_ALIASES.onHandCurrent) || resolveField(row, idx, INVENTORY_FIELD_ALIASES.available);
    if (isNotStockedCell(currentRaw)) return;
    if (parseQuantity(currentRaw, { clampNegative: false }).quantity <= 0) return;
    const inventorySku = normalizeSku(resolveField(row, idx, INVENTORY_FIELD_ALIASES.sku));
    const inventoryHandle = resolveField(row, idx, INVENTORY_FIELD_ALIASES.handle);
    const productMatch = findProductForInventoryRow(inventorySku, inventoryHandle, row, idx, products, {
      inventoryHandleKeys,
      inventoryTitle: get(row, idx, 'Title'),
    });
    const product = productMatch.product;
    if (!product || !isGtinLike(product.barcode)) return;
    checked += 1;
    if (lookupIwMatch(product.barcode, iw).status === 'matched') matched += 1;
  });
  const ratio = checked ? matched / checked : 0;
  if (checked >= 20 && ratio < minRatio) {
    return {
      ok: false,
      reason: `solo ${Math.round(ratio * 100)}% de las variantes con existencia y UPC numérico aparecen en IW (mínimo ${Math.round(minRatio * 100)}%); el archivo IW parece incompleto`,
      checked,
      matched,
    };
  }
  return { ok: true, reason: '', checked, matched };
}

function auditReason(detail, wroteToCsv) {
  const text = String(detail || '');
  if (text.startsWith('Puesto en 0')) {
    return text.includes('sin UPC') || text.includes('no es numérico') ? 'Puesto en 0: sin UPC válido' : 'Puesto en 0: UPC no existe en IW';
  }
  if (!wroteToCsv) return 'Omitido';
  if (text.includes('dígito verificador')) return 'UPC + dígito verificador';
  if (text.includes('se usó el SKU')) return 'SKU = UPC IW';
  if (text.includes('UPC repetido en IW')) return 'UPC repetido en IW combinado';
  if (text.includes('UPC compartido')) return 'UPC en IW (UPC compartido)';
  return 'UPC en IW';
}

function isNotStockedCell(value) {
  return normalizeText(value) === 'not stocked';
}

function digitsEditDistanceOne(a, b) {
  if (a === b) return false;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (la > lb) i += 1;
    else if (lb > la) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

function findIwSuggestions(product, iw, cache) {
  const key = productKey(product);
  if (cache.has(key)) return cache.get(key);
  const suggestions = [];
  const seen = new Set();
  const targetColumns = iw.targetColumns || [];
  const add = (row, reason) => {
    if (!row || seen.has(row) || suggestions.length >= 5) return;
    seen.add(row);
    suggestions.push({ row, reason, hasStock: targetColumns.some((column) => (row.quantities[column] ?? 0) > 0) });
  };

  const titleKey = normalizeText(product.title);
  if (titleKey && iw.byTitle) (iw.byTitle.get(titleKey) || []).forEach((row) => add(row, 'mismo nombre en IW'));

  const skuToken = looksLikeSkuIdentifier(product.sku) ? normalizeText(product.sku) : '';
  const barcodeCompact = cleanIdentifier(product.barcode).toUpperCase().replace(/[\s-]+/g, '');
  const useBarcode = barcodeCompact.length >= 6;
  const barcodeDigits = /^\d{11,14}$/.test(barcodeCompact) ? barcodeCompact : '';
  if (skuToken || useBarcode) {
    for (const row of iw.rows) {
      if (suggestions.length >= 5) break;
      if (skuToken && row.titleKey.includes(skuToken)) add(row, `el nombre IW contiene el SKU ${product.sku}`);
      if (barcodeDigits && row.barcodeDigits && digitsEditDistanceOne(barcodeDigits, row.barcodeDigits)) {
        add(row, 'UPC con un dígito de diferencia');
      }
      if (
        useBarcode &&
        row.barcodeCompact.length >= 6 &&
        row.barcodeCompact !== barcodeCompact &&
        (row.barcodeCompact.includes(barcodeCompact) || barcodeCompact.includes(row.barcodeCompact))
      ) {
        add(row, 'UPC parecido');
      }
    }
  }

  cache.set(key, suggestions);
  return suggestions;
}

function describeIwSuggestion(entry, options) {
  const quantities = options.targets.map((target) => `${target.label.replace('Sucursal ', '')} ${entry.row.quantities[targetKeyOf(target)] ?? 0}`).join(', ');
  return `${entry.reason}: código ${entry.row.code || '-'} · UPC ${entry.row.barcode || '-'} · "${entry.row.title}" · IW ${quantities}`;
}

function resolveIwDuplicates(rows, targetColumns, mergeCache, source) {
  const stocked = rows.filter((row) => targetColumns.some((column) => (row.quantities[column] ?? 0) > 0));
  const signatures = new Set(rows.map((row) => targetColumns.map((column) => row.quantities[column] ?? 0).join('|')));
  if (targetColumns.length && stocked.length > 1 && signatures.size > 1) {
    return { status: 'ambiguous', rows, conflict: true };
  }

  const cacheKey = rows
    .map((row) => row.sourceRow)
    .sort((a, b) => a - b)
    .join(',');
  let merged = mergeCache?.get(cacheKey);
  if (!merged) {
    const primaryRow = stocked[0] || rows.find((row) => row.price4?.hasValue && row.price4.valid) || rows[0];
    const quantities = {};
    Object.keys(primaryRow.quantities).forEach((column) => {
      quantities[column] =
        signatures.size === 1
          ? primaryRow.quantities[column]
          : rows.reduce((total, row) => total + (row.quantities[column] ?? 0), 0);
    });
    merged = {
      ...primaryRow,
      quantities,
      total: Object.values(quantities).reduce((total, value) => total + (value ?? 0), 0),
      hasUnmappedStock: rows.some((row) => row.hasUnmappedStock),
      code: rows.map((row) => row.code).filter(Boolean).join(' | '),
      mergedRows: rows,
    };
    mergeCache?.set(cacheKey, merged);
  }
  return { status: 'matched', row: merged, source, via: 'merged', mergedRows: rows };
}

function buildSuccessDetail(productMatch, match, owners) {
  const notes = ['Coincidencia segura por UPC.'];
  if (match.via === 'check_digit') notes.push('UPC completado con dígito verificador para encontrarlo en IW.');
  if (match.via === 'sku_as_upc') notes.push('El UPC no está en IW; se usó el SKU porque coincide con un único UPC de IW.');
  if (match.via === 'merged') notes.push(`UPC repetido en IW: se combinaron ${match.mergedRows.length} filas (códigos ${match.row.code}).`);
  if (owners && owners.variants.size > 1) {
    const others = [...owners.variants.values()]
      .filter((item) => item !== productMatch.product)
      .slice(0, 3)
      .map(formatProductIdentity)
      .join(' | ');
    notes.push(`UPC compartido por ${owners.variants.size} variantes Shopify (${others}${owners.variants.size > 4 ? ' | ...' : ''}): todas reciben la misma existencia.`);
  }
  if (productMatch.source === 'sku') {
    notes.push('El handle no está en el export de productos (ubicado por SKU); reexporta productos para validar.');
  }
  return notes.join(' ');
}

const IW_NON_WAREHOUSE_HEADERS = [
  'codigo',
  'codigo de barras',
  'nombre comercial',
  'categoria',
  'costo unitario prom',
  'total existencias',
  'descripcion',
  'marca',
  'grupo',
  'unidad',
  'presentacion',
];

function isIwWarehouseHeader(header) {
  const key = normalizeHeader(header);
  if (!key) return false;
  if (isIwPriceHeader(header)) return false;
  if (key.startsWith('costo')) return false;
  if ([...IW_FIELD_ALIASES.barcode, ...IW_FIELD_ALIASES.code, ...IW_FIELD_ALIASES.title].some((alias) => normalizeHeader(alias) === key)) return false;
  return !IW_NON_WAREHOUSE_HEADERS.includes(key);
}

function isIwPriceHeader(header) {
  const key = normalizeHeader(header);
  return /^(precio|price)(\s*\d+)?$/.test(key);
}

function compareIwPriceHeaders(left, right) {
  const leftMatch = normalizeHeader(left).match(/(\d+)$/);
  const rightMatch = normalizeHeader(right).match(/(\d+)$/);
  const leftNumber = leftMatch ? Number(leftMatch[1]) : Number.MAX_SAFE_INTEGER;
  const rightNumber = rightMatch ? Number(rightMatch[1]) : Number.MAX_SAFE_INTEGER;
  return leftNumber - rightNumber || String(left).localeCompare(String(right), 'es');
}

function targetColumnsOf(target) {
  const columns = (target.iwColumns && target.iwColumns.length ? target.iwColumns : [target.iwColumn]).filter(Boolean);
  return columns.length ? columns : [];
}

function targetKeyOf(target) {
  return targetColumnsOf(target).join(' + ');
}

function buildIwIndex(table, options) {
  const idx = indexHeaders(table.headers);
  const barcodeHeader = findHeader(table.headers, IW_FIELD_ALIASES.barcode);
  const codeHeader = findHeader(table.headers, IW_FIELD_ALIASES.code);
  const titleHeader = findHeader(table.headers, IW_FIELD_ALIASES.title);
  const price4Header = findHeader(table.headers, IW_FIELD_ALIASES.price4);
  const priceHeaders = table.headers.filter(isIwPriceHeader).sort(compareIwPriceHeaders);
  const priceColumn =
    findHeader(priceHeaders, options.priceColumn ? [options.priceColumn] : []) ||
    price4Header ||
    priceHeaders[0] ||
    '';

  if (!barcodeHeader) {
    throw new Error('No encontré la columna Código de Barras en el archivo IW.');
  }

  const missingColumns = options.targets
    .flatMap((target) => targetColumnsOf(target))
    .filter((column) => !hasHeader(idx, column));
  if (missingColumns.length) {
    throw new Error(`El archivo IW no tiene las columnas de almacén seleccionadas: ${[...new Set(missingColumns)].join(', ')}.`);
  }

  const warehouseHeaders = table.headers.filter(isIwWarehouseHeader);
  const mappedHeaders = new Set(
    options.targets.flatMap((target) => targetColumnsOf(target)).map((column) => normalizeHeader(column))
  );
  const warehouseTotals = new Map(warehouseHeaders.map((header) => [header, { units: 0, products: 0, mapped: mappedHeaders.has(normalizeHeader(header)) }]));

  const byBarcode = new Map();
  const byTitle = new Map();
  const rows = [];
  const review = [];

  table.rows.forEach((row, rowIndex) => {
    const barcode = cleanIdentifier(get(row, idx, barcodeHeader));
    const code = cleanIdentifier(get(row, idx, codeHeader));
    const title = get(row, idx, titleHeader);
    const price4Raw = price4Header ? get(row, idx, price4Header) : '';
    const prices = Object.fromEntries(priceHeaders.map((header) => [header, parseMoney(get(row, idx, header))]));
    const comparisonPriceRaw = priceColumn ? get(row, idx, priceColumn) : '';
    const quantities = {};
    let total = 0;
    let hasUnmappedStock = false;

    warehouseHeaders.forEach((header) => {
      const parsed = parseQuantity(get(row, idx, header), { clampNegative: true });
      if (parsed.quantity > 0) {
        const entry = warehouseTotals.get(header);
        entry.units += parsed.quantity;
        entry.products += 1;
        if (!mappedHeaders.has(normalizeHeader(header))) hasUnmappedStock = true;
      }
    });

    options.targets.forEach((target) => {
      const key = targetKeyOf(target);
      let sum = 0;
      let invalid = false;
      targetColumnsOf(target).forEach((column) => {
        const value = parseQuantity(get(row, idx, column), { clampNegative: options.clampNegative });
        if (value.invalid) invalid = true;
        else sum += value.quantity;
        if (value.warning) {
          review.push({
            Tipo: value.invalid ? 'Cantidad IW no numérica' : 'Cantidad IW ajustada',
            'UPC / SKU': barcode || code,
            Producto: title,
            Sucursal: column,
            Detalle: value.warning,
          });
        }
      });
      quantities[key] = invalid ? null : sum;
      total += invalid ? 0 : sum;
    });

    const iwRow = {
      barcode,
      barcodeCompact: barcode.toUpperCase().replace(/[\s-]+/g, ''),
      barcodeDigits: /^\d{11,14}$/.test(barcode.replace(/[\s-]+/g, '')) ? barcode.replace(/[\s-]+/g, '') : '',
      code,
      title,
      titleKey: normalizeText(title),
      price4: parseMoney(price4Raw),
      price4Raw,
      prices,
      comparisonPrice: parseMoney(comparisonPriceRaw),
      comparisonPriceRaw,
      comparisonPriceColumn: priceColumn,
      quantities,
      total,
      hasUnmappedStock,
      sourceRow: rowIndex + 2,
    };
    rows.push(iwRow);
    if (iwRow.titleKey) {
      if (!byTitle.has(iwRow.titleKey)) byTitle.set(iwRow.titleKey, []);
      byTitle.get(iwRow.titleKey).push(iwRow);
    }

    if (!barcode || barcode === '0') {
      if (total > 0) {
        review.push({
          Tipo: 'IW sin código de barras',
          'UPC / SKU': code,
          Producto: title,
          Sucursal: '',
          Detalle: 'Tiene existencia positiva, pero no puede cruzarse por UPC.',
        });
      }
      return;
    }

    addBarcodeReference(byBarcode, barcode, iwRow);
  });

  const unmappedWarehouses = [...warehouseTotals.entries()]
    .filter(([, entry]) => !entry.mapped && entry.units > 0)
    .map(([header, entry]) => ({ header, units: entry.units, products: entry.products }))
    .sort((a, b) => b.units - a.units);

  unmappedWarehouses.forEach((entry) => {
    review.push({
      Tipo: 'Almacén IW sin mapear',
      'UPC / SKU': '',
      Producto: entry.header,
      Sucursal: entry.header,
      Detalle: `La columna "${entry.header}" del archivo IW tiene ${entry.units} unidades en ${entry.products} productos y no está asignada a ninguna sucursal, así que esas existencias no se suben a Shopify. Si esa bodega vende, agrégala a la sucursal correspondiente en el mapeo (Ctrl+clic para elegir varias).`,
    });
  });

  return {
    byBarcode,
    byTitle,
    rows,
    review,
    targetColumns: options.targets.map((target) => targetKeyOf(target)),
    priceColumn,
    priceHeaders,
    warehouseTotals: [...warehouseTotals.entries()].map(([header, entry]) => ({ header, ...entry })),
    unmappedWarehouses,
    mergeCache: new Map(),
  };
}

function compareInventory(inventoryTable, products, iw, options) {
  const idx = indexHeaders(inventoryTable.headers);
  const hasAllStates = INVENTORY_FIELD_ALIASES.location.some(a => hasHeader(idx, a)) && INVENTORY_FIELD_ALIASES.onHandNew.some(a => hasHeader(idx, a));
  const hasAvailableColumns = !hasAllStates && options.targets.some((target) => hasHeader(idx, target.shopify));

  if (!hasAllStates && !hasAvailableColumns) {
    throw new Error('El inventario Shopify no parece tener formato All states ni columnas por sucursal.');
  }

  const outputRows = inventoryTable.rows.map((row) => [...row]);
  const review = [...products.review, ...iw.review];
  const uploadAudit = [];
  const inventoryReviewKeys = new Set();
  const rowsBySku = new Map();
  const matchedIwRows = new Set();
  const writtenRowIndexes = new Set();
  const handlesNotInProducts = new Map();
  const skuOnlyHandles = new Map();
  const unmappedLocations = new Map();
  const zeroedVariants = new Map();
  const suggestionCache = new Map();
  const suggestedProducts = new Map();
  const invalidUpcProducts = new Map();
  const iwConflicts = new Map();
  const inventoryHandleKeys = new Set();
  inventoryTable.rows.forEach((row) => {
    const handleKey = keyHandle(resolveField(row, idx, INVENTORY_FIELD_ALIASES.handle));
    if (handleKey) inventoryHandleKeys.add(handleKey);
  });
  const requestedZeroScope = normalizeZeroScope(options.zeroMissingIw);
  const zeroGate = requestedZeroScope === 'off' ? { ok: true, reason: '' } : evaluateZeroGate(inventoryTable, idx, products, iw, inventoryHandleKeys);
  const zeroScope = zeroGate.ok ? requestedZeroScope : 'off';
  const zeroNoUpc = Boolean(options.zeroNoUpc);
  const useSkuFallback = Boolean(options.skuFallback);
  const zeroedRows = [];

  const metrics = {
    updatedRows: 0,
    matchedRows: 0,
    unmatchedRows: 0,
    safeSkippedRows: 0,
    skippedNoUpc: 0,
    skippedNoIw: 0,
    skippedAmbiguous: 0,
    skippedDupSku: 0,
    rowsWithoutProduct: 0,
    skippedNotInInventory: 0,
    trackingWarnings: 0,
    zeroedMissingIwRows: 0,
    zeroedNoUpcRows: 0,
    mergedIwRows: 0,
    checkDigitRows: 0,
    skuAsUpcRows: 0,
    invalidIwQuantityRows: 0,
    unmappedLocationRows: 0,
    notStockedSkippedRows: 0,
    zeroedActiveRows: 0,
    zeroedDraftRows: 0,
    zeroedArchivedRows: 0,
  };

  let newIndex = -1;
  if (hasAllStates) {
    newIndex = INVENTORY_FIELD_ALIASES.onHandNew.map(a => idx.get(normalizeHeader(a))).find(i => i !== undefined) ?? -1;
    if (newIndex !== -1) {
      outputRows.forEach((row) => {
        row[newIndex] = '';
      });
    }
  }

  const rememberSuggestions = (product, match) => {
    if (!product || !isShopifyActive(product) && normalizeText(product.status) !== 'draft') return [];
    const suggestions = findIwSuggestions(product, iw, suggestionCache);
    const key = productKey(product);
    if (suggestions.length && !suggestedProducts.has(key) && isGtinLike(product.barcode)) {
      suggestedProducts.set(key, { product, match, suggestions });
    }
    return suggestions;
  };

  inventoryTable.rows.forEach((row, rowIndex) => {
    const outputRow = outputRows[rowIndex];
    const inventorySku = normalizeSku(resolveField(row, idx, INVENTORY_FIELD_ALIASES.sku));
    const inventoryHandle = resolveField(row, idx, INVENTORY_FIELD_ALIASES.handle);
    const inventoryTitle = get(row, idx, 'Title');
    const location = resolveField(row, idx, INVENTORY_FIELD_ALIASES.location);
    const target = hasAllStates ? findTargetForLocation(location, options.targets) : null;

    if (hasAllStates && !target) {
      const label = location || '(sin ubicación)';
      metrics.unmappedLocationRows += 1;
      unmappedLocations.set(label, (unmappedLocations.get(label) || 0) + 1);
      return;
    }

    const productMatch = findProductForInventoryRow(inventorySku, inventoryHandle, row, idx, products, { inventoryHandleKeys, inventoryTitle });
    const product = productMatch.product;
    const sku = product?.sku || inventorySku;
    const skuKey = sku ? keySku(sku) : '';
    const match = product
      ? lookupIwMatch(product.barcode, iw, useSkuFallback ? product.sku : '')
      : { status: 'missing_input' };
    const uploadBlockReason = getUploadBlockReason(sku, product, match, products, metrics, productMatch.source);
    const currentRaw =
      resolveField(row, idx, INVENTORY_FIELD_ALIASES.onHandCurrent) || resolveField(row, idx, INVENTORY_FIELD_ALIASES.available);
    const currentQty = parseQuantity(currentRaw, { clampNegative: false }).quantity;
    const currentNotStocked = isNotStockedCell(currentRaw);
    const groupKey = product ? productKey(product) : skuKey || (inventoryHandle ? `handle:${keyHandle(inventoryHandle)}` : `__row_${rowIndex}`);

    if (inventoryHandle) {
      const inventoryHandleKey = keyHandle(inventoryHandle);
      if (!product && !handlesNotInProducts.has(inventoryHandleKey)) {
        handlesNotInProducts.set(inventoryHandleKey, {
          handle: inventoryHandle,
          sku: inventorySku,
          title: inventoryTitle,
          reason: productMatch.source,
        });
      }
      if (product && productMatch.source === 'sku' && !skuOnlyHandles.has(inventoryHandleKey)) {
        skuOnlyHandles.set(inventoryHandleKey, {
          handle: inventoryHandle,
          sku: inventorySku,
          title: inventoryTitle,
          productHandle: product.handle,
        });
      }
    }

    const owners = product?.barcode ? products.barcodeOwners?.get(barcodeOwnerKey(product.barcode)) : null;
    const successDetail = buildSuccessDetail(productMatch, match, owners);
    const zeroReason = uploadBlockReason
      ? getZeroReason(product, match, zeroScope, zeroNoUpc, () => rememberSuggestions(product, match), productMatch.source)
      : '';
    if (uploadBlockReason && product) {
      const suggestions = zeroReason ? [] : rememberSuggestions(product, match);
      const barcodeClean = cleanIdentifier(product.barcode);
      if ((!barcodeClean || !isGtinLike(barcodeClean)) && match.status !== 'matched' && !zeroReason) {
        const key = productKey(product);
        if (!invalidUpcProducts.has(key)) invalidUpcProducts.set(key, { product, suggestions, currentQty: 0 });
        invalidUpcProducts.get(key).currentQty += currentNotStocked ? 0 : currentQty;
      }
      if (match.status === 'ambiguous' && match.conflict) {
        const key = barcodeOwnerKey(product.barcode);
        if (!iwConflicts.has(key)) iwConflicts.set(key, { product, rows: match.rows });
      }
    }

    if (!rowsBySku.has(groupKey)) {
      rowsBySku.set(groupKey, {
        sku,
        product,
        match,
        inventoryMatchSource: productMatch.source,
        currentTotal: 0,
        iwTotal: 0,
        targetRows: 0,
        safeMatched: false,
        wroteToCsv: false,
        zeroed: false,
        zeroReason: '',
        updatedLocations: [],
      });
    }

    const group = rowsBySku.get(groupKey);

    const registerWrite = (qty, detail, wroteToCsv = true) => {
      group.iwTotal += qty;
      if (wroteToCsv) {
        writtenRowIndexes.add(rowIndex);
        metrics.updatedRows += 1;
        group.wroteToCsv = true;
      }
      if (detail === successDetail) {
        group.safeMatched = true;
        metrics.matchedRows += 1;
        (match.mergedRows || [match.row]).forEach((iwRow) => matchedIwRows.add(iwRow));
        if (match.via === 'merged') metrics.mergedIwRows += 1;
        if (match.via === 'check_digit') metrics.checkDigitRows += 1;
        if (match.via === 'sku_as_upc') metrics.skuAsUpcRows += 1;
      } else {
        group.zeroed = true;
        group.zeroReason = detail;
        if (detail.includes('sin UPC') || detail.includes('no es numérico')) metrics.zeroedNoUpcRows += 1;
        else metrics.zeroedMissingIwRows += 1;
        const status = currentShopifyStatus(product);
        if (status === 'active') metrics.zeroedActiveRows += 1;
        else if (status === 'draft') metrics.zeroedDraftRows += 1;
        else metrics.zeroedArchivedRows += 1;
        zeroedVariants.set(productKey(product), { product, reason: detail });
      }
    };
    const recordZeroedRow = (targetLabel, currentValue, detail) => {
      const suggestions = findIwSuggestions(product, iw, suggestionCache);
      zeroedRows.push({
        Handle: product.handle,
        Producto: product.title,
        Opciones: (product.optionValues || []).filter(Boolean).join(' / '),
        SKU: product.sku,
        'UPC Shopify': product.barcode,
        Sucursal: targetLabel,
        'Shopify actual': String(currentValue),
        'Estado producto': currentShopifyStatus(product),
        Motivo: auditReason(detail, true),
        'IW sugerido': suggestions.map((item) => describeIwSuggestion(item, options)).join(' || '),
      });
    };

    if (hasAllStates) {
      group.targetRows += 1;
      group.currentTotal += currentQty;

      if (!uploadBlockReason) {
        const qty = match.row.quantities[targetKeyOf(target)];
        if (qty === null || qty === undefined) {
          metrics.invalidIwQuantityRows += 1;
          metrics.unmatchedRows += 1;
          metrics.safeSkippedRows += 1;
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentQty, '', false, `Cantidad IW no numérica en ${targetKeyOf(target)}; no se escribe esta sucursal.`));
          return;
        }
        if (qty === 0 && currentNotStocked) {
          group.safeMatched = true;
          (match.mergedRows || [match.row]).forEach((iwRow) => matchedIwRows.add(iwRow));
          metrics.notStockedSkippedRows += 1;
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentQty, '', false, `${successDetail} Sin cambio: IW 0 y la sucursal no está abastecida (not stocked); no se escribe.`));
          return;
        }
        if (options.onlyUpdatedRows && qty === currentQty) {
          uploadAudit.push(
            buildUploadAuditRow(sku, product, target.label, match, currentQty, qty, false, `${successDetail} Sin cambio: Shopify ya tiene esta cantidad.`)
          );
          registerWrite(qty, successDetail, false);
          return;
        }
        if (newIndex !== -1) outputRow[newIndex] = String(qty);
        group.updatedLocations.push(`${target.label}: ${qty}`);
        uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentQty, qty, true, successDetail));
        registerWrite(qty, successDetail);
        return;
      }

      if (zeroReason) {
        if (currentNotStocked || currentQty <= 0) {
          uploadAudit.push(
            buildUploadAuditRow(sku, product, target.label, match, currentQty, '', false, `${zeroReason} Sin cambio: la sucursal ya está en 0${currentNotStocked ? ' (not stocked)' : ''}.`)
          );
          group.zeroed = true;
          group.zeroReason = zeroReason;
          return;
        }
        if (newIndex !== -1) outputRow[newIndex] = '0';
        group.updatedLocations.push(`${target.label}: 0`);
        uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentQty, 0, true, zeroReason));
        recordZeroedRow(target.label, currentQty, zeroReason);
        registerWrite(0, zeroReason);
        return;
      }

      uploadAudit.push(buildUploadAuditRow(sku, product, target.label || location, match, currentQty, '', false, uploadBlockReason));
      metrics.unmatchedRows += 1;
      metrics.safeSkippedRows += 1;
      if (product) addInventoryReview(review, row, idx, product, sku, location, match, inventoryReviewKeys, uploadBlockReason);
      return;
    }

    if (!uploadBlockReason || zeroReason) {
      const detail = uploadBlockReason ? zeroReason : successDetail;
      group.targetRows = options.targets.length;
      group.iwTotal = 0;
      group.currentTotal = 0;
      group.updatedLocations = [];
      let wroteAny = false;
      let matchedTargets = 0;
      let totalNew = 0;
      options.targets.forEach((target) => {
        const col = findHeader(inventoryTable.headers, [target.shopify, ...(target.aliases ?? [])]);
        if (!col) return;
        const currentLocationRaw = get(row, idx, col);
        const currentLocationQty = parseQuantity(currentLocationRaw, { clampNegative: false }).quantity;
        group.currentTotal += currentLocationQty;
        if (uploadBlockReason && (isNotStockedCell(currentLocationRaw) || currentLocationQty <= 0)) {
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, '', false, `${zeroReason} Sin cambio: la sucursal ya está en 0.`));
          group.zeroed = true;
          group.zeroReason = zeroReason;
          return;
        }
        const qty = uploadBlockReason ? 0 : match.row.quantities[targetKeyOf(target)];
        if (qty === 0 && isNotStockedCell(currentLocationRaw)) {
          metrics.notStockedSkippedRows += 1;
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, '', false, `${detail} Sin cambio: IW 0 y la sucursal no está abastecida (not stocked); no se escribe.`));
          return;
        }
        if (uploadBlockReason) recordZeroedRow(target.label, currentLocationQty, detail);
        if (qty === null || qty === undefined) {
          metrics.invalidIwQuantityRows += 1;
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, '', false, `Cantidad IW no numérica en ${targetKeyOf(target)}; no se escribe esta sucursal.`));
          return;
        }
        matchedTargets += 1;
        totalNew += qty;
        const colIndex = idx.get(normalizeHeader(col));
        if (options.onlyUpdatedRows && qty === currentLocationQty) {
          uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, qty, false, `${detail} Sin cambio: Shopify ya tiene esta cantidad.`));
          return;
        }
        if (colIndex !== undefined) outputRow[colIndex] = String(qty);
        wroteAny = true;
        group.updatedLocations.push(`${target.label}: ${qty}`);
        uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, qty, true, detail));
      });
      if (wroteAny || matchedTargets) {
        registerWrite(totalNew, detail, wroteAny);
      }
      return;
    }

    options.targets.forEach((target) => {
      const col = findHeader(inventoryTable.headers, [target.shopify, ...(target.aliases ?? [])]);
      if (!col) return;
      const currentLocationQty = parseQuantity(get(row, idx, col), { clampNegative: false }).quantity;
      uploadAudit.push(buildUploadAuditRow(sku, product, target.label, match, currentLocationQty, '', false, uploadBlockReason));
      metrics.safeSkippedRows += 1;
    });
    metrics.unmatchedRows += 1;
    if (product) addInventoryReview(review, row, idx, product, sku, '', match, inventoryReviewKeys, uploadBlockReason);
  });

  products.all.forEach(product => {
    if (product.barcode) {
      const match = lookupIwMatch(product.barcode, iw);
      if (match.status === 'matched') {
        const key = productKey(product);
        if (!rowsBySku.has(key)) {
          metrics.skippedNotInInventory += 1;
          review.push({
            Tipo: 'Sin actualización segura',
            'UPC / SKU': product.barcode,
            Producto: product.title,
            Sucursal: '',
            Detalle: 'Existe en productos Shopify e IW, pero no aparece en el CSV de inventario cargado. Reexporta inventario Shopify incluyendo esta variante y ubicación.',
          });
        }
      }
    }
  });

  handlesNotInProducts.forEach((entry) => {
    const detailByReason = {
      handle_variant_missing: `El handle ${entry.handle} existe en productos Shopify, pero la variante (opciones) del inventario no coincide. Reexporta productos Shopify y vuelve a comparar.`,
      sku_conflict: `El handle ${entry.handle} no está en el export de productos y su SKU ${entry.sku} pertenece a otro producto que sí está en el inventario; no se usó para evitar escribir la existencia equivocada. Reexporta productos Shopify.`,
      sku_title_mismatch: `El handle ${entry.handle} no está en el export de productos y el SKU ${entry.sku} apunta a un producto con otro nombre; no se usó. Reexporta productos Shopify.`,
    };
    review.push({
      Tipo: 'Producto fuera del export de productos',
      'UPC / SKU': entry.sku,
      Producto: entry.title || entry.handle,
      Sucursal: '',
      Detalle:
        detailByReason[entry.reason] ||
        `El handle ${entry.handle} no aparece en el export de productos Shopify (producto creado o renombrado después de exportar). Reexporta productos Shopify y vuelve a comparar.`,
    });
  });

  skuOnlyHandles.forEach((entry) => {
    review.push({
      Tipo: 'Producto ubicado solo por SKU',
      'UPC / SKU': entry.sku,
      Producto: entry.title || entry.handle,
      Sucursal: '',
      Detalle: `El handle ${entry.handle} no está en el export de productos; se usó el SKU para tomar el UPC del producto ${entry.productHandle} (ficha provisional con el mismo nombre o código). Reexporta productos Shopify para validar.`,
    });
  });

  if (!zeroGate.ok && requestedZeroScope !== 'off') {
    review.push({
      Tipo: 'Puesta en 0 desactivada',
      'UPC / SKU': '',
      Producto: '',
      Sucursal: '',
      Detalle: `No se puso en 0 ninguna variante porque ${zeroGate.reason}. Verifica el archivo IW y vuelve a comparar.`,
    });
  }

  unmappedLocations.forEach((count, label) => {
    review.push({
      Tipo: 'Ubicación no mapeada',
      'UPC / SKU': '',
      Producto: '',
      Sucursal: label,
      Detalle: `${count} filas del inventario pertenecen a la ubicación "${label}", que no está en el mapeo de sucursales; no se escriben.`,
    });
  });

  zeroedVariants.forEach((entry) => {
    review.push({
      Tipo: 'Puesto en 0',
      'UPC / SKU': entry.product.barcode || entry.product.sku,
      Producto: entry.product.title || entry.product.handle,
      Sucursal: '',
      Detalle: `${entry.reason} Estado Shopify: ${currentShopifyStatus(entry.product)}.`,
    });
  });

  invalidUpcProducts.forEach((entry) => {
    const barcode = cleanIdentifier(entry.product.barcode);
    const hint = entry.suggestions.length
      ? ` IW parece tenerlo: ${entry.suggestions.map((item) => describeIwSuggestion(item, options)).join(' || ')}.`
      : '';
    review.push({
      Tipo: barcode ? 'UPC no válido en Shopify (no es numérico)' : 'Sin UPC en Shopify',
      'UPC / SKU': barcode || entry.product.sku,
      Producto: entry.product.title || entry.product.handle,
      Sucursal: '',
      Detalle: `${barcode ? `El UPC "${barcode}" no es un código de barras numérico y no existe en IW` : 'La variante no tiene UPC en Shopify'}; Shopify conserva ${entry.currentQty} unidades. Agrega o corrige el UPC en Shopify para que se actualice.${hint}`,
    });
  });

  iwConflicts.forEach((entry) => {
    const detail = entry.rows
      .map((row) => `código ${row.code || '-'} "${row.title}" (${options.targets.map((target) => row.quantities[targetKeyOf(target)] ?? 0).join('/')})`)
      .join(' || ');
    review.push({
      Tipo: 'UPC repetido en IW con existencias en conflicto',
      'UPC / SKU': entry.product.barcode,
      Producto: entry.product.title || entry.product.handle,
      Sucursal: '',
      Detalle: `IW tiene el mismo UPC en varias filas con existencias distintas; no se escribe hasta corregir IW: ${detail}.`,
    });
  });

  suggestedProducts.forEach((entry) => {
    review.push({
      Tipo: 'UPC sugerido desde IW',
      'UPC / SKU': entry.product.barcode || entry.product.sku,
      Producto: entry.product.title || entry.product.handle,
      Sucursal: '',
      Detalle: `El UPC de Shopify no está en IW, pero IW parece tener el producto: ${entry.suggestions
        .map((item) => describeIwSuggestion(item, options))
        .join(' || ')}. Corrige el UPC en Shopify para que se actualice.`,
    });
  });

  const untrackedRows = (products.untrackedActive || []).map((product) => {
    const match = product.barcode ? lookupIwMatch(product.barcode, iw) : { status: 'missing_input' };
    const quantities = options.targets.map((target) => (match.status === 'matched' ? match.row.quantities[targetKeyOf(target)] ?? 0 : ''));
    const iwTotal = match.status === 'matched' ? totalForTargets(match.row, options) : null;
    let action;
    if (!product.barcode) action = 'Agregar el UPC en Shopify antes de activar el seguimiento';
    else if (match.status === 'matched') action = iwTotal > 0 ? 'Activar seguimiento: IW tiene existencia' : 'Activar seguimiento (IW en 0: quedará agotado)';
    else if (match.status === 'ambiguous') action = 'UPC repetido en IW con conflicto; revisar antes de activar';
    else action = 'El UPC no existe en IW: revisar si el producto sigue vigente';
    if (match.status === 'matched') {
      review.push({
        Tipo: 'Sin seguimiento con existencia en IW',
        'UPC / SKU': product.barcode || product.sku,
        Producto: product.title || product.handle,
        Sucursal: '',
        Detalle: `IW tiene este producto (${options.targets
          .map((target) => `${target.label.replace('Sucursal ', '')} ${match.row.quantities[targetKeyOf(target)] ?? 0}`)
          .join(', ')}), pero la variante no tiene seguimiento de inventario en Shopify, así que el CSV no puede actualizarla y se vende sin límite. ${action}.`,
      });
    }
    const grupo = !product.barcode
      ? 'Sin UPC'
      : match.status === 'matched'
        ? 'UPC encontrado en IW'
        : match.status === 'ambiguous'
          ? 'UPC repetido en IW'
          : 'UPC no existe en IW';
    return {
      Grupo: grupo,
      Handle: product.handle,
      Producto: product.title,
      Opciones: (product.optionValues || []).filter(Boolean).join(' / '),
      SKU: product.sku,
      'UPC Shopify': product.barcode,
      'Coincidencia IW': matchStatusLabel(match),
      Chalchuapa: quantities[0],
      'Santa Ana': quantities[1],
      Zarzamora: quantities[2],
      'Total IW': iwTotal ?? '',
      'Acción sugerida': action,
    };
  });

  const upcFixRows = [];
  const pushUpcFix = (product, motivo, currentQty, suggestions) => {
    const best = (suggestions || [])[0];
    upcFixRows.push({
      Motivo: motivo,
      Handle: product.handle,
      Producto: product.title || product.handle,
      Opciones: (product.optionValues || []).filter(Boolean).join(' / '),
      SKU: product.sku || '',
      'UPC actual': product.barcode || '',
      'Estado producto': currentShopifyStatus(product),
      'Existencia Shopify': Number.isFinite(currentQty) ? String(currentQty) : '',
      'UPC sugerido IW': best ? best.row.barcode : '',
      'Código IW': best ? best.row.code : '',
      'Producto IW': best ? best.row.title : '',
      'Coincide por': best ? best.reason : '',
      Chalchuapa: best ? best.row.quantities[targetKeyOf(options.targets[0])] ?? '' : '',
      'Santa Ana': best ? best.row.quantities[targetKeyOf(options.targets[1])] ?? '' : '',
      Zarzamora: best ? best.row.quantities[targetKeyOf(options.targets[2])] ?? '' : '',
      'Otras coincidencias IW': (suggestions || []).slice(1).map((item) => describeIwSuggestion(item, options)).join(' || '),
    });
  };

  invalidUpcProducts.forEach((entry) => {
    pushUpcFix(
      entry.product,
      cleanIdentifier(entry.product.barcode) ? 'UPC no numérico en Shopify' : 'Variante sin UPC en Shopify',
      entry.currentQty,
      entry.suggestions
    );
  });

  suggestedProducts.forEach((entry) => {
    pushUpcFix(entry.product, 'El UPC de Shopify no existe en IW', undefined, entry.suggestions);
  });

  const actions = [];
  const zeroStock = [];

  rowsBySku.forEach((group) => {
    if (!group.product || !group.targetRows) return;
    if (!group.safeMatched && !group.zeroed) return;
    const barcode = group.product.barcode || group.sku;
    const isActive = isShopifyActive(group.product);
    const base = {
      'UPC Shopify': barcode,
      SKU: group.sku,
      Producto: group.product.title,
      'IW Total': group.iwTotal,
      'Shopify actual': group.currentTotal,
      Detalle: group.updatedLocations.join(' | ') || 'Sin actualización',
    };

    if (group.zeroed) {
      if (isActive) {
        actions.push({
          Acción: htmlTag('Deshabilitar', 'danger'),
          ...base,
          Detalle: `${group.zeroReason} ${base.Detalle}`,
        });
      }
      return;
    }

    if (group.match.status === 'matched' && group.iwTotal <= 0) {
      zeroStock.push(buildZeroRow(group, options));
      if (isActive) {
        actions.push({
          Acción: htmlTag('Deshabilitar', 'danger'),
          ...base,
        });
      }
    } else if (group.match.status === 'matched' && group.iwTotal > 0 && !isActive) {
      actions.push({
        Acción: htmlTag('Habilitar', 'ok'),
        ...base,
      });
    } else if (group.match.status === 'matched' && group.iwTotal !== group.currentTotal) {
      actions.push({
        Acción: htmlTag('Actualizar', 'warn'),
        ...base,
      });
    }
  });

  const shopifyReferenceKeys = products.barcodeKeys;
  const missingInShopify = iw.rows
    .filter((row) => row.total > 0 && row.barcode && row.barcode !== '0')
    .filter((row) => !matchedIwRows.has(row))
    .filter((row) => !hasBarcodeReference(shopifyReferenceKeys, row.barcode))
    .map((row) => ({
      'Código IW': row.code,
      'Código de barras IW': row.barcode,
      'Producto IW': row.title,
      Chalchuapa: row.quantities[targetKeyOf(options.targets[0])] ?? 0,
      'Santa Ana': row.quantities[targetKeyOf(options.targets[1])] ?? 0,
      Zarzamora: row.quantities[targetKeyOf(options.targets[2])] ?? 0,
      'Total IW': row.total,
    }));

  missingInShopify.forEach((row) => {
    actions.push({
      Acción: htmlTag('Crear', 'ok'),
      'UPC Shopify': row['Código de barras IW'],
      SKU: row['Código IW'],
      Producto: row['Producto IW'],
      'IW Total': row['Total IW'],
      'Shopify actual': '',
      Detalle: 'Existe en IW con stock positivo y no aparece en productos Shopify.',
    });
  });

  const updatedProducts = buildUpdatedProductsRows(uploadAudit);
  const trackingBlocked = countTrackingBlocked(uploadAudit);
  const priceReport = buildPriceReport(products, iw, options, rowsBySku);
  const allProducts = buildAllProductsRows(priceReport);
  const priceReportRows = priceReport.map(stripObjectHtml);
  const priceMetrics = summarizePriceReport(priceReport);
  const shopifyStatus = buildShopifyStatusRows(products, iw, options, rowsBySku, missingInShopify);
  const statusMetrics = summarizeShopifyStatus(shopifyStatus);
  const productStatusCsv = buildProductStatusCsv(shopifyStatus);
  const reportRows = buildReportRows(
    uploadAudit,
    updatedProducts,
    shopifyStatus,
    actions,
    zeroStock,
    missingInShopify,
    review,
    priceReportRows
  );

  let finalHeaders = inventoryTable.headers;
  let finalRows = options.onlyUpdatedRows ? outputRows.filter((_, index) => writtenRowIndexes.has(index)) : outputRows;

  if (options.removeCurrentOnHand) {
    const stripped = removeCsvColumnByAliases(finalHeaders, finalRows, INVENTORY_FIELD_ALIASES.onHandCurrent);
    finalHeaders = stripped.headers;
    finalRows = stripped.rows;
  }

  const inventoryCsv = tableToCsv(finalHeaders, finalRows);

  return {
    inventoryCsv,
    productStatusCsv,
    updatedProducts,
    uploadAudit,
    shopifyStatus,
    actions,
    allProducts,
    priceReport,
    priceReportRows,
    zeroStock,
    missingInShopify,
    untrackedRows,
    zeroedRows,
    upcFixRows,
    review,
    reportRows,
    priceColumn: iw.priceColumn || options.priceColumn || '',
    priceColumns: iw.priceHeaders || [],
    metrics: {
      variants: products.variants,
      inventoryRows: inventoryTable.rows.length,
      csvRows: finalRows.length,
      rowsOmittedFromCsv: outputRows.length - finalRows.length,
      handlesNotInProducts: handlesNotInProducts.size,
      skuOnlyHandles: skuOnlyHandles.size,
      updatedRows: metrics.updatedRows,
      matchedRows: metrics.matchedRows,
      unmatchedRows: metrics.unmatchedRows,
      safeSkippedRows: metrics.safeSkippedRows,
      skippedNoUpc: metrics.skippedNoUpc,
      skippedNoIw: metrics.skippedNoIw,
      skippedAmbiguous: metrics.skippedAmbiguous,
      skippedDupSku: metrics.skippedDupSku,
      rowsWithoutProduct: metrics.rowsWithoutProduct,
      skippedNotInInventory: metrics.skippedNotInInventory,
      trackingWarnings: metrics.trackingWarnings,
      zeroedMissingIwRows: metrics.zeroedMissingIwRows,
      zeroedNoUpcRows: metrics.zeroedNoUpcRows,
      zeroedVariants: zeroedVariants.size,
      zeroedActiveVariants: [...zeroedVariants.values()].filter((entry) => isShopifyActive(entry.product)).length,
      invalidUpcProducts: invalidUpcProducts.size,
      upcFixRows: upcFixRows.length,
      iwConflicts: iwConflicts.size,
      zeroedRows: zeroedRows.length,
      zeroedActiveRows: metrics.zeroedActiveRows,
      zeroedDraftRows: metrics.zeroedDraftRows,
      zeroedArchivedRows: metrics.zeroedArchivedRows,
      notStockedSkippedRows: metrics.notStockedSkippedRows,
      zeroingSuppressed: zeroGate.ok ? '' : zeroGate.reason,
      zeroGateChecked: zeroGate.checked ?? 0,
      zeroGateMatched: zeroGate.matched ?? 0,
      mergedIwRows: metrics.mergedIwRows,
      checkDigitRows: metrics.checkDigitRows,
      skuAsUpcRows: metrics.skuAsUpcRows,
      invalidIwQuantityRows: metrics.invalidIwQuantityRows,
      unmappedLocationRows: metrics.unmappedLocationRows,
      suggestedProducts: suggestedProducts.size,
      untrackedActive: untrackedRows.length,
      untrackedWithIw: untrackedRows.filter((row) => row.Grupo === 'UPC encontrado en IW').length,
      unmappedWarehouses: (iw.unmappedWarehouses || []).length,
      unmappedWarehouseUnits: (iw.unmappedWarehouses || []).reduce((total, entry) => total + entry.units, 0),
      untrackedWithIwStock: untrackedRows.filter((row) => Number(row['Total IW']) > 0).length,
      uploadAuditRows: uploadAudit.length,
      updatedProducts: updatedProducts.length,
      trackingBlocked,
      statusToActivate: statusMetrics.activate,
      statusToDraft: statusMetrics.draft,
      statusCsvRows: statusMetrics.csvRows,
      statusNotFound: statusMetrics.notFound,
      zeroStock: zeroStock.length,
      missingInShopify: missingInShopify.length,
      review: review.length,
      actions: actions.length,
      iwRows: iw.rows.length,
      matchedIwRows: matchedIwRows.size,
      priceRows: priceReport.length,
      priceColumn: iw.priceColumn || options.priceColumn || '',
      priceComparables: priceMetrics.comparables,
      priceMatches: priceMetrics.matches,
      priceDifferences: priceMetrics.differences,
      priceZeroIssues: priceMetrics.zeroIssues,
      saleProducts: priceMetrics.saleProducts,
      offerReferenceMatches: priceMetrics.offerReferenceMatches,
      otherPriceMatches: priceMetrics.otherPriceMatches,
      priceMissing: priceMetrics.missingPrices,
      compareAtIssues: priceMetrics.compareAtIssues,
      priceReview: priceMetrics.review,
    },
  };
}

function buildPriceReport(products, iw, options, rowsBySku = new Map()) {
  const priceColumn = iw.priceColumn || options.priceColumn || 'Sin precio IW';
  return products.all.map((product) => {
    const match = lookupIwMatch(product.barcode || '', iw, options.skuFallback ? product.sku : '');
    const iwPrice = match.status === 'matched' ? match.row.comparisonPrice : null;
    const sale = classifySale(product);
    const comparison = compareMoney(product.price, iwPrice);
    const regularComparison = compareMoney(getRegularShopifyPrice(product), iwPrice);
    const alternatePriceMatches = findAlternateIwPriceMatches(product.price, match.row, priceColumn, comparison);
    const stock = getPriceStockSummary(product, match, options, rowsBySku);
    const uploadState = getProductUploadState(product, match, stock, products);
    const state = classifyPriceState(product, match, iwPrice, sale, comparison, regularComparison);
    const detail = buildPriceDetail(
      product,
      match,
      iwPrice,
      priceColumn,
      sale,
      comparison,
      regularComparison,
      alternatePriceMatches,
      stock,
      uploadState
    );
    const flags = buildPriceFlags(
      product,
      match,
      iwPrice,
      sale,
      comparison,
      regularComparison,
      alternatePriceMatches,
      stock,
      uploadState
    );

    return {
      Estado: htmlTag(state.label, state.tone),
      'UPC Shopify': product.barcode || '',
      SKU: product.sku || '',
      Producto: product.title || match.row?.title || product.handle,
      Handle: product.handle || '',
      'Estado Shopify': product.status || '',
      Publicado: product.published || '',
      'En inventario Shopify': stock.hasShopifyStock ? 'Si' : 'No en CSV inventario',
      'Filas inventario Shopify': stock.targetRowsLabel,
      'Coincidencia IW': matchStatusLabel(match),
      'Existencia IW': stock.iwTotalLabel,
      'Existencia Shopify': stock.shopifyTotalLabel,
      'Diferencia existencia': stock.stockDifferenceLabel,
      'CSV Shopify': uploadState.label,
      'Tracking Shopify': trackingStatusLabel(product),
      'Lista de precio IW': priceColumn,
      'Precio IW seleccionado': formatMoneyCell(iwPrice),
      'Precio Shopify actual': formatMoneyCell(product.price),
      'Precio regular Shopify': sale.isRealSale ? formatMoneyCell(product.compareAtPrice) : '',
      'Precio oferta Shopify': sale.isRealSale ? formatMoneyCell(product.price) : '',
      'Diferencia actual vs IW': comparison.hasComparison ? formatSignedMoney(comparison.difference) : '',
      'Diferencia regular vs IW': sale.isRealSale && regularComparison.hasComparison ? formatSignedMoney(regularComparison.difference) : '',
      'Coincide con otra lista IW': alternatePriceMatches.join(', '),
      Oferta: sale.label,
      Detalle: detail,
      Chalchuapa: stock.locationTotals[0],
      'Santa Ana': stock.locationTotals[1],
      Zarzamora: stock.locationTotals[2],
      'Código IW': match.row?.code || '',
      'Producto IW': match.row?.title || '',
      'Fila IW': match.row?.sourceRow || '',
      'Archivo Shopify': product.sourceFile || '',
      'Fila Shopify': product.sourceRow || '',
      _priceFlags: flags,
      _priceComparable: comparison.hasComparison,
      _priceDifference: comparison.hasComparison ? comparison.difference : null,
      _saleIsReal: sale.isRealSale,
      _regularMatchesIw:
        sale.isRealSale && regularComparison.hasComparison && Math.abs(regularComparison.difference) <= 0.004,
      _iwPriceMissing: match.status === 'matched' && (!iwPrice?.hasValue || !iwPrice.valid),
      _compareAtIssue: sale.hasIssue,
    };
  });
}

function findAlternateIwPriceMatches(shopifyPrice, iwRow, selectedPriceColumn, selectedComparison) {
  if (!iwRow || !selectedComparison.hasComparison || Math.abs(selectedComparison.difference) <= 0.004) return [];
  const selectedKey = normalizeHeader(selectedPriceColumn);
  return Object.entries(iwRow.prices || {})
    .filter(([header]) => normalizeHeader(header) !== selectedKey)
    .filter(([, money]) => money?.hasValue && money.valid && Math.abs(shopifyPrice.amount - money.amount) <= 0.004)
    .map(([header]) => header);
}

function classifyPriceState(product, match, iwPrice, sale, comparison, regularComparison) {
  if (!product.price.valid || !product.price.hasValue) return { label: 'Precio Shopify inválido', tone: 'danger' };
  if (hasZeroPriceIssue(product, iwPrice)) return { label: 'Precio 0', tone: 'danger' };
  if (match.status === 'ambiguous') return { label: 'IW ambiguo', tone: 'danger' };
  if (match.status !== 'matched') return { label: 'Sin producto IW', tone: 'warn' };
  if (!iwPrice?.hasValue) return { label: 'Sin precio IW', tone: 'danger' };
  if (!iwPrice.valid) return { label: 'Precio IW inválido', tone: 'danger' };
  if (sale.isRealSale && comparison.hasComparison && Math.abs(comparison.difference) > 0.004) {
    if (regularComparison.hasComparison && Math.abs(regularComparison.difference) <= 0.004) {
      return { label: 'Oferta Shopify', tone: 'info' };
    }
    return { label: 'Oferta + diferencia', tone: 'warn' };
  }
  if (comparison.hasComparison && Math.abs(comparison.difference) > 0.004) return { label: 'Diferencia', tone: 'warn' };
  if (sale.isRealSale) return { label: 'Oferta', tone: 'info' };
  if (sale.hasIssue) return { label: 'Compare-at a revisar', tone: 'warn' };
  return { label: 'Coincide', tone: 'ok' };
}

function buildPriceDetail(
  product,
  match,
  iwPrice,
  priceColumn,
  sale,
  comparison,
  regularComparison,
  alternatePriceMatches,
  stock,
  uploadState
) {
  const details = [];

  if (!product.sku) details.push('Variante sin SKU en Shopify.');
  if (!product.price.hasValue) details.push('Variant Price está vacío.');
  if (product.price.hasValue && !product.price.valid) details.push(`Variant Price no numérico: ${product.price.raw}.`);
  if (product.price.valid && product.price.amount === 0) details.push('Precio actual Shopify en 0.00.');
  if (iwPrice?.valid && iwPrice.hasValue && iwPrice.amount === 0) details.push(`${priceColumn} IW está en 0.00.`);

  if (match.status !== 'matched') {
    details.push(matchStatusDetail(match.status));
  } else if (!iwPrice?.hasValue) {
    details.push(`IW no trae ${priceColumn} para este producto.`);
  } else if (!iwPrice.valid) {
    details.push(`${priceColumn} IW no es numérico: ${iwPrice.raw}.`);
  } else if (sale.isRealSale && comparison.hasComparison && Math.abs(comparison.difference) > 0.004) {
    if (regularComparison.hasComparison && Math.abs(regularComparison.difference) <= 0.004) {
      details.push(`Oferta solo en Shopify: el precio regular coincide con ${priceColumn} IW.`);
    } else {
      details.push(`Está en oferta y el precio regular también difiere de ${priceColumn} IW: ${formatSignedMoney(regularComparison.difference)}.`);
    }
  } else if (comparison.hasComparison && Math.abs(comparison.difference) > 0.004) {
    details.push(`Diferencia Shopify − ${priceColumn} IW: ${formatSignedMoney(comparison.difference)}.`);
  }

  if (alternatePriceMatches.length) {
    details.push(
      `El precio actual de Shopify coincide con ${alternatePriceMatches.join(', ')} de IW; la referencia seleccionada sigue siendo ${priceColumn}.`
    );
  }

  if (stock.hasStockData && stock.iwTotal <= 0) details.push('Sin existencia en IW para las sucursales mapeadas.');
  if (!stock.hasShopifyStock) details.push('No aparece en el export de inventario Shopify cargado; no se puede modificar su existencia desde ese CSV.');
  if (stock.hasStockData && stock.hasShopifyStock && stock.stockDifference !== 0) {
    details.push(`Diferencia de existencia Shopify - IW: ${formatSignedNumber(stock.stockDifference)}.`);
  }
  if (uploadState?.detail) details.push(`CSV Shopify: ${uploadState.detail}`);
  if (sale.isRealSale || sale.hasIssue) details.push(sale.label + '.');
  return details.join(' ');
}

function getPriceStockSummary(product, match, options, rowsBySku) {
  const group = rowsBySku.get(productKey(product)) || null;
  const hasIwMatch = match.status === 'matched';
  const targetRows = group?.targetRows ?? 0;
  const iwTotal = hasIwMatch ? totalForTargets(match.row, options) : null;
  const shopifyTotal = group?.targetRows ? group.currentTotal : null;
  const hasShopifyStock = Number.isFinite(shopifyTotal);
  const hasStockData = Number.isFinite(iwTotal);
  const stockDifference = hasStockData && hasShopifyStock ? shopifyTotal - iwTotal : null;
  const locationTotals = options.targets.map((target) => (hasIwMatch ? match.row.quantities[targetKeyOf(target)] ?? 0 : ''));

  return {
    iwTotal,
    shopifyTotal,
    stockDifference,
    targetRows,
    hasStockData,
    hasShopifyStock,
    targetRowsLabel: targetRows ? String(targetRows) : '0',
    iwTotalLabel: hasStockData ? String(iwTotal) : '',
    shopifyTotalLabel: hasShopifyStock ? String(shopifyTotal) : '',
    stockDifferenceLabel: Number.isFinite(stockDifference) ? formatSignedNumber(stockDifference) : '',
    locationTotals,
    matchSource: group?.inventoryMatchSource ?? '',
  };
}

function totalForTargets(iwRow, options) {
  return options.targets.reduce((total, target) => total + (iwRow.quantities[targetKeyOf(target)] ?? 0), 0);
}

function buildPriceFlags(
  product,
  match,
  iwPrice,
  sale,
  comparison,
  regularComparison,
  alternatePriceMatches,
  stock,
  uploadState
) {
  const flags = ['all'];
  if (uploadState?.status === 'ready') flags.push('ready-upload');
  if (!isInventoryTracked(product) && stock.hasShopifyStock) flags.push('tracking-required');
  if (uploadState?.status === 'skipped' || uploadState?.status === 'out') flags.push('upload-skipped');
  if (!product.barcode) flags.push('no-upc');
  if (stock.hasStockData && stock.iwTotal <= 0) flags.push('no-stock');
  if (match.status !== 'matched') flags.push('no-iw');
  if (sale.isRealSale) flags.push('shopify-sale');
  if (
    sale.isRealSale &&
    comparison.hasComparison &&
    Math.abs(comparison.difference) > 0.004 &&
    regularComparison.hasComparison &&
    Math.abs(regularComparison.difference) <= 0.004
  ) {
    flags.push('shopify-only-sale');
  }
  if (alternatePriceMatches.length) flags.push('other-iw-price');
  if (comparison.hasComparison && Math.abs(comparison.difference) <= 0.004 && !hasZeroPriceIssue(product, iwPrice)) {
    flags.push('same-price');
  }
  const offerRegularMatches =
    sale.isRealSale && regularComparison.hasComparison && Math.abs(regularComparison.difference) <= 0.004;
  if (comparison.hasComparison && Math.abs(comparison.difference) > 0.004 && !offerRegularMatches) {
    flags.push('price-difference');
  }
  if (comparison.hasComparison && comparison.difference > 0.004) flags.push('shopify-higher');
  if (comparison.hasComparison && comparison.difference < -0.004) flags.push('shopify-lower');
  if (match.status === 'matched' && (!iwPrice?.hasValue || !iwPrice.valid)) flags.push('iw-price-missing');
  if (
    !product.price.hasValue ||
    !product.price.valid ||
    (product.price.valid && product.price.hasValue && product.price.amount === 0) ||
    (iwPrice?.hasValue && (!iwPrice.valid || iwPrice.amount === 0))
  ) {
    flags.push('invalid-price');
  }
  if (sale.hasIssue) flags.push('compare-at-issue');
  if (hasZeroPriceIssue(product, iwPrice)) flags.push('zero-price');
  return flags;
}

function buildAllProductsRows(priceReport) {
  return priceReport.map((row) => ({
    Producto: row.Producto,
    SKU: row.SKU,
    'UPC Shopify': row['UPC Shopify'],
    Handle: row.Handle,
    'Archivo Shopify': row['Archivo Shopify'],
    'Fila Shopify': row['Fila Shopify'],
    'Estado Shopify': row['Estado Shopify'],
    Publicado: row.Publicado,
    'En inventario Shopify': row['En inventario Shopify'],
    'Filas inventario Shopify': row['Filas inventario Shopify'],
    'Coincidencia IW': row['Coincidencia IW'],
    'CSV Shopify': row['CSV Shopify'],
    'Tracking Shopify': row['Tracking Shopify'],
    'Existencia IW': row['Existencia IW'],
    'Shopify actual': row['Existencia Shopify'],
    'Lista de precio IW': row['Lista de precio IW'],
    'Precio IW seleccionado': row['Precio IW seleccionado'],
    'Precio Shopify actual': row['Precio Shopify actual'],
    'Precio regular Shopify': row['Precio regular Shopify'],
    Oferta: row.Oferta,
    Detalle: row.Detalle,
  }));
}

function summarizePriceReport(rows) {
  return rows.reduce(
    (summary, row) => {
      const flags = row._priceFlags || [];
      const status = stripHtml(String(row.Estado || ''));
      if (row._priceComparable) summary.comparables += 1;
      if (flags.includes('same-price')) summary.matches += 1;
      if (flags.includes('price-difference')) summary.differences += 1;
      if (flags.includes('invalid-price')) summary.zeroIssues += 1;
      if (row._saleIsReal) summary.saleProducts += 1;
      if (row._regularMatchesIw) summary.offerReferenceMatches += 1;
      if (flags.includes('other-iw-price')) summary.otherPriceMatches += 1;
      if (row._iwPriceMissing) summary.missingPrices += 1;
      if (row._compareAtIssue) summary.compareAtIssues += 1;
      if (!['Coincide', 'Oferta', 'Oferta Shopify'].includes(status)) summary.review += 1;
      return summary;
    },
    {
      comparables: 0,
      matches: 0,
      differences: 0,
      zeroIssues: 0,
      saleProducts: 0,
      offerReferenceMatches: 0,
      otherPriceMatches: 0,
      missingPrices: 0,
      compareAtIssues: 0,
      review: 0,
    }
  );
}

function buildZeroRow(group, options) {
  const q = group.match.row.quantities;
  return {
    'UPC Shopify': group.product.barcode || group.sku,
    SKU: group.sku,
    Producto: group.product.title,
    Chalchuapa: q[targetKeyOf(options.targets[0])] ?? 0,
    'Santa Ana': q[targetKeyOf(options.targets[1])] ?? 0,
    Zarzamora: q[targetKeyOf(options.targets[2])] ?? 0,
    'Total IW': group.iwTotal,
  };
}

function isInventoryTracked(product) {
  return normalizeText(product?.inventoryTracker) === 'shopify';
}

function trackingStatusLabel(product) {
  return isInventoryTracked(product) ? 'Activo' : 'No activo';
}

function buildUpdatedProductsRows(uploadAudit) {
  const groups = new Map();
  uploadAudit
    .filter((row) => row['En CSV Shopify'] === 'Si')
    .forEach((row) => {
      const key = `${row.Handle}|${row.Opciones}|${row.SKU}|${row['UPC Shopify']}`;
      if (!groups.has(key)) {
        groups.set(key, {
          Motivo: row.Motivo,
          'Estado producto': row['Estado producto'],
          Handle: row.Handle,
          SKU: row.SKU,
          'UPC Shopify': row['UPC Shopify'],
          Producto: row.Producto,
          Opciones: row.Opciones,
          'Tracking Shopify': row['Tracking Shopify'],
          'Paso previo': row['Paso previo'],
          currentTotal: 0,
          newTotal: 0,
          locations: [],
        });
      }

      const group = groups.get(key);
      const currentQty = Number(row['Shopify actual']);
      const newQty = Number(row['IW nuevo']);
      if (Number.isFinite(currentQty)) group.currentTotal += currentQty;
      if (Number.isFinite(newQty)) group.newTotal += newQty;
      group.locations.push(`${row.Sucursal}: ${row['Shopify actual']} -> ${row['IW nuevo']}`);
      if (String(row.Detalle || '').startsWith('Puesto en 0')) group.zeroReason = row.Detalle;
      if (row['Paso previo']) group['Paso previo'] = row['Paso previo'];
      if (row['Tracking Shopify']) group['Tracking Shopify'] = row['Tracking Shopify'];
    });

  return [...groups.values()].map((group) => ({
    Motivo: group.Motivo,
    'Estado producto': group['Estado producto'],
    Handle: group.Handle,
    SKU: group.SKU,
    'UPC Shopify': group['UPC Shopify'],
    Producto: group.Producto,
    Opciones: group.Opciones,
    'Shopify actual total': String(group.currentTotal),
    'IW nuevo total': String(group.newTotal),
    'Diferencia total': formatSignedNumber(group.newTotal - group.currentTotal),
    Sucursal: group.locations.join(' | '),
    Detalle: [group.zeroReason || '', group['Tracking Shopify'] === 'No activo' ? 'Tracking apagado' : '', group['Paso previo']].filter(Boolean).join('. '),
  }));
}

function countTrackingBlocked(uploadAudit) {
  const keys = new Set();
  uploadAudit.forEach((row) => {
    if (row['Tracking Shopify'] === 'No activo') keys.add(`${row.Handle}|${row.SKU}|${row['UPC Shopify']}`);
  });
  return keys.size;
}

function buildShopifyStatusRows(products, iw, options, rowsByProduct, missingInShopify) {
  const groups = new Map();

  products.all.forEach((product) => {
    if (!product.handle) return;

    const key = keyHandle(product.handle);
    if (!groups.has(key)) {
      groups.set(key, {
        product,
        handle: product.handle,
        title: product.title || product.handle,
        skus: new Set(),
        barcodes: new Set(),
        variants: new Set(),
        matchedVariants: new Set(),
        inventoryVariants: new Set(),
        iwTotal: 0,
        shopifyTotal: 0,
        inventoryRows: 0,
        wroteInventory: false,
        trackingOff: false,
        iwHasUnmappedStock: false,
        iwHasInvalidQuantity: false,
        iwRows: new Set(),
      });
    }

    const group = groups.get(key);
    const variantKey = productKey(product);
    group.variants.add(variantKey);
    group.skus.add(product.sku || '');
    group.barcodes.add(product.barcode || '');
    group.trackingOff = group.trackingOff || !isInventoryTracked(product);

    if (!product.barcode) return;
    const match = lookupIwMatch(product.barcode, iw);
    if (match.status !== 'matched' || match.source !== 'primary') return;

    group.matchedVariants.add(variantKey);
    group.iwHasInvalidQuantity = group.iwHasInvalidQuantity || options.targets.some((target) => match.row.quantities[targetKeyOf(target)] === null);
    if (!group.iwRows.has(match.row)) {
      group.iwRows.add(match.row);
      group.iwTotal += totalForTargets(match.row, options);
      group.iwHasUnmappedStock = group.iwHasUnmappedStock || match.row.hasUnmappedStock;
    }

    const inventoryGroup = rowsByProduct.get(variantKey);
    if (inventoryGroup?.targetRows) {
      group.inventoryVariants.add(variantKey);
      group.inventoryRows += inventoryGroup.targetRows;
      group.shopifyTotal += inventoryGroup.currentTotal;
      group.wroteInventory = group.wroteInventory || inventoryGroup.wroteToCsv;
    }
  });

  const rows = [...groups.values()].filter((group) => group.iwRows.size > 0).map((group) => {
    const isActive = isShopifyActive(group.product);
    const currentStatus = currentShopifyStatus(group.product);
    const hasUnmappedStock = group.iwHasUnmappedStock;
    const hasInvalidIwQuantity = group.iwHasInvalidQuantity;
    const hasIncompleteIwMatch = group.matchedVariants.size < group.variants.size;
    const hasIncompleteInventory = group.inventoryVariants.size < group.variants.size;
    const canRecommendStatus = !group.trackingOff && !hasUnmappedStock && !hasInvalidIwQuantity && !hasIncompleteIwMatch && !hasIncompleteInventory;
    const desiredStatus = group.iwTotal > 0 ? 'active' : 'draft';
    const shouldChange = canRecommendStatus && ((desiredStatus === 'active' && !isActive) || (desiredStatus === 'draft' && isActive));
    let action;
    if (!canRecommendStatus) action = { label: 'Revisar', tone: 'warn', rank: 3 };
    else if (desiredStatus === 'active' && !isActive) action = { label: 'Activar', tone: 'ok', rank: 1 };
    else if (desiredStatus === 'draft' && isActive) action = { label: 'Deshabilitar', tone: 'danger', rank: 2 };
    else action = { label: 'Sin cambio', tone: 'info', rank: 4 };
    const details = [];

    if (canRecommendStatus) {
      details.push(group.iwTotal > 0 ? 'IW tiene existencia; debe quedar active.' : 'IW total 0; debe quedar draft.');
    } else {
      details.push('No se recomienda cambiar el estado de Shopify con estos datos.');
    }
    if (!group.inventoryRows) {
      details.push('No aparece en el CSV de inventario cargado; no se escriben cantidades ni se recomienda cambiar el estado.');
    }
    if (hasIncompleteIwMatch) {
      details.push('Alguna variante no tiene coincidencia UPC segura en IW; no se recomienda cambiar el estado.');
    }
    if (hasIncompleteInventory && group.inventoryRows > 0) {
      details.push('No todas las variantes aparecen en el CSV de inventario; no se recomienda cambiar el estado.');
    }
    if (group.trackingOff) {
      details.push('Tracking apagado en Shopify; revisar antes de confiar en la actualización de cantidades o cambiar el estado.');
    }
    if (hasUnmappedStock) {
      details.push('IW tiene existencia en bodegas fuera del mapeo; no se recomienda cambiar el estado.');
    }
    if (hasInvalidIwQuantity) {
      details.push('IW tiene cantidades no numéricas en una sucursal; no se recomienda cambiar el estado.');
    }
    if (shouldChange) {
      details.push('Incluido en el CSV de estados.');
    }

    return {
      Accion: htmlTag(action.label, action.tone),
      Handle: group.handle,
      SKU: joinSet(group.skus),
      'UPC Shopify': joinSet(group.barcodes),
      Producto: group.title,
      'Estado actual': currentStatus,
      'Estado recomendado': canRecommendStatus ? desiredStatus : 'Revisar',
      'Existencia IW': String(group.iwTotal),
      'Shopify actual': group.inventoryRows ? String(group.shopifyTotal) : '',
      'En CSV estados': shouldChange ? 'Si' : 'No',
      'En CSV inventario': group.wroteInventory ? 'Si' : 'No',
      'Tracking Shopify': group.trackingOff ? 'No activo' : 'Activo',
      Detalle: details.join(' '),
      _statusRank: action.rank,
      _statusCsv: shouldChange ? { Handle: group.handle, Title: group.title, Status: desiredStatus } : null,
    };
  });

  missingInShopify.forEach((row) => {
    rows.push({
      Accion: htmlTag('No encontrado', 'warn'),
      Handle: '',
      SKU: row['Código IW'],
      'UPC Shopify': row['Código de barras IW'],
      Producto: row['Producto IW'],
      'Estado actual': '',
      'Estado recomendado': '',
      'Existencia IW': String(row['Total IW']),
      'Shopify actual': '',
      'En CSV estados': 'No',
      'En CSV inventario': 'No',
      'Tracking Shopify': '',
      Detalle: 'Existe en IW con stock positivo, pero no aparece en el export de productos Shopify cargado.',
      _statusRank: 3,
      _statusCsv: null,
    });
  });

  return rows.sort((a, b) => (a._statusRank ?? 9) - (b._statusRank ?? 9) || String(a.Producto).localeCompare(String(b.Producto)));
}

function summarizeShopifyStatus(rows) {
  return rows.reduce(
    (summary, row) => {
      const action = stripHtml(String(row.Accion || ''));
      if (action === 'Activar') summary.activate += 1;
      if (action === 'Deshabilitar') summary.draft += 1;
      if (action === 'No encontrado') summary.notFound += 1;
      if (row['En CSV estados'] === 'Si') summary.csvRows += 1;
      return summary;
    },
    { activate: 0, draft: 0, notFound: 0, csvRows: 0 }
  );
}

function buildProductStatusCsv(rows) {
  const headers = ['Handle', 'Title', 'Status'];
  const csvRows = rows
    .map((row) => row._statusCsv)
    .filter(Boolean)
    .map((row) => headers.map((header) => row[header] ?? ''));
  return tableToCsv(headers, csvRows);
}

function currentShopifyStatus(product) {
  const status = normalizeText(product?.status);
  if (status) return status;
  return isShopifyActive(product) ? 'active' : 'draft';
}

function joinSet(set) {
  return [...set].filter(Boolean).join(' | ');
}

function getProductUploadState(product, match, stock, products) {
  if (!stock.hasShopifyStock) {
    return {
      status: 'out',
      label: 'Fuera inventario',
      detail: 'No aparece en el export de inventario Shopify cargado.',
    };
  }

  const blockReason = getUploadBlockReason(product.sku, product, match, products, null, stock.matchSource || 'handle_options');
  if (blockReason) {
    return {
      status: 'skipped',
      label: 'Omitido CSV',
      detail: blockReason,
    };
  }

  return {
    status: 'ready',
    label: 'Listo CSV',
    detail: 'Se escribira existencia solo si el tracking ya esta activo y la coincidencia es segura por UPC.',
  };
}

function getUploadBlockReason(sku, product, match, products, metrics, matchSource = '') {
  if (!product) {
    if (metrics) metrics.rowsWithoutProduct += 1;
    if (matchSource === 'handle_variant_missing') {
      return 'El handle existe en el export de productos, pero la variante (opciones) no coincide; reexporta productos Shopify.';
    }
    if (matchSource === 'sku_conflict') {
      return 'El handle no está en el export de productos y su SKU pertenece a otro producto que sí está en el inventario; reexporta productos Shopify.';
    }
    if (matchSource === 'sku_title_mismatch') {
      return 'El handle no está en el export de productos y el SKU apunta a un producto con otro nombre; reexporta productos Shopify.';
    }
    if (!sku) return 'Fila de inventario sin SKU y sin producto ubicable por handle; no se escribe en el CSV Shopify.';
    return 'El handle y el SKU del inventario no aparecen en el export de productos Shopify cargado; reexporta productos.';
  }
  if (matchSource === 'handle_ambiguous') {
    if (metrics) metrics.skippedDupSku += 1;
    return 'No se pudo ubicar la variante exacta dentro del producto (opciones o SKU repetidos); revisión manual.';
  }
  if (matchSource === 'sku' && sku && products.unsafeSkuKeys?.has(keySku(sku))) {
    if (metrics) metrics.skippedDupSku += 1;
    return 'El handle no está en el export de productos y el SKU está reutilizado en varias variantes; reexporta productos antes de subir.';
  }
  if (!isInventoryTracked(product)) {
    if (metrics) metrics.trackingWarnings += 1;
  }
  if (!product.barcode && match.status !== 'matched') {
    if (metrics) metrics.skippedNoUpc += 1;
    return 'Producto sin UPC Shopify; se omite del CSV de subida.';
  }
  if (match.status !== 'matched') {
    if (metrics) {
      if (match.status === 'not_found') metrics.skippedNoIw += 1;
      if (match.status === 'ambiguous') metrics.skippedAmbiguous += 1;
    }
    if (match.status === 'ambiguous' && match.conflict) {
      return 'UPC repetido en IW con existencias en conflicto (varias filas con stock distinto); corrige IW antes de subir.';
    }
    return matchStatusDetail(match.status);
  }
  if (match.source && match.source !== 'primary' && match.via !== 'sku_as_upc') {
    if (metrics) metrics.skippedNoIw += 1;
    return 'Coincidencia encontrada solo por SKU; se omite del CSV de subida porque no es UPC seguro.';
  }
  return '';
}

function buildUploadAuditRow(sku, product, location, match, currentQty, newQty, wroteToCsv, detail) {
  return {
    Decision: htmlTag(wroteToCsv ? 'Escribir' : 'Omitido', wroteToCsv ? 'ok' : 'warn'),
    Motivo: auditReason(detail, wroteToCsv),
    'Estado producto': product ? currentShopifyStatus(product) : '',
    SKU: sku || '',
    Handle: product?.handle || '',
    'UPC Shopify': product?.barcode || '',
    Producto: product?.title || product?.handle || '',
    Opciones: (product?.optionValues || []).filter(Boolean).join(' / '),
    Sucursal: location || '',
    'Coincidencia IW': matchStatusLabel(match),
    'Tracking Shopify': product ? trackingStatusLabel(product) : '',
    'Paso previo': !wroteToCsv && product && !isInventoryTracked(product) ? 'Activar tracking en Shopify antes de actualizar' : '',
    'Shopify actual': Number.isFinite(currentQty) ? String(currentQty) : '',
    'IW nuevo': wroteToCsv ? String(newQty) : '',
    'En CSV Shopify': wroteToCsv ? 'Si' : 'No',
    Detalle: detail,
  };
}

function addInventoryReview(review, row, idx, product, sku, location, match, seenKeys, explicitDetail = '') {
  const id = product?.barcode || sku;
  const title = product?.title || get(row, idx, 'Title');
  const detailByStatus = {
    missing_input: 'No tiene UPC Shopify y no hubo identificador alterno para buscar en IW.',
    not_found: 'No se encontró coincidencia en IW.',
    ambiguous: 'El identificador coincide con más de un producto IW. Revisión manual necesaria.',
  };
  const key = `${match.status}|${id}|${location}`;
  if (seenKeys?.has(key)) return;
  seenKeys?.add(key);

  review.push({
    Tipo: 'Sin actualización segura',
    'UPC / SKU': id,
    Producto: title,
    Sucursal: location,
    Detalle: explicitDetail || detailByStatus[match.status] || 'No se pudo actualizar.',
  });
}

function lookupIwMatch(barcode, iwIndex, fallback = '') {
  const isMap = iwIndex instanceof Map;
  const iwMap = isMap ? iwIndex : iwIndex?.byBarcode;
  const targetColumns = isMap ? [] : iwIndex?.targetColumns || [];
  const mergeCache = isMap ? null : iwIndex?.mergeCache;
  if (!iwMap) return { status: 'missing_input' };

  const primary = cleanIdentifier(barcode);
  const secondary = cleanIdentifier(fallback);
  if (!primary && !secondary) return { status: 'missing_input' };

  const collect = (keys) => {
    const rows = new Set();
    keys.forEach((key) => (iwMap.get(key) || []).forEach((row) => rows.add(row)));
    return [...rows];
  };

  if (primary) {
    const rows = collect(barcodeCandidateKeys(primary));
    if (rows.length === 1) return { status: 'matched', row: rows[0], source: 'primary', via: 'upc' };
    if (rows.length > 1) return resolveIwDuplicates(rows, targetColumns, mergeCache, 'primary');

    const completed = collect(barcodeCheckDigitCandidates(primary));
    if (completed.length === 1) return { status: 'matched', row: completed[0], source: 'primary', via: 'check_digit' };
    if (completed.length > 1) return { status: 'ambiguous', rows: completed };
  }

  if (secondary && looksLikeSkuIdentifier(secondary)) {
    const rows = collect(barcodeCandidateKeys(secondary));
    if (rows.length === 1) return { status: 'matched', row: rows[0], source: 'fallback', via: 'sku_as_upc' };
    if (rows.length > 1) return { status: 'ambiguous', rows };
  }

  return { status: 'not_found' };
}

function addBarcodeReference(map, value, row) {
  barcodeCandidateKeys(value).forEach((key) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    const list = map.get(key);
    if (!list.includes(row)) list.push(row);
  });
}

function addHandleReference(map, value, product) {
  const key = keyHandle(value);
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  const list = map.get(key);
  if (!list.includes(product)) list.push(product);
}

function findProductForInventoryRow(sku, handle, row, idx, products, context = {}) {
  const handleKey = keyHandle(handle);
  const skuKey = sku ? keySku(sku) : '';
  const candidates = handleKey ? products.byHandle.get(handleKey) : null;

  if (candidates?.length) {
    const rowOptions = [
      resolveField(row, idx, INVENTORY_FIELD_ALIASES.option1Value),
      resolveField(row, idx, INVENTORY_FIELD_ALIASES.option2Value),
      resolveField(row, idx, INVENTORY_FIELD_ALIASES.option3Value),
    ];
    const hasRowOptions = rowOptions.some((value) => value !== '');
    const byOptions = hasRowOptions
      ? candidates.filter((product) => optionValuesMatch(product.optionValues, rowOptions))
      : [];

    if (byOptions.length === 1) return { product: byOptions[0], source: 'handle_options' };
    if (byOptions.length > 1) {
      const byOptionsAndSku = skuKey ? byOptions.filter((product) => keySku(product.sku) === skuKey) : [];
      if (byOptionsAndSku.length === 1) return { product: byOptionsAndSku[0], source: 'handle_options' };
      return { product: byOptionsAndSku[0] || byOptions[0], source: 'handle_ambiguous' };
    }

    if (skuKey) {
      const bySku = candidates.filter((product) => keySku(product.sku) === skuKey);
      if (bySku.length === 1) return { product: bySku[0], source: 'handle_sku' };
      if (bySku.length > 1) return { product: bySku[0], source: 'handle_ambiguous' };
    }

    if (candidates.length === 1 && !hasRowOptions) return { product: candidates[0], source: 'handle_only' };
    return { product: null, source: 'handle_variant_missing' };
  }

  if (skuKey) {
    const product = products.bySku.get(skuKey);
    if (product) {
      if (context.inventoryHandleKeys?.has(keyHandle(product.handle))) return { product: null, source: 'sku_conflict' };
      const sameTitle = normalizeText(context.inventoryTitle) === normalizeText(product.title);
      if (!sameTitle && !isPlaceholderProduct(product)) return { product: null, source: 'sku_title_mismatch' };
      return { product, source: 'sku' };
    }
  }

  return { product: null, source: '' };
}

function hasBarcodeReference(map, value) {
  return barcodeCandidateKeys(value).some((key) => map.has(key));
}

function barcodeCandidateKeys(value) {
  const cleaned = cleanIdentifier(value);
  if (!cleaned || cleaned === '0') return [];

  const upper = cleaned.toUpperCase();
  const compact = upper.replace(/[\s-]+/g, '');
  const alnum = upper.replace(/[^A-Z0-9]/g, '');
  const keys = [upper, compact, alnum];

  [upper, compact, alnum].forEach((item) => {
    const stripped = item.replace(/^0+/, '');
    if (stripped) keys.push(stripped);
  });

  return [...new Set(keys.filter(Boolean))];
}

function renderMetrics(metrics = {}) {
  if (!Object.keys(metrics).length) {
    els.metricsGrid.innerHTML = `
      <div class="metrics-empty">
        <svg class="icon" aria-hidden="true"><use href="#i-bars" /></svg>
        <span>Carga los tres archivos y ejecuta la comparación para ver el resumen.</span>
      </div>
    `;
    return;
  }

  const values = [
    { label: 'Variantes Shopify', value: metrics.variants ?? 0, meta: 'Catálogo leído', icon: 'i-package' },
    { label: 'Filas inventario', value: metrics.inventoryRows ?? 0, meta: 'Export Shopify', icon: 'i-clipboard' },
    { label: 'Listas CSV', value: metrics.updatedRows ?? 0, meta: 'Coincidencia UPC', icon: 'i-check', tone: 'accent' },
    { label: 'Filas en CSV', value: metrics.csvRows ?? 0, meta: 'Se suben a Shopify', icon: 'i-download', tone: 'accent' },
    { label: 'Productos CSV', value: metrics.updatedProducts ?? 0, meta: 'Variantes únicas', icon: 'i-barcode' },
    { label: 'Activar', value: metrics.statusToActivate ?? 0, meta: 'CSV estados', icon: 'i-store', tone: 'ok' },
    { label: 'Pasar a borrador', value: metrics.statusToDraft ?? 0, meta: 'Sin stock IW', icon: 'i-eye-off', tone: 'danger' },
    { label: 'Puestos en 0', value: metrics.zeroedRows ?? 0, meta: `${formatNumber(metrics.zeroedActiveRows ?? 0)} de activos`, icon: 'i-zero', tone: (metrics.zeroedActiveRows ?? 0) > 0 ? 'danger' : 'attention' },
    { label: 'UPC por corregir', value: metrics.upcFixRows ?? 0, meta: 'Sin UPC o fuera de IW', icon: 'i-barcode', tone: 'attention' },
    { label: 'Sin seguimiento', value: metrics.untrackedActive ?? 0, meta: `${formatNumber(metrics.untrackedWithIwStock ?? 0)} con existencia IW`, icon: 'i-eye-off', tone: 'attention' },
    { label: 'Fuera del export', value: metrics.handlesNotInProducts ?? 0, meta: 'Reexporta productos', icon: 'i-alert', tone: 'attention' },
    { label: 'Bodegas sueltas', value: metrics.unmappedWarehouses ?? 0, meta: `${formatNumber(metrics.unmappedWarehouseUnits ?? 0)} unidades fuera`, icon: 'i-swap', tone: 'attention' },
    { label: 'No creados', value: metrics.statusNotFound ?? 0, meta: 'IW sin producto', icon: 'i-plus', tone: 'attention' },
    { label: 'Omitidas CSV', value: metrics.safeSkippedRows ?? 0, meta: 'Revisar antes de subir', icon: 'i-alert', tone: 'attention' },
    { label: 'Dif. de precio', value: metrics.priceDifferences ?? 0, meta: `Shopify vs ${metrics.priceColumn || 'IW'}`, icon: 'i-tag', tone: 'attention' },
    { label: 'Precio inválido/0', value: metrics.priceZeroIssues ?? 0, meta: 'Corregir manual', icon: 'i-tag', tone: 'danger' },
    { label: 'Revisar', value: (metrics.review ?? 0) + (metrics.priceReview ?? 0), meta: 'Casos sensibles', icon: 'i-list', tone: 'attention' },
  ];

  els.metricsGrid.innerHTML = values
    .map(
      ({ label, value, meta, icon, tone = '' }) => `
        <article class="metric"${tone ? ` data-tone="${tone}"` : ''}>
          <strong class="metric-value">${formatNumber(value)}</strong>
          <span class="metric-label">${escapeHtml(label)}</span>
          <small class="metric-meta">${escapeHtml(meta)}</small>
          <span class="metric-icon" aria-hidden="true"><svg class="icon"><use href="#${icon}" /></svg></span>
        </article>
      `
    )
    .join('');
}

function renderTabCounts() {
  document.querySelectorAll('[data-tab-count]').forEach((node) => {
    const view = node.dataset.tabCount;
    const total = views[view]?.getRows().length ?? 0;
    node.textContent = formatNumber(total);
  });
}

function renderPriceFilterState() {
  const isPriceView = state.view === 'prices';
  const panel = document.getElementById('priceFilterPanel');
  if (panel) panel.hidden = !isPriceView;
  document.querySelectorAll('[data-price-filter]').forEach((button) => {
    button.classList.toggle('active', button.dataset.priceFilter === state.priceFilter);
  });
  renderPriceComparisonSummary();
}

function renderPriceComparisonSummary() {
  const isPriceView = state.view === 'prices';
  if (els.priceComparisonSummary) els.priceComparisonSummary.hidden = !isPriceView;

  if (els.resultsTitle) {
    els.resultsTitle.textContent = isPriceView ? 'Comparación de precios' : 'Centro de revisión';
  }

  if (!isPriceView) {
    if (els.resultsSubtitle) els.resultsSubtitle.textContent = 'Elige una vista en el menú lateral antes de subir el archivo.';
    return;
  }

  const reference = state.result?.priceColumn || els.iwPriceColumn?.value || 'sin referencia';
  const staleText = state.priceSelectionDirty
    ? ` El resultado visible todavía usa ${state.result?.priceColumn || 'la referencia anterior'}; vuelve a comparar.`
    : '';
  if (els.resultsSubtitle) {
    els.resultsSubtitle.textContent = `Referencia: ${reference} IW · El reporte no modifica precios.${staleText}`;
  }
  if (els.priceReferenceText) {
    els.priceReferenceText.textContent = state.result
      ? `Referencia calculada: ${state.result.priceColumn || 'sin precio disponible'} IW.${staleText}`
      : 'Carga los archivos y ejecuta la comparación para ver el resultado.';
  }

  if (!els.priceSummaryGrid) return;
  const metrics = state.result?.metrics || {};
  const values = [
    { label: 'Comparables', value: metrics.priceComparables ?? 0 },
    { label: 'Coinciden', value: metrics.priceMatches ?? 0, tone: 'ok' },
    { label: 'Ofertas reales', value: metrics.saleProducts ?? 0, tone: 'info' },
    { label: 'Oferta: regular coincide', value: metrics.offerReferenceMatches ?? 0, tone: 'info' },
    { label: 'Diferencias', value: metrics.priceDifferences ?? 0, tone: 'warn' },
    { label: 'Coinciden con otra lista', value: metrics.otherPriceMatches ?? 0, tone: 'info' },
    { label: 'Sin precio IW', value: metrics.priceMissing ?? 0, tone: 'danger' },
    { label: 'Compare-at inconsistente', value: metrics.compareAtIssues ?? 0, tone: 'warn' },
  ];
  els.priceSummaryGrid.innerHTML = values
    .map(
      ({ label, value, tone = '' }) => `
        <article class="price-summary-item"${tone ? ` data-tone="${tone}"` : ''}>
          <strong>${formatNumber(value)}</strong>
          <span title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        </article>
      `
    )
    .join('');
}

function renderPriceFilterCounts() {
  const rows = state.result?.priceReport ?? [];
  PRICE_FILTERS.forEach((filter) => {
    const node = document.querySelector(`[data-price-filter-count="${filter.id}"]`);
    if (!node) return;
    const total = rows.filter((row) => rowMatchesPriceFilter(row, filter.id)).length;
    node.textContent = formatNumber(total);
  });
}

function renderTable() {
  const config = views[state.view];
  const rows = config.getRows();
  const query = normalizeText(els.searchInput.value);
  const filtered = rows
    .filter((row) => state.view !== 'prices' || rowMatchesPriceFilter(row, state.priceFilter))
    .filter((row) => rowMatches(row, query));
  const visible = filtered.slice(0, 600);
  const table = els.resultsTable;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  table.classList.toggle('is-empty', !visible.length);

  thead.innerHTML = `<tr>${config.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>`;

  if (!visible.length) {
    const emptyMessage =
      state.view === 'prices' && rows.length
        ? `No hay productos en esta categoría para ${state.result?.priceColumn || 'el precio IW seleccionado'}.`
        : rows.length
          ? 'No hay resultados con ese filtro.'
          : 'Sin datos para esta vista.';
    tbody.innerHTML = `<tr><td class="empty-state" colspan="${config.columns.length}">${escapeHtml(emptyMessage)}</td></tr>`;
  } else {
    tbody.innerHTML = visible
      .map(
        (row) => `
          <tr>
            ${config.columns
              .map((column) => `<td data-column="${escapeHtml(column)}">${formatCell(row[column], column)}</td>`)
              .join('')}
          </tr>
        `
      )
      .join('');
  }

  const suffix = filtered.length > visible.length ? `, mostrando ${visible.length}. Usa el buscador para localizar cualquier producto cargado.` : '';
  els.tableCount.textContent = `${formatNumber(filtered.length)} registros${suffix}`;
}

function rowMatches(row, query) {
  if (!query) return true;
  if (!row[SEARCH_CACHE]) {
    row[SEARCH_CACHE] = normalizeText(Object.values(row).map((value) => stripHtml(String(value))).join(' '));
  }
  return row[SEARCH_CACHE].includes(query);
}

function rowMatchesPriceFilter(row, filterId) {
  const flags = row._priceFlags ?? [];
  if (filterId === 'all') return true;
  return flags.includes(filterId);
}

function formatCell(value, column) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') {
    const tag = value.match(/^<span class="tag (danger|ok|warn|info)">([^<>]*)<\/span>$/);
    if (tag) return `<span class="tag ${tag[1]}">${escapeHtml(tag[2])}</span>`;
  }
  const className = /UPC|SKU|Código|Precio|Diferencia|Existencia|Shopify actual|Fila|Filas/.test(column) ? ' class="mono"' : '';
  return `<span${className}>${escapeHtml(String(value))}</span>`;
}

function htmlTag(text, tone) {
  return `<span class="tag ${tone}">${escapeHtml(text)}</span>`;
}

function buildReportRows(uploadAudit, updatedProducts, shopifyStatus, actions, zeroStock, missingInShopify, review, priceReportRows = []) {
  return [
    ...uploadAudit.map((row) => ({
      Vista: 'Subida segura',
      ...stripObjectHtml(row),
    })),
    ...updatedProducts.map((row) => ({
      Vista: 'Productos actualizados',
      ...stripObjectHtml(row),
    })),
    ...shopifyStatus.map((row) => ({
      Vista: 'Shopify estados',
      ...stripObjectHtml(row),
    })),
    ...actions.map((row) => ({
      Vista: 'Acciones',
      ...stripObjectHtml(row),
    })),
    ...priceReportRows.map((row) => ({
      Vista: 'Precios',
      ...row,
    })),
    ...zeroStock.map((row) => ({
      Vista: 'Inventario cero',
      ...row,
    })),
    ...missingInShopify.map((row) => ({
      Vista: 'No creados',
      ...row,
    })),
    ...review.map((row) => ({
      Vista: 'Revisión',
      ...row,
    })),
  ];
}

function stripObjectHtml(row) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => [key, stripHtml(String(value ?? ''))])
  );
}

function setBusy(isBusy, message = '') {
  document.body.classList.toggle('is-busy', isBusy);
  els.processButton.disabled = isBusy || !(state.files.products.length && state.files.inventory && state.files.iw);
  const runLabel = isBusy ? 'Procesando...' : 'Comparar y generar archivos';
  if (els.processButtonLabel) els.processButtonLabel.textContent = runLabel;
  else els.processButton.textContent = runLabel;
  if (els.iwPriceColumn) {
    els.iwPriceColumn.disabled = isBusy || !state.iwHeaders.some(isIwPriceHeader);
  }
  if (message) setMessage(message);
}

function setMessage(message, type = 'info') {
  const target = els.processMessageText || els.processMessage;
  target.textContent = message;
  els.processMessage.dataset.tone = type;
  if (els.processMessage.classList) els.processMessage.classList.toggle('is-visible', Boolean(message));
}

function setProgress(value) {
  if (!els.progressBar) return;
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  els.progressBar.style.width = `${safeValue}%`;
}

function enableDownloads(enabled) {
  [els.downloadInventory, els.downloadStatus, els.downloadReport, els.downloadPriceReport, els.downloadMissing, els.downloadUntracked, els.downloadZeroed, els.downloadUpcFix].forEach((button) => {
    button.disabled = !enabled;
  });
  syncPriceDownloadState(enabled);
}

function syncPriceDownloadState(baseEnabled = Boolean(state.result)) {
  if (!els.downloadPriceReport) return;
  els.downloadPriceReport.disabled = !baseEnabled || !state.result || state.priceSelectionDirty;
}

function resetApp() {
  state.files.products = [];
  state.files.inventory = null;
  state.files.iw = null;
  state.result = null;
  state.view = 'actions';
  state.priceFilter = 'all';
  state.priceSelectionDirty = false;
  state.iwHeaders = [];
  els.productsInput.value = '';
  els.inventoryInput.value = '';
  els.iwInput.value = '';
  els.searchInput.value = '';
  els.removeCurrentOnHand.checked = true;
  if (els.onlyUpdatedRows) els.onlyUpdatedRows.checked = true;
  if (els.zeroMissingIw) els.zeroMissingIw.value = 'all';
  if (els.zeroNoUpc) els.zeroNoUpc.checked = false;
  if (els.iwPriceColumn) {
    els.iwPriceColumn.innerHTML = '<option value="">Carga Existencias IW</option>';
    els.iwPriceColumn.disabled = true;
  }
  if (els.iwPriceStatus) {
    els.iwPriceStatus.textContent = 'Se seleccionará Precio 4 por defecto cuando exista.';
    delete els.iwPriceStatus.dataset.tone;
  }
  enableDownloads(false);
  setProgress(0);
  updateFileLabels();
  renderMetrics();
  renderTabCounts();
  renderPriceFilterCounts();
  renderPriceComparisonSummary();
  setActiveView('actions');
  setMessage('');
}

function validateAnyField(idx, fields, label) {
  if (fields.some((field) => hasHeader(idx, field))) return;
  throw new Error(`El archivo ${label} no tiene las columnas esperadas: ${fields.join(', ')}.`);
}

function findTargetForLocation(location, targets) {
  const key = normalizeHeader(location);
  return targets.find((target) => target.locationKeys.includes(key)) ?? null;
}

function isShopifyActive(product) {
  const status = normalizeText(product.status);
  const published = normalizeText(product.published);
  if (status) return status === 'active';
  if (published) return published === 'true' || published === 'yes' || published === '1';
  return true;
}

function isShopifyVariantRow(product) {
  return Boolean(product.sku || product.barcode || stringifyCell(product.priceRaw).trim() || stringifyCell(product.compareAtRaw).trim());
}

function classifySale(product) {
  const price = product.price;
  const compareAt = product.compareAtPrice;

  if (!compareAt.hasValue) {
    return { label: 'Sin oferta', hasOfferMarker: false, isRealSale: false, hasIssue: false };
  }

  if (!compareAt.valid) {
    return { label: 'Compare-at no numérico', hasOfferMarker: true, isRealSale: false, hasIssue: true };
  }

  if (!price.hasValue || !price.valid) {
    return { label: 'Compare-at sin precio actual válido', hasOfferMarker: true, isRealSale: false, hasIssue: true };
  }

  if (compareAt.amount === 0) {
    return { label: 'Sin oferta', hasOfferMarker: false, isRealSale: false, hasIssue: false };
  }

  const difference = roundMoney(compareAt.amount - price.amount);
  if (difference > 0.004) {
    const percent = compareAt.amount ? Math.round((difference / compareAt.amount) * 100) : 0;
    return {
      label: `En oferta (${formatMoneyCell({ amount: difference, hasValue: true, valid: true })} menos, ${percent}%)`,
      hasOfferMarker: true,
      isRealSale: true,
      hasIssue: false,
    };
  }

  if (Math.abs(difference) <= 0.004) {
    return { label: 'Sin oferta', hasOfferMarker: false, isRealSale: false, hasIssue: false };
  }

  return { label: 'Compare-at menor que el precio actual', hasOfferMarker: true, isRealSale: false, hasIssue: true };
}

function getRegularShopifyPrice(product) {
  const price = product.price;
  const compareAt = product.compareAtPrice;
  if (
    price?.hasValue &&
    price.valid &&
    compareAt?.hasValue &&
    compareAt.valid &&
    compareAt.amount - price.amount > 0.004
  ) {
    return compareAt;
  }
  return price;
}

function compareMoney(shopifyPrice, iwPrice) {
  if (!shopifyPrice?.hasValue || !shopifyPrice.valid || !iwPrice?.hasValue || !iwPrice.valid) {
    return { hasComparison: false, difference: 0 };
  }
  return {
    hasComparison: true,
    difference: roundMoney(shopifyPrice.amount - iwPrice.amount),
  };
}

function hasZeroPriceIssue(product, iwPrice) {
  return Boolean(
    (product.price.valid && product.price.hasValue && product.price.amount === 0) ||
      (iwPrice?.valid && iwPrice.hasValue && iwPrice.amount === 0)
  );
}

function matchStatusDetail(status) {
  const details = {
    missing_input: 'No tiene UPC Shopify y no hubo identificador alterno para buscar en IW.',
    not_found: 'No se encontro coincidencia en IW.',
    ambiguous: 'El identificador coincide con mas de un producto IW; revision manual necesaria.',
  };
  return details[status] || 'No se pudo comparar contra IW.';
}

function matchStatusLabel(matchOrStatus) {
  const status = typeof matchOrStatus === 'string' ? matchOrStatus : matchOrStatus?.status;
  if (status === 'matched' && matchOrStatus?.source === 'fallback') return 'Encontrado por SKU';
  if (status === 'matched') return 'Encontrado por UPC';
  const labels = {
    missing_input: 'Sin identificador',
    not_found: 'Sin IW',
    ambiguous: 'Ambiguo',
  };
  return labels[status] || 'Sin IW';
}

function findHeader(headers, aliases) {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));
  for (const alias of aliases) {
    const found = normalized.get(normalizeHeader(alias));
    if (found) return found;
  }
  return '';
}

function indexHeaders(headers) {
  return new Map(headers.map((header, index) => [normalizeHeader(header), index]));
}

function hasHeader(index, header) {
  return index.has(normalizeHeader(header));
}

function get(row, index, header) {
  const key = normalizeHeader(header);
  const i = index.get(key);
  return i === undefined ? '' : stringifyCell(row[i]);
}

function resolveField(row, index, aliases) {
  for (const alias of aliases) {
    const value = get(row, index, alias);
    if (value !== '') return value;
  }
  return '';
}

function removeCsvColumnByAliases(headers, rows, aliases) {
  const colIndex = headers.findIndex(h =>
    aliases.some(a => normalizeHeader(h) === normalizeHeader(a))
  );
  if (colIndex === -1) return { headers, rows };
  const newHeaders = headers.filter((_, i) => i !== colIndex);
  const newRows = rows.map(row => row.filter((_, i) => i !== colIndex));
  return { headers: newHeaders, rows: newRows };
}

function normalizeNumericText(raw) {
  let text = stringifyCell(raw).replace(/\s/g, '').replace(/[$€£¢]/g, '');
  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma && hasDot) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.') ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (hasComma) {
    text = /^[-+]?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  }
  return text;
}

function parseQuantity(value, options = {}) {
  const raw = stringifyCell(value).trim();
  if (!raw || normalizeText(raw) === 'not stocked') return { quantity: 0 };
  const normalized = normalizeNumericText(raw);
  const number = /^[-+]?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;

  if (!Number.isFinite(number)) {
    return { quantity: 0, invalid: true, warning: `Cantidad no numérica "${raw}"; no se escribe esa sucursal.` };
  }

  let quantity = Math.round(number);
  let warning = '';

  if (Math.abs(number - quantity) > 0.0001) {
    warning = `Cantidad decimal "${raw}" redondeada a ${quantity}.`;
  }

  if (options.clampNegative && quantity < 0) {
    warning = `Cantidad negativa "${raw}" convertida a 0.`;
    quantity = 0;
  }

  return { quantity, warning };
}

function parseMoney(value) {
  const raw = stringifyCell(value).trim();
  if (!raw) return { raw, amount: null, hasValue: false, valid: true };

  const normalized = normalizeNumericText(raw);
  const amount = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
  if (!Number.isFinite(amount)) {
    return { raw, amount: null, hasValue: true, valid: false };
  }

  return {
    raw,
    amount: roundMoney(amount),
    hasValue: true,
    valid: true,
  };
}

function roundMoney(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cleanIdentifier(value) {
  return stringifyCell(value)
    .trim()
    .replace(/^[']+/, '')
    .replace(/\u200b/g, '');
}

function normalizeSku(value) {
  return cleanIdentifier(value);
}

function keySku(value) {
  return normalizeSku(value).toUpperCase().replace(/\s+/g, '');
}

function keyHandle(value) {
  return cleanIdentifier(value).toLowerCase();
}

function productKey(product) {
  if (!product) return '';
  if (product.sourceFile && product.sourceRow) return `${product.sourceFile}:${product.sourceRow}`;
  return `${keyHandle(product.handle)}|${keySku(product.sku)}|${cleanIdentifier(product.barcode).toUpperCase()}`;
}

function normalizeHeader(value) {
  return normalizeText(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeText(value) {
  return stringifyCell(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function stringifyCell(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return formatNumericCell(value);
  return String(value);
}

function formatNumericCell(value) {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) return value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
  return value.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 6 });
}

function tableToCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((_, index) => csvEscape(row[index] ?? '')).join(','));
  });
  return lines.join('\r\n');
}

function csvFromObjects(rows) {
  if (!rows.length) return '';
  const headers = [...rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set())];
  return tableToCsv(
    headers,
    rows.map((row) => headers.map((header) => row[header] ?? ''))
  );
}

function csvEscape(value) {
  const text = stringifyCell(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadText(text, filename, type = 'text/csv') {
  const bom = type.includes('csv') ? '\ufeff' : '';
  const blob = new Blob([bom + text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function dateStamp() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}

function fileSlug(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'precio_iw';
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-SV').format(value);
}

function formatMoneyCell(money) {
  if (!money?.hasValue) return '';
  if (!money.valid) return money.raw;
  return money.amount.toFixed(2);
}

function formatSignedMoney(value) {
  const rounded = roundMoney(value);
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded.toFixed(2)}`;
}

function formatSignedNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  const prefix = number > 0 ? '+' : '';
  return `${prefix}${number}`;
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '0 s';
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(1)} s`;
}

function escapeHtml(value) {
  return stringifyCell(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value) {
  const template = document.createElement('template');
  template.innerHTML = value;
  return template.content.textContent || '';
}

function idle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
