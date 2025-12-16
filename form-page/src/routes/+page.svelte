<script>
  import { onMount } from 'svelte';
  import { SpeedInsights } from "@vercel/speed-insights/next"

  let email = '';
  let functionalArea = '';
  let description = '';
  let column = '';
  let columnSearch = '';
  let showColumnList = false;
  let expectedValue = '';
  let dataFilters = '';

  let loading = false;
  let success = false;
  let error = '';
  let fieldErrors = {};
  let showModal = false;
  let modalMessage = '';
  let modalVariant = 'success';
  let closingModal = false;

  let dark = true;

  $: filteredColumns = COLUMN_OPTIONS.filter((opt) =>
    opt.toLowerCase().includes(columnSearch.toLowerCase())
  );

  function toggleDark() {
    dark = !dark;
    localStorage.setItem('dv-dark', dark);
  }

  function validate() {
    const problems = {};
    if (!email.trim()) problems.email = 'Email is required';
    if (!description.trim()) problems.description = 'Description is required';
    if (!column.trim()) problems.column = 'Column is required';
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

  async function submitForm() {
    if (loading) return;
    loading = true;
    success = false;
    error = '';

    if (!validate()) {
      loading = false;
      return;
    }

    await new Promise(r => setTimeout(r, 800));
    success = true;
    loading = false;
    modalMessage = 'Your validation request has been sent.';
    modalVariant = 'success';
    closingModal = false;
    showModal = true;
  }

  onMount(() => {
    const saved = localStorage.getItem('dv-dark');
    dark = saved !== null ? saved === 'true' : true;
    localStorage.setItem('dv-dark', dark);
  });

  const buildPayload = () => ({
    email,
    functional_area: functionalArea,
    description,
    target_column: column,
    expected_value: expectedValue,
    data_filters: dataFilters
  });

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

   const COLUMN_OPTIONS = [
   "MATERIAL_NUMBER",
      "SALES_ORGANIZATION",
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
  <div class="window">

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="title claude-title">Data Validation</div>

      <button class="dark-toggle" on:click={toggleDark} aria-label="Toggle theme">
        <span class:active={dark}></span>
      </button>
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
              class:error={fieldErrors.column}
              on:focus={() => (showColumnList = true)}
              on:blur={() => setTimeout(() => showColumnList = false, 120)}
            />

            {#if showColumnList}
              <div class="combo-list">
                {#if filteredColumns.length === 0}
                  <div class="combo-empty">No matches</div>
                {:else}
                  {#each filteredColumns as opt}
                    <button type="button" on:click={() => (column = columnSearch = opt)}>
                      {opt}
                    </button>
                  {/each}
                {/if}
              </div>
            {/if}
          </div>

          {#if fieldErrors.column}<div class="error">{fieldErrors.column}</div>{/if}
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

        <div class="field">
          <label for="data-filters-input">Data Filters</label>
          <div class="subtext claude-body">
            Please enter any filters that are required.
            Ex: Sales Org = "BEC" and Plant = "00A"
          </div>
          <textarea id="data-filters-input" rows="2" bind:value={dataFilters}></textarea>
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
</div>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* REMOVE WHITE OUTLINE */
:global(html),
:global(body) {
  margin: 0;
  padding: 0;
  background: #0f0f10;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* BASE */
* { box-sizing: border-box; }

.page {
  --bg: #fafafa;
  --window: #ffffff;
  --field: #ffffff;
  --border: #e5e7eb;
  --text: #111827;
  --muted: #6b7280;
  --accent: #111827;
  --soft: rgba(17,24,39,.08);
  --code-bg: #0d1117;
  --code-border: #1f2937;
  --code-number: #6b7280;
  --code-text: #e5e7eb;
  --dropdown: #f8fafc;
  --dropdown-text: var(--text);
  --claude-accent: #e07a5f;
  --toggle-track: rgba(224,122,95,0.2);
  --toggle-track-active: rgba(224,122,95,0.32);
  --toggle-knob-active: #e07a5f;

  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  font-family: Inter, system-ui, sans-serif;
  color: var(--text);

  transition: background 0.6s ease, color 0.6s ease;
}

.page.dark {
  --bg: #0f0f10;
  --window: #161618;
  --field: #1c1c1f;
  --border: #2a2a2e;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --accent: #e5e7eb;
  --soft: rgba(255,255,255,.08);
  --code-bg: #0b1224;
  --code-border: #253049;
  --code-number: #9ca3af;
  --code-text: #f3f4f6;
  --dropdown: #1f2733;
  --dropdown-text: #ffffff;
  --claude-accent: #e07a5f;
  --toggle-track: rgba(224,122,95,0.28);
  --toggle-track-active: rgba(224,122,95,0.36);
  --toggle-knob-active: #e07a5f;
}

/* WINDOW */
.window {
  width: 720px;
  background: var(--window);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0,0,0,.12);
  transition: background 0.6s ease, border-color 0.6s ease;
}

/* TOOLBAR */
.toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
  transition: border-color 0.6s ease;
}

.title {
  font-size: 14px;
  font-weight: 600;
}

/* TOGGLE */
.dark-toggle {
  width: 42px;
  height: 22px;
  border-radius: 999px;
  border: none;
  background: var(--toggle-track);
  padding: 2px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.dark-toggle span {
  display: block;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.4s ease, background 0.4s ease;
}

.dark-toggle span.active {
  transform: translateX(20px);
  background: var(--toggle-knob-active);
}

/* CONTENT */
.pane { padding: 5px 24px 24px; }

section h2 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.field { margin-bottom: 16px; }

label {
  font-size: 13px;
  font-weight: 500;
  color: var(--claude-accent);
}

.subtext {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 6px;
}

/* INPUTS */
input,
textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--field);
  color: var(--text);
  font-family: inherit;
  transition: background 0.6s ease, color 0.6s ease, border-color 0.6s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--soft);
}

/* DIVIDER */
.divider {
  height: 1px;
  background: var(--border);
  margin: 24px 0;
  transition: background 0.6s ease;
}

/* COMBO */
.combo { position: relative; }

.combo-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--dropdown);
  border: 1px solid var(--border);
  border-radius: 10px;
  max-height: 240px;
  overflow: auto;
  box-shadow: 0 14px 32px rgba(0,0,0,.22);
}

.combo-list button {
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  color: var(--text);
  text-align: left;
  font-family: inherit;
}

.combo-list button:hover {
  background: var(--soft);
}

.combo-empty {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--muted);
}

