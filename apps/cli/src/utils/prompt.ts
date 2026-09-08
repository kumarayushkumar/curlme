/**
 * Interactive prompts for the commands that collect credentials and choices
 */

import * as readline from 'readline'
import { colorize } from './output.js'

export type Choice = {
  key: string
  label: string
  group?: string
}

export type Prompter = {
  ask(question: string): Promise<string>
  askHidden(question: string): Promise<string>
  askChoice(question: string, choices: Choice[]): Promise<string | null>
}

/**
 * readline hides echoing behind this internal hook. Overriding it is the long
 * standing way to read a secret, and is stable across Node versions.
 */
type EchoControllable = readline.Interface & {
  _writeToOutput?: (value: string) => void
}

/**
 * Runs a sequence of prompts over a single readline interface.
 *
 * Two details make this work for piped input as well as a keyboard:
 *
 * - One interface for the whole flow. A fresh interface per question discards
 *   whatever the previous one had already buffered.
 * - Lines are queued as they arrive. readline emits every buffered line as soon
 *   as it has them, so with a pipe all the answers land before the second
 *   question is asked; `rl.question` would drop them on the floor.
 *
 * @param {(prompt: Prompter) => Promise<T>} run - The prompt sequence to run
 * @returns {Promise<T>} - Whatever the sequence returns
 */
export async function withPrompter<T>(
  run: (prompt: Prompter) => Promise<T>
): Promise<T> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY)
  }) as EchoControllable

  const buffered: string[] = []
  const waiting: Array<(line: string) => void> = []
  let ended = false

  rl.on('line', line => {
    const waiter = waiting.shift()

    if (waiter) waiter(line)
    else buffered.push(line)
  })

  rl.on('close', () => {
    ended = true
    // Release anyone still waiting so the flow can finish instead of hanging.
    waiting.splice(0).forEach(waiter => waiter(''))
  })

  /**
   * Resolves with the next line of input, queued or yet to arrive
   */
  const nextLine = (): Promise<string> => {
    const queued = buffered.shift()
    if (queued !== undefined) return Promise.resolve(queued)
    if (ended) return Promise.resolve('')

    return new Promise<string>(resolve => waiting.push(resolve))
  }

  const ask = async (question: string): Promise<string> => {
    process.stdout.write(question)

    return (await nextLine()).trim()
  }

  /**
   * Reads a secret without echoing it, the way `sudo` does. Showing nothing
   * beats showing asterisks, because readline reports every edit through the
   * same hook and a masked redraw ends up out of step with the real input.
   * The value is returned untrimmed, since spaces can be part of a password.
   */
  const askHidden = async (question: string): Promise<string> => {
    process.stdout.write(question)

    const restore = rl._writeToOutput
    rl._writeToOutput = () => {}

    try {
      return await nextLine()
    } finally {
      rl._writeToOutput = restore
      process.stdout.write('\n')
    }
  }

  /**
   * Prints a numbered list and accepts either the number or the entry's key
   */
  const askChoice = async (
    question: string,
    choices: Choice[]
  ): Promise<string | null> => {
    let lastGroup: string | undefined

    choices.forEach((choice, index) => {
      if (choice.group && choice.group !== lastGroup) {
        console.log(`\n${colorize(choice.group, 'yellow')}`)
        lastGroup = choice.group
      }

      const number = String(index + 1).padStart(2, ' ')
      console.log(
        `  ${colorize(number, 'highlight')}. ${choice.label} ${colorize(`(${choice.key})`, 'grey')}`
      )
    })

    const answer = await ask(`\n${question} `)

    const byNumber = Number.parseInt(answer, 10)
    if (
      !Number.isNaN(byNumber) &&
      byNumber >= 1 &&
      byNumber <= choices.length
    ) {
      return choices[byNumber - 1]!.key
    }

    const byKey = choices.find(choice => choice.key === answer.toLowerCase())

    return byKey ? byKey.key : null
  }

  try {
    return await run({ ask, askHidden, askChoice })
  } finally {
    rl.close()
  }
}
