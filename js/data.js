/* =========================================================
   Datos por defecto: rutinas, tareas y emojis para pictogramas
   ========================================================= */

const DEFAULT_DATA = {
  soundEnabled: true,
  routines: [
    {
      id: 'r-manana',
      name: '¡Vamos a la escuela!',
      icon: '🏫',
      tasks: [
        { id: 't1', text: 'Despertarse',              icon: '⏰' },
        { id: 't2', text: 'Hacer pipí',                icon: '🚽' },
        { id: 't3', text: 'Lavarse las manos con jabón', icon: '🧼' },
        { id: 't4', text: 'Lavarse la cara',           icon: '💧' },
        { id: 't5', text: 'Lavarse los dientes',       icon: '🪥' },
        { id: 't6', text: 'Secarse con la toalla',     icon: '🧖' },
        { id: 't7', text: 'Vestirse con la ropa de la escuela', icon: '👕' },
      ],
    },
    {
      id: 'r-noche',
      name: 'Rutina de Noche',
      icon: '🌙',
      tasks: [
        { id: 't1', text: 'Guardar juguetes', icon: '🧸' },
        { id: 't2', text: 'Bañarme',          icon: '🛁' },
        { id: 't3', text: 'Ponerme pijama',   icon: '👖' },
        { id: 't4', text: 'Cenar',            icon: '🍽️' },
        { id: 't5', text: 'Lavarme los dientes', icon: '🪥' },
        { id: 't6', text: 'Leer un cuento',   icon: '📖' },
        { id: 't7', text: 'Dormir',           icon: '😴' },
      ],
    },
    {
      id: 'r-escuela',
      name: 'Rutina de Escuela',
      icon: '🎒',
      tasks: [
        { id: 't1', text: 'Ponerme el uniforme', icon: '👔' },
        { id: 't2', text: 'Desayunar',        icon: '🥞' },
        { id: 't3', text: 'Revisar mochila',  icon: '🎒' },
        { id: 't4', text: 'Ponerme zapatos',  icon: '👟' },
        { id: 't5', text: 'Salir a la escuela', icon: '🚌' },
      ],
    },
  ],
};

/* Emojis rápidos para elegir pictograma en el modo configuración */
const EMOJI_CHOICES = [
  '⏰','🚽','🧼','👕','🥣','🪥','🎒','🧸','🛁','👖','🍽️','📖','😴',
  '👔','🥞','👟','🚌','🌞','🌙','🍎','🥛','🧴','🧦','🧥','🎈','⚽',
  '📺','🎨','🧩','🐶','🐱','🚗','🏫','💊','🧃','🥕','🍞','🚿','🛏️',
  '🧺','🧹','📚','✏️','🖍️','🎵','🕺','💧','☀️','⭐','❤️','✅',
];

const COLOR_CLASS_COUNT = 5;
