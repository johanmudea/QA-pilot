# language: es
# HU-91137: Implementar Paso 3 "Detalles" en el flujo de creación de PQRS tipo Reclamo SP2
Característica: Creación de PQRS - Paso 3 (Detalles) para Reclamo

  Como usuario del módulo de Evaluación de Proveedores
  Quiero completar el detalle, proceso e información de compras del reclamo
  Para garantizar que cuente con toda la información necesaria para su gestión y trazabilidad

  Antecedentes:
    Dado que el usuario está en la pantalla del paso 3 de creación de PQRS para un Reclamo

  @hu:91137 @regression @smoke @testcase:91480
  Escenario: CP_01 - TC91480 - La sección Detalle del reclamo muestra sus campos
    Entonces la sección "Detalle del reclamo" debe mostrar los campos "Estado de atención del reclamo", "Descripción del reclamo", "Tipo de reclamo" y "Fecha del evento"

  @hu:91137 @regression @testcase:91481
  Escenario: CP_02 - TC91481 - Fecha del evento no permite fechas futuras
    Cuando el usuario abre el calendario de "Fecha del evento"
    Entonces las fechas posteriores a la fecha actual no deben ser seleccionables

  @hu:91137 @regression @critical @testcase:91482
  Escenario: CP_03 - TC91482 - Seleccionar Sí en Reclamo asociado con alguna parada habilita Código de parada
    Cuando el usuario selecciona "Sí" en "Reclamo asociado con alguna parada"
    Entonces el campo "Código de parada" debe habilitarse

  @hu:91137 @regression @testcase:91483
  Escenario: CP_04 - TC91483 - Seleccionar No en Reclamo asociado con alguna parada oculta Código de parada
    Cuando el usuario selecciona "No" en "Reclamo asociado con alguna parada"
    Entonces el campo "Código de parada" debe ocultarse o deshabilitarse

  @hu:91137 @regression @critical @testcase:91484
  Escenario: CP_05 - TC91484 - Seleccionar Sí en orden de compra asociada habilita sus campos
    Cuando el usuario selecciona "Sí" en "¿Tiene orden de compra asociada?"
    Entonces los campos "Tipo de orden de compra" y "Número de orden de compra" deben habilitarse

  @hu:91137 @regression @testcase:91485
  Escenario: CP_06 - TC91485 - Seleccionar No en orden de compra asociada oculta sus campos
    Cuando el usuario selecciona "No" en "¿Tiene orden de compra asociada?"
    Entonces los campos asociados a la orden de compra deben ocultarse o deshabilitarse

  @hu:91137 @regression @testcase:91486
  Escenario: CP_07 - TC91486 - La sección Documentos adjuntos permite cargar varios archivos
    Cuando el usuario carga más de un archivo en "Documentos adjuntos"
    Entonces todos los archivos cargados deben quedar listados

  @hu:91137 @regression @testcase:91487
  Escenario: CP_08 - TC91487 - Colapsar una sección conserva la información ingresada
    Dado que el usuario ingresó información en una sección
    Cuando el usuario colapsa esa sección
    Y el usuario la expande nuevamente
    Entonces la información previamente ingresada debe seguir ahí

  @hu:91137 @regression @critical @testcase:91488
  Escenario: CP_09 - TC91488 - Continuar permanece deshabilitado hasta completar todos los campos obligatorios
    Dado que no se han completado todos los campos obligatorios del paso 3
    Entonces el botón "Continuar" debe estar deshabilitado
