import { createClient } from '@/lib/supabase/client'
import type { Item, OffcutPlate } from '@/types'

/**
 * Product Template Database Operations
 */

export interface ProductTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  products: Item[]
  created_at: string
  updated_at: string
}

export interface ProductTemplateCreate {
  name: string
  description?: string
  products: Item[]
}

/**
 * Get all product templates for a user
 */
export async function getProductTemplates(userId: string): Promise<ProductTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get product templates: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new product template
 */
export async function createProductTemplate(
  userId: string,
  template: ProductTemplateCreate
): Promise<ProductTemplate> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_templates')
    .insert({
      user_id: userId,
      name: template.name,
      description: template.description || null,
      products: template.products,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('同じ名前のテンプレートが既に存在します')
    }
    throw new Error(`Failed to create product template: ${error.message}`)
  }

  return data
}

/**
 * Update a product template
 */
export async function updateProductTemplate(
  templateId: string,
  updates: Partial<ProductTemplateCreate>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('product_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  if (error) {
    if (error.code === '23505') {
      throw new Error('同じ名前のテンプレートが既に存在します')
    }
    throw new Error(`Failed to update product template: ${error.message}`)
  }
}

/**
 * Delete a product template
 */
export async function deleteProductTemplate(templateId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('product_templates').delete().eq('id', templateId)

  if (error) {
    throw new Error(`Failed to delete product template: ${error.message}`)
  }
}

/**
 * Offcut Template Database Operations
 */

export interface OffcutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  offcuts: OffcutPlate[]
  created_at: string
  updated_at: string
}

export interface OffcutTemplateCreate {
  name: string
  description?: string
  offcuts: OffcutPlate[]
}

/**
 * Get all offcut templates for a user
 */
export async function getOffcutTemplates(userId: string): Promise<OffcutTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offcut_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get offcut templates: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new offcut template
 */
export async function createOffcutTemplate(
  userId: string,
  template: OffcutTemplateCreate
): Promise<OffcutTemplate> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('offcut_templates')
    .insert({
      user_id: userId,
      name: template.name,
      description: template.description || null,
      offcuts: template.offcuts,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('同じ名前のテンプレートが既に存在します')
    }
    throw new Error(`Failed to create offcut template: ${error.message}`)
  }

  return data
}

/**
 * Update an offcut template
 */
export async function updateOffcutTemplate(
  templateId: string,
  updates: Partial<OffcutTemplateCreate>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('offcut_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)

  if (error) {
    if (error.code === '23505') {
      throw new Error('同じ名前のテンプレートが既に存在します')
    }
    throw new Error(`Failed to update offcut template: ${error.message}`)
  }
}

/**
 * Delete an offcut template
 */
export async function deleteOffcutTemplate(templateId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('offcut_templates').delete().eq('id', templateId)

  if (error) {
    throw new Error(`Failed to delete offcut template: ${error.message}`)
  }
}
