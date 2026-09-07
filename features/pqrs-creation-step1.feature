# language: es
# HU-89951: Implementación paso 1 en la creación de PQRS SP1
Característica: Creación de PQRS - Paso 1 (Tipo de novedad)

  Como usuario del módulo de Evaluación de Proveedores
  Quiero seleccionar el tipo de PQRS que deseo crear
  Para iniciar el proceso de creación de forma guiada y estructurada

  Antecedentes:
    Dado que el usuario está en la pantalla del paso 1 de creación de PQRS

  @hu:89951 @regression @smoke @testcase:91410
  Escenario: CP_01 - TC91410 - La pantalla del paso 1 muestra el título y el mensaje descriptivo
    Entonces el título "Creación PQRS" debe estar visible
    Y el mensaje descriptivo de ayuda debe estar visible

  @hu:89951 @regression @testcase:91411
  Escenario: CP_02 - TC91411 - La navegación por pasos muestra los cuatro pasos con el paso actual resaltado
    Entonces la navegación por pasos debe mostrar en orden "Configuración", "Información básica", "Detalles" y "Revisión"
    Y el paso "Configuración" debe estar resaltado como paso activo
    Y los pasos "Información básica", "Detalles" y "Revisión" deben mostrarse como pendientes

  @hu:89951 @regression @testcase:91412
  Escenario: CP_03 - TC91412 - Se muestra la sección de configuración inicial y su mensaje de ayuda
    Entonces la sección "Configuración inicial" debe estar visible
    Y el mensaje de ayuda debe estar visible

  @hu:89951 @regression @testcase:91413
  Escenario: CP_04 - TC91413 - Se muestra el campo Compañía / Sociedad
    Entonces el campo "Compañía / Sociedad" debe estar visible

  @hu:89951 @regression @critical @testcase:91414
  Escenario: CP_05 - TC91414 - El campo Tipo de novedad contiene la opción Reclamo
    Entonces el campo "Tipo de novedad" debe ser una lista desplegable obligatoria
    Y el campo "Tipo de novedad" debe contener la opción "Reclamo"

  @hu:89951 @regression @critical @testcase:91415
  Escenario: CP_06 - TC91415 - El campo Tipo de novedad contiene la opción Felicitación y ninguna otra
    Entonces el campo "Tipo de novedad" debe contener la opción "Felicitación"
    Y el campo "Tipo de novedad" debe contener exactamente 2 opciones

  @hu:89951 @regression @testcase:91416
  Escenario: CP_07 - TC91416 - Solo se puede seleccionar una opción de Tipo de novedad a la vez
    Cuando el usuario selecciona "Reclamo" como tipo de novedad
    Y el usuario selecciona "Felicitación" como tipo de novedad
    Entonces únicamente "Felicitación" debe permanecer seleccionada

  @hu:89951 @regression @smoke @testcase:91417
  Escenario: CP_08 - TC91417 - El botón Continuar está visible
    Entonces el botón "Continuar" debe estar visible

  @hu:89951 @regression @critical @testcase:91418
  Escenario: CP_09 - TC91418 - Al seleccionar un tipo de novedad válido y continuar se avanza al paso 2
    Cuando el usuario selecciona "Reclamo" como tipo de novedad
    Y el usuario hace clic en "Continuar"
    Entonces el usuario debe ser dirigido al paso 2 "Información básica"

  @hu:89951 @regression @critical @testcase:91419
  Escenario: CP_10 - TC91419 - Continuar sin seleccionar un tipo de novedad muestra un error de validación
    Cuando el usuario hace clic en "Continuar" sin seleccionar un tipo de novedad
    Entonces debe mostrarse un mensaje de validación
    Y el usuario debe permanecer en el paso 1
