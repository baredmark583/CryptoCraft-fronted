

export interface CategoryField {
    name: string; // internal name, e.g., 'brand'
    label: string; // display name, e.g., 'Бренд'
    type: 'text' | 'number' | 'select';
    options?: string[]; // for select type
    required?: boolean;
}

export interface CategorySchema {
    name: string;
    fields: CategoryField[];
}

export const CATEGORIES: CategorySchema[] = [
  {
    name: "Искусство и коллекционирование",
    fields: [
        { name: 'artist', label: 'Художник/Автор', type: 'text' },
        { name: 'year', label: 'Год создания', type: 'number' },
        { name: 'style', label: 'Стиль', type: 'text' },
    ]
  },
  {
    name: "Товары ручной работы",
    fields: [
        { name: 'material', label: 'Основной материал', type: 'text', required: true },
        { name: 'dimensions', label: 'Размеры (см)', type: 'text' },
    ]
  },
  {
    name: "Ювелирные изделия",
    fields: [
        { name: 'metal', label: 'Металл', type: 'text', required: true },
        { name: 'stone', label: 'Камень', type: 'text' },
        { name: 'weight_grams', label: 'Вес (граммы)', type: 'number' },
    ]
  },
  {
    name: "Одежда и аксессуары",
    fields: [
        { name: 'size', label: 'Размер', type: 'text', required: true },
        { name: 'fabric', label: 'Ткань', type: 'text' },
        { name: 'color', label: 'Цвет', type: 'text' },
    ]
  },
  {
      name: "Электроника",
      fields: [
          { name: 'brand', label: 'Бренд', type: 'text', required: true },
          { name: 'model', label: 'Модель', type: 'text', required: true },
          { name: 'condition', label: 'Состояние', type: 'select', options: ['Новое', 'Б/у', 'Восстановленное'], required: true },
      ]
  },
  {
    name: "Автомобили",
    fields: [
      { name: 'brand', label: 'Бренд', type: 'text', required: true },
      { name: 'model', label: 'Модель', type: 'text', required: true },
      { name: 'year', label: 'Год выпуска', type: 'number', required: true },
      { name: 'mileage', label: 'Пробег, км', type: 'number', required: true },
      { name: 'vin', label: 'VIN-код', type: 'text', required: true },
      { name: 'engine_volume', label: 'Объем двигателя, л', type: 'number' },
      { name: 'transmission', label: 'Коробка передач', type: 'select', options: ['Механика', 'Автомат', 'Роботизированная', 'Вариатор'] },
      { name: 'fuel_type', label: 'Тип топлива', type: 'select', options: ['Бензин', 'Дизель', 'Гибрид', 'Электро'] },
      { name: 'body_type', label: 'Тип кузова', type: 'text' },
      { name: 'condition', label: 'Состояние', type: 'select', options: ['Новый', 'Б/у', 'На запчасти'] },
    ]
  },
  {
    name: "Дом и быт",
    fields: [
         { name: 'material', label: 'Материал', type: 'text' },
         { name: 'purpose', label: 'Назначение', type: 'text' },
    ]
  },
  {
    name: "Цифровые товары",
    fields: [
        { name: 'file_format', label: 'Формат файла', type: 'text', required: true },
        { name: 'resolution', label: 'Разрешение', type: 'text' },
    ]
  },
  {
    name: "Винтаж",
    fields: [
        { name: 'period', label: 'Период', type: 'text' },
        { name: 'condition', label: 'Состояние сохранности', type: 'text' },
    ]
  }
];

export const getCategoryNames = () => CATEGORIES.map(c => c.name);