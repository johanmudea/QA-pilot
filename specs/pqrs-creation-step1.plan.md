# PQRS Creation - Step 1 (Tipo de novedad) - HU-89951

## Application Overview

**Module:** Evaluación de Proveedores | **Feature:** PQRS Creation - Step 1 (Tipo de novedad) | **Reference:** Azure DevOps HU-89951

**IMPORTANT - Blocker found during exploration (must be resolved before this plan can be executed):**
During this session, login was attempted 4 times against `https://d158dwm5s9evi1.cloudfront.net/auth/sign-in` with the provided credentials (jmuneton@summa-sci.com). Every attempt failed identically: the browser's invisible reCAPTCHA resolved and enabled the "Iniciar Sesión" button, but the subsequent `POST https://npr7pcxprj.execute-api.us-east-1.amazonaws.com/auth` request failed at the network layer with `net::ERR_FAILED`, and the console reported: "Access to fetch at '.../auth' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource." This was reproducible across a full page reload and repeated submissions, so it does not appear to be a transient flake. As a result, the authenticated area, the "Evaluación de Proveedores" module, and the actual PQRS creation Step 1 screen could NOT be reached or visually verified in this session.

Because live verification was blocked, the scenarios below are built directly from the already-known/documented acceptance criteria in `features/pqrs-creation-step1.feature` (HU-89951), per instructions not to invent new requirements. No new requirements were added; no attempt was made to guess at the real DOM/selectors of the Step 1 screen since they could not be observed. **Before running/automating this plan, first resolve or re-verify the login/CORS blocker** (it may be an environment-specific network restriction rather than a genuine product bug — this should be confirmed by re-testing from a standard browser and/or checking API Gateway CORS configuration for the `/auth` route), then re-run an exploratory pass to confirm actual selectors and behavior match what's written here.

**Assumed application flow (from task instructions, unconfirmed due to the blocker):** Sign in → locate "Evaluación de Proveedores" module → locate the "create new PQRS" entry point → land on PQRS creation Step 1 ("Tipo de novedad").

**Scope:** Exactly the 9 already-known acceptance criteria for Step 1, at the same granularity as the existing Gherkin feature file (title+message; 4-step stepper with active/pending states; "Configuración inicial" section + help text; Compañía/Sociedad field; 2 dropdown options tested individually — Reclamo and Felicitación; single-select behavior; Continuar button visibility; successful navigation to Step 2 on valid selection; validation error when continuing without a selection). Steps 2-4 of the wizard (Información básica, Detalles, Revisión) and any other module functionality are explicitly out of scope.

## Test Scenarios

### 1. PQRS Creation - Step 1 (Tipo de novedad)

**Seed:** `drafts/seed-summa.spec.ts`

#### 1.1. Step 1 screen displays the title and descriptive help message

**File:** `tests/pqrs-creation-step1/title-and-message.spec.ts`

**Steps:**
  1. Navigate to the Snetwork sign-in page (blank/fresh state, not previously authenticated)
    - expect: The sign-in form (Correo Electrónico / Contraseña) is displayed
  2. Enter email 'jmuneton@summa-sci.com' and password 'Banano.141996' in the login form, then submit
    - expect: The user is authenticated and redirected into the application
  3. Navigate to the 'Evaluación de Proveedores' (Supplier Evaluation) module
    - expect: The module home/dashboard is displayed
  4. Locate and activate the entry point to create a new PQRS
    - expect: The PQRS creation Step 1 screen ('Tipo de novedad') is displayed
  5. Observe the top of the Step 1 screen
    - expect: The title 'Creación PQRS' is displayed
    - expect: A descriptive help message is displayed, matching the wording 'En este espacio podrás crear tus PQRS...' (or the closest current copy)

#### 1.2. Step navigation shows all four steps with the current step highlighted

**File:** `tests/pqrs-creation-step1/stepper-four-steps.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Inspect the step navigation component at the top of the Step 1 screen
    - expect: Exactly four steps are shown, in this order: 'Configuración', 'Información básica', 'Detalles', 'Revisión'
    - expect: 'Configuración' is visually highlighted/marked as the current active step
    - expect: 'Información básica', 'Detalles' and 'Revisión' are visually shown as pending/not-yet-reached (not active, not completed)

#### 1.3. Initial configuration section and its help message are displayed

**File:** `tests/pqrs-creation-step1/config-section.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Inspect the body of the Step 1 screen
    - expect: A section titled 'Configuración inicial' is displayed
    - expect: An accompanying help/descriptive message for this section is displayed

#### 1.4. Compañía / Sociedad field is displayed

**File:** `tests/pqrs-creation-step1/company-field.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Inspect the 'Configuración inicial' section
    - expect: A 'Compañía / Sociedad' field is visible on the form

#### 1.5. Tipo de novedad dropdown contains the option 'Reclamo'

**File:** `tests/pqrs-creation-step1/dropdown-option-reclamo.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Locate the 'Tipo de novedad' field
    - expect: The field is marked as required (e.g. asterisk or equivalent required indicator)
    - expect: The field is rendered as a dropdown/select control
  4. Open the dropdown
    - expect: The option 'Reclamo' is present in the list

#### 1.6. Tipo de novedad dropdown contains the option 'Felicitación' and no other options

**File:** `tests/pqrs-creation-step1/dropdown-option-felicitacion.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Locate the 'Tipo de novedad' field and open the dropdown
    - expect: The option 'Felicitación' is present in the list
  4. Count the total number of selectable options in the dropdown
    - expect: Exactly two options exist in total: 'Reclamo' and 'Felicitación' (no additional options)

#### 1.7. Only one Tipo de novedad option can be selected at a time

**File:** `tests/pqrs-creation-step1/single-select-behavior.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. In the 'Tipo de novedad' dropdown, select 'Reclamo'
    - expect: 'Reclamo' becomes the selected value
  4. Without navigating away, open the dropdown again and select 'Felicitación'
    - expect: 'Felicitación' becomes the selected value
    - expect: 'Reclamo' is no longer selected (only one option is selected at any time; the control does not behave as a multi-select)

#### 1.8. Continuar button is visible

**File:** `tests/pqrs-creation-step1/continue-button-visible.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Scroll to the bottom of the Step 1 form
    - expect: A 'Continuar' button is visible

#### 1.9. Selecting a valid Tipo de novedad and clicking Continuar advances to Step 2

**File:** `tests/pqrs-creation-step1/continue-with-valid-selection.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed
  3. Select 'Reclamo' in the 'Tipo de novedad' dropdown (and fill any other field required to enable Continuar, e.g. Compañía / Sociedad, if the form requires it)
    - expect: 'Reclamo' is shown as the selected value
  4. Click the 'Continuar' button
    - expect: The wizard advances to Step 2 ('Información básica')
    - expect: The step navigation now shows 'Información básica' as the active/current step and 'Configuración' as completed

#### 1.10. Clicking Continuar without selecting a Tipo de novedad shows a validation error

**File:** `tests/pqrs-creation-step1/continue-without-selection-validation.spec.ts`

**Steps:**
  1. Sign in with jmuneton@summa-sci.com / Banano.141996
    - expect: The user is authenticated and redirected into the application
  2. Navigate to the 'Evaluación de Proveedores' module and open the PQRS creation flow to reach Step 1
    - expect: The PQRS creation Step 1 screen is displayed with no 'Tipo de novedad' value pre-selected
  3. Without selecting any value in the 'Tipo de novedad' field, click the 'Continuar' button
    - expect: A validation/error message is displayed indicating the field is required
    - expect: The user remains on Step 1 ('Configuración') — the wizard does not advance to 'Información básica'
