<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import './styles.css';
  // import { SpeedInsights } from "@vercel/speed-insights/next"

  let email = '';
  let functionalArea = '';
  let description = '';
  let columns = [];
  let columnSearch = '';
  let showColumnList = false;
  let expectedValue = '';
  let filterRows = [{ column: '', operator: '=', value: '', search: '', showList: false }];
  let platformSelections = [];
  let issueType = '';
  let issueTypeDraft = 'Data Validation';
  let activeIssueType = '';
  let selectionPulse = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let selectionPulseTimer = null;
  let issuePreviewSrc = '';
  let previewFading = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let previewFadeTimer = null;
  let showIssueModal = true;
  let issueModalError = '';
  let closingIssueModal = false;

  let loading = false;
  let success = false;
  let error = '';
  let fieldErrors = {};
  let showModal = false;
  let modalMessage = '';
  let modalVariant = 'success';
  let closingModal = false;

  let dark = true;

  $: filteredColumns = COLUMN_OPTIONS.filter((opt) => {
    const matches = opt.toLowerCase().includes(columnSearch.toLowerCase());
    const notSelected = !columns.includes(opt);
    return matches && notSelected;
  });

  function toggleDark() {
    dark = !dark;
    localStorage.setItem('dv-dark', dark);
  }

  function goBackToIssueSelect() {
    issueType = '';
    issueTypeDraft = 'Data Validation';
    showIssueModal = true;
    closingIssueModal = false;
  }

  function validate() {
    const problems = {};
    if (!email.trim()) problems.email = 'Email is required';
    if (!description.trim()) problems.description = 'Description is required';
    if (!columns.length) problems.columns = 'Select at least one column';
    if (!expectedValue.trim()) problems.expectedValue = 'Expected value is required';
    fieldErrors = problems;
    return Object.keys(problems).length === 0;
  }

  let modalPayloadLines = [];

  function toHighlightedLines(obj) {
    const str = JSON.stringify(obj, null, 2);
    const highlighted = syntaxHighlight(str);
    return highlighted
      ? highlighted.split('\n').map((line, idx) => ({ number: idx + 1, line }))
      : [];
  }

  function showDebugPayload() {
    modalPayloadLines = toHighlightedLines(buildPayload());
    modalVariant = 'info';
    closingModal = false;
    showModal = true;
  }

  function closeModal() {
    if (closingModal) return;
    closingModal = true;
    setTimeout(() => {
      showModal = false;
      closingModal = false;
    }, 180);
  }

  function addColumn(opt) {
    if (!columns.includes(opt)) {
      columns = [...columns, opt];
    }
    columnSearch = '';
  }

  function removeColumn(opt) {
    columns = columns.filter((c) => c !== opt);
  }

  async function submitForm() {
    if (loading) return;
    loading = true;
    success = false;
    error = '';

    if (!validate()) {
      loading = false;
      return;
    }

    const payload = buildPayload();

    try {
      const res = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || 'Request failed');
      }

      success = true;
      modalMessage = 'Your validation request has been sent.';
      modalVariant = 'success';
    } catch (err) {
      error = err?.message || 'Something went wrong';
      modalMessage = error;
      modalVariant = 'error';
    } finally {
      closingModal = false;
      showModal = true;
      loading = false;
    }
  }

  onMount(() => {
    const saved = localStorage.getItem('dv-dark');
    dark = saved !== null ? saved === 'true' : true;
    localStorage.setItem('dv-dark', dark);
  });

  const buildPayload = () => {
    const now = new Date();
    const filters = filterRows
      .map((f) => ({
        column: f.column.trim(),
        operator: f.operator.trim(),
        value: f.value.trim()
      }))
      .filter((f) => f.column && f.operator && f.value);

    const filtersText = filters.length
      ? filters.map((f) => `${f.column} ${f.operator} ${f.value}`).join(' AND ')
      : '';

    return {
      email,
      functional_area: functionalArea,
      description,
      issue_type: issueType,
      platform_input: platformSelections,
      target_columns: columns,
      expected_value: expectedValue,
      data_filters: filtersText,
      filters,
      timestamp_iso: now.toISOString(),
      timestamp_local: now.toLocaleString()
    };
  };

  const syntaxHighlight = (json) => {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="code-key">${match}</span>`
            : `<span class="code-string">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="code-boolean">${match}</span>`;
        if (match === 'null') return `<span class="code-null">${match}</span>`;
        return `<span class="code-number-value">${match}</span>`;
      }
    );
  };

  const OPERATORS = ['=', '<>', '>', '<', '>=', '<=', 'contains', 'starts_with', 'ends_with'];
  const PLATFORM_OPTIONS = ['SAP', 'ABB.COM', 'ABB Shop', 'OMS'];
  const ISSUE_OPTIONS = ['Data Validation', 'Data Request', 'Functional Issue'];

  const addFilter = () => {
    filterRows = [...filterRows, { column: '', operator: '=', value: '', search: '', showList: false }];
  };

  const removeFilter = (index) => {
    if (filterRows.length === 1) return;
    filterRows = filterRows.filter((_, i) => i !== index);
  };

  const updateFilter = (index, key, value) => {
    filterRows = filterRows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
  };

  const getFilteredColumns = (search) =>
    COLUMN_OPTIONS.filter((opt) => opt.toLowerCase().includes((search || '').toLowerCase()));

  const setFilterSearch = (index, value) => {
    filterRows = filterRows.map((row, i) =>
      i === index ? { ...row, search: value, column: value } : row
    );
  };

  const selectFilterColumn = (index, opt) => {
    filterRows = filterRows.map((row, i) =>
      i === index ? { ...row, column: opt, search: opt, showList: false } : row
    );
  };

  const confirmIssueType = () => {
    if (!issueTypeDraft) {
      issueModalError = 'Please select an issue type.';
      return;
    }
    issueModalError = '';
    if (issueTypeDraft === 'Data Request') {
      goto('/data-request');
      return;
    }
    if (issueTypeDraft === 'Functional Issue') {
      goto('/functional-issue');
      return;
    }

    issueType = issueTypeDraft;
    closingIssueModal = true;
    setTimeout(() => {
      showIssueModal = false;
      closingIssueModal = false;
    }, 180);
  };

  $: activeIssueType = showIssueModal ? issueTypeDraft : issueType;

  function computePreviewSrc(selection) {
    if (selection === 'Data Request') return '/data-request';
    if (selection === 'Functional Issue') return '/functional-issue';
    return '';
  }

  function triggerSelectionTransition() {
    if (!showIssueModal) return;

    if (selectionPulseTimer) clearTimeout(selectionPulseTimer);
    selectionPulse = true;
    selectionPulseTimer = setTimeout(() => {
      selectionPulse = false;
      selectionPulseTimer = null;
    }, 360);
  }

  /**
   * @param {unknown} nextSelection
   */
  function syncIssuePreview(nextSelection) {
    const nextSrc = computePreviewSrc(typeof nextSelection === 'string' ? nextSelection : '');
    if (nextSrc === issuePreviewSrc) return;

    if (previewFadeTimer) clearTimeout(previewFadeTimer);
    previewFading = true;
    previewFadeTimer = setTimeout(() => {
      issuePreviewSrc = nextSrc;
      previewFading = false;
      previewFadeTimer = null;
    }, 180);
  }

   const COLUMN_OPTIONS = [
   "MATERIAL_NUMBER",
      "SALE_ORGANIZATION",
      "PLANT",
      "DISTRIBUTION_CHANNEL",
      "WAREHOUSE_NUMBER",
      "STORAGE_LOCATION",
      "STORAGE_TYPE",
      "ABC_INDICATOR",
      "ACCOUNT_ASSIGNMENT_GROUP",
      "ALTERNATIVE_BOM",
      "AUTOMATIC_PO",
      "AVAILABILITY_CHECK",
      "BASE_UNIT_OF_MEASURE",
      "BATCH_MANAGEMENT",
      "BOM_USAGE",
      "CASH_DISCOUNT",
      "CATALOG_501",
      "CHANGED_ON",
      "COMMISSION_GROUP",
      "COUNTRY_OF_ORIGIN",
      "CREATED_ON",
      "CURRENT_INVENTORY",
      "DELIVERING_PLANT",
      "DIVISION",
      "DISTRIBUTION_INDICATOR",
      "EAN_NUMBER",
      "GLOBAL_PRODUCT_ID",
      "GOODS_RECEIPT_TIME",
      "GROSS_WEIGHT",
      "HTS_CODE",
      "IN_HOUSE_PRODUCTION_TIME",
      "INDUSTRY_SECTOR",
      "INDUSTRY_STANDARD_DESC",
      "ITEM_CATEGORY_GROUP",
      "LAB_OFFICE",
      "LAST_SALES_DATE",
      "LOADING_GROUP",
      "MANUFACTURER_NUMBER",
      "MANUFACTURER_PART_NUMBER",
      "MATERIAL_DESCRIPTION",
      "MATERIAL_GROUP",
      "MATERIAL_GROUP_1",
      "MATERIAL_GROUP_2",
      "MATERIAL_GROUP_3",
      "MATERIAL_GROUP_4",
      "MATERIAL_GROUP_5",
      "MATERIAL_STATISTICS_GROUP",
      "MATERIAL_TYPE",
      "MAXIMUM_LOT_SIZE",
      "MINIMUM_LOT_SIZE",
      "MINIMUM_REM_SHELF_LIFE_DAYS",
      "MRP_CONTROLLER",
      "MRP_GROUP",
      "MRP_TYPE",
      "NET_WEIGHT",
      "OBJECT_CODE",
      "OBJECT_CODE_EXT",
      "OLD_MATERIAL_NUMBER",
      "OMS_FLAG",
      "PACK_INDICATOR",
      "PHYSICAL_INVENTORY_INDICATOR",
      "PLANNED_DELIVERY_TIME",
      "PLANNING_TIME_FENCE",
      "PRICE_GROUP_CODE",
      "PRICING_GROUP",
      "PROCUREMENT_INDICATOR",
      "PROCUREMENT_TYPE",
      "PRODUCT_GROUP",
      "PRODUCT_HIERARCHY",
      "PRODUCTION_SCHEDULER",
      "PROFIT_CENTER",
      "PROPRIETARY",
      "PROPRIETARY_TYPE",
      "PURCHASING_GROUP",
      "PURCHASING_VALUE_GROUP",
      "SAFETY_STOCK",
      "SALES_STATUS",
      "SALES_ITEM_CATEGORY_GROUP",
      "SERIAL_NUMBER_PROFILE",
      "SIZE_DIMENSIONS",
      "SPECIAL_PROCUREMENT_TYPE",
      "SPEC",
      "STANDARD_PRICE",
      "STORAGE_TEMP_CONDITIONS",
      "STRATEGY_GROUP",
      "TOTAL_SHELF_LIFE_DAYS",
      "TOTAL_STOCK",
      "VALUATION_CATEGORY",
      "VALUATION_CLASS",
      "VOLUME",
      "VOLUME_REBATE_GROUP",
      "VOLUME_UNIT",
      "WARRANTY",
      "WEIGHT_UNIT",
      "ENG_CHANGE_NUMBER",
      "ENG_CATALOG_SPEC",
      "ENG_ELECTRICAL_SPEC",
      "ENG_AMPS",
      "ENG_INSULATION_CLASS",
      "ENG_NEMA_DESIGN_CODE",
      "ENG_PHASE",
      "ENG_POLES",
      "ENG_DUTY_TYPE",
      "ENG_RPM",
      "ENG_EFFICIENCY_LEVEL_RAW",
      "ENG_EFFICIENCY_LEVEL",
      "ENG_SERVICE_FACTOR",
      "ENG_OUTPUT",
      "ENG_FREQUENCY",
      "ENG_VOLTAGE",
      "ENG_ENCLOSURE",
      "ENG_FRAME_SIZE",
      "ENG_MOUNTING_TYPE",
      "ENG_MOUNTING_ORIENTATION",
      "ENG_BRAKE_CODE",
      "ENG_HAZ_DIVISION_IND",
      "ENG_EXPLOSION_PROOF_IND",
      "ENG_CLASS_GROUP_RAW",
      "ENG_XP_CLI",
      "ENG_XP_CLII",
      "ENG_XP_GPA",
      "ENG_XP_GPB",
      "ENG_XP_GPC",
      "ENG_XP_GPD",
      "ENG_XP_GPE",
      "ENG_XP_GPF",
      "ENG_XP_GPG",
      "ENG_AGENCY_LOGOS_RAW",
      "ENG_AGENCY_LOGOS_READABLE",
      "Z01_MKT_501_MODEL_CODE",
      "Z01_MKT_501_PREFIX",
      "Z01_MKT_501_SUFFIX",
      "Z01_MKT_ABB_CLASS_CID",
      "Z01_MKT_ABB_CLASS_NAME",
      "Z01_MKT_AGENCY_LOGOS",
      "Z01_MKT_AMBIENT_TEMPERATURE",
      "Z01_MKT_AUX_BOX",
      "Z01_MKT_AUX_BOX_LEAD_TERMINATION",
      "Z01_MKT_BASE_INDICATOR",
      "Z01_MKT_BEARING_DE",
      "Z01_MKT_BEARING_GREASE_TYPE",
      "Z01_MKT_BEARING_ODE",
      "Z01_MKT_BLOWER",
      "Z01_MKT_BRAKE_INDICATOR",
      "Z01_MKT_BRG_RTD",
      "Z01_MKT_BRG_RTD_QTY",
      "Z01_MKT_BRAND",
      "Z01_MKT_CABLE_LENGTH",
      "Z01_MKT_CATALOG_NUMBER",
      "Z01_MKT_COMPLEXITY_LEVEL",
      "Z01_MKT_CONNECTION_DIAGRAM",
      "Z01_MKT_CURRENT_AT_VOLTAGE",
      "Z01_MKT_DATE",
      "Z01_MKT_DATA_SOURCE_RULE",
      "Z01_MKT_DESIGN_CODE",
      "Z01_MKT_DESCRIPTION",
      "Z01_MKT_DIMENSION_DRAWINGS",
      "Z01_MKT_DRIP_COVER",
      "Z01_MKT_DUTY",
      "Z01_MKT_EFFICIENCY_100_LOAD",
      "Z01_MKT_EFFICIENCY_COMPLIANCY",
      "Z01_MKT_EFFICIENCY_LEVEL",
      "Z01_MKT_ELEC_CONFIG",
      "Z01_MKT_ELEC_ISOLATED_BEARING",
      "Z01_MKT_ELEC_RATING",
      "Z01_MKT_ELEC_SPEC",
      "Z01_MKT_ELECT_RTNG_CURRENT",
      "Z01_MKT_ELECT_RTNG_FREQ",
      "Z01_MKT_ELECT_RTNG_OUTPUT",
      "Z01_MKT_ELECT_RTNG_RPM",
      "Z01_MKT_ELECT_RTNG_VOLTAGE",
      "Z01_MKT_ENCLOSURE",
      "Z01_MKT_ENCLOSURE_TYPE",
      "Z01_MKT_FEEDBACK_DEVICE",
      "Z01_MKT_FLA_HIGHVOLTAGE",
      "Z01_MKT_FRAME",
      "Z01_MKT_FRAME_FAMILY",
      "Z01_MKT_FRAME_MATERIAL",
      "Z01_MKT_FRAME_SIZE",
      "Z01_MKT_FRAME_SUFFIX",
      "Z01_MKT_FREQUENCY",
      "Z01_MKT_FREQUENCY_STR",
      "Z01_MKT_FRONT_FACE_CODE",
      "Z01_MKT_FRONT_SHAFT",
      "Z01_MKT_HEATER",
      "Z01_MKT_INVERTER_CODE",
      "Z01_MKT_INSULATION_CLASS",
      "Z01_MKT_KOBX_MATERIAL",
      "Z01_MKT_KVA_CODE",
      "Z01_MKT_LAST_UPDATE",
      "Z01_MKT_LETTER_TYPE",
      "Z01_MKT_LETTER_TYPE_CODE",
      "Z01_MKT_LIFTING_LUGS",
      "Z01_MKT_LOCKED_BEARING",
      "Z01_MKT_MATNR",
      "Z01_MKT_MECH_SPEC",
      "Z01_MKT_MODEL",
      "Z01_MKT_MOTOR_LEAD_EXIT",
      "Z01_MKT_MOTOR_LEAD_TERMINATION",
      "Z01_MKT_MOTOR_LEADS",
      "Z01_MKT_MOTOR_TYPE",
      "Z01_MKT_MOUNTING_ARRANGEMENT",
      "Z01_MKT_MOUNTING_ORIENT",
      "Z01_MKT_MTART",
      "Z01_MKT_MULT_SYM",
      "Z01_MKT_MVGR1",
      "Z01_MKT_MVGR2",
      "Z01_MKT_MVGR3",
      "Z01_MKT_MVGR4",
      "Z01_MKT_NAMEPLATE_AMPS",
      "Z01_MKT_NAMEPLATE_FREQUENCY",
      "Z01_MKT_NAMEPLATE_OUTPUT",
      "Z01_MKT_NAMEPLATE_SPEED",
      "Z01_MKT_NAMEPLATE_VOLTAGE",
      "Z01_MKT_NEMA_PLATFORM",
      "Z01_MKT_NRCAN_COMPLIANT",
      "Z01_MKT_NUMBER_POLES",
      "Z01_MKT_NUMBER_POLES_STR",
      "Z01_MKT_OBJCODE",
      "Z01_MKT_OUTPUT",
      "Z01_MKT_OUTPUT_AT_FREQUENCY",
      "Z01_MKT_OUTPUT_AT_SPEED",
      "Z01_MKT_OVERALL_LENGTH_C_DIM",
      "Z01_MKT_PACKING_CRATE_IND",
      "Z01_MKT_PHASE",
      "Z01_MKT_PLANT",
      "Z01_MKT_PLANT_LOCATION",
      "Z01_MKT_POWER_FACTOR",
      "Z01_MKT_POWER_TYPE",
      "Z01_MKT_PROD_FAMILY",
      "Z01_MKT_PROD_NET_WEIGHT",
      "Z01_MKT_PRODUCT_CATEGORY",
      "Z01_MKT_PRODUCT_FAMILY",
      "Z01_MKT_PRODUCT_GROUP_MONM",
      "Z01_MKT_PRODUCT_LINE",
      "Z01_MKT_PULLEY_END_BEARING_TYPE",
      "Z01_MKT_PULLEY_END_FACE_CODE",
      "Z01_MKT_PULLEY_SHAFT",
      "Z01_MKT_RODENT_SCREEN",
      "Z01_MKT_SALES_STATUS",
      "Z01_MKT_SERVICE_FACTOR",
      "Z01_MKT_SHAFT_DIAMETER",
      "Z01_MKT_SHAFT_EXTENSION_LOCATION",
      "Z01_MKT_SHAFT_FEEDBACK_IND",
      "Z01_MKT_SHAFT_GROUND",
      "Z01_MKT_SHAFT_MTL",
      "Z01_MKT_SHAFT_ROTATION",
      "Z01_MKT_SHAFT_SLINGER",
      "Z01_MKT_SPEED",
      "Z01_MKT_SPEED_AT_FREQUENCY",
      "Z01_MKT_SPEED_CODE",
      "Z01_MKT_SPECIFICATION_NUMBER",
      "Z01_MKT_SPECIAL_PAINT",
      "Z01_MKT_STARTING_METHOD",
      "Z01_MKT_STANDARD",
      "Z01_MKT_SYNCHRONOUS_SPEED",
      "Z01_MKT_SYNCHRONOUS_SPEED_AT_FREQ",
      "Z01_MKT_SYNCHRONOUS_SPEED_STR",
      "Z01_MKT_THERMAL_DEVICE_BEARING",
      "Z01_MKT_THERMAL_DEVICE_WINDING",
      "Z01_MKT_VISIBLE_501CATALOG",
      "Z01_MKT_VISIBLE_WEB",
      "Z01_MKT_VIBRATION_SENSOR",
      "Z01_MKT_VOLTAGE",
      "Z01_MKT_VOLTAGE_AT_FREQUENCY",
      "Z01_MKT_VOLTAGE_STR",
      "Z01_MKT_WDG_RTD_PRESENT",
      "Z01_MKT_WDG_RTD_QTY",
      "Z01_MKT_WDG_RTD_TYPE",
      "Z01_MKT_WDG_THRMST",
      "Z01_MKT_WDG_THRMST_CTCTS",
      "Z01_MKT_WDG_THRMCPL",
      "Z01_MKT_WDG_THRMSTR",
      "Z01_MKT_WINDING_THERMAL1",
      "Z01_MKT_WINDING_THERMAL2",
      "Z01_MKT_XP_CLASS_GROUP",
      "Z01_MKT_XP_CLII",
      "Z01_MKT_XP_CLI",
      "Z01_MKT_XP_DIVISION",
      "Z01_MKT_XP_GPA",
      "Z01_MKT_XP_GPB",
      "Z01_MKT_XP_GPC",
      "Z01_MKT_XP_GPD",
      "Z01_MKT_XP_GPE",
      "Z01_MKT_XP_GPF",
      "Z01_MKT_XP_GPG",
      "Z01_MKT_XP_IND",
      "ABP_ABBPRODFAM",
      "ABP_ACTUALRATIO",
      "ABP_AGMASIZE",
      "ABP_AMBIENTTEMPERATURE",
      "ABP_ANGULARMISALIGNMENT",
      "ABP_ATEXCERTIFICATION",
      "ABP_AXIALMISALIGNMENT",
      "ABP_BACKSTOPINCLUDED",
      "ABP_BASETOCENTERHEIGHT",
      "ABP_BASTOOUTCENHEI",
      "ABP_BEARING",
      "ABP_BEARINGFAMILY",
      "ABP_BEARINGNDE",
      "ABP_BEARINGSERIES",
      "ABP_BEARINGTYPE",
      "ABP_BELREIMAT",
      "ABP_BELTHEIGHT",
      "ABP_BELTLENGTH",
      "ABP_BELTTYPE",
      "ABP_BELTWIDTH",
      "ABP_BOLTCIRCLE",
      "ABP_BOLTSIZE",
      "ABP_BOLTTOBOLT",
      "ABP_BOLTWIDTH",
      "ABP_BOREDIAMETER",
      "ABP_BOREFIT",
      "ABP_BOREFITSTANDARD",
      "ABP_BORELENGTH",
      "ABP_BRAKEPRESENT",
      "ABP_BRANDLABEL",
      "ABP_BUSHINGSIZE",
      "ABP_BUSHINGTYPE",
      "ABP_CASESIZE",
      "ABP_CATALOGNUMBER",
      "ABP_CENTERDISTANCE",
      "ABP_CENTOENDOFSHADIS",
      "ABP_CERTIFICATIONAGENCY",
      "ABP_COUMARAVA",
      "ABP_COUMARAVATYP",
      "ABP_COUPLINGCOMPONENT",
      "ABP_COUPLINGSIZE",
      "ABP_COUPLINGSTYLE",
      "ABP_COUPLINGTYPE",
      "ABP_DIAMETER",
      "ABP_DIMENSIONDIAGRAM",
      "ABP_DISBETSHAEND",
      "ABP_DRIVEENDFLANGETYPE",
      "ABP_DSTR_FREQUENCY",
      "ABP_DSTR_OUTPUT",
      "ABP_DSTR_SSPEED",
      "ABP_DSTR_VOLTAGE",
      "ABP_DUTYTIME",
      "ABP_DYNAMICLOADCAPACITY",
      "ABP_EFFICIENCYLEVEL",
      "ABP_ELECTRICALDATA1",
      "ABP_ELECTRICALDATA2",
      "ABP_ELECTRICALDATA3",
      "ABP_ELECTRICALDATA4",
      "ABP_ELECTRICALDATA5",
      "ABP_ELECTRICALDATA6",
      "ABP_ELECTRICALDATA7",
      "ABP_ELECTRICALDATA8",
      "ABP_ELEMENTMATERIAL",
      "ABP_ENCLOSURETYPE",
      "ABP_ETIM7",
      "ABP_EXPANSIONCAPABILITY",
      "ABP_EXPLOSIONPROTECTION",
      "ABP_EXPPROGROCLA",
      "ABP_FITCLASS",
      "ABP_FLANGEMATERIAL",
      "ABP_FRAMEMATERIAL",
      "ABP_FRAMESIZE",
      "ABP_FREQUENCY",
      "ABP_GEARBOXCOMPONENTTYPE",
      "ABP_GREASENAME",
      "ABP_HIGHTEMPERATUREFLAG",
      "ABP_HORPER100RAT",
      "ABP_HORSEPOWERRATING",
      "ABP_HOUDIMSTA",
      "ABP_HOUSINGCONSTRUCTION",
      "ABP_HOUSINGMATERIAL",
      "ABP_HOUSINGTYPE",
      "ABP_HUBMATERIAL",
      "ABP_IDEGRACATCOD",
      "ABP_INPUTPOWEROPTION",
      "ABP_INPUTSTYLE",
      "ABP_INSERTMATERIAL",
      "ABP_INSERTOUTERDIAMETER",
      "ABP_INSTALLATIONTORQUE",
      "ABP_INSULATIONCLASS",
      "ABP_INTEGRALKEY",
      "ABP_IPCLASS",
      "ABP_KEYWAYSIZE",
      "ABP_LUBRICATION",
      "ABP_MAXIMUMSPEED",
      "ABP_MILLMOTORSIZE",
      "ABP_MOTORBASETYPE",
      "ABP_MOTORFRAMEPREFIX",
      "ABP_MOTORFRAMESIZE",
      "ABP_MOTORFRAMESUFFIX",
      "ABP_MOUNTINGBOLTPATTERN",
      "ABP_MOUNTINGORIENTATION",
      "ABP_MOUNTINGPOSITION",
      "ABP_MOUNTINGTYPE",
      "ABP_NEMADESIGNCODE",
      "ABP_NOMINALRATIO",
      "ABP_NUMBEROFBANDS",
      "ABP_NUMBEROFBOLTS",
      "ABP_NUMBEROFPHASES",
      "ABP_NUMBEROFPOLES",
      "ABP_NUMBEROFSPEEDS",
      "ABP_OFFERING_TREE_LEAF_NODES",
      "ABP_OILRESISTANCE",
      "ABP_OMS_PUBLISHER",
      "ABP_OPPDRIENDFLATYP",
      "ABP_OUSHCETOINMOMOFADI",
      "ABP_OUTPUT",
      "ABP_OUTSIDEDIAMETER",
      "ABP_OUTPUTPOWER",
      "ABP_OVERHUNGLOAD",
      "ABP_PAINTTYPE",
      "ABP_PARALLELMISALIGNMENT",
      "ABP_PILOTDEPTH",
      "ABP_PILOTDIAMETER",
      "ABP_POLESHIGH",
      "ABP_POWERSUPPLYINCLUDED",
      "ABP_PRODUCTCOMPATIBILITY",
      "ABP_PRODUCTIMAGE",
      "ABP_PRODUCTLINE",
      "ABP_PRODUCTMATRIX1",
      "ABP_PRODUCTMATRIX2",
      "ABP_PRODUCTMATRIX3",
      "ABP_PRODUCTMATRIX4",
      "ABP_PRODUCTNAME",
      "ABP_PRODUCTNETDEPTH",
      "ABP_PRODUCTNETHEIGHT",
      "ABP_PRODUCTNETWIDTH",
      "ABP_PRODUCTTYPE",
      "ABP_RATEDTORQUESTR",
      "ABP_REDUCTIONTYPE",
      "ABP_RELUBRICATABLE",
      "ABP_SCRCONCOM",
      "ABP_SEALINGTYPE",
      "ABP_SENSORREADY",
      "ABP_SERVICEFACTOR",
      "ABP_SETUPREQUIREMENTS",
      "ABP_SHAFTATTACHMENT",
      "ABP_SHAFTDIAMETER",
      "ABP_SHAFTLENGTH",
      "ABP_SHAFTSPACING",
      "ABP_SHEAVEDIAMETER",
      "ABP_STANDARDS",
      "ABP_STANDOFFINCLUDED",
      "ABP_STARTINGOFMOTOR",
      "ABP_STATICCONDUCTIVE",
      "ABP_STATICLOADCAPACITY",
      "ABP_SUIFORHIGTEMAPP",
      "ABP_SUIFORWASENV",
      "ABP_SYNBELTOOPRO",
      "ABP_SYNCHRONOUSBELTPITCH",
      "ABP_SYNCHRONOUSSPEED",
      "ABP_TAKEUPFRAMESIZE",
      "ABP_TEMPERATURECLASS",
      "ABP_TEMPERATURERANGE",
      "ABP_TEMPERATURERATING",
      "ABP_THEHORRAT",
      "ABP_THREADSIZE",
      "ABP_THREADSTANDARD",
      "ABP_TIGHTENINGTORQUE",
      "ABP_TORSIONALSTIFFNESS",
      "ABP_TYPEOFDUTY",
      "ABP_UNSPSC",
      "ABP_VBELTCONSTRUCTION",
      "ABP_VBELTDESIGN",
      "ABP_VBELTPROFILES",
      "ABP_VBELTSIDES",
      "ABP_VOLTAGERATING",
      "ABP_WRENCHSIZE"
  ];
</script>

<div class="page claude-ui" class:dark>
  {#if activeIssueType === 'Data Validation'}
    <div class="window" class:content-enter={activeIssueType}>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="title claude-title">Data Validation</div>

      <div style="display:flex; gap:8px; align-items:center;">
        <button type="button" on:click={goBackToIssueSelect}>Back</button>
        <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
          <span class:active={dark}></span>
        </button>
      </div>
    </div>

    <form class="pane" on:submit|preventDefault={submitForm}>

        <!-- REQUEST DETAILS -->
        <section>
        <h2 class="claude-heading">Request Details</h2>

        <div class="field">
          <label for="email-input">Email</label>
          <div class="subtext claude-body">Please enter your email.</div>
          <input id="email-input" type="email" bind:value={email} class:error={fieldErrors.email} />
          {#if fieldErrors.email}<div class="error">{fieldErrors.email}</div>{/if}
        </div>

        <div class="field">
          <label for="functional-area">Functional Area</label>
          <div class="subtext claude-body">Please enter your functional area.</div>
          <input id="functional-area" bind:value={functionalArea} />
        </div>

        <div class="field">
          <label for="description-input">Description</label>
          <div class="subtext claude-body">
            Please enter a brief description of your issue.
          </div>
          <textarea id="description-input" rows="3" bind:value={description} class:error={fieldErrors.description}></textarea>
          {#if fieldErrors.description}<div class="error">{fieldErrors.description}</div>{/if}
        </div>
      </section>

      <div class="divider"></div>

      <!-- VALIDATION RULE -->
      <section>
        <h2 class="claude-heading">Validation Rule</h2>

        <div class="field">
          <label for="column-input">Column</label>
          <div class="subtext claude-body">
            Please choose/select the column(s) you want to be validated.
          </div>

          <div class="combo">
            <input
              id="column-input"
              type="text"
              bind:value={columnSearch}
              placeholder="Start typing..."
              class:error={fieldErrors.columns}
              on:focus={() => (showColumnList = true)}
              on:blur={() => setTimeout(() => showColumnList = false, 120)}
            />

            {#if columns.length}
              <div class="chips">
                {#each columns as col}
                  <span class="chip">
                    {col}
                    <button type="button" aria-label={`Remove ${col}`} on:click={() => removeColumn(col)}>×</button>
                  </span>
                {/each}
              </div>
            {/if}

            {#if showColumnList}
              <div class="combo-list">
                {#if filteredColumns.length === 0}
                  <div class="combo-empty">No matches</div>
                {:else}
                  {#each filteredColumns as opt}
                    <button type="button" on:click={() => addColumn(opt)}>
                      {opt}
                    </button>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>

          {#if fieldErrors.columns}<div class="error">{fieldErrors.columns}</div>{/if}
        </div>

          <div class="field">
            <label for="expected-value-input">Expected Value</label>
            <div class="subtext claude-body">
              Please enter the expected value of the column(s) being validated.
            If there is more than one column selected, enter them comma-delimited
            (ex: 1, 2, 3).
            </div>
            <input id="expected-value-input" bind:value={expectedValue} class:error={fieldErrors.expectedValue} />
            {#if fieldErrors.expectedValue}<div class="error">{fieldErrors.expectedValue}</div>{/if}
          </div>
        </section>

        <div class="divider"></div>

        <!-- PLATFORM INPUT -->
        <section>
          <h2 class="claude-heading">Platform Input</h2>
          <div class="field">
            <div class="subtext claude-body">Select all platforms involved in this request.</div>
            <div class="checkbox-grid">
              {#each PLATFORM_OPTIONS as option}
                <label class="checkbox-card">
                  <input type="checkbox" value={option} bind:group={platformSelections} />
                  <span>{option}</span>
                </label>
              {/each}
            </div>
          </div>
        </section>

        <div class="divider"></div>

        <!-- DATA FILTERS -->
        <section>
          <h2 class="claude-heading">Data Filters</h2>
          <div class="field">
            <div class="subtext claude-body">
              Build one or more filters to refine the validation set.
            </div>

            <div class="filters">
              {#each filterRows as filter, index}
                <div class="filter-row">
                  <div class="combo">
                    <input
                      type="text"
                      placeholder="Select column"
                      bind:value={filter.search}
                      on:focus={() => updateFilter(index, 'showList', true)}
                      on:input={(e) => setFilterSearch(index, e.target.value)}
                      on:blur={() => setTimeout(() => updateFilter(index, 'showList', false), 120)}
                      aria-label="Filter column search"
                    />

                    {#if filter.showList}
                      <div class="combo-list">
                        {#if getFilteredColumns(filter.search).length === 0}
                          <div class="combo-empty">No matches</div>
                        {:else}
                          {#each getFilteredColumns(filter.search) as opt}
                            <button type="button" on:click={() => selectFilterColumn(index, opt)}>
                              {opt}
                            </button>
                          {/each}
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <select
                    bind:value={filter.operator}
                    on:change={(e) => updateFilter(index, 'operator', e.target.value)}
                    aria-label="Filter operator"
                  >
                    {#each OPERATORS as op}
                      <option value={op}>{op}</option>
                    {/each}
                  </select>

                  <input
                    type="text"
                    placeholder="Value"
                    bind:value={filter.value}
                    on:input={(e) => updateFilter(index, 'value', e.target.value)}
                  />

                  {#if filterRows.length > 1}
                    <button type="button" on:click={() => removeFilter(index)}>
                      Remove
                    </button>
                  {/if}
                </div>
              {/each}

              <div class="filter-actions">
                <button type="button" on:click={addFilter}>
                  Add another filter
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer>
        {#if success}<span class="success">Submitted</span>{/if}
        <button disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</button>
      </footer>
    </form>
  </div>

  <button class="debug-button" on:click={showDebugPayload}>Show Payload</button>

  {#if showModal}
    <div
      class="modal-backdrop"
      class:closing={closingModal}
      role="button"
      tabindex="0"
      aria-label="Close dialog"
      on:click={closeModal}
      on:keydown={(e) => e.key === 'Escape' && closeModal()}
    >
      <div
        class="modal"
        class:closing={closingModal}
        role="dialog"
        aria-modal="true"
        aria-label={modalVariant === 'info' ? 'Payload' : 'Message'}
        tabindex="-1"
        on:click|stopPropagation
        on:keydown={(e) => e.key === 'Escape' && closeModal()}
      >
        
        {#if modalVariant === 'info'}
          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Payload</span>
              <span class="code-meta">JSON | {modalPayloadLines.length} lines</span>
            </div>
            <div class="code-body" role="presentation">
              {#each modalPayloadLines as line}
                <div class="code-line">
                  <span class="code-number">{line.number}</span>
                  <span class="code-text">{@html line.line}</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="modal-message">{modalMessage}</div>
        {/if}

        <div class="modal-actions">
          <button class="modal-close" on:click={closeModal}>OK</button>
        </div>
      </div>
    </div>
  {/if}
  {:else}
    <div class="issue-placeholder"></div>
  {/if}

  {#if showIssueModal}
    <div
      class="issue-backdrop"
      class:closing={closingIssueModal}
      class:selection-pulse={selectionPulse}
    >
      {#if issuePreviewSrc || previewFading}
        <div class="issue-preview" class:fading={previewFading} aria-hidden="true">
          {#if issuePreviewSrc}
            <iframe title="Issue Form Preview" src={issuePreviewSrc} tabindex="-1"></iframe>
          {/if}
        </div>
      {/if}

      <div class="issue-modal" class:closing={closingIssueModal}>
        <div class="issue-modal-header">
          <h2>What's your issue?</h2>
          <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
            <span class:active={dark}></span>
          </button>
        </div>
        <div class="issue-field">
          <select
            bind:value={issueTypeDraft}
            on:change={(e) => {
              const next = e?.currentTarget?.value;
              triggerSelectionTransition();
              syncIssuePreview(next);
            }}
          >
            <option value="">Select one</option>
            {#each ISSUE_OPTIONS as opt}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
          {#if issueModalError}<div class="error">{issueModalError}</div>{/if}
        </div>
        <div class="issue-actions">
          <button on:click={confirmIssueType}>Continue</button>
        </div>
      </div>
    </div>
  {/if}
</div>
