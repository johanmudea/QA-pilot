# language: es
# HU-90064: Implementar visual de Consulta de Proveedores 360 SP1
Característica: Pantalla de Consulta de Proveedores 360

  Como usuario del módulo de Evaluación de Proveedores
  Quiero buscar proveedores por diferentes criterios y elegir qué fuentes consultar
  Para ver de forma centralizada información de PQRS, evaluaciones e integraciones

  Antecedentes:
    Dado que el usuario está en la pantalla de Consulta de Proveedores 360

  @hu:90064 @regression @smoke @testcase:91444
  Escenario: La pantalla muestra el mensaje descriptivo y no hay resultados antes de buscar
    Entonces el mensaje descriptivo "En este espacio podrás consultar las evaluaciones y PQRS de tus proveedores" debe estar visible
    Y debe mostrarse un mensaje informativo indicando que se requiere una búsqueda
    Y no debe mostrarse información de proveedores

  @hu:90064 @regression @critical @testcase:91445
  Escenario: Los filtros de búsqueda están disponibles
    Entonces los filtros "Nombre del proveedor", "ID Fiscal" y "Código o ID ERP" deben aceptar ingreso manual de texto
    Y el filtro "Tipo de información" debe permitir seleccionar múltiples opciones entre "PQRS", "SAP" y "Prevsis"

  @hu:90064 @regression @critical @testcase:91446
  Escenario: Aplicar filtros ejecuta la consulta y conserva los filtros diligenciados
    Cuando el usuario aplica los filtros
    Entonces la consulta debe ejecutarse utilizando todos los criterios seleccionados
    Y los filtros diligenciados deben permanecer visibles después de la consulta

  @hu:90064 @regression @testcase:91447
  Escenario: Limpiar filtros restablece el componente a su estado inicial
    Cuando el usuario limpia los filtros
    Entonces todos los filtros deben volver a su estado inicial
    Y debe mostrarse nuevamente el mensaje informativo indicando que se requiere una búsqueda