/* FOOTER */
footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

button {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--claude-accent);
  background: var(--claude-accent);
  color: #fff;
  font-weight: 500;
  font-family: inherit;
  transition: background-color 0.6s ease, color 0.6s ease, border-color 0.6s ease;
}

.page.dark button {
  color: #000;
}

/* Ensure dropdown buttons keep dropdown text color after global button styles */
.combo-list button {
  color: var(--dropdown-text);
}

.page.dark .combo-list button {
  color: var(--dropdown-text);
}

.success {
  display: inline-block;
  padding: 8px 8px;
  border-radius: 950px;
  background: rgba(22,163,74,0.12);
  color: #16a34a;
  font-weight: 600;
  font-size: 12px;
  border: 1px solid rgba(22,163,74,0.4);
}
.error { color: #dc2626; font-size: 12px; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: grid;
  place-items: center;
  backdrop-filter: blur(10px);
  animation: fadeIn 160ms ease-out;
}

.modal-backdrop.closing {
  animation: fadeOut 140ms ease-in forwards;
}

.modal {
  background: var(--window);
  border: 1px solid var(--border);
  padding: 16px;
  border-radius: 12px;
  max-width: 520px;
  font-family: inherit;
  animation: popIn 200ms ease-out;
}

.modal.closing {
  animation: popOut 140ms ease-in forwards;
}

.modal-close {
  margin-top: 12px;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.modal-message {
  padding: 12px 10px;
  color: var(--text);
  font-family: inherit;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes popOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

/* DEBUG */
.debug-button {
  position: fixed;
  bottom: 18px;
  right: 18px;
}

/* CODE VIEWER */
.code-block {
  background: var(--window);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.01em;
}

.code-body {
  background: var(--code-bg);
  color: var(--code-text);
  font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace;
  padding: 12px 0;
  max-height: 360px;
  overflow: auto;
}

.code-line {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 10px;
  padding: 0 14px;
}

.code-number {
  color: var(--code-number);
  text-align: right;
  padding-right: 8px;
  user-select: none;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.code-text {
  white-space: pre;
}

:global(.code-key) { color: #93c5fd; }
:global(.code-string) { color: #a7f3d0; }
:global(.code-number-value) { color: #f9a8d4; }
:global(.code-boolean) { color: #fcd34d; }
:global(.code-null) { color: #c084fc; }

/* Claude-like typography using Inter */
.claude-ui {
  font-family: Inter, system-ui, sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.claude-title {
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: 1.15;
}

.claude-heading {
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.claude-body {
  font-weight: 400;
  letter-spacing: -0.005em;
  line-height: 1.45;
}

</style>
