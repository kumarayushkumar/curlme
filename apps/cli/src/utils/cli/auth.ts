/**
 * Authentication handlers: password registration and sign in, plus the
 * GitHub OAuth device flow
 */

import { exec } from 'child_process'
import * as readline from 'readline'
import { apiClient } from '../api.js'
import {
  clearDeviceCode,
  clearToken,
  getDeviceCode,
  isAuthenticated,
  saveDeviceCode,
  saveToken
} from '../config.js'
import { colorize, error, heading, success } from '../output.js'
import { withPrompter, type Choice, type Prompter } from '../prompt.js'

/**
 * Handles the login process using GitHub OAuth device flow
 *
 * @return {Promise<void>}
 */
export async function handleLogin(): Promise<void> {
  if (isAuthenticated()) {
    success('You are already logged in!')
    return
  }

  const existingDeviceCode = getDeviceCode()
  if (existingDeviceCode) {
    console.log('Completing GitHub authentication...')
    const response = await apiClient.post('/api/login', {
      device_code: existingDeviceCode
    })
    if (response) {
      saveToken(response.data.token)
      clearDeviceCode()
      success('Login successful!')
      return
    }

    clearDeviceCode()
    console.log('Previous authorization expired or was not completed.')
    console.log('Starting a new login...\n')
  }

  heading('Starting GitHub authentication...')
  const start = await apiClient.post('/api/login')
  if (start) {
    const newDeviceCode = start.data.device_code
    const userCode = start.data.user_code
    const verificationUri = start.data.verification_uri
    saveDeviceCode(newDeviceCode)

    console.log('\nGitHub Authentication Required')

    console.log(`1. Visit: ${verificationUri}`)
    console.log(`2. Enter code: ${colorize(userCode, 'highlight')}`)
    console.log(`3. Authorize the application\n`)

    const openCmd =
      process.platform === 'darwin'
        ? 'open'
        : process.platform === 'win32'
          ? 'start'
          : 'xdg-open'
    exec(`${openCmd} ${verificationUri}`)
    console.log('Opening browser automatically...')

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    const answer = await new Promise<string>(resolve => {
      rl.question(
        '\nHave you authorized the application? (y/N): ',
        (ans: string) => {
          rl.close()
          resolve(ans.toLowerCase())
        }
      )
    })
    console.log()
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const finish = await apiClient.post('/api/login', {
        device_code: newDeviceCode
      })
      if (finish) {
        saveToken(finish.data.token)
        clearDeviceCode()
        success('Login successful!')
      }
    }
    clearDeviceCode()
  }
}

/**
 * Handles the logout process by clearing stored tokens and device codes
 *
 * @return {void}
 */
export function handleLogout(): void {
  clearToken()
  clearDeviceCode()
  success('Logged out successfully')
}

type DesignationCategory = 'CREATOR' | 'CONSUMER'

type DesignationOption = {
  slug: string
  label: string
  category: DesignationCategory
  topic: string | null
  group: string
}

/** Creators are offered first, so the list opens on the publishing options. */
const CATEGORY_ORDER: DesignationCategory[] = ['CREATOR', 'CONSUMER']

const CATEGORY_PREFIX: Record<DesignationCategory, string> = {
  CREATOR: 'Creators',
  CONSUMER: 'Consumers'
}

/**
 * Turns a stored group value into a readable heading
 *
 * @param {string} group - The group as stored, for example 'outside_tech'
 * @returns {string} - Title cased words, for example 'Outside Tech'
 */
function titleCaseGroup(group: string): string {
  return group
    .split('_')
    .filter(word => word.length > 0)
    .map(
      word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    )
    .join(' ')
}

/**
 * Lists the distinct groups in the order the API returned them
 *
 * The headings come from the data rather than a hardcoded list, so a group
 * added to the designations table shows up without the CLI being rebuilt.
 *
 * @param {DesignationOption[]} designations - Entries of a single category
 * @returns {string[]} - Each group once, first seen order preserved
 */
function distinctGroups(designations: DesignationOption[]): string[] {
  return [...new Set(designations.map(designation => designation.group))]
}

/**
 * Renders one designation as a picker entry
 *
 * @param {DesignationOption} designation - The designation to render
 * @param {string} groupTitle - The group heading this entry sits under
 * @returns {Choice} - The picker entry
 */
function toChoice(designation: DesignationOption, groupTitle: string): Choice {
  return {
    key: designation.slug,
    label: designation.topic
      ? `${designation.label} ${colorize(`· ${designation.topic}`, 'grey')}`
      : designation.label,
    group: groupTitle
  }
}

/**
 * Orders the catalogue for the picker: creators first, consumers after, each
 * split into the groups the catalogue itself defines
 *
 * @param {DesignationOption[]} designations - The full catalogue
 * @returns {Choice[]} - Picker entries carrying their group heading
 */
