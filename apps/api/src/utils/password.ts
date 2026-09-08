/**
 * Password hashing and verification helpers built on bcrypt
 */

import { compare, hash } from 'bcryptjs'
import { BCRYPT_ROUNDS } from './constants.js'

/**
 * A valid bcrypt digest of a value no caller knows. Comparing against it lets
 * the sign in path spend the same time on a missing user as on a real one, so
 * response timing does not reveal which usernames exist.
 */
const DUMMY_DIGEST =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7Cf6zwHiVGyLB.eKz9E5aDRTPFC.Zbi'

/**
 * Hashes a plaintext password for storage
 *
 * @param {string} plaintext - The password to hash
 * @returns {Promise<string>} - The bcrypt digest
 */
export const hashPassword = (plaintext: string): Promise<string> => {
  return hash(plaintext, BCRYPT_ROUNDS)
}

/**
 * Verifies a plaintext password against a stored digest
 *
 * @param {string} plaintext - The password supplied by the client
 * @param {string | null} digest - The stored bcrypt digest, if the account has one
 * @returns {Promise<boolean>} - True when the password matches
 */
export const verifyPassword = async (
  plaintext: string,
  digest: string | null
): Promise<boolean> => {
  if (!digest) {
    await compare(plaintext, DUMMY_DIGEST)
    return false
  }

  return compare(plaintext, digest)
}
