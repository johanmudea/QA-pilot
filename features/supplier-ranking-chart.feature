# language: es
# HU-91242: Implementar visual Ranking de Proveedores y gráfico SP2
Característica: Pantalla de Ranking de Proveedores y gráfica de PQRS

  Como usuario del módulo de Evaluación de Proveedores
  Quiero ver el comportamiento histórico de los PQRS de los proveedores en una gráfica
  Para identificar tendencias y apoyar la toma de decisiones

  Antecedentes:
    Dado que el usuario está en la pantalla de Ranking de Proveedores, pestaña PQRS

  @hu:91242 @regression @smoke @testcase:91508
  Escenario: CP_01 - TC91508 - La pantalla muestra los mensajes descriptivo y de confidencialidad
    Entonces el mensaje descriptivo "En este espacio podrás consultar el escalafón de proveedores evaluados" debe estar visible
    Y el mensaje de confidencialidad debe estar visible

  @hu:91242 @regression @testcase:91509
  Escenario: CP_02 - TC91509 - Las pestañas Evaluaciones y PQRS están disponibles
    Entonces las pestañas "Evaluaciones" y "PQRS" deben estar visibles

  @hu:91242 @regression @critical @testcase:91510
  Escenario: CP_03 - TC91510 - La pestaña PQRS carga el año actual por defecto
    Entonces la gráfica debe mostrar la información del año actual
    Y el año actual debe mostrarse en la parte superior de la gráfica

  @hu:91242 @regression @testcase:91511
  Escenario: CP_04 - TC91511 - La gráfica muestra Reclamos y Felicitaciones como series separadas por mes
    Entonces Reclamos y Felicitaciones deben representarse como series independientes
    Y cada serie debe distinguirse visualmente con su propio color y leyenda

  @hu:91242 @regression @critical @testcase:91512
  Escenario: CP_05 - TC91512 - Navegar a un año anterior actualiza la gráfica y los totales
    Cuando el usuario navega al año anterior
    Entonces la gráfica debe actualizarse mostrando la información de ese año
    Y el resumen de total anual y el promedio mensual deben actualizarse en consecuencia

  @hu:91242 @regression @testcase:91513
  Escenario: CP_06 - TC91513 - No es posible navegar a un año futuro sin información
    Dado que el año actual es el último año con información
    Entonces no debe ser posible navegar a un año posterior

  @hu:91242 @regression @testcase:91514
  Escenario: CP_07 - TC91514 - La sección de la gráfica puede colapsarse conservando su encabezado visible
    Cuando el usuario colapsa la sección de la gráfica
    Entonces el encabezado de la sección debe permanecer visible
