import type { CategorySchema, CategoryFieldWithMeta } from '../constants';
import type { Product } from '../types';

export const slugify = (value: string) =>
  (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');

export const findCategoryByName = (categories: CategorySchema[], name?: string | null): CategorySchema | null => {
  if (!name) return null;
  for (const category of categories) {
    if (category.name === name) {
      return category;
    }
    if (category.subcategories?.length) {
      const found = findCategoryByName(category.subcategories, name);
      if (found) return found;
    }
  }
  return null;
};

const buildLineage = (
  categories: CategorySchema[],
  name?: string | null,
  path: CategorySchema[] = [],
): CategorySchema[] | null => {
  if (!name) return null;
  for (const category of categories) {
    const nextPath = [...path, category];
    if (category.name === name) return nextPath;
    if (category.subcategories?.length) {
      const found = buildLineage(category.subcategories, name, nextPath);
      if (found) return found;
    }
  }
  return null;
};

export const resolveFieldsForCategory = (
  categories: CategorySchema[],
  category?: CategorySchema | null,
): CategoryFieldWithMeta[] => {
  if (!category) return [];
  if (category.resolvedFields?.length) return category.resolvedFields;
  const lineage = buildLineage(categories, category.name);
  if (!lineage) return category.fields || [];

  const resolved: CategoryFieldWithMeta[] = [];
  lineage.forEach((node) => {
    node.fields?.forEach((field) => {
      const name = field.name || slugify(field.label);
      const meta: CategoryFieldWithMeta = {
        ...field,
        name,
        inherited: node.name !== category.name,
        sourceCategoryId: node.id ?? null,
        sourceCategoryName: node.name,
      };
      const idx = resolved.findIndex((existing) => existing.name === name);
      if (idx >= 0) {
        resolved[idx] = meta;
      } else {
        resolved.push(meta);
      }
    });
  });
  return resolved;
};

export const normalizeDynamicAttributesForCategory = (
  attributes: Product['dynamicAttributes'] | undefined,
  fields: CategoryFieldWithMeta[],
): Record<string, string | number> => {
  if (!fields.length) return attributes ?? {};
  const normalized: Record<string, string | number> = {};
  fields.forEach((field) => {
    const raw = attributes?.[field.name] ?? (field.label ? attributes?.[field.label] : undefined);
    if (raw === undefined || raw === null || raw === '') return;
    if (field.type === 'number') {
      const num = Number(raw);
      if (!Number.isNaN(num)) normalized[field.name] = num;
      return;
    }
    normalized[field.name] = String(raw);
  });
  return normalized;
};
