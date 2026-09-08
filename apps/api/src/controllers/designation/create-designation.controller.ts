/**
 * Controller for adding a designation at runtime
 */

import type { DesignationCategory } from '@prisma/client'
import { prisma } from '../../config/database.js'
import { isUniqueConstraintError } from '../../utils/prisma-error.js'
import { err, ok, type Result } from '../../utils/result.js'

export type CreateDesignationError = 'slug_taken'

export type CreateDesignationInput = {
  slug: string
  label: string
  category: DesignationCategory
  topic?: string
  group: string
}

export type CreatedDesignation = {
  slug: string
  label: string
  category: DesignationCategory
  topic: string | null
  group: string
}

/**
 * Creates a designation so admins can extend the list without a deployment
 *
 * `group` is required because every row has to land somewhere in the picker,
 * while `topic` stays optional: it describes what a creator publishes about
 * and is null for consumers.
 *
 * @param {CreateDesignationInput} input - Slug, label, category, group and optional topic
 * @returns {Promise<Result<CreatedDesignation, CreateDesignationError>>} - The new designation, or a slug clash
 */
const createDesignationController = async (
  input: CreateDesignationInput
): Promise<Result<CreatedDesignation, CreateDesignationError>> => {
  try {
    const designation = await prisma.designation.create({
      data: {
        slug: input.slug,
        label: input.label,
        category: input.category,
        group: input.group,
        ...(input.topic ? { topic: input.topic } : {})
      },
      select: {
        slug: true,
        label: true,
        category: true,
        topic: true,
        group: true
      }
    })

    return ok(designation)
  } catch (error) {
    if (isUniqueConstraintError(error)) return err('slug_taken')
    throw error
  }
}

export default createDesignationController
