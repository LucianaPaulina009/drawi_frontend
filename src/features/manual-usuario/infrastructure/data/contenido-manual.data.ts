import type {
  SeccionManual,
  EnlaceIndiceTOC,
} from "../../domain/entities/seccion-manual.entity";

export const SECCIONES_MANUAL_USUARIO: SeccionManual[] = [
  {
    id: "crear-proyectos",
    numero: "01",
    titulo: "Crear proyectos & Favoritos",
    eslogan:
      "Crea proyectos, agrégalos a tus favoritos y organiza tus ideas en un solo lugar.",
    icono: "FolderPlus",
    colorAcento: "matcha",
    descripcion:
      "Todo comienza en tu panel de control. Drawi te permite inicializar espacios de trabajo arquitectónicos con un solo clic, mantener tus lienzos prioritarios siempre a la mano y alternar fluidamente entre tus proyectos propios y los de tu equipo.",
    tarjetas: [
      {
        id: "nuevo-proyecto",
        titulo: "Nuevo Proyecto con un Clic",
        descripcion:
          "Inicializa lienzos al instante con identificadores slug únicos listos para compartir o editar en cualquier momento.",
        icono: "PlusCircle",
        badge: "1-Clic",
        destacado: true,
      },
      {
        id: "favoritos",
        titulo: "Proyectos Favoritos",
        descripcion:
          "Marca con la estrella dorada tus diagramas esenciales para acceder a ellos rápidamente desde la sección dedicada de favoritos.",
        icono: "Star",
        badge: "Acceso Rápido",
      },
      {
        id: "propios-vs-compartidos",
        titulo: "Mis Proyectos vs. Compartidos",
        descripcion:
          "Filtra fácilmente entre los diagramas creados por ti y aquellos donde eres un colaborador activo invitado por tu equipo.",
        icono: "Layers",
      },
      {
        id: "paginas-multiples",
        titulo: "Páginas y Diagramas Múltiples",
        descripcion:
          "Cada proyecto puede contener múltiples páginas/diagramas independientes para estructurar subsistemas o diferentes capas arquitectónicas.",
        icono: "Copy",
        badge: "Multicapa",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Ingresa a tu cuenta",
        descripcion: "Inicia sesión con tus credenciales o regístrate en segundos de forma gratuita.",
        icono: "LogIn",
        ubicacionUI: "Pantalla de Login (/auth/login)",
      },
      {
        numero: 2,
        titulo: "Presiona el botón Nuevo Proyecto",
        descripcion: "En la barra lateral izquierda del dashboard, haz clic en el botón '+' para crear tu nuevo espacio de trabajo.",
        icono: "Plus",
        ubicacionUI: "Barra lateral izquierda (Sidebar)",
      },
      {
        numero: 3,
        titulo: "Accede al Editor",
        descripcion: "El sistema genera tu slug automáticamente y te traslada a la pizarra interactiva con una página inicial en blanco.",
        icono: "LayoutGrid",
        ubicacionUI: "Editor de Proyecto (/proyecto/[slug])",
      },
      {
        numero: 4,
        titulo: "Destaca en Favoritos",
        descripcion: "Haz clic sobre el icono de estrella en cualquier tarjeta de proyecto para fijarlo en tu pestaña de favoritos.",
        icono: "Star",
        ubicacionUI: "Dashboard de Proyectos (/proyectos)",
      },
    ],
    tips: [
      "Puedes renombrar y reorganizar las páginas de tu proyecto en cualquier momento desde la cápsula superior izquierda del editor.",
      "Los proyectos compartidos contigo conservan tus permisos asignados aunque el propietario modifique el nombre principal.",
    ],
  },
  {
    id: "colaboracion-tiempo-real",
    numero: "02",
    titulo: "Colaboración en Tiempo Real",
    eslogan:
      "Comparte tu proyecto con personas con las cuales quieras compartir tus ideas.",
    icono: "Users",
    colorAcento: "cornflower",
    descripcion:
      "El diseño de software es un esfuerzo colectivo. Invita a colegas y estudiantes mediante enlaces directos o códigos alfanuméricos de acceso rápido, sincroniza cambios en vivo mediante WebSockets y mantén la conversación activa en el panel de comentarios.",
    tarjetas: [
      {
        id: "enlaces-codigos",
        titulo: "Enlaces y Códigos de Invitación",
        descripcion:
          "Genera códigos de 8 caracteres o enlaces directos para que cualquier persona se una al proyecto ingresando desde /unirse/[codigo].",
        icono: "Link2",
        badge: "Invitación Express",
        destacado: true,
      },
      {
        id: "roles-permisos",
        titulo: "Control de Roles y Permisos",
        descripcion:
          "Establece permisos granulares: Propietario (gestión total), Editor (puede modificar el lienzo) o Visualizador (modo lectura seguro).",
        icono: "ShieldCheck",
        badge: "Roles",
      },
      {
        id: "sincronizacion-vivo",
        titulo: "Sincronización Multiusuario en Vivo",
        descripcion:
          "Observa en tiempo real las operaciones y modificaciones del lienzo realizadas por tus compañeros sin recargar la página.",
        icono: "Activity",
        badge: "WebSockets",
      },
      {
        id: "comentarios-equipo",
        titulo: "Comentarios de Equipo",
        descripcion:
          "Discute requerimientos y decisiones arquitectónicas sin salir de la plataforma gracias al panel lateral de comentarios.",
        icono: "MessageSquare",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Abre el diálogo de Compartir",
        descripcion: "Dentro del editor, haz clic en el botón azul 'Compartir' situado en la cápsula superior derecha.",
        icono: "Share2",
        ubicacionUI: "Cápsula superior derecha del Editor",
      },
      {
        numero: 2,
        titulo: "Copia el enlace o código",
        descripcion: "Copia el enlace directo o el código alfanumérico generado para enviarlo a los miembros de tu equipo.",
        icono: "Copy",
        ubicacionUI: "Modal de Colaboradores",
      },
      {
        numero: 3,
        titulo: "Únete desde cualquier lugar",
        descripcion: "El usuario invitado solo necesita abrir el enlace o escribir el código en la pantalla '/unirse'.",
        icono: "UserCheck",
        ubicacionUI: "Ruta pública /unirse/[codigo]",
      },
    ],
    tips: [
      "El diálogo de colaboradores almacena sus datos en caché para que abra de forma instantánea en cada interacción.",
      "Puedes cambiar el rol de un miembro de Editor a Visualizador en cualquier momento sin revocar su acceso.",
    ],
  },
  {
    id: "lienzo-y-clases-uml",
    numero: "03",
    titulo: "Lienzo Interactivo & Clases UML",
    eslogan:
      "Tu pizarra de arquitectura: clases, atributos tipados y operaciones a tu alcance.",
    icono: "Layers",
    colorAcento: "amber",
    descripcion:
      "Un lienzo de alto desempeño diseñado para modelar con agilidad. Crea entidades de software formales, tipifica cada atributo con visibilidades UML estándar, añade métodos y mantén control absoluto del estado de sincronización.",
    tarjetas: [
      {
        id: "navegacion-canvas",
        titulo: "Navegación Fluida del Lienzo",
        descripcion:
          "Paneo libre arrastrando el fondo, zoom suave con la rueda del ratón y recentrado inteligente para mantenerte enfocado.",
        icono: "Move",
      },
      {
        id: "clases-entidades",
        titulo: "Clases y Entidades de Software",
        descripcion:
          "Crea clases con nombres formales, estereotipos y particiones limpias para atributos y métodos.",
        icono: "Box",
        destacado: true,
      },
      {
        id: "atributos-tipados",
        titulo: "Atributos Fuertemente Tipados",
        descripcion:
          "Soporte para tipos estándar: String, Integer, Float, Boolean, Date, DateTime y tipos personalizados de tu dominio.",
        icono: "Tag",
        badge: "Tipado Estricto",
      },
      {
        id: "visibilidad-uml",
        titulo: "Visibilidad Estándar UML",
        descripcion:
          "Configura el encapsulamiento: + Público, - Privado, # Protegido y ~ Paquete con un selector intuitivo.",
        icono: "Eye",
        badge: "Estándar UML",
      },
      {
        id: "metodos-operaciones",
        titulo: "Métodos y Operaciones",
        descripcion:
          "Define firmas de métodos con parámetros tipados y tipos de retorno para reflejar el comportamiento del sistema.",
        icono: "Terminal",
      },
      {
        id: "estado-sincronizacion",
        titulo: "Indicador de Sincronización",
        descripcion:
          "Icono dinámico que te notifica: verde (sincronizado con el servidor), spinner (guardando) y alerta de operaciones pendientes.",
        icono: "CloudCheck",
        badge: "Idempotente",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Agrega una nueva Clase",
        descripcion: "Utiliza la barra de herramientas del lienzo o haz doble clic para insertar una nueva entidad.",
        icono: "PlusSquare",
        ubicacionUI: "Barra de herramientas del Lienzo",
      },
      {
        numero: 2,
        titulo: "Define atributos y tipos",
        descripcion: "Escribe el nombre del atributo, elige su tipo en el menú desplegable y define su visibilidad (+, -, #, ~).",
        icono: "Edit3",
        ubicacionUI: "Panel de propiedades de la clase",
      },
      {
        numero: 3,
        titulo: "Posiciona y organiza",
        descripcion: "Arrastra la clase por el lienzo libremente; las relaciones conectadas ajustarán sus rutas de forma automática.",
        icono: "Move",
        ubicacionUI: "Lienzo de dibujo",
      },
    ],
    tips: [
      "Cada cambio en el lienzo actualiza de forma atómica el timestamp de última edición de todo tu proyecto.",
      "Si pierdes conexión momentáneamente, Drawi conserva tus operaciones localmente y las sincroniza al reconectar.",
    ],
  },
  {
    id: "relaciones-uml",
    numero: "04",
    titulo: "Relaciones & Conectores UML",
    eslogan:
      "Conecta tu modelo con precisión: asociaciones, herencias y multiplicidades automáticas.",
    icono: "Network",
    colorAcento: "matcha",
    descripcion:
      "Construye la arquitectura lógica conectando clases mediante puntos magnéticos. Drawi resuelve el cálculo de rutas ortogonales y la orientación de flechas según el tipo de relación formal que elijas.",
    tarjetas: [
      {
        id: "asociacion-simple",
        titulo: "Asociación Simple (1:1, 1:N)",
        descripcion:
          "Conecta entidades indicando la multiplicidad en ambos extremos (1, 0..1, *, 1..*) y los roles de navegación.",
        icono: "ArrowRight",
      },
      {
        id: "asociacion-muchos-a-muchos",
        titulo: "Relaciones Muchos a Muchos (N:M)",
        descripcion:
          "Generación y soporte automático de estructuras con tablas intermedias y claves foráneas dobles para persistencia relacional.",
        icono: "GitMerge",
        badge: "Tabla Intermedia",
        destacado: true,
      },
      {
        id: "herencia-generalizacion",
        titulo: "Herencia y Generalización",
        descripcion:
          "Modela jerarquías de clases y polimorfismo con el triángulo hueco UML apuntando hacia la clase padre o abstracta.",
        icono: "CornerRightUp",
        badge: "Polimorfismo",
      },
      {
        id: "agregacion-composicion",
        titulo: "Agregación y Composición",
        descripcion:
          "Distingue relaciones débiles 'tiene-un' (rombo hueco) de composiciones con ciclo de vida estricto dependiente (rombo relleno).",
        icono: "Diamond",
      },
      {
        id: "dependencia",
        titulo: "Dependencia",
        descripcion:
          "Línea discontinua con flecha abierta para indicar uso temporal, invocación de servicios o inyección de dependencias.",
        icono: "Share",
      },
      {
        id: "puntos-anclaje",
        titulo: "Anclaje Magnético Inteligente",
        descripcion:
          "Las líneas se acoplan a los 4 bordes de cada clase y recalculan sus trayectorias ortogonales para evitar solapamientos.",
        icono: "Magnet",
      },
    ],
    tips: [
      "Puedes arrastrar cualquier extremo de un conector para vincularlo rápidamente con otra clase.",
      "Las cardinalidades N:M preparan tu modelo para que el generador de backend cree automáticamente la tabla de unión en la base de datos.",
    ],
  },
  {
    id: "inteligencia-artificial",
    numero: "05",
    titulo: "Superpoderes con Inteligencia Artificial",
    eslogan:
      "Diseño asistido por IA: describe con palabras, dicta por voz o sube un boceto en foto.",
    icono: "Sparkles",
    colorAcento: "purple",
    descripcion:
      "Drawi integra modelos de lenguaje Google Gemini para acelerar tu proceso de diseño. Crea clases y relaciones mediante chat en lenguaje natural, digitaliza fotos de diagramas dibujados a mano y comanda el editor usando tu voz.",
    tarjetas: [
      {
        id: "chat-contextual-gemini",
        titulo: "Chat Contextual Gemini",
        descripcion:
          "Pídele a la IA en español cotidiano: 'Crea una clase Producto con precio y stock, y conéctala con DetalleFactura con agregación'.",
        icono: "Bot",
        badge: "Google Gemini",
        destacado: true,
      },
      {
        id: "manipulacion-crud-lienzo",
        titulo: "Manipulación CRUD en Tiempo Real",
        descripcion:
          "La IA ejecuta las operaciones directamente sobre el lienzo: inserta clases, muta atributos y traza relaciones sin intervención manual.",
        icono: "Cpu",
        badge: "Acción Directa",
      },
      {
        id: "reconocimiento-imagenes",
        titulo: "Reconocimiento de Fotos y Bocetos",
        descripcion:
          "Sube una foto de un diagrama dibujado en una libreta o pizarra blanca; la IA lo analizará y recreará en clases digitales en tu canvas.",
        icono: "Image",
        badge: "Visión Artificial",
      },
      {
        id: "comandos-voz",
        titulo: "Comandos Interactivos por Voz",
        descripcion:
          "Activa el micrófono del editor para dictar instrucciones en vivo y ver cómo se ejecutan las modificaciones en tu diagrama.",
        icono: "Mic",
        badge: "Manos Libres",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Abre el Asistente de IA",
        descripcion: "Haz clic en el panel de IA en el lateral del editor para desplegar el chat.",
        icono: "MessageCircle",
        ubicacionUI: "Panel flotante de IA en el Editor",
      },
      {
        numero: 2,
        titulo: "Escribe o dicta tu instrucción",
        descripcion: "Explica lo que necesitas construir o pulsa el icono del micrófono para hablar.",
        icono: "Send",
        ubicacionUI: "Barra de entrada de mensajes de IA",
      },
      {
        numero: 3,
        titulo: "Confirma los cambios en el lienzo",
        descripcion: "La IA planifica y ejecuta las operaciones de creación de clases y relaciones ante tus ojos.",
        icono: "CheckCircle2",
        ubicacionUI: "Lienzo de dibujo",
      },
    ],
    tips: [
      "Para digitalizar imágenes con mayor precisión, asegúrate de que el boceto tenga buena iluminación y trazos legibles.",
      "Puedes pedirle a la IA correcciones arquitectónicas, como detectar atributos duplicados o relaciones redundantes.",
    ],
  },
  {
    id: "generacion-backend",
    numero: "06",
    titulo: "Generación de Código Backend",
    eslogan:
      "Genera un backend funcional en Spring Boot con solo un clic.",
    icono: "Code2",
    colorAcento: "cornflower",
    descripcion:
      "Transforma tu diagrama visual en código fuente ejecutable listo para producción. Drawi valida la salud estructural de tu modelo y compila un backend completo con persistencia relacional, repositorios y endpoints REST.",
    tarjetas: [
      {
        id: "spring-boot-completo",
        titulo: "Spring Boot Totalmente Funcional",
        descripcion:
          "Genera un proyecto Maven/Gradle listo para compilar con entidades JPA/Hibernate, repositorios Spring Data, DTOs y controladores REST.",
        icono: "Layers",
        badge: "Spring Boot 3",
        destacado: true,
      },
      {
        id: "diagnostico-previo",
        titulo: "Diagnóstico y Validación Previa",
        descripcion:
          "El sistema inspecciona tu diagrama para detectar advertencias antes de compilar: clases sin atributos, referencias huérfanas o ciclos.",
        icono: "CheckSquare",
        badge: "Validación Automática",
      },
      {
        id: "descarga-zip",
        titulo: "Descarga en Paquete Comprimido .ZIP",
        descripcion:
          "Obtén un archivo descargable con toda la estructura de carpetas, código limpio y configuración de base de datos lista para correr.",
        icono: "Download",
        badge: "Descarga Directa",
      },
      {
        id: "soporte-fastapi",
        titulo: "Soporte para FastAPI (Python)",
        descripcion:
          "Genera también arquitecturas limpias y asíncronas en Python con SQLModel, Pydantic v2 y endpoints REST documentados con OpenAPI.",
        icono: "FileCode",
        badge: "FastAPI / Python",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Completa tu modelo de clases",
        descripcion: "Asegúrate de que tus clases tengan nombres correctos y sus relaciones estén bien conectadas.",
        icono: "Layout",
        ubicacionUI: "Lienzo del Editor",
      },
      {
        numero: 2,
        titulo: "Ejecuta el Diagnóstico",
        descripcion: "Haz clic en Generar Backend y visualiza el reporte de salud de tu diagrama.",
        icono: "Activity",
        ubicacionUI: "Modal de Generación de Backend",
      },
      {
        numero: 3,
        titulo: "Descarga tu proyecto .ZIP",
        descripcion: "Presiona el botón de descarga para guardar el código en tu equipo y ejecutarlo de inmediato.",
        icono: "DownloadCloud",
        ubicacionUI: "Descarga directa del navegador",
      },
    ],
    tips: [
      "Para ejecutar tu proyecto Spring Boot descargado, descomprime el .ZIP y escribe en tu terminal: './mvnw spring-boot:run'.",
      "Las relaciones N:M se transforman automáticamente en anotaciones @ManyToMany con tablas intermedias @JoinTable.",
    ],
  },
  {
    id: "enterprise-architect",
    numero: "07",
    titulo: "Compatibilidad con Enterprise Architect",
    eslogan:
      "Compatibilidad total: exporta e importa archivos XML/XMI estándar.",
    icono: "FileCode2",
    colorAcento: "rose",
    descripcion:
      "Interoperabilidad sin fricciones con herramientas corporativas de ingeniería de software. Exporta tus diagramas de Drawi a formato XML estándar o importa modelos XMI preexistentes para continuar tu trabajo en la nube.",
    tarjetas: [
      {
        id: "exportar-ea",
        titulo: "Dónde hacer clic para Exportar",
        descripcion:
          "En la cápsula superior izquierda del editor, abre el menú del proyecto y selecciona 'Exportar (Enterprise Architect)'.",
        icono: "Upload",
        badge: "Menú Proyecto",
        destacado: true,
      },
      {
        id: "importar-ea",
        titulo: "Importación en Páginas en Blanco",
        descripcion:
          "Crea una página nueva vacía y selecciona 'Importar (Enterprise Architect)' para cargar tu archivo XML/XMI y renderizar las clases.",
        icono: "Download",
        badge: "Página Vacía",
      },
      {
        id: "estandar-xmi",
        titulo: "Estándar Universal XMI",
        descripcion:
          "Cumple con la especificación de intercambio de metadatos UML admitida por Sparx Systems Enterprise Architect.",
        icono: "Globe",
      },
      {
        id: "fidelidad-semantica",
        titulo: "Fidelidad Semántica y de Conectores",
        descripcion:
          "Preserva fielmente nombres, atributos, tipos primitivos, multiplicidades y tipos de conectores entre plataformas.",
        icono: "CheckCircle",
      },
    ],
    pasos: [
      {
        numero: 1,
        titulo: "Para Exportar",
        descripcion: "Haz clic en el menú desplegable del proyecto (esquina superior izquierda) y pulsa 'Exportar (Enterprise Architect)'. Se descargará un archivo .xml.",
        icono: "FileUp",
        ubicacionUI: "Menú superior izquierdo del Editor",
      },
      {
        numero: 2,
        titulo: "Para Importar",
        descripcion: "Abre una página en blanco en tu proyecto, abre el menú del proyecto y pulsa 'Importar (Enterprise Architect)'. Sube tu archivo XML para recrear el diagrama.",
        icono: "FileDown",
        ubicacionUI: "Menú superior izquierdo del Editor",
      },
    ],
    tips: [
      "El botón de exportar solo se habilita si tu diagrama contiene al menos una clase modelada.",
      "La importación está protegida para realizarse exclusivamente en páginas en blanco para prevenir sobreescrituras accidentales.",
    ],
  },
];

export const ENLACES_TOC: EnlaceIndiceTOC[] = SECCIONES_MANUAL_USUARIO.map(
  (seccion) => ({
    id: seccion.id,
    titulo: seccion.titulo,
    icono: seccion.icono,
    numero: seccion.numero,
  })
);
