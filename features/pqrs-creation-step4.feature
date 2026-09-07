# language: es
# HU-91159: Implementar Paso 4 "Revisión y Confirmación" en el flujo de creación de PQRS tipo Reclamo SP2
Característica: Creación de PQRS - Paso 4 (Resumen) para Reclamo

  Como usuario del módulo de Evaluación de Proveedores
  Quiero un paso final de revisión antes de enviar el reclamo
  Para verificar que toda la información sea correcta antes de enviarlo

  Antecedentes:
    Dado que el usuario está en la pantalla del paso 4 (Resumen) de creación de PQRS para un Reclamo

  @hu:91159 @regression @smoke @testcase:91490
  Escenario: CP_01 - TC91490 - El paso 4 muestra el título, la descripción y los pasos anteriores como completados
    Entonces el título "Revisa y confirma tu solicitud" debe estar visible
    Y la descripción "Verifica que toda la información sea correcta antes de enviar" debe estar visible
    Y los pasos "Configuración", "Información básica" y "Detalles" deben mostrarse como completados

  @hu:91159 @regression @critical @testcase:91491
  Escenario: CP_02 - TC91491 - Toda la información registrada se agrupa por sección
    Entonces las secciones "Tipo de novedad", "Información del proveedor", "Información del requerimiento", "Detalle del reclamo", "Información del proceso", "Información de compras" y "Documentos adjuntos" deben mostrarse con su información registrada

  @hu:91159 @regression @critical @testcase:91492
  Escenario: CP_03 - TC91492 - Solo las secciones del paso 3 ofrecen la acción Editar
    Entonces las secciones "Detalle del reclamo", "Información del proceso" e "Información de compras" deben mostrar la acción "Editar"
    Y las secciones "Tipo de novedad", "Información del proveedor", "Información básica" e "Información del requerimiento" no deben mostrar la acción "Editar"

  @hu:91159 @regression @testcase:91493
  Escenario: CP_04 - TC91493 - Editar redirige al paso 3 conservando la información
    Cuando el usuario hace clic en "Editar" en una sección del paso 3
    Entonces el usuario debe ser dirigido al paso 3
    Y la información previamente ingresada debe conservarse

  @hu:91159 @regression @critical @testcase:91494
  Escenario: CP_05 - TC91494 - Enviar se habilita solo cuando toda la información obligatoria está completa
    Dado que toda la información obligatoria de todos los pasos está completa
    Entonces el botón "Enviar" debe habilitarse

  @hu:91159 @regression @critical @testcase:91495
  Escenario: CP_06 - TC91495 - Enviar valida la completitud antes de enviar
    Dado que falta información obligatoria
    Cuando el usuario hace clic en "Enviar"
    Entonces deben mostrarse mensajes de validación indicando los campos faltantes
    Y el reclamo no debe enviarse

  @hu:91159 @regression @testcase:91496
  Escenario: CP_07 - TC91496 - Volver regresa al paso 3 conservando la información
    Cuando el usuario hace clic en "Volver"
    Entonces el usuario debe ser dirigido de nuevo al paso 3
    Y toda la información registrada debe conservarse
