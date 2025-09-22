// This file contains core constants for the application.

// --- CATEGORY DEFINITIONS ---

export interface CategoryField {
  name: string; // Used as id
  label: string; // Displayed label
  type: 'text' | 'number' | 'select';
  required?: boolean;
  options?: string[]; // For select type
}

export interface CategorySchema {
  name: string;
  fields: CategoryField[];
}

export const CATEGORIES: CategorySchema[] = [
    {
        name: 'Электроника',
        fields: [
            { name: 'brand', label: 'Бренд', type: 'text', required: true },
            { name: 'model', label: 'Модель', type: 'text', required: true },
            { name: 'condition', label: 'Состояние', type: 'select', required: true, options: ['Новое', 'Б/у', 'На запчасти'] },
        ],
    },
    {
        name: 'Автомобили',
        fields: [
            { name: 'brand', label: 'Бренд', type: 'text', required: true },
            { name: 'model', label: 'Модель', type: 'text', required: true },
            { name: 'year', label: 'Год выпуска', type: 'number', required: true },
            { name: 'mileage', label: 'Пробег, км', type: 'number', required: true },
            { name: 'vin', label: 'VIN-код', type: 'text' },
            { name: 'gearbox', label: 'Коробка передач', type: 'select', options: ['Механическая', 'Автоматическая', 'Роботизированная', 'Вариатор'] },
            { name: 'fuelType', label: 'Тип топлива', type: 'select', options: ['Бензин', 'Дизель', 'Гибрид', 'Электро'] },
            { name: 'condition', label: 'Состояние', type: 'select', options: ['Новый', 'Б/у', 'После ДТП'] },
        ],
    },
    {
        name: 'Товары ручной работы',
        fields: [
            { name: 'material', label: 'Основной материал', type: 'text', required: true },
            { name: 'color', label: 'Цвет', type: 'text' },
            { name: 'size', label: 'Размер', type: 'text' },
        ],
    },
    {
        name: 'Ювелирные изделия',
        fields: [
            { name: 'metal', label: 'Металл', type: 'text', required: true },
            { name: 'stone', label: 'Камень', type: 'text' },
            { name: 'weight', label: 'Вес (г)', type: 'number' },
        ],
    },
    {
        name: 'Одежда и аксессуары',
        fields: [
            { name: 'brand', label: 'Бренд', type: 'text' },
            { name: 'size', label: 'Размер', type: 'text', required: true },
            { name: 'color', label: 'Цвет', type: 'text' },
            { name: 'material', label: 'Материал', type: 'text' },
        ],
    },
    {
        name: 'Дом и быт',
        fields: [
            { name: 'purpose', label: 'Назначение', type: 'text' },
            { name: 'material', label: 'Материал', type: 'text' },
        ],
    },
    {
        name: 'Цифровые товары',
        fields: [
            { name: 'fileType', label: 'Тип файла', type: 'text', required: true },
            { name: 'license', label: 'Лицензия', type: 'text' },
        ],
    },
    {
        name: 'Винтаж',
        fields: [
            { name: 'period', label: 'Период', type: 'text' },
            { name: 'condition', label: 'Состояние', type: 'text' },
        ],
    },
    {
        name: 'Искусство и коллекционирование',
        fields: [
            { name: 'artist', label: 'Автор', type: 'text' },
            { name: 'style', label: 'Стиль', type: 'text' },
        ],
    },
];

export const getCategoryNames = (): string[] => {
  return CATEGORIES.map(c => c.name);
};