function toChoices(designations: DesignationOption[]): Choice[] {
  return CATEGORY_ORDER.flatMap(category => {
    const inCategory = designations.filter(
      designation => designation.category === category
    )

    return distinctGroups(inCategory).flatMap(group => {
      const title = `${CATEGORY_PREFIX[category]} - ${titleCaseGroup(group)}`

      return inCategory
        .filter(designation => designation.group === group)
        .map(designation => toChoice(designation, title))
    })
  })
}

/**
 * Loads the designation catalogue and asks the user to pick one
 *
 * The options come from the API, so a designation added by an admin shows up
 * here without the CLI being rebuilt. The list is long enough that typing the
 * slug is usually quicker than counting rows, and `askChoice` accepts either.
 *
 * @returns {Promise<DesignationOption[] | null>} - The available designations, or null on failure
 */
async function loadDesignations(): Promise<DesignationOption[] | null> {
  const response = await apiClient.get('/api/designations')
  if (!response) return null

  const designations = response.data.designations as DesignationOption[]

  if (designations.length === 0) {
    error('no designations are configured, ask an admin to add one')
    return null
  }

  return designations
}

/**
 * Asks the user to pick one of the already loaded designations
 *
 * @param {Prompter} prompt - The shared prompt session
 * @param {DesignationOption[]} designations - Options fetched from the API
 * @returns {Promise<string | null>} - The chosen slug, or null if nothing matched
 */
async function pickDesignation(
  prompt: Prompter,
  designations: DesignationOption[]
): Promise<string | null> {
  heading('\nWhat describes you best?')
  const choice = await prompt.askChoice(
    'Enter a number or a slug:',
    toChoices(designations)
  )

  if (!choice) {
    error('that is not one of the options')
    return null
  }

  return choice
}

/**
 * Collects a password and its confirmation
 *
 * @param {Prompter} prompt - The shared prompt session
 * @returns {Promise<string | null>} - The password, or null when the two entries differ
 */
async function readNewPassword(prompt: Prompter): Promise<string | null> {
  const password = await prompt.askHidden(
    'Password (min 8 chars, letters and numbers): '
  )
  const confirmation = await prompt.askHidden('Confirm password: ')

  if (password !== confirmation) {
    error('the passwords did not match')
    return null
  }

  return password
}

/**
 * Registers a new account with a username, password and designation
 *
 * @return {Promise<void>}
 */
export async function handleRegister(username?: string): Promise<void> {
  if (isAuthenticated()) {
    error('you are already logged in, run `curlme logout` first')
    return
  }

  heading('Create your curlme account')

  // Fetch first: a wrong or unreachable server should fail before the user
  // has typed a username, a bio and a password twice.
  const designations = await loadDesignations()
  if (!designations) return

  const details = await withPrompter(async prompt => {
    const chosenUsername = username || (await prompt.ask('Username: '))
    if (!chosenUsername) {
      error('username is required')
      return null
    }

    const name = await prompt.ask('Display name: ')
    if (!name) {
      error('display name is required')
      return null
    }

    const bio = await prompt.ask('Bio (optional): ')

    const password = await readNewPassword(prompt)
    if (password === null) return null

    const designation = await pickDesignation(prompt, designations)
    if (!designation) return null

    // An empty bio is left out of the body entirely rather than sent as an
    // empty string, so the field simply stays unset on the account.
    return {
      username: chosenUsername,
      name,
      password,
      designation,
      ...(bio ? { bio } : {})
    }
  })

  if (!details) return

  const response = await apiClient.post('/api/register', details)

  if (!response) return

  saveToken(response.data.token)
  clearDeviceCode()

  const account = response.data.user
  success(`\nWelcome to curlme, @${account.username}!`)
  console.log(
    colorize(
      `Registered as ${account.designation?.label ?? 'no designation'}`,
      'grey'
    )
  )
}

/**
 * Signs in to an existing password backed account
 *
 * @return {Promise<void>}
 */
export async function handleSignin(username?: string): Promise<void> {
  if (isAuthenticated()) {
    success('You are already logged in!')
    return
  }

  const credentials = await withPrompter(async prompt => {
    const chosenUsername = username || (await prompt.ask('Username: '))
    if (!chosenUsername) {
      error('username is required')
      return null
    }

    const password = await prompt.askHidden('Password: ')
    if (!password) {
      error('password is required')
      return null
    }

    return { username: chosenUsername, password }
  })

  if (!credentials) return

  const response = await apiClient.post('/api/signin', credentials)

  if (!response) return

  saveToken(response.data.token)
  clearDeviceCode()
  success(`Signed in as @${response.data.user.username}`)
}
