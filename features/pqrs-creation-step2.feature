# language: es
# HU-90029: Implementar paso 2 "Información básica" en el flujo de PQRS SP1
Característica: Creación de PQRS - Paso 2 (Información básica)

  Como usuario del módulo de Evaluación de Proveedores
  Quiero diligenciar la información del proveedor y del reclamo
  Para identificar adecuadamente el requerimiento antes de continuar

  Antecedentes:
    Dado que el usuario está en la pantalla del paso 2 de creación de PQRS para un Reclamo

  @hu:90029 @regression @smoke @testcase:91455
  Escenario: CP_01 - TC91455 - El paso 2 se muestra como paso activo en el componente de pasos
    Entonces la navegación por pasos debe mostrar "Configuración", "Información básica", "Detalles" y "Revisión"
    Y el paso "Información básica" debe estar resaltado como paso activo

  @hu:90029 @regression @critical @testcase:91456
  Escenario: CP_02 - TC91456 - Seleccionar Solucionado deshabilita el campo Usuario responsable
    Cuando el usuario selecciona "Solucionado" como estado de atención del reclamo
    Entonces el campo "Usuario responsable" debe deshabilitarse
    Y debe mostrarse el mensaje "El reclamo ya se encuentra solucionado, no requiere asignación"

  @hu:90029 @regression @critical @testcase:91457
  Escenario: CP_03 - TC91457 - Seleccionar No solucionado habilita el campo Usuario responsable
    Cuando el usuario selecciona "No solucionado" como estado de atención del reclamo
    Entonces el campo "Usuario responsable" debe habilitarse
    Y debe mostrarse el mensaje "Selecciona el usuario responsable de la gestión del reclamo"

  @hu:90029 @regression @testcase:91458
  Escenario: CP_04 - TC91458 - Descripción del reclamo muestra un contador de caracteres hasta el límite
    Cuando el usuario escribe texto en "Descripción del reclamo"
    Entonces debe mostrarse un contador de caracteres reflejando el límite de 1000 caracteres

  @hu:90029 @regression @critical @testcase:91459
  Escenario: CP_05 - TC91459 - Continuar se bloquea hasta completar todos los campos obligatorios
    Cuando el usuario hace clic en "Continuar" sin completar los campos obligatorios
    Entonces deben mostrarse mensajes de validación para los campos obligatorios faltantes
    Y el usuario debe permanecer en el paso 2

  @hu:90029 @regression @critical @testcase:91460
  Escenario: CP_06 - TC91460 - Completar todos los campos obligatorios y continuar avanza al paso 3
    Cuando el usuario completa todos los campos obligatorios del paso 2
    Y el usuario hace clic en "Continuar"
    Entonces el usuario debe ser dirigido al paso 3 "Detalles"

  @hu:90029 @regression @testcase:91461
  Escenario: CP_07 - TC91461 - Volver regresa al paso 1 conservando los datos previamente ingresados
    Cuando el usuario hace clic en "Volver"
    Entonces el usuario debe ser dirigido de nuevo al paso 1
    Y la información previamente ingresada debe conservarse
