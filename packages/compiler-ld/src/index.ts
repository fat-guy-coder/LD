import { parse as sfcParse, SFCDescriptor } from '@vue/compiler-sfc'

/**
 * @description Parses an `.ld` file's source code into a descriptor object.
 * This is the first step in the compilation process.
 * @param source - The source code of the `.ld` file.
 * @param id - A unique identifier for the file, used for scoping styles.
 * @returns An SFCDescriptor object containing the parsed blocks (template, script, styles).
 */
export function parse(source: string, id: string = 'anonymous'): SFCDescriptor {
  const { descriptor, errors } = sfcParse(source, {
    sourceMap: false, // We can enable this later if needed
    filename: `${id}.ld`,
  })

  if (errors.length) {
    // In a real compiler, we'd have more robust error handling
    throw new Error(`[LD Compiler] Failed to parse ${id}.ld:\n` + errors.join('\n'))
  }

  // We need to manually set `id` for scoped styles to work correctly later
  descriptor.id = id

  return descriptor
}
